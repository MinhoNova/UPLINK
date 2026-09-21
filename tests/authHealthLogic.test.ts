import { describe, it, expect } from "vitest";
import { failureHint, needsRealert, RE_ALERT_INTERVAL_MS } from "@/lib/authHealthLogic";

describe("failureHint", () => {
  it("flags missing NEXTAUTH_SECRET first", () => {
    const hint = failureHint("invalid_client", "Invalid Client", false, 401);
    expect(hint).toContain("NEXTAUTH_SECRET is missing");
  });

  it("maps invalid_client to the Discord secret guide", () => {
    const hint = failureHint("invalid_client", "Invalid Client", true, 401);
    expect(hint).toContain("DISCORD_CLIENT_SECRET");
    expect(hint).toContain("OAuthCallback");
  });

  it("includes the API error and description", () => {
    expect(failureHint("some_error", "the details", true, 400)).toBe("some_error (HTTP 400) — the details");
  });

  it("falls back to a generic message when there is no error", () => {
    expect(failureHint(null, null, true, 0)).toBe("unexpected failure (HTTP 0)");
  });
});

describe("needsRealert", () => {
  const now = 1_000_000_000;

  it("is true when never alerted before", () => {
    expect(needsRealert(null, now)).toBe(true);
  });

  it("is true when the last alert is older than the interval", () => {
    expect(needsRealert(now - RE_ALERT_INTERVAL_MS, now)).toBe(true);
    expect(needsRealert(now - RE_ALERT_INTERVAL_MS - 1, now)).toBe(true);
  });

  it("is false when alerted within the interval", () => {
    expect(needsRealert(now - RE_ALERT_INTERVAL_MS + 1, now)).toBe(false);
    expect(needsRealert(now, now)).toBe(false);
  });
});