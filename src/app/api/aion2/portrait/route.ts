import { getClientIp } from "@/lib/requestIp";
import { rateLimitByIp, rateLimitResponse } from "@/lib/rateLimit";
import { isAllowedPortraitUrl } from "@/lib/aion2GameApi";

export const dynamic = "force-dynamic";

const PUBLIC_CACHE =
  "public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400, immutable";

/** Real portraits are multi-KB rendered JPEGs. Below this the upstream
 *  returned a tiny error/placeholder image — let the client fall back. */
const MIN_VALID_BYTES = 4096;

function hex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface EdgeCache {
  match(req: Request): Promise<Response | undefined>;
  put(req: Request, res: Response): Promise<void>;
}

const edgeCache = (globalThis as unknown as { caches?: { default: EdgeCache } }).caches
  ? (globalThis as unknown as { caches?: { default: EdgeCache } }).caches!.default ?? null
  : null;

export async function GET(req: Request) {
  const rl = await rateLimitByIp(getClientIp(req), "aion2:portrait", 240, 60_000);
  if (!rl.ok) return rateLimitResponse(rl);

  const { searchParams } = new URL(req.url);
  const url = searchParams.get("u") || "";
  if (!isAllowedPortraitUrl(url)) {
    return new Response("blocked", { status: 403 });
  }

  if (edgeCache) {
    try {
      const cached = await edgeCache.match(req);
      if (cached) return cached;
    } catch {
      // Cache API unavailable (e.g. local Node dev) — fall through to upstream.
    }
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
    const res = new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "image/jpeg",
        "Cache-Control": PUBLIC_CACHE,
        "ETag": `"${hex(await crypto.subtle.digest("SHA-256", buf))}"`,
        "Access-Control-Allow-Origin": "*",
      },
    });
    if (edgeCache) {
      try {
        await edgeCache.put(req, res.clone());
      } catch {
        // best-effort edge cache — a miss still proxies fine.
      }
    }
    return res;
  } catch {
    return new Response("portrait unavailable", { status: 502 });
  }
}