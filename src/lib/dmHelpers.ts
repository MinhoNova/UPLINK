export const DM_REACTION_EMOJIS = ["🔥", "💀", "😂", "🥶", "🦅", "😭", "🗿", "❤️"] as const;

export type DmMessage = {
  from: string;
  to: string;
  text: string;
  timestamp: number;
  edited?: boolean;
  image?: string;
  reactions?: Record<string, string>;
};

export function getDmMsgKey(msg: Pick<DmMessage, "timestamp" | "from" | "to" | "text">) {
  return String(msg.timestamp || `${msg.from}-${msg.to}-${msg.text}`);
}

/** readMessages may store numeric or string ids — compare as strings. */
export function isDmMessageRead(
  msg: Pick<DmMessage, "timestamp" | "from" | "to" | "text">,
  readIds: Array<string | number> | undefined
) {
  if (!readIds?.length) return false;
  const key = getDmMsgKey(msg);
  return readIds.some((id) => String(id) === key);
}

export function computeDmUnreadCounts(
  directMessages: DmMessage[],
  readMessages: Record<string, Record<string, (string | number)[]>> | undefined,
  currentHandle: string
): Record<string, number> {
  if (!currentHandle) return {};
  const counts: Record<string, number> = {};
  for (const m of directMessages) {
    if (m.to !== currentHandle || !m.from || m.from === currentHandle) continue;
    const readIds = readMessages?.[currentHandle]?.[m.from] || [];
    if (!isDmMessageRead(m, readIds)) {
      counts[m.from] = (counts[m.from] || 0) + 1;
    }
  }
  return counts;
}

export function totalDmUnreadCount(
  counts: Record<string, number>,
  options?: { muted?: string[]; friendUsernames?: Set<string> }
): number {
  let total = 0;
  for (const [username, n] of Object.entries(counts)) {
    if (options?.muted?.includes(username)) continue;
    if (options?.friendUsernames && !options.friendUsernames.has(username)) continue;
    total += n;
  }
  return total;
}

/** Every handle the user has exchanged DMs with (exact username from messages). */
export function getDmConversationPeernames(
  directMessages: DmMessage[],
  currentHandle: string
): Set<string> {
  const peers = new Set<string>();
  for (const m of directMessages) {
    if (m.from === currentHandle && m.to) peers.add(m.to);
    else if (m.to === currentHandle && m.from) peers.add(m.from);
  }
  return peers;
}

export function isMessageReceipted(
  timestamp: number,
  receiptIds: Array<string | number> | undefined
): boolean {
  if (!receiptIds?.length) return false;
  return receiptIds.some((id) => String(id) === String(timestamp));
}

export function computeDeliveredReceiptsFrom(
  deliveredMessages: Record<string, Record<string, (string | number)[]>> | undefined,
  currentHandle: string
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  if (!currentHandle || !deliveredMessages) return out;
  for (const [recipient, senders] of Object.entries(deliveredMessages)) {
    if (recipient === currentHandle) continue;
    const ids = senders[currentHandle];
    if (ids?.length) out[recipient] = ids.map(String);
  }
  return out;
}

export function computeReadReceiptsFrom(
  readMessages: Record<string, Record<string, (string | number)[]>> | undefined,
  currentHandle: string
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  if (!currentHandle || !readMessages) return out;
  for (const [reader, senders] of Object.entries(readMessages)) {
    if (reader === currentHandle) continue;
    const ids = senders[currentHandle];
    if (ids?.length) out[reader] = ids.map(String);
  }
  return out;
}

export function filterThreadMessages(messages: DmMessage[], handle: string, peer: string) {
  return messages.filter(
    (m) => (m.from === handle && m.to === peer) || (m.to === handle && m.from === peer)
  );
}

export type DmFriendEntry = { requester?: string; target?: string; status?: string };

export function getAcceptedFriendIds(userId: string, friends: DmFriendEntry[]): Set<string> {
  return new Set(
    friends
      .filter((f) => f.status === "accepted" && (f.requester === userId || f.target === userId))
      .map((f) => String(f.requester === userId ? f.target : f.requester))
  );
}

