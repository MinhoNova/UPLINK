import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { banIp, getBannedIps, unbanIp } from "@/lib/ipBan";
import { getAuditLogs } from "@/lib/auditLog";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const ips = await getBannedIps();
  const logs = await getAuditLogs(200);
  const recentIps = new Map<string, { ip: string; handle?: string; action: string; at: number }>();

  for (const entry of logs) {
    const ip = typeof entry.meta?.ip === "string" ? entry.meta.ip : undefined;
    if (!ip || ip === "unknown") continue;
    if (!recentIps.has(ip)) {
      recentIps.set(ip, {
        ip,
        handle: entry.handle,
        action: entry.action,
        at: entry.timestamp,
      });
    }
    if (recentIps.size >= 30) break;
  }

  return NextResponse.json({
    ips,
    recent: Array.from(recentIps.values()),
  });
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const ip = String(body?.ip || "").trim();
  const reason = body?.reason ? String(body.reason).slice(0, 200) : undefined;

  const result = await banIp(ip, { id: auth.user.id, username: auth.user.username }, reason);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const ip = String(body?.ip || "").trim();

  const result = await unbanIp(ip, { id: auth.user.id, username: auth.user.username });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({ success: true });
}
