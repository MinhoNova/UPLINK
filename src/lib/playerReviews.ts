/** Player-to-player reviews (after completed/failed offers) — pure helpers, client-safe. */

export const PLAYER_REVIEW_MAX = 300;
export const PLAYER_REVIEW_MIN = 1;
export const PLAYER_REVIEW_RATING_MAX = 5;

/**
 * How long a reviewer has to wait before rating the same player again.
 *
 * This is deliberately per pair rather than a daily quota: a cap on how many
 * reviews a person may leave punishes the active players as the site grows,
 * while this only stops one player from inflating another's score by farming
 * lobbies.
 */
export const PLAYER_REVIEW_COOLDOWN_MS = 24 * 60 * 60_000;

export type PlayerReview = {
  id: string;
  lobbyId: string;
  lobbyTitle: string;
  reviewerId: string;
  reviewerName: string;
  reviewerImage: string;
  targetId: string;
  targetName: string;
  rating: number;
  comment: string;
  createdAt: number;
};

function stripUnsafe(input: string): string {
  return input
    .replace(/[<>"'`]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
    .slice(0, PLAYER_REVIEW_MAX);
}

/** Strip XSS-prone content from a review comment (plain text exposure only). */
export function sanitizePlayerReviewText(input: unknown): string {
  if (input == null) return "";
  if (typeof input !== "string") return "";
  return stripUnsafe(input).trim();
}

export function sanitizePlayerRating(raw: unknown): number {
  const n = Math.round(Number(raw));
  if (Number.isNaN(n)) return 0;
  return Math.min(PLAYER_REVIEW_RATING_MAX, Math.max(PLAYER_REVIEW_MIN, n));
}

function memberUid(member: any): string {
  return String(member?.applicantId || member?.userId || member?.id || "");
}

export function lobbyParticipantIds(lobby: any): string[] {
  const ids = new Set<string>();
  if (lobby?.ownerId) ids.add(String(lobby.ownerId));
  for (const m of lobby?.accepted || []) {
    const id = memberUid(m);
    if (id) ids.add(id);
  }
  // Fall back to invited/applicants whose turn never got resolved — gives honest scope.
  for (const m of lobby?.invited || []) {
    const id = memberUid(m);
    if (id) ids.add(id);
  }
  return Array.from(ids);
}

export function lobbyParticipantName(lobby: any, id: string): string {
  if (String(lobby?.ownerId) === String(id)) {
    return String(lobby?.ownerDiscordName || lobby?.ownerName || lobby?.ownerHandle || "Commander");
  }
  for (const m of lobby?.accepted || []) {
    if (memberUid(m) === String(id)) return String(m?.applicantName || m?.name || m?.applicantId || "Operative");
  }
  for (const m of lobby?.invited || []) {
    if (memberUid(m) === String(id)) return String(m?.applicantName || m?.name || m?.applicantId || "Operative");
  }
  return "Player";
}

export function lobbyParticipantImage(lobby: any, id: string): string {
  if (String(lobby?.ownerId) === String(id)) {
    return String(lobby?.ownerImage || "");
  }
  for (const m of lobby?.accepted || []) {
    if (memberUid(m) === String(id)) return String(m?.applicantAvatar || m?.applicantImage || m?.image || "");
  }
  for (const m of lobby?.invited || []) {
    if (memberUid(m) === String(id)) return String(m?.applicantAvatar || m?.applicantImage || m?.image || "");
  }
  return "";
}

/** True when the lobby reached a reviewable end state (completed or failed). */
export function lobbyIsReviewable(lobby: any): boolean {
  const status = lobby?.status || "standby";
  return status === "completed" || status === "failed";
}

export function playerCanReviewLobby(lobby: any, meId: string): boolean {
  if (!lobbyIsReviewable(lobby)) return false;
  return lobbyParticipantIds(lobby).includes(String(meId));
}

export function reviewTargetsOf(lobby: any, meId: string): { id: string; name: string; image: string }[] {
  const me = String(meId);
  return lobbyParticipantIds(lobby)
    .filter((id) => id !== me)
    .map((id) => ({
      id,
      name: lobbyParticipantName(lobby, id),
      image: lobbyParticipantImage(lobby, id),
    }));
}

export function averagePlayerRating(reviews: PlayerReview[]): number {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce((a, r) => a + Number(r.rating), 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

/**
 * The reviewer's own last review of this player, across every lobby — this is
 * the one the cooldown is measured against.
 *
 * Entries with no usable timestamp are skipped rather than treated as ancient:
 * a legacy row must not read as "reviewed at the epoch" and lock the player out
 * for a day.
 */
export function findLatestReviewOf(
  reviews: PlayerReview[] | null | undefined,
  reviewerId: string,
  targetId: string
): PlayerReview | null {
  if (!Array.isArray(reviews) || !reviews.length) return null;
  const from = String(reviewerId);
  const to = String(targetId);
  let latest: PlayerReview | null = null;
  for (const r of reviews) {
    if (String(r?.reviewerId) !== from || String(r?.targetId) !== to) continue;
    const at = Number(r?.createdAt);
    if (!Number.isFinite(at) || at <= 0) continue;
    if (!latest || at > Number(latest.createdAt || 0)) latest = r;
  }
  return latest;
}

/**
 * Why a review cannot be left right now, or `null` when it is allowed.
 *
 * Editing a review you already left for this player is always fine — that is
 * how a typo gets fixed — so only a *new* rating is held back.
 */
export function reviewCooldownError(
  reviews: PlayerReview[] | null | undefined,
  reviewerId: string,
  targetId: string,
  lobbyId: string,
  now = Date.now()
): string | null {
  const latest = findLatestReviewOf(reviews, reviewerId, targetId);
  if (!latest) return null;
  // Re-submitting for the same offer rewrites that review instead of adding one.
  if (String(latest.lobbyId) === String(lobbyId)) return null;

  const elapsed = now - Number(latest.createdAt || 0);
  if (elapsed < 0 || elapsed >= PLAYER_REVIEW_COOLDOWN_MS) return null;

  const hoursLeft = Math.ceil((PLAYER_REVIEW_COOLDOWN_MS - elapsed) / (60 * 60_000));
  return `You already reviewed this player — you can review them again in ${hoursLeft}h.`;
}