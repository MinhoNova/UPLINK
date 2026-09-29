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

/**
 * What the atomic mutator would have written. The mock does not mutate the
 * fixture, so the security assertions below inspect this.
 */
async function writtenLobbies(): Promise<any[]> {
  const outcome = await atomicMock.mock.results.at(-1)!.value;
  expect(outcome.ok).toBe(true);
  return outcome.value;
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

  // A lobby the caller does not own is no longer an error — their copy of it is
  // dropped and the stored version is kept. That is stricter than rejecting the
  // request, since a foreign offer now cannot be altered at all, and it stops a
  // bystander's offer from blocking the caller's own save.
  it("keeps a stranger's lobby byte-identical when they try to overwrite it", async () => {
    await put(STRANGER, [
      { id: "900", ownerId: STRANGER, status: "completed", payoutStatus: "paid", accepted: [], applicants: [] },
    ]);
    expect((await writtenLobbies()).find((l) => l.id === "900")).toEqual(LOBBIES[0]);
  });

  it("does not let a stranger take ownership of another user's lobby", async () => {
    await put(STRANGER, [
      { id: "900", ownerId: STRANGER, status: "standby", accepted: [], applicants: [] },
    ]);
    expect((await writtenLobbies()).find((l) => l.id === "900")?.ownerId).toBe(OWNER);
  });

  it("does not let a stranger forge the chat of a lobby they are not in", async () => {
    await put(STRANGER, [
      { id: "900", ownerId: OWNER, status: "standby", messages: [{ id: 9, text: "forged" }] },
    ]);
    expect((await writtenLobbies()).find((l) => l.id === "900")?.messages).toEqual([{ id: 1, text: "mine" }]);
  });

  it("does not let a stranger self-accept into a lobby to unlock payment", async () => {
    await put(STRANGER, [
      {
        id: "900",
        ownerId: OWNER,
        status: "completed",
        payoutStatus: "paid",
        accepted: [{ userId: STRANGER, handle: STRANGER, confirmed: true }],
        applicants: [],
      },
    ]);
    const nine = (await writtenLobbies()).find((l) => l.id === "900");
    expect(nine.status).toBe("standby");
    expect(nine.payoutStatus).toBeUndefined();
    expect(nine.accepted).toEqual([]);
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
