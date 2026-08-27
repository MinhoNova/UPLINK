const PRODUCTION_URL = "https://uplink.uplinklfg.workers.dev";

/** Canonical public site URL for SEO, sitemap, and Open Graph. */
export function getSiteUrl(): string {
  const raw = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (raw?.trim()) return raw.replace(/\/$/, "");
  if (process.env.NODE_ENV === "development") return "http://localhost:3000";
  return PRODUCTION_URL;
}
