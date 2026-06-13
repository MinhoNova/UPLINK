import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getKV, setKV, initTables } from "@/lib/db";
import { isUserBanned, bannedResponse } from "@/lib/banCheck";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await initTables();
  const friends = (await getKV("friends")) || [];
  const userId = (session.user as any).id;
  const myFriends = friends.filter((f: any) => f.requester === userId || f.target === userId);

  return NextResponse.json({ friends: myFriends });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const handle = (session.user as { username?: string }).username || "";
  const userId = (session.user as any).id;
  if (await isUserBanned(handle, userId)) return bannedResponse();

  const body = await req.json();
  const { action, targetId } = body;

  if (!action) return NextResponse.json({ error: "action required" }, { status: 400 });

  await initTables();
  const friends = (await getKV("friends")) || [];

  if (action === "request") {
    if (!targetId) return NextResponse.json({ error: "targetId required" }, { status: 400 });
    if (targetId === userId) return NextResponse.json({ error: "Cannot friend yourself" }, { status: 400 });
    const existing = friends.find((f: any) =>
      (f.requester === userId && f.target === targetId) || (f.requester === targetId && f.target === userId)
    );
    if (existing) {
      if (existing.status === "accepted") return NextResponse.json({ error: "Already friends" }, { status: 409 });
      if (existing.status === "pending") return NextResponse.json({ error: "Request already pending" }, { status: 409 });
    }
    const entry = { id: `fr_${Date.now()}`, requester: userId, target: targetId, status: "pending", timestamp: Date.now() };
    friends.push(entry);
    await setKV("friends", friends);
    return NextResponse.json({ success: true, friend: entry });
  }

  if (action === "accept") {
    if (!targetId) return NextResponse.json({ error: "targetId required" }, { status: 400 });
    const entry = friends.find((f: any) => f.id === targetId);
    if (!entry) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    if (entry.target !== userId) return NextResponse.json({ error: "Not your request to accept" }, { status: 403 });
    if (entry.status !== "pending") return NextResponse.json({ error: "Request already handled" }, { status: 409 });
    entry.status = "accepted";
    await setKV("friends", friends);
    return NextResponse.json({ success: true });
  }

  if (action === "decline") {
    if (!targetId) return NextResponse.json({ error: "targetId required" }, { status: 400 });
    const entry = friends.find((f: any) => f.id === targetId);
    if (!entry) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    if (entry.target !== userId) return NextResponse.json({ error: "Not your request" }, { status: 403 });
    const updated = friends.filter((f: any) => f.id !== targetId);
    await setKV("friends", updated);
    return NextResponse.json({ success: true });
  }

  if (action === "remove") {
    if (!targetId) return NextResponse.json({ error: "targetId required" }, { status: 400 });
    const entry = friends.find((f: any) =>
      (f.id === targetId || (f.requester === userId && f.target === targetId) || (f.requester === targetId && f.target === userId))
    );
    if (!entry) return NextResponse.json({ error: "Friendship not found" }, { status: 404 });
    if (entry.requester !== userId && entry.target !== userId) return NextResponse.json({ error: "Not your friendship" }, { status: 403 });
    const updated = friends.filter((f: any) => f.id !== entry.id);
    await setKV("friends", updated);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
