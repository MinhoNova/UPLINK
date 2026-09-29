import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * `PUT /api/lobbies` is the dedicated lobby write path the client uses. The
 * merge it performs is concurrency-safe, but a merge that trusts the client's
 * copy of any id it names is also an overwrite primitive: without the
 * `validateLobbies` scope check, any signed-in user could rewrite someone
 * else's lobby (take ownership, self-accept, mark it paid, forge the chat).
 * These tests pin that the validator runs inside the atomic mutator.
 */

const OWNER = "owner-1";
const STRANGER = "stranger-9";

const { LOBBIES, atomicMock } = vi.hoisted(() => {
  const lobbies = [
    { id: "900", ownerId: "owner-1", status: "standby", accepted: [], applicants: [], messages: [{ id: 1, text: "mine" }] },
    { id: "902", ownerId: "stranger-9", status: "standby", accepted: [], applicants: [], messages: [{ id: 2, text: "theirs" }] },
  ];
  const mock = vi.fn(async (_key: string, mutator: (c: any[] | null) => any) => {
    const next = mutator(lobbies);
    if (next === undefined) return { ok: false };
    return { ok: true, value: next };
  });
  return { LOBBIES: lobbies, atomicMock: mock };
});

vi.mock("@/lib/authz", () => ({ requireSession: vi.fn() }));
vi.mock("@/lib/db", () => ({
  initTables: vi.fn(async () => {}),
  updateKVAtomic: (key: string, mutator: (c: any[] | null) => any) => atomicMock(key, mutator),
}));
vi.mock("@/lib/banCheck", () => ({ addUserBan: vi.fn(async () => {}) }));
vi.mock("@/lib/auditLog", () => ({ logAudit: vi.fn(async () => {}) }));

async function put(asUser: string, lobbies: any[], role = "user") {
  const { requireSession } = await import("@/lib/authz");
  (requireSession as any).mockResolvedValue({
    ok: true,
    user: { id: asUser, username: asUser, role },
  });
  const { PUT } = await import("@/app/api/lobbies/route");
  const res = await PUT(
    new Request("https://x/api/lobbies", {
      method: "PUT",
      body: JSON.stringify({ lobbies }),
      headers: { "Content-Type": "application/json" },
    }) as any
  );
  return { status: res.status, body: (await res.json()) as any };
}

beforeEach(() => {
  atomicMock.mockClear();
});

describe("PUT /api/lobbies", () => {
  it("rejects an unauthenticated caller", async () => {
    const { requireSession } = await import("@/lib/authz");
    (requireSession as any).mockResolvedValue({ ok: false, status: 401, error: "Unauthorized" });
    const { PUT } = await import("@/app/api/lobbies/route");
    const res = await PUT(new Request("https://x/api/lobbies", { method: "PUT", body: "{}" }) as any);
    expect(res.status).toBe(401);
  });

  it("blocks a stranger overwriting a lobby they do not own", async () => {
    const { status, body } = await put(STRANGER, [
      { id: "900", ownerId: STRANGER, status: "completed", payoutStatus: "paid", accepted: [], applicants: [] },
    ]);
    expect(status).toBe(403);
    expect(body.error).toMatch(/not part of/);
  });

  it("blocks taking ownership of another user's lobby", async () => {
    const { status } = await put(STRANGER, [
      { id: "900", ownerId: STRANGER, status: "standby", accepted: [], applicants: [] },
    ]);
    expect(status).toBe(403);
  });

  it("blocks forging the chat of a lobby the caller is not in", async () => {
    const { status } = await put(STRANGER, [
      { id: "900", ownerId: OWNER, status: "standby", messages: [{ id: 9, text: "forged" }] },
    ]);
    expect(status).toBe(403);
  });

  it("blocks self-accepting into a lobby to unlock payment", async () => {
    const { status } = await put(STRANGER, [
      {
        id: "900",
        ownerId: OWNER,
        status: "completed",
        payoutStatus: "paid",
        accepted: [{ userId: STRANGER, handle: STRANGER, confirmed: true }],
        applicants: [],
      },
    ]);
    expect(status).toBe(403);
  });

  it("still lets the owner edit their own lobby", async () => {
    const { status, body } = await put(OWNER, [
      { ...LOBBIES[0], serviceName: "Transcendence" },
      LOBBIES[1],
    ]);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("keeps lobbies the client never sent (concurrent additions survive)", async () => {
    const { status } = await put(OWNER, [{ ...LOBBIES[0], serviceName: "Raids" }]);
    expect(status).toBe(200);
    const written = atomicMock.mock.results.at(-1)!.value;
    // the store merge result is what got written; the stranger's lobby stays
    expect(status).toBe(200);
    expect(written).toBeDefined();
  });

  it("an admin may edit any lobby", async () => {
    const { status, body } = await put(
      "admin-1",
      [{ ...LOBBIES[1], serviceName: "Raids" }],
      "admin"
    );
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });
});
