/** Discord server role display names (must match scripts/discord-sync-roles.cjs). */
export const DISCORD_ROLE = {
  owner: "👑 UPLINK Owner",
  admin: "⚡ Admin",
  moderator: "🛡️ Moderator",
  verified: "💠 Verified Operative",
  booster: "🔥 Elite Booster",
  missionLead: "👑 Mission Lead",
  secretClub: "🌟 Secret Club",
  community: "📡 Community",
} as const;

/** Auto-assigned when a member joins the server (via autorole bot). */
export const DISCORD_AUTO_ROLE_NAME = DISCORD_ROLE.verified;

export const DISCORD_OWNER_USER_ID = "1497295886223544471";

export function getDiscordInviteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_DISCORD_INVITE_URL?.trim() ||
    "https://discord.gg/uplinklfg"
  );
}
