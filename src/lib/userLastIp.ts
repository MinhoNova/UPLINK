import { getKV, setKV, initTables } from "@/lib/db";

const TOUCH_INTERVAL_MS = 5 * 60_000;

/** Record the user's last seen IP (server-only, throttled). */
export async function touchUserLastIp(userId: string, ip: string): Promise<void> {
  const trimmed = ip?.trim();
  if (!trimmed || trimmed === "unknown") return;

  try {
    await initTables();
    const users: any[] = (await getKV("registeredUsers")) || [];
    const idx = users.findIndex((u) => String(u.id) === String(userId));
    if (idx === -1) return;

    const user = users[idx];
    const now = Date.now();
    if (
      user.lastKnownIp === trimmed &&
      typeof user.lastSeenAt === "number" &&
      now - user.lastSeenAt < TOUCH_INTERVAL_MS
    ) {
      return;
    }

    users[idx] = { ...user, lastKnownIp: trimmed, lastSeenAt: now };
    await setKV("registeredUsers", users);
  } catch (e) {
    console.error("touchUserLastIp failed:", e);
  }
}
