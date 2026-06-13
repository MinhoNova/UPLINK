import type { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

const discordClientId = process.env.DISCORD_CLIENT_ID;
const discordClientSecret = process.env.DISCORD_CLIENT_SECRET;

if (!discordClientId || !discordClientSecret) {
  console.warn("DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET is missing in environment variables.");
}

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: discordClientId || "",
      clientSecret: discordClientSecret || "",
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
        token.username = (user as any).username;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).username = token.username;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
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
