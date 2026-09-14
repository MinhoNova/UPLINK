import { NextResponse } from 'next/server';
import { getKVPairs, setKV, initTables } from '@/lib/db';
import { pruneTerminalLobbies } from '@/lib/lobbyCleanup';
import { pruneExpiredTickets } from '@/lib/tickets';
import { migrateLobbies, LOBBY_DATA_VERSION } from '@/lib/lobbyLifecycle';
import { isAdminUser, stripAdminFromBanList, sanitizeBannedIdRecords, validateDataWrites } from '@/lib/secureDataWrite';
import { filterDataForUser } from '@/lib/dataAccess';
import { requireSession } from '@/lib/authz';
import { logAudit } from '@/lib/auditLog';
import { isUserBanned, bannedResponse, getBanInfo, addUserBan } from '@/lib/banCheck';
import { rejectIfIpBannedUnlessAdmin } from '@/lib/ipBan';
import { getClientIp } from '@/lib/requestIp';
import { touchUserLastIp } from '@/lib/userLastIp';
import { applyRankAwards } from '@/lib/rankAwards';
import { recordMarketCompletion, getMarketAverageByService } from '@/lib/marketPrice';
import { DEFAULT_PROFILE_BANNER } from '@/lib/profileImage';

/* Cache disabled — was causing stale data to be served to users */

export async function GET(req: Request) {
  try {
    const auth = await requireSession(req);
    if (!auth.ok) {
      // Public read for homepage display
      await initTables();
      const data = await getKVPairs();
      // Fallback: if lobbies empty, query D1 directly
      if (!Array.isArray(data.lobbies) || data.lobbies.length === 0) {
        try {
          const { getCloudflareContext } = await import("@opennextjs/cloudflare");
          let env;
          try { ({ env } = getCloudflareContext()); } catch { ({ env } = await getCloudflareContext({ async: true })); }
          const d1 = (env as any)?.DB;
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
      return NextResponse.json(data, {
        headers: { "Cache-Control": "no-store, max-age=0" },
      });
    }

    const ipBlock = await rejectIfIpBannedUnlessAdmin(req, auth.user.id, auth.user.username);
    if (ipBlock) return ipBlock;

    if (await isUserBanned(auth.user.username, auth.user.id)) {
      const info = await getBanInfo(auth.user.username, auth.user.id);
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

    const scoped = filterDataForUser(data, auth.user.id, auth.user.username);
    // Server-side fallback: if the user logged in but the JWT callback's
    // auto-registration silently failed (D1 unavailable at callback time),
    // register them here so they appear in the admin dashboard.
    if (scoped.registeredUsers && Array.isArray(scoped.registeredUsers)) {
      const existing = scoped.registeredUsers.find((u: any) => String(u.id) === String(auth.user.id));
      if (!existing) {
        const siteDefaultBanner = ((await getKV("siteDefaultBanner")) as string) || DEFAULT_PROFILE_BANNER;
        const freshUser = {
          id: auth.user.id,
          username: auth.user.username,
          name: auth.user.name ?? null,
          avatar: auth.user.image ?? null,
          banner: siteDefaultBanner,
          lastSeenAt: Date.now(),
          lastKnownIp: null,
          stats: { total: 0, k5: 0, k10: 0, k15: 0, k20: 0 },
          subscription: { tier: "free" },
        };
        scoped.registeredUsers.push(freshUser);
        // Persist back to KV so future requests see them.
        const allUsers = (data.registeredUsers as any[]) || [];
        if (!allUsers.some((u: any) => String(u.id) === String(auth.user.id))) {
          allUsers.push(freshUser);
          setKV("registeredUsers", allUsers).catch(() => {});
        }
      }
    }
    scoped.marketPrices = getMarketAverageByService(data.marketHistory);
    const body = JSON.stringify(scoped);
    touchUserLastIp(auth.user.id, getClientIp(req)).catch(() => {});
    return new NextResponse(body, {
      headers: { "Content-Type": "application/json" },
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
    const raw = await req.json();
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
