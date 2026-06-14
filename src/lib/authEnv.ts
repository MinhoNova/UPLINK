import { getToken } from "next-auth/jwt";

const AUTH_ENV_KEYS = [
  "DISCORD_CLIENT_ID",
  "DISCORD_CLIENT_SECRET",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "AUTH_TRUST_HOST",
] as const;

export type AppSession = {
  user: {
    id: string;
    username: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  expires?: string;
};

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

async function buildReqLike(req?: Request) {
  const { parse: parseCookieFn } = await import("cookie");

  if (req) {
    const cookieHeader = req.headers.get("cookie") ?? "";
    return {
      cookies: parseCookieFn(cookieHeader),
      headers: Object.fromEntries(req.headers.entries()),
    };
  }

  try {
    const { cookies: cookiesFn, headers: headersFn } = await import("next/headers");
    const h = await headersFn();
    const headers = Object.fromEntries(h.entries());
    let cookies = Object.fromEntries((await cookiesFn()).getAll().map((c) => [c.name, c.value]));
    if (Object.keys(cookies).length === 0 && typeof headers.cookie === "string") {
      cookies = parseCookieFn(headers.cookie);
    }
    return { cookies, headers };
  } catch {
    return { cookies: {}, headers: {} };
  }
}

/** Read session JWT from cookies — reliable on Cloudflare Workers (unlike getServerSession). */
export async function getAppSession(req?: Request): Promise<AppSession | null> {
  await syncAuthEnvFromCloudflare();

  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!secret) return null;

  const reqLike = await buildReqLike(req);
  const token = await getToken({ req: reqLike as Parameters<typeof getToken>[0]["req"], secret });
  if (!token) return null;

  const id = String(token.id ?? token.sub ?? "");
  if (!id) return null;

  const username = String(token.username ?? token.name ?? id);

  return {
    user: {
      id,
      username,
      name: (token.name as string | undefined) ?? null,
      email: (token.email as string | undefined) ?? null,
      image: (token.picture as string | undefined) ?? null,
    },
    expires: token.exp ? new Date(Number(token.exp) * 1000).toISOString() : undefined,
  };
}

/** @deprecated Use getAppSession — kept for next-auth adapter compatibility. */
export async function getServerSessionCompat(req?: Request) {
  const session = await getAppSession(req);
  if (!session) return null;
  return session;
}
