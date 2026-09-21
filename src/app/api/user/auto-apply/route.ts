import { NextResponse } from "next/server";
import { getAppSession } from "@/lib/authEnv";
import { getKV, setKV, initTables } from "@/lib/db";
import { isAionClass, sanitizeAionCpAp, sanitizeAionLevel } from "@/lib/aionClassMeta";

/** Per-user auto-apply preference. */
interface AionAutoApply {
  enabled: boolean;
  aionClass: string;
  itemLevel: number;
  combatPower: number;
}

const DEFAULT_AUTO_APPLY: AionAutoApply = {
  enabled: false,
  aionClass: "",
  itemLevel: 60,
  combatPower: 0,
};

function sanitizeAutoApply(raw: any): AionAutoApply {
  const r = raw && typeof raw === "object" ? raw : {};
  const cls = typeof r.aionClass === "string" ? r.aionClass.trim() : "";
  return {
    enabled: r.enabled === true,
    aionClass: isAionClass(cls) ? cls : "",
    itemLevel: sanitizeAionLevel(r.itemLevel),
    combatPower: sanitizeAionCpAp(r.combatPower),
  };
}

export async function POST(req: Request) {
  const session = await getAppSession(req);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = String((session.user as { id?: string }).id || "");

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const aionAutoApply = body?.aionAutoApply != null
    ? sanitizeAutoApply(body.aionAutoApply)
    : undefined;
  const autoAccept = body?.autoAccept != null ? body.autoAccept === true : undefined;

  if (aionAutoApply?.enabled && !aionAutoApply.aionClass) {
    return NextResponse.json({ error: "Pick a class to enable auto-apply" }, { status: 400 });
  }

  await initTables();
  const users = (await getKV("registeredUsers")) || [];
  const idx = users.findIndex((u: any) => String(u.id) === String(userId));
  if (idx === -1) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  let next = { ...users[idx] };
  if (aionAutoApply) next = { ...next, aionAutoApply };
  if (autoAccept != null) next = { ...next, autoAccept };
  users[idx] = next;
  await setKV("registeredUsers", users);

  return NextResponse.json({
    success: true,
    aionAutoApply: next.aionAutoApply || DEFAULT_AUTO_APPLY,
    autoAccept: next.autoAccept === true,
  });
}

export async function GET(req: Request) {
  const session = await getAppSession(req);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = String((session.user as { id?: string }).id || "");

  await initTables();
  const users = (await getKV("registeredUsers")) || [];
  const me = users.find((u: any) => String(u.id) === String(userId));
  return NextResponse.json({
    aionAutoApply: me?.aionAutoApply || DEFAULT_AUTO_APPLY,
    autoAccept: me?.autoAccept === true,
  });
}