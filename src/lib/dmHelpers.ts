export const DM_REACTION_EMOJIS = ["😂", "❤️", "👍", "🔥", "💀", "🏆"] as const;

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

export function filterThreadMessages(messages: DmMessage[], handle: string, peer: string) {
  return messages.filter(
    (m) => (m.from === handle && m.to === peer) || (m.to === handle && m.from === peer)
  );
}
