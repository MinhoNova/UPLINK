import { describe, expect, it } from "vitest";
import { applyRankAwards, awardedLobbyIds } from "@/lib/rankAwards";

/**
 * The ledger already made an award un-repeatable. What it could not do is stop
 * the FIRST award going to accounts that were never in the mission: the owner
 * controls the `accepted` array outright, so they could paste any id, flip the
 * offer to completed+paid, and mint run rank for a stranger. These tests pin
 * that a party is only credited when they proved they joined it themselves.
 */

const OWNER = "owner-1";
const REAL_MEMBER = "member-real";
const BYSTANDER = "bystander-id";

function user(id: string) {
  return { id, username: id, stats: { total: 0, postCount: 0 } };
}

/** A roster row as the apply path stamps it, server-side, from the member's session. */
function joinedRow(id: string) {
  return { id, applicantId: id, status: "accepted" };
}

function lobby(over: any = {}) {
  return {
    id: "lobby-1",
    ownerId: OWNER,
    category: "dungeon",
    keyLevel: "+10",
    status: "completed",
    payoutStatus: "paid",
    accepted: [],
    ...over,
  };
}

function award(existingLobbies: any[], next: any, users: any[], ledger: any[] = []) {
  return applyRankAwards(existingLobbies, [next], users, OWNER, awardedLobbyIds(ledger));
}

describe("run rank goes only to parties who joined the mission", () => {
  it("credits the owner and a member who applied", () => {
    const out = award([lobby({ payoutStatus: "unpaid" })], lobby({ accepted: [joinedRow(REAL_MEMBER)] }), [
      user(OWNER),
      user(REAL_MEMBER),
    ]);
    expect(out.awarded.boosterRuns).toBe(2);
    const byId = new Map(out.users.map((u) => [u.id, u]));
    expect(byId.get(OWNER)!.stats.total).toBe(1);
    expect(byId.get(REAL_MEMBER)!.stats.total).toBe(1);
  });

  it("refuses to credit an id the owner pasted in with no application behind it", () => {
    const out = award(
      [lobby({ payoutStatus: "unpaid" })],
      // `accepted` is entirely owner-controlled, so this row carries none of the
      // server-stamped marks a real join leaves behind.
      lobby({ accepted: [{ id: BYSTANDER, status: "accepted" }] }),
      [user(OWNER), user(BYSTANDER)]
    );
    const byId = new Map(out.users.map((u) => [u.id, u]));
    expect(byId.get(OWNER)!.stats.total).toBe(1);
    expect(byId.get(BYSTANDER)!.stats.total).toBe(0);
  });

  it("credits a party the owner invited, who never applied", () => {
    const out = award([lobby({ payoutStatus: "unpaid" })], lobby({ accepted: [{ id: REAL_MEMBER, invitedAt: 123 }] }), [
      user(OWNER),
      user(REAL_MEMBER),
    ]);
    const byId = new Map(out.users.map((u) => [u.id, u]));
    expect(byId.get(REAL_MEMBER)!.stats.total).toBe(1);
  });

  it("credits a party still sitting in applicants, accepted moments earlier", () => {
    const out = award(
      [lobby({ payoutStatus: "unpaid" })],
      lobby({
        accepted: [{ id: REAL_MEMBER, status: "accepted" }],
        applicants: [{ applicantId: REAL_MEMBER }],
      }),
      [user(OWNER), user(REAL_MEMBER)]
    );
    const byId = new Map(out.users.map((u) => [u.id, u]));
    expect(byId.get(REAL_MEMBER)!.stats.total).toBe(1);
  });

  it("credits the real member but drops the bystander pasted in beside them", () => {
    const out = award(
      [lobby({ payoutStatus: "unpaid" })],
      lobby({ accepted: [joinedRow(REAL_MEMBER), { id: BYSTANDER, status: "accepted" }] }),
      [user(OWNER), user(REAL_MEMBER), user(BYSTANDER)]
    );
    expect(out.awarded.boosterRuns).toBe(2);
    const byId = new Map(out.users.map((u) => [u.id, u]));
    expect(byId.get(REAL_MEMBER)!.stats.total).toBe(1);
    expect(byId.get(BYSTANDER)!.stats.total).toBe(0);
  });

  it("still credits a solo payout: the owner's own run is the owner's to count", () => {
    const out = award([lobby({ payoutStatus: "unpaid" })], lobby(), [user(OWNER)]);
    const byId = new Map(out.users.map((u) => [u.id, u]));
    expect(byId.get(OWNER)!.stats.total).toBe(1);
  });

  it("keeps the per-key bucket intact for a credited member", () => {
    const out = award(
      [lobby({ payoutStatus: "unpaid" })],
      lobby({ accepted: [joinedRow(REAL_MEMBER)], keyLevel: "+20" }),
      [user(OWNER), user(REAL_MEMBER)]
    );
    const byId = new Map(out.users.map((u) => [u.id, u]));
    expect(byId.get(REAL_MEMBER)!.stats.k20).toBe(1);
    expect(byId.get(REAL_MEMBER)!.stats.dungeonTotal).toBe(1);
    expect(byId.get(REAL_MEMBER)!.stats.perKeyLevel["+20"]).toBe(1);
  });

  it("does not count the same party twice if the owner duplicated their row", () => {
    const out = award(
      [lobby({ payoutStatus: "unpaid" })],
      lobby({ accepted: [joinedRow(REAL_MEMBER), joinedRow(REAL_MEMBER)] }),
      [user(OWNER), user(REAL_MEMBER)]
    );
    const byId = new Map(out.users.map((u) => [u.id, u]));
    expect(byId.get(REAL_MEMBER)!.stats.total).toBe(1);
  });

  it("does not pay the owner a second time through a duplicated owner row", () => {
    const out = award([lobby({ payoutStatus: "unpaid" })], lobby({ accepted: [joinedRow(OWNER)] }), [user(OWNER)]);
    const byId = new Map(out.users.map((u) => [u.id, u]));
    expect(byId.get(OWNER)!.stats.total).toBe(1);
  });

  it("ignores an unknown id rather than crediting a missing account", () => {
    const out = award([lobby({ payoutStatus: "unpaid" })], lobby({ accepted: [joinedRow("ghost")] }), [
      user(OWNER),
    ]);
    const byId = new Map(out.users.map((u) => [u.id, u]));
    expect(byId.get(OWNER)!.stats.total).toBe(1);
    expect(out.users.some((u) => u.id === "ghost")).toBe(false);
  });

  it("credits nothing when the lobby was already paid before this write", () => {
    const out = award(
      [lobby({ payoutStatus: "paid", status: "completed" })],
      lobby({ accepted: [joinedRow(REAL_MEMBER)] }),
      [user(OWNER), user(REAL_MEMBER)]
    );
    const byId = new Map(out.users.map((u) => [u.id, u]));
    expect(byId.get(OWNER)!.stats.total).toBe(0);
    expect(byId.get(REAL_MEMBER)!.stats.total).toBe(0);
  });

  it("credits nothing for a lobby already in the ledger", () => {
    const out = award([lobby({ payoutStatus: "unpaid" })], lobby({ accepted: [joinedRow(REAL_MEMBER)] }), [
      user(OWNER),
      user(REAL_MEMBER),
    ], ["lobby-1"]);
    const byId = new Map(out.users.map((u) => [u.id, u]));
    expect(byId.get(REAL_MEMBER)!.stats.total).toBe(0);
  });
});
