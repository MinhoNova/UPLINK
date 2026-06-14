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

export function filterThreadMessages(messages: DmMessage[], handle: string, peer: string) {
  return messages.filter(
    (m) => (m.from === handle && m.to === peer) || (m.to === handle && m.from === peer)
  );
}
