import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/requestIp";
import { rateLimitByIp, rateLimitResponse } from "@/lib/rateLimit";
import { getGameServers } from "@/lib/aion2GameApi";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const rl = await rateLimitByIp(getClientIp(req), "aion2:servers", 30, 60_000);
  if (!rl.ok) return rateLimitResponse(rl);
  try {
    const servers = await getGameServers();
    return NextResponse.json({ servers });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Servers unavailable" }, { status: 502 });
  }
}