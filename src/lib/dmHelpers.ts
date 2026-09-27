/**
 * Direct-message helpers.
 *
 * Messages are addressed by the **stable Discord id** (`fromId` / `toId`).
 * `from` / `to` remain as display copies of the handle so old rows and the
 * reaction tooltips keep working, but identity is never inferred from them.
 */

import {
  buildHandleIndex,
  findUserById,
  normRef,
  refMatches,
  refFor,
  resolveUserId,
  userIdOf,
  usernameOf,
  type PlayerRecord,
  type UserRef,
} from "@/lib/playerIdentity";

export const DM_REACTION_EMOJIS = ["😂", "❤️", "👍", "🔥", "💀", "🏆"] as const;

export type DmMessage = {
  from: string;
  to: string;
  fromId?: string;
  toId?: string;
  text: string;
  timestamp: number;
  edited?: boolean;
  image?: string;
  reactions?: Record<string, string>;
};

export type ReceiptMap = Record<string, Record<string, (string | number)[]>>;

export type DmContactUser = {
  id?: string;
  username?: string;
  name?: string;
  displayName?: string;
};

export function getDmMsgKey(msg: Pick<DmMessage, "timestamp" | "from" | "to" | "text">) {
  return String(msg.timestamp || `${msg.from}-${msg.to}-${msg.text}`);
}

/** Stable id of the sender, falling back to the stored handle for legacy rows. */
export function dmSenderRef(msg: Pick<DmMessage, "from" | "fromId">): UserRef {
  return refFor(msg.fromId ?? msg.from, msg.from);
}

export function dmRecipientRef(msg: Pick<DmMessage, "to" | "toId">): UserRef {
  return refFor(msg.toId ?? msg.to, msg.to);
}

/** True when the message was sent by the given player. */
export function isFromUser(msg: Pick<DmMessage, "from" | "fromId">, me: UserRef): boolean {
  return refMatches(me, msg.fromId) || refMatches(me, msg.from);
}

/** True when the message was sent to the given player. */
export function isToUser(msg: Pick<DmMessage, "to" | "toId">, me: UserRef): boolean {
  return refMatches(me, msg.toId) || refMatches(me, msg.to);
}

export function isOwnMessage(msg: Pick<DmMessage, "from" | "fromId">, me: UserRef): boolean {
  return isFromUser(msg, me);
}

/**
 * Fill in `fromId` / `toId` on messages written before the identity migration.
 * `from` / `to` are refreshed to the owner's current handle so display copies
 * never drift. Pure — the caller decides whether to persist.
 */
export function withDmIdentities(messages: unknown, users: PlayerRecord[]): DmMessage[] {
  if (!Array.isArray(messages)) return [];
  const index = buildHandleIndex(users);
  return messages
    .filter((m): m is DmMessage => Boolean(m) && typeof m === "object")
    .map((msg) => {
      const fromId = msg.fromId || resolveUserId(users, msg.from, index) || undefined;
      const toId = msg.toId || resolveUserId(users, msg.to, index) || undefined;
      const from = (fromId && findUserById(users, fromId)?.username) || msg.from;
      const to = (toId && findUserById(users, toId)?.username) || msg.to;
      if (fromId === msg.fromId && toId === msg.toId && from === msg.from && to === msg.to) return msg;
      return { ...msg, fromId, toId, from, to };
    });
}

/**
 * Re-key a `reader -> sender -> ids` receipt map onto stable ids, merging
 * entries that used to be split across old handles of the same account.
 */
export function withReceiptIdentities(
  records: unknown,
  users: PlayerRecord[]
): ReceiptMap {
  const out: ReceiptMap = {};
  if (!records || typeof records !== "object" || Array.isArray(records)) return out;
  const index = buildHandleIndex(users);
  const keyOf = (ref: string): string =>
    (findUserById(users, ref) ? ref : index.get(normRef(ref)) || "") || ref;

  for (const [readerRef, senders] of Object.entries(records as ReceiptMap)) {
    if (!senders || typeof senders !== "object") continue;
    const reader = keyOf(readerRef);
    const bucket = (out[reader] ||= {});
    for (const [senderRef, ids] of Object.entries(senders)) {
      if (!Array.isArray(ids)) continue;
      const sender = keyOf(senderRef);
      const merged = new Set((bucket[sender] || []).map(String));
      for (const id of ids) merged.add(String(id));
      bucket[sender] = [...merged];
    }
  }
  return out;
}

