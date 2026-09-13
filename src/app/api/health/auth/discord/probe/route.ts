import { syncAuthEnvFromCloudflare } from "@/lib/authEnv";
import { getAuthEnvStatus } from "@/lib/authEnv";

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (expected && authHeader !== `Bearer ${expected}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await syncAuthEnvFromCloudflare();

  const status = getAuthEnvStatus();
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return Response.json({ ok: false, reason: "missing_env", ...status });
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

    return Response.json({
      ok: res.ok,
      status: res.status,
      error: data.error ?? null,
      errorDescription: data.error_description ?? null,
      ...status,
    });
  } catch (err) {
    return Response.json({ ok: false, reason: "fetch_failed", error: String(err), ...status });
  }
}