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
import { refFor } from "@/lib/playerIdentity";

export const ONLINE_WINDOW_MS = 10 * 60_000;

export function isUserOnline(user: { lastSeenAt?: number } | null | undefined, now = Date.now()): boolean {
  return Boolean(user?.lastSeenAt && typeof user.lastSeenAt === "number" && now - user.lastSeenAt <= ONLINE_WINDOW_MS);
}

const OTHER_USER_STRIP = ["blocked", "friendRequests", "email", "lastKnownIp", "lastSeenAt"] as const;

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
