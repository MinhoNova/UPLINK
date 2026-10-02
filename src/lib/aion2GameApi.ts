/**
 * Aion 2 Global (plaync) game-data proxy — server-only.
 * Wraps the public NCSoft global character endpoints + portrait CDN whitelist.
 *
 * Global only. `aion2.plaync.com` now serves the global release exclusively:
 * every `/api/character/*` call needs `region=nae`, and the old KR/TW
 * name-search and server-list endpoints are gone, so a character can only be
 * resolved from its official share link.
 */
import {
  aion2CharacterEquipmentUrl,
  aion2CharacterInfoUrl,
  aion2CharacterPageUrl,
  AION2_GLOBAL_BASE,
  mapGameClassToSite,
  isAllowedPortraitUrl,
  type Aion2Region,
  type VerifiedGameCharacter,
} from "@/lib/aion2ClassIds";

export {
  isAllowedPortraitUrl,
  portraitProxyPath,
  aion2CharacterPageUrl,
  AION2_GLOBAL_BASE,
  AION2_REGION_LABEL,
} from "@/lib/aion2ClassIds";
export type { Aion2Region, VerifiedGameCharacter } from "@/lib/aion2ClassIds";

async function jsonFetch(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { accept: "application/json", "accept-language": "en,ko" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Game API ${res.status}`);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    // The character endpoints answer a 200 HTML error page instead of JSON for
    // anything they cannot serve — a characterId from the retired KR/TW shards,
    // or a region the API does not know. Say so plainly: the 502 default of
    // "could not reach NCSoft" would send the player looking for an outage
    // that does not exist.
    throw new Error(
      "That character is not on the Aion 2 Global servers. If the link came from the Korean or Taiwanese servers, it is no longer supported here."
    );
  }
}

function itemLevelOf(stat: any): number {
  const list: any[] = Array.isArray(stat?.statList) ? stat.statList : [];
  const hit = list.find((s: any) => String(s.type || "").toLowerCase() === "itemlevel");
  return hit ? Number(hit.value) || 0 : 0;
}

/** Keys the plaync character payload has used for the in-game portrait over
 *  time. The endpoint is undocumented and has shipped `profileImage` and
 *  `profileImg` alike, and a character that verified fine but lost its face
 *  because the field was renamed is exactly the "no portraits anywhere" bug. */
const PORTRAIT_KEYS = [
  "profileImage",
  "profileImg",
  "profile_image",
  "profileimg",
  "portraitUrl",
  "portrait",
  "characterImage",
  "imageUrl",
  "image",
  "avatar",
];

/** Find the official portrait anywhere in the character payload: first the
 *  known keys, then a bounded deep sweep for any allowlisted plaync profile
 *  image. Returns "" when the payload genuinely has no portrait. */
function pickPortraitUrl(data: any, profile: any): string {
  for (const key of PORTRAIT_KEYS) {
    const v = String(profile?.[key] || "");
    if (v && isAllowedPortraitUrl(v)) return v;
  }
  const seen = new Set<any>();
  const queue: Array<{ node: any; depth: number }> = [
    { node: data, depth: 0 },
    { node: profile, depth: 0 },
  ];
  let visited = 0;
  while (queue.length && visited < 500) {
    const { node, depth } = queue.shift()!;
    if (!node || typeof node !== "object" || depth > 5 || seen.has(node)) continue;
    seen.add(node);
    visited++;
    for (const value of Object.values(node)) {
      if (typeof value === "string") {
        if (isAllowedPortraitUrl(value)) return value;
      } else if (value && typeof value === "object") {
        queue.push({ node: value, depth: depth + 1 });
      }
    }
  }
  return "";
}

function mapGameCharacterInfo(
  data: any,
  characterId: string,
  serverId: number
): VerifiedGameCharacter | null {
  const p: any = data?.profile;
  if (!p || !p.characterId) return null;

  const gameClassLabel = String(p.className || "");
  const siteClass = mapGameClassToSite(gameClassLabel);
  const profileImage = pickPortraitUrl(data, p);
  return {
    characterId: String(p.characterId || characterId),
    name: String(p.characterName || ""),
    level: Number(p.characterLevel) || 1,
    siteClass,
    gameClassLabel,
    combatPower: Number(p.combatPower) || 0,
    itemLevel: itemLevelOf(data?.stat),
    raceId: Number(p.raceId) || 1,
    raceName: String(p.raceName || ""),
    serverId: Number(p.serverId) || serverId,
    serverName: String(p.serverName || ""),
    genderName: String(p.genderName || ""),
    portraitUrl: profileImage || null,
    region: "global",
    verifiedAt: Date.now(),
  };
}

export async function fetchGameCharacterProfile(
  characterId: string,
  serverId: number
): Promise<VerifiedGameCharacter | null> {
  const data = await jsonFetch(aion2CharacterInfoUrl(characterId, serverId));
  return mapGameCharacterInfo(data, characterId, serverId);
}

type CharacterShareRef = {
  serverId: number;
  characterId: string;
};

/**
 * Parse an official global character page share-link
 * (/characters/{serverId}/{encryptedCharacterId}?region=nae).
 */
export function parseCharacterShareUrl(link: string): CharacterShareRef | null {
  let u: URL;
  try {
    u = new URL(String(link || "").trim());
  } catch {
    return null;
  }
  if (u.hostname.toLowerCase() !== "aion2.plaync.com") return null;
  const seg = u.pathname.split("/").filter(Boolean);
  const i = seg.findIndex((s) => s.toLowerCase() === "characters");
  if (i === -1 || i + 2 >= seg.length) return null;
  const serverId = Number(seg[i + 1]);
  const characterId = decodeURIComponent(seg[i + 2]);
  if (!Number.isFinite(serverId) || serverId <= 0 || !characterId) return null;
  return { serverId, characterId };
}

/** Fetch a character's live data from its official share-link. */
export async function resolveCharacterFromShareUrl(
  link: string
): Promise<VerifiedGameCharacter | null> {
  const ref = parseCharacterShareUrl(link);
  if (!ref) throw new Error("invalid-character-link");
  return fetchGameCharacterProfile(ref.characterId, ref.serverId);
}

export type CharacterItem = {
  slotPos: number;
  slotPosName: string;
  id: number;
  name: string;
  icon: string;
  enchantLevel: number;
  exceedLevel: number;
  grade: string;
};

export type CharacterStat = { type: string; name: string; value: number; second: string[] };

export type CharacterSkill = {
  id: number;
  name: string;
  icon: string;
  category: string;
  skillLevel: number;
  equipped: boolean;
};

export type CharacterTitle = {
  id: number;
  name: string;
  grade: string;
  ownedCount: number;
  ownedPercent: number;
  totalCount: number;
  statDesc: string;
};

export type CharacterDaevanionBoard = {
  id: number;
  name: string;
  icon: string;
  openNodeCount: number;
  openPercent: number;
  totalNodeCount: number;
};

export type CharacterDetails = {
  profile: VerifiedGameCharacter;
  stats: CharacterStat[];
  equipment: CharacterItem[];
  skins: CharacterItem[];
  petWing: {
    petName: string | null;
    petIcon: string | null;
    petLevel: number | null;
    wingName: string | null;
    wingIcon: string | null;
  };
  skills: CharacterSkill[];
  titles: CharacterTitle[];
  daevanionBoards: CharacterDaevanionBoard[];
  fetchedAt: number;
};

/**
 * Gear on the official character page changes the moment a player upgrades an
 * item, and the thread board is where players check someone else's ilevel before
 * applying. At 5 minutes the card sat on visibly stale gear for most of an
 * evening's recruiting. 60s still collapses the burst of repeat requests one
 * page fires (a thread renders the same character in several places), while
 * picking up a fresh upgrade within a minute instead of five.
 */
const DETAILS_TTL = 60 * 1000;
const detailsCache = new Map<string, { at: number; data: CharacterDetails }>();

/** Fetch a character's full live details (profile, stats, gear, skills) from its official share-link. */
export async function fetchCharacterDetails(link: string): Promise<CharacterDetails | null> {
  const ref = parseCharacterShareUrl(link);
  if (!ref) throw new Error("invalid-character-link");

  const cacheKey = `${ref.serverId}:${ref.characterId}`;
  const cached = detailsCache.get(cacheKey);
  if (cached && Date.now() - cached.at < DETAILS_TTL) return cached.data;

  const info = await jsonFetch(aion2CharacterInfoUrl(ref.characterId, ref.serverId));
  const profile = mapGameCharacterInfo(info, ref.characterId, ref.serverId);
  if (!profile) return null;

  let equipment: any[] = [];
  let skins: any[] = [];
  let petWing: any = {};
  let skillList: any[] = [];
  try {
    const eq = await jsonFetch(aion2CharacterEquipmentUrl(ref.characterId, ref.serverId));
    equipment = Array.isArray(eq?.equipment?.equipmentList) ? eq.equipment.equipmentList : [];
    skins = Array.isArray(eq?.equipment?.skinList) ? eq.equipment.skinList : [];
    petWing = eq?.petwing || {};
    skillList = Array.isArray(eq?.skill?.skillList) ? eq.skill.skillList : [];
  } catch {
    // equipment is optional — the profile still works
  }

  const statList: any[] = Array.isArray(info?.stat?.statList) ? info.stat.statList : [];
  const boardList: any[] = Array.isArray(info?.daevanion?.boardList) ? info.daevanion.boardList : [];
  const titleList: any[] = Array.isArray(info?.title?.titleList) ? info.title.titleList : [];

  const item = (it: any): CharacterItem => ({
    slotPos: Number(it.slotPos),
    slotPosName: String(it.slotPosName || ""),
    id: Number(it.id) || 0,
    name: String(it.name || ""),
    icon: String(it.icon || ""),
    enchantLevel: Number(it.enchantLevel) || 0,
    exceedLevel: Number(it.exceedLevel) || 0,
    grade: String(it.grade || ""),
  });

  const details: CharacterDetails = {
    profile,
    stats: statList.map((s: any) => ({
      type: String(s.type || ""),
      name: String(s.name || ""),
      value: Number(s.value) || 0,
      second: Array.isArray(s.statSecondList) ? s.statSecondList.map((x: any) => String(x)).filter(Boolean) : [],
    })),
    equipment: equipment.map(item),
    skins: skins.map(item),
    petWing: {
      petName: petWing?.pet?.name ? String(petWing.pet.name) : null,
      petIcon: petWing?.pet?.icon ? String(petWing.pet.icon) : null,
      petLevel: petWing?.pet?.level != null ? Number(petWing.pet.level) : null,
      wingName: petWing?.wing?.name ? String(petWing.wing.name) : null,
      wingIcon: petWing?.wing?.icon ? String(petWing.wing.icon) : null,
    },
    skills: skillList.map((s: any) => ({
      id: Number(s.id) || 0,
      name: String(s.name || ""),
      icon: String(s.icon || ""),
      category: String(s.category || ""),
      skillLevel: Number(s.skillLevel) || 0,
      equipped: Number(s.equip) === 1,
    })),
    titles: titleList
      .slice()
      .sort((a: any, b: any) => (Number(b.ownedCount) || 0) - (Number(a.ownedCount) || 0))
      .slice(0, 10)
      .map((ti: any) => ({
        id: Number(ti.id) || 0,
        name: String(ti.name || ""),
        grade: String(ti.grade || ""),
        ownedCount: Number(ti.ownedCount) || 0,
        ownedPercent: Number(ti.ownedPercent) || 0,
        totalCount: Number(ti.totalCount) || 0,
        statDesc: Array.isArray(ti.equipStatList)
          ? ti.equipStatList.map((x: any) => String(x.desc || "")).filter(Boolean).join(" · ")
          : "",
      })),
    daevanionBoards: boardList.map((b: any) => ({
      id: Number(b.id) || 0,
      name: String(b.name || ""),
      icon: String(b.icon || ""),
      openNodeCount: Number(b.openNodeCount) || 0,
      openPercent: Number(b.openPercent) || 0,
      totalNodeCount: Number(b.totalNodeCount) || 0,
    })),
    fetchedAt: Date.now(),
  };

  detailsCache.set(cacheKey, { at: Date.now(), data: details });
  return details;
}