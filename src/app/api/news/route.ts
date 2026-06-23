import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { news } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getAppSession } from "@/lib/authEnv";

export async function GET(req: NextRequest) {
  const db = await getDb();
  const { searchParams } = new URL(req.url);
  const section = searchParams.get("section");
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

  let query = db.select().from(news).orderBy(desc(news.createdAt)).limit(limit);
  if (section && (section === "leveling" || section === "dungeons")) {
    query = db.select().from(news).where(eq(news.section, section)).orderBy(desc(news.createdAt)).limit(limit);
  }

  const rows = await query;
  return NextResponse.json(rows);
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
