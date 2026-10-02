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
 * Per-offer fields that must never ride along in a public payload.
 *
 * `paymentProof` is a base64 screenshot of someone's payment — it can carry a
 * full name, a bank/e-wallet account and a transaction id. `/api/public-data`
 * answers with no session at all, so a proof left on the lobby row was
 * downloadable by anyone who asked for `lobbies`, which is a financial-data
 * leak and not a cosmetic one. `votes` and `history` are the same class of
 * bookkeeping: who was on the mission, and who was removed from it.
 *
 * They are read back per-viewer from the authenticated `/api/data` and the
 * `/api/history` route, which scope to the threads that viewer may open.
 */
const PRIVATE_OFFER_FIELDS = [
  "paymentProof",
  "votes",
  "history",
  "dmThread",
  "modThread",
] as const;

/** Strip the fields a non-participant has no business reading. */
export function publicOfferRow(lobby: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = { ...lobby };
  for (const field of PRIVATE_OFFER_FIELDS) delete safe[field];
  if (Array.isArray(lobby.messages)) {
    safe.messageCount = lobby.messages.length;
  }
  delete safe.messages;
  return safe;
}

/** Sanitise a roster of offers the caller has already decided to publish. */
export function stripPublicOfferFields(lobbies: unknown): unknown {
  if (!Array.isArray(lobbies)) return lobbies;
  return lobbies.map((l) => (l && typeof l === "object" ? publicOfferRow(l as Record<string, unknown>) : l));
}

/**
 * The site is Global-only, so a Taiwan/KR row is either a leftover from an
 * earlier build or a forged write. Neither belongs in a published roster: it
 * shows the wrong region badge, its portrait points at a different game's
 * image host, and it holds one of the account's character slots hostage.
 *
 * `validateCharacters` already drops these on write, but a row that was stored
 * before that gate existed stays in the store until somebody saves. Filtering
 * here makes them disappear for everyone immediately, without waiting for a
 * write, and it applies to both `/api/public-data` and `/api/data`.
 */
export function dropNonGlobalCharacters<T>(list: unknown): T[] {
  if (!Array.isArray(list)) return [];
  return (list as any[]).filter((c) => {
    const region = String(c?.region || "").toLowerCase();
    return !region || region === "global";
  }) as T[];
}

/**
 * Build an anonymous payload: allowlisted keys only, chat bodies removed, the
 * per-offer financial/bookkeeping fields removed, per-player identifiers
 * removed from the roster, and non-Global characters dropped.
 */
export function publicDataView(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of PUBLIC_DATA_KEYS) {
    const value = data[key];
    if (value === undefined) continue;
    if (key === "lobbies") out[key] = stripPublicOfferFields(value);
    else if (key === "registeredUsers") out[key] = sanitizePublicUsers(value);
    else if (key === "characters") out[key] = dropNonGlobalCharacters(value);
    else out[key] = value;
  }
  return out;
}