/** Look up receipt ids, tolerating rows still keyed by an old handle. */
function lookupReceiptIds(records: ReceiptMap, reader: UserRef, sender: UserRef) {
  const readerKeys = [reader.id, reader.username].filter(Boolean);
  const senderKeys = [sender.id, sender.username].filter(Boolean);
  for (const rk of readerKeys) {
    const senders = records[rk];
    if (!senders) continue;
    for (const sk of senderKeys) {
      const ids = senders[sk];
      if (ids?.length) return ids;
    }
  }
  return [] as (string | number)[];
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

/** Unread count per peer, keyed by the peer's stable id. */
export function computeDmUnreadCounts(
  directMessages: DmMessage[],
  readMessages: ReceiptMap | undefined,
  me: UserRef
): Record<string, number> {
  if (!me.id && !me.username) return {};
  const counts: Record<string, number> = {};
  for (const m of directMessages) {
    if (!isToUser(m, me) || !m.from || isFromUser(m, me)) continue;
    const sender = dmSenderRef(m);
    const peerId = sender.id || sender.username;
    if (!peerId) continue;
    if (isDmMessageRead(m, lookupReceiptIds(readMessages || {}, me, sender))) continue;
    counts[peerId] = (counts[peerId] || 0) + 1;
  }
  return counts;
}

export function totalDmUnreadCount(
  counts: Record<string, number>,
  options?: { muted?: string[]; friendUserIds?: Set<string> }
): number {
  let total = 0;
  for (const [peerId, n] of Object.entries(counts)) {
    if (options?.muted?.includes(peerId)) continue;
    if (options?.friendUserIds && !options.friendUserIds.has(peerId)) continue;
    total += n;
  }
  return total;
}

/** Stable ids of every player the user has exchanged DMs with. */
export function getDmConversationPeerIds(directMessages: DmMessage[], me: UserRef): Set<string> {
  const peers = new Set<string>();
  for (const m of directMessages) {
    if (isFromUser(m, me)) {
      const peer = dmRecipientRef(m);
      if (peer.id || peer.username) peers.add(peer.id || peer.username);
    } else if (isToUser(m, me)) {
      const peer = dmSenderRef(m);
      if (peer.id || peer.username) peers.add(peer.id || peer.username);
    }
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

/** Timestamps of my messages a given peer has received (`peerId -> ids`). */
export function computeDeliveredReceiptsFrom(
  deliveredMessages: ReceiptMap | undefined,
  me: UserRef
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  if (!deliveredMessages || (!me.id && !me.username)) return out;
  for (const [recipientRef, senders] of Object.entries(deliveredMessages)) {
    if (!senders || refMatches(me, recipientRef)) continue;
    const ids = lookupReceiptIds(deliveredMessages, { id: recipientRef, username: "" }, me);
    if (ids.length) out[recipientRef] = ids.map(String);
  }
  return out;
}

/** Timestamps of my messages a given peer has read (`peerId -> ids`). */
export function computeReadReceiptsFrom(
  readMessages: ReceiptMap | undefined,
  me: UserRef
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  if (!readMessages || (!me.id && !me.username)) return out;
  for (const [readerRef, senders] of Object.entries(readMessages)) {
    if (!senders || refMatches(me, readerRef)) continue;
    const ids = lookupReceiptIds(readMessages, { id: readerRef, username: "" }, me);
    if (ids.length) out[readerRef] = ids.map(String);
  }
  return out;
}

/** The other party in a message, from `me`'s point of view. */
export function dmPeerRef(msg: DmMessage, me: UserRef): UserRef | null {
  if (isFromUser(msg, me)) return dmRecipientRef(msg);
  if (isToUser(msg, me)) return dmSenderRef(msg);
  return null;
}

export function filterThreadMessages(messages: DmMessage[], me: UserRef, peer: UserRef) {
  return messages.filter((m) => {
    const other = dmPeerRef(m, me);
    if (!other) return false;
    return refMatches(peer, other.id) || refMatches(peer, other.username);
  });
}

export type DmFriendEntry = { requester?: string; target?: string; status?: string };

export function getAcceptedFriendIds(userId: string, friends: DmFriendEntry[]): Set<string> {
  const myId = String(userId);
  return new Set(
    friends
      .filter((f) => f.status === "accepted" && (String(f.requester) === myId || String(f.target) === myId))
      .map((f) => String(f.requester === userId ? f.target : f.requester))
  );
}

function dmLastMessageAt(directMessages: DmMessage[], me: UserRef, peer: UserRef): number {
  const msgs = filterThreadMessages(directMessages, me, peer);
  return msgs.length ? Math.max(...msgs.map((m) => m.timestamp || 0)) : 0;
}

function sortDmContacts(
  list: DmContactUser[],
  directMessages: DmMessage[],
  me: UserRef,
  unreadCounts: Record<string, number>
) {
  return [...list].sort((a, b) => {
    const aRef = { id: userIdOf(a), username: usernameOf(a) };
    const bRef = { id: userIdOf(b), username: usernameOf(b) };
    const aUnread = unreadCounts[aRef.id || aRef.username] || 0;
    const bUnread = unreadCounts[bRef.id || bRef.username] || 0;
    if (aUnread !== bUnread) return bUnread - aUnread;
    const aT = dmLastMessageAt(directMessages, me, aRef);
    const bT = dmLastMessageAt(directMessages, me, bRef);
    if (aT && bT) return bT - aT;
    if (aT) return -1;
    if (bT) return 1;
    return (a.displayName || a.name || "").localeCompare(b.displayName || b.name || "");
  });
}

/** DM sidebar: friends only for members; every conversation for admins. */
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

  const me = refFor(currentUserId, currentHandle);
  const q = search.trim().toLowerCase();
  const friendIds = getAcceptedFriendIds(currentUserId, friends);

  if (isAdmin) {
    const peers = getDmConversationPeerIds(directMessages, me);
    const byId = new Map<string, DmContactUser>();
    for (const u of registeredUsers) {
      const id = userIdOf(u);
      if (!id || id === me.id || refMatches(me, u.username)) continue;
      byId.set(id, u);
    }
    // Conversations with accounts that are no longer registered still show up,
    // resolved through the ids recorded on the messages themselves.
    for (const peerId of peers) {
      if (!byId.has(peerId)) byId.set(peerId, { id: peerId, username: peerId, name: peerId });
    }
    let list = [...byId.values()].filter((u) => !isUserBlocked(String(u.id)));
    if (!q) {
      list = list.filter((u) => {
        const id = userIdOf(u);
        return peers.has(id) || peers.has(usernameOf(u)) || (unreadCounts[id] || 0) > 0;
      });
    } else {
      list = list.filter(
        (u) =>
          (u.displayName || u.name || "").toLowerCase().includes(q) ||
          usernameOf(u).toLowerCase().includes(q)
      );
    }
    return sortDmContacts(list, directMessages, me, unreadCounts);
  }

  let list = registeredUsers.filter((u) => {
    const id = userIdOf(u);
    return Boolean(u.username) && id !== me.id && !refMatches(me, u.username) && friendIds.has(id) && !isUserBlocked(id);
  });

  if (q) {
    list = list.filter(
      (u) =>
        (u.displayName || u.name || "").toLowerCase().includes(q) ||
        usernameOf(u).toLowerCase().includes(q)
    );
  }

  return sortDmContacts(list, directMessages, me, unreadCounts);
}

export function recipientBlockedSender(
  users: (PlayerRecord & { blocked?: unknown[] })[],
  senderId: string,
  recipientId: string
): boolean {
  const recipient =
    (findUserById(users, recipientId) as (PlayerRecord & { blocked?: unknown[] }) | undefined) ||
    (users.find((u) => normRef(u?.username) === normRef(recipientId)) as
      | (PlayerRecord & { blocked?: unknown[] })
      | undefined);
  if (!recipient) return false;
  const blocked = Array.isArray(recipient.blocked) ? recipient.blocked.map(String) : [];
  return blocked.includes(String(senderId));
}
