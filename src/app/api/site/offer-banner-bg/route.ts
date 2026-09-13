import { NextResponse } from "next/server";
import { getKVPairs, setKV } from "@/lib/db";
import { requireSession } from "@/lib/authz";
import { isAdminUser } from "@/lib/secureDataWrite";
import { OFFER_BANNER_BG_ALLOWED, OFFER_BANNER_BG_DEFAULT } from "@/lib/offerBannerBg";

/* Public: current offer-banner theme key (design setting, safe to read). */
export async function GET() {
  try {
    const kv = await getKVPairs();
    const bg = String(kv.offerBannerBg ?? "");
    return NextResponse.json({ bg: OFFER_BANNER_BG_ALLOWED.has(bg) ? bg : OFFER_BANNER_BG_DEFAULT });
  } catch {
    return NextResponse.json({ bg: OFFER_BANNER_BG_DEFAULT });
  }
}

/* Admin-only write; only allow-listed theme keys are ever accepted. */
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
  if (!OFFER_BANNER_BG_ALLOWED.has(key)) {
    return NextResponse.json({ error: "Invalid background key" }, { status: 400 });
  }

  await setKV("offerBannerBg", key);
  return NextResponse.json({ ok: true, bg: key });
}