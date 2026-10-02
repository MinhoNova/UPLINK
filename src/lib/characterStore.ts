import type { VerifiedGameCharacter } from "@/lib/aion2ClassIds";
import { portraitProxyPath } from "@/lib/aion2ClassIds";

/** True for a row that was written by the game-character verifier, as opposed to
 *  a plain site character. Only verified rows carry these, and they are what
 *  lets us recognise a pre-`game:`-prefix row (see `gameCharIdOf`). */
function looksLikeVerifiedGameRow(c: any): boolean {
  if (String(c?.region || "").toLowerCase() === "global") return true;
  if (c?.gameClassLabel) return true;
  return Boolean(c?.verifiedAt) && Number(c?.serverId) > 0;
}

export function gameCharIdOf(c: any): string {
  if (!c) return "";
  const rid = String(c.id || "");
  if (rid.startsWith("game:")) return rid.slice(5);
  const explicit = String(c.gameCharacterId || c.characterId || "");
  if (explicit) return explicit;
  // Rows written before the `game:` prefix existed store the character id as
  // their own `id`. Returning "" for those did real damage: the duplicate could
  // not be merged away, and the re-verify control sent an empty `characterId`
  // and was rejected — so precisely the rows missing a portrait were the ones
  // that could never get one.
  if (rid && looksLikeVerifiedGameRow(c)) return rid;
  return "";
}

/** Which of two rows for the same character should win. A row saved by an older
 *  build kept a bare `<characterId>` as its `id` while the current one uses
 *  `game:<characterId>`, so one character could be stored twice and — because the
 *  lists only filtered on `userId` — drawn twice, as "two My Characters".
 *  Prefer whichever row actually carries a portrait, then the most recently
 *  verified, then the `game:`-prefixed one. */
function characterRowWins(candidate: any, incumbent: any): boolean {
  const candPortrait = candidate?.portraitUrl ? 1 : 0;
  const incPortrait = incumbent?.portraitUrl ? 1 : 0;
  if (candPortrait !== incPortrait) return candPortrait > incPortrait;
  const candAt = Number(candidate?.verifiedAt) || 0;
  const incAt = Number(incumbent?.verifiedAt) || 0;
  if (candAt !== incAt) return candAt > incAt;
  return String(candidate?.id || "").startsWith("game:") && !String(incumbent?.id || "").startsWith("game:");
}

/**
 * This account's verified characters, one entry per in-game character.
 *
 * Also cleans up the duplicate: when a second row for the same character wins,
 * the list no longer contains the loser. `writeCharacters` replaces the whole
 * array, so the next write from any screen drops the stale row for good.
 */
export function myLinkedCharacters(list: any[], userId: string): any[] {
  const mine = (Array.isArray(list) ? list : []).filter((c) => String(c.userId) === String(userId));
  const byCharId = new Map<string, any>();
  const indexByCharId = new Map<string, number>();
  mine.forEach((c, i) => {
    const key = gameCharIdOf(c);
    // A row with no resolvable character id can't be merged — keep it as-is so
    // it stays visible and removable rather than vanishing.
    const mapKey = key ? `k:${key}` : `r:${i}`;
    const incumbent = byCharId.get(mapKey);
    if (!incumbent) {
      byCharId.set(mapKey, c);
      indexByCharId.set(mapKey, i);
      return;
    }
    if (characterRowWins(c, incumbent)) byCharId.set(mapKey, c);
  });
  return Array.from(byCharId.entries())
    .sort((a, b) => (indexByCharId.get(a[0]) ?? 0) - (indexByCharId.get(b[0]) ?? 0))
    .map(([, row]) => row);
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
    region: vc.region || "global",
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
  const charId = String(vc.characterId);
  // Match on the character itself, not just the row id. A row saved before the
  // `game:` prefix carries the bare character id as its `id`; matching only
  // `game:<id>` left that row in place and appended a second one, which is how
  // one character came to be listed twice.
  const isMine = (c: any) => gameCharIdOf(c) === charId && String(c.userId) === String(userId);
  const entry = toStoredCharacter(vc, userId);
  // Replace the first copy in place, drop any further copy: the first write
  // after this fix repairs storage, not just the rendered list.
  let replaced = false;
  const next: any[] = [];
  for (const c of existing) {
    if (!isMine(c)) {
      next.push(c);
      continue;
    }
    if (!replaced) {
      next.push(entry);
      replaced = true;
    }
  }
  if (!replaced) next.push(entry);
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