import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { ensureRolesSeeded, setUserRole, type UserRole } from "@/lib/roles";
import { logAudit } from "@/lib/auditLog";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const roles = await ensureRolesSeeded();
  return NextResponse.json({ roles });
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const { userId, role } = body as { userId?: string; role?: UserRole };
  if (!userId || !role) {
    return NextResponse.json({ error: "Missing userId or role" }, { status: 400 });
  }

  try {
    await setUserRole(auth.user.id, auth.user.username, String(userId), role);
    await logAudit({
      action: "admin.setRole",
      userId: auth.user.id,
      handle: auth.user.username,
      target: String(userId),
      meta: { role },
    });
    const roles = await ensureRolesSeeded();
    return NextResponse.json({ success: true, roles });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
