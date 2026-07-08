const TOKEN_URL = "https://oauth.battle.net/token";

let cachedToken: { access_token: string; expires_at: number } | null = null;

export async function getBlizzardToken(env?: { BATTLENET_CLIENT_ID?: string; BATTLENET_CLIENT_SECRET?: string }): Promise<string | null> {
  const id = env?.BATTLENET_CLIENT_ID || process.env.BATTLENET_CLIENT_ID;
  const secret = env?.BATTLENET_CLIENT_SECRET || process.env.BATTLENET_CLIENT_SECRET;

  if (!id || !secret) return null;

  if (cachedToken && Date.now() < cachedToken.expires_at) {
    return cachedToken.access_token;
  }

  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=client_credentials&client_id=${encodeURIComponent(id)}&client_secret=${encodeURIComponent(secret)}`,
    });

    if (!res.ok) return null;

    const data = await res.json();
    cachedToken = {
      access_token: data.access_token,
      expires_at: Date.now() + data.expires_in * 1000 - 60000,
    };
    return data.access_token;
  } catch {
    return null;
  }
}
