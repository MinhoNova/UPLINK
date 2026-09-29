import { stripLobbyMessages } from "@/lib/dataAccess";

/**
 * The keys an anonymous visitor may read.
 *
 * This is an allowlist on purpose. `kv_store` also holds directMessages,
 * notifications, applications, tickets, auditLogs, ban records and userRoles, so
 * spreading the whole object to an unauthenticated caller leaks private data.
 * Anything not named here is private by default and must be added deliberately.
 *
 * This is the only place the list lives: `/api/data` and `/api/public-data` both
 * resolve keys through here, so the two public reads cannot drift apart.
 */
export const PUBLIC_DATA_KEYS = [
  "lobbies",
  "goldOffers",
  "registeredUsers",
  "characters",
] as const;

const PUBLIC_KEY_SET = new Set<string>(PUBLIC_DATA_KEYS);

/** True only for keys that are safe to hand to a visitor. */
export function isPublicDataKey(key: string): boolean {
  return PUBLIC_KEY_SET.has(key);
}

/**
 * Narrow a caller-supplied key list to the allowlist, preserving order and
 * dropping duplicates. `?keys=directMessages` therefore resolves to nothing
 * rather than handing over the private store.
 */
export function restrictToPublicKeys(keys: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const key of keys) {
    const clean = key.trim();
    if (!isPublicDataKey(clean) || seen.has(clean)) continue;
    seen.add(clean);
    out.push(clean);
  }
  return out;
}

/**
 * Per-player fields that must never be public: contact details, network
 * identifiers, presence, the block list, and anything describing identity
 * changes or private settings.
 */
const PRIVATE_USER_FIELDS = [
  "email",
  "lastKnownIp",
  "lastSeenAt",
  "blocked",
  "friendRequests",
  "battleTag",
  "previousUsernames",
  "hiddenIdentity",
  "offerDrafts",
  "offerNotificationSettings",
] as const;

/** Strip the fields that identify a player, so a public roster stays a roster. */
export function publicUserRow(u: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = { ...u };
  for (const field of PRIVATE_USER_FIELDS) delete safe[field];
  if (safe.subscription && typeof safe.subscription === "object") {
    safe.subscription = { tier: (safe.subscription as { tier?: string }).tier || "free" };
  }
  return safe;
}

/** Sanitise a roster that the caller has already decided to publish. */
export function sanitizePublicUsers(value: unknown): unknown {
  if (!Array.isArray(value)) return value;
  return value.map((u) => (u && typeof u === "object" ? publicUserRow(u as Record<string, unknown>) : u));
}

/**
 * Build an anonymous payload: allowlisted keys only, chat bodies removed, and
 * per-player identifiers removed from the roster.
 */
export function publicDataView(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of PUBLIC_DATA_KEYS) {
    const value = data[key];
    if (value === undefined) continue;
    if (key === "lobbies") out[key] = stripLobbyMessages(value);
    else if (key === "registeredUsers") out[key] = sanitizePublicUsers(value);
    else out[key] = value;
  }
  return out;
}
