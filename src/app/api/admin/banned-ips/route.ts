import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { banIp, getBannedIps, unbanIp } from "@/lib/ipBan";
import { getAuditLogs } from "@/lib/auditLog";
import { getKV, initTables } from "@/lib/db";

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
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

  await initTables();
  const users: any[] = (await getKV("registeredUsers")) || [];
  const fromUsers = users
    .filter((u) => typeof u.lastKnownIp === "string" && u.lastKnownIp && u.lastKnownIp !== "unknown")
    .map((u) => ({
      ip: u.lastKnownIp as string,
      handle: u.username || u.name,
      action: "last_seen",
      at: typeof u.lastSeenAt === "number" ? u.lastSeenAt : 0,
    }))
    .sort((a, b) => b.at - a.at)
    .slice(0, 40);

  for (const row of fromUsers) {
    if (!recentIps.has(row.ip)) recentIps.set(row.ip, row);
  }

  return NextResponse.json({
    ips,
    recent: Array.from(recentIps.values()).sort((a, b) => b.at - a.at).slice(0, 40),
  });
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await req.json().catch(() => ({}))) as { ip?: string; reason?: string };
  const ip = String(body?.ip || "").trim();
  const reason = body?.reason ? String(body.reason).slice(0, 200) : undefined;

  const result = await banIp(ip, { id: auth.user.id, username: auth.user.username }, reason);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await req.json().catch(() => ({}))) as { ip?: string; reason?: string };
  const ip = String(body?.ip || "").trim();

  const result = await unbanIp(ip, { id: auth.user.id, username: auth.user.username });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({ success: true });
}
