import { describe, it, expect } from "vitest";
import { buildOnlineRow, sortOnlineRows } from "@/lib/onlinePresence";
import { getUserRanks } from "@/lib/ranks";

/**
 * The Discord-style roster: the person with the higher rank sits at the top of
 * the list, and each row carries the rank badge plus the in-game nameplate
 * (character, class, server) that a Discord server tag stands in for.
 */
const player = (over: Record<string, any> = {}) => ({
  id: "p",
  username: "handle",
  displayName: "Name",
  stats: { total: 0, postCount: 0 },
  ...over,
});

const withRuns = (total: number, over: Record<string, any> = {}) =>
  player({ stats: { total, postCount: 0 }, ...over });

describe("buildOnlineRow", () => {
  it("derives the rank from completed runs, matching the rest of the site", () => {
    const row = buildOnlineRow(withRuns(500));
    expect(row.rank).toBe(getUserRanks(500, 0).overall.tier);
    expect(row.rankImage).toMatch(/\.png$/);
  });

  it("uses a poster's own tier when they have posted more than they have run", () => {
    // 60 posts outranks 150 runs at the Poster thresholds; getUserRanks picks
    // the better of the two, and the list must agree with the profile badge.
    const row = buildOnlineRow(player({ stats: { total: 0, postCount: 60 } }));
    expect(row.rank).toBe(getUserRanks(0, 60).overall.tier);
  });

  it("honours an admin rank override", () => {
    const row = buildOnlineRow(player({ stats: { total: 0, postCount: 0 }, rankOverride: "Ascendant" }));
    expect(row.rank).toBe("Ascendant");
  });

  it("reads the nameplate off the player's strongest character", () => {
    // `/api/data` hands these over already sorted by combat power, so the first
    // row is the player's main. This test pins that contract: if the sort is
    // ever dropped, this fails rather than silently showing an alt.
    const row = buildOnlineRow(
      player({
        characters: [
          { name: "Main", serverName: "Siel", gameClassLabel: "Mage", level: 70, cpAp: 9999 },
          { name: "Small", serverName: "Kaka", gameClassLabel: "Druid", level: 60, cpAp: 1000 },
        ],
      })
    );
    expect(row.characterName).toBe("Main");
    expect(row.serverName).toBe("Siel");
    expect(row.className).toBe("Mage");
    expect(row.characterLevel).toBe(70);
  });

  it("falls back gracefully when a character row is empty", () => {
    const row = buildOnlineRow(player({ characters: [{}] }));
    expect(row.characterName).toBe("");
  });

  it("leaves the nameplate empty rather than inventing one", () => {
    const row = buildOnlineRow(player());
    expect(row.characterName).toBe("");
    expect(row.serverName).toBe("");
    expect(row.characterLevel).toBe(0);
  });

  it("does not fall over on a player with no stats at all", () => {
    const row = buildOnlineRow({ id: "x" });
    expect(row.rank).toBe("Bronze");
  });
});

describe("sortOnlineRows", () => {
  const order = (rows: any[]) => sortOnlineRows(rows).map((r) => r.user.id);

  it("puts the highest rank first", () => {
    const rows = [withRuns(1, { id: "bronze" }), withRuns(900, { id: "master" }), withRuns(60, { id: "gold" })].map(
      buildOnlineRow
    );
    expect(order(rows)).toEqual(["master", "gold", "bronze"]);
  });

  it("breaks a tie by who was seen most recently", () => {
    const rows = [
      withRuns(100, { id: "older", lastSeenAt: 1_000 }),
      withRuns(100, { id: "newer", lastSeenAt: 9_000 }),
    ].map(buildOnlineRow);
    expect(order(rows)).toEqual(["newer", "older"]);
  });

  it("falls back to the name when rank and recency are equal", () => {
    const rows = [
      player({ id: "b", displayName: "Bravo", stats: { total: 10, postCount: 0 } }),
      player({ id: "a", displayName: "Alpha", stats: { total: 10, postCount: 0 } }),
    ].map(buildOnlineRow);
    expect(order(rows)).toEqual(["a", "b"]);
  });

  it("ranks an override above a higher run count, like every other badge", () => {
    // Two places disagreeing about someone's rank is worse than either being
    // wrong, so the list follows the profile badge.
    const rows = [
      withRuns(4000, { id: "ascendant-by-runs" }),
      player({ id: "promoted", stats: { total: 0, postCount: 0 }, rankOverride: "Grandmaster" }),
    ].map(buildOnlineRow);
    expect(order(rows)).toEqual(["ascendant-by-runs", "promoted"]);
  });

  it("does not mutate the array it was given", () => {
    const rows = [withRuns(1, { id: "a" }), withRuns(500, { id: "b" })].map(buildOnlineRow);
    const before = rows.map((r) => r.user.id);
    sortOnlineRows(rows);
    expect(rows.map((r) => r.user.id)).toEqual(before);
  });
});
