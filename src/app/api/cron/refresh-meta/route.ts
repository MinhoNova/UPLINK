import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET;
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Force refresh both live and PTR meta data
    const baseUrl = new URL(request.url).origin;

    const [liveRes, ptrRes] = await Promise.all([
      fetch(`${baseUrl}/api/wow/blizzard-meta?refresh=1`, { cache: "no-store" }),
      fetch(`${baseUrl}/api/wow/blizzard-meta?ptr=1&refresh=1`, { cache: "no-store" }),
    ]);

    const liveOk = liveRes.ok;
    const ptrOk = ptrRes.ok;

    return NextResponse.json({
      ok: liveOk || ptrOk,
      refreshed: {
        live: liveOk,
        ptr: ptrOk,
      },
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error("Cron refresh error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
