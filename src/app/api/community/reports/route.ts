import { NextRequest, NextResponse } from "next/server";
import { getAppSession } from "@/lib/authEnv";
import { getDb } from "@/db";
import { reports } from "@/db/schema";
export async function POST(req: NextRequest) {
  const db = await getDb();
  const session = await getAppSession(req);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { postId, reason } = await req.json();
  if (!postId || !reason?.trim()) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const userId = (session.user as any).id;

  await db.insert(reports).values({
    postId,
    reporterId: userId,
    reason: reason.trim(),
    createdAt: Date.now(),
  });

  return NextResponse.json({ success: true });
}
