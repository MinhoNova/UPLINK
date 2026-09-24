import { NextResponse } from "next/server";
import { getAppSession } from "@/lib/authEnv";
import { getKV, initTables, updateKVAtomic } from "@/lib/db";
import { isUserBanned, bannedResponse } from "@/lib/banCheck";

export async function GET(req: Request) {
  const session = await getAppSession(req);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await initTables();
  const friends = (await getKV("friends")) || [];
  const userId = String((session.user as any).id);
  const myFriends = friends.filter((f: any) => String(f.requester) === userId || String(f.target) === userId);

  return NextResponse.json({ friends: myFriends });
}

export async function POST(req: Request) {
  const session = await getAppSession(req);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const handle = (session.user as { username?: string }).username || "";
  const userId = String((session.user as any).id);
  if (await isUserBanned(handle, userId)) return bannedResponse();

  const body: any = await req.json();
  const { action, targetId } = body;

  if (!action) return NextResponse.json({ error: "action required" }, { status: 400 });

  await initTables();
  const registeredUsers = (await getKV("registeredUsers")) || [];
  const targetIdStr = String(targetId || "");

  if (action === "request") {
    if (!targetIdStr) return NextResponse.json({ error: "targetId required" }, { status: 400 });
    if (targetIdStr === userId) return NextResponse.json({ error: "Cannot friend yourself" }, { status: 400 });
    const targetUser = registeredUsers.find((user: any) => String(user.id) === targetIdStr);
    if (!targetUser) return NextResponse.json({ error: "Player not found" }, { status: 404 });
    const blockedIds = Array.isArray(targetUser.blocked) ? targetUser.blocked.map(String) : [];
    if (blockedIds.includes(userId)) {
      return NextResponse.json({ error: "This player has blocked you." }, { status: 403 });
    }
    const outcome = await updateKVAtomic<any[]>("friends", (raw) => {
      const friends = raw || [];
      const existing = friends.find((f: any) =>
        (String(f.requester) === userId && String(f.target) === targetIdStr) ||
        (String(f.requester) === targetIdStr && String(f.target) === userId)
      );
      if (existing) {
        if (existing.status === "accepted") return null;
        if (existing.status === "pending") return null;
      }
      return [...friends, { id: `fr_${Date.now()}`, requester: userId, target: targetIdStr, status: "pending", timestamp: Date.now() }];
    });
    if (!outcome.ok) {
      return NextResponse.json({ error: "Request already pending or you are already friends" }, { status: 409 });
    }
    const added = outcome.value.find((f: any) => String(f.requester) === userId && String(f.target) === targetIdStr);
    return NextResponse.json({ success: true, friend: added || outcome.value[outcome.value.length - 1] });
  }

  if (action === "accept") {
    const outcome = await updateKVAtomic<any[]>("friends", (raw) => {
      const friends = raw || [];
      const idx = friends.findIndex((f: any) =>
        f.id === targetIdStr || (String(f.requester) === targetIdStr && String(f.target) === userId)
      );
      if (idx === -1) return null;
      const entry = friends[idx];
      if (String(entry.target) !== userId) return null;
      if (entry.status !== "pending") return null;
      const next = [...friends];
      next[idx] = { ...entry, status: "accepted" };
      return next;
    });
    if (!outcome.ok) return NextResponse.json({ error: "Request not found or already handled" }, { status: 404 });
    return NextResponse.json({ success: true });
  }

  if (action === "decline") {
    const outcome = await updateKVAtomic<any[]>("friends", (raw) => {
      const friends = raw || [];
      const idx = friends.findIndex((f: any) =>
        f.id === targetIdStr || (String(f.requester) === targetIdStr && String(f.target) === userId)
      );
      if (idx === -1) return null;
      const entry = friends[idx];
      if (String(entry.target) !== userId) return null;
      const next = friends.filter((f: any) => f.id !== entry.id);
      return next;
    });
    if (!outcome.ok) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  }

  if (action === "remove") {
    const outcome = await updateKVAtomic<any[]>("friends", (raw) => {
      const friends = raw || [];
      const entry = friends.find((f: any) =>
        f.id === targetIdStr ||
        (String(f.requester) === userId && String(f.target) === targetIdStr) ||
        (String(f.requester) === targetIdStr && String(f.target) === userId)
      );
      if (!entry) return null;
      if (String(entry.requester) !== userId && String(entry.target) !== userId) return null;
      return friends.filter((f: any) => f.id !== entry.id);
    });
    if (!outcome.ok) return NextResponse.json({ error: "Friendship not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}