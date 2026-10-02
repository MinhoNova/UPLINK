import { getKV } from "@/lib/db";
import { gameCharIdOf } from "@/lib/characterStore";
import { getPosterStanding } from "@/lib/posterApproval";
import { isSecretClubTier } from "@/lib/userProfile";
import { findDuplicateUsernames, normRef, type PlayerRecord } from "@/lib/playerIdentity";
import { sanitizeApplicantNote } from "@/lib/applicantNote";
import { canOwnerCancelLobby, hasIndependentSquadMember, hasRealMissionEvidence } from "@/lib/lobbyLifecycle";

/** Offer states past their mission: settling or clearing them is never a start. */
const FINISHED_OFFER_STATUSES = new Set([
  "completed",
  "unpaid",
  "payment_pending",
  "cancelled",
  "failed",
]);
import { checkAndRecordOfferApply, checkAndRecordOfferCreate } from "@/lib/offerDailyLimit";

export const ADMIN_ID = "1497295886223544471";
export const ADMIN_HANDLE = "minhonovazen";

export const OMARSALEH_ADMIN_ID = "711027724663128106";
export const OMARSALEH_ADMIN_HANDLE = "omarsaleh97";

const ADMIN_IDS = [ADMIN_ID, OMARSALEH_ADMIN_ID];
export const ADMIN_HANDLES = [ADMIN_HANDLE, OMARSALEH_ADMIN_HANDLE];

const BLOCKED_KEYS = new Set(["directMessages", "readMessages", "deliveredMessages", "friends"]);
const ADMIN_ONLY_KEYS = new Set(["bannedUsers", "bannedUserIds", "bannedIps"]);

/** Strip admin from ban lists — admin account must never be suspended. */
export function stripAdminFromBanList(handles: string[]): string[] {
  return handles.filter((h) => !ADMIN_HANDLES.includes(h) && h !== "minhonovazen");
}

export type BanIdRecord = { id: string; handle?: string; reason?: string; at?: number };

/** Strip admin + malformed entries from the userId ban records list. */
export function sanitizeBannedIdRecords(input: unknown[]): BanIdRecord[] {
  const out: BanIdRecord[] = [];
  for (const raw of Array.isArray(input) ? input : []) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const id = String(r.id ?? "").trim().slice(0, 64);
    if (!id) continue;
    if (ADMIN_IDS.includes(id)) continue;
    out.push({
      id,
      handle: typeof r.handle === "string" ? r.handle.trim().slice(0, 40) : undefined,
      reason: typeof r.reason === "string" ? r.reason.trim().slice(0, 200) : undefined,
      at: Number.isFinite(Number(r.at)) ? Number(r.at) : Date.now(),
    });
  }
  return out;
}

export const PROTECTED_SELF_FIELDS = [
  "id",
  "username",
  "previousUsernames",
  "usernameConflict",
  "subscription",
  "welcomeFreeClaimed",
  "welcomePlansSeen",
  "lastKnownIp",
  "lastSeenAt",
  "stats",
  "rankOverride",
  // Authorisation is resolved from the `userRoles` KV map keyed on the Discord
  // id, so these two never grant anything — they are blocked so no client can
  // render a self-granted admin badge or become the reason a future code path
  // starts trusting the profile row.
  "role",
  "isAdmin",
  // Set only by an admin decision in posterApproval.ts. Controls whether this
  // account may publish offers.
  "posterApprovedAt",
] as const;

/**
 * Fields the server records by observation, never by client assertion.
 *
 * A subset of `PROTECTED_SELF_FIELDS` — that list also covers fields a player
 * legitimately edits (their subscription, their stats), which is why it cannot be
 * reused as-is when a privileged write has to restore the stored value. These are
 * the ones written in exactly one place, from the server's own view of the
 * request, and stripped from everyone else's rows before the payload leaves
 * `filterDataForUser`. A client therefore never holds a truthful copy of another
 * account's, and persisting its copy would erase what the server recorded.
 */
const SERVER_OBSERVED_USER_FIELDS = ["lastSeenAt", "lastKnownIp"] as const;

