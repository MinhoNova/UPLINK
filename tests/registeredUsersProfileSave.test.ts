import { describe, it, expect } from "vitest";
import { validateRegisteredUsers } from "@/lib/secureDataWrite";

/**
 * Regression: a profile save could fail because somebody *else* had edited
 * theirs.
 *
 * The client keeps a snapshot of the whole roster and writes it back, so as soon
 * as another account changed anything the stored row no longer matched the
 * caller's copy and `validateRegisteredUsers` refused the entire save with
 * "Cannot modify other users". Nobody could save their profile.
 *
 * Another account's row is not the caller's to change, but a difference in it
 * must not block them — the stored row is kept instead.
 */

const ME = "1386800224273563868";
const OTHER = "711027724663128106";

const otherRow = () => ({
  id: OTHER,
  username: "omarsaleh97",
  name: "Omar",
  level: 70,
});

const myRow = () => ({
  id: ME,
  username: "leonknox1",
  name: "Leon",
  level: 60,
});

describe("saving your own profile while the roster moved on", () => {
  it("saves the caller's own change", () => {
    const existing = [otherRow(), myRow()];
    const incoming = [otherRow(), { ...myRow(), name: "Leon K." }];

    const res = validateRegisteredUsers(existing, incoming, ME, false);

    expect(res.ok).toBe(true);
    expect((res as any).value.find((u: any) => u.id === ME).name).toBe("Leon K.");
  });

  it("does not fail when somebody else changed their row since the snapshot", () => {
    // Somebody else levelled up after this client last read the roster.
    const existing = [{ ...otherRow(), level: 71 }, myRow()];
    const incoming = [otherRow(), { ...myRow(), name: "Leon K." }];

    const res = validateRegisteredUsers(existing, incoming, ME, false);

    expect(res.ok).toBe(true);
  });

  it("keeps the other account's stored row, not the caller's stale copy", () => {
    const existing = [{ ...otherRow(), level: 71 }, myRow()];
    const incoming = [otherRow(), { ...myRow(), name: "Leon K." }];

    const res = validateRegisteredUsers(existing, incoming, ME, false);

    expect((res as any).value.find((u: any) => u.id === OTHER).level).toBe(71);
  });

  it("does not let the caller rewrite somebody else's profile", () => {
    const existing = [otherRow(), myRow()];
    const incoming = [{ ...otherRow(), level: 99, name: "Hacked" }, myRow()];

    const res = validateRegisteredUsers(existing, incoming, ME, false);

    const stored = (res as any).value.find((u: any) => u.id === OTHER);
    expect(stored.level).toBe(70);
    expect(stored.name).toBe("Omar");
  });

  it("still refuses to register somebody else", () => {
    const existing = [myRow()];
    const incoming = [myRow(), { id: "999", username: "newcomer" }];

    const res = validateRegisteredUsers(existing, incoming, ME, false);

    expect(res.ok).toBe(false);
  });

  it("still refuses to remove another account", () => {
    const res = validateRegisteredUsers([otherRow(), myRow()], [myRow()], ME, false);

    expect(res.ok).toBe(false);
  });
});
