/** Aion 2 Global → site class mapping + shared client-safe types — pure module. */

export const PORTRAIT_HOST = "profileimg.plaync.com";

/** The only shard we support. `aion2.plaync.com` now serves the global release. */
export const AION2_GLOBAL_BASE = "https://aion2.plaync.com";

/**
 * The shard code the global character API requires.
 *
 * `/api/character/*` on `aion2.plaync.com` redirects to a 404 HTML page for
 * every value of `region` except `nae` — including omitting it and including
 * the old `kr`/`tw`. It answers 200 with a character only for the global code,
 * so this is load-bearing on every character call, not a display detail.
 */
export const AION2_GAME_REGION = "nae";

/** The region key stored on a verified character. */
export type Aion2Region = "global" | "na" | "eu";

export const AION2_REGION_LABEL = "GLOBAL";

export const AION2_SITE_CLASSES = [
  "Templar",
  "Gladiator",
  "Assassin",
  "Ranger",
  "Sorcerer",
  "Spiritmaster",
  "Cleric",
  "Chanter",
] as const;

/**
 * The game labels for the classes above, as the global API spells them. Kept as
 * the canonical list so the mapping table and the test that round-trips it
 * cannot drift apart — `Elementalist` is the site's older name for
 * `Spiritmaster` and only appears as an accepted input, not as a game label.
 */
export const AION2_GAME_CLASSES = [
  "Templar",
  "Gladiator",
  "Assassin",
  "Ranger",
  "Sorcerer",
  "Spiritmaster",
  "Cleric",
  "Chanter",
] as const;

const ENGLISH_TO_SITE: Record<string, string> = {
  gladiator: "Gladiator",
  templar: "Templar",
  assassin: "Assassin",
  ranger: "Ranger",
  sorcerer: "Sorcerer",
  elementalist: "Spiritmaster",
  spiritmaster: "Spiritmaster",
  cleric: "Cleric",
  chanter: "Chanter",
  fighter: "",
};

/**
 * Map a raw game class label to a supported site class key. Unsupported → "".
 *
 * The global API is queried with `lang=en`, so labels arrive in English
 * ("Templar", "Elementalist", "Fighter"). The Korean and zh-TW label tables the
 * KR/TW shards needed are gone with those shards.
 */
export function mapGameClassToSite(raw: string | null | undefined): string {
  const name = String(raw || "").trim();
  if (!name) return "";
  return ENGLISH_TO_SITE[name.toLowerCase()] ?? "";
}

export function isGameClassSupported(siteClass: string): boolean {
  return (AION2_SITE_CLASSES as readonly string[]).includes(siteClass);
}

export type VerifiedGameCharacter = {
  characterId: string;
  name: string;
  level: number;
  siteClass: string;
  gameClassLabel: string;
  combatPower: number;
  itemLevel: number;
  raceId: number;
  raceName: string;
  serverId: number;
  serverName: string;
  genderName: string;
  portraitUrl: string | null;
  region: Aion2Region;
  verifiedAt: number;
};

/** The official character page URL, carrying the global region the API needs. */
export function aion2CharacterPageUrl(
  serverId: number | string,
  characterId: string
): string {
  // The `/en-us` locale segment is required. Verified against the live site:
  //   /en-us/characters/1101/<id>?region=nae -> 200, ~33 KB character page
  //   /characters/1101/<id>?region=nae      -> 200, ~2 KB "page not found"
  // Both answer 200, so the broken form looked like it worked. Every "Full
  // Profile" button on the site was opening that error page.
  return `${AION2_GLOBAL_BASE}/en-us/characters/${serverId}/${encodeURIComponent(
    characterId
  )}?region=${AION2_GAME_REGION}`;
}

/** The character info endpoint. `region` is required — see AION2_GAME_REGION. */
export function aion2CharacterInfoUrl(characterId: string, serverId: number): string {
  return `${AION2_GLOBAL_BASE}/api/character/info?lang=en&characterId=${encodeURIComponent(
    characterId
  )}&serverId=${serverId}&region=${AION2_GAME_REGION}`;
}

/** The equipment/skill endpoint. Same region requirement as the info call. */
export function aion2CharacterEquipmentUrl(characterId: string, serverId: number): string {
  return `${AION2_GLOBAL_BASE}/api/character/equipment?lang=en&characterId=${encodeURIComponent(
    characterId
  )}&serverId=${serverId}&region=${AION2_GAME_REGION}`;
}

export function isAllowedPortraitUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname === PORTRAIT_HOST && u.pathname.startsWith("/game_profile_images/");
  } catch {
    return false;
  }
}

/** The client-safe proxy URL for a whitelisted portrait (empty when not allowed). */
export function portraitProxyPath(fullUrl: string): string {
  if (!fullUrl || !isAllowedPortraitUrl(fullUrl)) return "";
  return `/api/aion2/portrait?u=${encodeURIComponent(fullUrl)}&v=2`;
}