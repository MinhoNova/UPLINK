/// <reference types="@cloudflare/workers-types" />

interface CloudflareEnv {
  DB: D1Database;
  KV_BINDING: KVNamespace;
  AUTH_TRUST_HOST?: string;
  NEXTAUTH_URL?: string;
  NEXTAUTH_SECRET?: string;
  DISCORD_CLIENT_ID?: string;
  DISCORD_CLIENT_SECRET?: string;
  DISCORD_BOT_TOKEN?: string;
  DISCORD_GUILD_ID?: string;
  NEXT_PUBLIC_DISCORD_INVITE_URL?: string;
  NEXT_PUBLIC_LIVEKIT_URL?: string;
  LIVEKIT_API_KEY?: string;
  LIVEKIT_API_SECRET?: string;
}
