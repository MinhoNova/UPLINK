import { getClientIp } from "@/lib/requestIp";
import { rateLimitByIp, rateLimitResponse } from "@/lib/rateLimit";
import { isAllowedPortraitUrl } from "@/lib/aion2GameApi";

export const dynamic = "force-dynamic";

const PUBLIC_CACHE = "public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400";

export async function GET(req: Request) {
  const rl = await rateLimitByIp(getClientIp(req), "aion2:portrait", 240, 60_000);
  if (!rl.ok) return rateLimitResponse(rl);

  const { searchParams } = new URL(req.url);
  const url = searchParams.get("u") || "";
  if (!isAllowedPortraitUrl(url)) {
    return new Response("blocked", { status: 403 });
  }

  try {
    const upstream = await fetch(url, {
      redirect: "follow",
      cf: { cacheEverything: true, cacheTtl: 86400 },
    });
    if (!upstream.ok) return new Response("upstream error", { status: 502 });
    const buf = await upstream.arrayBuffer();
    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "image/jpeg",
        "Cache-Control": PUBLIC_CACHE,
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new Response("portrait unavailable", { status: 502 });
  }
}