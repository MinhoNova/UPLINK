import { describe, it, expect, vi } from "vitest";

/**
 * CSRF. `sameOrigin` used to `return true` unconditionally, so a malicious page
 * could POST to every cookie-authenticated API route from a logged-in victim's
 * browser. These tests pin the browser-like vectors that must be rejected.
 */

vi.mock("@/lib/authEnv", () => ({
  getAppSession: vi.fn(async () => ({
    user: { id: "user-1", username: "alice", name: "Alice" },
  })),
}));
vi.mock("@/lib/banCheck", () => ({ isUserBanned: vi.fn(async () => false) }));
vi.mock("@/lib/roles", () => ({
  getUserRole: vi.fn(async () => "user"),
  isLegacyAdmin: vi.fn(() => false),
}));

import { requireSession } from "@/lib/authz";

function post(headers: Record<string, string>) {
  return new Request("https://aion2lfg.com/api/lobbies/apply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Host: "aion2lfg.com",
      ...headers,
    },
    body: "{}",
  }) as any;
}

describe("sameOrigin gate inside requireSession", () => {
  it("rejects a cross-site fetch from a malicious origin", async () => {
    process.env.NEXTAUTH_URL = "https://aion2lfg.com";
    const res = await requireSession(
      post({ Origin: "https://evil.example", "Sec-Fetch-Site": "cross-site" })
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/Cross-origin/i);
  });

  it("rejects an origin that differs from the host even without sec-fetch-site", async () => {
    const res = await requireSession(post({ Origin: "https://evil.example" }));
    expect(res.ok).toBe(false);
  });

  it("allows a same-origin POST", async () => {
    const res = await requireSession(post({ Origin: "https://aion2lfg.com" }));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.user.id).toBe("user-1");
  });

  it("allows the configured site URL as an origin", async () => {
    process.env.NEXTAUTH_URL = "https://aion2lfg.com";
    const res = await requireSession(
      post({ Origin: "https://www.aion2lfg.com", "Sec-Fetch-Site": "same-site" })
    );
    expect(res.ok).toBe(true);
  });

  it("allows non-browser callers (no Origin header)", async () => {
    const res = await requireSession(post({}));
    expect(res.ok).toBe(true);
  });

  it("rejects a cross-site navigation-driven request (sec-fetch-site cross-site, no origin)", async () => {
    const res = await requireSession(post({ "Sec-Fetch-Site": "cross-site" }));
    expect(res.ok).toBe(false);
  });
});