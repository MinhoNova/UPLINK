/** Server-authoritative rank counters. Clients may not write these fields on themselves. */

function memberId(m: any): string {
  return String(m?.applicantId || m?.userId || m?.id || "");
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
 * Compare previous vs. incoming lobbies and credit rank counters server-side:
 * - a lobby that transitioned to completed+paid bumps each member's run stats (+1) once;
 * - a brand-new lobby owned by the caller bumps their poster postCount (+1).
 * Marking lobbies with `rankAwarded` keeps it idempotent across repeated writes.
 */
export function applyRankAwards(
  existingLobbies: any[],
  incomingLobbies: any[],
  existingUsers: any[],
  userId: string
): RankAwardOutcome {
  const lobbies = incomingLobbies.map((l: any) => ({ ...l }));
  const users = existingUsers.map((u: any) => ({ ...u }));
  const byId = (uid: string) => users.find((u: any) => String(u.id) === String(uid));

  let boosterRuns = 0;
  let posterPosts = 0;

  for (const next of lobbies) {
    const prev = existingLobbies.find((l: any) => String(l.id) === String(next.id));
    const isNew = !prev;
    const completedNow =
      !isNew &&
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

    if (completedNow && !next.rankAwardedBooster) {
      const memberIds = [next.ownerId, ...(next.accepted || []).map(memberId)];
      const kLevel = parseInt(String(next.keyLevel || "").replace("+", "") || "0", 10);
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
        if (next.category === "dungeon") {
          s.dungeonTotal += 1;
          const keyLabel = next.keyLevel || (kLevel > 0 ? `+${kLevel}` : "");
          if (keyLabel) s.perKeyLevel[keyLabel] = (s.perKeyLevel[keyLabel] || 0) + 1;
        } else if (next.category === "leveling") {
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