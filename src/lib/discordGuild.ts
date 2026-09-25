import {
  DISCORD_AUTO_ROLE_NAME,
  DISCORD_ENTRY_DM_MAX_PER_RUN,
  DISCORD_ENTRY_PICKER_CHANNEL,
  DISCORD_ENTRY_PICKER_FOOTER,
  DISCORD_ENTRY_ROLES,
  DISCORD_KV_ENTRY_DM_SENT,
  DISCORD_MAX_ENTRY_ROLES,
  DISCORD_OWNER_USER_ID,
  DISCORD_ROLE,
  type EntryRoleKey,
} from "@/lib/discordConstants";
import { getKV, setKV } from "@/lib/db";

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
  {
    key: "support",
    name: DISCORD_ROLE.support,
    color: "#22d3ee",
    permissions: "8584987863416823",
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

/** Fetch a single guild member's Discord role id list (null if not fetchable). */
async function getMemberRoleIds(
  guildId: string,
  discordUserId: string
): Promise<string[] | null> {
  const member: { roles?: string[] } | null = await discordBotFetch(
    `/guilds/${guildId}/members/${discordUserId}`
  );
  return member?.roles ?? null;
}

/** Find a role id by exact name, falling back to a case/space-insensitive match (emoji-aware). */
async function findEntryRoleId(guildId: string, roleName: string): Promise<string | null> {
  const roles: { id: string; name: string }[] | null = await discordBotFetch(
    `/guilds/${guildId}/roles`
  );
  if (!roles) return null;
  const exact = roles.find((r) => r.name === roleName);
  if (exact) return exact.id;
  const norm = (s: string) =>
    s
      .replace(
        /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{20E3}]/gu,
        ""
      )
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  const wanted = norm(roleName);
  const fallback = roles.find((r) => norm(r.name) === wanted);
  if (fallback) return fallback.id;
  return (
    roles.find((r) => norm(r.name).includes(wanted) || wanted.includes(norm(r.name)))?.id ?? null
  );
}

/** Which entry-channel roles the member currently holds (by spec). */
export async function getMemberEntryRoles(discordUserId: string): Promise<
  { name: string; key: EntryRoleKey }[]
> {
  const guildId = resolveGuildId();
  if (!guildId || !discordUserId) return [];
  const roleIds = await getMemberRoleIds(guildId, discordUserId);
  if (!roleIds) return [];
  const held = new Set<string>();
  for (const spec of DISCORD_ENTRY_ROLES) {
    const roleId = await findEntryRoleId(guildId, spec.name);
    if (roleId && roleIds.includes(roleId)) {
      held.add(spec.key);
    }
  }
  return DISCORD_ENTRY_ROLES.filter((spec) => held.has(spec.key)).map((spec) => ({
    name: spec.name,
    key: spec.key,
  }));
}

/**
 * Toggle an entry-channel role for the member.
 * Removing is always allowed; adding respects DISCORD_MAX_ENTRY_ROLES.
 */
