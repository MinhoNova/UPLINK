import { NextResponse } from "next/server";
import { getD1 } from "@/lib/d1";
import { requireAdmin } from "@/lib/authz";

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const d1 = await getD1();
    if (!d1) {
      return NextResponse.json({ ok: false, error: "D1 binding unavailable" }, { status: 503 });
    }
    const row = await d1.prepare("SELECT COUNT(*) AS c FROM kv_store").first<{ c: number }>();
    return NextResponse.json({ ok: true, kvRows: row?.c ?? 0 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
