/**
 * Canonical player identity.
 *
 * A Discord account is identified **only** by its snowflake (`user.id`). The
 * Discord handle (`username`) and the Discord display name (`name`) are both
 * user-mutable and neither is unique, so they must never be used to decide
 * *who* somebody is — only to render a label.
 *
 * Everything on the site that used to address players by handle (DMs, read /
 * delivered receipts, notifications, mute lists) now stores the stable id and
 * keeps the handle as a display copy. `previousUsernames` remembers handles the
 * account used to own so legacy rows can still be resolved.
 */

export type PlayerRecord = {
  id: string;
  username?: string;
  name?: string | null;
  displayName?: string;
  previousUsernames?: string[];
};

export type UserRef = {
  id: string;
  username: string;
};

export function normRef(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

/** Discord snowflakes are 17-20 digit numeric strings. */
export function looksLikeDiscordId(value: unknown): boolean {
  return /^\d{16,22}$/.test(String(value ?? "").trim());
}

export function userIdOf(user: any): string {
  return String(user?.id ?? "");
}

export function usernameOf(user: any): string {
  return String(user?.username ?? "");
}

export function playerRef(user: any): UserRef {
  return { id: userIdOf(user), username: usernameOf(user) };
}

/** Identity pairs for the signed-in player: the stable id plus the current handle. */
export function refFor(id: string, username: string): UserRef {
  return { id: String(id ?? ""), username: String(username ?? "") };
}

/** True when `value` names the same player as `ref` (by id or by handle). */
export function refMatches(ref: UserRef, value: unknown): boolean {
  const v = normRef(value);
  if (!v || !ref) return false;
  if (ref.id && normRef(ref.id) === v) return true;
  if (ref.username && normRef(ref.username) === v) return true;
  return false;
}

/** True when both refs point at the same player. */
export function samePlayer(a: UserRef, b: UserRef): boolean {
  if (a.id && b.id) return String(a.id) === String(b.id);
  return !!a.id || !!b.id ? false : normRef(a.username) === normRef(b.username) && !!a.username;
}

/**
 * Index every handle an account has ever used (current + previous) so rows
 * written before the identity migration can still be traced back to an id.
 */
export function buildHandleIndex(users: PlayerRecord[]): Map<string, string> {
  const index = new Map<string, string>();
  const put = (handle: unknown, id: string) => {
    const key = normRef(handle);
    if (key && id) index.set(key, id);
  };
  for (const u of users) {
    if (!u) continue;
    const id = userIdOf(u);
    if (!id) continue;
    put(u.username, id);
    put(u.displayName, id);
    put(u.name, id);
    for (const prev of Array.isArray(u.previousUsernames) ? u.previousUsernames : []) {
      put(prev, id);
    }
  }
  return index;
}

export function findUserById(users: PlayerRecord[], id: unknown) {
  const key = String(id ?? "");
  if (!key) return undefined;
  return users.find((u) => userIdOf(u) === key);
}

/**
 * Resolve a stored reference (id or handle) to a player id.
 * Ids win; handles are looked up through the historical handle index.
 */
export function resolveUserId(users: PlayerRecord[], ref: unknown, handleIndex?: Map<string, string>): string {
  const value = String(ref ?? "").trim();
  if (!value) return "";
  if (findUserById(users, value)) return value;
  const index = handleIndex ?? buildHandleIndex(users);
  return index.get(normRef(value)) || "";
}

/** Resolve a stored reference to the full player record. */
export function resolveUserByRef(users: PlayerRecord[], ref: unknown): PlayerRecord | undefined {
  const id = resolveUserId(users, ref);
  if (id) return findUserById(users, id);
  const key = normRef(ref);
  return users.find((u) => normRef(u?.username) === key);
}

/** Every label an account may be shown or searched under. */
export function playerAliases(user: PlayerRecord): string[] {
  const out = new Set<string>();
  for (const v of [user?.username, user?.displayName, user?.name, ...(Array.isArray(user?.previousUsernames) ? user.previousUsernames : [])]) {
    const s = String(v ?? "").trim();
    if (s) out.add(s);
  }
  return [...out];
}

/**
 * Pick a username that no *other* account holds. Discord lets you release a
 * handle and another person claim it, so the raw value is not always unique.
 * Returns `undefined` when the handle is free or already ours.
 */
export function resolveAvailableUsername(
  users: PlayerRecord[],
  desired: string,
  selfId: string
): { username: string; conflicted: boolean } {
  const wanted = String(desired ?? "").trim();
  if (!wanted) return { username: String(selfId ?? ""), conflicted: false };
  const key = normRef(wanted);
  const owner = users.find(
    (u) => u && normRef(u.username) === key && userIdOf(u) !== String(selfId)
  );
  if (!owner) return { username: wanted, conflicted: false };

  const taken = new Set(users.map((u) => normRef(u?.username)));
  for (let n = 2; n < 100; n += 1) {
    const candidate = `${wanted}-${n}`;
    if (!taken.has(normRef(candidate))) return { username: candidate, conflicted: true };
  }
  return { username: `${wanted}-${String(selfId).slice(-4)}`, conflicted: true };
}

/**
 * `username` must be unique across accounts — two players sharing a handle is
 * what makes a Discord rename look like a brand new player.
 */
export function findDuplicateUsernames(users: PlayerRecord[]): { username: string; ids: string[] }[] {
  const byHandle = new Map<string, string[]>();
  for (const u of users) {
    const key = normRef(u?.username);
    const id = userIdOf(u);
    if (!key || !id) continue;
    byHandle.set(key, [...(byHandle.get(key) || []), id]);
  }
  return [...byHandle.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([username, ids]) => ({ username, ids }));
}
