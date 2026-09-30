import { describe, it, expect, vi } from "vitest";

/**
 * A notification is a private message between the site and one player. The
 * ownership test was run against the row the caller sent, not the row in the
 * store:
 *
 *   if (changed && !isParty(n)) → reject     // `n` is the attacker's copy
 *
 * Stamping `toUserId` with your own id on somebody else's notification made the
 * forged copy "yours", so the check passed and the write went through — the
 * text, the target and the read state of any notification in the store were
 * writable by any signed-in account. The test is named after the stored row
 * because that is the fix.
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

const VICTIM = "victim-1";
const ATTACKER = "attacker-1";

const stored = [
  { id: "n1", toUserId: VICTIM, fromUserId: "system", text: "Your offer was accepted", read: false },
];

describe("notification ownership", () => {
  it("rejects re-addressing somebody else's notification to yourself", async () => {
    getKVMock.mockResolvedValue(stored);
    const forged = [
      // Same id, so it matches a stored row — but now it claims the attacker.
      { id: "n1", toUserId: ATTACKER, fromUserId: "system", text: "pwned", read: true },
    ];
    const res = await validateDataWrites({ notifications: forged }, { notifications: stored }, ATTACKER, "attacker");
    expect(res.ok).toBe(false);
  });

  it("rejects editing the text of somebody else's notification", async () => {
    getKVMock.mockResolvedValue(stored);
    const forged = [
      { id: "n1", toUserId: VICTIM, fromUserId: "system", text: "rewritten by someone else", read: true },
    ];
    const res = await validateDataWrites({ notifications: forged }, { notifications: stored }, ATTACKER, "attacker");
    expect(res.ok).toBe(false);
  });

  it("still lets the owner mark their own notification read", async () => {
    getKVMock.mockResolvedValue(stored);
    const mine = [{ ...stored[0], read: true }];
    const res = await validateDataWrites({ notifications: mine }, { notifications: stored }, VICTIM, "victim");
    expect(res.ok).toBe(true);
  });

  it("does not let a stranger delete somebody else's notification", async () => {
    getKVMock.mockResolvedValue(stored);
    const res = await validateDataWrites({ notifications: [] }, { notifications: stored }, ATTACKER, "attacker");
    expect(res.ok).toBe(false);
  });
});
