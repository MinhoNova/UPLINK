import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * `POST /api/analytics/view` is anonymous by design — a page view has to be
 * countable before anyone signs in — and it does three read/write cycles on
 * shared `kv_store` rows per call. Nothing bounded how often it could be
 * called, so it was the cheapest route in the app to make expensive.
 *
 * The one that actually degraded was the unique-visitor row. It stores an array
 * of addresses and rewrites the whole thing whenever it meets one it has not
 * seen, with no ceiling on length. Rotating source addresses therefore made each
 * request re-read and re-serialize a blob that only ever got longer, to produce a
 * number the admin panel displays as a single integer. Past the cap the row
 * stops growing and the figure is reported as a floor.
 */

const h = vi.hoisted(() => {
  const state = {
    kv: new Map<string, unknown>(),
    writes: 0,
    rateLimitOk: true,
    rateLimitCalls: [] as { key: string; limit: number }[],
    // Rotated per request so a run can present a different source address each
    // time, which is the behaviour that grew the row before.
    ip: "9.9.9.9",
  };
  return { state };
});

const { state } = h;

vi.mock("@/lib/db", () => ({
  getKV: vi.fn(async (key: string) => state.kv.get(key) ?? null),
  setKV: vi.fn(async (key: string, value: unknown) => {
    state.writes += 1;
    state.kv.set(key, value);
  }),
  initTables: vi.fn(async () => {}),
}));

vi.mock("@/lib/authEnv", () => ({
  getAppSession: vi.fn(async () => null),
  getActiveSession: vi.fn(async () => null),
}));

vi.mock("@/lib/rateLimit", () => ({
  rateLimitByUser: vi.fn(async () => ({ ok: true })),
  rateLimitByIp: vi.fn(async (ip: string, path: string, limit: number) => {
    state.rateLimitCalls.push({ key: `ip:${path}`, limit });
    return state.rateLimitOk ? { ok: true } : { ok: false, retryAfterMs: 1000 };
  }),
}));

vi.mock("@/lib/rateLimitHttp", () => ({
  rateLimitResponse: () => new Response(JSON.stringify({ error: "rate limited" }), { status: 429 }),
}));

vi.mock("@/lib/requestIp", () => ({
  getClientIp: () => state.ip,
}));

import { POST } from "@/app/api/analytics/view/route";

function req() {
  return new Request("https://x.test/api/analytics/view", { method: "POST" });
}

/** The cap, restated here so the test fails if it is silently raised. */
const MAX_TRACKED = 5_000;

function uvKey() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `analytics:uv:${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

beforeEach(() => {
  state.kv.clear();
  state.writes = 0;
  state.rateLimitOk = true;
  state.rateLimitCalls = [];
  state.ip = "9.9.9.9";
});

describe("page-view counting is bounded", () => {
  it("checks a ceiling before it writes anything", async () => {
    const res = await POST(req());

    expect(res.status).toBe(200);
    expect(state.rateLimitCalls.map((c) => c.key)).toContain("ip:/api/analytics/view");
    expect(state.writes).toBeGreaterThan(0);
  });

  it("answers 429 and writes nothing once the ceiling is reached", async () => {
    state.rateLimitOk = false;

    const res = await POST(req());

    expect(res.status).toBe(429);
    // The point of checking first: a refused ping must not cost three
    // read/write cycles on shared rows.
    expect(state.writes).toBe(0);
  });
});

describe("the unique-visitor row cannot be grown without bound", () => {
  it("stops appending and stops rewriting once the cap is reached", async () => {
    // Pre-seed the row at the cap with addresses this run will not repeat.
    const seeded = Array.from({ length: MAX_TRACKED }, (_, i) => `10.0.${Math.floor(i / 256)}.${i % 256}`);
    state.kv.set(uvKey(), seeded);

    const writesBefore = state.writes;

    for (let i = 0; i < 25; i += 1) {
      // A fresh source address each time, which is what made this grow before.
      state.ip = `203.0.113.${i}`;
      const res = await POST(req());
      expect(res.status).toBe(200);
    }

    const stored = state.kv.get(uvKey()) as string[];
    // The seeded addresses survive untouched...
    expect(stored).toEqual(seeded);
    expect(stored).toHaveLength(MAX_TRACKED);
    // ...and, crucially, the UV row was not rewritten on any of those calls.
    // Page-view rows still move; only the capped list stops costing a write.
    const uvRewrites = state.writes - writesBefore - 25 * 2; // 2 non-UV rows per call
    expect(uvRewrites).toBe(0);
  });

  it("still tracks a new address while below the cap", async () => {
    const res = await POST(req());
    expect(res.status).toBe(200);

    const stored = state.kv.get(uvKey()) as string[];
    expect(Array.isArray(stored)).toBe(true);
    expect(stored.length).toBe(1);
  });

  it("does not append the same address twice", async () => {
    await POST(req());
    await POST(req());
    await POST(req());

    const stored = state.kv.get(uvKey()) as string[];
    expect(stored).toHaveLength(1);
  });
});
