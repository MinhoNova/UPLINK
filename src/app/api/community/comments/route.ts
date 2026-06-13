import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db, initDb } from "@/db";
import { comments, posts } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

initDb();

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");
  if (!postId) return NextResponse.json({ error: "Missing postId" }, { status: 400 });

  const rows = await db.select()
    .from(comments)
    .where(eq(comments.postId, Number(postId)))
    .orderBy(asc(comments.createdAt));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { postId, content, parentId } = await req.json();
  if (!postId || !content?.trim()) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const post = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (post.length === 0) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const result = await db.insert(comments).values({
    postId,
    parentId: parentId || null,
    userId: (session.user as any).id,
    userName: session.user.name || "Unknown",
    userImage: session.user.image || "",
    content: content.trim(),
    createdAt: Date.now(),
  }).returning();

  return NextResponse.json(result[0]);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { commentId } = await req.json();
  if (!commentId) return NextResponse.json({ error: "Missing commentId" }, { status: 400 });

  const comment = await db.select().from(comments).where(eq(comments.id, commentId)).limit(1);
  if (comment.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (comment[0].userId !== (session.user as any).id && (session.user as any).id !== "1497295886223544471") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.delete(comments).where(eq(comments.id, commentId));

  return NextResponse.json({ success: true });
}
