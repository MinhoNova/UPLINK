import type { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

function readDiscordEnv() {
  return {
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
  };
}

export function getAuthOptions(): NextAuthOptions {
  const { clientId, clientSecret } = readDiscordEnv();

  if (!clientId || !clientSecret) {
    console.warn(
      "DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET is missing in environment variables."
    );
  }

  return {
    providers: [
      DiscordProvider({
        clientId: clientId || "",
        clientSecret: clientSecret || "",
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
      }),
    ],
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.username = (user as { username?: string }).username;
          token.id = user.id;
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
    trustHost: process.env.AUTH_TRUST_HOST === "true",
    useSecureCookies: process.env.NEXTAUTH_URL?.startsWith("https://") ?? false,
    cookies: {
      sessionToken: {
        name: `next-auth.session-token`,
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: process.env.NEXTAUTH_URL?.startsWith("https://") ?? false,
        },
      },
    },
    debug: process.env.NODE_ENV === "development",
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
