import { NextResponse } from "next/server";
import { getKV, setKV } from "@/lib/db";
import { requireSession } from "@/lib/authz";
import { isAdminUser } from "@/lib/secureDataWrite";
import { HERO_BG_ALLOWED, HERO_BG_DEFAULT } from "@/lib/heroBg";

/* Public: anything can read the current banner style key (it's just a design setting). */
export async function GET() {
  try {
    // `getKV` reads the one row. `getKVPairs` read and JSON.parsed every row in
    // `kv_store` — every lobby, message, offer and user — on an unauthenticated
    // request whose entire answer is a single design key.
    const bg = String((await getKV("heroBg")) ?? "");
    return NextResponse.json({ bg: HERO_BG_ALLOWED.has(bg) ? bg : HERO_BG_DEFAULT });
  } catch {
    return NextResponse.json({ bg: HERO_BG_DEFAULT });
  }
}

/* Admin-only write. Only allow-listed keys are ever accepted. */
export async function PUT(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (!isAdminUser(auth.user.id, auth.user.username)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    /* keep default */
  }

  const key = String((body as { bg?: unknown }).bg ?? "");
  if (!HERO_BG_ALLOWED.has(key)) {
    return NextResponse.json({ error: "Invalid background key" }, { status: 400 });
  }

  await setKV("heroBg", key);
  return NextResponse.json({ ok: true, bg: key });
}