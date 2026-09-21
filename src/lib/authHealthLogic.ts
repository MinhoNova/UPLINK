export const RE_ALERT_INTERVAL_MS = 6 * 60 * 60 * 1000;

export function failureHint(
  error: string | null,
  errorDescription: string | null,
  hasAuthSecret: boolean,
  status: number
): string {
  if (!hasAuthSecret) {
    return "NEXTAUTH_SECRET is missing in the Cloudflare Worker env.";
  }
  if (error === "invalid_client") {
    return "DISCORD_CLIENT_SECRET in Cloudflare does not match the Discord Developer Portal app. Discord login fails with OAuthCallback (login loop).";
  }
  if (error) {
    const extra = errorDescription ? ` — ${errorDescription}` : "";
    return `${error} (HTTP ${status})${extra}`;
  }
  return `unexpected failure (HTTP ${status})`;
}

export function needsRealert(prevAlertedAt: number | null, now: number): boolean {
  return !prevAlertedAt || now - prevAlertedAt >= RE_ALERT_INTERVAL_MS;
}