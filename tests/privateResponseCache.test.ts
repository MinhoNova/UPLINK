import { describe, it, expect, vi } from "vitest";

/**
 * Private responses must never be storable at the edge.
 *
 * A handler that forgets `Cache-Control` does not fail loudly: the edge stores
 * the first signed-in account's response and replays it to everybody after
 * them, so their own threads stop resolving and admins see another account's
 * view of the site. These tests pin the headers that make that impossible.
 */

vi.mock("@/lib/rateLimitDistributed", () => ({
  rateLimitByIp: vi.fn(async () => ({ ok: true })),
}));

async function run(path: string) {
  const { NextRequest } = await import("next/server");
  const { middleware } = await import("@/middleware");
  const req = new NextRequest(`https://aion2lfg.com${path}`, {
    headers: { cookie: "authjs.session-token=stub" },
  });
  return middleware(req);
}

describe("private API responses are no-store", () => {
  it("marks /api/data no-store so one account's snapshot is never replayed", async () => {
    const res = await run("/api/data");
    expect(res.headers.get("Cache-Control")).toContain("no-store");
    expect(res.headers.get("Vary")).toContain("Cookie");
  });

  it("marks the mission thread endpoint no-store", async () => {
    const res = await run("/api/lobbies/thread?id=1");
    expect(res.headers.get("Cache-Control")).toContain("no-store");
  });

  it("marks per-account endpoints no-store", async () => {
    for (const path of [
      "/api/chat/general",
      "/api/friends",
      "/api/users/me",
      "/api/health/whoami",
      "/api/community/posts",
    ]) {
      const res = await run(path);
      expect(res.headers.get("Cache-Control"), path).toContain("no-store");
    }
  });

  it("leaves genuinely public asset routes cacheable", async () => {
    for (const path of ["/api/aion2/portrait", "/api/user/media"]) {
      const res = await run(path);
      expect(res.headers.get("Cache-Control"), path).toBeNull();
    }
  });
});

describe("signed-in pages are no-store", () => {
  it("marks the mission thread page no-store", async () => {
    const res = await run("/manage/1790139137329");
    expect(res.headers.get("Cache-Control")).toContain("no-store");
    expect(res.headers.get("Vary")).toContain("Cookie");
  });

  it("marks the admin and profile pages no-store", async () => {
    for (const path of ["/admin", "/my-profile", "/create-offer"]) {
      const res = await run(path);
      expect(res.headers.get("Cache-Control"), path).toContain("no-store");
    }
  });

  it("leaves public pages alone", async () => {
    for (const path of ["/", "/lfg", "/community", "/privacy"]) {
      const res = await run(path);
      expect(res.headers.get("Cache-Control"), path).toBeNull();
    }
  });
});
