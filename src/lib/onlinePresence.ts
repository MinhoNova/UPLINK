/**
 * How the "Online now" list is ordered and what each row shows.
 *
 * Kept out of the panel so the ordering can be tested without rendering, and so
 * the Discord-style rule lives in one place: highest rank first, then most
 * recently seen, then alphabetical. The first key is the one players asked for
 * — the person with the better rank is at the top of the list regardless of who
 * logged in most recently.
 */
import { getUserRanks, RANK_ORDER, type RankTier } from "@/lib/ranks";

export interface OnlineRow {
  user: any;
  rank: RankTier;
  rankIndex: number;
  rankColor: string;
  rankImage: string;
  /** In-game nameplate, when the player linked a character. */
  characterName: string;
  serverName: string;
  className: string;
  characterLevel: number;
}

function rankIndex(tier: RankTier): number {
  const i = RANK_ORDER.indexOf(tier);
  return i === -1 ? 0 : i;
}

function firstCharacter(user: any): any {
  const list = user?.characters;
  if (!Array.isArray(list) || list.length === 0) return null;
  // `/api/data` already sorts a player's characters by combat power; take the
  // first as the nameplate and fall back to whatever is there.
  return list[0] ?? null;
}

function text(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/** Build the display row for one online player. */
export function buildOnlineRow(user: any): OnlineRow {
  const stats = user?.stats || {};
  const ranks = getUserRanks(
    Number(stats.total) || 0,
    Number(stats.postCount) || 0,
    user?.rankOverride ?? null
  );
  const overall = ranks.overall;
  const ch = firstCharacter(user);

  return {
    user,
    rank: overall.tier,
    rankIndex: rankIndex(overall.tier),
    rankColor: overall.color,
    rankImage: overall.image,
    characterName: text(ch?.name) || text(user?.gameCharacterName) || "",
    serverName: text(ch?.serverName) || text(user?.serverName) || "",
    className:
      text(ch?.gameClassLabel) ||
      text(ch?.siteClass) ||
      text(ch?.aionClass) ||
      text(user?.aionClass) ||
      "",
    characterLevel: Number(ch?.level) || 0,
  };
}

/**
 * Highest rank first. A `rankOverride` an admin granted wins over the derived
 * tier, because that is what the badge everywhere else shows too — two places
 * disagreeing about someone's rank is worse than either being wrong.
 */
export function sortOnlineRows(rows: OnlineRow[], now = Date.now()): OnlineRow[] {
  return [...rows].sort((a, b) => {
    if (b.rankIndex !== a.rankIndex) return b.rankIndex - a.rankIndex;
    const aSeen = Number(a.user?.lastSeenAt) || 0;
    const bSeen = Number(b.user?.lastSeenAt) || 0;
    if (bSeen !== aSeen) return bSeen - aSeen;
    const an = text(a.user?.displayName) || text(a.user?.name) || text(a.user?.username);
    const bn = text(b.user?.displayName) || text(b.user?.name) || text(b.user?.username);
    return an.localeCompare(bn);
  });
}
