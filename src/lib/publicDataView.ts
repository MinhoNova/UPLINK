import { stripLobbyMessages } from "@/lib/dataAccess";

/**
 * The keys an anonymous visitor is allowed to read.
 *
 * This is an allowlist on purpose. `kv_store` also holds directMessages,
 * registeredUsers rows with emails/IPs, tickets, auditLogs and userRoles, so
 * spreading the whole object (`{...data}`) to an unauthenticated caller leaks
 * private data. Anything not named here is private by default and must be
 * added deliberately, with a reason, after checking it holds no secrets.
 *
 * Mirrors the homepage allowlist in `src/app/api/public-data/route.ts`.
 */
export const PUBLIC_DATA_KEYS = [
  "lobbies",
  "registeredUsers",
  "characters",
  "goldOffers",
] as const;

const PUBLIC_KEY_SET = new Set<string>(PUBLIC_DATA_KEYS);

/** Strip the fields that identify a player, so a public roster stays a roster. */
function publicUserRow(u: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = { ...u };
  delete safe["email"];
  delete safe["lastKnownIp"];
  delete safe["lastSeenAt"];
  delete safe["blocked"];
  delete safe["friendRequests"];
  if (safe.subscription && typeof safe.subscription === "object") {
    safe.subscription = { tier: (safe.subscription as { tier?: string }).tier || "free" };
  }
  return safe;
}

/**
 * Build the anonymous payload: allowlisted keys only, chat bodies removed, and
 * per-player identifiers removed from the roster.
 */
export function publicDataView(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of PUBLIC_KEY_SET) {
    const value = data[key];
    if (value === undefined) continue;
    if (key === "lobbies") out[key] = stripLobbyMessages(value);
    else if (key === "registeredUsers" && Array.isArray(value)) {
      out[key] = value.map((u) => (u && typeof u === "object" ? publicUserRow(u as Record<string, unknown>) : u));
    } else out[key] = value;
  }
  return out;
}
