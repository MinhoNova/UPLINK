import type { ResponseInternal } from "next-auth/core";
import type { Cookie } from "next-auth/core/lib/cookie";
import { serialize } from "cookie";

export async function readAuthRequestBody(
  req: Request
): Promise<Record<string, unknown> | undefined> {
  if (!("body" in req) || !req.body || req.method !== "POST") return;

  const contentType = req.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return await req.json();
  }
  if (contentType?.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(await req.text());
    return Object.fromEntries(params);
  }
}

export function authResponseToFetch(res: ResponseInternal): Response {
  const headers = new Headers(
    res.headers?.reduce<Record<string, string>>((acc, { key, value }) => {
      acc[key] = value;
      return acc;
    }, {}) ?? {}
  );

  res.cookies?.forEach((cookie: Cookie) => {
    const cookieHeader = serialize(cookie.name, cookie.value, cookie.options);
    if (headers.has("Set-Cookie")) headers.append("Set-Cookie", cookieHeader);
    else headers.set("Set-Cookie", cookieHeader);
  });

  let body: BodyInit | null | undefined = res.body as BodyInit | undefined;

  if (headers.get("content-type") === "application/json") {
    body = JSON.stringify(res.body);
  } else if (headers.get("content-type") === "application/x-www-form-urlencoded") {
    body = new URLSearchParams(res.body as Record<string, string>).toString();
  }

  const status = res.redirect ? 302 : (res.status ?? 200);
  const response = new Response(body, { headers, status });

  if (res.redirect) response.headers.set("Location", res.redirect);

  return response;
}
