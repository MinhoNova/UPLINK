import { describe, it, expect, vi } from "vitest";

/**
 * The full request-level gate: an account that has the session but no posting
 * standing must be refused at PUT /api/lobbies before the store is touched, and
 * a brand-new account far enough to click "Create offer" is exactly that case.
 * (Unapproved accounts may still APPLY — that path is separate and untouched
 * here; see the apply quota tests.)
 */

const { getKVMock, updateKVAtomicMock, getPosterStandingMock } = vi.hoisted(() => ({
  getKVMock: vi.fn(),
  updateKVAtomicMock: vi.fn(),
  getPosterStandingMock: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({ requireSession: vi.fn() }));
vi.mock("@/lib/db", () => ({
  initTables: vi.fn(async () => {}),
  getKV: getKVMock as any,
  updateKVAtomic: updateKVAtomicMock as any,
}));
vi.mock("@/lib/banCheck", () => ({ addUserBan: vi.fn(async () => {}) }));
vi.mock("@/lib/auditLog", () => ({ logAudit: vi.fn(async () => {}) }));
vi.mock("@/lib/posterApproval", () => ({
  getPosterStanding: getPosterStandingMock as any,
}));
vi.mock("@/lib/offerDailyLimit", () => ({
  checkAndRecordOfferCreate: vi.fn(async () => ({ ok: true })),
  offerCreateLimitError: () => "limit",
}));

function putBody(overrides: Record<string, unknown> = {}) {
  return {
    lobbies: [{ id: "new-1", ownerId: "new-user", status: "standby", accepted: [], applicants: [], ...overrides }],
  };
}

it("refuses an unapproved brand-new account with needsApproval", async () => {
  const { requireSession } = await import("@/lib/authz");
  (requireSession as any).mockResolvedValue({
    ok: true,
    user: { id: "new-user", username: "new", role: "user" },
  });
  // Store has zero lobbies, so the creating account is not a legacy poster.
  getKVMock.mockImplementation(async (_key: string) => []);
  getPosterStandingMock.mockResolvedValue({ allowed: false, reason: "not_requested" });
  updateKVAtomicMock.mockResolvedValue({ ok: true, value: null });

  const { PUT } = await import("@/app/api/lobbies/route");
  const res = await PUT(
    new Request("https://aion2lfg.com/api/lobbies", {
      method: "PUT",
      body: JSON.stringify(putBody()),
      headers: { "Content-Type": "application/json" },
    }) as any
  );

  expect(res.status).toBe(403);
  const body: any = await res.json();
  expect(body.needsApproval).toBe(true);
  expect(updateKVAtomicMock).not.toHaveBeenCalled();
});

it("admits an approved account to publish", async () => {
  const { requireSession } = await import("@/lib/authz");
  (requireSession as any).mockResolvedValue({
    ok: true,
    user: { id: "good-user", username: "good", role: "user" },
  });
  getKVMock.mockImplementation(async (k: string) => {
    if (k === "lobbies") return [];
    if (k === "registeredUsers") return [{ id: "good-user", username: "good", posterApprovedAt: 123 }];
    return null;
  });
  getPosterStandingMock.mockResolvedValue({ allowed: true, reason: "approved" });
  updateKVAtomicMock.mockResolvedValue({ ok: true, value: [] });

  const { PUT } = await import("@/app/api/lobbies/route");
  const res = await PUT(
    new Request("https://aion2lfg.com/api/lobbies", {
      method: "PUT",
      body: JSON.stringify({
        lobbies: [{ id: "new-2", ownerId: "good-user", status: "standby", accepted: [], applicants: [] }],
      }),
      headers: { "Content-Type": "application/json" },
    }) as any
  );

  expect(res.status).toBe(200);
});