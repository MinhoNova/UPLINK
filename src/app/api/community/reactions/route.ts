import { NextRequest, NextResponse } from "next/server";
import { getActiveSession } from "@/lib/authEnv";
import { getDb } from "@/db";
import { reactions, posts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { rateLimitByUser } from "@/lib/rateLimit";
import { assertPostVisible } from "@/lib/communityPostAccess";
export async function POST(req: NextRequest) {
  const db = await getDb();
  const { session, error, status } = await getActiveSession(req);
  if (!session) return NextResponse.json({ error }, { status });

  const rl = await rateLimitByUser(String((session.user as any).id), "community_react", 30, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Slow down." }, { status: 429 });

  const { postId, type }: any = await req.json();
  if (!postId || !type) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const userId = (session.user as any).id;

  // Your own post is not your own audience. Keyed on the author's id, so a
  // second account still reacts to it normally. This also resolves the post for
  // the visibility check below, so it is a 404 when it does not exist.
  const post = await db
    .select({ userId: posts.userId })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);
  if (post.length === 0) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  if (String(post[0].userId) === String(userId)) {
    return NextResponse.json({ error: "You cannot react to your own post" }, { status: 400 });
  }

  // A reaction on a friends-only post is only possible for people allowed to
  // see it in the first place.
  const verdict = await assertPostVisible(userId, postId);
  if (!verdict.allowed) {
    return NextResponse.json({ error: "Post not found" }, { status: verdict.status });
  }

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
