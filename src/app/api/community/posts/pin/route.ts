import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/authz";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const postId = Number(body.postId);
  const pinned = body.pinned !== false;

  if (!postId) return NextResponse.json({ error: "Missing postId" }, { status: 400 });

  const db = await getDb();
  const existing = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (existing.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db
    .update(posts)
    .set({
      pinnedAt: pinned ? Date.now() : null,
      pinnedBy: pinned ? auth.user.id : null,
    })
    .where(eq(posts.id, postId));

  return NextResponse.json({ success: true, pinned });
}
