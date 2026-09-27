import { describe, it, expect } from "vitest";
import {
  refFor,
  refMatches,
  findUserById,
  resolveUserId,
  usernameOf,
  buildHandleIndex,
  resolveAvailableUsername,
  findDuplicateUsernames,
  type PlayerRecord,
} from "@/lib/playerIdentity";
import { notificationMatchesUser } from "@/lib/userProfile";
import {
  withDmIdentities,
  withReceiptIdentities,
  computeDmUnreadCounts,
  isFromUser,
  isToUser,
  getDmConversationPeerIds,
  buildDmContactList,
  type DmMessage,
} from "@/lib/dmHelpers";

// A player who renamed on Discord: same snowflake, new handle, old handle kept
// so pre-migration rows still resolve.
const renamed: PlayerRecord = {
  id: "100000000000000001",
  username: "newname",
  previousUsernames: ["oldname"],
};

const friend: PlayerRecord = { id: "100000000000000002", username: "friend" };
const users = [renamed, friend];

describe("playerIdentity", () => {
  it("refers to a player by id or by the handle it currently uses", () => {
    const me = refFor(renamed.id, renamed.username!);

    expect(refMatches(me, renamed.id)).toBe(true);
    expect(refMatches(me, "newname")).toBe(true);
    expect(refMatches(me, "  NewName  ")).toBe(true);
    expect(refMatches(me, friend.id)).toBe(false);
    expect(refMatches(me, "")).toBe(false);
  });

  it("finds a player row by id and never by a bare handle", () => {
    expect(findUserById(users, renamed.id)?.username).toBe("newname");
    expect(findUserById(users, "newname")).toBeUndefined();
    // Retired handles are resolved through the index, not findUserById.
    expect(usernameOf(findUserById(users, "oldname"))).toBe("");
  });

  it("resolves either an id or a current/past handle to one id", () => {
    expect(resolveUserId(users, renamed.id)).toBe(renamed.id);
    expect(resolveUserId(users, "newname")).toBe(renamed.id);
    expect(resolveUserId(users, "oldname")).toBe(renamed.id);
    expect(resolveUserId(users, "nobody")).toBe("");
  });

  it("indexes current and previous handles to the stable id", () => {
    const index = buildHandleIndex(users);
    expect(index.get("newname")).toBe(renamed.id);
    expect(index.get("oldname")).toBe(renamed.id);
    expect(index.get("friend")).toBe(friend.id);
    expect(index.get("")).toBeUndefined();
  });

  it("keeps the wanted handle and only suffixes on a live collision", () => {
    expect(resolveAvailableUsername(users, "friend", renamed.id).username).toBe("friend-2");
    expect(resolveAvailableUsername(users, "brand-new", renamed.id).username).toBe("brand-new");
    // Your own previous handles are not collisions.
    expect(resolveAvailableUsername(users, "oldname", renamed.id).username).toBe("oldname");
  });

  it("suffixes on a live collision and flags it", () => {
    const taken = resolveAvailableUsername(users, "friend", renamed.id);
    expect(taken.username).toBe("friend-2");
    expect(taken.conflicted).toBe(true);

    const free = resolveAvailableUsername(users, "freed-handle", renamed.id);
    expect(free.username).toBe("freed-handle");
    expect(free.conflicted).toBe(false);
  });

  it("lets a player reclaim a handle that nobody holds, even if it is their own old one", () => {
    // `friend` renamed away from "friend"; both may now be "friend".
    const resolved = resolveAvailableUsername([renamed], "friend", friend.id);
    expect(resolved.username).toBe("friend");
    expect(resolved.conflicted).toBe(false);
  });

  it("falls back to the snowflake when Discord gives no handle", () => {
    expect(resolveAvailableUsername(users, "  ", friend.id).username).toBe(friend.id);
  });

  it("finds duplicate live handles case-insensitively", () => {
    const dupes = findDuplicateUsernames([
      { id: "1", username: "Same" },
      { id: "2", username: "same" },
      { id: "3", username: "other" },
    ]);
    expect(dupes).toEqual([{ username: "same", ids: ["1", "2"] }]);
  });

  it("reports no duplicate when a previous handle equals someone's live handle", () => {
    const dupes = findDuplicateUsernames([
      { id: "1", username: "alpha", previousUsernames: ["beta"] },
      { id: "2", username: "beta" },
    ]);
    expect(dupes).toEqual([]);
  });
});

describe("notificationMatchesUser", () => {
  it("prefers toUserId over any handle", () => {
    expect(notificationMatchesUser({ toUserId: renamed.id, toUser: "somebody-else" }, renamed.id, "newname", users)).toBe(
      true
    );
    expect(notificationMatchesUser({ toUserId: friend.id, toUser: "newname" }, renamed.id, "newname", users)).toBe(false);
  });

  it("falls back to the handle, including a retired one", () => {
    expect(notificationMatchesUser({ toUser: "oldname" }, renamed.id, "newname", users)).toBe(true);
    expect(notificationMatchesUser({ toUser: "friend" }, renamed.id, "newname", users)).toBe(false);
  });
});

