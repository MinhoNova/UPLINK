/**
 * Keeps one site account glued to one Discord account.
 *
 * The invariant: `registeredUsers` rows are keyed by the Discord snowflake and
 * nothing else. A player may rename or re-avatar their Discord account as often
 * as they like — their site profile, DM history, friendships, bans and stats
 * follow the snowflake, never the handle.
 *
 * `syncPlayerIdentity` runs on sign-in, where the Discord profile is fresh. It:
 *   - creates the row on first ever login,
 *   - mirrors the live Discord handle / display name / avatar onto the row,
 *   - remembers previous handles so pre-migration rows stay resolvable,
 *   - never touches the name or picture the player chose on the site
 *     (`displayName`, `customAvatar`, `profileGif`, `banner`, `nameColor`).
 *
 * `repairIdentity` runs on the data poll. It is id-only and deliberately cannot
 * write a handle: the session cookie may be a login behind, so pushing its
 * `username` would undo a rename the player already made in Discord.
 *
 * `backfillIdentityLinks` re-keys the rows that used to address players by
 * handle (DMs, read/delivered receipts, notifications) onto the stable ids.
 */

import { getKV, setKV, updateKVAtomic } from "@/lib/db";
import { DEFAULT_PROFILE_BANNER } from "@/lib/profileImage";
import {
  buildHandleIndex,
  findUserById,
  normRef,
  resolveAvailableUsername,
  userIdOf,
  usernameOf,
  type PlayerRecord,
} from "@/lib/playerIdentity";

export type DiscordIdentity = {
  id: string;
  username: string;
  name?: string | null;
  avatar?: string | null;
};

export type IdentitySyncResult = {
  created: boolean;
  changed: boolean;
  /** The Discord handle moved — handle-keyed rows need repairing. */
  usernameChanged: boolean;
  me: Record<string, unknown> | null;
  users: Record<string, unknown>[];
};

const MAX_PREVIOUS_USERNAMES = 8;

/**
 * Bumped whenever `backfillIdentityLinks` learns to repair a new kind of
 * handle-keyed row. Stored once in `identityBackfillVersion` so the repair runs
 * at most once per upgrade rather than on every poll.
 */
const IDENTITY_VERSION = 3;

type PlayerRow = Record<string, unknown> & { id: string };

function rememberHandle(previous: unknown, handle: string, currentId: string, currentUsername: string): string[] {
  const list = Array.isArray(previous) ? previous.map((v) => String(v)) : [];
  const next = [handle, ...list.filter((v) => v && v !== handle)];
  return next
    .filter((v) => normRef(v) !== normRef(currentId) && normRef(v) !== normRef(currentUsername))
    .slice(0, MAX_PREVIOUS_USERNAMES);
}

/**
 * Build the row for a brand-new account. `banner` falls back to the site
 * default so a fresh profile is never blank.
 */
async function newPlayerRow(identity: DiscordIdentity): Promise<PlayerRow> {
  const siteDefaultBanner = ((await getKV("siteDefaultBanner")) as string) || DEFAULT_PROFILE_BANNER;
  return {
    id: identity.id,
    username: identity.username || identity.id,
    name: identity.name ?? null,
    avatar: identity.avatar ?? null,
    previousUsernames: [],
    banner: siteDefaultBanner,
    lastSeenAt: Date.now(),
    lastKnownIp: null,
    stats: { total: 0, k5: 0, k10: 0, k15: 0, k20: 0 },
    subscription: { tier: "free" },
  };
}

/**
 * Merge a fresh Discord profile into an existing row.
 * Site-owned presentation fields are deliberately left alone.
 */
function mergeDiscordProfile(row: PlayerRow, identity: DiscordIdentity, users: PlayerRecord[]): PlayerRow {
  const next: PlayerRow = { ...row };
  const id = userIdOf(row);
  const currentUsername = usernameOf(row);

  const { username, conflicted } = resolveAvailableUsername(users, identity.username, id);
  const desired = username || currentUsername || id;

  if (normRef(desired) !== normRef(currentUsername) && currentUsername) {
    next.previousUsernames = rememberHandle(row.previousUsernames, currentUsername, id, desired);
  }
  next.username = desired;
  if (conflicted) next.usernameConflict = true;
  else if (row.usernameConflict) delete next.usernameConflict;

  if (identity.name != null && String(identity.name) !== String(row.name ?? "")) {
    next.name = identity.name;
  }

  // Only mirror the Discord avatar while the player has not picked one here.
  const hasSiteAvatar = Boolean(
    (typeof row.customAvatar === "string" && row.customAvatar.trim()) ||
      (typeof row.profileGif === "string" && row.profileGif.trim())
  );
  if (!hasSiteAvatar && identity.avatar != null && identity.avatar !== row.avatar) {
    next.avatar = identity.avatar;
  }

  return next;
}

/**
 * Upsert the signed-in player, keyed by Discord id. Runs on every sign-in and
 * on every `/api/data` poll so a Discord rename is picked up within seconds.
 */
