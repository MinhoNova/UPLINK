import {
  DISCORD_AUTO_ROLE_NAME,
  DISCORD_OWNER_USER_ID,
  DISCORD_ROLE,
} from "@/lib/discordConstants";

const API = "https://discord.com/api/v10";

type DiscordFetchResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string };

async function discordBotFetch<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<T | null> {
  const result = await discordBotFetchDetailed<T>(path, options);
  return result.ok ? result.data : null;
}

async function discordBotFetchDetailed<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<DiscordFetchResult<T>> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return { ok: false, status: 503, error: "DISCORD_BOT_TOKEN not configured" };
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const error = await res.text();
    console.error(`Discord guild API ${res.status}: ${error}`);
    return { ok: false, status: res.status, error };
  }
  if (res.status === 204) return { ok: true, data: {} as T };
  return { ok: true, data: (await res.json()) as T };
}

function resolveGuildId(): string | null {
  return process.env.DISCORD_GUILD_ID?.trim() || null;
}

function hexColor(hex: string): number {
  return parseInt(hex.replace("#", ""), 16);
}

const ROLE_SPECS = [
  { key: "owner", name: DISCORD_ROLE.owner, color: "#ffd700", permissions: "8" },
  {
    key: "admin",
    name: DISCORD_ROLE.admin,
    color: "#ff007f",
    permissions: String(32 + 268435456 + 16 + 2 + 4 + 1099511627776),
  },
  {
    key: "moderator",
    name: DISCORD_ROLE.moderator,
    color: "#00ffff",
    permissions: String(2 + 1099511627776 + 8192),
  },
  { key: "missionLead", name: DISCORD_ROLE.missionLead, color: "#8a2be2", permissions: "8192" },
  { key: "booster", name: DISCORD_ROLE.booster, color: "#ff4500", permissions: "0" },
  { key: "secretClub", name: DISCORD_ROLE.secretClub, color: "#c084fc", permissions: "0" },
  { key: "community", name: DISCORD_ROLE.community, color: "#38bdf8", permissions: "0" },
  { key: "verified", name: DISCORD_ROLE.verified, color: "#00ffff", permissions: "0" },
] as const;

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

/** Creates/updates all UPLINK Discord roles and assigns Owner. Admin-only via API. */
export async function setupDiscordGuildRoles(): Promise<{
  ok: boolean;
  guildId?: string;
  roles: string[];
  ownerAssigned: boolean;
  inviteUrl?: string;
  error?: string;
}> {
  const guildId = resolveGuildId();
  if (!guildId) return { ok: false, roles: [], ownerAssigned: false, error: "DISCORD_GUILD_ID missing" };

  const existingRes = await discordBotFetchDetailed<{ id: string; name: string }[]>(
    `/guilds/${guildId}/roles`
  );
  if (!existingRes.ok) {
    return {
      ok: false,
      roles: [],
      ownerAssigned: false,
      error: `Failed to load roles (${existingRes.status}): ${existingRes.error}`,
    };
  }

  const roleIds: Record<string, string> = {};
  const createdNames: string[] = [];

  for (const spec of ROLE_SPECS) {
    const found = existingRes.data.find((r) => r.name === spec.name);
    if (found) {
      const patch = await discordBotFetchDetailed(`/guilds/${guildId}/roles/${found.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: spec.name,
          color: hexColor(spec.color),
          permissions: spec.permissions,
        }),
      });
      if (!patch.ok) {
        return {
          ok: false,
          roles: createdNames,
          ownerAssigned: false,
          error: `Failed to update ${spec.name}: ${patch.error}`,
        };
      }
      roleIds[spec.key] = found.id;
      createdNames.push(`updated:${spec.name}`);
    } else {
      const created = await discordBotFetchDetailed<{ id: string }>(`/guilds/${guildId}/roles`, {
        method: "POST",
        body: JSON.stringify({
          name: spec.name,
          color: hexColor(spec.color),
          permissions: spec.permissions,
        }),
      });
      if (!created.ok) {
        return {
          ok: false,
          roles: createdNames,
          ownerAssigned: false,
          error: `Failed to create ${spec.name}: ${created.error}`,
        };
      }
      roleIds[spec.key] = created.data.id;
      createdNames.push(`created:${spec.name}`);
    }
  }

  let ownerAssigned = false;
  const ownerRoleId = roleIds.owner;
  if (ownerRoleId) {
    const assign = await discordBotFetchDetailed(
      `/guilds/${guildId}/members/${DISCORD_OWNER_USER_ID}/roles/${ownerRoleId}`,
      { method: "PUT" }
    );
    ownerAssigned = assign.ok;
  }

  const channelsRes = await discordBotFetchDetailed<{ id: string; name: string; type: number }[]>(
    `/guilds/${guildId}/channels`
  );
  let inviteUrl: string | undefined;
  if (channelsRes.ok) {
    const text =
      channelsRes.data.find((c) => c.name === "welcome-briefing" && c.type === 0) ||
      channelsRes.data.find((c) => c.type === 0);
    if (text) {
      const invite = await discordBotFetchDetailed<{ code: string }>(
        `/channels/${text.id}/invites`,
        {
          method: "POST",
          body: JSON.stringify({ max_age: 0, max_uses: 0 }),
        }
      );
      if (invite.ok) inviteUrl = `https://discord.gg/${invite.data.code}`;
    }
  }

  return { ok: true, guildId, roles: createdNames, ownerAssigned, inviteUrl };
}