const SECRET_CLUB_ONLY_FIELDS = ["profileGif", "profileGifThumb", "banner"] as const;
const SELF_IMAGE_URL_FIELDS = ["customAvatar", "profileGif", "profileGifThumb", "banner"] as const;
const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const GRADIENT_COLOR_RE = /^linear-gradient\(90deg,\s*#[0-9a-fA-F]{3,6},\s*#[0-9a-fA-F]{3,6}\)$/;

/** Only allow http(s) URLs or same-origin relative paths for image fields — blocks data:/javascript: and protocol-relative storage. */
export function sanitizeUrlField(value: unknown, max = 800): string | undefined {
  if (typeof value !== "string") return undefined;
  const s = value.trim();
  if (!s) return undefined;
  if (!/^(?:https?:\/\/|\/(?!\/))/i.test(s)) return undefined;
  return s.slice(0, max);
}

export function sanitizeHexColor(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const s = value.trim();
  if (!HEX_COLOR_RE.test(s) && !GRADIENT_COLOR_RE.test(s)) return undefined;
  return s;
}

export function isAdminUser(userId: string, _handle: string) {
  // ID only — the handle is renameable, so matching on it let an outsider
  // become admin by renaming their account. See `isLegacyAdmin` in `roles.ts`.
  return ADMIN_IDS.includes(String(userId));
}

/** Strip fields users must not change via bulk /api/data writes. */
function sanitizeSelfUserRecord(existing: Record<string, unknown>, incoming: Record<string, unknown>) {
  const merged = { ...incoming };
  for (const field of PROTECTED_SELF_FIELDS) {
    // Unconditional, deliberately. The previous `if (existing[field] !== undefined)`
    // guard meant a field absent from a legacy row was skipped entirely, leaving
    // it self-writable — that is how a fresh account could hand itself a rank.
    // Assigning even when undefined makes the key disappear from the stored JSON
    // instead, so a field the server has never set can never be set by the client.
    merged[field] = existing[field];
  }
  if ("team" in incoming) {
    merged.team = sanitizeTeam(incoming.team, String(existing.id ?? ""));
  }
  if ("nameColor" in merged) {
    if (merged.nameColor === null || merged.nameColor === "") {
      merged.nameColor = undefined;
    } else {
      const c = sanitizeHexColor(merged.nameColor);
      if (c === undefined) delete merged.nameColor;
      else merged.nameColor = c;
    }
  }
  if ("displayName" in merged && merged.displayName != null) {
    merged.displayName = String(merged.displayName).trim().slice(0, 40) || undefined;
  }
  if ("bannerDisabled" in merged) {
    merged.bannerDisabled = merged.bannerDisabled === true;
  }
  if ("offerNotificationSettings" in merged) {
    const settings = merged.offerNotificationSettings;
    const validCategories = new Set(["dungeon", "raid", "leveling"]);
    if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
      delete merged.offerNotificationSettings;
    } else {
      const raw = settings as Record<string, unknown>;
      merged.offerNotificationSettings = {
        mutedAll: raw.mutedAll === true,
        mutedCategories: Array.isArray(raw.mutedCategories)
          ? [...new Set(raw.mutedCategories.map((v) => String(v).toLowerCase()).filter((v) => validCategories.has(v)))].slice(0, 4)
          : [],
      };
    }
  }
  for (const field of SELF_IMAGE_URL_FIELDS) {
    if (field in merged) {
      const url = sanitizeUrlField(merged[field]);
      if (url === undefined) delete merged[field];
      else merged[field] = url;
    }
  }

  return merged;
}

/**
 * Validate team: { name?, members?: { id, name, avatar, status, inviteNotifId }[], lastRenameAt? }.
 * Max 4 total INCLUDING the owner → max 3 non-owner members; members must not be the owner.
 * Members marked "pending" are invites awaiting the player's accept.
 */
export function sanitizeTeam(input: unknown, ownerId: string): Record<string, unknown> | undefined {
  if (input === null || input === undefined) return undefined;
  if (typeof input !== "object" || Array.isArray(input)) return undefined;

  const raw = input as Record<string, unknown>;
  const name = String(raw.name ?? "").trim().slice(0, 40);
  const members = Array.isArray(raw.members)
    ? raw.members
        .filter((m: any) => m && typeof m === "object")
        .map((m: any) => ({
          id: String(m.id ?? m.userId ?? "").trim().slice(0, 64),
          name: String(m.name ?? "").trim().slice(0, 40),
          avatar: String(m.avatar ?? "").trim().slice(0, 500),
          status: String(m.status ?? "confirmed") === "pending" ? "pending" : "confirmed",
          ...(Number(m.inviteNotifId) && !Number.isNaN(Number(m.inviteNotifId))
            ? { inviteNotifId: Number(m.inviteNotifId) }
            : {}),
        }))
        .filter((m: any) => m.id && m.id !== String(ownerId))
        .slice(0, 3)
    : [];

  const seen = new Set<string>();
  const uniqueMembers = members.filter((m: any) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });

  if (!name && uniqueMembers.length === 0) return undefined;
  const team: Record<string, unknown> = { name, members: uniqueMembers };
  if (Number(raw.lastRenameAt) && !Number.isNaN(Number(raw.lastRenameAt))) {
    team.lastRenameAt = Number(raw.lastRenameAt);
  }
  return team;
}

function validateUserTicketUpdate(existing: Record<string, unknown>, updated: Record<string, unknown>, userId: string): ValidateResult {
  if (String(updated.userId) !== String(existing.userId)) {
    return { ok: false, error: "Cannot change ticket owner" };
  }
  if (updated.subject !== existing.subject) {
    return { ok: false, error: "Cannot change ticket subject" };
  }
  if (existing.createdAt !== undefined && updated.createdAt !== existing.createdAt) {
    return { ok: false, error: "Cannot change ticket timestamp" };
  }
  if (existing.expiresAt !== undefined && updated.expiresAt !== existing.expiresAt) {
    return { ok: false, error: "Cannot change ticket expiry" };
  }
  if (updated.status === "closed" && existing.status === "open") {
    return { ok: false, error: "Cannot close ticket" };
  }

  const exMsgs = (existing.messages as Record<string, unknown>[]) || [];
  const upMsgs = (updated.messages as Record<string, unknown>[]) || [];
  if (upMsgs.length < exMsgs.length) {
    return { ok: false, error: "Cannot remove ticket messages" };
  }
  if (JSON.stringify(upMsgs.slice(0, exMsgs.length)) !== JSON.stringify(exMsgs)) {
    return { ok: false, error: "Cannot modify existing ticket messages" };
  }
  for (const m of upMsgs.slice(exMsgs.length)) {
    if (String(m.fromId) !== String(userId)) {
      return { ok: false, error: "Cannot impersonate in tickets" };
    }
  }
  return { ok: true, value: updated };
}

function validateNewUserTicket(ticket: Record<string, unknown>, userId: string): ValidateResult {
  if (String(ticket.userId) !== String(userId)) {
    return { ok: false, error: "Cannot create tickets for other users" };
  }
  const msgs = (ticket.messages as Record<string, unknown>[]) || [];
  if (msgs.some((m) => String(m.fromId) !== String(userId))) {
    return { ok: false, error: "Invalid ticket message author" };
  }
  return { ok: true, value: ticket };
}

