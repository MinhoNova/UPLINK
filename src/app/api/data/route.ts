import { NextResponse } from 'next/server';
import { getKVPairs, setKV, initTables } from '@/lib/db';
import { pruneTerminalLobbies } from '@/lib/lobbyCleanup';
import { pruneExpiredTickets } from '@/lib/tickets';
import { migrateLobbies, LOBBY_DATA_VERSION } from '@/lib/lobbyLifecycle';
import { stripAdminFromBanList, sanitizeBannedIdRecords, validateDataWrites } from '@/lib/secureDataWrite';
import { filterDataForUser } from '@/lib/dataAccess';
import { publicDataView } from '@/lib/publicDataView';
import { requireSession } from '@/lib/authz';
import { logAudit } from '@/lib/auditLog';
import { isUserBanned, bannedResponse, getBanInfo, addUserBan } from '@/lib/banCheck';
import { rejectIfIpBannedUnlessAdmin } from '@/lib/ipBan';
import { getClientIp } from '@/lib/requestIp';
import { touchUserLastIp } from '@/lib/userLastIp';
import { applyRankAwards } from '@/lib/rankAwards';
import { recordMarketCompletion, getMarketAverageByService } from '@/lib/marketPrice';
import { getPublicDataCached, setPublicDataCached, FULL_DATA_CACHE_KEY } from '@/lib/cloudflareBindings';

/* Cache disabled — was causing stale data to be served to users */

export async function GET(req: Request) {
  try {
    const auth = await requireSession(req);
    if (!auth.ok) {
      // Public read for homepage display
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
        await addUserBan({
          id: auth.user.id,
          handle: auth.user.username,
          reason: "payment_fraud: attempted to mark a mission paid without another confirmed player",
        }).catch(() => {});
        await logAudit({
          action: "system.paymentFraud",
          userId: auth.user.id,
          handle: auth.user.username,
          meta: { lobbyId: validation.fraudAttempt.lobbyId, reason: "permanent ban" },
        }).catch(() => {});
        return NextResponse.json(
          { error: validation.error, suspended: true },
          { status: 403 }
        );
      }
      return NextResponse.json({ error: validation.error }, { status: 403 });
    }

    let sanitized = validation.sanitized;

    if (Array.isArray(sanitized.lobbies) && Array.isArray(existing.registeredUsers)) {
      const outcome = applyRankAwards(
        (existing.lobbies as any[]) || [],
        sanitized.lobbies as any[],
        existing.registeredUsers as any[],
        auth.user.id
      );
      if (outcome.awarded.boosterRuns > 0 || outcome.awarded.posterPosts > 0) {
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
