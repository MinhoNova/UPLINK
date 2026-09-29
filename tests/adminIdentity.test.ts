import { describe, it, expect } from "vitest";
import { isLegacyAdmin } from "@/lib/roles";
import { ADMIN_IDS, ADMIN_HANDLES } from "@/lib/rolesConstants";

/**
 * Admin status must key on the immutable Discord snowflake, never on the
 * username. The username arrives from Discord and is mirrored into
 * registeredUsers, and a Discord user can rename their own account — so a
 * handle match hands admin to whoever renames to `omarsaleh97`.
 */
describe("admin identity", () => {
  it("still grants admin to the real admin Discord ids", () => {
    for (const id of ADMIN_IDS) {
      expect(isLegacyAdmin(id, "whatever-they-typed")).toBe(true);
    }
  });

  it("does not grant admin to a stranger wearing an admin handle", () => {
    for (const handle of ADMIN_HANDLES) {
      expect(isLegacyAdmin("999999999999999999", handle)).toBe(false);
    }
  });

  it("does not grant admin to a stranger whose handle case differs", () => {
    for (const handle of ADMIN_HANDLES) {
      expect(isLegacyAdmin("999999999999999999", handle.toUpperCase())).toBe(false);
    }
  });

  it("does not grant admin to an ordinary user", () => {
    expect(isLegacyAdmin("1234567890", "somebody")).toBe(false);
  });
});
