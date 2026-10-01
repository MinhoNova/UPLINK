import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * `POST /api/discord/broadcast` pushes an embed into a public Discord channel.
 * Ownership is already checked against the stored offer (a hand-rolled request
 * cannot post another player's offer), but the request is trivially repeatable:
 * looping it floods a channel that everyone in the community reads. These tests
 * pin the throttle, and pin that it is applied per account so the same request
 * re-sent from a different address does not buy a fresh budget.
 */

vi.mock("@/lib/authz", () => ({ requireSession: vi.fn() }));
vi.mock("@/lib/db", () => ({ initTables: vi.fn(async () => {}) }));
vi.mock("@/lib/discord", () => ({ sendLobbyEmbed: vi.fn(async () => {}) }));
vi.mock("@/lib/kvCache", () => ({ getKVCached: vi.fn(async () => []) }));

const rl = vi.hoisted(() => ({ limited: false, userOnly: false, ip: [] as any[], user: [] as any[] }));
vi.mock("@/lib/rateLimit", () => ({
  rateLimitByIp: vi.fn(async (_ip: string, path: string, limit?: number, windowMs?: number) => {
    rl.ip.push({ path, limit, windowMs });
    return rl.limited ? { ok: false, retryAfterMs: 60_000 } : { ok: true };
  }),
  rateLimitByUser: vi.fn(async (_uid: string, action: string, limit: number, windowMs?: number) => {
    rl.user.push({ action, limit, windowMs });
    return rl.limited || rl.userOnly ? { ok: false, retryAfterMs: 60_000 } : { ok: true };
  }),
}));
vi.mock("@/lib/rateLimitHttp", () => ({
  rateLimitResponse: (r: { retryAfterMs: number }) =>
    new Response(JSON.stringify({ error: "Too many requests", retryAfterMs: r.retryAfterMs }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    }),
}));

async function asPlayer(uid = "p1", lobbies: any[] = []) {
  const { requireSession } = await import("@/lib/authz");
  (requireSession as any).mockResolvedValue({ ok: true, user: { id: uid, username: uid, role: "user" } });
  const { getKVCached } = await import("@/lib/kvCache");
  (getKVCached as any).mockResolvedValue(lobbies);
}

function post(body: any, ip = "1.2.3.4") {
  return import("@/app/api/discord/broadcast/route").then((m) =>
    m.POST(
      new Request("https://x/api/discord/broadcast", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
      }) as any
    )
  );
}

beforeEach(() => {
  rl.limited = false;
  rl.userOnly = false;
  rl.ip = [];
  rl.user = [];
  vi.clearAllMocks();
  vi.stubEnv("DISCORD_BOT_TOKEN", "test-token");
});

describe("POST /api/discord/broadcast is throttled", () => {
  it("caps the request per account and per address", async () => {
    await asPlayer("p1", [{ id: "L1", ownerId: "p1" }]);
    const res = await post({ lobby: { id: "L1", ownerId: "p1" } });
    expect(res.status).toBe(200);
    expect(rl.user.map((c) => c.action)).toContain("discord-broadcast");
    expect(rl.ip.map((c) => c.path)).toContain("/api/discord/broadcast");
  });

  it("leaves room for a player posting several offers in a row", async () => {
    await asPlayer("p1", [{ id: "L1", ownerId: "p1" }]);
    await post({ lobby: { id: "L1" } });
    const perUser = rl.user.find((c) => c.action === "discord-broadcast")!;
    expect(perUser.limit).toBeGreaterThanOrEqual(5);
  });

  it("answers 429 instead of posting when the limit is hit", async () => {
    await asPlayer("p1", [{ id: "L1", ownerId: "p1" }]);
    const { sendLobbyEmbed } = await import("@/lib/discord");
    rl.limited = true;
    const res = await post({ lobby: { id: "L1" } });
    expect(res.status).toBe(429);
    expect(sendLobbyEmbed).not.toHaveBeenCalled();
  });

  it("checks the limit before the ownership lookup, so a flood costs nothing", async () => {
    await asPlayer("p1", [{ id: "L1", ownerId: "p1" }]);
    const { getKVCached } = await import("@/lib/kvCache");
    rl.limited = true;
    await post({ lobby: { id: "L1" } });
    expect(getKVCached).not.toHaveBeenCalled();
  });

  it("throttles the account, not just the address, so rotating IPs does not help", async () => {
    await asPlayer("p1", [{ id: "L1", ownerId: "p1" }]);
    // The address bucket is clean (a fresh IP) but the account is spent — which
    // is exactly the rotation an address-only limit fails to stop.
    rl.userOnly = true;
    const { sendLobbyEmbed } = await import("@/lib/discord");
    const res = await post({ lobby: { id: "L1" } }, "9.9.9.9");
    expect(res.status).toBe(429);
    expect(sendLobbyEmbed).not.toHaveBeenCalled();
  });

  it("still refuses to broadcast somebody else's offer", async () => {
    await asPlayer("p1", [{ id: "L1", ownerId: "p2" }]);
    const { sendLobbyEmbed } = await import("@/lib/discord");
    const res = await post({ lobby: { id: "L1", ownerId: "p1" } });
    expect(res.status).toBe(403);
    expect(sendLobbyEmbed).not.toHaveBeenCalled();
  });
});
