import { rateLimitByUser } from "@/lib/rateLimit";

/** Legitimate voice join attempts per minute (never suspends — cooldown only). */
export const VOICE_JOIN_LIMIT = 12;
export const VOICE_JOIN_WINDOW_MS = 60_000;

export type VoiceJoinRateResult =
  | { ok: true }
  | { ok: false; status: 429; error: string; retryAfterMs: number; code: "VOICE_COOLDOWN" };

/**
 * Soft throttle for voice join. Unlike DM moderation, this NEVER adds users to bannedUsers.
 */
export async function enforceVoiceJoinRateLimit(userId: string): Promise<VoiceJoinRateResult> {
  const rl = await rateLimitByUser(userId, "voice_join", VOICE_JOIN_LIMIT, VOICE_JOIN_WINDOW_MS);
  if (!rl.ok) {
    const seconds = Math.max(1, Math.ceil(rl.retryAfterMs / 1000));
    return {
      ok: false,
      status: 429,
      error: `Too many voice join attempts. Wait ${seconds}s and try again.`,
      retryAfterMs: rl.retryAfterMs,
      code: "VOICE_COOLDOWN",
    };
  }
  return { ok: true };
}
