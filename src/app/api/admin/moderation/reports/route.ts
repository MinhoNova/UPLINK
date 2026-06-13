import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { getDb } from "@/db";
import { reports, posts } from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { getKV, initTables } from "@/lib/db";
import { resolveProfileDisplayName } from "@/lib/profileImage";
export async function GET() {
  const db = await getDb();
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const rows = await db.select().from(reports).orderBy(desc(reports.createdAt)).limit(100);
  if (rows.length === 0) return NextResponse.json({ reports: [] });

  const postIds = [...new Set(rows.map((r) => r.postId))];
  const postRows = postIds.length
    ? await db.select().from(posts).where(inArray(posts.id, postIds))
    : [];
  const postMap = new Map(postRows.map((p) => [p.id, p]));

  await initTables();
  const registeredUsers: any[] = (await getKV("registeredUsers")) || [];

  const enriched = rows.map((r) => {
    const post = postMap.get(r.postId);
    const reporter = registeredUsers.find((u) => String(u.id) === String(r.reporterId));
    const author = post
      ? registeredUsers.find((u) => String(u.id) === String(post.userId))
      : null;
    return {
      ...r,
      postContent: post?.content?.slice(0, 200) || "[deleted]",
      postAuthorId: post?.userId || null,
      postAuthorName: author ? resolveProfileDisplayName(author) : post?.userName || "Unknown",
      reporterName: reporter ? resolveProfileDisplayName(reporter) : "Unknown",
    };
  });

  return NextResponse.json({ reports: enriched });
}

export async function DELETE(req: Request) {
  const db = await getDb();
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { reportId } = (await req.json()) as { reportId?: number };
  if (!reportId) return NextResponse.json({ error: "reportId required" }, { status: 400 });

  await db.delete(reports).where(eq(reports.id, reportId));
  return NextResponse.json({ success: true });
}
