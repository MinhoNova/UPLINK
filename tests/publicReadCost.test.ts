import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * The heaviest read in the app — `GET /api/data` — has two branches, and the
 * anonymous one used to have no ceiling of its own.
 *
 * The signed-in branch is bounded: 90 requests a minute per account and 240 per
 * address, checked at `data/route.ts` before the blob is read. The anonymous
 * branch returns earlier than either of those lines, so a visitor asking for the
 * homepage reached `getKVPairs()` — which selects and `JSON.parse`s every row in
 * `kv_store` — and, when the lobbies row came back empty, a second unfiltered
 * `SELECT key, value FROM kv_store` on top. Only the middleware's shared 150/min
 * per-address bucket stood in front of it.
 *
 * Two smaller routes made the same trade for far less: `hero-bg` and
 * `offer-banner-bg` are public design-setting reads whose whole answer is one
 * allowlisted string, and each was calling `getKVPairs()` to get it.
 */

const h = vi.hoisted(() => {
  const state = {
    kv: new Map<string, unknown>(),
    pairCalls: 0,
    getCalls: 0,
    rateLimitCalls: [] as { key: string; limit: number }[],
    rateLimitOk: true,
  };

  const d1 = {
    prepare() {
      return {
        bind() {
          return {
            async first() {
              return null;
            },
            async all() {
              return { results: [] };
            },
            async run() {
              return { meta: { changes: 1 } };
            },
          };
        },
      };
    },
  };

  return { state, d1 };
});

const { state, d1 } = h;

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => ({ env: { DB: d1 } }),
}));

vi.mock("@/lib/d1", () => ({
  ensureD1Schema: vi.fn(async () => d1),
  getD1: vi.fn(async () => d1),
  KV_SCHEMA_SQL: "",
}));

vi.mock("@/lib/db", () => ({
  initTables: vi.fn(async () => {}),
  getKV: vi.fn(async (key: string) => {
    state.getCalls += 1;
    return state.kv.get(key) ?? null;
  }),
  getKVPairs: vi.fn(async () => {
    state.pairCalls += 1;
    return Object.fromEntries(state.kv);
  }),
  setKV: vi.fn(async (key: string, value: unknown) => {
    state.kv.set(key, value);
  }),
}));

vi.mock("@/lib/rateLimit", () => ({
  rateLimitByUser: vi.fn(async (_id: string, action: string) => {
    state.rateLimitCalls.push({ key: `user:${action}`, limit: 90 });
    return state.rateLimitOk ? { ok: true } : { ok: false, retryAfterMs: 1000 };
  }),
  rateLimitByIp: vi.fn(async (ip: string, path: string, limit: number) => {
    state.rateLimitCalls.push({ key: `ip:${path}`, limit });
    return state.rateLimitOk ? { ok: true } : { ok: false, retryAfterMs: 1000 };
  }),
}));

vi.mock("@/lib/rateLimitHttp", () => ({
  rateLimitResponse: () => new Response(JSON.stringify({ error: "rate limited" }), { status: 429 }),
}));

vi.mock("@/lib/cloudflareBindings", () => ({
  FULL_DATA_CACHE_KEY: "public-data:v1:full",
  getPublicDataCached: vi.fn(async () => null),
  setPublicDataCached: vi.fn(async () => {}),
  publicDataCacheKey: (k: string | null) => `pk:${k ?? "all"}`,
  invalidatePublicDataCache: vi.fn(async () => {}),
  invalidateThreadBlobCache: vi.fn(async () => {}),
}));

vi.mock("@/lib/authz", () => ({
  requireSession: vi.fn(async () => ({ ok: false, error: "Unauthorized", status: 401 })),
}));

vi.mock("@/lib/authEnv", () => ({
  getAppSession: vi.fn(async () => null),
  getActiveSession: vi.fn(async () => null),
}));

vi.mock("@/lib/ipBan", () => ({
  rejectIfIpBannedUnlessAdmin: vi.fn(async () => null),
}));

vi.mock("@/lib/banCheck", () => ({
  isUserBanned: vi.fn(async () => false),
  getBanInfo: vi.fn(async () => null),
  bannedResponse: () => new Response("banned", { status: 403 }),
}));

vi.mock("@/lib/requestIp", () => ({
  getClientIp: () => "9.9.9.9",
}));

import { GET as dataGet } from "@/app/api/data/route";
import { GET as heroGet } from "@/app/api/site/hero-bg/route";
import { GET as offerBannerGet } from "@/app/api/site/offer-banner-bg/route";

function req(url: string) {
  return new Request(url);
}

beforeEach(() => {
  state.kv.clear();
  state.pairCalls = 0;
  state.getCalls = 0;
  state.rateLimitCalls = [];
  state.rateLimitOk = true;
});

describe("the anonymous read of /api/data is bounded", () => {
  it("checks a ceiling before it parses the store", async () => {
    // An empty store forces the second, unfiltered SELECT as well, so this is
    // the worst case the anonymous branch can reach.
    state.kv.set("lobbies", []);

    const res = await dataGet(req("https://x.test/api/data"));

    expect(res.status).toBe(200);
    const limits = state.rateLimitCalls.map((c) => c.key);
    expect(limits).toContain("ip:/api/data:public");
    // The public ceiling must be a distinct bucket, not the signed-in one.
    expect(limits).not.toContain("ip:/api/data");
    expect(limits).not.toContain("user:data-read");
  });

  it("answers 429 without touching the store once the ceiling is reached", async () => {
    state.rateLimitOk = false;
    state.kv.set("lobbies", []);

    const res = await dataGet(req("https://x.test/api/data"));

    expect(res.status).toBe(429);
    // The whole point: a refused visitor costs no blob parse at all.
    expect(state.pairCalls).toBe(0);
    expect(state.getCalls).toBe(0);
  });
});

describe("public design-setting reads fetch one row, not the whole store", () => {
  it("reads a single key for the hero background", async () => {
    state.kv.set("heroBg", "aurora");
    // Other rows are present precisely to make a full scan expensive.
    state.kv.set("lobbies", [{ id: "a" }]);
    state.kv.set("registeredUsers", [{ id: "b" }]);
    state.kv.set("directMessages", [{ id: "c" }]);

    const res = await heroGet();
    const body = (await res.json()) as { bg: string };

    expect(body.bg).toBe("aurora");
    expect(state.pairCalls).toBe(0);
    expect(state.getCalls).toBe(1);
  });

  it("reads a single key for the offer banner background", async () => {
    // "glacier" is one of the allowlisted keys; anything else collapses to the
    // default, which would make this assertion pass for the wrong reason.
    state.kv.set("offerBannerBg", "glacier");
    state.kv.set("lobbies", [{ id: "a" }]);
    state.kv.set("registeredUsers", [{ id: "b" }]);

    const res = await offerBannerGet();
    const body = (await res.json()) as { bg: string };

    expect(body.bg).toBe("glacier");
    expect(state.pairCalls).toBe(0);
    expect(state.getCalls).toBe(1);
  });

  it("still falls back to the default when the key is missing or not allowed", async () => {
    const missing = (await (await heroGet()).json()) as { bg: string };
    expect(missing.bg).not.toBe("");

    state.kv.set("heroBg", "not-a-real-theme");
    const rejected = (await (await heroGet()).json()) as { bg: string };
    expect(rejected.bg).not.toBe("not-a-real-theme");
  });
});
