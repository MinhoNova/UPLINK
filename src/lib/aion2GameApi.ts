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
  const data = await jsonFetch(`${API_BASE}/api/gameinfo/servers?lang=ko`);
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
        serverName: "시엘",
      },
    ];
  }
}

export async function getGameClasses(): Promise<GameClass[]> {
  if (classesCache && Date.now() - classesCache.at < CACHE_TTL) return classesCache.data;
  const data = await jsonFetch(`${API_BASE}/api/gameinfo/classes?lang=ko`);
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

export async function fetchGameCharacterProfile(
  characterId: string,
  serverId: number
): Promise<VerifiedGameCharacter | null> {
  const url = `${API_BASE}/api/character/info?lang=ko&characterId=${encodeURIComponent(
    characterId
  )}&serverId=${serverId}`;
  const data = await jsonFetch(url);
  const p: any = data?.profile;
  if (!p) return null;

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
    verifiedAt: Date.now(),
  };
}