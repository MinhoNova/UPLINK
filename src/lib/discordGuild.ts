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

function resolveGuildId(): string | null {
  return process.env.DISCORD_GUILD_ID?.trim() || null;
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
  const guildId = resolveGuildId();
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

/**
 * Scans recent guild members (up to 1000) and grants the auto-role to anyone missing it.
 * Called by the Cloudflare Cron Trigger every minute.
 * Returns { checked, granted } counts.
 */
export async function syncGuildAutoRoles(): Promise<{ checked: number; granted: number }> {
  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = resolveGuildId();
  if (!token || !guildId) return { checked: 0, granted: 0 };

  const roleId = await findRoleId(guildId, DISCORD_AUTO_ROLE_NAME);
  if (!roleId) {
    console.warn(`[autorole] Role "${DISCORD_AUTO_ROLE_NAME}" not found — run discord:roles script first.`);
    return { checked: 0, granted: 0 };
  }

  // Fetch up to 1000 most recent members (Discord max per request)
  const members: { user: { id: string }; roles: string[] }[] | null =
    await discordBotFetch(`/guilds/${guildId}/members?limit=1000`);
  if (!members) return { checked: 0, granted: 0 };

  let granted = 0;
  for (const member of members) {
    if (!member.user?.id) continue;
    if (member.roles.includes(roleId)) continue;

    const ok = await discordBotFetch(
      `/guilds/${guildId}/members/${member.user.id}/roles/${roleId}`,
      { method: "PUT" }
    );
    if (ok !== null) {
      granted++;
      console.log(`[autorole] Granted ${DISCORD_AUTO_ROLE_NAME} → ${member.user.id}`);
    }
  }

  return { checked: members.length, granted };
}
