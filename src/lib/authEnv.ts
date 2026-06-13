const AUTH_ENV_KEYS = [
  "DISCORD_CLIENT_ID",
  "DISCORD_CLIENT_SECRET",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "AUTH_TRUST_HOST",
] as const;

/** Copy Worker bindings into process.env before NextAuth runs. */
export async function syncAuthEnvFromCloudflare(): Promise<void> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    let env: Record<string, unknown>;
    try {
      ({ env } = getCloudflareContext());
    } catch {
      ({ env } = await getCloudflareContext({ async: true }));
    }

    for (const key of AUTH_ENV_KEYS) {
      const value = env[key];
      if (typeof value === "string" && value.length > 0) {
        process.env[key] = value;
      }
    }
  } catch {
    // Local dev without Cloudflare context
  }
}

export function getAuthEnvStatus() {
  return {
    hasClientId: Boolean(process.env.DISCORD_CLIENT_ID),
    hasClientSecret: Boolean(process.env.DISCORD_CLIENT_SECRET),
    hasNextAuthSecret: Boolean(process.env.NEXTAUTH_SECRET),
    nextAuthUrl: process.env.NEXTAUTH_URL ?? null,
    authTrustHost: process.env.AUTH_TRUST_HOST ?? null,
  };
}
