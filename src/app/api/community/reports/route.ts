import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db, initDb } from "@/db";
import { reports } from "@/db/schema";

initDb();

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
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
