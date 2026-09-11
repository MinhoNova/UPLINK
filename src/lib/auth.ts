import type { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

const DISCORD_USER_AGENT = "UPLINK (https://uplink.uplinklfg.workers.dev, 1.0)";

function discordProvider(clientId: string, clientSecret: string) {
  return DiscordProvider({
    clientId,
    clientSecret,
    token: {
      async request({ provider, params }) {
        const res = await fetch("https://discord.com/api/oauth2/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": DISCORD_USER_AGENT,
          },
          body: new URLSearchParams({
            client_id: provider.clientId!,
            client_secret: provider.clientSecret!,
            grant_type: "authorization_code",
            code: params.code as string,
            redirect_uri: provider.callbackUrl,
          }),
        });

        const data = (await res.json()) as {
          error?: string;
          error_description?: string;
          access_token?: string;
        };

        if (!res.ok) {
          if (process.env.AUTH_DEBUG === "true") {
            console.error("[auth] Discord token exchange failed:", data.error, data.error_description);
          }
          throw new Error(data.error_description || data.error || "discord_token_exchange_failed");
        }

        return { tokens: data };
      },
    },
    userinfo: {
      async request({ tokens }) {
        const res = await fetch("https://discord.com/api/users/@me", {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            "User-Agent": DISCORD_USER_AGENT,
          },
        });

        if (!res.ok) {
          if (process.env.AUTH_DEBUG === "true") {
            console.error("[auth] Discord userinfo failed:", res.status);
          }
          throw new Error("discord_userinfo_failed");
        }

        return res.json();
      },
    },
    profile(profile) {
      let imageUrl = `https://cdn.discordapp.com/embed/avatars/${parseInt(profile.discriminator || "0") % 5}.png`;
      if (profile.avatar) {
        const format = profile.avatar.startsWith("a_") ? "gif" : "png";
        imageUrl = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${format}`;
      }
      return {
        id: profile.id,
        name: profile.global_name || profile.username,
        username: profile.username,
        email: profile.email,
        image: imageUrl,
      };
    },
  });
}

export function getAuthOptions(): NextAuthOptions {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn(
      "DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET is missing in environment variables."
    );
  }

  return {
    providers: [discordProvider(clientId || "", clientSecret || "")],
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.username = (user as { username?: string }).username;
          token.id = user.id;
          // Auto-register new users into registeredUsers KV on first login
          try {
            const { getKV, setKV } = await import("@/lib/db");
            const users: any[] = (await getKV("registeredUsers")) || [];
            if (!users.some((u) => String(u.id) === String(user.id))) {
              users.push({
                id: user.id,
                username: (user as { username?: string }).username || user.id,
                name: (user as { name?: string | null }).name || null,
                avatar: (user as { image?: string | null }).image || null,
                lastSeenAt: Date.now(),
                lastKnownIp: null,
                stats: { total: 0, k5: 0, k10: 0, k15: 0, k20: 0 },
                subscription: { tier: "free" },
              });
              await setKV("registeredUsers", users);
            }
          } catch {
            // Silently ignore — registration is best-effort
          }
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          (session.user as { username?: string }).username = token.username as string;
          (session.user as { id?: string }).id = token.id as string;
        }
        return session;
      },
    },
    secret: process.env.NEXTAUTH_SECRET,
    trustHost: true,
    debug: process.env.AUTH_DEBUG === "true",
  };
}

/** Lazy proxy so getServerSession reads env after Cloudflare injects secrets. */
export const authOptions: NextAuthOptions = new Proxy({} as NextAuthOptions, {
  get(_target, prop, receiver) {
    const opts = getAuthOptions();
    const value = Reflect.get(opts as object, prop, receiver);
    return typeof value === "function" ? value.bind(opts) : value;
  },
});
