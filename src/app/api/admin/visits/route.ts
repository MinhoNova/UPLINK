import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { getKV } from "@/lib/db";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = new URL(req.url);
  const rawDate = url.searchParams.get("date");
  const date = rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
    ? rawDate
    : (() => {
        const d = new Date();
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      })();

  const map = ((await getKV(`analytics:visits:${date}`)) as Record<string, any>) || {};
  const visits = Object.values(map)
    .sort((a: any, b: any) => (b.lastSeenAt || 0) - (a.lastSeenAt || 0))
    .map((v: any) => ({
      ...v,
      ips: Array.isArray(v.ips) ? v.ips : [],
    }));

  return NextResponse.json({ date, visits });
}