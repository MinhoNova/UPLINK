import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimitByIp } from "@/lib/rateLimitDistributed";

const UPLOAD_PATHS = ["/api/user/upload", "/api/community/posts"];
const STRICT_PATHS = ["/api/dm", "/api/friends", "/api/discord/broadcast"];

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

  if (!path.startsWith("/api/")) return NextResponse.next();

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

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