type ValidateResult =
  | { ok: true; value: unknown }
  | { ok: false; error: string; fraudAttempt?: { userId: string; lobbyId: string } };

function memberUserId(member: { applicantId?: string; userId?: string; id?: string }) {
  return String(member.applicantId || member.userId || member.id || "");
}

/**
 * Fields only the server (or an admin) may set, whoever is writing — the
 * offer's identity and the markers that decide whether a payout mints rank.
 * Clamped back to the stored value rather than rejecting the save, so a client
 * that still sends them (or a hand-rolled request) has the forgery discarded
 * without losing the rest of a legitimate write.
 */
const SERVER_OWNED_LOBBY_FIELDS = [
  "id",
  "ownerId",
  "rankAwardedPoster",
  "rankAwardedBooster",
  "createdAt",
] as const;

/** Identity of a member entry, stable across a rename. */
function memberKey(member: any): string {
  return String(member?.applicantId || member?.userId || member?.id || "");
}

/**
 * Restrict what a non-owner squad member may do to an offer.
 *
 * Deliberately narrow. An earlier version froze every lifecycle field
 * (`status`, `payoutStatus`, `runsCount`, `completedAt`, `roles`, `history`…)
 * for members, which looked right and broke six real flows: voting a dungeon
 * mission complete, completing a leveling run, failing a mission, the
 * foot-complete split, and the member-exit path. Members are supposed to drive
 * those outcomes — that is the whole point of a squad vote — so lifecycle
 * fields stay writable. What is closed here is the part with no legitimate
 * flow behind it:
 *
 *  - promoting yourself from `invited` into `accepted`, which granted
 *    `hasIndependentSquadMember` standing and thread access you had not been
 *    given;
 *  - adding rows to the roster that were never in it, which is how a member
 *    minted rank for accounts that did not play;
 *  - editing or discarding another member's row;
 *  - rewriting the vote arrays wholesale, which let one member delete the
 *    thread's votes, forge votes attributed to other players, and vote twice to
 *    cross the completion threshold on their own.
 *
 * Votes are now append-only and carry the caller's own id, one per player.
 */
function clampMemberWrite(ex: any, lobby: any, userId: string): any {
  const uid = String(userId);
  const next = { ...lobby };

  // Roster: the stored rows are the roster. The caller may drop their own row
  // (leaving) and may edit their own row, but cannot introduce anyone.
  if (Array.isArray(ex.accepted)) {
    const exAccepted = ex.accepted as any[];
    const nextAccepted = Array.isArray(next.accepted) ? (next.accepted as any[]) : exAccepted;
    const out: any[] = [];
    for (const m of nextAccepted) {
      const k = memberKey(m);
      const stored = exAccepted.find((s) => memberKey(s) === k);
      // Their own row, but only if the store already had it. An `invited` member
      // adding a row keyed to themselves is the self-promotion case: it is
      // dropped here, and dropping their own stored row is how they leave.
      if (k === uid) {
        if (stored) out.push(m);
        continue;
      }
      // A row the store never had is an addition, not an edit.
      if (!stored) continue;
      // Someone else's row is not theirs to change. Revert it to what is stored
      // rather than dropping it — dropping would quietly remove a squad member
      // from the offer, which is a different kind of corruption.
      out.push(JSON.stringify(m) === JSON.stringify(stored) ? m : stored);
    }
    next.accepted = out;
  }

  // Votes: append-only, self-authored, one per player. Mirrors the shape
  // `validateUserTicketUpdate` already enforces on mod threads.
  for (const field of ["votes", "failVotes"] as const) {
    const exVotes = Array.isArray(ex[field]) ? (ex[field] as any[]) : [];
    const nextVotes = Array.isArray(next[field]) ? (next[field] as any[]) : exVotes;
    if (nextVotes.length <= exVotes.length) {
      // Shrinking or rewriting in place is never a member's to do.
      next[field] = exVotes;
      continue;
    }
    const seen = new Set(exVotes.map((v) => String(memberUserId(v) || v?.userId || "")));
    const kept = nextVotes.filter((v) => {
      const who = String(memberUserId(v) || v?.userId || "");
      if (who !== uid) return false; // no votes on anyone else's behalf
      if (seen.has(who)) return false; // one vote per player
      seen.add(who);
      return true;
    });
    next[field] = [...exVotes, ...kept];
  }

  return next;
}

/**
 * True when the only thing that moved is the caller's own row in `applicants`
 * — applying, withdrawing, or editing their own note.
 *
 * Everything else has to be byte-identical: the rest of the lobby, and every
 * other applicant's row. Without this an applicant could rewrite `accepted`,
 * `status` or `payoutStatus` and walk straight into the squad.
 */
function isSelfApplicantScopedChange(ex: any, lobby: any, userId: string): boolean {
  const uid = String(userId);
  const exApplicants = (ex.applicants || []) as any[];
  const nextApplicants = (lobby.applicants || []) as any[];
  const exOwn = exApplicants.find((a) => memberUserId(a) === uid);
  const nextOwn = nextApplicants.find((a) => memberUserId(a) === uid);
  if (!exOwn && !nextOwn) return false;

  const stripApplicants = (l: any) => {
    const { applicants: _a, ...rest } = l;
    return rest;
  };
  if (JSON.stringify(stripApplicants(ex)) !== JSON.stringify(stripApplicants(lobby))) return false;

  // Other applicants' rows must be untouched; only our own may differ.
  const withoutSelf = (rows: any[]) => rows.filter((a) => memberUserId(a) !== uid);
  return JSON.stringify(withoutSelf(exApplicants)) === JSON.stringify(withoutSelf(nextApplicants));
}

