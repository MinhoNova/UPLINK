import { NextResponse } from "next/server";
import { getD1 } from "@/lib/d1";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  return new Response(
    `<html><body>
      <h1>Seed D1 Database</h1>
      <p>This will seed the database from src/data/db.json</p>
      <form method="POST"><button type="submit">Seed Now</button></form>
    </body></html>`,
    { headers: { "content-type": "text/html" } }
  );
}

export async function POST() {
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
