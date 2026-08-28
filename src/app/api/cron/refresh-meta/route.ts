import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET;
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      ok: true,
      refreshed: { live: false, ptr: false },
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error("Cron refresh error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
