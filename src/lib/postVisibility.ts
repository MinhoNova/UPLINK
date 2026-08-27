type FriendEntry = { requester: string; target: string; status: string };

export function getFriendIds(userId: string, friends: FriendEntry[]): Set<string> {
  const ids = new Set<string>();
  for (const f of friends) {
    if (f.status !== "accepted") continue;
    if (f.requester === userId) ids.add(String(f.target));
    if (f.target === userId) ids.add(String(f.requester));
  }
  return ids;
}

export function getFriendsOfFriends(userId: string, friends: FriendEntry[]): Set<string> {
  const direct = getFriendIds(userId, friends);
  const fof = new Set<string>();
  for (const friendId of direct) {
    for (const id of getFriendIds(friendId, friends)) {
      if (id !== String(userId) && !direct.has(id)) fof.add(id);
    }
  }
  return fof;
}

export function canViewPost(
  viewerId: string,
  post: { userId: string; visibility?: string | null },
  friends: FriendEntry[]
): boolean {
  if (String(post.userId) === String(viewerId)) return true;
  const vis = post.visibility || "public";
  if (vis === "public") return true;
  const myFriends = getFriendIds(viewerId, friends);
  if (vis === "friends") return myFriends.has(String(post.userId));
  if (vis === "friends_of_friends") {
    if (myFriends.has(String(post.userId))) return true;
    const fof = getFriendsOfFriends(viewerId, friends);
    return fof.has(String(post.userId));
  }
  return true;
}