function lobbyUserCanModify(
  lobby: { ownerId?: string; accepted?: { id?: string; applicantId?: string; userId?: string }[]; invited?: { id?: string; applicantId?: string; userId?: string }[]; applicants?: { id?: string; applicantId?: string; userId?: string }[] },
  userId: string,
  isAdmin: boolean
) {
  if (isAdmin) return true;
  if (String(lobby.ownerId) === String(userId)) return true;
  if ((lobby.accepted || []).some((m) => memberUserId(m) === String(userId))) return true;
  if ((lobby.invited || []).some((m) => memberUserId(m) === String(userId))) return true;
  // Applicants are deliberately NOT listed here. They are not part of the
  // mission, so they get no write access to the lobby itself — only the
  // narrow self-scoped change handled in validateLobbies.
  return false;
}

export function validateRegisteredUsers(
  existing: unknown[],
  incoming: unknown,
  userId: string,
  isAdmin: boolean
): ValidateResult {
  if (!Array.isArray(incoming)) return { ok: false, error: "Invalid registeredUsers" };

  // Two accounts may never share a Discord handle — that ambiguity is exactly
  // what makes a rename look like a brand new player.
  const duplicate = findDuplicateUsernames(incoming as PlayerRecord[]);
  if (duplicate.length) {
    return { ok: false, error: `Username already in use: ${duplicate[0].username}` };
  }

  if (isAdmin) {
    // An admin owns the roster's editorial fields — subscriptions, approvals,
    // rank overrides, bans — but not the ones the server observes. Those are
    // listed in `PROTECTED_SELF_FIELDS` precisely so no client can assert them,
    // and the admin payload never carried another account's copy of them anyway:
    // `filterDataForUser` computes `online` and then strips `lastSeenAt` and
    // `lastKnownIp` from everyone else, which is how presence is kept from
    // being spoofable.
    //
    // Returning the payload verbatim therefore deleted every other player's
    // presence. It is asymmetric, and that is what made it hard to spot: the
    // admin's own row keeps its timestamp, so the account doing the saving still
    // read as online while the rest of the roster went dark — in the DM list and
    // in Online Now alike, since both render the same server-computed flag.
    //
    // So restore the server-owned fields from the stored row and take everything
    // else from the admin. Presence is stamped in `touchUserLastIp` and nowhere
    // else, and it stays a server observation.
    const storedById = new Map(existing.map((u: any) => [String(u.id), u]));
    return {
      ok: true,
      value: (incoming as any[]).map((user) => {
        const stored = storedById.get(String(user?.id));
        if (!stored) return user;
        const restored: Record<string, unknown> = { ...user };
        for (const field of SERVER_OBSERVED_USER_FIELDS) {
          if (stored[field] !== undefined) restored[field] = stored[field];
          else delete restored[field];
        }
        // `online` is derived from `lastSeenAt` on every read, so persisting the
        // client's copy would only leave a stale boolean on the row.
        delete restored["online"];
        return restored;
      }),
    };
  }

  const existingById = new Map(existing.map((u: any) => [String(u.id), u]));
  const sanitized = (incoming as any[]).map((user) => {
    if (String(user.id) !== String(userId)) {
      const ex = existingById.get(String(user.id));
      const { stats: _stats, ...rest } = user;
      return { ...rest, ...(ex && ex.stats ? { stats: ex.stats } : {}) };
    }
    const ex = existingById.get(String(userId));
    if (!ex) return user;
    return sanitizeSelfUserRecord(ex as Record<string, unknown>, user as Record<string, unknown>);
  });
  const incomingById = new Map(sanitized.map((u: any) => [String(u.id), u]));

  for (const user of sanitized) {
    const ex = existingById.get(String(user.id));
    if (!ex) {
      if (String(user.id) !== String(userId)) return { ok: false, error: "Cannot register other users" };
      continue;
    }
    // Another account's row is not the caller's to change, and a difference in
    // it is not a reason to fail their save. The client keeps a snapshot of the
    // roster, so the moment anybody else edited their profile the stored row
    // stopped matching and every profile save came back "Cannot modify other
    // users". Their copy is dropped below and the stored row is kept.
  }

  for (const [id] of existingById) {
    if (!incomingById.has(id) && id !== String(userId)) {
      return { ok: false, error: "Cannot remove users" };
    }
  }

  // Only the caller's own row may change; everyone else's is written back
  // exactly as stored, which is what actually enforces the ownership rule.
  const owned = (sanitized as any[]).map((u) => {
    const ex = existingById.get(String(u.id));
    if (ex && String(u.id) !== String(userId)) return ex;
    return u;
  });

  return { ok: true, value: owned };
}

/**
 * Inline media lives on the message objects inside the single `lobbies` blob, so
 * its size is a memory cost paid by every read of that blob. Anything past this
 * is refused outright — the client is expected to downscale before sending.
 */
const MAX_INLINE_MEDIA_CHARS = 400 * 1024;

const LOBBY_MEDIA_FIELDS = ["image", "paymentProof"] as const;
const MESSAGE_MEDIA_FIELDS = ["image", "avatar", "customAvatar", "profileGif", "activeVfx"] as const;

function isInlineMedia(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("data:") && value.length > MAX_INLINE_MEDIA_CHARS;
}

