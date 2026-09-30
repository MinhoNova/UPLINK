import { describe, it, expect, vi } from "vitest";
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

function member(id: string, extra: Record<string, unknown> = {}) {
  return { applicantId: id, ...extra };
}

describe("hasIndependentSquadMember — the anti-fraud gate", () => {
  it("returns false when the only squad member is the owner", () => {
    expect(hasIndependentSquadMember(lobby({ accepted: [member(OWNER)] }))).toBe(false);
  });

  it("rejects a fabricated accepted member who never applied", () => {
    // The owner controls the accepted array outright, so a pasted foreign id is
    // not evidence of a real party. Requiring an applicants entry is what stops
    // the owner from minting rank for a bystander who never played.
    const l = lobby({
      accepted: [member(PLAYER, { status: "confirmed" })],
      applicants: [],
    });
    expect(hasIndependentSquadMember(l)).toBe(false);
  });

  it("accepts a member who genuinely applied (present in applicants)", () => {
    const l = lobby({
      accepted: [member(PLAYER, { status: "confirmed" })],
      applicants: [member(PLAYER)],
    });
    expect(hasIndependentSquadMember(l)).toBe(true);
  });

  it("still counts a member who left after runs (history ledger, applied before)", () => {
    const l = lobby({
      accepted: [],
      applicants: [member(PLAYER)],
      history: [{ applicantId: PLAYER, runsAtExit: 3 }],
    });
    expect(hasIndependentSquadMember(l)).toBe(true);
  });

  it("does not count invited-but-not-applied players", () => {
    const l = lobby({
      accepted: [member(PLAYER, { status: "invited" })],
      applicants: [member(PLAYER)],
    });
    expect(hasIndependentSquadMember(l)).toBe(false);
  });

  it("empty lobby returns false", () => {
    expect(hasIndependentSquadMember(lobby())).toBe(false);
  });
});