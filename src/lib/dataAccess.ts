import { isAdminUser } from "@/lib/secureDataWrite";
import { computeDeliveredReceiptsFrom, computeReadReceiptsFrom } from "@/lib/dmHelpers";
import { notificationMatchesUser } from "@/lib/userProfile";

const OTHER_USER_STRIP = ["blocked", "friendRequests", "email"] as const;

export function filterDataForUser(
  data: Record<string, unknown>,
  userId: string,
  handle: string
): Record<string, unknown> {
  if (isAdminUser(userId, handle)) return data;

  const filtered: Record<string, unknown> = { ...data };

  delete filtered.bannedUsers;
  delete filtered.bannedIps;
  delete filtered.applications;

  if (Array.isArray(filtered.friends)) {
    filtered.friends = (filtered.friends as { requester?: string; target?: string }[]).filter(
      (f) => f.requester === userId || f.target === userId
    );
  }

  if (Array.isArray(filtered.directMessages)) {
    filtered.directMessages = (filtered.directMessages as { from?: string; to?: string }[]).filter(
      (m) => m.from === handle || m.to === handle
    );
  }

  if (filtered.readMessages && typeof filtered.readMessages === "object") {
    const all = data.readMessages as Record<string, Record<string, unknown>>;
    filtered.readMessages = handle in all ? { [handle]: all[handle] } : {};
    filtered.readReceiptsFrom = computeReadReceiptsFrom(
      data.readMessages as Record<string, Record<string, (string | number)[]>>,
      handle
    );
  }

  if (data.deliveredMessages && typeof data.deliveredMessages === "object") {
    filtered.deliveredReceiptsFrom = computeDeliveredReceiptsFrom(
      data.deliveredMessages as Record<string, Record<string, (string | number)[]>>,
      handle
    );
  }
  delete filtered.deliveredMessages;

  if (Array.isArray(filtered.tickets)) {
    filtered.tickets = (filtered.tickets as { userId?: string }[]).filter(
      (t) => String(t.userId) === String(userId)
    );
  }

  if (Array.isArray(filtered.notifications)) {
    const users = (filtered.registeredUsers as any[]) || (data.registeredUsers as any[]) || [];
    filtered.notifications = (filtered.notifications as any[]).filter((n) =>
      notificationMatchesUser(n, userId, handle, users)
    );
  }

  if (Array.isArray(filtered.registeredUsers)) {
    filtered.registeredUsers = (filtered.registeredUsers as Record<string, unknown>[]).map((u) => {
      if (String(u.id) === String(userId)) return u;
      const safe = { ...u };
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
