import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * `/api/data` is the heaviest route on the site — a signed-in read parses and
 * rewrites the whole `kv_store` blob, and the client polls it every 2s while a
 * tab is visible. It also accepts a write that validates and upserts the same
 * blob. Both are now throttled.
 *
 * The ceilings matter as much as the throttling: a real player sits at ~30
 * reads a minute (2s poll) and saves once per click, so these limits are set far
 * above normal use. A limit low enough to catch a script but not to catch a
 * player with several tabs open is the whole requirement, and the tests below
 * pin the numbers so a later "tighten it up" change cannot quietly throttle
 * real users.
 */

const rl = vi.hoisted(() => ({
  ip: [] as { key: string; limit: number; windowMs: number }[],
  user: [] as { key: string; limit: number; windowMs: number }[],
  limited: false,
}));

vi.mock("@/lib/rateLimit", () => ({
  rateLimitByIp: vi.fn(async (_ip: string, path: string, limit = 120, windowMs = 60_000) => {
    rl.ip.push({ key: path, limit, windowMs });
    return rl.limited ? { ok: false, retryAfterMs: windowMs } : { ok: true };
  }),
  rateLimitByUser: vi.fn(async (_uid: string, action: string, limit: number, windowMs = 60_000) => {
    rl.user.push({ key: action, limit, windowMs });
    return rl.limited ? { ok: false, retryAfterMs: windowMs } : { ok: true };
  }),
}));

vi.mock("@/lib/rateLimitHttp", () => ({
  rateLimitResponse: (r: { retryAfterMs: number }) =>
    new Response(JSON.stringify({ error: "Too many requests", retryAfterMs: r.retryAfterMs }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    }),
}));

vi.mock("@/lib/authz", () => ({ requireSession: vi.fn() }));
vi.mock("@/lib/db", () => ({
  initTables: vi.fn(async () => {}),
  getKVPairs: vi.fn(async () => ({ lobbies: [], registeredUsers: [], me: { id: "p1", username: "p1" } })),
  getKV: vi.fn(async () => null as any),
  setKV: vi.fn(async () => {}),
}));
vi.mock("@/lib/identitySync", () => ({ repairIdentity: vi.fn(async () => ({ me: { username: "p1" } })) }));
vi.mock("@/lib/banCheck", () => ({
  isUserBanned: vi.fn(async () => false),
  getBanInfo: vi.fn(async () => null),
  bannedResponse: () => new Response("banned", { status: 403 }),
}));
vi.mock("@/lib/ipBan", () => ({ rejectIfIpBannedUnlessAdmin: vi.fn(async () => null) }));
vi.mock("@/lib/userLastIp", () => ({ touchUserLastIp: vi.fn(async () => {}) }));
vi.mock("@/lib/auditLog", () => ({ logAudit: vi.fn(async () => {}) }));
vi.mock("@/lib/paymentFraud", () => ({ recordPaymentFraudAttempt: vi.fn(async () => {}) }));
vi.mock("@/lib/marketPrice", () => ({
  recordMarketCompletion: vi.fn(async () => {}),
  getMarketAverageByService: vi.fn(() => ({})),
}));
vi.mock("@/lib/cloudflareBindings", () => ({
  getPublicDataCached: vi.fn(async () => null),
  setPublicDataCached: vi.fn(async () => {}),
  FULL_DATA_CACHE_KEY: "full",
}));
vi.mock("@/lib/dataAccess", () => ({ filterDataForUser: (d: any) => d }));
vi.mock("@/lib/secureDataWrite", () => ({
  stripAdminFromBanList: (v: any) => v,
  sanitizeBannedIdRecords: (v: any) => v,
  validateDataWrites: vi.fn(async () => ({ ok: true, value: {} })),
}));

async function signedIn(as = "p1") {
  const { requireSession } = await import("@/lib/authz");
  (requireSession as any).mockResolvedValue({ ok: true, user: { id: as, username: as, role: "user" } });
}