/** Drop or replace oversized inline media rather than persisting it. */
function clampInlineMedia(lobby: any, stored: any): any {
  let next = lobby;

  const messages = Array.isArray(next.messages) ? next.messages : null;
  if (messages) {
    const storedMessages = Array.isArray(stored?.messages) ? stored.messages : [];
    let changed = false;
    const clamped = messages.map((m: any, i: number) => {
      if (!m || typeof m !== "object") return m;
      let out = m;
      for (const field of MESSAGE_MEDIA_FIELDS) {
        if (!isInlineMedia(out[field])) continue;
        const prior = storedMessages[i]?.[field];
        if (typeof prior === "string" && !isInlineMedia(prior)) {
          out = { ...out, [field]: prior };
        } else {
          const { [field]: _dropped, ...rest } = out;
          out = rest;
        }
        changed = true;
      }
      return out;
    });
    if (changed) next = { ...next, messages: clamped };
  }

  for (const field of LOBBY_MEDIA_FIELDS) {
    if (!isInlineMedia(next[field])) continue;
    const prior = stored?.[field];
    if (typeof prior === "string" && !isInlineMedia(prior)) {
      next = { ...next, [field]: prior };
    } else {
      const { [field]: _dropped, ...rest } = next;
      next = rest;
    }
  }

  return next;
}

export function validateLobbies(
  existing: unknown[],
  incoming: unknown,
  userId: string,
  isAdmin: boolean
): ValidateResult {
  if (!Array.isArray(incoming)) return { ok: false, error: "Invalid lobbies" };
  if (isAdmin) return { ok: true, value: incoming };

  const existingById = new Map((existing as any[]).map((l) => [String(l.id), l]));
  // Own lobbies the caller deliberately dropped, and so really did delete.
  const deletedOwn = new Set<string>();

  for (const [id, ex] of existingById) {
    if ((incoming as any[]).some((l) => String(l.id) === id)) continue;
    if (String((ex as any).ownerId) === String(userId)) {
      // Their own, and it is gone from the payload: a real delete.
      if (!canOwnerCancelLobby(ex)) {
        return { ok: false, error: "Cannot delete lobby with active squad or mission progress" };
      }
      deletedOwn.add(id);
      continue;
    }
    // A lobby the caller does NOT own and left out was never in their payload.
    // The thread page reads one offer's family, not the whole site, so a save
    // from there legitimately omits every other player's offers. Treating that
    // as a delete rejected the write with "Cannot delete lobby you do not
    // own", which is why "Start Mission" silently did nothing: the status
    // change was never stored. These are carried over untouched below.
  }

  for (const lobby of incoming as any[]) {
    const ex = existingById.get(String(lobby.id));
    if (!ex) {
      if (String(lobby.ownerId) === String(userId)) continue;
      const parent = lobby.parentId ? existingById.get(String(lobby.parentId)) : undefined;
      if (lobby.resurrected && parent && lobbyUserCanModify(parent, userId, isAdmin)) {
        continue;
      }
      return { ok: false, error: "Cannot create lobby for another user" };
    }
    // A lobby the caller may not touch is NOT an error — their copy of it is
    // simply dropped below and the stored version is kept. Rejecting here used
    // to fail the entire save, and since the client PUTs the whole array it
    // holds, every other player's offer sat in the payload: any difference
    // (the client reads a copy without private fields such as `messages`) made
    // the whole request fail with "Cannot modify lobby you are not part of", so
    // a player could not add an offer of their own at all.
    //
    // Keeping the stored copy is stricter than the check it replaces, not
    // looser: even a byte-identical forgery of a foreign offer is now ignored.
    if (JSON.stringify(lobby) === JSON.stringify(ex)) continue;
    if (lobbyUserCanModify(ex, userId, isAdmin)) {
      const justPaid =
        ex &&
        !(ex.status === "completed" && ex.payoutStatus === "paid") &&
        lobby.status === "completed" &&
        lobby.payoutStatus === "paid";
      // A solo payout is refused: it is the one write that mints rank for a run
      // nobody else was in. The offer's own records count as proof that a squad
      // really played, because the roster empties out the moment the last member
      // leaves — an `unpaid` offer with nobody on it is the normal shape of a
      // finished mission, not a fraud signal, and it is the owner of that
      // mission who is stuck unable to settle it.
      if (justPaid && !hasIndependentSquadMember(lobby) && !hasRealMissionEvidence(lobby)) {
        return {
          ok: false,
          error: "Payment rejected: this offer has no record of another player. If the mission did run, ask an admin to check the audit log.",
          fraudAttempt: { userId, lobbyId: String(lobby.id) },
        };
      }
      // An offer may not be started while the owner is the only member. The
      // squad roster is the point of these missions: starting alone papered a
      // solo "run" as a real one, minted rank out of nothing, and when the
      // server closed the hole on read the started status silently reverted on
      // the next refresh. Reject the transition outright instead.
      //
      // Only a move INTO a live mission is a start. A finished offer keeps the
      // records of the mission it ran — its start time, its completion votes —
      // and settling that offer is not a new start; treating the carried-over
      // `missionStartTime` as one refused the payout of a mission that plainly
      // happened, and told its owner they had tried to start one alone. Same
      // for an offer already stored with a start time: that start was vetted
      // when it happened.
      const justStarted =
        !FINISHED_OFFER_STATUSES.has(String(lobby.status || "standby")) &&
        !(ex?.status === "in_progress" && ex?.missionStartTime) &&
        !ex?.missionStartTime &&
        (lobby.status === "in_progress" || !!lobby.missionStartTime) &&
        !isAdmin;
      if (justStarted && !hasIndependentSquadMember(lobby)) {
        return {
          ok: false,
          error: "Cannot start a mission without another member in the squad.",
        };
      }
      continue;
    }
    // An applicant withdrawing their own application is the one narrow change
    // they are allowed; anything else they send about a foreign offer is
    // discarded.
    if (isSelfApplicantScopedChange(ex, lobby, userId)) continue;
  }

  const sanitized = (incoming as any[]).map((lobby) => {
    const ex = existingById.get(String(lobby.id));
    // Not ours to write: keep what the store already holds, drop the caller's
    // copy entirely. See the note in the loop above.
    if (ex && !lobbyUserCanModify(ex, userId, isAdmin) && !isSelfApplicantScopedChange(ex, lobby, userId)) {
      return ex;
    }
    let next = lobby;
    // Server-owned identity fields and rank markers are never the client's to
    // set, whoever is writing — the rank markers in particular decide whether a
    // payout mints rank, and the payout state is what the payment flow reads.
    if (ex) {
      for (const f of SERVER_OWNED_LOBBY_FIELDS) {
        if (f in (ex as any) && JSON.stringify((next as any)[f]) !== JSON.stringify((ex as any)[f])) {
          (next as any)[f] = (ex as any)[f];
        }
      }
    } else if (!isAdmin) {
      // A brand-new offer takes its creation time from the server clock, not the
      // request. `createdAt` is what decides whether an offer predates the rank
      // proof ledger (see `proofRequiredFor`): offers older than the cutover are
      // settled on the legacy roster marks, because their members joined through
      // paths that predate the ledger. A client-chosen timestamp would let an
      // owner date an offer backwards into that window and mint rank from a
      // roster of strangers. Existing rows are untouched — this branch only runs
      // when the store has no row with this id.
      next = { ...next, createdAt: Date.now() };
    }
    // A member of the squad is not the owner: freeze every lifecycle field.
    const isOwner = ex && String((ex as any).ownerId) === String(userId);
    if (ex && !isOwner && !isAdmin) {
      next = clampMemberWrite(ex, next, userId);
    }
    if (ex && JSON.stringify(lobby.detectedRuns || []) !== JSON.stringify(ex.detectedRuns || [])) {
      next = { ...next, detectedRuns: ex.detectedRuns || [] };
    }
    // Server-side backstop for inline media. Chat images and payment proofs are
    // stored as data URLs on the message, inside this one blob, and a large
    // paste made every later read of it exceed the worker's memory limit
    // (Error 1102). The client downscales on paste; this keeps an old client, or
    // a hand-rolled request, from writing an unbounded blob. An image that is
    // still too big after a pass is replaced by the stored one if we have it,
    // and otherwise dropped rather than persisted.
    next = clampInlineMedia(next, ex);
    if (Array.isArray(next.applicants) && next.applicants.length) {
      next = {
        ...next,
        applicants: next.applicants.map((a: any) => ({
          ...a,
          applicantNote: a.applicantNote != null ? sanitizeApplicantNote(a.applicantNote) : a.applicantNote,
        })),
      };
    }
    return next;
  });

  // Carry over the lobbies the caller never had in their payload. Without this
  // the value written back to the store is whatever subset the client held, so
  // every offer outside the caller's view would be wiped by any save they made.
  const keptIds = new Set(sanitized.map((l: any) => String(l.id)));
  for (const [id, ex] of existingById) {
    if (keptIds.has(id) || deletedOwn.has(id)) continue;
    sanitized.push(ex);
  }

  return { ok: true, value: sanitized };
}

