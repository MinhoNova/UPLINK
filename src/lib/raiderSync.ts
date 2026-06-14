import { memberIdentityKey, memberMatchesUser } from "@/lib/lobbyLifecycle";

const DUNGEON_BY_SHORT: Record<string, { name: string; img: string }> = {
  AA: { name: "Algeth'ar Academy", img: "/classes/Algeth'ar Academy.webp" },
  MT: { name: "Magisters Terrace", img: "/classes/Magisters Terrace.webp" },
  MC: { name: "Maisara Caverns", img: "/classes/Maisara Caverns.webp" },
  NPX: { name: "Nexus-Point Xenas", img: "/classes/Nexus-Point Xenas.webp" },
  POS: { name: "Pit of Saron", img: "/classes/Pit of Saron.webp" },
  SEAT: { name: "Seat of the Triumvirate", img: "/classes/Seat of the Triumvirate.webp" },
  SR: { name: "Skyreach", img: "/classes/Skyreach.webp" },
  WS: { name: "Windrunner Spire", img: "/classes/Windrunner Spire.webp" },
};

const DUNGEON_NAME_TO_SHORT: Record<string, string> = Object.fromEntries(
  Object.entries(DUNGEON_BY_SHORT).map(([short, info]) => [info.name.toLowerCase(), short])
);

export function getMemberRaiderProfile(member: any): {
  region: string;
  realm: string;
  name: string;
} | null {
  const data = member?.characterData || member || {};
  const region = String(data.raiderRegion || data.region || "")
    .trim()
    .toLowerCase();
  const realm = String(data.raiderRealm || data.realm || "").trim();
  const name = String(data.raiderName || data.name || "").trim();
  if (!region || !realm || !name) return null;
  return { region, realm, name };
}

function parseKeyLevel(keyLevel?: string): number {
  return parseInt(String(keyLevel || "+10").replace("+", ""), 10) || 10;
}

function offerAllowedShorts(lobby: any): Set<string> | null {
  const sd = lobby?.selectedDungeons;
  if (!sd || typeof sd !== "object") return null;
  const names = Object.keys(sd).filter((k) => Number(sd[k]) > 0);
  if (!names.length) return null;
  const shorts = new Set<string>();
  for (const name of names) {
    const short = DUNGEON_NAME_TO_SHORT[name.toLowerCase()];
    if (short) shorts.add(short);
    else if (DUNGEON_BY_SHORT[name.toUpperCase()]) shorts.add(name.toUpperCase());
  }
  return shorts.size ? shorts : null;
}

function runMatchesOffer(run: any, lobby: any, allowedShorts: Set<string> | null): boolean {
  if (allowedShorts && !allowedShorts.has(run.short_name)) return false;
  const minKey = parseKeyLevel(lobby.keyLevel);
  if (Number(run.mythic_level) < minKey) return false;
  if (!lobby.missionStartTime) return true;
  const completedAt = new Date(run.completed_at).getTime();
  if (Number.isNaN(completedAt)) return false;
  return completedAt >= Number(lobby.missionStartTime);
}

async function fetchRaiderRuns(profile: { region: string; realm: string; name: string }) {
  const url = new URL("https://raider.io/api/v1/characters/profile");
  url.searchParams.set("region", profile.region);
  url.searchParams.set("realm", profile.realm);
  url.searchParams.set("name", profile.name);
  url.searchParams.set("fields", "mythic_plus_recent_runs,mythic_plus_best_runs");

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) return [];
  const data = await res.json();
  const merged = new Map<string, any>();
  for (const run of [...(data.mythic_plus_recent_runs || []), ...(data.mythic_plus_best_runs || [])]) {
    const key = run.url || `${run.short_name}-${run.mythic_level}-${run.completed_at || ""}`;
    merged.set(key, run);
  }
  return [...merged.values()];
}

export type DetectedRun = {
  dungeon: string;
  dungeonFull: string;
  dungeonImg: string;
  mythic_level: number;
  num_keystone_upgrades: number;
  completed_at: string;
  clear_time_ms?: number;
  score?: number;
  url: string;
  memberId?: string;
  memberName?: string;
  memberAvatar?: string;
  memberEffect?: string;
};

/** Squad members whose Raider.io runs should be checked (owner + confirmed boosters). */
export function getLobbyRunSyncMembers(lobby: any, characters: any[] = []): any[] {
  const confirmed = (lobby.accepted || []).filter(
    (a: any) => !a.status || a.status === "confirmed"
  );
  const members = [...confirmed];
  const ownerId = String(lobby.ownerId || "");
  if (ownerId && !members.some((m) => memberIdentityKey(m) === ownerId)) {
    const ownerChar = characters.find((c) => String(c.userId) === ownerId);
    if (ownerChar && getMemberRaiderProfile(ownerChar)) {
      members.push({
        ...ownerChar,
        applicantId: ownerId,
        applicantName: lobby.ownerDiscordName,
        applicantAvatar: lobby.ownerImage,
        applicantEffect: lobby.ownerEffect,
        raiderRegion: String(ownerChar.region || lobby.serverRegion || "us").toLowerCase(),
        raiderRealm: ownerChar.realm,
        raiderName: ownerChar.name,
      });
    }
  }
  return members;
}

