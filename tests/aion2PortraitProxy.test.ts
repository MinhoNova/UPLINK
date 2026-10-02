import { describe, it, expect, vi, afterEach } from "vitest";

/**
 * Regression: characters with no real portrait all rendered as the same badge.
 *
 * profileimg.plaync.com answers 200 with a ~9.5 KB `image/png` "no portrait
 * set" placeholder whenever `gameServerKey` does not match the character, and a
 * ~30 KB `image/jpeg` when it does. The proxy only checked size (> 4 KB), so
 * the placeholder passed and was cached at the CDN for an hour — every member
 * showed the identical generic image, which looked like a broken portrait.
 *
 * Verified against the live host while fixing this:
 *   correct key -> 200, 30146 bytes, image/jpeg
 *   wrong key   -> 200,  9594 bytes, image/png
 */

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
  vi.restoreAllMocks();
});

async function callProxy(u: string) {
  const { GET } = await import("@/app/api/aion2/portrait/route");
  const req = new Request(`http://localhost/api/aion2/portrait?u=${encodeURIComponent(u)}`);
  return GET(req);
}

function mockUpstream(bytes: number, contentType: string) {
  globalThis.fetch = vi.fn(
    async () =>
      new Response(new Uint8Array(bytes), {
        status: 200,
        headers: { "content-type": contentType },
      })
  ) as unknown as typeof fetch;
}

describe("portrait proxy placeholder rejection", () => {
  const allowed = "https://profileimg.plaync.com/game_profile_images/aion2/images?gameServerKey=1007&charKey=42";

  it("serves a real jpeg portrait", async () => {
    mockUpstream(30_146, "image/jpeg");
    const res = await callProxy(allowed);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/jpeg");
  });

  it("refuses the png placeholder that stands in for a missing portrait", async () => {
    mockUpstream(9_594, "image/png");
    const res = await callProxy(allowed);
    expect(res.status).toBe(502);
  });

  it("still refuses tiny error images", async () => {
    mockUpstream(128, "image/jpeg");
    const res = await callProxy(allowed);
    expect(res.status).toBe(502);
  });

  it("blocks hosts outside the plaync profile-image allowlist", async () => {
    const res = await callProxy("https://evil.example.com/a.jpg");
    expect(res.status).toBe(403);
  });
});
