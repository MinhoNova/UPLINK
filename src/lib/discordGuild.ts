import { DISCORD_AUTO_ROLE_NAME } from "@/lib/discordConstants";

const API = "https://discord.com/api/v10";

async function discordBotFetch(path: string, options?: RequestInit) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return null;
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    console.error(`Discord guild API ${res.status}: ${await res.text()}`);
    return null;
  }
  if (res.status === 204) return {};
  return res.json();
}

async function resolveGuildId(): Promise<string | null> {
  const fromEnv = process.env.DISCORD_GUILD_ID?.trim();
  if (fromEnv) return fromEnv;
  const guilds: { id: string }[] | null = await discordBotFetch("/users/@me/guilds");
  return guilds?.[0]?.id ?? null;
}

async function findRoleId(guildId: string, roleName: string): Promise<string | null> {
  const roles: { id: string; name: string }[] | null = await discordBotFetch(
    `/guilds/${guildId}/roles`
  );
  if (!roles) return null;
  const match = roles.find((r) => r.name === roleName);
  return match?.id ?? null;
}

/** Grant a guild role to a Discord user (no-op if already has it or not in guild). */
export async function grantDiscordGuildRole(
  discordUserId: string,
  roleName: string = DISCORD_AUTO_ROLE_NAME
): Promise<boolean> {
  if (!process.env.DISCORD_BOT_TOKEN || !discordUserId) return false;
  const guildId = await resolveGuildId();
  if (!guildId) return false;

  const member: { roles?: string[] } | null = await discordBotFetch(
    `/guilds/${guildId}/members/${discordUserId}`
  );
  if (!member) return false;

  const roleId = await findRoleId(guildId, roleName);
  if (!roleId) return false;
  if (member.roles?.includes(roleId)) return true;

  const result = await discordBotFetch(
    `/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
    { method: "PUT" }
  );
  return result !== null;
}
