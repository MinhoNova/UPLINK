/** Player-to-player reviews (after completed/failed offers) — pure helpers, client-safe. */

export const PLAYER_REVIEW_MAX = 300;
export const PLAYER_REVIEW_MIN = 1;
export const PLAYER_REVIEW_RATING_MAX = 5;

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