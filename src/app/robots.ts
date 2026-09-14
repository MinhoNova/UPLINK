import type { MetadataRoute } from "next";

const SITE_URL = "https://aion2lfg.com";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = SITE_URL;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/community", "/my-profile", "/manage"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
