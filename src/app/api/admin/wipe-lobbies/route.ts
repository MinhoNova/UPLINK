import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { getKV, setKV, initTables } from "@/lib/db";
import { logAudit } from "@/lib/auditLog";

export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await initTables();

  const lobbies: unknown[] = (await getKV("lobbies")) || [];
  const notifications: unknown[] = (await getKV("notifications")) || [];

  await setKV("lobbies", []);
  await setKV("offerDailyUsage", {});
  await setKV("notifications", []);

  await logAudit({
    action: "system.wipeLobbies",
    userId: String(auth.user.id),
    handle: String(auth.user.username ?? ""),
    meta: { removedLobbies: lobbies.length, removedNotifications: notifications.length },
  });

  return NextResponse.json({
    success: true,
    removedLobbies: lobbies.length,
    removedNotifications: notifications.length,
  });
}