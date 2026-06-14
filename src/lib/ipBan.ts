import { getKV, setKV, initTables } from "@/lib/db";
import { NextResponse } from "next/server";
import { getClientIp, isValidIpLiteral } from "@/lib/requestIp";
import { logAudit } from "@/lib/auditLog";
import { isBanExempt } from "@/lib/banCheck";

export async function getBannedIps(): Promise<string[]> {
  await initTables();
  const list: unknown = await getKV("bannedIps");
  return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : [];
}

export async function isIpBanned(ip: string): Promise<boolean> {
  if (!ip || ip === "unknown") return false;
  const list = await getBannedIps();
  return list.includes(ip);
}

export async function ipBannedResponse() {
  return NextResponse.json(
    { error: "Access denied from this network. Contact support if this is a mistake." },
    { status: 403 }
  );
}

/** Returns a 403 response if the request IP is banned, otherwise null. */
export async function rejectIfIpBanned(req: Request): Promise<NextResponse | null> {
  const ip = getClientIp(req);
  if (await isIpBanned(ip)) return ipBannedResponse();
  return null;
}

/** Skip IP ban for admin accounts (e.g. testing IP ban panel). */
export async function rejectIfIpBannedUnlessAdmin(
  req: Request,
  userId: string,
  handle: string
): Promise<NextResponse | null> {
  if (isBanExempt(handle, userId)) return null;
  return rejectIfIpBanned(req);
}

/** Automatic IP ban (reserved for extreme abuse; onboarding validation no longer calls this). */
export async function banIpAutomatic(
  ip: string,
  reason: string,
  userId?: string
): Promise<void> {
  const trimmed = ip.trim();
  if (!trimmed || trimmed === "unknown" || !isValidIpLiteral(trimmed)) return;

  await initTables();
  const list = await getBannedIps();
  if (!list.includes(trimmed)) {
    await setKV("bannedIps", [...list, trimmed]);
  }

  await logAudit({
    action: "onboarding.ipBan",
    userId: userId || "system",
    handle: "system",
    target: trimmed,
    meta: { reason, ip: trimmed },
  });
}

export async function banIp(
  ip: string,
  admin: { id: string; username: string },
  reason?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmed = ip.trim();
  if (!isValidIpLiteral(trimmed)) return { ok: false, error: "Invalid IP address" };

  await initTables();
  const list = await getBannedIps();
  if (!list.includes(trimmed)) {
    await setKV("bannedIps", [...list, trimmed]);
  }

  await logAudit({
    action: "admin.ipBan",
    userId: admin.id,
    handle: admin.username,
    target: trimmed,
    meta: { reason: reason || undefined, ip: trimmed },
  });

  return { ok: true };
}

export async function unbanIp(
  ip: string,
  admin: { id: string; username: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmed = ip.trim();
  if (!trimmed) return { ok: false, error: "Invalid IP address" };

  await initTables();
  const list = await getBannedIps();
  await setKV(
    "bannedIps",
    list.filter((x) => x !== trimmed)
  );

  await logAudit({
    action: "admin.ipUnban",
    userId: admin.id,
    handle: admin.username,
    target: trimmed,
    meta: { ip: trimmed },
  });

  return { ok: true };
}
