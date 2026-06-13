import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { getAuditLogs } from "@/lib/auditLog";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const limit = parseInt(new URL(req.url).searchParams.get("limit") || "100", 10);
  const logs = await getAuditLogs(Number.isFinite(limit) ? limit : 100);
  return NextResponse.json({ logs });
}