export async function syncPlayerIdentity(identity: DiscordIdentity): Promise<IdentitySyncResult> {
  const id = String(identity?.id ?? "").trim();
  if (!id) return { created: false, changed: false, usernameChanged: false, me: null, users: [] };

  const profile: DiscordIdentity = {
    id,
    username: String(identity.username ?? "").trim() || id,
    name: identity.name ?? null,
    avatar: identity.avatar ?? null,
  };

  const template = await newPlayerRow(profile);
  const before = ((await getKV("registeredUsers")) as PlayerRow[] | null) ?? [];
  const previous = findUserById(before as PlayerRecord[], id) ?? null;
  const hadRow = Boolean(previous);

  const outcome = await updateKVAtomic<PlayerRow[]>("registeredUsers", (current) => {
    const users: PlayerRow[] = Array.isArray(current) ? current : [];
    const idx = users.findIndex((u) => userIdOf(u) === id);

    if (idx === -1) {
      users.push(template);
      return users;
    }

    const merged = mergeDiscordProfile(users[idx], profile, users as PlayerRecord[]);
    if (JSON.stringify(merged) === JSON.stringify(users[idx])) return null;
    users[idx] = merged;
    return users;
  });

  const users = outcome.ok ? outcome.value : before;
  const me = findUserById(users as PlayerRecord[], id) ?? null;
  const changed = !hadRow || Boolean(me) && JSON.stringify(me) !== JSON.stringify(previous);
  const usernameChanged = !hadRow || normRef(usernameOf(me)) !== normRef(usernameOf(previous));

  return {
    created: !hadRow,
    changed,
    usernameChanged,
    me: me as Record<string, unknown> | null,
    users: users as Record<string, unknown>[],
  };
}

type BackfillCounts = {
  messages: number;
  receipts: number;
  notifications: number;
  unresolved: number;
};

/** Re-key one `Record<readerRef, Record<senderRef, ids>>` receipt map onto ids. */
function rekeyReceipts(
  records: Record<string, Record<string, (string | number)[]>>,
  index: Map<string, string>,
  users: PlayerRecord[]
): { value: Record<string, Record<string, (string | number)[]>>; changed: boolean; unresolved: number } {
  const currentHandleById = new Map(users.map((u) => [userIdOf(u), usernameOf(u)]));
  const resolve = (ref: string): { key: string; handle: string } | null => {
    const raw = String(ref ?? "");
    if (!raw) return null;
    if (findUserById(users, raw)) {
      return { key: raw, handle: currentHandleById.get(raw) || raw };
    }
    const id = index.get(normRef(raw));
    return id ? { key: id, handle: currentHandleById.get(id) || raw } : null;
  };

  const out: Record<string, Record<string, (string | number)[]>> = {};
  let changed = false;
  let unresolved = 0;

  for (const [readerRef, senders] of Object.entries(records || {})) {
    if (!senders || typeof senders !== "object") continue;
    const reader = resolve(readerRef);
    if (!reader) {
      unresolved += 1;
      if (out[readerRef] === undefined) out[readerRef] = {};
      for (const [senderRef, ids] of Object.entries(senders)) out[readerRef][senderRef] = ids;
      continue;
    }
    if (normRef(readerRef) !== normRef(reader.key)) changed = true;
    const bucket = (out[reader.key] ||= {});
    for (const [senderRef, ids] of Object.entries(senders)) {
      const sender = resolve(senderRef);
      if (!sender) {
        unresolved += 1;
        if (bucket[senderRef] === undefined) bucket[senderRef] = ids;
        continue;
      }
      if (normRef(senderRef) !== normRef(sender.key)) changed = true;
      const existing = new Set((bucket[sender.key] || []).map(String));
      for (const id of ids) existing.add(String(id));
      bucket[sender.key] = [...existing];
    }
  }

  return { value: out, changed, unresolved };
}

/**
 * One-time (and idempotent) re-key of everything that used to address a player
 * by Discord handle. Safe to run repeatedly — it only writes when something
 * actually changed.
 *
 * Every write goes through `updateKVAtomic`, so a DM sent while the repair runs
 * is retried rather than clobbered: the re-key is a pure function of the value
 * it is handed, which is exactly what that helper needs.
 */
