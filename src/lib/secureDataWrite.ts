import { isSecretClubTier } from "@/lib/userProfile";
import { sanitizeApplicantNote } from "@/lib/applicantNote";

export const ADMIN_ID = "1497295886223544471";
export const ADMIN_HANDLE = "minhonovazen";

const BLOCKED_KEYS = new Set(["directMessages", "readMessages", "friends"]);
const ADMIN_ONLY_KEYS = new Set(["bannedUsers", "bannedIps"]);

/** Strip admin from ban lists — admin account must never be suspended. */
export function stripAdminFromBanList(handles: string[]): string[] {
  return handles.filter((h) => h !== ADMIN_HANDLE && h !== "minhonovazen");
}

const PROTECTED_SELF_FIELDS = ["id", "username", "subscription"] as const;
const SECRET_CLUB_ONLY_FIELDS = ["profileGif", "banner"] as const;

export function isAdminUser(userId: string, handle: string) {
  return String(userId) === ADMIN_ID || handle === ADMIN_HANDLE;
}

/** Strip fields users must not change via bulk /api/data writes. */
function sanitizeSelfUserRecord(existing: Record<string, unknown>, incoming: Record<string, unknown>) {
  const merged = { ...incoming };
  for (const field of PROTECTED_SELF_FIELDS) {
    if (existing[field] !== undefined) merged[field] = existing[field];
  }
  if (!isSecretClubTier(existing)) {
    for (const field of SECRET_CLUB_ONLY_FIELDS) {
      if (existing[field] !== undefined) merged[field] = existing[field];
      else delete merged[field];
    }
    if (merged.effect && merged.effect !== "none") {
      merged.effect = existing.effect ?? "none";
    }
    if (merged.activeVfx !== undefined && merged.activeVfx !== existing.activeVfx) {
      merged.activeVfx = existing.activeVfx;
    }
    if (Array.isArray(merged.userVfx) && JSON.stringify(merged.userVfx) !== JSON.stringify(existing.userVfx)) {
      merged.userVfx = existing.userVfx ?? [];
    }
  }
  return merged;
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

type ValidateResult = { ok: true; value: unknown } | { ok: false; error: string };

function memberUserId(member: { applicantId?: string; userId?: string; id?: string }) {
  return String(member.applicantId || member.userId || member.id || "");
}

function isSelfApplicantOnlyChange(ex: any, lobby: any, userId: string): boolean {
  const uid = String(userId);
  const exHad = (ex.applicants || []).some((a: any) => memberUserId(a) === uid);
  const nextHas = (lobby.applicants || []).some((a: any) => memberUserId(a) === uid);
  if (exHad === nextHas) return false;

  const stripApplicants = (l: any) => {
    const { applicants: _a, ...rest } = l;
    return rest;
  };
  return JSON.stringify(stripApplicants(ex)) === JSON.stringify(stripApplicants(lobby));
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
  if ((lobby.applicants || []).some((a) => memberUserId(a) === String(userId))) return true;
  return false;
}

export function validateRegisteredUsers(
  existing: unknown[],
  incoming: unknown,
  userId: string,
  isAdmin: boolean
): ValidateResult {
  if (!Array.isArray(incoming)) return { ok: false, error: "Invalid registeredUsers" };
  if (isAdmin) return { ok: true, value: incoming };

  const existingById = new Map(existing.map((u: any) => [String(u.id), u]));
  const sanitized = (incoming as any[]).map((user) => {
    if (String(user.id) !== String(userId)) return user;
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
    if (String(user.id) !== String(userId) && JSON.stringify(user) !== JSON.stringify(ex)) {
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
    if (JSON.stringify(lobby) !== JSON.stringify(ex) && !lobbyUserCanModify(ex, userId, isAdmin)) {
      if (isSelfApplicantOnlyChange(ex, lobby, userId)) continue;
      return { ok: false, error: "Cannot modify lobby you are not part of" };
    }
  }

  const sanitized = (incoming as any[]).map((lobby) => {
    const ex = existingById.get(String(lobby.id));
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

export function validateCharacters(
  existing: unknown[],
  incoming: unknown,
  userId: string,
  isAdmin: boolean
): ValidateResult {
  if (!Array.isArray(incoming)) return { ok: false, error: "Invalid characters" };
  if (isAdmin) return { ok: true, value: incoming };

  const existingById = new Map((existing as any[]).map((c) => [c.id, c]));

  for (const ch of incoming as any[]) {
    const ex = existingById.get(ch.id);
    if (!ex) {
      if (String(ch.userId) !== String(userId)) return { ok: false, error: "Cannot add characters for other users" };
      continue;
    }
    if (JSON.stringify(ch) !== JSON.stringify(ex) && String((ex as any).userId) !== String(userId)) {
      return { ok: false, error: "Cannot modify other users' characters" };
    }
  }

  for (const [id, ex] of existingById) {
    if (!(incoming as any[]).some((c) => c.id === id) && String((ex as any).userId) !== String(userId)) {
      return { ok: false, error: "Cannot delete other users' characters" };
    }
  }

  return { ok: true, value: incoming };
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

  for (const n of incoming as any[]) {
    const ex = existingById.get(n.id);
    if (!ex) {
      if (n.fromHandle !== handle) return { ok: false, error: "Cannot create notifications for other users" };
      continue;
    }
    if (JSON.stringify(n) !== JSON.stringify(ex) && n.fromHandle !== handle && n.toUser !== handle) {
      return { ok: false, error: "Cannot modify notifications you are not part of" };
    }
  }

  for (const [id, ex] of existingById) {
    if (!(incoming as any[]).some((n) => n.id === id)) {
      const n = ex as any;
      if (n.fromHandle !== handle && n.toUser !== handle) {
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

export async function validateDataWrites(
  updates: Record<string, unknown>,
  existing: Record<string, unknown>,
  userId: string,
  handle: string
): Promise<{ ok: true; sanitized: Record<string, unknown> } | { ok: false; error: string }> {
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
      case "lobbies":
        result = validateLobbies((existing.lobbies as unknown[]) || [], value, userId, isAdmin);
        break;
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
