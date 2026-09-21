import { NextResponse } from "next/server";
import { getD1 } from "@/lib/d1";
import { requireAdmin } from "@/lib/authz";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.redirect(new URL("/api/seed", "https://aion2lfg.com").toString(), 307);
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const d1 = await getD1();
    if (!d1) return NextResponse.json({ error: "D1 not available" }, { status: 500 });



    // Load db.json
    const dbPath = path.join(process.cwd(), "src", "data", "db.json");
    const data = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

    let count = 0;
    for (const [key, value] of Object.entries(data)) {
      try {
        await d1
          .prepare("INSERT INTO kv_store (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value")
          .bind(key, JSON.stringify(value))
          .run();
        count++;
      } catch (e) {
        console.error("seed error:", key, e);
      }
    }

    return NextResponse.json({ ok: true, seeded: count });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
