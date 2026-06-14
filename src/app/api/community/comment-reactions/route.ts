import { NextRequest, NextResponse } from "next/server";
import { getAppSession } from "@/lib/authEnv";
import { getDb } from "@/db";
import { commentReactions } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
export async function GET(req: NextRequest) {
  const db = await getDb();
  const session = await getAppSession(req);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const commentIds = searchParams.get("commentIds");
  if (!commentIds) return NextResponse.json({ error: "Missing commentIds" }, { status: 400 });

  const ids = commentIds.split(",").map(Number).filter((n) => !isNaN(n));
  if (ids.length === 0) return NextResponse.json([]);

  const all = await db.select()
    .from(commentReactions)
    .where(inArray(commentReactions.commentId, ids));

  const map: Record<number, { type: string; count: number; userReacted: boolean }[]> = {};
  for (const r of all as any[]) {
    if (!map[r.commentId]) map[r.commentId] = [];
    const existing = map[r.commentId].find((x) => x.type === r.type);
    if (existing) {
      existing.count++;
      if (r.userId === (session.user as any).id) existing.userReacted = true;
    } else {
      map[r.commentId].push({ type: r.type, count: 1, userReacted: r.userId === (session.user as any).id });
    }
  }

  return NextResponse.json(map);
}

export async function POST(req: NextRequest) {
  const db = await getDb();
  const session = await getAppSession(req);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { commentId, type } = await req.json();
  if (!commentId || !type) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const userId = (session.user as any).id;

  const existing = await db.select()
    .from(commentReactions)
    .where(and(eq(commentReactions.commentId, commentId), eq(commentReactions.userId, userId), eq(commentReactions.type, type)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(commentReactions)
      .where(and(eq(commentReactions.commentId, commentId), eq(commentReactions.userId, userId), eq(commentReactions.type, type)));
    return NextResponse.json({ action: "removed" });
  }

  await db.insert(commentReactions).values({
    commentId,
    userId,
    type,
    createdAt: Date.now(),
  });

  return NextResponse.json({ action: "added" });
}
