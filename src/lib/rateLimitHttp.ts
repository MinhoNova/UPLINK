export type RateLimitResult = { ok: true } | { ok: false; retryAfterMs: number };

export function rateLimitResponse(result: Extract<RateLimitResult, { ok: false }>): Response {
  return new Response(JSON.stringify({ error: "Too many requests", retryAfterMs: result.retryAfterMs }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)),
    },
  });
}