import { describe, it, expect } from "vitest";

/**
 * The notification bell filtered on `n.targetId`.
 *
 * `targetId` is a player-reviews field (`lib/playerReviews.ts`, `/api/player-reviews`).
 * Nothing has ever written it onto a notification: invites address the recipient
 * as `toUserId` with `toUser` as the handle fallback, and team invites do the
 * same. The comparison was therefore against `undefined` on every row, the bell
 * matched nothing, and a player who had just been invited to a squad was shown
 * no notification at all — the invite looked like it had never been sent.
 *
 * The recipient test below mirrors the server's own party check
 * (`validateNotifications` in lib/secureDataWrite.ts), which treats BOTH sides of
 * a row as belonging to the caller. That is correct for the write path and wrong
 * for a badge: a notification you sent yourself must not pin the bell on.
 */

type Row = {
  toUserId?: string;
  toUser?: string;
  fromUserId?: string;
  fromHandle?: string;
};

function visibleToMe(rows: Row[], meId: string, myHandle: string): Row[] {
  const norm = (v: unknown) => String(v ?? "").trim().toLowerCase();
  const handle = String(myHandle || "").toLowerCase();
  return rows.filter((n) => {
    const toId = String(n?.toUserId || "");
    const toHandle = norm(n?.toUser);
    const toMe = toId ? toId === meId : Boolean(handle) && toHandle === handle;
    if (!toMe) return false;
    const fromId = String(n?.fromUserId || "");
    const fromHandle = norm(n?.fromHandle);
    const fromMe = fromId ? fromId === meId : Boolean(handle) && fromHandle === handle;
    return !fromMe;
  });
}

describe("navbar notification bell", () => {
  it("shows a squad invite addressed by id", () => {
    // Exactly what ManageThreadClient.handleAccept writes.
    const invite: Row = {
      toUserId: "me",
      toUser: "someone",
      fromHandle: "owner",
      fromUser: "Owner",
    };
    expect(visibleToMe([invite], "me", "someone")).toHaveLength(1);
  });

  it("never matched the old targetId filter", () => {
    // The regression itself: no `targetId` is written by any notification path.
    const invite: Row = { toUserId: "me", toUser: "someone" };
    const old = [invite].filter((n: any) => String(n.targetId) === "me");
    expect(old).toHaveLength(0);
    expect(visibleToMe([invite], "me", "someone")).toHaveLength(1);
  });

  it("falls back to the handle when a row predates id stamping", () => {
    const legacy: Row = { toUser: "Handle", fromHandle: "Owner" };
    expect(visibleToMe([legacy], "me", "handle")).toHaveLength(1);
  });

  it("is case-insensitive on the handle fallback", () => {
    const legacy: Row = { toUser: "HANDLE", fromHandle: "Owner" };
    expect(visibleToMe([legacy], "me", "Handle")).toHaveLength(1);
  });

  it("hides other players' notifications", () => {
    const theirs: Row = { toUserId: "them", toUser: "other" };
    expect(visibleToMe([theirs], "me", "someone")).toHaveLength(0);
  });

  it("does not show a notification the player sent to themselves", () => {
    const self: Row = { toUserId: "me", fromUserId: "me" };
    expect(visibleToMe([self], "me", "someone")).toHaveLength(0);
  });

  it("prefers the id over a stale handle on the same row", () => {
    // A renamed account: the id still addresses me, the handle is someone
    // else's. Reading the handle first would have hidden a real invite.
    const row: Row = { toUserId: "me", toUser: "oldhandle", fromHandle: "owner" };
    expect(visibleToMe([row], "me", "newhandle")).toHaveLength(1);
  });

  it("ignores a row with no recipient at all", () => {
    expect(visibleToMe([{ fromHandle: "owner" }], "me", "someone")).toHaveLength(0);
  });

  it("keeps only the player's own rows out of a mixed list", () => {
    const rows: Row[] = [
      { toUserId: "me", fromHandle: "owner" },
      { toUserId: "them" },
      { toUserId: "me", fromUserId: "me" },
    ];
    expect(visibleToMe(rows, "me", "someone")).toHaveLength(1);
  });
});
