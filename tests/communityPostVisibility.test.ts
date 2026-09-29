import { describe, it, expect } from "vitest";
import { canViewPost, getFriendIds, getFriendsOfFriends } from "@/lib/postVisibility";

/**
 * A community post can be `public`, `friends` or `friends_of_friends`. The feed
 * filtered on this rule, but the post page, the comment thread and both
 * reaction endpoints did not, so walking ids read restricted content. These
 * tests pin the rule itself; the endpoints must route through it.
 */

const AUTHOR = "author-1";
const FRIEND = "friend-1";
const FRIEND_OF_FRIEND = "fof-1";
const STRANGER = "stranger-9";

const friends = [
  { requester: AUTHOR, target: FRIEND, status: "accepted" },
  { requester: FRIEND, target: FRIEND_OF_FRIEND, status: "accepted" },
  { requester: AUTHOR, target: "pending-1", status: "pending" },
];

const post = (over: any = {}) => ({ userId: AUTHOR, visibility: "public", ...over });

describe("canViewPost", () => {
  it("lets anyone read a public post", () => {
    expect(canViewPost(STRANGER, post(), friends)).toBe(true);
    expect(canViewPost("", post(), friends)).toBe(true);
  });

  it("lets the author read their own restricted post", () => {
    expect(canViewPost(AUTHOR, post({ visibility: "friends" }), friends)).toBe(true);
  });

  it("hides a friends-only post from a stranger", () => {
    expect(canViewPost(STRANGER, post({ visibility: "friends" }), friends)).toBe(false);
  });

  it("hides a friends-only post from a signed-out viewer", () => {
    expect(canViewPost("", post({ visibility: "friends" }), friends)).toBe(false);
  });

  it("shows a friends-only post to an accepted friend", () => {
    expect(canViewPost(FRIEND, post({ visibility: "friends" }), friends)).toBe(true);
  });

  it("does not treat a pending request as a friendship", () => {
    expect(canViewPost("pending-1", post({ visibility: "friends" }), friends)).toBe(false);
  });

  it("resolves friends of friends but not strangers", () => {
    const p = post({ visibility: "friends_of_friends" });
    expect(canViewPost(FRIEND, p, friends)).toBe(true);
    expect(canViewPost(AUTHOR, p, friends)).toBe(true);
    expect(canViewPost(STRANGER, p, friends)).toBe(false);
  });

  it("treats a missing visibility as public", () => {
    expect(canViewPost(STRANGER, { userId: AUTHOR } as any, friends)).toBe(true);
    expect(canViewPost(STRANGER, post({ visibility: null }), friends)).toBe(true);
  });

  it("defaults an unknown visibility to visible", () => {
    expect(canViewPost(STRANGER, post({ visibility: "something-new" }), friends)).toBe(true);
  });
});

describe("friend graph", () => {
  it("only counts accepted edges", () => {
    expect([...getFriendIds(AUTHOR, friends)]).toEqual([FRIEND]);
  });

  it("does not walk a pending edge into the second degree", () => {
    expect([...getFriendsOfFriends(AUTHOR, friends)]).toEqual([FRIEND_OF_FRIEND]);
  });

  it("handles an empty graph", () => {
    expect(getFriendIds(STRANGER, []).size).toBe(0);
    expect(getFriendsOfFriends(STRANGER, []).size).toBe(0);
  });
});
