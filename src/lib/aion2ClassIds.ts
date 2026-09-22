/** Aion 2 (plaync) → site class mapping + shared client-safe types — pure module. */

export const PORTRAIT_HOST = "profileimg.plaync.com";

export const AION2_GAME_CLASS_BY_KO: Record<string, string> = {
  검성: "Gladiator",
  수호성: "Templar",
  살성: "Assassin",
  궁성: "Ranger",
  마도성: "Sorcerer",
  정령성: "Spiritmaster",
  치유성: "Cleric",
  호법성: "Chanter",
};

/** zh-TW (tw.ncsoft.com) class labels → site class. */
export const AION2_GAME_CLASS_BY_ZH: Record<string, string> = {
  劍星: "Gladiator",
  守護星: "Templar",
  殺星: "Assassin",
  弓星: "Ranger",
  魔道星: "Sorcerer",
  精靈星: "Spiritmaster",
  治癒星: "Cleric",
  護法星: "Chanter",
  拳星: "",
  執行官: "",
};

export const AION2_GAME_KO_BY_CLASS: Record<string, string> = {
  Gladiator: "검성",
  Templar: "수호성",
  Assassin: "살성",
  Ranger: "궁성",
  Sorcerer: "마도성",
  Spiritmaster: "정령성",
  Cleric: "치유성",
  Chanter: "호법성",
};

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
 * Map a raw game class label (Korean "마도성", Chinese "魔道星" or English
 * "Elementalist"/"Fighter") to a supported site class key. Unsupported → "".
 */
export function mapGameClassToSite(raw: string | null | undefined): string {
  const name = String(raw || "").trim();
  if (!name) return "";
  if (AION2_GAME_CLASS_BY_KO[name]) return AION2_GAME_CLASS_BY_KO[name];
  if (AION2_GAME_CLASS_BY_ZH[name] !== undefined) return AION2_GAME_CLASS_BY_ZH[name];
  return ENGLISH_TO_SITE[name.toLowerCase()] ?? "";
}

export function isGameClassSupported(siteClass: string): boolean {
  return (AION2_SITE_CLASSES as readonly string[]).includes(siteClass);
}

export type GameServer = { raceId: number; serverId: number; serverName: string };

export type GameCharacterSearchHit = {
  characterId: string;
  name: string;
  race: number;
  pcId: number;
  level: number;
  serverId: number;
  serverName: string;
  profileImageUrl: string | null;
};

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
  region: "tw" | "kr";
  verifiedAt: number;
};

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
  return `/api/aion2/portrait?u=${encodeURIComponent(fullUrl)}`;
}