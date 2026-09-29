import { NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import { getD1 } from "@/lib/d1";

/**
 * Measure the stored blobs without reading them.
 *
 * Error 1102 is the worker running out of memory, and the usual suspect here is
 * one very large `kv_store` value — a `lobbies` blob carrying inline base64
 * images. Guessing at that from the symptom is slow and has already been wrong
 * once, so this reports what is actually stored.
 *
 * Everything it does is `LENGTH()` in SQL. The values are never selected, so
 * this stays cheap and safe no matter how large they get, and it exposes no
 * user data: only key names and byte counts.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: auth.status });
  }
  // Admin only: it names the internal keys of the store.
  if (auth.user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const d1 = await getD1();
    if (!d1) {
      return NextResponse.json({ error: "d1 unavailable" }, { status: 501 });
    }
    const { results } = await d1
      .prepare("SELECT key, LENGTH(value) AS bytes FROM kv_store ORDER BY bytes DESC")
      .all<{ key: string; bytes: number }>();

    const rows = (results ?? []).map((r) => ({ key: r.key, kb: Math.round((r.bytes ?? 0) / 1024) }));
    const totalKb = rows.reduce((sum, r) => sum + r.kb, 0);
    // A single blob over a few MB is what tips a 128MB worker over, because every
    // authenticated read parses it.
    const oversized = rows.filter((r) => r.kb > 512);

    return NextResponse.json(
      { totalKb, rows, oversized, total: rows.length },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } }
    );
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