/** A game character (`game:<id>`) may only ever be linked to one account. */
function isGameCharId(id: string): boolean {
  return typeof id === "string" && id.startsWith("game:");
}

/** A row that represents a verified in-game character, whichever id spelling it
 *  uses. `isGameCharId` on the raw id was not enough: rows written before the
 *  `game:` prefix store the bare character id in `id`, so every ownership rule
 *  keyed on the raw id silently skipped them. Two accounts could then both
 *  claim the same in-game character by using the bare form — the roster looked
 *  fine in the UI (which deduped per account) while the store held the
 *  character twice. Every check below now keys on the resolved character id. */
function isVerifiedGameChar(ch: any): boolean {
  return isGameCharId(String(ch?.id || "")) || Boolean(gameCharIdOf(ch));
}

/**
 * Only Global characters may be stored.
 *
 * The site verifies against the Global region exclusively (`AION2_GAME_REGION`).
 * A Taiwan/KR row is therefore either a leftover from an earlier build or a
 * forged write, and neither belongs in the roster: it renders the wrong region
 * badge, its portrait points at a different game's image host, and it consumes
 * one of the per-account slots a real Global character needs.
 */
function isGlobalChar(ch: any): boolean {
  const region = String(ch?.region || "").toLowerCase();
  if (!region) return true; // pre-region site rows were never region-scoped
  return region === "global";
}

