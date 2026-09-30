import { describe, it, expect, vi } from "vitest";

/**
 * The payment-completion regression: an owner who completed a run and marks the
 * offer completed+paid must be able to SAVE without the anti-fraud gate
 * bouncing them back to standby. A real, already-accepted squad member keeps
 * their `applicantId` (stamped server-side when they applied) even though accept
 * removed them from `applicants`; that evidence must satisfy the gate.
 */
const { getKVMock, posterStandingMock, createLimitMock, applyLimitMock } = vi.hoisted(() => ({
  getKVMock: vi.fn(),
  posterStandingMock: vi.fn(async () => ({ allowed: true, reason: "approved" })),
  createLimitMock: vi.fn(async () => ({ ok: true })),
  applyLimitMock: vi.fn(async () => ({ ok: true })),
}));

vi.mock("@/lib/db", () => ({ getKV: getKVMock as any }));
vi.mock("@/lib/posterApproval", () => ({ getPosterStanding: posterStandingMock as any }));
vi.mock("@/lib/offerDailyLimit", () => ({
  checkAndRecordOfferCreate: createLimitMock,
  checkAndRecordOfferApply: applyLimitMock,
}));

import { validateDataWrites } from "@/lib/secureDataWrite";

const OWNER = "owner-1";

function lobbyRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "lobby-1",
    ownerId: OWNER,
    status: "standby",
    applicants: [],
    accepted: [],
    history: [],
    ...overrides,
  };
}

const state = {
  lobbies: [lobbyRow()],
  registeredUsers: [{ id: OWNER, username: "x" }],
};

describe("completing a paid offer does not bounce to standby", () => {
  it("saves when a real accepted member (applicantId kept, not in applicants) exists", async () => {
    getKVMock.mockResolvedValue([]);
    const prev = { ...state, lobbies: [lobbyRow()] };
    const done = [lobbyRow({ status: "completed", payoutStatus: "paid", accepted: [{ applicantId: "player-9", status: "confirmed" }] })];
    const res = await validateDataWrites(
      { lobbies: done },
      prev,
      OWNER,
      "x"
    );
    expect(res.ok).toBe(true);
  });

  it("saves when the completed offer simply has no payout claim", async () => {
    getKVMock.mockResolvedValue([]);
    const prev = { ...state, lobbies: [lobbyRow()] };
    const done = [lobbyRow({ status: "completed", payoutStatus: undefined })];
    const res = await validateDataWrites({ lobbies: done }, prev, OWNER, "x");
    expect(res.ok).toBe(true);
  });

  it("rejects a paid claim with a fabricated member that has no application trail", async () => {
    getKVMock.mockResolvedValue([]);
    const prev = { ...state, lobbies: [lobbyRow()] };
    const done = [
      lobbyRow({
        status: "completed",
        payoutStatus: "paid",
        accepted: [{ id: "stranger-id", status: "confirmed" }],
      }),
    ];
    const res = await validateDataWrites({ lobbies: done }, prev, OWNER, "x");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/Payment rejected/);
  });

  it("does not claim a suspension on the refusal — the route decides that", async () => {
    getKVMock.mockResolvedValue([]);
    const prev = { ...state, lobbies: [lobbyRow()] };
    const done = [
      lobbyRow({
        status: "completed",
        payoutStatus: "paid",
        accepted: [{ id: "stranger-id", status: "confirmed" }],
      }),
    ];
    const res = await validateDataWrites({ lobbies: done }, prev, OWNER, "x");
    expect(res.ok).toBe(false);
    if (!res.ok) {
      // A single refused write used to read as "account suspended", which is a
      // claim the validator cannot make: strikes and the suspension are the
      // route's business, and this error must not pre-announce them.
      expect(res.error).not.toMatch(/suspend/i);
      expect(res.fraudAttempt).toEqual({ userId: OWNER, lobbyId: "lobby-1" });
    }
  });
});

/**
 * A finished offer with an empty roster is the normal shape of a mission whose
 * last member left — the roster empties the moment they do. Refusing those
 * payouts locked the owner of a genuinely played mission out of settling it, so
 * the mission's own records count as the proof.
 */
describe("paying an offer whose squad has since left", () => {
  const payEvidence = (evidence: Record<string, unknown>) => {
    getKVMock.mockResolvedValue([]);
    const prev = { ...state, lobbies: [lobbyRow({ status: "unpaid" })] };
    const done = [
      lobbyRow({
        status: "completed",
        payoutStatus: "paid",
        accepted: [],
        ...evidence,
      }),
    ];
    return validateDataWrites({ lobbies: done }, prev, OWNER, "x");
  };

  it("accepts a foot ledger: members who left after playing runs", async () => {
    const res = await payEvidence({
      history: [{ applicantId: "player-9", runsAtExit: 2, reason: "left" }],
    });
    expect(res.ok).toBe(true);
  });

  it("accepts a mission that was started and voted complete", async () => {
    const res = await payEvidence({
      missionStartTime: 1700000000000,
      votes: [{ userId: "player-9" }],
    });
    expect(res.ok).toBe(true);
  });

  it("accepts tracked runs on the offer", async () => {
    const res = await payEvidence({ detectedRuns: [{ at: 1 }] });
    expect(res.ok).toBe(true);
  });

  it("still rejects a solo offer with nothing but an empty roster", async () => {
    const res = await payEvidence({});
    expect(res.ok).toBe(false);
  });

  it("does not count a history entry that never played a run", async () => {
    const res = await payEvidence({ history: [{ applicantId: "player-9", runsAtExit: 0, reason: "left" }] });
    expect(res.ok).toBe(false);
  });
});