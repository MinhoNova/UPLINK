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

async function readSessionRequest(req?: Request) {
  const { parse: parseCookie } = await import("cookie");

  if (req) {
    return {
      cookies: parseCookie(req.headers.get("cookie") ?? ""),
      headers: Object.fromEntries(req.headers.entries()),
    };
  }

  try {
    const { cookies: cookiesFn, headers: headersFn } = await import("next/headers");
    const h = await headersFn();
    const headers = Object.fromEntries(h.entries());
    let cookies = Object.fromEntries((await cookiesFn()).getAll().map((c) => [c.name, c.value]));

    // next/headers cookies() is unreliable on Cloudflare Workers — fall back to raw Cookie header
    if (Object.keys(cookies).length === 0 && typeof headers.cookie === "string") {
      cookies = parseCookie(headers.cookie);
    }

    return { cookies, headers };
  } catch {
    return { cookies: {}, headers: {} };
  }
}

/** Read NextAuth session; pass the route Request on Cloudflare for reliable cookies. */
export async function getAppSession(req?: Request) {
  await syncAuthEnvFromCloudflare();
  const { getServerSession } = await import("next-auth");
  const { authOptions } = await import("@/lib/auth");
  const { cookies, headers } = await readSessionRequest(req);

  if (Object.keys(cookies).length > 0) {
    return getServerSession(
      { headers, cookies } as Parameters<typeof getServerSession>[0],
      { getHeader() {}, setCookie() {}, setHeader() {} } as Parameters<typeof getServerSession>[1],
      authOptions
    );
  }

  return getServerSession(authOptions);
}
