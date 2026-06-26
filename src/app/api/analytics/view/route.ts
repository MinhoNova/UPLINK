import { NextResponse } from "next/server";
import { getKV, setKV } from "@/lib/db";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function todayKey() {
  const d = new Date();
  return `analytics:pv:${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function uniqueKey() {
  const d = new Date();
  return `analytics:uv:${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    // daily page views
    const dayKey = todayKey();
    const count = ((await getKV(dayKey)) as number) || 0;
    await setKV(dayKey, count + 1);

    // daily unique visitors
    const uvKey = uniqueKey();
    const ips: string[] = ((await getKV(uvKey)) as string[]) || [];
    if (!ips.includes(ip)) {
      ips.push(ip);
      await setKV(uvKey, ips);
    }

    // all-time page views
    const atKey = "analytics:pv:alltime";
    const atCount = ((await getKV(atKey)) as number) || 0;
    await setKV(atKey, atCount + 1);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET() {
  try {
    const dayKey = todayKey();
    const uvKey = uniqueKey();
    const atKey = "analytics:pv:alltime";

    const [dayRow, uvRow, atRow] = await Promise.all([
      getKV(dayKey),
      getKV(uvKey),
      getKV(atKey),
    ]);

    return NextResponse.json({
      todayPageViews: (dayRow as number) || 0,
      todayUniqueVisitors: (uvRow as string[])?.length || 0,
      allTimePageViews: (atRow as number) || 0,
    });
  } catch {
    return NextResponse.json({ todayPageViews: 0, todayUniqueVisitors: 0, allTimePageViews: 0 });
  }
}
