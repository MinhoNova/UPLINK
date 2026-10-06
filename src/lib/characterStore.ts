import type { VerifiedGameCharacter } from "@/lib/aion2ClassIds";
import { isSupportedGlobalRegion, portraitProxyPath } from "@/lib/aion2ClassIds";
import { STATS_SIG_FIELD } from "@/lib/characterStatsLimits";

/**
 * A verified character together with the signature the resolve endpoint minted
 * over its stats.
 *
 * The two are only separable because the response hands them over side by side,
 * and keeping them apart matters: `character` is entirely client-visible while
 * `statsSig` is what makes its numbers usable as a gate. Widening the save
 * function to accept either shape means a caller that has no signature in hand —
 * an older caller, or a code path that skipped resolve — stores an unsigned row
 * rather than inventing one. Unsigned rows cannot satisfy a requirement, so
 * forgetting the signature degrades to "cannot use this feature", never to "can
 * forge their stats".
 */
export type SignedVerifiedCharacterEntry = VerifiedGameCharacter & { statsSig?: string | null };

/** True for a row that was written by the game-character verifier, as opposed to
 *  a plain site character. Only verified rows carry these, and they are what
 *  lets us recognise a pre-`game:`-prefix row (see `gameCharIdOf`). */
function looksLikeVerifiedGameRow(c: any): boolean {
  // Any live global shard counts, not just `global` — an EU character row is a
  // verified row and has to resolve its id like any other.
  if (String(c?.region || "").trim()) return isSupportedGlobalRegion(c.region);
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

export function toStoredCharacter(vc: VerifiedGameCharacter, userId: string, statsSig: string | null = null): any {
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
    // Carried, never computed here. The server minted this over the numbers above
    // at resolve time, which is the only point the site saw the real values; the
    // client cannot produce one, so it cannot inflate a row that a stat
    // requirement is later checked against. Left off entirely when signing is
    // unavailable, which makes the row unusable for requirements rather than
    // making it forgeable.
    ...(statsSig ? { [STATS_SIG_FIELD]: statsSig } : {}),
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

/**
 * Save several verified characters from one read and one write.
 *
 * `characters` is a single blob, so every write rewrites the entire roster.
 * Refreshing a page of N characters one at a time therefore cost N full-blob
 * reads and N full-blob writes, each invalidating the public cache for every
 * reader — and N opportunities for two tabs to clobber each other. Collecting
 * the live results first and writing them in one pass keeps a whole-page update
 * atomic and costs a single rewrite.
 *
 * Per-character behaviour is unchanged: replace the caller's first copy in
 * place, drop any further copy (so the first write after the `game:` prefix
 * landed repairs storage, not just the rendered list), and append anything the
 * roster did not have yet.
 */
export async function saveVerifiedCharacterEntries(
  entries: Array<VerifiedGameCharacter | SignedVerifiedCharacterEntry>,
  userId: string
): Promise<{ ok: boolean; error?: string }> {
  if (!Array.isArray(entries) || entries.length === 0) return { ok: true };
  const existing = await fetchPublicCharacters();
  // Match on the character itself, not just the row id. A row saved before the
  // `game:` prefix carries the bare character id as its `id`; matching only
  // `game:<id>` left that row in place and appended a second one, which is how
  // one character came to be listed twice.
  const wanted = entries
    .map((vc) => ({
      charId: String(vc.characterId),
      entry: toStoredCharacter(
        vc,
        userId,
        "statsSig" in vc ? String((vc as SignedVerifiedCharacterEntry).statsSig || "") || null : null
      ),
    }))
    .filter((w) => w.charId);
  const written = new Set<string>();
  const next: any[] = [];
  for (const c of existing) {
    const match = wanted.find((w) => w.charId === gameCharIdOf(c) && String(c.userId) === String(userId));
    if (!match) {
      next.push(c);
      continue;
    }
    if (written.has(match.charId)) continue;
    written.add(match.charId);
    next.push(match.entry);
  }
  for (const w of wanted) {
    if (written.has(w.charId)) continue;
    written.add(w.charId);
    next.push(w.entry);
  }
  return writeCharacters(next);
}

export async function saveVerifiedCharacterEntry(
  vc: VerifiedGameCharacter | SignedVerifiedCharacterEntry,
  userId: string
): Promise<{ ok: boolean; error?: string }> {
  return saveVerifiedCharacterEntries([vc], userId);
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