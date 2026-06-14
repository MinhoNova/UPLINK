const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.goog",
]);

/** Hosts allowed for server-side GIF/media fetch (SSRF allowlist). */
function isAllowedMediaHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/\.$/, "");
  if (BLOCKED_HOSTNAMES.has(h)) return false;
  if (h === "giphy.com" || h.endsWith(".giphy.com")) return true;
  if (h === "tenor.com" || h.endsWith(".tenor.com")) return true;
  if (h.includes("pinimg.com")) return true;
  return false;
}

function isPrivateOrReservedIpv4(host: string): boolean {
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const octets = m.slice(1).map(Number);
  if (octets.some((o) => o > 255)) return true;
  const [a, b] = octets;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  return false;
}

function isPrivateOrReservedIpv6(host: string): boolean {
  const h = host.toLowerCase();
  if (h === "::1" || h === "::") return true;
  if (h.startsWith("fc") || h.startsWith("fd")) return true; // unique local
  if (h.startsWith("fe80")) return true; // link-local
  if (h.startsWith("::ffff:")) {
    const v4 = h.slice("::ffff:".length);
    return isPrivateOrReservedIpv4(v4);
  }
  return false;
}

function isBlockedHost(host: string): boolean {
  const h = host.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(h)) return true;
  if (h.endsWith(".local") || h.endsWith(".internal")) return true;
  if (isPrivateOrReservedIpv4(h) || isPrivateOrReservedIpv6(h)) return true;
  return false;
}

export type SafeUrlResult = { ok: true; url: URL } | { ok: false; error: string };

/** Validate a remote GIF/image URL before server-side fetch. */
export function validateSafeGifUrl(raw: string): SafeUrlResult {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: "URL required" };

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, error: "Invalid URL" };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { ok: false, error: "Only HTTP(S) URLs are allowed" };
  }

  const host = parsed.hostname;
  if (isBlockedHost(host)) {
    return { ok: false, error: "URL host is not allowed" };
  }

  if (!isAllowedMediaHost(host)) {
    return { ok: false, error: "GIF URL must be from Giphy, Tenor, or Pinterest CDN" };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, error: "URL credentials are not allowed" };
  }

  return { ok: true, url: parsed };
}

const MAX_REDIRECTS = 5;

/** Fetch with redirect validation — each hop must pass validateSafeGifUrl. */
export async function safeGifFetch(
  startUrl: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<Response | null> {
  const { timeoutMs = 12_000, ...fetchInit } = init;
  let current = startUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const check = validateSafeGifUrl(current);
    if (!check.ok) return null;

    let res: Response;
    try {
      res = await fetch(check.url.toString(), {
        ...fetchInit,
        redirect: "manual",
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      return null;
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) return null;
      current = new URL(location, check.url).toString();
      continue;
    }

    return res;
  }

  return null;
}
