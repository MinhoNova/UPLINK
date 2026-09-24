import type { VerifiedGameCharacter } from "@/lib/aion2ClassIds";
import { portraitProxyPath } from "@/lib/aion2ClassIds";

export function gameCharIdOf(c: any): string {
  if (!c) return "";
  const rid = String(c.id || "");
  if (rid.startsWith("game:")) return rid.slice(5);
  return String(c.gameCharacterId || c.characterId || "");
}

export function myLinkedCharacters(list: any[], userId: string): any[] {
  return (Array.isArray(list) ? list : []).filter((c) => String(c.userId) === String(userId));
}

export function toStoredCharacter(vc: VerifiedGameCharacter, userId: string): any {
  return {
    id: `game:${vc.characterId}`,
    userId,
    name: vc.name,
    aionClass: vc.siteClass || "",
    gameClassLabel: vc.gameClassLabel,
    level: vc.level,
    cpAp: vc.combatPower,
    combatPower: vc.combatPower,
    itemLevel: vc.itemLevel,
    serverId: vc.serverId,
    serverName: vc.serverName,
    raceId: vc.raceId,
    raceName: vc.raceName,
    genderName: vc.genderName || "",
    portraitUrl: portraitProxyPath(vc.portraitUrl || ""),
    verifiedAt: vc.verifiedAt,
    region: vc.region || "kr",
  };
}

export async function fetchPublicCharacters(): Promise<any[]> {
  try {
    const d: any = await fetch("/api/public-data").then((r) => r.json()).catch(() => ({}));
    return Array.isArray(d.characters) ? d.characters : [];
  } catch {
    return [];
  }
}

export async function writeCharacters(next: any[]): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ characters: next }),
    });
    if (!res.ok) {
      const d: any = await res.json().catch(() => ({}));
      return { ok: false, error: typeof d.error === "string" ? d.error : undefined };
    }
    window.dispatchEvent(new CustomEvent("data-refresh"));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function saveVerifiedCharacterEntry(
  vc: VerifiedGameCharacter,
  userId: string
): Promise<{ ok: boolean; error?: string }> {
  const existing = await fetchPublicCharacters();
  const id = `game:${vc.characterId}`;
  const idx = existing.findIndex((c: any) => String(c.id) === id);
  const entry = toStoredCharacter(vc, userId);
  const next = idx >= 0 ? existing.map((c, i) => (i === idx ? entry : c)) : [...existing, entry];
  return writeCharacters(next);
}

export async function removeCharacterById(
  charIdToRemove: string,
  userId: string
): Promise<{ ok: boolean; error?: string }> {
  const existing = await fetchPublicCharacters();
  const next = existing.filter((c: any) => !(String(c.id) === String(charIdToRemove) && String(c.userId) === String(userId)));
  if (next.length === existing.length) return { ok: true };
  return writeCharacters(next);
}