function get() {
  return import("@/app/api/data/route").then((m) =>
    m.GET(new Request("https://x/api/data", { headers: { "x-forwarded-for": "1.2.3.4" } }) as any)
  );
}

function post(payload: any = {}) {
  return import("@/app/api/data/route").then((m) =>
    m.POST(
      new Request("https://x/api/data", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json", "x-forwarded-for": "1.2.3.4" },
      }) as any
    )
  );
}

beforeEach(() => {
  rl.ip = [];
  rl.user = [];
  rl.limited = false;
  vi.clearAllMocks();
});

describe("GET /api/data is throttled", () => {
  it("caps a signed-in read per account and per address", async () => {
    await signedIn();
    const res = await get();
    expect(res.status).toBe(200);
    expect(rl.user.map((c) => c.key)).toContain("data-read");
    expect(rl.ip.map((c) => c.key)).toContain("/api/data");
  });

  it("leaves headroom above the client's 2s poll", async () => {
    await signedIn();
    await get();
    const read = rl.user.find((c) => c.key === "data-read")!;
    // A visible tab polls every 2s: 30/min. Several tabs at once is normal, so
    // the ceiling has to be a multiple of that, not equal to it.
    expect(read.windowMs).toBe(60_000);
    expect(read.limit).toBeGreaterThanOrEqual(90);
  });

  it("keeps the per-address ceiling high enough for players behind one NAT", async () => {
    await signedIn();
    await get();
    const perIp = rl.ip.find((c) => c.key === "/api/data")!;
    // A school, a café or a carrier NAT puts many real players on one address.
    // The per-account limit is the one that actually bounds the work, so this
    // one only has to stop a single flood.
    expect(perIp.limit).toBeGreaterThanOrEqual(240);
  });

  it("answers 429 with a retry hint when the account is over the limit", async () => {
    await signedIn();
    rl.limited = true;
    const res = await get();
    expect(res.status).toBe(429);
    const body = (await res.json()) as any;
    expect(body.retryAfterMs).toBeGreaterThan(0);
  });

  it("does not read the store at all once the limit is hit", async () => {
    await signedIn();
    const { getKVPairs } = await import("@/lib/db");
    rl.limited = true;
    await get();
    expect(getKVPairs).not.toHaveBeenCalled();
  });
});

describe("POST /api/data is throttled", () => {
  it("caps a write per account and per address", async () => {
    await signedIn();
    await post({});
    expect(rl.user.map((c) => c.key)).toContain("data-write");
    expect(rl.ip.some((c) => c.key.includes("write"))).toBe(true);
  });

  it("leaves headroom for normal click-through saves", async () => {
    await signedIn();
    await post({});
    const write = rl.user.find((c) => c.key === "data-write")!;
    // A save is a user action, not a poll, so this is far above real use.
    expect(write.limit).toBeGreaterThanOrEqual(60);
  });

  it("refuses the write before any validation runs when over the limit", async () => {
    await signedIn();
    const { validateDataWrites } = await import("@/lib/secureDataWrite");
    rl.limited = true;
    const res = await post({});
    expect(res.status).toBe(429);
    expect(validateDataWrites).not.toHaveBeenCalled();
  });

  it("throttles the account, not just the address, so rotating IPs does not help", async () => {
    await signedIn("p1");
    rl.limited = true;
    const { requireSession } = await import("@/lib/authz");
    (requireSession as any).mockResolvedValue({ ok: true, user: { id: "p1", username: "p1", role: "user" } });
    const res = await import("@/app/api/data/route").then((m) =>
      m.POST(
        new Request("https://x/api/data", {
          method: "POST",
          body: JSON.stringify({}),
          headers: { "Content-Type": "application/json", "x-forwarded-for": "9.9.9.9" },
        }) as any
      )
    );
    expect(res.status).toBe(429);
    expect(rl.user.some((c) => c.key === "data-write")).toBe(true);
  });
});
