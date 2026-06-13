import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "sharp"],
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: ["boozy-friend-trapped.ngrok-free.dev", "starship-flashcard-garment.ngrok-free.dev", "grape-retention-fraying.ngrok-free.dev", "twelve-colts-know.loca.lt", "nice-poems-beam.loca.lt", "grumpy-parts-punch.loca.lt", "afraid-hornets-send.loca.lt", "limelight-tipoff-primer.ngrok-free.dev"],
};

export default nextConfig;

initOpenNextCloudflareForDev();
