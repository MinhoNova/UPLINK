import { getKV } from "@/lib/db";

/**
 * A game character (`game:<characterId>`) may only ever be linked to one
 * account. Returns the existing linked record (with its owner `userId`) when
 * it is already claimed, or null when it is free.
 */
export async function findCharacterLink(characterId: string) {
  try {
    const chars = (await getKV("characters")) as any[] | undefined;
    if (!Array.isArray(chars)) return null;
    return (
      chars.find((c) => String(c.id) === `game:${String(characterId)}`) ||
      chars.find((c) => String(c.characterId || c.gameCharacterId || "") === String(characterId)) ||
      null
    );
  } catch {
    return null;
  }
}