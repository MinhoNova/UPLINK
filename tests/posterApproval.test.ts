import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * The posting gate: a brand-new account may browse and apply, but must not be
 * able to publish an offer until a staff member approves it. The legacy carve-out
 * keeps people who used the site before the gate shipped unblocked.
 */

const { getKVMock, setKVMock, initTablesMock, updateKVAtomicMock } = vi.hoisted(() => {
  const getKV = vi.fn();
  const setKV = vi.fn();
  const initTables = vi.fn();
  const updateKVAtomic = vi.fn();
  return { getKVMock: getKV, setKVMock: setKV, initTablesMock: initTables, updateKVAtomicMock: updateKVAtomic };
});

vi.mock("@/lib/db", () => ({
  getKV: getKVMock as any,
  setKV: setKVMock as any,
  updateKVAtomic: updateKVAtomicMock as any,
  initTables: initTablesMock as any,
}));

import {
  getPosterStanding,
  submitPosterRequest,
  decidePosterRequest,
  listPosterRequests,
  setPosterApproval,
} from "@/lib/posterApproval";

/** Make updateKVAtomic behave like a real KV store named `registeredUsers`. */
function setUsersStore(users: any[]) {
  getKVMock.mockImplementation(async (k: string) => {
    if (k === "registeredUsers") return users;
    return null;
  });
  updateKVAtomicMock.mockImplementation(async (k: string, mutator: any) => {
    const cur = k === "registeredUsers" ? users : null;
    const next = mutator(cur);
    if (next === undefined) return { ok: false };
    if (k === "registeredUsers") {
      users.length = 0;
      users.push(...(next as any[]));
    }
    return { ok: true, value: next };
  });
}

function setRequestsStore(store: unknown) {
  getKVMock.mockImplementation(async (k: string) => (k === "offerPostRequests" ? store : null));
  updateKVAtomicMock.mockImplementation(async (k: string, mutator: any) => {
    const cur = k === "offerPostRequests" ? store : null;
    const next = mutator(cur);
    if (next === undefined) return { ok: false };
    if (k === "offerPostRequests") store = next;
    return { ok: true, value: next };
  });
}

describe("getPosterStanding", () => {
  it("allows staff unconditionally", async () => {
    expect((await getPosterStanding({ id: "1", username: "x" }, "admin")).allowed).toBe(true);
    expect((await getPosterStanding(null, "moderator")).allowed).toBe(true);
  });

  it("blocks a brand-new account that has not requested approval", async () => {
    const s = await getPosterStanding({ id: "new", username: "new", posterApprovedAt: null }, "user", 0);
    expect(s.allowed).toBe(false);
    expect(s.reason).toBe("not_requested");
  });

  it("allows an account an admin stamped", async () => {
    const s = await getPosterStanding({ id: "1", username: "x", posterApprovedAt: 123 }, "user", 0);
    expect(s.allowed).toBe(true);
    expect(s.reason).toBe("approved");
  });

  it("legacy users who already own an offer stay unblocked", async () => {
    const s = await getPosterStanding({ id: "old", username: "old", posterApprovedAt: null }, "user", 3);
    expect(s.allowed).toBe(true);
    expect(s.reason).toBe("legacy");
  });

  it("legacy carve-out does not apply to accounts with zero offers", async () => {
    const s = await getPosterStanding({ id: "old", username: "old", posterApprovedAt: null }, "user", 0);
    expect(s.allowed).toBe(false);
  });
});

describe("submitPosterRequest", () => {
  beforeEach(() => {
    getKVMock.mockReset();
    updateKVAtomicMock.mockReset();
    setKVMock.mockReset();
  });

  it("files one pending request and a second file aborts", async () => {
    setRequestsStore(null);

    const first = await submitPosterRequest({ userId: "1", handle: "h" });
    expect(first).toEqual({ ok: true, status: "pending" });

    const second = await submitPosterRequest({ userId: "1", handle: "h" });
    expect(second.ok).toBe(false);

    const requests = await listPosterRequests();
    expect(requests).toHaveLength(1);
    expect(requests[0].status).toBe("pending");
  });

  it("a rejected account may re-file", async () => {
    setRequestsStore([
      { id: "r1", userId: "1", handle: "h", status: "rejected", createdAt: 1, decidedAt: 2 },
    ]);
    const res = await submitPosterRequest({ userId: "1", handle: "h", note: "actually legit" });
    expect(res.ok).toBe(true);
  });
});

describe("setPosterApproval", () => {
  beforeEach(() => {
    getKVMock.mockReset();
    updateKVAtomicMock.mockReset();
  });

  it("stamps posterApprovedAt on the row and only that row", async () => {
    const users: any[] = [
      { id: "1", username: "one" },
      { id: "2", username: "two" },
    ];
    setUsersStore(users);

    await setPosterApproval("1", true);
    expect(users.find((u) => u.id === "1").posterApprovedAt).toBeGreaterThan(0);
    expect(users.find((u) => u.id === "2").posterApprovedAt).toBeUndefined();

    await setPosterApproval("1", false);
    expect(users.find((u) => u.id === "1").posterApprovedAt).toBeNull();
  });
});

describe("decidePosterRequest", () => {
  beforeEach(() => {
    getKVMock.mockReset();
    updateKVAtomicMock.mockReset();
  });

  it("approving a pending request stamps approved and rewrites the user row", async () => {
    const store: any[] = [
      { id: "req-1", userId: "7", handle: "h", status: "pending", createdAt: 1 },
    ];
    const users: any[] = [{ id: "7", username: "h", posterApprovedAt: null }];
    setRequestsStore(store);

    getKVMock.mockImplementation(async (k: string) => {
      if (k === "offerPostRequests") return store;
      if (k === "registeredUsers") return users;
      return null;
    });
    updateKVAtomicMock.mockImplementation(async (k: string, mutator: any) => {
      const cur = k === "offerPostRequests" ? store : k === "registeredUsers" ? users : null;
      const next = mutator(cur);
      if (next === undefined) return { ok: false };
      if (k === "offerPostRequests") {
        store.length = 0;
        store.push(...(next as any[]));
      } else if (k === "registeredUsers") {
        users.length = 0;
        users.push(...(next as any[]));
      }
      return { ok: true, value: next };
    });

    const res = await decidePosterRequest({ requestId: "req-1", approve: true, decidedBy: "admin-0" });
    expect(res).toEqual({ ok: true, status: "approved" });
    expect(users.find((u) => u.id === "7").posterApprovedAt).toBeGreaterThan(0);

    // Already decided — cannot flip a second time.
    const again = await decidePosterRequest({ requestId: "req-1", approve: false, decidedBy: "admin-0" });
    expect(again.ok).toBe(false);
  });
});