import { describe, expect, it } from "vitest";
import {
  ROSTER_PROOF_KEY,
  ROSTER_PROOF_CUTOVER_KEY,
  addRosterProof,
  creditableRoster,
  proofRequiredFor,
  pruneRosterProof,
  recordOwnRosterProofs,
  rosterProofFrom,
  rosterProofTo,
} from "@/lib/rankRosterProof";
import { applyRankAwards, awardedLobbyIds } from "@/lib/rankAwards";

/**
 * The award ledger made an award un-repeatable. It could not stop the FIRST one
 * going to accounts that were never in the mission, and neither could the marks
 * checked on the lobby row: the owner controls `accepted` and `applicants`
 * outright, so pasting a stranger's id into `accepted` alongside a matching
 * `applicants` row — and stamping `applicantId` on it by hand — satisfied every
 * one of them.
 *
 * Proof therefore lives in server storage and is stamped only from a fact the
 * server already knows: the caller is the session that acted.
 */

const OWNER = "owner-1";
const MEMBER = "member-real";
const BYSTANDER = "bystander-id";
const CUTOVER = 1_000_000;

function user(id: string) {
  return { id, username: id, stats: { total: 0, postCount: 0 } };
}

/** An offer created after the cutover: proof is mandatory for its members. */
function lobby(over: any = {}) {
  return {
    id: "lobby-1",
    ownerId: OWNER,
    category: "dungeon",
    keyLevel: "+10",
    status: "completed",
    payoutStatus: "unpaid",
    createdAt: CUTOVER + 5,
    accepted: [],
    applicants: [],
    invited: [],
    ...over,
  };
}

/** An offer that predates proof, so the legacy marks still settle it. */
function legacyLobby(over: any = {}) {
  return lobby({ id: "legacy", createdAt: CUTOVER - 5000, ...over });
}

/** The payout transition: an unpaid offer becoming completed+paid. */
function award(existingLobbies: any[], next: any, users: any[], proof: Map<string, Set<string>>) {
  const paid = { ...next, status: "completed", payoutStatus: "paid" };
  return applyRankAwards(existingLobbies, [paid], users, OWNER, awardedLobbyIds([]), proof, CUTOVER);
}

function proofFor(lobbyId: string, ...members: string[]) {
  return new Map([[lobbyId, new Set(members)]]);
}

const marks = (l: any, m: any) => !!(m?.applicantId || m?.invitedAt);

