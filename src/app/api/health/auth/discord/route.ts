import { syncAuthEnvFromCloudflare } from "@/lib/authEnv";

export async function GET() {
  await syncAuthEnvFromCloudflare();

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return Response.json({ ok: false, reason: "missing_env" });
  }

  try {
    const res = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const data = (await res.json()) as { error?: string; error_description?: string };

    return Response.json({
      ok: res.ok,
      status: res.status,
      error: data.error ?? null,
      errorDescription: data.error_description ?? null,
    });
  } catch {
    return Response.json({ ok: false, reason: "fetch_failed" });
  }
}
