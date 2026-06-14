import type { NextConfig } from "next";
import path from "path";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const productionUrl = "https://uplink.uplinklfg.workers.dev";

const nextConfig: NextConfig = {
  // NextAuth reads NEXTAUTH_URL in the client bundle; without this it defaults to localhost:3000.
  env: {
    NEXTAUTH_URL:
      process.env.NEXTAUTH_URL ??
      (process.env.NODE_ENV === "development" ? "http://localhost:3000" : productionUrl),
    NEXT_PUBLIC_LIVEKIT_URL:
      process.env.NEXT_PUBLIC_LIVEKIT_URL ?? "wss://uplink-sist6urm.livekit.cloud",
  },
  serverExternalPackages: ["better-sqlite3"],
  typescript: {
    ignoreBuildErrors: true,
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
  allowedDevOrigins: ["boozy-friend-trapped.ngrok-free.dev", "starship-flashcard-garment.ngrok-free.dev", "grape-retention-fraying.ngrok-free.dev", "twelve-colts-know.loca.lt", "nice-poems-beam.loca.lt", "grumpy-parts-punch.loca.lt", "afraid-hornets-send.loca.lt", "limelight-tipoff-primer.ngrok-free.dev"],
};

export default nextConfig;

initOpenNextCloudflareForDev();
