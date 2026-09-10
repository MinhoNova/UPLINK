import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { getKV, initTables } from "@/lib/db";
import { logAudit } from "@/lib/auditLog";
import { getAllBans, addUserBan, removeUserBan } from "@/lib/banCheck";
import { getClientIp } from "@/lib/requestIp";

function parseHandle(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/^@/, "")
    .slice(0, 40);
}

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await initTables();
  const users: Record<string, unknown>[] = (await getKV("registeredUsers")) || [];
  const recs = await getAllBans();
  const handles: string[] = (await getKV("bannedUsers")) || [];

  const bans = recs.map((b) => {
    const u = users.find((x) => String(x.id) === String(b.id));
    return {
      ...b,
      name: u?.name || u?.displayName,
      username: u?.username,
      avatar: (u?.customAvatar as string) || (u?.avatar as string) || undefined,
      tier: u?.team && (u.team as { name?: string }).name ? (u.team as { name: string }).name : undefined,
    };
  });

  const legacyHandles = Array.isArray(handles) ? handles.filter((h) => !recs.some((r) => r.handle === h)) : [];

  return NextResponse.json({ bans, legacyHandles });
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const clientIp = getClientIp(req);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const b = (body || {}) as Record<string, unknown>;
  const action = b.action;
  const reason = typeof b.reason === "string" ? b.reason.trim().slice(0, 200) : undefined;
  const byId = typeof b.userId === "string" ? b.userId.trim().slice(0, 64) : "";
  const byHandle = parseHandle(b.handle);

  if (action && typeof action !== "string") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  await initTables();
  const users: Record<string, unknown>[] = (await getKV("registeredUsers")) || [];

  let target: Record<string, unknown> | undefined;
  if (byId) target = users.find((u) => String(u.id) === byId);
  if (!target && byHandle) {
    const q = byHandle.toLowerCase();
    target = users.find(
      (u) =>
        String(u.username || "").toLowerCase() === q || String(u.name || "").toLowerCase() === q
    );
  }
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const userId = String(target.id);
  const handle = String(target.username || "");

  const auditMeta = {
    targetId: userId,
    ...(reason ? { reason } : {}),
    ...(clientIp !== "unknown" ? { ip: clientIp } : {}),
  };

  if (action === "ban") {
    const res = await addUserBan({ id: userId, handle, reason });
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
    await logAudit({
      action: "admin.userBan",
      userId: auth.user.id,
      handle: auth.user.username,
      target: handle,
      meta: auditMeta,
    });
    return NextResponse.json({ success: true, userId, handle });
  }

  if (action === "unban") {
    await removeUserBan({ id: userId, handle });
    await logAudit({
      action: "admin.userUnban",
      userId: auth.user.id,
      handle: auth.user.username,
      target: handle,
      meta: auditMeta,
    });
    return NextResponse.json({ success: true, userId, handle });
  }

  return NextResponse.json({ error: "action must be ban or unban" }, { status: 400 });
}