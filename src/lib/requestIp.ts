/** Best-effort client IP from reverse-proxy headers (Cloudflare, Vercel, nginx). */
export function getClientIp(req: Request): string {
  const cfIp = req.headers.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;

  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return "unknown";
}

/** Basic IPv4 / IPv6 literal check for admin ban input. */
export function isValidIpLiteral(ip: string): boolean {
  const v = ip.trim();
  if (!v) return false;
  if (v === "unknown") return false;
  const v4 =
    /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/.test(v);
  if (v4) return true;
  const v6 = /^[0-9a-f:]+$/i.test(v) && v.includes(":");
  return v6;
}
