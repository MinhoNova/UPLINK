import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { getKV, setKV, initTables } from "@/lib/db";

export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await initTables();
  const users: Record<string, any>[] = (await getKV("registeredUsers")) || [];

  const adminId = String(auth.user.id);
  const adminHandle = String(auth.user.username ?? "");
  const kept = users.filter(
    (u) => String(u.id) === adminId || (typeof adminHandle === "string" && adminHandle && String(u.username) === adminHandle)
  );

  await setKV("registeredUsers", kept);

  return NextResponse.json({ success: true, removed: users.length - kept.length, users: kept.length, keptAdminId: adminId });
}