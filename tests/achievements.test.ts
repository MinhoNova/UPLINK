import { describe, expect, it } from "vitest";
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_TEXT,
  GOLD_RANK_INDEX,
  achievementStatsFrom,
  computeAchievements,
  emptyAchievementStats,
  unlockedCount,
  type AchievementStats,
} from "@/lib/achievements";
import { RANK_ORDER } from "@/lib/ranks";

const ME = "user_1";
const OTHER = "user_2";

function stats(partial: Partial<AchievementStats>): AchievementStats {
  return { ...emptyAchievementStats(), ...partial };
}

function stateFor(achievementStats: AchievementStats, id: string) {
  const state = computeAchievements(achievementStats).find((s) => s.def.id === id);
  if (!state) throw new Error(`no achievement named ${id}`);
  return state;
}

describe("achievementStatsFrom", () => {
  it("returns zeros when nothing is supplied", () => {
    expect(achievementStatsFrom({ userId: ME })).toEqual(emptyAchievementStats());
  });

  it("survives shapes that are not arrays or objects", () => {
    const result = achievementStatsFrom({
      userId: ME,
      stats: "nonsense",
      reviews: { not: "an array" },
      characters: null,
      friends: undefined,
    });
    expect(result).toEqual(emptyAchievementStats());
  });

  it("counts only rows that belong to the player", () => {
    const result = achievementStatsFrom({
      userId: ME,
      stats: { total: 7, postCount: 3, k10: 2 },
      reviews: [
        { reviewerId: OTHER, targetId: ME, rating: 5 },
        { reviewerId: ME, targetId: OTHER, rating: 1 },
        { reviewerId: OTHER, targetId: OTHER, rating: 5 },
      ],
      characters: [{ userId: ME }, { userId: OTHER }, { userId: ME }],
      friends: [{ requester: ME, target: OTHER, status: "accepted" }],
    });

    expect(result.runs).toBe(7);
    expect(result.offers).toBe(3);
    expect(result.key10).toBe(2);
    expect(result.reviewsReceived).toBe(1);
    expect(result.reviewsGiven).toBe(1);
    expect(result.characters).toBe(2);
    expect(result.friends).toBe(1);
  });

  it("counts an accepted friendship once and ignores a pending request", () => {
    const result = achievementStatsFrom({
      userId: ME,
      friends: [
        { requester: ME, target: OTHER, status: "accepted" },
        { requester: OTHER, target: ME, status: "pending" },
        { requester: OTHER, target: OTHER, status: "accepted" },
      ],
    });
    expect(result.friends).toBe(1);
  });

  it("averages only the reviews that were received", () => {
    const result = achievementStatsFrom({
      userId: ME,
      reviews: [
        { reviewerId: OTHER, targetId: ME, rating: 5 },
        { reviewerId: OTHER, targetId: ME, rating: 4 },
        // Written by this player, and a rating of zero is not a rating.
        { reviewerId: ME, targetId: OTHER, rating: 1 },
        { reviewerId: OTHER, targetId: ME, rating: 0 },
      ],
    });
    expect(result.reviewsReceived).toBe(3);
    expect(result.avgRating).toBeCloseTo(4.5, 5);
  });

  it("gives no average when there are no ratings", () => {
    expect(achievementStatsFrom({ userId: ME }).avgRating).toBe(0);
  });

  it("honours a rank override", () => {
    const result = achievementStatsFrom({ userId: ME, rankOverride: "Ascendant" });
    expect(result.rankIndex).toBe(RANK_ORDER.indexOf("Ascendant"));
  });

  it("ignores an override that is not a real tier and derives the rank", () => {
    const bogus = achievementStatsFrom({ userId: ME, rankOverride: "Wood" });
    const fresh = achievementStatsFrom({ userId: ME });
    expect(bogus.rankIndex).toBe(fresh.rankIndex);
    expect(bogus.rankIndex).toBe(0);
  });

  it("derives the rank from runs and offers", () => {
    // 50 completed runs clears Gold for a booster, 0 offers does not.
    const result = achievementStatsFrom({ userId: ME, stats: { total: 50, postCount: 0 } });
    expect(result.rankIndex).toBeGreaterThanOrEqual(GOLD_RANK_INDEX);
  });
});

