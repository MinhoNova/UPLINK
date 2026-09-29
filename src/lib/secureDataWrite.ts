import { isSecretClubTier } from "@/lib/userProfile";
import { findDuplicateUsernames, normRef, type PlayerRecord } from "@/lib/playerIdentity";
import { sanitizeApplicantNote } from "@/lib/applicantNote";
import { canOwnerCancelLobby, hasIndependentSquadMember } from "@/lib/lobbyLifecycle";
import { checkAndRecordOfferAction } from "@/lib/offerDailyLimit";

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

const PROTECTED_SELF_FIELDS = [
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
] as const;
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
    if (existing[field] !== undefined) merged[field] = existing[field];
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

  if (isAdmin) return { ok: true, value: incoming };

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

  const stripStats = (u: any) => {
    if (!u || typeof u !== "object") return u;
    const { stats: _stats, ...rest } = u;
    return rest;
  };

  for (const user of sanitized) {
    const ex = existingById.get(String(user.id));
    if (!ex) {
      if (String(user.id) !== String(userId)) return { ok: false, error: "Cannot register other users" };
      continue;
    }
    if (String(user.id) !== String(userId) && JSON.stringify(stripStats(user)) !== JSON.stringify(stripStats(ex))) {
      return { ok: false, error: "Cannot modify other users" };
    }
  }

  for (const [id] of existingById) {
    if (!incomingById.has(id) && id !== String(userId)) {
      return { ok: false, error: "Cannot remove users" };
    }
  }

  return { ok: true, value: sanitized };
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

  for (const [id, ex] of existingById) {
    if (!(incoming as any[]).some((l) => String(l.id) === id)) {
      if (String((ex as any).ownerId) !== String(userId)) {
        return { ok: false, error: "Cannot delete lobby you do not own" };
      }
      if (!canOwnerCancelLobby(ex)) {
        return { ok: false, error: "Cannot delete lobby with active squad or mission progress" };
      }
    }
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
      if (justPaid && !hasIndependentSquadMember(lobby)) {
        return {
          ok: false,
          error: "Payment rejected: requires another confirmed player. Account suspended for payment fraud attempt.",
          fraudAttempt: { userId, lobbyId: String(lobby.id) },
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
    if (ex && JSON.stringify(lobby.detectedRuns || []) !== JSON.stringify(ex.detectedRuns || [])) {
      next = { ...next, detectedRuns: ex.detectedRuns || [] };
    }
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

  return { ok: true, value: sanitized };
}

/** A game character (`game:<id>`) may only ever be linked to one account. */
function isGameCharId(id: string): boolean {
  return typeof id === "string" && id.startsWith("game:");
}

export function validateCharacters(
  existing: unknown[],
  incoming: unknown,
  userId: string,
  isAdmin: boolean
): ValidateResult {
  if (!Array.isArray(incoming)) return { ok: false, error: "Invalid characters" };
  if (isAdmin) return { ok: true, value: incoming };

  const existingById = new Map((existing as any[]).map((c) => [String(c.id), c]));

  for (const ch of incoming as any[]) {
    const id = String(ch.id || "");
    if (!id) continue;
    if (isGameCharId(id) && String(ch.userId) !== String(userId)) {
      // Only an attempt to *add* a `game:` character on someone else's behalf is
      // a forgery. One that is already in the store is just the roster being
      // echoed back, and rejecting it blocked every save — see below.
      if (!existingById.has(id)) {
        return { ok: false, error: "Cannot add characters for other users" };
      }
    }
  }

  const seenOwners = new Map<string, string>();
  for (const ch of incoming as any[]) {
    const id = String(ch.id || "");
    if (isGameCharId(id)) {
      const owner = String(ch.userId || "");
      const prev = seenOwners.get(id);
      if (prev !== undefined && prev !== owner) {
        return { ok: false, error: "The same in-game character cannot be linked to two accounts" };
      }
      seenOwners.set(id, owner);
    }
  }

  for (const ch of incoming as any[]) {
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
    if (!(incoming as any[]).some((c) => String(c.id) === id) && String((ex as any).userId) !== String(userId)) {
      return { ok: false, error: "Cannot delete other users' characters" };
    }
  }

  // Anyone else's character is written back untouched. Keeping the stored copy
  // is what actually enforces ownership — a forged or edited copy of a foreign
  // character is discarded rather than rejected, so it can never land.
  const sanitized = (incoming as any[]).map((ch) => {
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
    if (JSON.stringify(n) !== JSON.stringify(ex) && !isParty(n)) {
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
  registeredUsers: any[],
  isAdmin: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isAdmin) return { ok: true };
  const user = registeredUsers.find((u) => String(u.id) === String(userId));
  const existingById = new Map(existing.map((l) => [String(l.id), l]));
  const uid = String(userId);

  for (const lobby of incoming) {
    const ex = existingById.get(String(lobby.id));
    if (!ex && String(lobby.ownerId) === uid) {
      const check = await checkAndRecordOfferAction(uid, user);
      if (!check.ok) return check;
      continue;
    }
    if (!ex) continue;
    const exHad = (ex.applicants || []).some((a: any) => memberUserId(a) === uid);
    const nextHas = (lobby.applicants || []).some((a: any) => memberUserId(a) === uid);
    if (!exHad && nextHas) {
      const check = await checkAndRecordOfferAction(uid, user);
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
          (existing.registeredUsers as any[]) || [],
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
