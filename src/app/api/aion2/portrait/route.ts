import { getClientIp } from "@/lib/requestIp";
import { rateLimitByIp, rateLimitResponse } from "@/lib/rateLimit";
import { isAllowedPortraitUrl } from "@/lib/aion2GameApi";

export const dynamic = "force-dynamic";

const PUBLIC_CACHE = "public, max-age=300, s-maxage=300, stale-while-revalidate=300";

/** Real portraits are multi-KB rendered JPEGs. Below this the upstream
 *  returned a tiny error/placeholder image — let the client fall back. */
const MIN_VALID_BYTES = 4096;

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
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; UPLINK/1.0; portrait-proxy)",
      },
    });
    if (!upstream.ok) return new Response("upstream error", { status: 502 });
    const buf = await upstream.arrayBuffer();
    if (buf.byteLength < MIN_VALID_BYTES) {
      return new Response("portrait unavailable", { status: 502 });
    }
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