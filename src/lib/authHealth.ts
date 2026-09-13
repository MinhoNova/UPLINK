import { syncAuthEnvFromCloudflare } from "@/lib/authEnv";
import { getKV, setKV } from "@/lib/db";
import { DISCORD_OWNER_USER_ID } from "@/lib/discordConstants";

const API = "https://discord.com/api/v10";
const KV_KEY = "authHealth";
const CHECK_INTERVAL_MS = 5 * 60 * 1000;
const RE_ALERT_INTERVAL_MS = 6 * 60 * 60 * 1000;

export type AuthHealthRecord = {
  ok: boolean;
  checkedAt: number;
  lastFailureAt: number | null;
  lastError: string | null;
  alertedAt: number | null;
};

async function discordClientCredentialsOk(): Promise<{
  ok: boolean;
  status: number;
  error: string | null;
  errorDescription: string | null;
}> {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return { ok: false, status: 503, error: "DISCORD_CLIENT_ENV_MISSING", errorDescription: null };
  }
  try {
    const res = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: "identify",
      }),
    });
    const data = (await res.json()) as { error?: string; error_description?: string };
    return {
      ok: res.ok,
      status: res.status,
      error: data.error ?? (res.ok ? null : `http_${res.status}`),
      errorDescription: data.error_description ?? null,
    };
  } catch {
    return { ok: false, status: 0, error: "fetch_failed", errorDescription: null };
  }
}

function failureHint(
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

async function sendOwnerDm(text: string): Promise<boolean> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return false;

  const dmRes = await fetch(`${API}/users/@me/channels`, {
    method: "POST",
    headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ recipient_id: DISCORD_OWNER_USER_ID }),
  });
  if (!dmRes.ok) return false;
  const dm = (await dmRes.json()) as { id?: string };
  if (!dm?.id) return false;

  const msg = await fetch(`${API}/channels/${dm.id}/messages`, {
    method: "POST",
    headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ content: text }),
  });
  return msg.ok;
}

const ENV_KEYS = [
  "DISCORD_CLIENT_ID",
  "DISCORD_CLIENT_SECRET",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "AUTH_TRUST_HOST",
  "DISCORD_BOT_TOKEN",
] as const;

function applyEnv(env?: Record<string, unknown>) {
  if (!env) return;
  for (const key of ENV_KEYS) {
    const value = env[key];
    if (typeof value === "string" && value.length > 0) process.env[key] = value;
  }
}

async function readRecord(): Promise<AuthHealthRecord | null> {
  try {
    return ((await getKV(KV_KEY)) as AuthHealthRecord | null) ?? null;
  } catch {
    return null;
  }
}

async function writeRecord(record: AuthHealthRecord) {
  try {
    await setKV(KV_KEY, record);
  } catch (err) {
    console.error("[authHealth] failed to persist status:", err);
  }
}

export async function getAuthHealthStatus(): Promise<AuthHealthRecord | null> {
  return readRecord();
}

export async function runAuthHealthCheck(opts?: {
  force?: boolean;
  env?: Record<string, unknown>;
}): Promise<AuthHealthRecord> {
  applyEnv(opts?.env);
  await syncAuthEnvFromCloudflare();

  const now = Date.now();
  const prev = await readRecord();

  if (!opts?.force && prev && now - prev.checkedAt < CHECK_INTERVAL_MS) return prev;

  const { ok: credOk, status, error, errorDescription } = await discordClientCredentialsOk();
  const hasAuthSecret = Boolean(process.env.NEXTAUTH_SECRET);
  const ok = credOk && hasAuthSecret;

  const record: AuthHealthRecord = {
    ok,
    checkedAt: now,
    lastFailureAt: ok ? prev?.lastFailureAt ?? null : now,
    lastError: ok ? null : failureHint(error, errorDescription, hasAuthSecret, status),
    alertedAt: prev?.alertedAt ?? null,
  };

  if (!ok) {
    const needAlert = !record.alertedAt || now - record.alertedAt >= RE_ALERT_INTERVAL_MS;
    if (needAlert) {
      const sent = await sendOwnerDm(
        [
          "⚠️ UPLINK AUTH ALERT — Discord login is DOWN",
          "",
          `Time: ${new Date(now).toISOString()}`,
          `Reason: ${record.lastError ?? "unknown"}`,
          "",
          "Users will hit a login loop until this is fixed.",
          "Fix: Workers → UPLINK → Settings → Variables and Secrets.",
        ].join("\n")
      );
      if (sent) record.alertedAt = now;
    }
  } else if (prev && prev.ok === false) {
    await sendOwnerDm(
      `✅ UPLINK login RECOVERED (${new Date(now).toISOString()}). Discord auth checks out again.`
    );
    record.alertedAt = null;
  }

  await writeRecord(record);
  return record;
}