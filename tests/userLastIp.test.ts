import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => {
  const store: Record<string, unknown> = {};
  return {
    initTables: vi.fn(),
    getKV: vi.fn(async (key: string) => (key in store ? store[key] : null)),
    setKV: vi.fn(async (key: string, value: unknown) => {
      store[key] = value;
    }),
    updateKVAtomic: vi.fn(),
    __store: store,
  };
});

vi.mock("@/lib/db", () => mocks);

import { touchUserLastIp } from "@/lib/userLastIp";

const A = "711027724663128106";
const B = "1472005392849703025";

/** Mirrors the real helper: re-read, apply, write, and retry on conflict. */
function fakeUpdateKVAtomic<T>(key: string, mutate: (current: T | null) => T | null | undefined) {
  const attempt = (): { ok: true; value: T } | { ok: false } => {
    const next = mutate((key in mocks.__store ? (mocks.__store[key] as T) : null) ?? null);
    if (next === null || next === undefined) return { ok: false };
    mocks.__store[key] = next;
    return { ok: true, value: next };
  };
  return Promise.resolve(attempt());
}

describe("touchUserLastIp", () => {
  beforeEach(() => {
    for (const key of Object.keys(mocks.__store)) delete mocks.__store[key];
    vi.clearAllMocks();
    mocks.updateKVAtomic.mockImplementation(fakeUpdateKVAtomic);
  });

  it("stamps lastSeenAt on the matching row", async () => {
    mocks.__store.registeredUsers = [
      { id: A, username: "omarsaleh97" },
      { id: B, username: "leonknox1" },
    ];

    await touchUserLastIp(B, "1.2.3.4");

    const users = mocks.__store.registeredUsers as any[];
    expect(users.find((u) => u.id === B).lastKnownIp).toBe("1.2.3.4");
    expect(users.find((u) => u.id === B).lastSeenAt).toBeTypeOf("number");
    // The other account is untouched.
    expect(users.find((u) => u.id === A).lastKnownIp).toBeUndefined();
  });

  it("keeps both accounts online when they poll together on one connection", async () => {
    mocks.__store.registeredUsers = [
      { id: A, username: "omarsaleh97", lastKnownIp: "9.9.9.9", lastSeenAt: Date.now() },
      { id: B, username: "leonknox1", lastKnownIp: "9.9.9.9", lastSeenAt: Date.now() },
    ];

    // Same IP for both — the shape that made a blind full-blob write lose one.
    await Promise.all([touchUserLastIp(A, "9.9.9.9"), touchUserLastIp(B, "9.9.9.9")]);

    const users = mocks.__store.registeredUsers as any[];
    expect(users).toHaveLength(2);
    expect(users.find((u) => u.id === A).lastSeenAt).toBeTypeOf("number");
    expect(users.find((u) => u.id === B).lastSeenAt).toBeTypeOf("number");
  });

  it("never drops a field another writer added", async () => {
    mocks.__store.registeredUsers = [{ id: A, username: "omarsaleh97" }];

    // A username sync lands first.
    (mocks.__store.registeredUsers as any[])[0].previousUsernames = ["leonknox1"];
    await touchUserLastIp(A, "5.5.5.5");

    expect((mocks.__store.registeredUsers as any[])[0].previousUsernames).toEqual(["leonknox1"]);
  });

  it("throttles repeat touches from the same ip", async () => {
    mocks.__store.registeredUsers = [{ id: A, username: "omarsaleh97" }];

    await touchUserLastIp(A, "7.7.7.7");
    const first = (mocks.__store.registeredUsers as any[])[0].lastSeenAt;
    await touchUserLastIp(A, "7.7.7.7");

    expect((mocks.__store.registeredUsers as any[])[0].lastSeenAt).toBe(first);
  });

  it("ignores an unknown ip and an unknown account", async () => {
    mocks.__store.registeredUsers = [{ id: A, username: "omarsaleh97" }];

    await touchUserLastIp(A, "unknown");
    expect(mocks.updateKVAtomic).not.toHaveBeenCalled();

    await touchUserLastIp("does-not-exist", "7.7.7.7");
    expect((mocks.__store.registeredUsers as any[])[0].lastKnownIp).toBeUndefined();
  });
});
