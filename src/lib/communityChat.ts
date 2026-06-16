import { DM_REACTION_EMOJIS } from "@/lib/dmHelpers";

export { DM_REACTION_EMOJIS as COMMUNITY_CHAT_REACTION_EMOJIS };

/** Quick-insert emojis for the composer picker. */
export const COMMUNITY_CHAT_INPUT_EMOJIS = [
  "🔥", "💀", "😂", "🥶", "🦅", "😭", "❤️", "🎉", "🙏", "👀", "🫡", "💯", "⚔️", "🗿", "✨", "🏆",
] as const;

export type CommunityChatReplyRef = {
  id: number;
  userId: string;
  userName: string;
  text: string;
};

export type CommunityChatMessage = {
  id: number;
  userId: string;
  userName: string;
  userImage: string;
  text: string;
  image?: string;
  createdAt: number;
  replyTo?: CommunityChatReplyRef;
  reactions?: Record<string, string>;
};

export function replySnippet(text: string, max = 80): string {
  const t = String(text || "").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}
