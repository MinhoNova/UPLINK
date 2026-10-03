/** Discord server role display names (must match scripts/discord-sync-roles.cjs). */
export const DISCORD_ROLE = {
  owner: "Owner",
  admin: "Administrators",
  moderator: "Moderators",
  support: "Support",
  verified: "Verified",
  booster: "Premium",
  missionLead: "Community Management",
  secretClub: "VIP",
  community: "Member",
} as const;

/** Auto-assigned when a member joins the server (via autorole bot). */
export const DISCORD_AUTO_ROLE_NAME = DISCORD_ROLE.verified;

export const DISCORD_OWNER_USER_ID = "1497295886223544471";

/**
 * Self-service entry roles: members pick these from the Discord picker to unlock
 * channels (region helpers + ARABIC CHAT). Names must match the roles in the guild —
 * override per role via env vars if they differ.
 */
export type EntryRoleKey = "naEast" | "naWest" | "eu" | "arabicChat";

export type DiscordEntryRoleSpec = {
  key: EntryRoleKey;
  name: string;
  customId: string;
  buttonLabel: string;
  emoji: string;
  description: string;
};

/**
 * Resolved per call, not at module load.
 *
 * These were `process.env.DISCORD_ENTRY_ROLE_*` reads evaluated while the
 * module was being initialised. On Cloudflare the secrets arrive as Worker
 * bindings and only land in `process.env` once `syncAuthEnvFromCloudflare()`
 * has run, which is strictly after import — so the overrides were silently
 * ignored no matter what an operator set, and the code fell through to the
 * hardcoded defaults. Reading lazily is what makes the env vars real.
 */
export function getDiscordEntryRoles(): ReadonlyArray<DiscordEntryRoleSpec> {
  return [
    {
      key: "naEast",
      name: process.env.DISCORD_ENTRY_ROLE_NA_EAST?.trim() || "NA East",
      customId: "role_naEast",
      buttonLabel: "NA East",
      emoji: "🌎",
      description: "NA East channels",
    },
    {
      key: "naWest",
      name: process.env.DISCORD_ENTRY_ROLE_NA_WEST?.trim() || "NA West",
      customId: "role_naWest",
      buttonLabel: "NA West",
      emoji: "🌍",
      description: "NA West channels",
    },
    {
      key: "eu",
      name: process.env.DISCORD_ENTRY_ROLE_EU?.trim() || "EU",
      customId: "role_eu",
      buttonLabel: "EU",
      emoji: "🇪🇺",
      description: "Europe channels",
    },
    {
      key: "arabicChat",
      name: process.env.DISCORD_ENTRY_ROLE_ARABIC_CHAT?.trim() || "ARABIC CHAT",
      customId: "role_arabicChat",
      buttonLabel: "ARABIC CHAT",
      emoji: "🕌",
      description: "Arabic chat channel",
    },
  ];
}

/** @deprecated Use {@link getDiscordEntryRoles} — this snapshots env at import time. */
export const DISCORD_ENTRY_ROLES: ReadonlyArray<DiscordEntryRoleSpec> = getDiscordEntryRoles();

/** Max entry-channel roles a member can hold at once. */
export const DISCORD_MAX_ENTRY_ROLES = 2;

/** Channel id (or name) where the picker message is posted. */
export const DISCORD_ENTRY_PICKER_CHANNEL =
  process.env.DISCORD_ENTRY_PICKER_CHANNEL_ID?.trim() || "welcome-briefing";
export const DISCORD_ENTRY_PICKER_FOOTER = "UPLINK Channel Picker";

/**
 * Per-category offer channel ids. Naming was the only mechanism before, and it
 * breaks the moment an admin renames a channel: the lookup is a fuzzy substring
 * match over `GET /guilds/:id/channels`, so `leveling-offers` also matches
 * `old-leveling-offers-archived` and there is no error when it misses — the
 * embed just silently stops appearing. An explicit id wins whenever it is set.
 */
export const DISCORD_OFFER_CHANNEL_ENV: Record<string, string> = {
  leveling: "DISCORD_CHANNEL_LEVELING",
  dungeons: "DISCORD_CHANNEL_DUNGEONS",
  raids: "DISCORD_CHANNEL_RAIDS",
  professions: "DISCORD_CHANNEL_PROFESSIONS",
};

export function configuredOfferChannelId(category: string): string | null {
  const key = DISCORD_OFFER_CHANNEL_ENV[category];
  const fromKey = key ? process.env[key]?.trim() : "";
  if (fromKey) return fromKey;
  return process.env.DISCORD_CHANNEL_DEFAULT?.trim() || null;
}

/** KV key tracking members who already got the picker DM, and per-run cap. */
export const DISCORD_KV_ENTRY_DM_SENT = "discordEntryDmSent";
export const DISCORD_ENTRY_DM_MAX_PER_RUN = 15;

export function getDiscordInviteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_DISCORD_INVITE_URL?.trim() ||
    "https://discord.gg/aion2lfg"
  );
}
