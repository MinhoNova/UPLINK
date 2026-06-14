import { validateMagicBytes } from "@/lib/imageSecurity";
import { safeGifFetch, validateSafeGifUrl } from "@/lib/safeRemoteUrl";

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

/** Normalize common GIF hosts to a direct media URL when possible. */
export function normalizeGifSourceUrl(raw: string): string {
  const url = raw.trim();
  try {
    const u = new URL(url);
    if (u.hostname.includes("giphy.com") && u.pathname.includes("/media/")) {
      return url;
    }
    if (u.hostname === "media.giphy.com" || u.hostname.endsWith(".giphy.com")) {
      return url;
    }
    if (u.hostname.includes("tenor.com") && u.pathname.includes("/view/")) {
      return url;
    }
  } catch {
    return url;
  }
  return url;
}

function refererFor(url: string): string | undefined {
  try {
    const u = new URL(url);
    if (u.hostname.includes("pinimg.com") || u.hostname.includes("pinterest.")) {
      return "https://www.pinterest.com/";
    }
    if (u.hostname.includes("giphy.com")) {
      return "https://giphy.com/";
    }
    if (u.hostname.includes("tenor.com")) {
      return "https://tenor.com/";
    }
    return `${u.protocol}//${u.hostname}/`;
  } catch {
    return undefined;
  }
}

async function fetchOnce(url: string, referer?: string): Promise<Response | null> {
  const headers: Record<string, string> = {
    Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    "User-Agent": BROWSER_UA,
    "Accept-Language": "en-US,en;q=0.9",
  };
  if (referer) headers.Referer = referer;

  return safeGifFetch(url, { headers, timeoutMs: 12_000 });
}

/** Server-side download of a remote image (Cloudflare / Node) with SSRF protection. */
export async function fetchExternalImageBuffer(
  sourceUrl: string,
  maxBytes = 8 * 1024 * 1024
): Promise<Buffer | null> {
  const normalized = normalizeGifSourceUrl(sourceUrl);
  const check = validateSafeGifUrl(normalized);
  if (!check.ok) return null;

  const url = check.url.toString();
  const referer = refererFor(url);

  const res = await fetchOnce(url, referer);
  if (!res?.ok) {
    const retry = await fetchOnce(url, undefined);
    if (!retry?.ok) return null;
    const buf = Buffer.from(await retry.arrayBuffer());
    if (buf.length > maxBytes || buf.length < 8 || !validateMagicBytes(buf)) return null;
    return buf;
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("text/html")) return null;

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > maxBytes || buf.length < 8 || !validateMagicBytes(buf)) return null;
  return buf;
}
