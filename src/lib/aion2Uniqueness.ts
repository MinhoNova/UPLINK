import { getKV } from "@/lib/db";
import { gameCharIdOf } from "@/lib/characterStore";

/**
 * A game character (`game:<characterId>`) may only ever be linked to one
 * account. Returns the existing linked record (with its owner `userId`) when
 * it is already claimed, or null when it is free.
 */
export async function findCharacterLink(characterId: string) {
  try {
    const target = String(characterId || "");
    if (!target) return null;
    const chars = (await getKV("characters")) as any[] | undefined;
    if (!Array.isArray(chars)) return null;
    // `gameCharIdOf` resolves the current `game:<id>` spelling *and* the bare
    // `<id>` rows written before that prefix existed. Matching on the raw `id`
    // alone missed those rows entirely, so a legacy claim was invisible here and
    // the "already linked to another account" answer never fired for it.
    return chars.find((c) => gameCharIdOf(c) === target) || null;
  } catch {
    return null;
  }
}