import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { getKV, setKV, initTables } from "@/lib/db";

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const userId = String(body?.userId || "");
  if (!userId) return NextResponse.json({ error: "Invalid userId" }, { status: 400 });

  await initTables();
  const users: Record<string, any>[] = (await getKV("registeredUsers")) || [];
  const idx = users.findIndex((u) => String(u.id) === userId);
  if (idx === -1) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (users[idx].team && typeof users[idx].team === "object") {
    delete users[idx].team.lastRenameAt;
  }
  await setKV("registeredUsers", users);

  return NextResponse.json({ success: true, userId, team: users[idx].team || null });
}