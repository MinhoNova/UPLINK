import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { getDb } from "@/db";
import { posts, reactions, reports, comments, commentReactions } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
export async function DELETE(req: Request) {
  const db = await getDb();
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { postId } = (await req.json()) as { postId?: number };
  if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 });

  const post = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (post.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const commentRows = await db.select({ id: comments.id }).from(comments).where(eq(comments.postId, postId));
  const commentIds = commentRows.map((c) => c.id);

  if (commentIds.length > 0) {
    await db.delete(commentReactions).where(inArray(commentReactions.commentId, commentIds));
    await db.delete(comments).where(eq(comments.postId, postId));
  }
  await db.delete(reactions).where(eq(reactions.postId, postId));
  await db.delete(reports).where(eq(reports.postId, postId));
  await db.delete(posts).where(eq(posts.id, postId));

  return NextResponse.json({ success: true });
}
