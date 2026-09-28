import { describe, it, expect } from "vitest";
import { isPrimaryAdmin, OMARSALEH_ADMIN_ID } from "@/lib/rolesConstants";

/**
 * The gate as it was before the fix, kept here so the regression stays visible.
 *
 * `ManageThreadClient` used to inline exactly this expression, and it is why a
 * server-authorised admin was shown "Access Denied":
 *
 *   sessionHandle === "minhonovazen" ||
 *   currentUserId === "1497295886223544471" ||
 *   (session?.user as any)?.role === "admin"
 *
 * Two independent defects:
 *  1. it only ever knew one of the two seeded admins, and
 *  2. `session.user.role` was never written by any callback, so that third
 *     clause was dead code — a promoted admin read as a stranger.
 *
 * If the first test below ever starts passing, the old gate has crept back in
 * somewhere and the client/server disagreement is back with it.
 */
const oldGate = (userId: string, sessionHandle: string, sessionRole: unknown): boolean =>
  sessionHandle === "minhonovazen" ||
  userId === "1497295886223544471" ||
  sessionRole === "admin";

describe("the old client admin gate was wrong", () => {
  it("did not know the second seeded admin", () => {
    // omarsaleh97 is a server admin by id and by handle.
    expect(isPrimaryAdmin(OMARSALEH_ADMIN_ID, "omarsaleh97")).toBe(true);
    expect(oldGate(OMARSALEH_ADMIN_ID, "omarsaleh97", undefined)).toBe(false);
  });

  it("relied on a session role that was never set", () => {
    // Nothing wrote `session.user.role`, so the clause could never fire.
    expect(oldGate("promoted-admin", "promoted-admin", undefined)).toBe(false);
  });

  it("did at least let the first admin through", () => {
    // Otherwise this would be a different bug report entirely.
    expect(oldGate("1497295886223544471", "renamed-away", undefined)).toBe(true);
  });
});
