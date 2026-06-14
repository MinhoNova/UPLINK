import { AuthHandler } from "@next-auth/core";
import type { AuthAction } from "next-auth/core/types";
import { parse as parseCookie } from "cookie";
import type { NextRequest } from "next/server";
import { getAuthOptions } from "@/lib/auth";
import { syncAuthEnvFromCloudflare } from "@/lib/authEnv";
import { authResponseToFetch, readAuthRequestBody } from "@/lib/nextAuthRouteUtils";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ nextauth: string[] }> };

/** Prefer Cookie header — next/headers cookies() is unreliable on Cloudflare Workers during OAuth callback. */
async function readRequestCookies(req: NextRequest): Promise<Record<string, string>> {
  const fromHeader = parseCookie(req.headers.get("cookie") ?? "");

  try {
    const { cookies: cookiesFn } = await import("next/headers");
    const fromNext = Object.fromEntries(
      (await cookiesFn()).getAll().map((c) => [c.name, c.value])
    );
    return { ...fromNext, ...fromHeader };
  } catch {
    return fromHeader;
  }
}

async function handler(req: NextRequest, context: RouteContext) {
  await syncAuthEnvFromCloudflare();

  const nextauth = (await context.params)?.nextauth;
  const query = Object.fromEntries(req.nextUrl.searchParams);
  const cookies = await readRequestCookies(req);
  const body = req.method === "POST" ? await readAuthRequestBody(req) : undefined;

  const internalResponse = await AuthHandler({
    options: getAuthOptions(),
    req: {
      body,
      query,
      cookies,
      headers: Object.fromEntries(req.headers),
      method: req.method,
      action: nextauth?.[0] as AuthAction,
      providerId: nextauth?.[1],
      error: (query.error as string | undefined) ?? nextauth?.[1],
    },
  });

  // next-auth/react signIn() sends json:true and expects { url } — not a 302
  if (body?.json === "true" && internalResponse.redirect) {
    const response = authResponseToFetch({ ...internalResponse, redirect: undefined, status: 200 });
    response.headers.delete("Location");
    response.headers.set("Content-Type", "application/json");
    response.headers.set("Cache-Control", "private, no-cache, no-store");
    return new Response(JSON.stringify({ url: internalResponse.redirect }), {
      status: 200,
      headers: response.headers,
    });
  }

  const response = authResponseToFetch(internalResponse);
  response.headers.set("Cache-Control", "private, no-cache, no-store");
  return response;
}

export { handler as GET, handler as POST };
