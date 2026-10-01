import { NextResponse } from "next/server";
import { getKV, setKV } from "@/lib/db";
import { getAppSession } from "@/lib/authEnv";
import { rateLimitByIp } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/requestIp";
import { rateLimitResponse } from "@/lib/rateLimitHttp";

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

/**
 * How many distinct daily addresses the unique-visitor row will track.
 *
 * Bounds the blob that a single write rewrites; see the POST handler for why
 * that matters more than the exact number does.
 */
const MAX_TRACKED_IPS = 5_000;

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);

    // Counting a page view is one request per page, and the handler answers
    // before the work that costs anything, so a client retry cannot double-count
    // — but nothing bounded how often it could be called. Four shared rows get
    // read and rewritten per call, so this is the cheapest route to make
    // expensive. Ceiling is well above one person's page navigation, including
    // a reload-heavy session.
    const rl = await rateLimitByIp(ip, "/api/analytics/view", 120, 60_000);
    if (!rl.ok) return rateLimitResponse(rl);

    // daily page views
    const dayKey = todayKey();
    const count = ((await getKV(dayKey)) as number) || 0;
    await setKV(dayKey, count + 1);

    // Daily unique visitors.
    //
    // The unique count is only ever read as `ips.length`, and this row is
    // rewritten whole on every address it has not seen before. That is fine at
    // the scale the number is actually for and a write amplifier above it: an
    // anonymous caller rotating source addresses made this loop push, re-read
    // and re-serialize the same ever-growing blob, once per address, for a
    // figure that is displayed as a single integer.
    //
    // So cap it. Past the cap the row stops growing and the count is a floor —
    // a site with more distinct daily visitors than this is not a number this
    // row can report honestly anyway, and the paid traffic is what the admin
    // panel actually reads.
    const uvKey = uniqueKey();
    const ips: string[] = ((await getKV(uvKey)) as string[]) || [];
    if (!ips.includes(ip)) {
      if (ips.length < MAX_TRACKED_IPS) {
        ips.push(ip);
        await setKV(uvKey, ips);
      }
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

export async function GET(req: Request) {
  // Traffic counters are the admin panel's numbers, not a public statistic, and
  // this read used to answer anyone who asked. `POST` stays open on purpose —
  // that is how a page view gets counted — but the read-out is admin-only.
  const auth = await getAppSession(req);
  if (!auth) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if ((auth.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
