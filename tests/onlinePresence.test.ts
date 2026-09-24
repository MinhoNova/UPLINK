import { describe, it, expect } from "vitest";
import { isUserOnline, ONLINE_WINDOW_MS, filterDataForUser } from "@/lib/dataAccess";

describe("isUserOnline", () => {
  const now = Date.now();

  it("returns true when lastSeenAt is within the window", () => {
    expect(isUserOnline({ lastSeenAt: now - 30_000 }, now)).toBe(true);
  });

  it("returns false when lastSeenAt just passed the window", () => {
    expect(isUserOnline({ lastSeenAt: now - ONLINE_WINDOW_MS - 1 }, now)).toBe(false);
  });

  it("returns false for missing / non-numeric lastSeenAt", () => {
    expect(isUserOnline(null, now)).toBe(false);
    expect(isUserOnline({}, now)).toBe(false);
    expect(isUserOnline({ lastSeenAt: "recent" }, now)).toBe(false);
  });
});

describe("filterDataForUser online flag", () => {
  const now = Date.now();

  it("adds the online boolean for other users but strips lastSeenAt", () => {
    const data: Record<string, unknown> = {
      registeredUsers: [
        { id: "me", username: "me", lastSeenAt: now, blocked: ["x"], email: "a@b.c", lastKnownIp: "1.2.3.4" },
        { id: "other-online", username: "hero", lastSeenAt: now - 5_000, email: "o@b.c" },
        { id: "other-offline", username: "ghost", lastSeenAt: now - ONLINE_WINDOW_MS - 10_000 },
      ],
    };
    const out = filterDataForUser(data, "me", "me");
    const users = out.registeredUsers as Record<string, unknown>[];
    const hero = users.find((u) => u.id === "other-online");
    const ghost = users.find((u) => u.id === "other-offline");
    const self = users.find((u) => u.id === "me");
     expect((hero as any).online).toBe(true);
    expect((ghost as any).online).toBe(false);
    expect((hero as any).lastSeenAt).toBeUndefined();
    expect((hero as any).email).toBeUndefined();
    expect((self as any).lastSeenAt).toBe(now);
    expect((self as any).online).toBeUndefined();
  });
});