export function validateCharacters(
  existing: unknown[],
  incoming: unknown,
  userId: string,
  isAdmin: boolean
): ValidateResult {
  if (!Array.isArray(incoming)) return { ok: false, error: "Invalid characters" };

  const incomingAll = incoming as any[];

  // Region gate applies to everyone, admin included: this is a data-cleanliness
  // rule, not a permission. Non-Global rows are dropped rather than rejected so
  // the purge cannot be blocked by a client that still echoes an old roster back.
  const globalOnly = incomingAll.filter(isGlobalChar);

  if (isAdmin) return { ok: true, value: globalOnly };

  const existingById = new Map((existing as any[]).map((c) => [String(c.id), c]));
  // Ownership is tracked by resolved character id, so the bare-id form cannot
  // slip a second claim past the rule below.
  const existingOwnerByChar = new Map<string, string>();
  for (const c of existing as any[]) {
    const key = gameCharIdOf(c);
    if (!key) continue;
    if (!existingOwnerByChar.has(key)) existingOwnerByChar.set(key, String(c.userId || ""));
  }

  for (const ch of globalOnly) {
    const id = String(ch.id || "");
    if (!id) continue;
    if (isVerifiedGameChar(ch) && String(ch.userId) !== String(userId)) {
      // Only an attempt to *add* a verified character on someone else's behalf is
      // a forgery. One that is already in the store is just the roster being
      // echoed back, and rejecting it blocked every save — see below.
      const key = gameCharIdOf(ch);
      const known = key ? existingOwnerByChar.get(key) : undefined;
      if (!existingById.has(id) && (key === undefined || known === undefined)) {
        return { ok: false, error: "Cannot add characters for other users" };
      }
    }
  }

  const seenOwners = new Map<string, string>();
  for (const ch of globalOnly) {
    if (!isVerifiedGameChar(ch)) continue;
    const key = gameCharIdOf(ch);
    if (!key) continue;
    const owner = String(ch.userId || "");
    const prev = seenOwners.get(key);
    if (prev !== undefined && prev !== owner) {
      return { ok: false, error: "The same in-game character cannot be linked to two accounts" };
    }
    seenOwners.set(key, owner);
  }

  for (const ch of globalOnly) {
    const ex = existingById.get(String(ch.id));
    if (!ex) {
      if (String(ch.userId) !== String(userId)) return { ok: false, error: "Cannot add characters for other users" };
      continue;
    }
    // A character owned by somebody else is not an error — it is simply not the
    // caller's to change. Rejecting here made it impossible for anyone to link
    // a game character at all: `saveVerifiedCharacterEntry` POSTs the whole
    // public roster back, so one `game:` character belonging to another account
    // failed every save with "This in-game character is already linked to
    // another account". The caller's copy is dropped below and the stored one
    // is kept, which is also what stops a claim from succeeding.
    if (String(ex.userId) === String(userId)) continue;
  }

  for (const [id, ex] of existingById) {
    // Rows the region gate is dropping are not "deleted by this caller" — they
    // are purged for everyone. Counting them here let one leftover Taiwan row
    // owned by a different account fail every save on the site, because
    // `saveVerifiedCharacterEntry` posts the whole public roster back.
    if (!isGlobalChar(ex)) continue;
    if (!globalOnly.some((c) => String(c.id) === id) && String((ex as any).userId) !== String(userId)) {
      return { ok: false, error: "Cannot delete other users' characters" };
    }
  }

  // Anyone else's character is written back untouched. Keeping the stored copy
  // is what actually enforces ownership — a forged or edited copy of a foreign
  // character is discarded rather than rejected, so it can never land.
  const sanitized = globalOnly.map((ch) => {
    const ex = existingById.get(String(ch.id));
    if (ex && String((ex as any).userId) !== String(userId)) return ex;
    return ch;
  });

  return { ok: true, value: sanitized };
}

export function validateNotifications(
  existing: unknown[],
  incoming: unknown,
  userId: string,
  handle: string,
  isAdmin: boolean
): ValidateResult {
  if (!Array.isArray(incoming)) return { ok: false, error: "Invalid notifications" };
  if (isAdmin) return { ok: true, value: incoming };

  const existingById = new Map((existing as any[]).map((n) => [n.id, n]));

  // Party membership, checked per side: the stable id when the row has one,
  // the handle otherwise. A row written before a rename still names an older
  // handle, so a handle-only test would lock its owner out of it.
  const sideIsMine = (id: unknown, rowHandle: unknown): boolean => {
    const rowId = String(id ?? "");
    if (rowId) return rowId === String(userId);
    return normRef(rowHandle) === normRef(handle);
  };
  const isParty = (n: any): boolean =>
    sideIsMine(n?.toUserId, n?.toUser) || sideIsMine(n?.fromUserId, n?.fromHandle);

  for (const n of incoming as any[]) {
    const ex = existingById.get(n.id);
    if (!ex) {
      if (!isParty(n)) return { ok: false, error: "Cannot create notifications for other users" };
      continue;
    }
    // The party test has to be run against the STORED row, not against the row
    // the caller just sent. Testing the incoming copy meant an attacker could
    // stamp their own id onto `toUserId` on someone else's notification, make
    // the forged copy "theirs", and rewrite or re-address any notification in
    // the store — including the text and the target.
    if (JSON.stringify(n) !== JSON.stringify(ex) && !isParty(ex)) {
      return { ok: false, error: "Cannot modify notifications you are not part of" };
    }
  }

  for (const [id, ex] of existingById) {
    if (!(incoming as any[]).some((n) => n.id === id)) {
      if (!isParty(ex)) {
        return { ok: false, error: "Cannot delete notifications you are not part of" };
      }
    }
  }

  return { ok: true, value: incoming };
}

export function validateTickets(
  existing: unknown[],
  incoming: unknown,
  userId: string,
  isAdmin: boolean
): ValidateResult {
  if (!Array.isArray(incoming)) return { ok: false, error: "Invalid tickets" };
  if (isAdmin) return { ok: true, value: incoming };

  const existingById = new Map((existing as any[]).map((t) => [t.id, t]));

  for (const t of incoming as any[]) {
    const ex = existingById.get(t.id);
    if (!ex) {
      const created = validateNewUserTicket(t, userId);
      if (!created.ok) return created;
      continue;
    }
    if (JSON.stringify(t) !== JSON.stringify(ex)) {
      if (String((ex as any).userId) !== String(userId)) {
        return { ok: false, error: "Cannot modify other users' tickets" };
      }
      const updated = validateUserTicketUpdate(ex, t, userId);
      if (!updated.ok) return updated;
    }
  }

  for (const [id, ex] of existingById) {
    if (!(incoming as any[]).some((t) => t.id === id) && String((ex as any).userId) !== String(userId)) {
      return { ok: false, error: "Cannot delete other users' tickets" };
    }
  }

  return { ok: true, value: incoming };
}