describe("proof is stamped only from the caller's own action", () => {
  it("records a member who applied from their own session", () => {
    const stored = lobby({ id: "l1" });
    const next = lobby({ id: "l1", applicants: [{ applicantId: MEMBER, applicantNote: "hi" }] });
    const proof = new Map();
    expect(recordOwnRosterProofs(proof, [stored], [next], MEMBER)).toBe(true);
    expect(proof.get("l1")!.has(MEMBER)).toBe(true);
  });

  it("does not treat an owner-side invite acceptance as a self-action", () => {
    // Auto-accept lets the owner confirm a member in one write, from the
    // client. That is not the member acting, so this path records nothing —
    // they are credited because they applied first, and the apply stamped it.
    const stored = lobby({ id: "l1", applicants: [{ applicantId: MEMBER }] });
    const next = lobby({ id: "l1", applicants: [], accepted: [{ id: MEMBER, status: "confirmed" }] });
    const proof = new Map();
    expect(recordOwnRosterProofs(proof, [stored], [next], OWNER)).toBe(false);
    expect(proof.has("l1")).toBe(false);
  });

  it("leaves invite acceptance to the route that owns it", () => {
    // The invite row lives in `accepted` as `status: "invited"` and is promoted
    // by `POST /api/lobbies/invite-respond`, which never goes through here.
    const stored = lobby({ id: "l1", accepted: [{ id: MEMBER, status: "invited" }] });
    const next = lobby({ id: "l1", accepted: [{ id: MEMBER, status: "confirmed", applicantId: MEMBER }] });
    const proof = new Map();
    expect(recordOwnRosterProofs(proof, [stored], [next], MEMBER)).toBe(false);
  });

  it("adds one member's proof directly, as the invite route does", () => {
    const proof = new Map();
    expect(addRosterProof(proof, "l1", MEMBER)).toBe(true);
    expect(proof.get("l1")!.has(MEMBER)).toBe(true);
    expect(addRosterProof(proof, "l1", MEMBER)).toBe(false);
  });

  it("refuses to record a proof with no lobby or no member", () => {
    const proof = new Map();
    expect(addRosterProof(proof, "", MEMBER)).toBe(false);
    expect(addRosterProof(proof, "l1", "")).toBe(false);
    expect(proof.size).toBe(0);
  });

  it("records nothing when the owner assembles the roster themselves", () => {
    const stored = lobby({ id: "l1" });
    const next = lobby({
      id: "l1",
      accepted: [{ id: BYSTANDER, applicantId: BYSTANDER }],
      applicants: [{ applicantId: BYSTANDER }],
    });
    const proof = new Map();
    // The owner is the caller. Every mark is theirs to write, so nothing is
    // recorded — this is the forgery the old check waved through.
    expect(recordOwnRosterProofs(proof, [stored], [next], OWNER)).toBe(false);
    expect(proof.has("l1")).toBe(false);
  });

  it("does not record a row the caller merely left in place", () => {
    const stored = lobby({ id: "l1", applicants: [{ applicantId: MEMBER }] });
    const proof = new Map();
    expect(recordOwnRosterProofs(proof, [stored], [stored], MEMBER)).toBe(false);
  });

  it("does not record an invite the caller was never part of", () => {
    const stored = lobby({ id: "l1", invited: [{ id: BYSTANDER, status: "invited" }] });
    const next = lobby({ id: "l1", accepted: [{ id: BYSTANDER, applicantId: BYSTANDER }] });
    const proof = new Map();
    expect(recordOwnRosterProofs(proof, [stored], [next], MEMBER)).toBe(false);
  });

  it("is a no-op for a brand-new offer, which has no stored state to act against", () => {
    const next = lobby({ id: "fresh", applicants: [{ applicantId: MEMBER }] });
    const proof = new Map();
    expect(recordOwnRosterProofs(proof, [], [next], MEMBER)).toBe(false);
  });

  it("keeps proof across repeated saves by the same member", () => {
    const stored = lobby({ id: "l1", applicants: [{ applicantId: MEMBER }] });
    const proof = rosterProofFrom({ l1: [MEMBER] });
    expect(recordOwnRosterProofs(proof, [stored], [stored], MEMBER)).toBe(false);
  });
});

describe("rank goes only to parties the server can vouch for", () => {
  it("credits the owner and a member with proof", () => {
    const out = award([lobby({ payoutStatus: "unpaid" })], lobby({ accepted: [{ id: MEMBER, applicantId: MEMBER }] }), [
      user(OWNER),
      user(MEMBER),
    ], proofFor("lobby-1", MEMBER));
    expect(out.awarded.boosterRuns).toBe(2);
  });

  it("refuses the forged roster the legacy marks used to accept", () => {
    const out = award(
      [lobby()],
      // `accepted` and `applicants` both carry the stranger, both stamped by
      // hand. Nothing server-side ever saw this id act.
      lobby({
        accepted: [{ id: BYSTANDER, applicantId: BYSTANDER, status: "accepted" }],
        applicants: [{ applicantId: BYSTANDER }],
      }),
      [user(OWNER), user(BYSTANDER)],
      new Map()
    );
    const byId = new Map(out.users.map((u) => [u.id, u]));
    expect(byId.get(OWNER)!.stats.total).toBe(1);
    expect(byId.get(BYSTANDER)!.stats.total).toBe(0);
  });

  it("credits the proved member and drops the stranger pasted in beside them", () => {
    const out = award(
      [lobby()],
      lobby({ accepted: [{ id: MEMBER, applicantId: MEMBER }, { id: BYSTANDER, applicantId: BYSTANDER }] }),
      [user(OWNER), user(MEMBER), user(BYSTANDER)],
      proofFor("lobby-1", MEMBER)
    );
    expect(out.awarded.boosterRuns).toBe(2);
    const byId = new Map(out.users.map((u) => [u.id, u]));
    expect(byId.get(MEMBER)!.stats.total).toBe(1);
    expect(byId.get(BYSTANDER)!.stats.total).toBe(0);
  });

  it("does not let one lobby's proof vouch for another", () => {
    const out = award([lobby()], lobby({ accepted: [{ id: MEMBER }] }), [user(OWNER), user(MEMBER)], proofFor("other", MEMBER));
    expect(new Map(out.users.map((u) => [u.id, u])).get(MEMBER)!.stats.total).toBe(0);
  });

  it("still credits a solo payout to the owner", () => {
    const out = award([lobby()], lobby(), [user(OWNER)], new Map());
    expect(new Map(out.users.map((u) => [u.id, u])).get(OWNER)!.stats.total).toBe(1);
  });

  it("keeps the per-key bucket for a proved member", () => {
    const out = award(
      [lobby()],
      lobby({ accepted: [{ id: MEMBER }], keyLevel: "+20" }),
      [user(OWNER), user(MEMBER)],
      proofFor("lobby-1", MEMBER)
    );
    const s = new Map(out.users.map((u) => [u.id, u])).get(MEMBER)!.stats;
    expect(s.k20).toBe(1);
    expect(s.dungeonTotal).toBe(1);
    expect(s.perKeyLevel["+20"]).toBe(1);
  });

  it("still settles a mission that predates proof on the legacy marks", () => {
    const out = award(
      [legacyLobby()],
      legacyLobby({ accepted: [{ id: MEMBER, applicantId: MEMBER }] }),
      [user(OWNER), user(MEMBER)],
      new Map()
    );
    expect(new Map(out.users.map((u) => [u.id, u])).get(MEMBER)!.stats.total).toBe(1);
  });
});

