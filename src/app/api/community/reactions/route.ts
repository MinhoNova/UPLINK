import { NextRequest, NextResponse } from "next/server";
import { getAppSession } from "@/lib/authEnv";
import { getDb } from "@/db";
import { reactions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getKV } from "@/lib/db";
import { resolveProfileDisplayName, resolveProfileImage } from "@/lib/profileImage";

export async function GET(req: NextRequest) {
  const db = await getDb();
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");
  const type = searchParams.get("type");
  if (!postId || !type) return NextResponse.json({ error: "Missing postId or type" }, { status: 400 });

  const rows = await db.select()
    .from(reactions)
    .where(and(eq(reactions.postId, Number(postId)), eq(reactions.type, type)));

  const registeredUsers = ((await getKV("registeredUsers")) || []) as any[];

  const users = rows.map((r: any) => {
    const user = registeredUsers.find((u: any) => String(u.id) === String(r.userId));
    return {
      userId: r.userId,
      name: user ? resolveProfileDisplayName(user) : "Member",
      image: user ? resolveProfileImage(user) : "",
    };
  });

  return NextResponse.json({ users, total: users.length });
}

export async function POST(req: NextRequest) {
  const db = await getDb();
  const session = await getAppSession(req);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { postId, type } = await req.json();
  if (!postId || !type) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const userId = (session.user as any).id;

  const existing = await db.select()
    .from(reactions)
    .where(and(eq(reactions.postId, postId), eq(reactions.userId, userId), eq(reactions.type, type)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(reactions)
      .where(and(eq(reactions.postId, postId), eq(reactions.userId, userId), eq(reactions.type, type)));
    return NextResponse.json({ action: "removed" });
  }

  await db.insert(reactions).values({
    postId,
    userId,
    type,
    createdAt: Date.now(),
  });

  return NextResponse.json({ action: "added" });
}
