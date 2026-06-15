const PRODUCTION_URL = "https://uplinklfg.com";

/** Canonical public site URL for SEO, sitemap, and Open Graph. */
export function getSiteUrl(): string {
  const publicUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (publicUrl) return publicUrl.replace(/\/$/, "");
  const raw = process.env.NEXTAUTH_URL;
  if (raw?.trim()) return raw.replace(/\/$/, "");
  if (process.env.NODE_ENV === "development") return "http://localhost:3000";
  return PRODUCTION_URL;
}
