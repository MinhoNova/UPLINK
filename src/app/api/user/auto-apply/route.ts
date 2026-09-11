import { NextResponse } from "next/server";
import { getAppSession } from "@/lib/authEnv";
import { getKV, setKV, initTables } from "@/lib/db";
import { isAionClass, sanitizeAionLevel } from "@/lib/aionClassMeta";

/** Per-user auto-apply preference. */
export interface AionAutoApply {
  enabled: boolean;
  aionClass: string;
  itemLevel: number;
}

export const DEFAULT_AUTO_APPLY: AionAutoApply = {
  enabled: false,
  aionClass: "",
  itemLevel: 60,
};

function sanitizeAutoApply(raw: any): AionAutoApply {
  const r = raw && typeof raw === "object" ? raw : {};
  const cls = typeof r.aionClass === "string" ? r.aionClass.trim() : "";
  return {
    enabled: r.enabled === true,
    aionClass: isAionClass(cls) ? cls : "",
    itemLevel: sanitizeAionLevel(r.itemLevel),
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

  const aionAutoApply = sanitizeAutoApply(body?.aionAutoApply);
  if (aionAutoApply.enabled && !aionAutoApply.aionClass) {
    return NextResponse.json({ error: "Pick a class to enable auto-apply" }, { status: 400 });
  }

  await initTables();
  const users = (await getKV("registeredUsers")) || [];
  const idx = users.findIndex((u: any) => String(u.id) === String(userId));
  if (idx === -1) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  users[idx] = { ...users[idx], aionAutoApply };
  await setKV("registeredUsers", users);

  return NextResponse.json({ success: true, aionAutoApply });
}

export async function GET(req: Request) {
  const session = await getAppSession(req);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = String((session.user as { id?: string }).id || "");

  await initTables();
  const users = (await getKV("registeredUsers")) || [];
  const me = users.find((u: any) => String(u.id) === String(userId));
  return NextResponse.json({ aionAutoApply: me?.aionAutoApply || DEFAULT_AUTO_APPLY });
}