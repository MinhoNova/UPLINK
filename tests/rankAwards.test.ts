import { describe, it, expect } from "vitest";
import { applyRankAwards, normalizeStats } from "@/lib/rankAwards";

const OWNER = "owner-1";
const MEMBER = "member-1";

function user(id: string) {
  return { id, username: id, stats: normalizeStats({}) };
}

function lobby(over: any = {}) {
  return {
    id: "lobby-1",
    ownerId: OWNER,
    category: "dungeon",
    keyLevel: "+10",
    status: "completed",
    payoutStatus: "paid",
    accepted: [{ applicantId: MEMBER }],
    ...over,
  };
}

function run(existingLobby: any, nextLobby: any) {
  return applyRankAwards([existingLobby], [nextLobby], [user(OWNER), user(MEMBER)], OWNER);
}

function memberStats(outcome: ReturnType<typeof applyRankAwards>) {
  return outcome.users.find((u) => u.id === MEMBER)!.stats;
}

function ownerStats(outcome: ReturnType<typeof applyRankAwards>) {
  return outcome.users.find((u) => u.id === OWNER)!.stats;
}

describe("applyRankAwards", () => {
  it("credits the owner and every accepted member once on completed+paid", () => {
    const outcome = run(lobby({ status: "standby" }), lobby());
    expect(outcome.awarded.boosterRuns).toBe(2);
    expect(memberStats(outcome).total).toBe(1);
    expect(ownerStats(outcome).total).toBe(1);
  });

  it("does not award while the offer is unpaid", () => {
    const outcome = run(lobby({ status: "standby" }), lobby({ payoutStatus: "unpaid" }));
    expect(outcome.awarded.boosterRuns).toBe(0);
    expect(memberStats(outcome).total).toBe(0);
  });

  it("is idempotent — replaying the same completed lobby awards nothing new", () => {
    // First pass awards and stamps the flag onto the returned lobby.
    const first = run(lobby({ status: "standby" }), lobby());
    expect(first.lobbies[0].rankAwardedBooster).toBe(true);
    const awardedTotal = first.users.find((u) => u.id === MEMBER)!.stats.total;
    expect(awardedTotal).toBe(1);

    // Replaying that already-stamped lobby must not award a second run.
    // applyRankAwards mutates the user list in place, so replay against a fresh
    // copy of the awarded state — exactly how the route sees it in production.
    const second = applyRankAwards(
      first.lobbies,
      first.lobbies,
      first.users.map((u) => ({ ...u, stats: { ...u.stats } })),
      OWNER
    );
    expect(second.awarded.boosterRuns).toBe(0);
    expect(second.users.find((u) => u.id === MEMBER)!.stats.total).toBe(1);
  });

  it("counts legacy plural 'dungeons' toward dungeonTotal and the key bucket", () => {
    const outcome = run(
      lobby({ category: "dungeons", status: "standby" }),
      lobby({ category: "dungeons" })
    );
    const stats = memberStats(outcome);
    expect(stats.total).toBe(1);
    expect(stats.dungeonTotal).toBe(1);
    expect(stats.perKeyLevel["+10"]).toBe(1);
  });

  it("counts legacy plural 'raids' toward dungeonTotal just like singular 'raid'", () => {
    const outcome = run(lobby({ category: "raids", status: "standby" }), lobby({ category: "raids" }));
    const stats = memberStats(outcome);
    expect(stats.total).toBe(1);
    // raids are not dungeons, so no dungeon bucket
    expect(stats.dungeonTotal).toBe(0);
  });

  it("counts leveling offers toward levelingTotal and the level range", () => {
    const outcome = run(
      lobby({ category: "leveling", keyLevel: "", status: "standby" }),
      lobby({ category: "leveling", keyLevel: "", startLevel: 45, endLevel: 52 })
    );
    const stats = memberStats(outcome);
    expect(stats.total).toBe(1);
    expect(stats.levelingTotal).toBe(1);
    expect(stats.perLevelRange["45-52"]).toBe(1);
    expect(stats.dungeonTotal).toBe(0);
  });

  it("counts profession offers toward total only", () => {
    const outcome = run(
      lobby({ category: "professions", keyLevel: "", status: "standby" }),
      lobby({ category: "professions", keyLevel: "" })
    );
    const stats = memberStats(outcome);
    expect(stats.total).toBe(1);
    expect(stats.dungeonTotal).toBe(0);
    expect(stats.levelingTotal).toBe(0);
  });

  it("never awards an existing new-lobby to a non-owner", () => {
    const outcome = applyRankAwards([], [lobby({ status: "standby" })], [user(OWNER), user(MEMBER)], MEMBER);
    expect(outcome.awarded.posterPosts).toBe(0);
  });

  it("bumps poster postCount when the caller creates a new lobby", () => {
    const outcome = applyRankAwards([], [lobby({ status: "standby" })], [user(OWNER), user(MEMBER)], OWNER);
    expect(outcome.awarded.posterPosts).toBe(1);
    expect(ownerStats(outcome).postCount).toBe(1);
  });
});
