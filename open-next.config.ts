import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const base = defineCloudflareConfig({});

export default {
  ...base,
  buildCommand: "next build --webpack",
};
