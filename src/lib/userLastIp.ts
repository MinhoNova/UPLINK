import { updateKVAtomic } from "@/lib/db";

const TOUCH_INTERVAL_MS = 60_000;

type PlayerRow = Record<string, unknown> & { id: string };

/**
 * Record the user's last seen IP (server-only, throttled).
 *
 * Goes through `updateKVAtomic` rather than read-then-`setKV`: two sessions on
 * the same connection (a player signed in on two accounts, or two tabs) poll at
 * the same moment, and a blind full-blob write would let whichever request
 * finished last roll the other one's `lastSeenAt` — and any concurrent username
 * sync — back to the value it read.
 */
export async function touchUserLastIp(userId: string, ip: string): Promise<void> {
  const trimmed = ip?.trim();
  if (!trimmed || trimmed === "unknown") return;

  try {
    const id = String(userId);
    const now = Date.now();
    await updateKVAtomic<PlayerRow[]>(
      "registeredUsers",
      (current) => {
        const users = Array.isArray(current) ? current : [];
        const idx = users.findIndex((u) => String(u.id) === id);
        if (idx === -1) return null;

        const user = users[idx];
        const lastSeenAt = typeof user.lastSeenAt === "number" ? user.lastSeenAt : 0;
        if (user.lastKnownIp === trimmed && now - lastSeenAt < TOUCH_INTERVAL_MS) return null;

        users[idx] = { ...user, lastKnownIp: trimmed, lastSeenAt: now };
        return users;
      },
      { abortOnSetKVError: true }
    );
  } catch (e) {
    console.error("touchUserLastIp failed:", e);
  }
}
