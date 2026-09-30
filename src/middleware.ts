import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimitByIp } from "@/lib/rateLimitDistributed";

const UPLOAD_PATHS = ["/api/user/upload", "/api/community/posts"];
const STRICT_PATHS = ["/api/dm", "/api/friends", "/api/discord/broadcast"];

/**
 * Endpoints that authenticate themselves cryptographically, where an IP bucket
 * is either meaningless or actively harmful.
 *
 * Discord interactions arrive from Discord's own shared edge IPs, not from the
 * player who clicked the button, so every guild interaction in the world landed
 * in one 150/min bucket. That both let one abuser lock out everyone and 429'd
 * legitimate button presses. The Ed25519 signature check inside the handler is
 * the real gate: a request without a valid signature never reaches any logic.
 */
const SELF_AUTHENTICATED_PATHS = ["/api/discord/interactions"];

/** Genuinely public, cacheable assets. Everything else defaults to no-store. */
const PUBLIC_API_PATHS = [
  "/api/aion2/portrait",
  "/api/aion2/servers",
  "/api/aion2/profile",
  "/api/user/media",
  "/api/site/hero-bg",
  "/api/site/offer-banner-bg",
];

function getClientIp(req: NextRequest): string {
  const cfIp = req.headers.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;
  return (
    req.headers.get("x-real-ip")?.trim() ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (path.startsWith("/api/auth")) {
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "private, no-cache, no-store");
    return res;
  }

  if (!path.startsWith("/api/")) {
    // Signed-in pages render account data into the HTML (mission threads carry
    // chat and applicant lists). force-dynamic alone did not stop the edge from
    // storing one account's HTML and replaying it to the next one, so mark the
    // private sections explicitly.
    const res = NextResponse.next();
    if (PRIVATE_PAGE_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
      res.headers.set("Cache-Control", "private, no-store, max-age=0");
      res.headers.append("Vary", "Cookie");
    }
    return res;
  }

  if (SELF_AUTHENTICATED_PATHS.some((p) => path.startsWith(p))) {
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "private, no-store, max-age=0");
    res.headers.append("Vary", "Cookie");
    return res;
  }

  const ip = getClientIp(req);
  let limit = 150;
  if (path.startsWith("/api/livekit")) limit = 400;
  if (UPLOAD_PATHS.some((p) => path.startsWith(p))) limit = 30;
  if (STRICT_PATHS.some((p) => path.startsWith(p))) limit = 80;

  const result = await rateLimitByIp(ip, path, limit, 60_000);
  if (!result.ok) {
    return new NextResponse(
      JSON.stringify({ error: "Too many requests", retryAfterMs: result.retryAfterMs }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)),
        },
      }
    );
  }

  // Anything under /api that is not explicitly public is per-user by default.
  // Most handlers simply forgot the header, and the edge then stored one
  // account's private response and served it to everybody after them. A route
  // that really is public declares `Cache-Control: public ...` and is left
  // alone.
  const res = NextResponse.next();
  if (!PUBLIC_API_PATHS.some((p) => path.startsWith(p))) {
    res.headers.set("Cache-Control", "private, no-store, max-age=0");
    res.headers.append("Vary", "Cookie");
  }
  return res;
}

/** Account pages that must never be cached by the edge. */
const PRIVATE_PAGE_PREFIXES = [
  "/manage",
  "/admin",
  "/my-profile",
  "/my-characters",
  "/character",
  "/create-offer",
  "/settings",
  "/support",
  "/reviews",
];

export const config = {
  matcher: [
    "/api/:path*",
    "/manage/:path*",
    "/admin/:path*",
    "/my-profile/:path*",
    "/my-characters/:path*",
    "/character/:path*",
    "/create-offer/:path*",
    "/settings/:path*",
    "/support/:path*",
    "/reviews/:path*",
  ],
};
