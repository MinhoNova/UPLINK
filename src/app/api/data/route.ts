import { NextResponse } from 'next/server';
import { getKVPairs, setKV, getKV, initTables } from '@/lib/db';
import { pruneTerminalLobbies } from '@/lib/lobbyCleanup';
import { pruneExpiredTickets } from '@/lib/tickets';
import { migrateLobbies, LOBBY_DATA_VERSION } from '@/lib/lobbyLifecycle';
import { stripAdminFromBanList, sanitizeBannedIdRecords, validateDataWrites } from '@/lib/secureDataWrite';
import { applyCharacterSnapshots } from '@/lib/memberCharacter';
import { filterDataForUser } from '@/lib/dataAccess';
import { publicDataView } from '@/lib/publicDataView';
import { requireSession } from '@/lib/authz';
import { logAudit } from '@/lib/auditLog';
import { isUserBanned, bannedResponse, getBanInfo } from '@/lib/banCheck';
import { recordPaymentFraudAttempt } from '@/lib/paymentFraud';
import { rejectIfIpBannedUnlessAdmin } from '@/lib/ipBan';
import { getClientIp } from '@/lib/requestIp';
import { touchUserLastIp } from '@/lib/userLastIp';
import { applyRankAwards, awardedLobbyIds, RANK_AWARD_LEDGER_KEY } from '@/lib/rankAwards';
import {
  recordOwnRosterProofs,
  pruneRosterProof,
  rosterProofFrom,
  rosterProofTo,
  ROSTER_PROOF_KEY,
  ROSTER_PROOF_CUTOVER_KEY,
} from '@/lib/rankRosterProof';
import { recordMarketCompletion, getMarketAverageByService } from '@/lib/marketPrice';
import { getPublicDataCached, setPublicDataCached, FULL_DATA_CACHE_KEY } from '@/lib/cloudflareBindings';
import { rateLimitByIp, rateLimitByUser } from '@/lib/rateLimit';
import { rateLimitResponse } from '@/lib/rateLimitHttp';

/* Cache disabled — was causing stale data to be served to users */

