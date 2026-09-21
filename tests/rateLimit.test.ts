import { describe, it, expect, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const store: Record<string, unknown> = {};
  return {
    initTables: vi.fn(),
    updateKVAtomic: vi.fn(async (key: string, updater: (current: unknown) => unknown) => {
      const next = updater(store[key]);
      if (next === undefined) return { ok: false };
      store[key] = next;
      return { ok: true };
    }),
    rateLimitByIp: vi.fn(),
  };
});

vi.mock("@/lib/db", () => mocks);
vi.mock("@/lib/rateLimitDistributed", () => ({ rateLimitByIp: mocks.rateLimitByIp }));

import { rateLimitByUser } from "@/lib/rateLimit";

describe("rateLimitByUser", () => {
  it("allows requests up to the configured limit, then blocks", async () => {
    const results = [];
    for (let i = 0; i < 3; i++) results.push(await rateLimitByUser("u1", "a", 3));
    expect(results.map((r) => r.ok)).toEqual([true, true, true]);
    const blocked = await rateLimitByUser("u1", "a", 3);
    expect(blocked.ok).toBe(false);
  });

  it("accepts a blocked user again after the window expires", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000_000);
    for (let i = 0; i < 3; i++) await rateLimitByUser("u2", "b", 3);
    expect((await rateLimitByUser("u2", "b", 3)).ok).toBe(false);
    vi.setSystemTime(1_000_000_000 + 61_000);
    expect((await rateLimitByUser("u2", "b", 3)).ok).toBe(true);
    vi.useRealTimers();
  });

  it("tracks separate buckets per user and action", async () => {
    await rateLimitByUser("u3", "c", 1);
    expect((await rateLimitByUser("u3", "d", 1)).ok).toBe(true);
    expect((await rateLimitByUser("u4", "c", 1)).ok).toBe(true);
  });
});