/**
 * Aion 2 (plaync) game-data proxy — server-only.
 * Wraps the public/unofficial NCSoft KR endpoints + portrait CDN whitelist.
 */
import {
  mapGameClassToSite,
  isAllowedPortraitUrl,
  type GameServer,
  type GameCharacterSearchHit,
  type VerifiedGameCharacter,
} from "@/lib/aion2ClassIds";

const API_BASE = "https://aion2.plaync.com";
export { isAllowedPortraitUrl, portraitProxyPath } from "@/lib/aion2ClassIds";
export type { GameServer, GameCharacterSearchHit, VerifiedGameCharacter } from "@/lib/aion2ClassIds";
export type GameClass = { id: number; name: string; text: string };

const CACHE_TTL = 6 * 60 * 60 * 1000;
const EN_LANG = "lang=en";
let serversCache: { at: number; data: GameServer[] } | null = null;
let classesCache: { at: number; data: GameClass[] } | null = null;

async function jsonFetch(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { accept: "application/json", "accept-language": "en,ko" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Game API ${res.status}`);
  return res.json();
}

function stripHtml(s: string): string {
  return String(s || "").replace(/<[^>]*>/g, "").trim();
}

function serverRaceOf(serverId: number): number {
  return Math.floor(serverId / 1000) === 2 ? 2 : 1;
}

export async function getGameServers(): Promise<GameServer[]> {
  if (serversCache && Date.now() - serversCache.at < CACHE_TTL) return serversCache.data;
  const data = await jsonFetch(`${API_BASE}/api/gameinfo/servers?${EN_LANG}`);
  const raw: any[] = Array.isArray(data?.serverList) ? data.serverList : [];
  const servers: GameServer[] = raw.map((s: any) => ({
    raceId: Number(s.raceId) || serverRaceOf(Number(s.serverId)),
    serverId: Number(s.serverId),
    serverName: String(s.serverName || ""),
  }));
  serversCache = { at: Date.now(), data: servers };
  return servers;
}

export async function getGameServersCached(): Promise<GameServer[]> {
  try {
    return await getGameServers();
  } catch {
    return [
      {
        raceId: 1,
        serverId: 1001,
        serverName: "Siel",
      },
    ];
  }
}

export async function getGameClasses(): Promise<GameClass[]> {
  if (classesCache && Date.now() - classesCache.at < CACHE_TTL) return classesCache.data;
  const data = await jsonFetch(`${API_BASE}/api/gameinfo/classes?${EN_LANG}`);
  const raw: any[] = Array.isArray(data?.classList) ? data.classList : [];
  const classes: GameClass[] = raw.map((c: any) => ({
    id: Number(c.id),
    name: String(c.name || ""),
    text: String(c.text || ""),
  }));
  classesCache = { at: Date.now(), data: classes };
  return classes;
}

function cleanSearchList(list: any[]): GameCharacterSearchHit[] {
  return (list || []).map((c: any) => ({
    characterId: String(c.characterId || ""),
    name: stripHtml(String(c.name || "")),
    race: Number(c.race) || 1,
    pcId: Number(c.pcId) || 0,
    level: Number(c.level) || 1,
    serverId: Number(c.serverId) || 0,
    serverName: String(c.serverName || ""),
    profileImageUrl: c.profileImageUrl ? String(c.profileImageUrl) : null,
  }));
}

async function searchCharacters(
  name: string,
  serverId: number,
  race: number
): Promise<GameCharacterSearchHit[]> {
  const url = `${API_BASE}/ko-kr/api/search/aion2/search/v2/character?keyword=${encodeURIComponent(
    name
  )}&race=${race}&serverId=${serverId}`;
  const data = await jsonFetch(url);
  return cleanSearchList(Array.isArray(data?.list) ? data.list : []);
}

function pickBestHit(
  name: string,
  serverId: number | undefined,
  hits: GameCharacterSearchHit[]
): GameCharacterSearchHit | null {
  if (hits.length === 0) return null;
  const needle = String(name || "").trim().toLowerCase();
  const scoped = serverId ? hits.filter((h) => h.serverId === serverId) : hits;
  const pool = scoped.length > 0 ? scoped : hits;
  if (!needle) return pool[0];
  const exact = pool.find((h) => h.name.toLowerCase() === needle);
  if (exact) return exact;
  return pool.find((h) => h.name.toLowerCase().includes(needle)) || pool[0];
}

/** Verify a character by name against the live game data. */
export async function verifyGameCharacter(
  name: string,
  serverId?: number,
  race?: number
): Promise<VerifiedGameCharacter | null> {
  let targets: Array<{ serverId: number; race: number }>;
  if (serverId) {
    targets = [{ serverId, race: race ?? serverRaceOf(serverId) }];
  } else {
    const servers = await getGameServersCached();
    targets = servers.slice(0, 6).map((s) => ({ serverId: s.serverId, race: s.raceId }));
  }

  let best: GameCharacterSearchHit | null = null;
  for (const t of targets) {
    try {
      const hits = await searchCharacters(name, t.serverId, t.race);
      const hit = pickBestHit(name, t.serverId, hits);
      if (hit && (!best || hit.name.toLowerCase() === String(name).trim().toLowerCase())) {
        best = hit;
        if (String(hit.name).trim().toLowerCase() === String(name).trim().toLowerCase()) break;
      }
    } catch {
      // try next server/race
    }
  }
  if (!best) return null;

  const profile = await fetchGameCharacterProfile(best.characterId, best.serverId);
  return profile;
}

function itemLevelOf(stat: any): number {
  const list: any[] = Array.isArray(stat?.statList) ? stat.statList : [];
  const hit = list.find((s: any) => String(s.type || "").toLowerCase() === "itemlevel");
  return hit ? Number(hit.value) || 0 : 0;
}

async function fetchGameCharacterInfoRaw(
  characterId: string,
  serverId: number,
  base = API_BASE,
  lang = EN_LANG
): Promise<any> {
  const url = `${base}/api/character/info?${lang}&characterId=${encodeURIComponent(
    characterId
  )}&serverId=${serverId}`;
  return jsonFetch(url);
}

function mapGameCharacterInfo(
  data: any,
  characterId: string,
  serverId: number,
  region: "tw" | "kr"
): VerifiedGameCharacter | null {
  const p: any = data?.profile;
  if (!p || !p.characterId) return null;

  const gameClassLabel = String(p.className || "");
  const siteClass = mapGameClassToSite(gameClassLabel);
  const profileImage: string = String(p.profileImage || "");
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
    portraitUrl: isAllowedPortraitUrl(profileImage) ? profileImage : null,
    region,
    verifiedAt: Date.now(),
  };
}

export async function fetchGameCharacterProfile(
  characterId: string,
  serverId: number,
  base = API_BASE,
  lang = EN_LANG,
  region: "tw" | "kr" = "kr"
): Promise<VerifiedGameCharacter | null> {
  const data = await fetchGameCharacterInfoRaw(characterId, serverId, base, lang);
  return mapGameCharacterInfo(data, characterId, serverId, region);
}

type CharacterShareRef = {
  baseUrl: string;
  lang: string;
  region: "tw" | "kr";
  serverId: number;
  characterId: string;
};

/** Parse an official character page share-link (/characters/{serverId}/{encryptedCharacterId}). */
export function parseCharacterShareUrl(link: string): CharacterShareRef | null {
  let u: URL;
  try {
    u = new URL(String(link || "").trim());
  } catch {
    return null;
  }
  const host = u.hostname.toLowerCase();
  let baseUrl: string;
  let lang: string;
  let region: "tw" | "kr";
  if (host === "tw.ncsoft.com") {
    baseUrl = "https://tw.ncsoft.com/aion2";
    lang = EN_LANG;
    region = "tw";
  } else if (host === "aion2.plaync.com") {
    baseUrl = API_BASE;
    lang = EN_LANG;
    region = "kr";
  } else {
    return null;
  }
  const seg = u.pathname.split("/").filter(Boolean);
  const i = seg.findIndex((s) => s.toLowerCase() === "characters");
  if (i === -1 || i + 2 >= seg.length) return null;
  const serverId = Number(seg[i + 1]);
  const characterId = decodeURIComponent(seg[i + 2]);
  if (!Number.isFinite(serverId) || serverId <= 0 || !characterId) return null;
  return { baseUrl, lang, region, serverId, characterId };
}

/** Fetch a character's live data from its official share-link. */
export async function resolveCharacterFromShareUrl(
  link: string
): Promise<VerifiedGameCharacter | null> {
  const ref = parseCharacterShareUrl(link);
  if (!ref) throw new Error("invalid-character-link");
  return fetchGameCharacterProfile(ref.characterId, ref.serverId, ref.baseUrl, ref.lang, ref.region);
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

const DETAILS_TTL = 5 * 60 * 1000;
const detailsCache = new Map<string, { at: number; data: CharacterDetails }>();

/** Fetch a character's full live details (profile, stats, gear, skills) from its official share-link. */
export async function fetchCharacterDetails(link: string): Promise<CharacterDetails | null> {
  const ref = parseCharacterShareUrl(link);
  if (!ref) throw new Error("invalid-character-link");

  const cacheKey = `${ref.region}:${ref.serverId}:${ref.characterId}`;
  const cached = detailsCache.get(cacheKey);
  if (cached && Date.now() - cached.at < DETAILS_TTL) return cached.data;

  const info = await fetchGameCharacterInfoRaw(
    ref.characterId,
    ref.serverId,
    ref.baseUrl,
    ref.lang
  );
  const profile = mapGameCharacterInfo(info, ref.characterId, ref.serverId, ref.region);
  if (!profile) return null;

  let equipment: any[] = [];
  let skins: any[] = [];
  let petWing: any = {};
  let skillList: any[] = [];
  try {
    const eq = await jsonFetch(
      `${ref.baseUrl}/api/character/equipment?${ref.lang}&characterId=${encodeURIComponent(
        ref.characterId
      )}&serverId=${ref.serverId}`
    );
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