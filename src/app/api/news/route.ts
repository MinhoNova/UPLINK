import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { news, posts, reactions } from "@/db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import { getAppSession } from "@/lib/authEnv";
import { getKV, initTables } from "@/lib/db";
import { resolvePublicAuthorFields } from "@/lib/profileImage";

export async function GET(req: NextRequest) {
  const db = await getDb();
  const session = await getAppSession(req);
  const { searchParams } = new URL(req.url);
  const section = searchParams.get("section");
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

  let query = db.select().from(news).orderBy(desc(news.createdAt)).limit(limit);
  if (section && (section === "leveling" || section === "dungeons")) {
    query = db.select().from(news).where(eq(news.section, section)).orderBy(desc(news.createdAt)).limit(limit);
  }

  const rows = await query;

  await initTables();
  const registeredUsers = ((await getKV("registeredUsers")) || []) as any[];

  // Resolve author image + live display name for every news item
  const authorResolved = rows.map((r: any) => {
    const authorData = registeredUsers.find((u: any) => String(u.id) === String(r.authorId));
    const authorFields = resolvePublicAuthorFields(authorData, { name: r.authorName, image: null });
    return { ...r, authorName: authorFields.userName, authorImage: authorFields.userImage };
  });

  // Enrich news items that have a sourcePostId
  const sourcePostIds = rows.map((r: any) => r.sourcePostId).filter(Boolean) as number[];
  let enrichedRows = authorResolved.map((r: any) => ({ ...r, sourcePost: null as any }));

  if (sourcePostIds.length > 0) {
    const dbPosts = await db.select().from(posts).where(inArray(posts.id, sourcePostIds));
    const allReactions = await db.select().from(reactions).where(inArray(reactions.postId, sourcePostIds));

    const reactionMap: Record<number, { type: string; count: number; userReacted: boolean }[]> = {};
    for (const r of allReactions as any[]) {
      if (!reactionMap[r.postId]) reactionMap[r.postId] = [];
      const existing = reactionMap[r.postId].find((x) => x.type === r.type);
      if (existing) {
        existing.count++;
        if (session?.user && String(r.userId) === String((session.user as any).id)) {
          existing.userReacted = true;
        }
      } else {
        reactionMap[r.postId].push({
          type: r.type,
          count: 1,
          userReacted: session?.user ? String(r.userId) === String((session.user as any).id) : false,
        });
      }
    }

    const postsMap = new Map();
    for (const p of dbPosts as any[]) {
      const author = registeredUsers.find((u: any) => String(u.id) === String(p.userId));
      const authorFields = resolvePublicAuthorFields(author, { name: p.userName, image: p.userImage });
      postsMap.set(p.id, {
        ...p,
        userName: authorFields.userName,
        userImage: authorFields.userImage,
        hiddenIdentity: authorFields.hiddenIdentity,
        reactions: reactionMap[p.id] || [],
        tags: JSON.parse(p.tags || "[]"),
      });
    }

    enrichedRows = authorResolved.map((r: any) => ({
      ...r,
      sourcePost: r.sourcePostId ? (postsMap.get(r.sourcePostId) || null) : null,
    }));
  }

  return NextResponse.json(enrichedRows);
}

export async function POST(req: NextRequest) {
  const session = await getAppSession(req);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const body = await req.json();

  if (!body.title?.trim() || !body.content?.trim())
    return NextResponse.json({ error: "Title and content required" }, { status: 400 });

  if (!["leveling", "dungeons"].includes(body.section))
    return NextResponse.json({ error: "Section must be 'leveling' or 'dungeons'" }, { status: 400 });

  const now = Date.now();
  const result = await db.insert(news).values({
    title: body.title.trim(),
    content: body.content.trim(),
    image: body.image || null,
    tags: JSON.stringify(body.tags || []),
    section: body.section,
    sourcePostId: body.sourcePostId || null,
    authorId: (session.user as any).id,
    authorName: session.user.name || "Unknown",
    createdAt: now,
    updatedAt: now,
  }).returning();

  return NextResponse.json(result[0] ?? { success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getAppSession(req);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const db = await getDb();
  const item = await db.select().from(news).where(eq(news.id, Number(id))).limit(1).then((r) => r[0]) as any;
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userId = (session.user as any).id;
  const username = (session.user as any).username || "";
  const isAdmin = username === "minhonovazen" || (session.user as any).roles?.includes("admin");

  if (String(item.authorId) !== String(userId) && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.delete(news).where(eq(news.id, Number(id)));
  return NextResponse.json({ success: true });
}
