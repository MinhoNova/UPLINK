import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const productionUrl = "https://uplink.uplinklfg.workers.dev";

const nextConfig: NextConfig = {
  // NextAuth reads NEXTAUTH_URL in the client bundle; without this it defaults to localhost:3000.
  env: {
    NEXTAUTH_URL:
      process.env.NEXTAUTH_URL ??
      (process.env.NODE_ENV === "development" ? "http://localhost:3000" : productionUrl),
  },
  serverExternalPackages: ["better-sqlite3"],
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: ["boozy-friend-trapped.ngrok-free.dev", "starship-flashcard-garment.ngrok-free.dev", "grape-retention-fraying.ngrok-free.dev", "twelve-colts-know.loca.lt", "nice-poems-beam.loca.lt", "grumpy-parts-punch.loca.lt", "afraid-hornets-send.loca.lt", "limelight-tipoff-primer.ngrok-free.dev"],
};

export default nextConfig;

initOpenNextCloudflareForDev();