type DmContactUser = {
  id?: string;
  username?: string;
  name?: string;
  displayName?: string;
};

function dmLastMessageAt(
  directMessages: DmMessage[],
  currentHandle: string,
  username: string
): number {
  const msgs = directMessages.filter(
    (m) =>
      (m.from === currentHandle && m.to === username) ||
      (m.to === currentHandle && m.from === username)
  );
  return msgs.length ? Math.max(...msgs.map((m) => m.timestamp || 0)) : 0;
}

function sortDmContacts(
  list: DmContactUser[],
  directMessages: DmMessage[],
  currentHandle: string,
  unreadCounts: Record<string, number>
) {
  return [...list].sort((a, b) => {
    const aUser = a.username || "";
    const bUser = b.username || "";
    const aUnread = unreadCounts[aUser] || 0;
    const bUnread = unreadCounts[bUser] || 0;
    if (aUnread !== bUnread) return bUnread - aUnread;
    const aT = dmLastMessageAt(directMessages, currentHandle, aUser);
    const bT = dmLastMessageAt(directMessages, currentHandle, bUser);
    if (aT && bT) return bT - aT;
    if (aT) return -1;
    if (bT) return 1;
    return (a.displayName || a.name || "").localeCompare(b.displayName || b.name || "");
  });
}

/** DM sidebar: friends only for members; all members for admin. */
export function buildDmContactList(args: {
  registeredUsers: DmContactUser[];
  friends: DmFriendEntry[];
  directMessages: DmMessage[];
  currentUserId: string;
  currentHandle: string;
  isAdmin: boolean;
  search: string;
  unreadCounts: Record<string, number>;
  isUserBlocked?: (userId: string) => boolean;
}): DmContactUser[] {
  const {
    registeredUsers,
    friends,
    directMessages,
    currentUserId,
    currentHandle,
    isAdmin,
    search,
    unreadCounts,
    isUserBlocked = () => false,
  } = args;

  const q = search.trim().toLowerCase();
  const friendIds = getAcceptedFriendIds(currentUserId, friends);

  if (isAdmin) {
    const conversationPeers = getDmConversationPeernames(directMessages, currentHandle);
    const byUsername = new Map(
      registeredUsers
        .filter((u) => u.username && u.username !== currentHandle)
        .map((u) => [u.username!, u] as const)
    );
    for (const peer of conversationPeers) {
      if (!byUsername.has(peer)) {
        byUsername.set(peer, { id: peer, username: peer, name: peer });
      }
    }
    let list = [...byUsername.values()].filter((u) => !isUserBlocked(String(u.id)));
    if (!q) {
      list = list.filter(
        (u) => conversationPeers.has(u.username!) || (unreadCounts[u.username!] || 0) > 0
      );
    } else {
      list = list.filter(
        (u) =>
          (u.displayName || u.name || "").toLowerCase().includes(q) ||
          u.username!.toLowerCase().includes(q)
      );
    }
    return sortDmContacts(list, directMessages, currentHandle, unreadCounts);
  }

  let list = registeredUsers.filter(
    (u) =>
      u.username &&
      u.username !== currentHandle &&
      friendIds.has(String(u.id)) &&
      !isUserBlocked(String(u.id))
  );

  if (q) {
    list = list.filter(
      (u) =>
        (u.displayName || u.name || "").toLowerCase().includes(q) ||
        u.username!.toLowerCase().includes(q)
    );
  }

  return sortDmContacts(list, directMessages, currentHandle, unreadCounts);
}

export function recipientBlockedSender(
  users: { id?: string; username?: string; blocked?: unknown[] }[],
  senderId: string,
  recipientHandle: string
): boolean {
  const recipient = users.find((u) => u.username === recipientHandle);
  if (!recipient) return false;
  const blocked = Array.isArray(recipient.blocked) ? recipient.blocked.map(String) : [];
  return blocked.includes(String(senderId));
}
