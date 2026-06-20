import { NextResponse } from 'next/server';
import { getKVPairs, setKV, initTables } from '@/lib/db';
import { pruneTerminalLobbies } from '@/lib/lobbyCleanup';
import { pruneExpiredTickets } from '@/lib/tickets';
import { migrateLobbies, LOBBY_DATA_VERSION } from '@/lib/lobbyLifecycle';
import { isAdminUser, stripAdminFromBanList, validateDataWrites } from '@/lib/secureDataWrite';
import { filterDataForUser } from '@/lib/dataAccess';
import { requireSession, requireOptionalSession } from '@/lib/authz';
import { logAudit } from '@/lib/auditLog';
import { isUserBanned, bannedResponse } from '@/lib/banCheck';
import { rejectIfIpBannedUnlessAdmin } from '@/lib/ipBan';
import { getClientIp } from '@/lib/requestIp';
import { touchUserLastIp } from '@/lib/userLastIp';

export async function GET(req: Request) {
  try {
    const auth = await requireOptionalSession(req);
    const isLoggedIn = auth.ok && auth.user;
    const userId = isLoggedIn ? auth.user!.id : "guest";
    const handle = isLoggedIn ? auth.user!.username : "";

    if (isLoggedIn) {
      const ipBlock = await rejectIfIpBannedUnlessAdmin(req, userId, handle);
      if (ipBlock) return ipBlock;

      if (await isUserBanned(handle, userId)) {
        return bannedResponse();
      }
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

    const scoped = filterDataForUser(data, userId, handle);
    if (isLoggedIn) {
      touchUserLastIp(userId, getClientIp(req)).catch(() => {});
    }
    return NextResponse.json(scoped);
  } catch (error) {
    console.error("Error reading from D1:", error);
    return NextResponse.json(
      { lobbies: [], goldOffers: [], notifications: [], registeredUsers: [], characters: [], applications: [], bannedUsers: [] },
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
      return bannedResponse();
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

    for (const [key, value] of Object.entries(validation.sanitized)) {
      let toWrite = value;
      if (key === "tickets" && Array.isArray(value)) {
        toWrite = pruneExpiredTickets(value).tickets;
      }
      await setKV(key, toWrite);
      if (key === "bannedUsers") {
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
