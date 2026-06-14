import { NextResponse } from "next/server";
import { getAppSession } from "@/lib/authEnv";
import { getDb } from "@/db";
import { posts, comments, reactions } from "@/db/schema";
import { eq, inArray, ne, and, desc } from "drizzle-orm";
const REACTION_EMOJI: Record<string, string> = {
  LOL: "😂",
  Love: "❤️",
  Wipe: "💀",
  Carry: "🏆",
};

export async function GET(req: Request) {
  const db = await getDb();
  const session = await getAppSession(req);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id || "";
  if (!userId) return NextResponse.json({ error: "Invalid session" }, { status: 400 });

  const myPosts = await db
    .select({ id: posts.id, content: posts.content })
    .from(posts)
    .where(eq(posts.userId, userId));

  const postMap = new Map(myPosts.map((p) => [p.id, p.content]));
  const myPostIds = myPosts.map((p) => p.id);

  if (myPostIds.length === 0) {
    return NextResponse.json({ activity: [] });
  }

  const [commentRows, reactionRows] = await Promise.all([
    db
      .select()
      .from(comments)
      .where(and(inArray(comments.postId, myPostIds), ne(comments.userId, userId)))
      .orderBy(desc(comments.createdAt))
      .limit(40),
    db
      .select()
      .from(reactions)
      .where(and(inArray(reactions.postId, myPostIds), ne(reactions.userId, userId)))
      .orderBy(desc(reactions.createdAt))
      .limit(40),
  ]);

  const activity = [
    ...commentRows.map((c) => ({
      id: `comment-${c.id}`,
      type: "comment" as const,
      postId: c.postId,
      actorId: c.userId,
      actorName: c.userName,
      actorImage: c.userImage,
      preview: c.content,
      postPreview: (postMap.get(c.postId) || "").slice(0, 80),
      createdAt: c.createdAt,
    })),
    ...reactionRows.map((r) => ({
      id: `reaction-${r.id}`,
      type: "reaction" as const,
      postId: r.postId,
      actorId: r.userId,
      actorName: "",
      actorImage: "",
      preview: REACTION_EMOJI[r.type] || r.type,
      reactionType: r.type,
      postPreview: (postMap.get(r.postId) || "").slice(0, 80),
      createdAt: r.createdAt,
    })),
  ]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 50);

  return NextResponse.json({ activity });
}
