import type { KVNamespace } from "@cloudflare/workers-types";

export async function getKVBinding(): Promise<KVNamespace | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    let env: { KV_BINDING?: KVNamespace };
    try {
      ({ env } = getCloudflareContext());
    } catch {
      ({ env } = await getCloudflareContext({ async: true }));
    }
    return env.KV_BINDING ?? null;
  } catch {
    return null;
  }
}