describe("the legacy window is not owner-selectable", () => {
  it("demands proof from an offer created after the cutover", () => {
    expect(proofRequiredFor(lobby(), CUTOVER)).toBe(true);
  });

  it("allows the legacy marks for an offer created before it", () => {
    expect(proofRequiredFor(legacyLobby(), CUTOVER)).toBe(false);
  });

  it("treats an undated offer as legacy, since it predates stamping", () => {
    expect(proofRequiredFor({ id: "x", ownerId: OWNER }, CUTOVER)).toBe(false);
  });

  it("requires proof for everything before a cutover has been recorded", () => {
    expect(proofRequiredFor(lobby(), 0)).toBe(false);
  });
});

describe("the proof blob stays the size of the in-flight missions", () => {
  it("drops proof once the offer is settled", () => {
    const proof = rosterProofFrom({ paid: [MEMBER], live: [MEMBER] });
    expect(pruneRosterProof(proof, [{ id: "paid", payoutStatus: "paid" }, { id: "live", payoutStatus: "unpaid" }])).toBe(true);
    expect(proof.has("paid")).toBe(false);
    expect(proof.has("live")).toBe(true);
  });

  it("drops proof for an offer that no longer exists", () => {
    const proof = rosterProofFrom({ gone: [MEMBER] });
    pruneRosterProof(proof, []);
    expect(proof.size).toBe(0);
  });

  it("reports no change when there is nothing to drop", () => {
    const proof = rosterProofFrom({ live: [MEMBER] });
    expect(pruneRosterProof(proof, [{ id: "live", payoutStatus: "unpaid" }])).toBe(false);
  });
});

describe("stored proof round-trips", () => {
  it("survives a write/read cycle", () => {
    const proof = new Map([["l1", new Set([MEMBER, BYSTANDER])]]);
    expect(rosterProofFrom(rosterProofTo(proof))).toEqual(proof);
  });

  it("ignores junk rather than throwing on a corrupt blob", () => {
    expect(rosterProofFrom(null).size).toBe(0);
    expect(rosterProofFrom([1, 2]).size).toBe(0);
    expect(rosterProofFrom({ l1: "nope" }).size).toBe(0);
  });

  it("keys both blobs in server storage the client never writes", () => {
    expect(ROSTER_PROOF_KEY).not.toBe(ROSTER_PROOF_CUTOVER_KEY);
    expect(ROSTER_PROOF_CUTOVER_KEY).toBe("rankProofCutover");
  });
});

describe("creditableRoster is the same gate applyRankAwards uses", () => {
  it("lists the proved member and nobody else", () => {
    const l = lobby({ accepted: [{ id: MEMBER }, { id: BYSTANDER, applicantId: BYSTANDER }] });
    expect(creditableRoster(l, proofFor("lobby-1", MEMBER), CUTOVER, marks)).toEqual([MEMBER]);
  });
});
