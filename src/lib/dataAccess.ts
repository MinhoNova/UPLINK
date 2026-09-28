import { isAdminUser } from "@/lib/secureDataWrite";
import {
  computeDeliveredReceiptsFrom,
  computeReadReceiptsFrom,
  withDmIdentities,
  withReceiptIdentities,
  type ReceiptMap,
} from "@/lib/dmHelpers";
import { isFromUser, isToUser } from "@/lib/dmHelpers";
import { notificationMatchesUser } from "@/lib/userProfile";
import { refFor, playerAliases } from "@/lib/playerIdentity";
import { userCanViewOfferThread } from "@/lib/lobbyLifecycle";

export const ONLINE_WINDOW_MS = 10 * 60_000;

export function isUserOnline(user: { lastSeenAt?: number } | null | undefined, now = Date.now()): boolean {
  return Boolean(user?.lastSeenAt && typeof user.lastSeenAt === "number" && now - user.lastSeenAt <= ONLINE_WINDOW_MS);
}

const OTHER_USER_STRIP = ["blocked", "friendRequests", "email", "lastKnownIp", "lastSeenAt"] as const;

/**
 * A lobby's chat lives inline on the lobby record and is copied onto every
 * sibling in the offer family, and pasted images ride along as base64 inside
 * those message objects. That makes `messages` by far the heaviest part of a
 * lobby and the only genuinely private part of it: the offer itself is public
 * by design (that is the public feed), but the conversation between the poster
 * and the squad is not.
 *
 * These helpers keep the payload honest — a count survives so the UI can still
 * render "12 messages", the bodies never leave the server for someone who is
 * not on the thread.
 */
function withoutMessages(lobby: Record<string, unknown>): Record<string, unknown> {
  if (!Array.isArray(lobby.messages)) return lobby;
  const { messages, ...rest } = lobby;
  return { ...rest, messageCount: messages.length };
}

export function stripLobbyMessages(lobbies: unknown): unknown {
  if (!Array.isArray(lobbies)) return lobbies;
  return lobbies.map((l) => (l && typeof l === "object" ? withoutMessages(l as Record<string, unknown>) : l));
}

/** Keep chat only on the threads this viewer may actually open. */
export function scopeLobbyMessages(
  lobbies: unknown,
  userId: string,
  handle: string,
  aliases?: string[]
): unknown {
  if (!Array.isArray(lobbies)) return lobbies;
  return lobbies.map((lobby) => {
    if (!lobby || typeof lobby !== "object") return lobby;
    if (userCanViewOfferThread(lobby, userId, handle, aliases)) return lobby;
    return withoutMessages(lobby as Record<string, unknown>);
  });
}

export function filterDataForUser(
  data: Record<string, unknown>,
  userId: string,
  handle: string
): Record<string, unknown> {
  const me = refFor(userId, handle);
  const users = (data.registeredUsers as any[]) || [];
  const filtered: Record<string, unknown> = { ...data };

  // DMs and receipts are resolved onto stable ids first, so a Discord rename
  // never orphans a thread or an unread badge. Done for every viewer.
  if (data.directMessages !== undefined) {
    const messages = withDmIdentities(data.directMessages, users);
    filtered.directMessages = messages.filter((m) => isFromUser(m, me) || isToUser(m, me));
  }

  if (data.readMessages && typeof data.readMessages === "object") {
    const receipts = withReceiptIdentities(data.readMessages, users) as ReceiptMap;
    filtered.readMessages = userId in receipts ? { [userId]: receipts[userId] } : {};
    filtered.readReceiptsFrom = computeReadReceiptsFrom(receipts, me);
  }

  if (data.deliveredMessages && typeof data.deliveredMessages === "object") {
    const receipts = withReceiptIdentities(data.deliveredMessages, users) as ReceiptMap;
    filtered.deliveredReceiptsFrom = computeDeliveredReceiptsFrom(receipts, me);
  }
  delete filtered.deliveredMessages;

  if (Array.isArray(filtered.lobbies)) {
    // Resolve aliases from the canonical account row, not the session cookie:
    // `ownerDiscordName` is a snapshot from post time, so a rename must still
    // recognise the owner of their own thread.
    const meRow = users.find((u: any) => String(u.id) === String(userId));
    const aliases = meRow ? playerAliases(meRow as any) : [];
    filtered.lobbies = isAdminUser(userId, handle)
      ? filtered.lobbies
      : scopeLobbyMessages(filtered.lobbies, userId, handle, aliases);
  }

  if (isAdminUser(userId, handle)) return filtered;

  delete filtered.bannedUsers;
  delete filtered.bannedUserIds;
  delete filtered.bannedIps;
  delete filtered.applications;

  if (Array.isArray(filtered.friends)) {
    filtered.friends = (filtered.friends as { requester?: string; target?: string }[]).filter(
      (f) => String(f.requester) === String(userId) || String(f.target) === String(userId)
    );
  }

  if (Array.isArray(filtered.tickets)) {
    filtered.tickets = (filtered.tickets as { userId?: string }[]).filter(
      (t) => String(t.userId) === String(userId)
    );
  }

  if (Array.isArray(filtered.notifications)) {
    filtered.notifications = (filtered.notifications as any[]).filter((n) =>
      notificationMatchesUser(n, userId, handle, users)
    );
  }

  if (Array.isArray(filtered.registeredUsers)) {
    filtered.registeredUsers = (filtered.registeredUsers as Record<string, unknown>[]).map((u) => {
      if (String(u.id) === String(userId)) return u;
      const safe = { ...u };
      const online = isUserOnline(u);
      delete safe["lastSeenAt"];
      safe.online = online;
      for (const field of OTHER_USER_STRIP) delete safe[field];
      if (safe.subscription && typeof safe.subscription === "object") {
        const sub = safe.subscription as { tier?: string };
        safe.subscription = { tier: sub.tier || "free" };
      }
      return safe;
    });
  }

  return filtered;
}