export async function backfillIdentityLinks(): Promise<BackfillCounts> {
  const users = ((await getKV("registeredUsers")) as PlayerRecord[] | null) ?? [];
  const index = buildHandleIndex(users);
  const currentHandleById = new Map(users.map((u) => [userIdOf(u), usernameOf(u)]));
  const counts: BackfillCounts = { messages: 0, receipts: 0, notifications: 0, unresolved: 0 };

  const rekeyMessages = (current: unknown): unknown[] | null => {
    const messages = Array.isArray(current) ? (current as any[]) : [];
    if (!messages.length) return null;
    let touched = 0;
    const next = messages.map((raw) => {
      const msg = raw && typeof raw === "object" ? raw : {};
      let changed = false;
      const out: Record<string, unknown> = { ...msg };

      for (const [idField, handleField] of [
        ["fromId", "from"],
        ["toId", "to"],
      ] as const) {
        const storedId = String(msg[idField] ?? "");
        const storedHandle = String(msg[handleField] ?? "");
        const id = storedId && findUserById(users, storedId) ? storedId : index.get(normRef(storedHandle)) || storedId;
        const handle = currentHandleById.get(id) || storedHandle;
        if (!id) counts.unresolved += 1;
        if (normRef(id) !== normRef(storedId)) changed = true;
        if (normRef(handle) !== normRef(storedHandle)) changed = true;
        out[idField] = id || undefined;
        out[handleField] = handle;
      }

      if (changed) touched += 1;
      return out;
    });
    if (touched === 0) return null;
    counts.messages = touched;
    return next;
  };
  await updateKVAtomic<unknown[]>("directMessages", rekeyMessages);

  for (const key of ["readMessages", "deliveredMessages"] as const) {
    const outcome = await updateKVAtomic<Record<string, Record<string, (string | number)[]>>>(
      key,
      (current) => {
        if (!current || typeof current !== "object" || !Object.keys(current).length) return null;
        const { value, changed, unresolved } = rekeyReceipts(current, index, users);
        if (!changed) return null;
        counts.receipts += 1;
        counts.unresolved += unresolved;
        return value;
      }
    );
    if (!outcome.ok) counts.receipts = Math.max(0, counts.receipts - 1);
  }

  const rekeyNotifications = (current: unknown): unknown[] | null => {
    const notifications = Array.isArray(current) ? (current as any[]) : [];
    if (!notifications.length) return null;
    let changed = 0;
    const next = notifications.map((raw) => {
      const notif = raw && typeof raw === "object" ? raw : {};
      const storedId = String(notif.toUserId ?? "");
      const toUser = String(notif.toUser ?? "");
      const id = storedId && findUserById(users, storedId) ? storedId : index.get(normRef(toUser)) || storedId;
      const handle = currentHandleById.get(id) || toUser;
      if (normRef(id) === normRef(storedId) && normRef(handle) === normRef(toUser)) return notif;
      changed += 1;
      return { ...notif, toUserId: id || undefined, toUser: handle };
    });
    if (changed === 0) return null;
    counts.notifications = changed;
    return next;
  };
  await updateKVAtomic<unknown[]>("notifications", rekeyNotifications);

  return counts;
}

/**
 * Global "the repair already ran" marker.
 *
 * The re-key rewrites every player's rows at once, so it must never be driven
 * per player: a deploy that leaves the marker unset would otherwise have the
 * first N pollers each rewrite the whole `directMessages` blob. One marker means
 * one run however many requests race for it.
 */
const BACKFILL_MARKER = "identityBackfillVersion";

export async function backfillOnce(): Promise<BackfillCounts | null> {
  if (Number(await getKV(BACKFILL_MARKER)) === IDENTITY_VERSION) return null;
  const counts = await backfillIdentityLinks();
  await setKV(BACKFILL_MARKER, IDENTITY_VERSION);
  return counts;
}

/**
 * Sign-in path: upsert the player, then repair handle-keyed rows.
 *
 * The repair only runs when the handle actually moved (or the account is new),
 * so the hot `/api/data` poll path stays at a single conditional write.
 */
export async function syncAndRepairIdentity(identity: DiscordIdentity): Promise<IdentitySyncResult> {
  const result = await syncPlayerIdentity(identity);
  if (result.created || result.usernameChanged) {
    try {
      await backfillOnce();
    } catch (error) {
      console.error("[identity] backfill failed:", error);
    }
  }
  return result;
}

/**
 * Data-poll path: id-only self-healing, safe to run every few seconds.
 *
 * It guarantees the account row exists and that legacy handle-keyed rows have
 * been re-keyed onto the snowflake, but it never writes a username. The JWT
 * handed to this route can be several logins old, so treating its `username` as
 * authoritative would silently roll a Discord rename backwards.
 */
export async function repairIdentity(id: string): Promise<IdentitySyncResult> {
  const target = String(id ?? "").trim();
  const empty: IdentitySyncResult = { created: false, changed: false, usernameChanged: false, me: null, users: [] };
  if (!target) return empty;

  const before = ((await getKV("registeredUsers")) as PlayerRow[] | null) ?? [];
  const existing = findUserById(before as PlayerRecord[], target);

  if (!existing) {
    // No account row yet: the sign-in write never landed, or it was wiped.
    // Seed a placeholder row — the real handle arrives on the next sign-in.
    const created = await syncPlayerIdentity({ id: target, username: target, name: null, avatar: null });
    try {
      await backfillOnce();
    } catch (error) {
      console.error("[identity] backfill failed:", error);
    }
    return created;
  }

  try {
    await backfillOnce();
  } catch (error) {
    console.error("[identity] backfill failed:", error);
  }

  return { ...empty, me: existing as Record<string, unknown> };
}
