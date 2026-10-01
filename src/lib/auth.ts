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
    session: {
      strategy: "jwt",
      // A week, sliding.
      //
      // The session is a signed JWT with no server-side record, so nothing can
      // revoke one early — `maxAge` is therefore exactly how long a leaked
      // cookie keeps working, and the next-auth default of 30 days made that a
      // month. A week bounds it, which is the normal range for a site of this
      // kind.
      //
      // `updateAge` is what keeps the shorter window from being felt: a cookie
      // in active use is re-issued daily, so an account that opens the site
      // never has to sign in again. What it does not do is help an attacker —
      // a stolen cookie only renews if it is actually used, so a dormant one
      // still dies on schedule.
      maxAge: 7 * 24 * 60 * 60,
      updateAge: 24 * 60 * 60,
    },
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.username = (user as { username?: string }).username;
          token.id = user.id;
          // Upsert into registeredUsers on every sign-in, keyed by Discord id.
          // A Discord rename mirrors onto the same row — it never creates a
          // second account — and the name/picture chosen on the site are kept.
          try {
            const { syncAndRepairIdentity } = await import("@/lib/identitySync");
            const me = await syncAndRepairIdentity({
              id: String(user.id),
              username: (user as { username?: string }).username || String(user.id),
              name: (user as { name?: string | null }).name || null,
              avatar: (user as { image?: string | null }).image || null,
            });
            if (me.me?.username) token.username = String(me.me.username);
          } catch (error) {
            console.error("[auth] identity sync failed:", error);
          }
          // Roles are resolved from the account, not from anything the cookie
          // carries, so a `userRoles` promotion actually reaches the client.
          // Without this, `session.user.role` was always undefined and every
          // admin check that leaned on it was a dead clause.
          try {
            const { getUserRole } = await import("@/lib/roles");
            token.role = await getUserRole(String(user.id), String(token.username || user.id));
          } catch (error) {
            console.error("[auth] role resolve failed:", error);
          }
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          (session.user as { username?: string }).username = token.username as string;
          (session.user as { id?: string }).id = token.id as string;
          (session.user as { role?: string }).role = token.role as string;
        }
        return session;
      },
    },
    secret: process.env.NEXTAUTH_SECRET,
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
