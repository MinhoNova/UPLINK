import type { NextConfig } from "next";
import path from "path";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const productionUrl = "https://aion2lfg.com";

/**
 * Security headers.
 *
 * The site renders almost everything with React (auto-escaping) and every
 * dangerouslySetInnerHTML site is a compile-time constant, so XSS risk is low.
 * These are the second layer: they make clickjacking, MIME confusion, referrer
 * leakage, plugin abuse and plugin-injection unreachable even if a bug is
 * introduced later. The CSP is deliberately scoped to what the app actually
 * loads — `img-src`/`connect-src` stay open over https/wss because portraits,
 * embeds, Discord, Battle.net and LiveKit are all remote — while the vectors
 * that turn a stored string into code execution are closed outright.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js emits inline bootstrap/hydration scripts, so 'unsafe-inline' is
      // required here; the protection this buys is on the vectors below.
      "script-src 'self' 'unsafe-inline'",
      // Tailwind and the inline style attributes framer-motion writes.
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      "connect-src 'self' https: wss:",
      "frame-src 'self' https:",
      "worker-src 'self' blob:",
      "font-src 'self' data:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Sitemap is only served at /sitemap.xml; forwarding the bare paths prevents
  // Google Search Console from ever seeing an HTML 404 at /sitemap or /sitemap/.
  async redirects() {
    return [
      { source: "/sitemap", destination: "/sitemap.xml", permanent: true },
      { source: "/sitemap/", destination: "/sitemap.xml", permanent: true },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // NextAuth reads NEXTAUTH_URL in the client bundle; without this it defaults to localhost:3000.
  env: {
    NEXTAUTH_URL:
      process.env.NEXTAUTH_URL ??
      (process.env.NODE_ENV === "development" ? "http://localhost:3000" : productionUrl),
    NEXT_PUBLIC_LIVEKIT_URL:
      process.env.NEXT_PUBLIC_LIVEKIT_URL ?? "wss://uplink-sist6urm.livekit.cloud",
  },
  serverExternalPackages: ["better-sqlite3"],
  outputFileTracingExcludes: {
    "*": [
      "src/data/uplink.db*",
      "public/uploads/**",
      "public/wow/banners/**",
      "public/dream-background.gif",
    ],
  },
  typescript: {
    // A type error must fail the build. With this off, `next build` shipped a
    // route calling `requireSession()` with no argument that did not match the
    // function signature at all.
    ignoreBuildErrors: false,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@next-auth/core": path.resolve("node_modules/next-auth/core/index.js"),
      };
    }
    return config;
  },
  // Dev tunnels only. Third-party tunnel hosts are not needed in `main`.
  allowedDevOrigins: [],
};

export default nextConfig;

initOpenNextCloudflareForDev();
