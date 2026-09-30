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
});