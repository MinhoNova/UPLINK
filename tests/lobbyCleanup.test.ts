import { describe, it, expect } from "vitest";
import { pruneTerminalLobbies, getHistoryCutoffMs, getLastRetailResetMs } from "@/lib/lobbyCleanup";
import { applyRankAwards, normalizeStats } from "@/lib/rankAwards";

/**
 * `lobbies` is stored as one row, so it is read in full on every request that
 * touches offers. Nothing ever removed a finished thread from it: the only bound
 * was `slice(0, 100)` in `/api/history`, which caps what a player *sees* and
 * leaves the row growing forever.
 *
 * `pruneTerminalLobbies` is the intended bound, but it had no caller. It is now
 * reached from `setKV("lobbies", ...)`.
 *
 * The window is NOT a flat 7 days. `getHistoryCutoffMs` takes the *later* of
 * "7 days ago" and "the last Tuesday 15:00 UTC reset", so a thread is dropped as
 * soon as it falls outside either bound: history is on the game's weekly clock
 * and never retains more than 7 days. Right after a reset the window is nearly
 * empty, and just before one it is almost 7 days wide.
 *
 * These tests pin the two things that make the prune safe to ship:
 *
 *  1. It only ever touches the lobbies array. Rank lives in `user.stats`, which
 *     is a counter credited at payout time (`rankAwards.applyRankAwards`), so
 *     dropping a settled thread cannot lower anybody's rank.
 *  2. It never touches a thread that is still live, or one inside the window.
 */

const DAY = 24 * 60 * 60 * 1000;

function lobby(over: Record<string, any> = {}) {
  return {
    id: "l1",
    ownerId: "u1",
    status: "completed",
    payoutStatus: "paid",
    ...over,
  };
}

describe("pruneTerminalLobbies", () => {
  it("drops a settled thread from before the cutoff", () => {
    const old = lobby({ id: "old", completedAt: Date.now() - 30 * DAY });
    const { lobbies, removed } = pruneTerminalLobbies([old]);
    expect(lobbies).toHaveLength(0);
    expect(removed).toBe(1);
  });

  it("keeps a settled thread from after the cutoff", () => {
    const fresh = lobby({ id: "fresh", completedAt: getHistoryCutoffMs() + 60_000 });
    const { lobbies, removed } = pruneTerminalLobbies([fresh]);
    expect(lobbies).toHaveLength(1);
    expect(removed).toBe(0);
  });

  it("drops a thread the instant the cutoff passes it", () => {
    const edge = lobby({ id: "edge", completedAt: getHistoryCutoffMs() - 1_000 });
    expect(pruneTerminalLobbies([edge]).lobbies).toHaveLength(0);
  });

  it("keeps every live thread regardless of age", () => {
    const live = [
      lobby({ id: "a", status: "standby", completedAt: 0 }),
      lobby({ id: "b", status: "in_progress", completedAt: 0 }),
      lobby({ id: "c", status: "payment_pending", completedAt: 0 }),
    ];
    const { lobbies, removed } = pruneTerminalLobbies(live);
    expect(lobbies.map((l: any) => l.id)).toEqual(["a", "b", "c"]);
    expect(removed).toBe(0);
  });

  it("drops cancelled threads immediately", () => {
    const gone = lobby({ id: "c1", status: "cancelled", completedAt: Date.now() });
    const { lobbies, removed } = pruneTerminalLobbies([gone]);
    expect(lobbies).toHaveLength(0);
    expect(removed).toBe(1);
  });

  it("falls back to failedAt when a thread never reached completedAt", () => {
    const cutoff = getHistoryCutoffMs();
    const failed = lobby({ id: "f1", status: "failed", completedAt: 0, failedAt: cutoff - DAY });
    const kept = lobby({ id: "f2", status: "failed", completedAt: 0, failedAt: cutoff + 60_000 });
    const { lobbies } = pruneTerminalLobbies([failed, kept]);
    expect(lobbies.map((l: any) => l.id)).toEqual(["f2"]);
  });

  it("drops a settled thread that carries no timestamp at all", () => {
    // `!finishedAt` counts as stale, so a completed thread with no clock on it
    // cannot pin the row open forever.
    const { lobbies } = pruneTerminalLobbies([lobby({ id: "u1", completedAt: 0 })]);
    expect(lobbies).toHaveLength(0);
  });

  it("leaves the row untouched when nothing is stale", () => {
    const cutoff = getHistoryCutoffMs();
    const rows = [
      lobby({ id: "a", completedAt: cutoff + 60_000 }),
      lobby({ id: "b", status: "standby", completedAt: 0 }),
    ];
    const { lobbies, removed } = pruneTerminalLobbies(rows);
    expect(removed).toBe(0);
    expect(lobbies).toHaveLength(2);
  });
});

describe("rank is independent of the lobbies row", () => {
  it("keeps a player's rank after their settled thread is pruned", () => {
    const cutoff = getHistoryCutoffMs();
    const before = lobby({ id: "done", ownerId: "u1", accepted: [], keyLevel: "+15", status: "in_progress", payoutStatus: "unpaid", completedAt: 0 });
    const after = lobby({ id: "done", ownerId: "u1", accepted: [], keyLevel: "+15", status: "completed", payoutStatus: "paid", completedAt: cutoff + 60_000 });
    const users = [{ id: "u1", stats: normalizeStats(undefined) }];

    // Payout credits the counter on the user row, not on the thread.
    const awarded = applyRankAwards([before], [after], users, "u1", new Set(), new Map(), 0);
    expect(awarded.users[0].stats.total).toBe(1);
    expect(awarded.users[0].stats.k15).toBe(1);

    // A week later the thread is dropped. The counter is a separate row.
    const stale = awarded.lobbies.map((l: any) => ({ ...l, completedAt: cutoff - DAY }));
    const { lobbies } = pruneTerminalLobbies(stale);
    expect(lobbies).toHaveLength(0);

    // Rank is read straight off the stored counter, so it is unchanged.
    const storedUser = awarded.users[0];
    expect(storedUser.stats.total).toBe(1);
    expect(storedUser.stats.k15).toBe(1);
  });
});

describe("history cutoff", () => {
  it("never moves forward of now", () => {
    expect(getHistoryCutoffMs()).toBeLessThanOrEqual(Date.now());
  });

  it("is the later of the 7-day TTL and the Tuesday reset", () => {
    const now = Date.now();
    expect(getHistoryCutoffMs(now)).toBe(Math.max(now - 7 * DAY, getLastRetailResetMs(now)));
  });

  it("never retains more than 7 days", () => {
    expect(getHistoryCutoffMs()).toBeGreaterThanOrEqual(Date.now() - 7 * DAY);
  });

  it("puts the weekly reset in the past", () => {
    expect(getLastRetailResetMs()).toBeLessThanOrEqual(Date.now());
  });
});
