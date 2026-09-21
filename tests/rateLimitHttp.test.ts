import { describe, it, expect } from "vitest";
import { rateLimitResponse } from "@/lib/rateLimitHttp";

describe("rateLimitResponse", () => {
  it("returns 429 with JSON body", async () => {
    const res = rateLimitResponse({ ok: false, retryAfterMs: 2500 });
    expect(res.status).toBe(429);
    expect(res.headers.get("Content-Type")).toContain("application/json");
    expect(res.headers.get("Retry-After")).toBe("3");
    const body = (await res.json()) as { error: string; retryAfterMs: number };
    expect(body.error).toBe("Too many requests");
    expect(body.retryAfterMs).toBe(2500);
  });

  it("rounds retry-after up to whole seconds", () => {
    expect(rateLimitResponse({ ok: false, retryAfterMs: 1000 }).headers.get("Retry-After")).toBe("1");
    expect(rateLimitResponse({ ok: false, retryAfterMs: 1001 }).headers.get("Retry-After")).toBe("2");
    expect(rateLimitResponse({ ok: false, retryAfterMs: 999 }).headers.get("Retry-After")).toBe("1");
    expect(rateLimitResponse({ ok: false, retryAfterMs: 0 }).headers.get("Retry-After")).toBe("0");
  });
});