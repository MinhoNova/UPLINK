import { describe, it, expect } from "vitest";
import { hasIndependentSquadMember } from "@/lib/lobbyLifecycle";

const OWNER = "owner-1";
const PLAYER = "player-9";
const OFFER_ID = "lobby-1";

function lobby(overrides: Record<string, unknown> = {}) {
  return {
    id: OFFER_ID,
    ownerId: OWNER,
    status: "standby",
    applicants: [],
    accepted: [],
    history: [],
    ...overrides,
  };
}

// A member WITHOUT any application/invite evidence — the shape an owner hand-typing
// a fake squad member would produce.
function fabricated(id: string, extra: Record<string, unknown> = {}) {
  return { id, ...extra };
}

// A member who really applied: the apply route stamps applicantId from the
// applicant's own session, and accept moves them out of `applicants` but KEEPS
// applicantId on the accepted record.
function realMember(id: string, extra: Record<string, unknown> = {}) {
  return { applicantId: id, id: `char-${id}`, ...extra };
}

describe("hasIndependentSquadMember — the anti-fraud gate", () => {
  it("returns false when the only squad member is the owner", () => {
    expect(hasIndependentSquadMember(lobby({ accepted: [realMember(OWNER)] }))).toBe(false);
  });

  it("rejects a fabricated accepted member with no application trail", () => {
    // The owner controls the accepted array outright, so a pasted foreign id is
    // not evidence of a real party. With no applicantId and no applicants entry
    // the owner is minting a bystander out of thin air.
    const l = lobby({
      accepted: [fabricated(PLAYER, { status: "confirmed" })],
      applicants: [],
    });
    expect(hasIndependentSquadMember(l)).toBe(false);
  });

  it("accepts a REAL already-accepted member who is NOT in applicants anymore", () => {
    // acceptApplicantIntoLobby removes the member from `applicants` when the
    // owner accepts — so "still in applicants" is the wrong test. The retained
    // applicantId proves the application happened.
    const l = lobby({
      accepted: [realMember(PLAYER, { status: "confirmed" })],
      applicants: [],
    });
    expect(hasIndependentSquadMember(l)).toBe(true);
  });

  it("does not count a lone pending applicant as a squad member yet", () => {
    const l = lobby({
      accepted: [],
      applicants: [realMember(PLAYER)],
    });
    expect(hasIndependentSquadMember(l)).toBe(false);
  });

  it("accepts a member who joined through the invite flow (invitedAt retained)", () => {
    const l = lobby({
      accepted: [realMember(PLAYER, { status: "confirmed", invitedAt: 1000 })],
      applicants: [],
    });
    expect(hasIndependentSquadMember(l)).toBe(true);
  });

  it("does not count a member whose invite is still pending", () => {
    const l = lobby({
      accepted: [fabricated(PLAYER, { status: "invited", invitedAt: 1000 })],
      applicants: [],
    });
    expect(hasIndependentSquadMember(l)).toBe(false);
  });

  it("still counts a member who left after runs (history ledger)", () => {
    const l = lobby({
      accepted: [],
      applicants: [],
      history: [{ applicantId: PLAYER, runsAtExit: 3 }],
    });
    expect(hasIndependentSquadMember(l)).toBe(true);
  });

  it("does not count history entries with no completed runs", () => {
    const l = lobby({
      accepted: [],
      applicants: [],
      history: [{ applicantId: PLAYER, runsAtExit: 0 }],
    });
    expect(hasIndependentSquadMember(l)).toBe(false);
  });

  it("empty lobby returns false", () => {
    expect(hasIndependentSquadMember(lobby())).toBe(false);
  });
});