describe("dmHelpers across a Discord rename", () => {
  // Written before the rename: addressed only by the handles of that moment.
  const legacy: DmMessage[] = [
    { from: "oldname", to: "friend", text: "hi", timestamp: 1, image: "", reactions: {} },
    { from: "friend", to: "oldname", text: "hey", timestamp: 2, image: "", reactions: {} },
  ];

  it("stamps ids and refreshes handles onto legacy messages", () => {
    const backfilled = withDmIdentities(legacy, users);

    expect(backfilled[0].fromId).toBe(renamed.id);
    expect(backfilled[0].toId).toBe(friend.id);
    // The stored handle is rewritten to the current one.
    expect(backfilled[0].from).toBe("newname");
    expect(backfilled[1].to).toBe("newname");
  });

  it("keeps both directions of the thread visible to the renamed player", () => {
    const me = refFor(renamed.id, "newname");
    const backfilled = withDmIdentities(legacy, users);

    expect(isFromUser(backfilled[0], me)).toBe(true);
    expect(isToUser(backfilled[1], me)).toBe(true);
    // The rename does not make a message look like the other player sent it.
    expect(isFromUser(backfilled[1], me)).toBe(false);
  });

  it("does not rewrite a message that already carries ids", () => {
    const stamped: DmMessage[] = [
      { fromId: renamed.id, from: "newname", toId: friend.id, to: "friend", text: "x", timestamp: 3, image: "", reactions: {} },
    ];
    expect(withDmIdentities(stamped, users)).toEqual(stamped);
  });

  it("lists conversation peers by id", () => {
    const me = refFor(renamed.id, "newname");
    const peers = getDmConversationPeerIds(withDmIdentities(legacy, users), me);
    expect([...peers]).toEqual([friend.id]);
  });

  it("counts unread per peer id, not per handle", () => {
    const me = refFor(renamed.id, "newname");
    const backfilled = withDmIdentities(legacy, users);

    // One incoming message from friend, not yet read.
    expect(computeDmUnreadCounts(backfilled, {}, me)).toEqual({ [friend.id]: 1 });
    expect(computeDmUnreadCounts(backfilled, {}, refFor(friend.id, "friend"))).toEqual({ [renamed.id]: 1 });
  });

  it("re-keys a receipt row stored under a retired handle, reader then sender", () => {
    // readMessages: reader -> sender -> message timestamps.
    const receipts = withReceiptIdentities({ oldname: { friend: [1] } }, users);
    expect(receipts[renamed.id]?.[friend.id]).toEqual(["1"]);
  });

  it("merges an id-keyed and a handle-keyed receipt row into one", () => {
    const receipts = withReceiptIdentities(
      { [renamed.id]: { [friend.id]: [1, 2] }, oldname: { [friend.id]: [3] } },
      users
    );
    expect(receipts[renamed.id]?.[friend.id]).toEqual(["1", "2", "3"]);
  });

  it("keeps one contact per friend, listed by id", () => {
    const contacts = buildDmContactList({
      registeredUsers: users as any[],
      friends: [{ requester: renamed.id, target: friend.id, status: "accepted" }],
      directMessages: withDmIdentities(legacy, users),
      currentUserId: renamed.id,
      currentHandle: "newname",
      isAdmin: false,
      search: "",
      unreadCounts: {} as Record<string, number>,
    });
    expect(contacts).toHaveLength(1);
    expect(contacts[0].id).toBe(friend.id);
  });

  it("shows a conversation partner's current handle, not the retired one", () => {
    const stale: DmMessage[] = [{ from: "oldname", to: "friend", text: "x", timestamp: 9, image: "", reactions: {} }];
    const contacts = buildDmContactList({
      registeredUsers: users as any[],
      friends: [{ requester: friend.id, target: renamed.id, status: "accepted" }],
      directMessages: stale,
      currentUserId: friend.id,
      currentHandle: "friend",
      isAdmin: false,
      search: "",
      unreadCounts: {} as Record<string, number>,
    });
    expect(contacts).toHaveLength(1);
    expect(contacts[0].id).toBe(renamed.id);
    expect(contacts[0].username).toBe("newname");
  });

  it("lets an admin reach a partner who is no longer registered", () => {
    const ghost: DmMessage[] = [
      { fromId: "999", from: "gone", toId: renamed.id, to: "newname", text: "x", timestamp: 9, image: "", reactions: {} },
    ];
    const contacts = buildDmContactList({
      registeredUsers: users as any[],
      friends: [],
      directMessages: ghost,
      currentUserId: renamed.id,
      currentHandle: "newname",
      isAdmin: true,
      search: "",
      unreadCounts: {} as Record<string, number>,
    });
    expect(contacts.map((c) => c.id)).toContain("999");
  });
});