export async function GET(req: Request) {
  try {
    const auth = await requireSession(req);
    if (!auth.ok) {
      // Public read for homepage display.
      //
      // The cache hit below is cheap, but the miss is not: it parses the whole
      // `kv_store` blob and, when the lobbies row is empty, runs a second
      // unfiltered `SELECT`. That is the most expensive thing this route does,
      // and the per-user and per-IP ceilings further down only cover signed-in
      // readers — an anonymous caller returning here never reached them. Bound
      // the public path on its own budget, sized for the homepage's own polling
      // and not for a real client's 2s poll.
      const publicRl = await rateLimitByIp(getClientIp(req), "/api/data:public", 60, 60_000);
      if (!publicRl.ok) return rateLimitResponse(publicRl);

      const cached = await getPublicDataCached(FULL_DATA_CACHE_KEY);
      if (cached) {
        return NextResponse.json(cached, {
          headers: { "Cache-Control": "no-store, max-age=0" },
        });
      }

      await initTables();
      const data = await getKVPairs();
      // Fallback: if lobbies empty, query D1 directly
      if (!Array.isArray(data.lobbies) || data.lobbies.length === 0) {
        try {
          const { getCloudflareContext } = await import("@opennextjs/cloudflare");
          let env;
          try { ({ env } = getCloudflareContext()); } catch { ({ env } = await getCloudflareContext({ async: true })); }
          const d1 = (env as any)?.DB as D1Database | undefined;
          if (d1) {
            const { results } = await d1.prepare("SELECT key, value FROM kv_store").all<{ key: string; value: string }>();
            if (results) {
              for (const row of results) {
                try { (data as any)[row.key] = JSON.parse(row.value); } catch {}
              }
            }
          }
        } catch {}
      }
      // Anonymous homepage read: the offer itself is public, its chat is not.
      // Allowlisted keys only — `kv_store` also holds directMessages, tickets,
      // auditLogs and user roles, none of which may reach a visitor.
      const publicView = publicDataView(data);
      await setPublicDataCached(FULL_DATA_CACHE_KEY, publicView);
      return NextResponse.json(publicView, {
        headers: { "Cache-Control": "no-store, max-age=0" },
      });
    }

    const ipBlock = await rejectIfIpBannedUnlessAdmin(req, auth.user.id, auth.user.username);
    if (ipBlock) return ipBlock;

    // This is the site's heaviest read: it parses and rewrites the whole
    // `kv_store` blob (every lobby, message, offer and user row) and the client
    // polls it every 2s while a tab is visible. That is a normal 30 requests a
    // minute per player, so the ceilings below are roughly double what a real
    // client needs — the point is to cap the script that opens a hundred tabs,
    // not to slow anybody down.
    //
    // Per-user as well as per-IP: an IP limit alone lets one account rotate
    // through addresses, and a shared address (a school, a café, a carrier NAT)
    // can put several dozen players behind one bucket, so the per-IP ceiling is
    // generous and the per-user one is the one that actually bounds the work.
    const dataRl = await rateLimitByUser(auth.user.id, "data-read", 90, 60_000);
    if (!dataRl.ok) return rateLimitResponse(dataRl);

    const dataIpRl = await rateLimitByIp(getClientIp(req), "/api/data", 240, 60_000);
    if (!dataIpRl.ok) return rateLimitResponse(dataIpRl);

    // Keep the site account glued to the Discord account. Runs before the read
    // so a missing account row (first login whose callback write failed) is
    // already here in the snapshot we scope and return.
    //
    // Id-only on purpose: this route runs on a poll and the session cookie can
    // be a login behind, so its `username` must never overwrite the handle
    // stored on the account row.
    let myHandle = auth.user.username;
    try {
      const { repairIdentity } = await import("@/lib/identitySync");
      const identity = await repairIdentity(auth.user.id);
      if (identity.me?.username) myHandle = String(identity.me.username);
    } catch (error) {
      console.error("[data] identity repair failed:", error);
    }

    // Ban checks run after the repair so a ban recorded under an older Discord
    // handle still matches.
    if (await isUserBanned(myHandle, auth.user.id)) {
      const info = await getBanInfo(myHandle, auth.user.id);
      return bannedResponse(info?.reason);
    }

    await initTables();
    const data = await getKVPairs();

    if (Array.isArray(data.bannedUsers)) {
      const cleaned = stripAdminFromBanList(data.bannedUsers as string[]);
      if (cleaned.length !== (data.bannedUsers as string[]).length) {
        data.bannedUsers = cleaned;
        await setKV("bannedUsers", cleaned);
      }
    }
    if (Array.isArray(data.bannedUserIds)) {
      const cleaned = sanitizeBannedIdRecords(data.bannedUserIds as unknown[]);
      if (cleaned.length !== (data.bannedUserIds as unknown[]).length) {
        data.bannedUserIds = cleaned;
        await setKV("bannedUserIds", cleaned);
      }
    }
    if (Array.isArray(data.lobbies)) {
      const { lobbies, removed } = pruneTerminalLobbies(data.lobbies);
      if (removed > 0) {
        data.lobbies = lobbies;
        await setKV('lobbies', lobbies);
      }
      const { lobbies: migrated, changed: migratedChanged } = migrateLobbies(
        data.lobbies,
        data.lobbyDataVersion || 0
      );
      if (migratedChanged) {
        data.lobbies = migrated;
        data.lobbyDataVersion = LOBBY_DATA_VERSION;
        await setKV('lobbies', migrated);
        await setKV('lobbyDataVersion', LOBBY_DATA_VERSION);
      }
    }

    if (Array.isArray(data.tickets)) {
      const { tickets, removed } = pruneExpiredTickets(data.tickets);
      if (removed > 0) {
        data.tickets = tickets;
        await setKV('tickets', tickets);
      }
    }

    if (Array.isArray(data.lobbies)) {
      // Overlay each squad member's verified game character (portrait, ilevel,
      // class, server) on the way out, so a thread card always reflects the
      // player's latest re-verification instead of whatever was stored when they
      // joined. Purely additive, and it is not persisted here — the POST path
      // applies the same overlay so the two agree.
      data.lobbies = applyCharacterSnapshots(data.lobbies, data.characters);
    }

    const scoped = filterDataForUser(data, auth.user.id, myHandle);
    // The client addresses itself by the canonical handle, not the one baked
    // into the session cookie at sign-in.
    scoped.me = { id: auth.user.id, username: myHandle };
    // …and it must not have to re-derive its own admin status from the session
    // cookie, which knows none of the `userRoles` promotions. The mission
    // thread gates on this key, so a mismatch here shows an authorised admin a
    // red "Access Denied" on a page the server just served them.
    scoped.admin = auth.user.role === "admin";
    scoped.marketPrices = getMarketAverageByService(data.marketHistory);
    const body = JSON.stringify(scoped);
    touchUserLastIp(auth.user.id, getClientIp(req)).catch(() => {});
    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/json",
        // This body is scoped to one account. Without an explicit no-store the
        // edge stores the first signed-in user's response and hands the same
        // private data to everyone after them — their threads stop resolving
        // and admins see another account's view of the site.
        "Cache-Control": "private, no-store, max-age=0",
        Vary: "Cookie",
      },
    });
  } catch (error) {
    console.error("Error reading from D1:", error);
    return NextResponse.json(
      { lobbies: [], goldOffers: [], notifications: [], registeredUsers: [], characters: [], applications: [], bannedUsers: [], bannedUserIds: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const ipBlock = await rejectIfIpBannedUnlessAdmin(req, auth.user.id, auth.user.username);
    if (ipBlock) return ipBlock;

    if (await isUserBanned(auth.user.username, auth.user.id)) {
      const info = await getBanInfo(auth.user.username, auth.user.id);
      return bannedResponse(info?.reason);
    }

    const clientIp = getClientIp(req);
    touchUserLastIp(auth.user.id, clientIp).catch(() => {});

    // A write here is a full-blob upsert plus validation, so it is the most
    // expensive thing on the site. Real saves are user actions — one per click,
    // not a poll — so this ceiling is far above normal use and only bites a
    // replay loop. The account is throttled as well as the address, because the
    // same forged request can be re-sent from a fresh IP.
    const writeRl = await rateLimitByUser(auth.user.id, "data-write", 60, 60_000);
    if (!writeRl.ok) return rateLimitResponse(writeRl);

    const writeIpRl = await rateLimitByIp(clientIp, "/api/data#write", 120, 60_000);
    if (!writeIpRl.ok) return rateLimitResponse(writeIpRl);

    await initTables();
    const raw: any = await req.json();
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    const newData = raw as Record<string, unknown>;

    const existing = await getKVPairs();
    const validation = await validateDataWrites(newData, existing, auth.user.id, auth.user.username);
    if (!validation.ok) {
      if (validation.fraudAttempt) {
        // Refused write: warn first, suspend on a pattern, audit every attempt.
        const attempt = await recordPaymentFraudAttempt(
          { id: auth.user.id, username: auth.user.username },
          validation.fraudAttempt.lobbyId
        ).catch(() => null);
        return NextResponse.json(
          {
            error:
              (attempt?.banned
                ? "Payment rejected and this account is now suspended. Contact support if you believe this is a mistake."
                : attempt
                  ? `${validation.error} (attempt ${attempt.strikes} of ${attempt.limit} — an account suspended after ${attempt.limit})`
                  : validation.error) || "Payment rejected.",
            suspended: !!attempt?.banned,
            attempt: attempt?.strikes ?? null,
          },
          { status: 403 }
        );
      }
      return NextResponse.json({ error: validation.error }, { status: 403 });
    }

    let sanitized = validation.sanitized;

    if (
      Array.isArray(sanitized.lobbies) &&
      Array.isArray(existing.lobbies) &&
      Array.isArray(existing.registeredUsers)
    ) {
      const existingLobbies = existing.lobbies as any[];
      const incomingLobbies = sanitized.lobbies as any[];

      // Who really joined each offer, kept in server storage the client never
      // writes. Stamped from the caller's own session — they applied, or they
      // accepted an invite — so an owner cannot assemble a roster of strangers
      // and mint rank for them. Recorded before the award is computed, from the
      // validated rows rather than the raw request.
      let proofCutover = Number((await getKV(ROSTER_PROOF_CUTOVER_KEY)) || 0);
      if (!proofCutover) {
        proofCutover = Date.now();
        await setKV(ROSTER_PROOF_CUTOVER_KEY, proofCutover);
      }
      const rosterProof = rosterProofFrom(await getKV(ROSTER_PROOF_KEY));
      const proofAdded = recordOwnRosterProofs(rosterProof, existingLobbies, incomingLobbies, auth.user.id);

      // The award ledger is server storage. Reading it here is what makes an
      // award un-replayable: the `rankAwardedBooster` field on the lobby is
      // caller-supplied and can be cleared at will, but the lobby's id in this
      // list cannot be touched from a request.
      const ledger = awardedLobbyIds(await getKV(RANK_AWARD_LEDGER_KEY));
      const outcome = applyRankAwards(
        existingLobbies,
        incomingLobbies,
        existing.registeredUsers as any[],
        auth.user.id,
        ledger,
        rosterProof,
        proofCutover
      );

      // Pruning runs after the award, never before: this write is the one that
      // settles the offer, so its proof has to still be on hand here. Pruning
      // first would delete the evidence for the very payout being computed and
      // silently pay the owner alone.
      const proofPruned = pruneRosterProof(rosterProof, incomingLobbies);
      if (proofAdded || proofPruned) await setKV(ROSTER_PROOF_KEY, rosterProofTo(rosterProof));
      if (outcome.awarded.boosterRuns > 0 || outcome.awarded.posterPosts > 0) {
        // Any lobby that paid out in this write joins the ledger, whatever the
        // request claimed its marker was.
        for (const l of outcome.lobbies as any[]) {
          if (l?.id != null && l?.rankAwardedBooster) ledger.add(String(l.id));
        }
        await setKV(RANK_AWARD_LEDGER_KEY, Array.from(ledger));
      }

      if (Array.isArray(sanitized.registeredUsers)) {
        const awardedMap = new Map(outcome.users.map((u: any) => [String(u.id), u]));
        (sanitized.registeredUsers as any[]).forEach((clientUser: any, idx: number) => {
          const awarded = awardedMap.get(String(clientUser.id));
          if (awarded) {
            (sanitized.registeredUsers as any[])[idx] = {
              ...awarded,
              ...clientUser,
              stats: awarded.stats,
            };
          }
        });
      } else {
        sanitized = { ...sanitized, registeredUsers: outcome.users };
      }
      sanitized = { ...sanitized, lobbies: outcome.lobbies };
    }

    if (Array.isArray(sanitized.lobbies) && Array.isArray(existing.lobbies)) {
      const prevById = new Map((existing.lobbies as any[]).map((l: any) => [String(l.id), l]));
      for (const n of sanitized.lobbies as any[]) {
        const p = prevById.get(String(n.id));
        if (
          n &&
          n.payoutStatus === "paid" &&
          (!p || p.payoutStatus !== "paid") &&
          n.serviceName &&
          Number(n.pricePerRun) > 0
        ) {
          await recordMarketCompletion(n.serviceName, Number(n.pricePerRun));
        }
      }
    }

    for (const [key, value] of Object.entries(sanitized)) {
      let toWrite = value;
      if (key === "tickets" && Array.isArray(value)) {
        toWrite = pruneExpiredTickets(value).tickets;
      }
      if (key === "lobbies" && Array.isArray(value)) {
        // Persist the in-game portrait / ilevel onto squad rows that predate the
        // snapshot, so an existing thread carries the same data as a new one and
        // survives the read path's own overlay.
        toWrite = applyCharacterSnapshots(value, existing.characters);
      }
      await setKV(key, toWrite);
      if (key === "bannedUsers" || key === "bannedUserIds") {
        await logAudit({
          action: "admin.bannedUsers",
          userId: auth.user.id,
          handle: auth.user.username,
          meta: {
            count: Array.isArray(value) ? value.length : 0,
            ...(clientIp !== "unknown" ? { ip: clientIp } : {}),
          },
        });
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error writing to D1:", error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}
