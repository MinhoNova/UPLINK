import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { getKV, setKV, initTables } from "@/lib/db";
import { RANK_ORDER } from "@/lib/ranks";

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const userId = String(body.userId || "");
  const rank = body.rank ? String(body.rank) : null;

  if (!userId) return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
  if (rank !== null && !RANK_ORDER.includes(rank as (typeof RANK_ORDER)[number])) {
    return NextResponse.json({ error: "Invalid rank tier" }, { status: 400 });
  }

  await initTables();
  const users: any[] = (await getKV("registeredUsers")) || [];
  const idx = users.findIndex((u) => String(u.id) === userId);
  if (idx === -1) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (rank === null) {
    delete users[idx].rankOverride;
  } else {
    users[idx].rankOverride = rank;
  }
  await setKV("registeredUsers", users);

  return NextResponse.json({
    success: true,
    userId,
    rank: users[idx].rankOverride || null,
  });
}