export function validateGoldOffers(
  existing: unknown[],
  incoming: unknown,
  userId: string,
  isAdmin: boolean
): ValidateResult {
  if (!Array.isArray(incoming)) return { ok: false, error: "Invalid goldOffers" };
  if (isAdmin) return { ok: true, value: incoming };

  const existingById = new Map((existing as any[]).map((g, i) => [g.id ?? i, g]));

  for (let i = 0; i < (incoming as any[]).length; i++) {
    const offer = (incoming as any[])[i];
    const key = offer.id ?? i;
    const ex = existingById.get(key);
    if (!ex) {
      if (offer.userId && String(offer.userId) !== String(userId) && offer.ownerId && String(offer.ownerId) !== String(userId)) {
        return { ok: false, error: "Cannot create gold offers for other users" };
      }
      continue;
    }
    if (JSON.stringify(offer) !== JSON.stringify(ex)) {
      const owner = (ex as any).userId || (ex as any).ownerId;
      if (owner && String(owner) !== String(userId)) {
        return { ok: false, error: "Cannot modify other users' gold offers" };
      }
    }
  }

  return { ok: true, value: incoming };
}

async function enforceOfferDailyLimitsOnLobbyWrites(
  existing: any[],
  incoming: any[],
  userId: string,
  isAdmin: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isAdmin) return { ok: true };
  const existingById = new Map(existing.map((l) => [String(l.id), l]));
  const uid = String(userId);

  const creations = incoming.filter((l) => !existingById.has(String(l.id)) && String(l.ownerId) === uid);

  // The posting gate has to be enforced here too, not only in PUT /api/lobbies.
  // This is the bulk-write path, so without it an unapproved account simply
  // posts through /api/data and the approval gate is decoration.
  if (creations.length > 0) {
    const registeredUsers: any[] = (await getKV("registeredUsers")) as any[];
    const me = (registeredUsers || []).find((u) => String(u.id) === uid);
    const standing = await getPosterStanding(me, undefined, existing.filter((l) => String(l?.ownerId) === uid).length);
    if (!standing.allowed) {
      return { ok: false, error: "Posting is by approval only." };
    }
  }

  for (const lobby of incoming) {
    const ex = existingById.get(String(lobby.id));
    if (!ex && String(lobby.ownerId) === uid) {
      const check = await checkAndRecordOfferCreate(uid, false);
      if (!check.ok) return check;
      continue;
    }
    if (!ex) continue;
    const exHad = (ex.applicants || []).some((a: any) => memberUserId(a) === uid);
    const nextHas = (lobby.applicants || []).some((a: any) => memberUserId(a) === uid);
    if (!exHad && nextHas) {
      const check = await checkAndRecordOfferApply(uid, false);
      if (!check.ok) return check;
    }
  }
  return { ok: true };
}

export async function validateDataWrites(
  updates: Record<string, unknown>,
  existing: Record<string, unknown>,
  userId: string,
  handle: string
): Promise<
  | { ok: true; sanitized: Record<string, unknown> }
  | { ok: false; error: string; fraudAttempt?: { userId: string; lobbyId: string } }
> {
  const isAdmin = isAdminUser(userId, handle);
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(updates)) {
    if (BLOCKED_KEYS.has(key)) {
      return { ok: false, error: `${key} must be updated through its dedicated API` };
    }
    if (ADMIN_ONLY_KEYS.has(key) && !isAdmin) {
      return { ok: false, error: "Admin only" };
    }

    let result: ValidateResult = { ok: true, value };

    switch (key) {
      case "registeredUsers":
        result = validateRegisteredUsers((existing.registeredUsers as unknown[]) || [], value, userId, isAdmin);
        break;
      case "lobbies": {
        result = validateLobbies((existing.lobbies as unknown[]) || [], value, userId, isAdmin);
        if (!result.ok) break;
        const limitCheck = await enforceOfferDailyLimitsOnLobbyWrites(
          (existing.lobbies as any[]) || [],
          result.value as any[],
          userId,
          isAdmin
        );
        if (!limitCheck.ok) return limitCheck;
        break;
      }
      case "characters":
        result = validateCharacters((existing.characters as unknown[]) || [], value, userId, isAdmin);
        break;
      case "notifications":
        result = validateNotifications((existing.notifications as unknown[]) || [], value, userId, handle, isAdmin);
        break;
      case "tickets":
        result = validateTickets((existing.tickets as unknown[]) || [], value, userId, isAdmin);
        break;
      case "goldOffers":
        result = validateGoldOffers((existing.goldOffers as unknown[]) || [], value, userId, isAdmin);
        break;
      case "bannedUsers":
        if (!Array.isArray(value)) return { ok: false, error: "Invalid bannedUsers" };
        result = { ok: true, value: stripAdminFromBanList(value as string[]) };
        break;
      case "bannedUserIds":
        result = { ok: true, value: sanitizeBannedIdRecords(value as unknown[]) };
        break;
      case "applications":
        if (!isAdmin) return { ok: false, error: "Admin only" };
        break;
      case "lobbyDataVersion":
        if (typeof value !== "number") return { ok: false, error: "Invalid lobbyDataVersion" };
        break;
      default:
        if (!isAdmin) return { ok: false, error: `Unknown or restricted key: ${key}` };
        break;
    }

    if (!result.ok) return result;
    sanitized[key] = result.value;
  }

  return { ok: true, sanitized };
}
