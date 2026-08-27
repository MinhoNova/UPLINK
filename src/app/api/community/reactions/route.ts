import { NextRequest, NextResponse } from "next/server";
import { getAppSession } from "@/lib/authEnv";
import { getDb } from "@/db";
import { reactions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
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
