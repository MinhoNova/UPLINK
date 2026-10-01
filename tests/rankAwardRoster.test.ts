import { describe, expect, it } from "vitest";
import { applyRankAwards, awardedLobbyIds } from "@/lib/rankAwards";

/**
 * The award ledger made an award un-repeatable. What it could not do is stop the
 * FIRST award going to accounts that were never in the mission: the owner
 * controls the `accepted` array outright, so they could paste any id, flip the
 * offer to completed+paid, and mint run rank for a stranger.
 *
 * The gate is server-stamped proof — see `rankRosterProof.ts`, which explains
 * where the proof comes from and why the roster marks cannot be trusted. These
 * tests pin the award side of it: proof credits, and nothing else does.
 */

const OWNER = "owner-1";
const REAL_MEMBER = "member-real";
const BYSTANDER = "bystander-id";
const CUTOVER = 1_000_000;

function user(id: string) {
  return { id, username: id, stats: { total: 0, postCount: 0 } };
}

/** A roster row the server vouched for. */
function provedRow(id: string) {
  return { id, applicantId: id, status: "confirmed" };
}

function lobby(over: any = {}) {
  return {
    id: "lobby-1",
    ownerId: OWNER,
    category: "dungeon",
    keyLevel: "+10",
    status: "completed",
    payoutStatus: "paid",
    // Created after the cutover, so members need server-stamped proof.
    createdAt: CUTOVER + 5,
    accepted: [],
    applicants: [],
    ...over,
  };
}

function award(existingLobbies: any[], next: any, users: any[], ledger: any[] = [], proof?: Map<string, Set<string>>) {
  return applyRankAwards(
    existingLobbies,
    [next],
    users,
    OWNER,
    awardedLobbyIds(ledger),
    proof ?? new Map(),
    CUTOVER
  );
}

const proved = (...members: string[]) => new Map([["lobby-1", new Set(members)]]);

