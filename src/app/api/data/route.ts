import { NextResponse } from 'next/server';
import { getKVPairs, setKV, initTables } from '@/lib/db';
import { pruneTerminalLobbies } from '@/lib/lobbyCleanup';
import { pruneExpiredTickets } from '@/lib/tickets';
import { migrateLobbies, LOBBY_DATA_VERSION } from '@/lib/lobbyLifecycle';
import { isAdminUser, stripAdminFromBanList, sanitizeBannedIdRecords, validateDataWrites } from '@/lib/secureDataWrite';
import { filterDataForUser } from '@/lib/dataAccess';
import { requireSession } from '@/lib/authz';
import { logAudit } from '@/lib/auditLog';
import { isUserBanned, bannedResponse, getBanInfo } from '@/lib/banCheck';
import { rejectIfIpBannedUnlessAdmin } from '@/lib/ipBan';
import { getClientIp } from '@/lib/requestIp';
import { touchUserLastIp } from '@/lib/userLastIp';
import { applyRankAwards } from '@/lib/rankAwards';

/* Short in-process cache so the 8s homepage/thread polls don't re-read D1 + re-serialize on every tick. */
const DATA_CACHE_TTL_MS = 2000;
const dataCache = new Map<string, { at: number; body: string }>();

function pruneCache() {
  if (dataCache.size < 64) return;
  const now = Date.now();
  for (const [k, v] of dataCache) {
    if (now - v.at > DATA_CACHE_TTL_MS) dataCache.delete(k);
  }
}

export async function GET(req: Request) {
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

    const cacheKey = `data:${auth.user.id}`;
    const cached = dataCache.get(cacheKey);
    if (cached && Date.now() - cached.at < DATA_CACHE_TTL_MS) {
      return new NextResponse(cached.body, {
        headers: { "Content-Type": "application/json", "X-Data-Cache": "hit" },
      });
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
    const body = JSON.stringify(scoped);
    dataCache.set(cacheKey, { at: Date.now(), body });
    pruneCache();
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
    const newData = await req.json();
    if (!newData || typeof newData !== 'object' || Array.isArray(newData)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const existing = await getKVPairs();
    const validation = await validateDataWrites(newData, existing, auth.user.id, auth.user.username);
    if (!validation.ok) {
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
    dataCache.clear();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error writing to D1:", error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}
