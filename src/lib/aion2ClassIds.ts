/** Aion 2 Global → site class mapping + shared client-safe types — pure module. */

export const PORTRAIT_HOST = "profileimg.plaync.com";

/** The only shard we support. `aion2.plaync.com` now serves the global release. */
export const AION2_GLOBAL_BASE = "https://aion2.plaync.com";

/**
 * The default shard code for the global character API.
 *
 * `/api/character/*` on `aion2.plaync.com` redirects to a 404 HTML page for most
 * values of `region` — including omitting it and including the old `kr`/`tw`.
 * It answers 200 with a character only for a live global shard code, so this is
 * load-bearing on every character call, not a display detail.
 */
export const AION2_GAME_REGION = "nae";

/** The region key stored on a verified character. */
export type Aion2Region = "global" | "na" | "eu";

/**
 * The shard code the character API requires for a given site region.
 *
 * `aion2.plaync.com` serves the global release from more than one shard code,
 * and the API is strict about it: for the *same* character it returns a fully
 * populated profile under `eu` and a 200 with an entirely empty `profile` under
 * `nae` (and the reverse for NA characters). It never 404s the mismatch, so
 * asking with the wrong code looks exactly like a character that does not
 * exist — which is what made every EU player unable to link.
 *
 * The retired `kr`/`tw`/`jp`/`cn` shards have no code here at all: they cannot
 * be verified against, by design.
 */
export function aion2GameRegionFor(region: Aion2Region | string | null | undefined): string {
  const key = String(region || "").trim().toLowerCase();
  if (key === "eu" || key === "europe") return "eu";
  return AION2_GAME_REGION;
}

/** The site region for a shard code, used when a stored row predates the region. */
export function aion2RegionFromGameRegion(region: string | null | undefined): Aion2Region {
  const key = String(region || "").trim().toLowerCase();
  if (key === "eu" || key === "europe") return "eu";
  if (key === "na" || key === "nae" || key === "global" || key === "") return "na";
  return "global";
}

/**
 * The shard codes and spellings that belong to the live global release.
 *
 * Anything not in here is a retired shard (KR/TW/JP/CN) or a forged write, and
 * must never reach the roster. `eu` is in here on purpose: the global release
 * runs on both `nae` and `eu`, and treating EU as foreign meant a character that
 * verified perfectly was deleted again by the very next save.
 */
const SUPPORTED_GLOBAL_REGIONS = new Set([
  "global",
  "na",
  "nae",
  "eu",
  "europe",
  "wholesome",
  "wholesome server",
]);

/**
 * Whether a stored `region` value names a live global-release shard.
 *
 * An empty value means a pre-region site row that was never shard-scoped; it is
 * kept, as it always has been.
 */
export function isSupportedGlobalRegion(region: string | null | undefined): boolean {
  const key = String(region || "").trim().toLowerCase();
  return !key || SUPPORTED_GLOBAL_REGIONS.has(key);
}

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

/** The official character page URL, carrying the shard region the API needs. */
export function aion2CharacterPageUrl(
  serverId: number | string,
  characterId: string,
  region: Aion2Region | string | null | undefined = AION2_GAME_REGION
): string {
  // The `/en-us` locale segment is required. Verified against the live site:
  //   /en-us/characters/1101/<id>?region=nae -> 200, ~33 KB character page
  //   /characters/1101/<id>?region=nae      -> 200, ~2 KB "page not found"
  // Both answer 200, so the broken form looked like it worked. Every "Full
  // Profile" button on the site was opening that error page.
  //
  // The region has to be the character's own shard, because this URL is also what
  // `/character?u=` re-reads to fetch the live data — pinning it to `nae` gave
  // every EU character an empty profile on its own profile page.
  return `${AION2_GLOBAL_BASE}/en-us/characters/${serverId}/${encodeURIComponent(
    characterId
  )}?region=${aion2GameRegionFor(region)}`;
}

/** The character info endpoint. `region` is required — see AION2_GAME_REGION. */
export function aion2CharacterInfoUrl(
  characterId: string,
  serverId: number,
  region: Aion2Region | string | null | undefined = AION2_GAME_REGION
): string {
  return `${AION2_GLOBAL_BASE}/api/character/info?lang=en&characterId=${encodeURIComponent(
    characterId
  )}&serverId=${serverId}&region=${aion2GameRegionFor(region)}`;
}

/** The equipment/skill endpoint. Same region requirement as the info call. */
export function aion2CharacterEquipmentUrl(
  characterId: string,
  serverId: number,
  region: Aion2Region | string | null | undefined = AION2_GAME_REGION
): string {
  return `${AION2_GLOBAL_BASE}/api/character/equipment?lang=en&characterId=${encodeURIComponent(
    characterId
  )}&serverId=${serverId}&region=${aion2GameRegionFor(region)}`;
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

/**
 * The exact inverse of `portraitProxyPath`: unwrap a stored proxy path back to
 * the raw plaync URL.
 *
 * Two callers need this and they must not disagree — the portrait component
 * (which loads the raw URL directly, because our edge is bot-filtered by the
 * origin) and the refresh button (which pre-warms the browser cache so the image
 * is already decoded by the time fresh data lands). Reading the `u` param by
 * hand is fragile: `encodeURIComponent` leaves no delimiter that `URLSearchParams`
 * would misread, but the trailing `&v=2` has to be dropped either way.
 *
 * Pure and browser-safe — no `window`, unlike the copy this replaces.
 */
export function rawPortraitUrlOf(src: string | null | undefined): string {
  const s = String(src || "");
  if (!s.startsWith("/api/aion2/portrait?u=")) return s;
  const rest = s.slice("/api/aion2/portrait?u=".length);
  const amp = rest.indexOf("&");
  const encoded = amp === -1 ? rest : rest.slice(0, amp);
  try {
    return decodeURIComponent(encoded);
  } catch {
    return "";
  }
}