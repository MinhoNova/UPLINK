import { getClientIp } from "@/lib/requestIp";
import { rateLimitByIp, rateLimitResponse } from "@/lib/rateLimit";
import { isAllowedPortraitUrl } from "@/lib/aion2GameApi";

export const dynamic = "force-dynamic";

/**
 * Portrait URLs are cached at the CDN for an hour, not a day.
 *
 * The proxy path is stable for a given character — `portraitProxyPath` emits the
 * same `?u=...&v=2` string for everyone, so the URL carries no version bump when
 * the character changes gear. A day of `immutable` therefore pinned the first
 * portrait ever fetched for that character: re-verifying after an upgrade kept
 * showing the old face. An hour is long enough to absorb a page full of members
 * and short enough that a gear change shows up in the same sitting.
 */
const PUBLIC_CACHE = "public, max-age=3600, s-maxage=3600, stale-while-revalidate=3600";

/** Real portraits are multi-KB rendered JPEGs. Below this the upstream
 *  returned a tiny error/placeholder image — let the client fall back. */
const MIN_VALID_BYTES = 4096;

/** The upstream answers 200 with a ~9.5 KB `image/png` "no portrait set"
 *  placeholder whenever `gameServerKey` does not match the character (verified
 *  against profileimg.plaync.com: a correct key returns a ~30 KB
 *  `image/jpeg`, a wrong one returns the PNG). The old size check alone let
 *  that placeholder through and every character rendered as the same generic
 *  badge, which reads as "the portrait is broken". Genuine portraits from this
 *  endpoint are JPEG, so reject the placeholder format outright and let the
 *  caller's class crest be the fallback. */
const PLACEHOLDER_CONTENT_TYPE = "image/png";

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
    // Best-effort at looking like the official page's own <img> request. The
    // upstream is Envoy behind Google Frontend (`Via: 1.1 google`,
    // `x-envoy-upstream-service-time`) and it bot-filters datacenter ranges: in
    // production this route answered 502 for portraits that a residential IP --
    // and an identical local Node fetch -- received as 200 / image/jpeg /
    // 31,291 bytes. Client-side loads are the primary path for that reason, so
    // this proxy is only a fallback and cannot be the reason a face is missing.
    const upstream = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: "https://aion2.plaync.com/",
      },
    });
    if (!upstream.ok) return new Response("upstream error", { status: 502 });
    const contentType = (upstream.headers.get("content-type") || "").toLowerCase();
    if (contentType.startsWith(PLACEHOLDER_CONTENT_TYPE)) {
      return new Response("portrait unavailable", { status: 502 });
    }
    const buf = await upstream.arrayBuffer();
    if (buf.byteLength < MIN_VALID_BYTES) {
      return new Response("portrait unavailable", { status: 502 });
    }
    const res = new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType || "image/jpeg",
        "Cache-Control": PUBLIC_CACHE,
        "ETag": `"${hex(await crypto.subtle.digest("SHA-256", buf))}"`,
        "Access-Control-Allow-Origin": "*",
      },
    });
    if (edgeCache) {
      try {
        // The edge copy inherits `s-maxage` from the response above, so both
        // windows move together.
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