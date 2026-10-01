import { describe, expect, it } from "vitest";
import { buildOnlineRow, sortOnlineRows } from "@/lib/onlinePresence";

function player(over: any = {}, stats: any = {}) {
  return { id: "u1", username: "khaleesi", displayName: "Khaleesi", stats, ...over };
}

function withRuns(runs: number, over: any = {}) {
  return buildOnlineRow(player(over, { total: runs, postCount: 0 }));
}

describe("sortOnlineRows", () => {
  it("puts the higher rank first, whatever the presence order", () => {
    const bronze = withRuns(1, { id: "bronze" });
    const master = withRuns(500, { id: "master" });
    const order = sortOnlineRows([bronze, master]).map((r) => r.user.id);
    expect(order).toEqual(["master", "bronze"]);
  });

  it("keeps the admin rank override ahead of the derived tier", () => {
    const derived = withRuns(500, { id: "derived" });
    const promoted = withRuns(1, { id: "promoted", rankOverride: "Ascendant" });
    const order = sortOnlineRows([derived, promoted]).map((r) => r.user.id);
    expect(order).toEqual(["promoted", "derived"]);
  });

  it("breaks a rank tie with whoever was seen most recently", () => {
    const older = withRuns(10, { id: "older", lastSeenAt: 1_000 });
    const newer = withRuns(10, { id: "newer", lastSeenAt: 9_000 });
    const order = sortOnlineRows([older, newer]).map((r) => r.user.id);
    expect(order).toEqual(["newer", "older"]);
  });

  it("falls back to the name when rank and presence are both even", () => {
    const zed = withRuns(10, { id: "z", displayName: "Zed" });
    const amy = withRuns(10, { id: "a", displayName: "Amy" });
    const order = sortOnlineRows([zed, amy]).map((r) => r.user.displayName);
    expect(order).toEqual(["Amy", "Zed"]);
  });

  it("survives rows with no name, no presence and no stats", () => {
    const rows = [
      buildOnlineRow({ id: "x", username: "x" }),
      buildOnlineRow({ id: "y", username: "y" }),
    ];
    expect(sortOnlineRows(rows)).toHaveLength(2);
  });

  it("does not mutate the array it was given", () => {
    const rows = [withRuns(1, { id: "a" }), withRuns(500, { id: "b" })];
    const before = rows.map((r) => r.user.id);
    sortOnlineRows(rows);
    expect(rows.map((r) => r.user.id)).toEqual(before);
  });
});

describe("buildOnlineRow", () => {
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

  it("reads the nameplate off the account when no character is linked", () => {
    const row = buildOnlineRow(player({ gameCharacterName: "Nomad", serverName: "Azmodan" }));
    expect(row.characterName).toBe("Nomad");
    expect(row.serverName).toBe("Azmodan");
  });
});