export async function toggleEntryRole(
  discordUserId: string,
  roleSpec: (typeof DISCORD_ENTRY_ROLES)[number]
): Promise<{ ok: boolean; added: boolean; reason?: "max" | "notfound" | "notmember" }> {
  const guildId = resolveGuildId();
  if (!guildId || !discordUserId) return { ok: false, added: false, reason: "notmember" };

  const roleIds = await getMemberRoleIds(guildId, discordUserId);
  if (!roleIds) return { ok: false, added: false, reason: "notmember" };

  const roleId = await findEntryRoleId(guildId, roleSpec.name);
  if (!roleId) return { ok: false, added: false, reason: "notfound" };

  if (roleIds.includes(roleId)) {
    const removed = await discordBotFetch(
      `/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
      { method: "DELETE" }
    );
    return removed !== null
      ? { ok: true, added: false }
      : { ok: false, added: false };
  }

  const currentlyHeld = await getMemberEntryRoles(discordUserId);
  if (currentlyHeld.length >= DISCORD_MAX_ENTRY_ROLES) {
    return { ok: false, added: false, reason: "max" };
  }

  const granted = await discordBotFetch(
    `/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
    { method: "PUT" }
  );
  return granted !== null
    ? { ok: true, added: true }
    : { ok: false, added: false };
}

const entryPickerEmbed = () => ({
  title: "🚪 Pick your channels",
  description: `Welcome, Explorer! Choose the channels you want to unlock. You can hold up to **${DISCORD_MAX_ENTRY_ROLES}** roles — click a button again to remove it.\n\n${DISCORD_ENTRY_ROLES.map(
    (r) => `${r.emoji} **${r.name}** — ${r.description}`
  ).join("\n")}`,
  color: 0x00d9ff,
  footer: { text: DISCORD_ENTRY_PICKER_FOOTER },
});

const entryPickerComponents = () => [
  {
    type: 1,
    components: DISCORD_ENTRY_ROLES.map((r) => ({
      type: 2,
      style: 2,
      label: r.buttonLabel,
      custom_id: r.customId,
      emoji: { name: r.emoji },
    })),
  },
];

/** Post the entry channel-picker message into the guild (skips if already posted recently). */
export async function postEntryPickerMessage(): Promise<{
  ok: boolean;
  channelId?: string;
  alreadyPosted?: boolean;
  messageUrl?: string;
  error?: string;
}> {
  const guildId = resolveGuildId();
  if (!guildId) return { ok: false, error: "DISCORD_GUILD_ID missing" };

  const channelsRes = await discordBotFetchDetailed<{
    id: string;
    name: string;
    type: number;
  }[]>(`/guilds/${guildId}/channels`);
  if (!channelsRes.ok) {
    return { ok: false, error: `Failed to load channels (${channelsRes.status})` };
  }

  const pickerTarget =
    (DISCORD_ENTRY_PICKER_CHANNEL
      ? channelsRes.data.find(
          (c) =>
            c.type === 0 &&
            (c.id === DISCORD_ENTRY_PICKER_CHANNEL ||
              c.name === DISCORD_ENTRY_PICKER_CHANNEL)
        )
      : undefined) ||
    channelsRes.data.find((c) => c.name === "welcome-briefing" && c.type === 0) ||
    channelsRes.data.find((c) => c.type === 0);
  if (!pickerTarget) {
    return { ok: false, error: "No text channel found to post the picker." };
  }

  const recentRes = await discordBotFetchDetailed<
    { embeds?: { footer?: { text?: string } }[] }[]
  >(`/channels/${pickerTarget.id}/messages?limit=10`);
  if (recentRes.ok) {
    const existing = recentRes.data.find(
      (m) => m.embeds?.[0]?.footer?.text === DISCORD_ENTRY_PICKER_FOOTER
    );
    if (existing) {
      return {
        ok: true,
        channelId: pickerTarget.id,
        alreadyPosted: true,
        messageUrl: `https://discord.com/channels/${guildId}/${pickerTarget.id}/#`,
      };
    }
  }

  const post = await discordBotFetchDetailed<{ id: string }>(
    `/channels/${pickerTarget.id}/messages`,
    {
      method: "POST",
      body: JSON.stringify({ embeds: [entryPickerEmbed()], components: entryPickerComponents() }),
    }
  );
  if (!post.ok) {
    return { ok: false, error: `Failed to post picker (${post.status})` };
  }
  return {
    ok: true,
    channelId: pickerTarget.id,
    messageUrl: `https://discord.com/channels/${guildId}/${pickerTarget.id}/${post.data.id}`,
  };
}

async function createBotDMChannel(discordUserId: string): Promise<string | null> {
  const res = await discordBotFetch<{ id: string }>("/users/@me/channels", {
    method: "POST",
    body: JSON.stringify({ recipient_id: discordUserId }),
  });
  return res?.id ?? null;
}

/** DM the entry picker to a member (buttons work in DMs too). */
async function sendEntryPickerDM(discordUserId: string): Promise<boolean> {
  const channelId = await createBotDMChannel(discordUserId);
  if (!channelId) return false;
  const res = await discordBotFetch(`/channels/${channelId}/messages`, {
    method: "POST",
    body: JSON.stringify({
      embeds: [entryPickerEmbed()],
      components: entryPickerComponents(),
    }),
  });
  return !!res;
}

/**
 * DM the entry picker to guild members who don't have it yet (once per member).
 * Called by the Cloudflare Cron Trigger every minute. Uses KV to dedupe.
 */
export async function syncEntryPickerDMs(): Promise<{
  checked: number;
  messaged: number;
  errors: number;
}> {
  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = resolveGuildId();
  if (!token || !guildId) return { checked: 0, messaged: 0, errors: 0 };

  const members = await discordBotFetch<{ user: { id: string }; roles: string[] }[]>(
    `/guilds/${guildId}/members?limit=1000`
  );
  if (!members) return { checked: 0, messaged: 0, errors: 0 };

  const sentRaw = await getKV(DISCORD_KV_ENTRY_DM_SENT);
  const sent = new Set<string>(Array.isArray(sentRaw) ? sentRaw : []);
  const roles = await discordBotFetch<{ id: string; name: string }[]>(
    `/guilds/${guildId}/roles`
  );
  const nameById = new Map((roles ?? []).map((r) => [r.id, r.name]));
  const entryRoleNames = new Set(DISCORD_ENTRY_ROLES.map((r) => r.name));

  let checked = 0;
  let messaged = 0;
  let errors = 0;

  for (const member of members) {
    if (messaged >= DISCORD_ENTRY_DM_MAX_PER_RUN) break;
    const userId = member.user?.id;
    if (!userId || sent.has(userId)) continue;
    sent.add(userId);
    checked++;

    const alreadyHasEntryRole = (member.roles ?? []).some((id) => {
      const name = nameById.get(id);
      return !!name && entryRoleNames.has(name);
    });
    if (alreadyHasEntryRole) continue;

    const ok = await sendEntryPickerDM(userId);
    if (ok) messaged++;
    else errors++;
  }

  await setKV(DISCORD_KV_ENTRY_DM_SENT, Array.from(sent).slice(-2000));
  return { checked, messaged, errors };
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
