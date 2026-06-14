import { NextRequest, NextResponse } from "next/server";
import { getAppSession } from "@/lib/authEnv";
import { getDb } from "@/db";
import { comments, posts } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { getKV, initTables } from "@/lib/db";
import { resolvePublicAuthorFields } from "@/lib/profileImage";
export async function GET(req: NextRequest) {
  const db = await getDb();
  const session = await getAppSession(req);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");
  if (!postId) return NextResponse.json({ error: "Missing postId" }, { status: 400 });

  const rows = await db.select()
    .from(comments)
    .where(eq(comments.postId, Number(postId)))
    .orderBy(asc(comments.createdAt));

  await initTables();
  const registeredUsers = ((await getKV("registeredUsers")) || []) as any[];

  const enriched = rows.map((c: any) => {
    const author = registeredUsers.find((u: any) => String(u.id) === String(c.userId));
    const authorFields = resolvePublicAuthorFields(author, { name: c.userName, image: c.userImage });
    return {
      ...c,
      userName: authorFields.userName,
      userImage: authorFields.userImage,
      hiddenIdentity: authorFields.hiddenIdentity,
    };
  });

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  const db = await getDb();
  const session = await getAppSession(req);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { postId, content, parentId } = await req.json();
  if (!postId || !content?.trim()) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const post = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (post.length === 0) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  await initTables();
  const registeredUsers = ((await getKV("registeredUsers")) || []) as any[];
  const me = registeredUsers.find((u: any) => String(u.id) === String((session.user as any).id));
  const authorFields = resolvePublicAuthorFields(me, {
    name: session.user.name || "Unknown",
    image: session.user.image || "",
  });

  const result = await db.insert(comments).values({
    postId,
    parentId: parentId || null,
    userId: (session.user as any).id,
    userName: authorFields.userName,
    userImage: authorFields.userImage,
    content: content.trim(),
    createdAt: Date.now(),
  }).returning();

  return NextResponse.json(result[0]);
}

export async function DELETE(req: NextRequest) {
  const db = await getDb();
  const session = await getAppSession(req);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { commentId } = await req.json();
  if (!commentId) return NextResponse.json({ error: "Missing commentId" }, { status: 400 });

  const comment = await db.select().from(comments).where(eq(comments.id, commentId)).limit(1);
  if (comment.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (comment[0].userId !== (session.user as any).id && (session.user as any).id !== "1497295886223544471") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.delete(comments).where(eq(comments.id, commentId));

  return NextResponse.json({ success: true });
}