/** Server-side Raider.io sync — only runs after missionStartTime, deduped by URL. */
export async function syncLobbyDetectedRuns(
  lobby: any,
  characters: any[] = []
): Promise<DetectedRun[]> {
  if (!lobby?.missionStartTime || lobby.category === "leveling") {
    return Array.isArray(lobby?.detectedRuns) ? lobby.detectedRuns : [];
  }

  const syncMembers = getLobbyRunSyncMembers(lobby, characters);
  if (!syncMembers.length) {
    return Array.isArray(lobby.detectedRuns) ? lobby.detectedRuns : [];
  }

  const maxRuns =
    lobby.runsCount ||
    Object.values(lobby.selectedDungeons || {}).reduce(
      (a: number, b: any) => a + (Number(b) || 0),
      0
    ) ||
    1;

  const allowedShorts = offerAllowedShorts(lobby);
  const memberDungeons: Record<string, Set<string>> = {};

  for (const member of syncMembers) {
    const profile = getMemberRaiderProfile(member);
    if (!profile) continue;
    const memberId = memberIdentityKey(member);
    try {
      const runs = await fetchRaiderRuns(profile);
      const names = new Set<string>();
      for (const run of runs) {
        if (!runMatchesOffer(run, lobby, allowedShorts)) continue;
        names.add(run.short_name);
      }
      if (names.size) memberDungeons[memberId] = names;
    } catch {
      /* skip member */
    }
  }

  const memberIds = Object.keys(memberDungeons);
  let commonNames: string[] = [];
  if (memberIds.length >= 2) {
    commonNames = [...memberDungeons[memberIds[0]]].filter((d) =>
      memberIds.every((id) => memberDungeons[id].has(d))
    );
  } else if (memberIds.length === 1) {
    commonNames = [...memberDungeons[memberIds[0]]];
  }

  // If party intersection is empty (e.g. buyers in accepted without runs), use union of runner dungeons.
  if (!commonNames.length && memberIds.length) {
    const union = new Set<string>();
    for (const id of memberIds) memberDungeons[id].forEach((d) => union.add(d));
    commonNames = [...union];
  }

  if (!commonNames.length) {
    return Array.isArray(lobby.detectedRuns) ? lobby.detectedRuns : [];
  }

  const existing = new Map<string, DetectedRun>();
  for (const run of lobby.detectedRuns || []) {
    const key = run.url || `${run.dungeon}-${run.mythic_level}`;
    existing.set(key, run);
  }

  for (const memberId of memberIds) {
    const member = syncMembers.find((m: any) => memberIdentityKey(m) === memberId);
    if (!member) continue;
    const profile = getMemberRaiderProfile(member);
    if (!profile) continue;

    try {
      const runs = await fetchRaiderRuns(profile);
      for (const run of runs) {
        if (!commonNames.includes(run.short_name)) continue;
        if (!runMatchesOffer(run, lobby, allowedShorts)) continue;
        const key = run.url || `${run.short_name}-${run.mythic_level}-${run.completed_at || ""}`;
        if (existing.has(key)) continue;
        if (existing.size >= maxRuns) break;

        const dungeonInfo = DUNGEON_BY_SHORT[run.short_name] || {
          name: run.short_name,
          img: "/classes/DPS.svg",
        };

        existing.set(key, {
          dungeon: run.short_name,
          dungeonFull: dungeonInfo.name,
          dungeonImg: dungeonInfo.img,
          mythic_level: run.mythic_level,
          num_keystone_upgrades: run.num_keystone_upgrades || 0,
          completed_at: run.completed_at,
          clear_time_ms: run.clear_time_ms,
          score: run.score,
          url: run.url,
          memberId,
          memberName: member.applicantName || member.name,
          memberAvatar: member.applicantAvatar || member.avatar || "",
          memberEffect: member.applicantEffect || member.effect || "none",
        });
      }
    } catch {
      /* skip */
    }
  }

  const merged = [...existing.values()].sort(
    (a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
  );
  return merged.slice(0, maxRuns);
}

export function userCanTriggerRunSync(lobby: any, userId: string): boolean {
  if (!lobby || !userId) return false;
  if (String(lobby.ownerId) === String(userId)) return true;
  return (lobby.accepted || []).some(
    (a: any) =>
      memberMatchesUser(a, userId) && (!a.status || a.status === "confirmed" || a.status === "invited")
  );
}