describe("run rank goes only to parties the server vouched for", () => {
  it("credits the owner and a proved member", () => {
    const out = award([lobby({ payoutStatus: "unpaid" })], lobby({ accepted: [provedRow(REAL_MEMBER)] }), [
      user(OWNER),
      user(REAL_MEMBER),
    ], [], proved(REAL_MEMBER));
    expect(out.awarded.boosterRuns).toBe(2);
    const byId = new Map(out.users.map((u) => [u.id, u]));
    expect(byId.get(OWNER)!.stats.total).toBe(1);
    expect(byId.get(REAL_MEMBER)!.stats.total).toBe(1);
  });

  it("refuses an id the owner pasted in with no proof behind it", () => {
    const out = award(
      [lobby({ payoutStatus: "unpaid" })],
      // `accepted` is entirely owner-controlled, so this row carries only marks
      // the owner wrote.
      lobby({ accepted: [{ id: BYSTANDER, applicantId: BYSTANDER, status: "accepted" }] }),
      [user(OWNER), user(BYSTANDER)]
    );
    const byId = new Map(out.users.map((u) => [u.id, u]));
    expect(byId.get(OWNER)!.stats.total).toBe(1);
    expect(byId.get(BYSTANDER)!.stats.total).toBe(0);
  });

  it("refuses a forged applicants row, which the older field check accepted", () => {
    // The previous check treated a matching row in `applicants` as evidence. The
    // owner writes that array too, so pasting both sides of the pair was enough
    // to pass it.
    const out = award(
      [lobby({ payoutStatus: "unpaid" })],
      lobby({
        accepted: [{ id: BYSTANDER, applicantId: BYSTANDER }],
        applicants: [{ applicantId: BYSTANDER }],
      }),
      [user(OWNER), user(BYSTANDER)]
    );
    expect(new Map(out.users.map((u) => [u.id, u])).get(BYSTANDER)!.stats.total).toBe(0);
  });

  it("credits the proved member but drops the bystander pasted in beside them", () => {
    const out = award(
      [lobby({ payoutStatus: "unpaid" })],
      lobby({ accepted: [provedRow(REAL_MEMBER), { id: BYSTANDER, applicantId: BYSTANDER }] }),
      [user(OWNER), user(REAL_MEMBER), user(BYSTANDER)],
      [],
      proved(REAL_MEMBER)
    );
    expect(out.awarded.boosterRuns).toBe(2);
    const byId = new Map(out.users.map((u) => [u.id, u]));
    expect(byId.get(REAL_MEMBER)!.stats.total).toBe(1);
    expect(byId.get(BYSTANDER)!.stats.total).toBe(0);
  });

  it("does not let proof recorded for another offer vouch for this one", () => {
    const out = award(
      [lobby({ payoutStatus: "unpaid" })],
      lobby({ accepted: [provedRow(REAL_MEMBER)] }),
      [user(OWNER), user(REAL_MEMBER)],
      [],
      new Map([["other-lobby", new Set([REAL_MEMBER])]])
    );
    expect(new Map(out.users.map((u) => [u.id, u])).get(REAL_MEMBER)!.stats.total).toBe(0);
  });

  it("keeps the per-key bucket intact for a proved member", () => {
    const out = award(
      [lobby({ payoutStatus: "unpaid" })],
      lobby({ accepted: [provedRow(REAL_MEMBER)], keyLevel: "+20" }),
      [user(OWNER), user(REAL_MEMBER)],
      [],
      proved(REAL_MEMBER)
    );
    const s = new Map(out.users.map((u) => [u.id, u])).get(REAL_MEMBER)!.stats;
    expect(s.k20).toBe(1);
    expect(s.dungeonTotal).toBe(1);
    expect(s.perKeyLevel["+20"]).toBe(1);
  });

  it("does not count the same party twice if the owner duplicated their row", () => {
    const out = award(
      [lobby({ payoutStatus: "unpaid" })],
      lobby({ accepted: [provedRow(REAL_MEMBER), provedRow(REAL_MEMBER)] }),
      [user(OWNER), user(REAL_MEMBER)],
      [],
      proved(REAL_MEMBER)
    );
    expect(new Map(out.users.map((u) => [u.id, u])).get(REAL_MEMBER)!.stats.total).toBe(1);
  });

  it("does not pay the owner a second time through a duplicated owner row", () => {
    const out = award(
      [lobby({ payoutStatus: "unpaid" })],
      lobby({ accepted: [provedRow(OWNER)] }),
      [user(OWNER)],
      [],
      proved(OWNER)
    );
    expect(new Map(out.users.map((u) => [u.id, u])).get(OWNER)!.stats.total).toBe(1);
  });

  it("ignores an unknown id rather than crediting a missing account", () => {
    const out = award(
      [lobby({ payoutStatus: "unpaid" })],
      lobby({ accepted: [provedRow("ghost")] }),
      [user(OWNER)],
      [],
      proved("ghost")
    );
    expect(new Map(out.users.map((u) => [u.id, u])).get(OWNER)!.stats.total).toBe(1);
    expect(out.users.some((u) => u.id === "ghost")).toBe(false);
  });

  it("credits nothing when the lobby was already paid before this write", () => {
    const out = award(
      [lobby({ payoutStatus: "paid", status: "completed" })],
      lobby({ accepted: [provedRow(REAL_MEMBER)] }),
      [user(OWNER), user(REAL_MEMBER)],
      [],
      proved(REAL_MEMBER)
    );
    const byId = new Map(out.users.map((u) => [u.id, u]));
    expect(byId.get(OWNER)!.stats.total).toBe(0);
    expect(byId.get(REAL_MEMBER)!.stats.total).toBe(0);
  });

  it("credits nothing for a lobby already in the ledger", () => {
    const out = award(
      [lobby({ payoutStatus: "unpaid" })],
      lobby({ accepted: [provedRow(REAL_MEMBER)] }),
      [user(OWNER), user(REAL_MEMBER)],
      ["lobby-1"],
      proved(REAL_MEMBER)
    );
    expect(new Map(out.users.map((u) => [u.id, u])).get(REAL_MEMBER)!.stats.total).toBe(0);
  });
});

describe("offers that predate proof still settle", () => {
  const legacy = (over: any = {}) => lobby({ id: "legacy", createdAt: CUTOVER - 5000, ...over });

  it("credits a member on the legacy marks, so a real mission is not stranded", () => {
    const out = award(
      [legacy({ payoutStatus: "unpaid" })],
      legacy({ accepted: [{ id: REAL_MEMBER, applicantId: REAL_MEMBER }] }),
      [user(OWNER), user(REAL_MEMBER)],
      [],
      new Map([["legacy", new Set()]])
    );
    expect(new Map(out.users.map((u) => [u.id, u])).get(REAL_MEMBER)!.stats.total).toBe(1);
  });

  it("credits a member whose row carries the invite stamp", () => {
    const out = award(
      [legacy({ payoutStatus: "unpaid" })],
      legacy({ accepted: [{ id: REAL_MEMBER, invitedAt: 123 }] }),
      [user(OWNER), user(REAL_MEMBER)],
      [],
      new Map([["legacy", new Set()]])
    );
    expect(new Map(out.users.map((u) => [u.id, u])).get(REAL_MEMBER)!.stats.total).toBe(1);
  });

  it("still will not credit an unproven row on a legacy offer", () => {
    const out = award(
      [legacy({ payoutStatus: "unpaid" })],
      legacy({ accepted: [{ id: BYSTANDER, status: "accepted" }] }),
      [user(OWNER), user(BYSTANDER)],
      [],
      new Map([["legacy", new Set()]])
    );
    expect(new Map(out.users.map((u) => [u.id, u])).get(BYSTANDER)!.stats.total).toBe(0);
  });
});
