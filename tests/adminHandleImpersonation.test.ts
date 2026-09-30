import { describe, it, expect, vi, beforeEach } from "vitest";
import { isPrimaryAdmin, ADMIN_HANDLES, OMARSALEH_ADMIN_HANDLE } from "@/lib/rolesConstants";

/**
 * A Discord username is renameable by whoever owns the account, so it can never
 * be an authorisation input.
 *
 * `isPrimaryAdmin` is labelled "client-side UI gating only", but
 * `POST /api/chat/general` used it as the server-side override for editing and
 * deleting anyone's message:
 *
 *   if (target.userId !== caller && !isPrimaryAdmin(userId!, handle)) → 403
 *
 * and it matched on the handle, so any account could rename itself to
 * `omarsaleh97` and then delete or rewrite any other player's messages, with
 * the admin's name on it. The id is the only stable thing Discord gives us.
 */
describe("admin identification", () => {
  it("ignores a matching username, however exact", () => {
    for (const handle of ADMIN_HANDLES) {
      expect(isPrimaryAdmin("some-random-id", handle)).toBe(false);
      expect(isPrimaryAdmin("some-random-id", handle.toUpperCase())).toBe(false);
    }
    expect(isPrimaryAdmin("attacker-id", OMARSALEH_ADMIN_HANDLE)).toBe(false);
  });

  it("still recognises the real owner by their Discord id", () => {
    expect(isPrimaryAdmin("711027724663128106", "renamed-to-anything")).toBe(true);
    expect(isPrimaryAdmin("1497295886223544471", "")).toBe(true);
  });
});
