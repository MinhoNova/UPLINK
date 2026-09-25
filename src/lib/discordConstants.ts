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

export const DISCORD_ENTRY_ROLES: ReadonlyArray<{
  key: EntryRoleKey;
  name: string;
  customId: string;
  buttonLabel: string;
  emoji: string;
  description: string;
}> = [
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

/** Max entry-channel roles a member can hold at once. */
export const DISCORD_MAX_ENTRY_ROLES = 2;

/** Channel (id or name) where the picker message is posted + footer marker for dedupe. */
export const DISCORD_ENTRY_PICKER_CHANNEL =
  process.env.DISCORD_ENTRY_PICKER_CHANNEL_ID?.trim() || "welcome-briefing";
export const DISCORD_ENTRY_PICKER_FOOTER = "UPLINK Channel Picker";

/** KV key tracking members who already got the picker DM, and per-run cap. */
export const DISCORD_KV_ENTRY_DM_SENT = "discordEntryDmSent";
export const DISCORD_ENTRY_DM_MAX_PER_RUN = 15;

export function getDiscordInviteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_DISCORD_INVITE_URL?.trim() ||
    "https://discord.gg/aion2lfg"
  );
}