describe("computeAchievements", () => {
  it("keeps an achievement locked one unit short of its target", () => {
    expect(stateFor(stats({ runs: 0 }), "first_run").unlocked).toBe(false);
    expect(stateFor(stats({ runs: 1 }), "first_run").unlocked).toBe(true);
    expect(stateFor(stats({ runs: 9 }), "runs_10").unlocked).toBe(false);
    expect(stateFor(stats({ runs: 10 }), "runs_10").unlocked).toBe(true);
    expect(stateFor(stats({ offers: 149 }), "offers_150").unlocked).toBe(false);
    expect(stateFor(stats({ offers: 150 }), "offers_150").unlocked).toBe(true);
  });

  it("clamps progress into 0..1", () => {
    const huge = stateFor(stats({ runs: 999_999 }), "runs_10");
    expect(huge.progress).toBe(1);
    const none = stateFor(stats({ runs: 0 }), "runs_10");
    expect(none.progress).toBe(0);
    const half = stateFor(stats({ runs: 5 }), "runs_10");
    expect(half.progress).toBeCloseTo(0.5, 5);
  });

  it("needs a +10 key for the key achievement, not just any run", () => {
    expect(stateFor(stats({ runs: 40 }), "key_10").unlocked).toBe(false);
    expect(stateFor(stats({ runs: 40, key10: 1 }), "key_10").unlocked).toBe(true);
  });

  it("holds beloved back on the rating until the average clears 4.5", () => {
    const fiveLow = achievementStatsFrom({
      userId: ME,
      reviews: [
        { reviewerId: OTHER, targetId: ME, rating: 4 },
        { reviewerId: OTHER, targetId: ME, rating: 4 },
        { reviewerId: OTHER, targetId: ME, rating: 4 },
        { reviewerId: OTHER, targetId: ME, rating: 4 },
        { reviewerId: OTHER, targetId: ME, rating: 4 },
      ],
    });
    const low = stateFor(fiveLow, "beloved");
    expect(low.unlocked).toBe(false);
    expect(low.current).toBe(5);
    expect(low.progress).toBe(1);

    const fiveHigh = achievementStatsFrom({
      userId: ME,
      reviews: [
        { reviewerId: OTHER, targetId: ME, rating: 5 },
        { reviewerId: OTHER, targetId: ME, rating: 5 },
        { reviewerId: OTHER, targetId: ME, rating: 5 },
        { reviewerId: OTHER, targetId: ME, rating: 5 },
        { reviewerId: OTHER, targetId: ME, rating: 4 },
      ],
    });
    expect(stateFor(fiveHigh, "beloved").unlocked).toBe(true);
  });

  it("stays locked on the rating until five reviews exist", () => {
    const one = achievementStatsFrom({
      userId: ME,
      reviews: [{ reviewerId: OTHER, targetId: ME, rating: 5 }],
    });
    expect(stateFor(one, "beloved").unlocked).toBe(false);
  });

  it("unlocks the gold rank achievement at Gold and not at Silver", () => {
    expect(stateFor(emptyAchievementStats(), "rank_gold").unlocked).toBe(false);
    const gold = achievementStatsFrom({ userId: ME, rankOverride: "Gold" });
    expect(stateFor(gold, "rank_gold").unlocked).toBe(true);
    const silver = achievementStatsFrom({ userId: ME, rankOverride: "Silver" });
    expect(stateFor(silver, "rank_gold").unlocked).toBe(false);
  });

  it("counts every achievement exactly once", () => {
    const ids = ACHIEVEMENTS.map((def) => def.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has a positive target and a progress function for each one", () => {
    for (const def of ACHIEVEMENTS) {
      expect(def.target).toBeGreaterThan(0);
      expect(typeof def.current).toBe("function");
      expect(def.current(emptyAchievementStats())).toBeGreaterThanOrEqual(0);
      expect(def.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(def.icon).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("gives every achievement English and Arabic text", () => {
    for (const def of ACHIEVEMENTS) {
      for (const text of [def.name, def.desc, def.extraDesc]) {
        if (!text) continue;
        expect(text.en.trim().length).toBeGreaterThan(0);
        expect(text.ar.trim().length).toBeGreaterThan(0);
      }
    }
    expect(ACHIEVEMENT_TEXT.title.en.length).toBeGreaterThan(0);
    expect(ACHIEVEMENT_TEXT.title.ar.length).toBeGreaterThan(0);
  });

  it("keeps every achievement in a declared category", () => {
    for (const def of ACHIEVEMENTS) {
      expect(["runs", "offers", "reviews", "roster", "social", "rank"]).toContain(
        def.category
      );
    }
  });

  it("unlocks nothing for a player who has done nothing", () => {
    expect(unlockedCount(computeAchievements(emptyAchievementStats()))).toBe(0);
  });
});
