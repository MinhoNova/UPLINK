import { NextResponse } from "next/server";
import { getKV, setKV } from "@/lib/db";
import { getAppSession } from "@/lib/authEnv";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function dayStamp() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function todayKey() {
  return `analytics:pv:${dayStamp()}`;
}

function uniqueKey() {
  return `analytics:uv:${dayStamp()}`;
}

function visitsKey() {
  return `analytics:visits:${dayStamp()}`;
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

    // per-player daily visits (only for logged-in users)
    const session = await getAppSession(req).catch(() => null);
    if (session?.user?.id && session.user.username) {
      const key = visitsKey();
      const map: Record<string, any> = ((await getKV(key)) as Record<string, any>) || {};
      const now = Date.now();
      const prev = map[session.user.id] || { count: 0, firstSeenAt: now, lastSeenAt: now, ips: [] };
      const next = {
        id: session.user.id,
        username: session.user.username,
        name: (session.user.name as string) || "",
        avatar: (session.user.image as string) || "",
        count: (prev.count || 0) + 1,
        firstSeenAt: prev.firstSeenAt || now,
        lastSeenAt: now,
        ips: Array.isArray(prev.ips) && prev.ips.length >= 5 ? prev.ips : [...(prev.ips || []), ip],
      };
      map[session.user.id] = next;
      await setKV(key, map);
    }

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
