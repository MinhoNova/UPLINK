/** Server-authoritative rank counters. Clients may not write these fields on themselves. */

import { creditableRoster, RosterProof } from "./rankRosterProof";

function memberId(m: any): string {
  return String(m?.applicantId || m?.userId || m?.id || "");
}

/**
 * Fold the legacy plural spellings onto the singular category.
 *
 * Offers have always been written as `dungeon` / `raid`, but older rows carry
 * `dungeons` / `raids`. Comparing the raw string meant those lobbies silently
 * skipped `dungeonTotal` and the per-key-level buckets, so their owners were
 * under-counted. Normalise once here instead of at every comparison site.
 */
function lobbyCategory(lobby: any): string {
  const cat = String(lobby?.category || "").toLowerCase();
  if (cat === "dungeons") return "dungeon";
  if (cat === "raids") return "raid";
  return cat;
}

export function normalizeStats(stats: any): any {
  return {
    total: 0,
    k5: 0,
    k10: 0,
    k15: 0,
    k20: 0,
    levelingTotal: 0,
    dungeonTotal: 0,
    perKeyLevel: {},
    perLevelRange: {},
    postCount: 0,
    ...(stats || {}),
  };
}

export interface RankAwardOutcome {
  users: any[];
  lobbies: any[];
  awarded: { boosterRuns: number; posterPosts: number };
}

/**
 * Server-side ledger of every lobby that has already been counted.
 *
 * The marker used to live on the lobby itself (`rankAwardedBooster`), which is
 * a field the caller's browser supplies. That made the award replayable without
 * any tooling: set `rankAwardedBooster` back to false, flip the offer to
 * completed+paid, get the counters back, repeat. Twenty offers became unlimited
 * rank, and the `accepted` roster that decides who gets credited is a field the
 * same request supplies — so the credited member list was chosen by the caller
 * too.
 *
 * The ledger is keyed in server storage the client never writes, so a lobby can
 * be counted exactly once for the lifetime of the site. `rankAwardedBooster` is
 * still set, purely as a readable marker in the saved row.
 */
export const RANK_AWARD_LEDGER_KEY = "rankAwardedLobbyIds";

export function awardedLobbyIds(ledger: any): Set<string> {
  const raw = Array.isArray(ledger) ? ledger : [];
  return new Set(raw.map((v: any) => String(v)).filter(Boolean));
}

/**
 * True when this roster row reached `accepted` through a path the owner cannot
 * forge, and so is a player who was really in the mission.
 *
 * Only used for offers that predate the proof ledger. `rankRosterProof` is the
 * real gate — see `creditableRoster` — because every mark checked here is
 * written by the owner in the same request that settles the payout: pasting a
 * stranger's id into `accepted` and stamping `applicantId` on it by hand passed
 * this function. It stays as the legacy check so a mission that really ran
 * before proof was recorded can still be paid.
 */
function memberProvedByOwnAction(lobby: any, member: any): boolean {
  if (!lobby || !member) return false;
  if (member.applicantId || member.invitedAt) return true;
  const mid = memberId(member);
  if (!mid) return false;
  const pending = (lobby.applicants || []).some((a: any) => memberId(a) === mid);
  return pending;
}

/** The roster rows that may be credited run rank for this payout. */
function creditableMembers(lobby: any, proof: RosterProof, cutover: number): string[] {
  return creditableRoster(lobby, proof, cutover, memberProvedByOwnAction);
}

export function applyRankAwards(
  existingLobbies: any[],
  incomingLobbies: any[],
  existingUsers: any[],
  userId: string,
  alreadyAwarded: Set<string> = new Set(),
  rosterProof: RosterProof = new Map(),
  proofCutover: number = 0
): RankAwardOutcome {
  const lobbies = incomingLobbies.map((l: any) => ({ ...l }));
  const users = existingUsers.map((u: any) => ({ ...u }));
  const byId = (uid: string) => users.find((u: any) => String(u.id) === String(uid));

  let boosterRuns = 0;
  let posterPosts = 0;

  for (const next of lobbies) {
    const prev = existingLobbies.find((l: any) => String(l.id) === String(next.id));
    const isNew = !prev;
    const lobbyKey = String(next?.id ?? "");
    const countedBefore = lobbyKey ? alreadyAwarded.has(lobbyKey) : false;
    const completedNow =
      !isNew &&
      !countedBefore &&
      !(prev.status === "completed" && prev.payoutStatus === "paid") &&
      next.payoutStatus === "paid" &&
      (next.status === "completed");

    if (isNew && String(next?.ownerId) === String(userId) && !next.rankAwardedPoster) {
      const owner = byId(String(userId));
      if (userId && owner) {
        owner.stats = normalizeStats(owner.stats);
        owner.stats.postCount += 1;
        posterPosts += 1;
        next.rankAwardedPoster = true;
      }
    }

    if (completedNow) {
      // The owner is credited as the run's own account; every other party has to
      // have proved they joined it themselves (see `creditableMembers`).
      const memberIds = [next.ownerId, ...creditableMembers(next, rosterProof, proofCutover)];
      const kLevel = parseInt(String(next.keyLevel || "").replace("+", "") || "0", 10);
      const category = lobbyCategory(next);
      for (const mid of memberIds) {
        const u = byId(mid);
        if (!mid || !u) continue;
        u.stats = normalizeStats(u.stats);
        const s = u.stats;
        s.total += 1;
        if (kLevel >= 20) s.k20 += 1;
        else if (kLevel >= 15) s.k15 += 1;
        else if (kLevel >= 10) s.k10 += 1;
        else if (kLevel >= 5) s.k5 += 1;
        if (category === "dungeon") {
          s.dungeonTotal += 1;
          const keyLabel = next.keyLevel || (kLevel > 0 ? `+${kLevel}` : "");
          if (keyLabel) s.perKeyLevel[keyLabel] = (s.perKeyLevel[keyLabel] || 0) + 1;
        } else if (category === "leveling") {
          s.levelingTotal += 1;
          const range = next.startLevel && next.endLevel ? `${next.startLevel}-${next.endLevel}` : "";
          if (range) s.perLevelRange[range] = (s.perLevelRange[range] || 0) + 1;
        }
        boosterRuns += 1;
      }
      next.rankAwardedBooster = true;
    }
  }

  return { users, lobbies, awarded: { boosterRuns, posterPosts } };
}