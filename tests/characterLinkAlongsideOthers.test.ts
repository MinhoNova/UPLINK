import { describe, it, expect } from "vitest";
import { validateCharacters } from "@/lib/secureDataWrite";

/**
 * Regression: nobody could link a game character.
 *
 * `saveVerifiedCharacterEntry` reads the whole public roster, appends the new
 * game character, and POSTs the lot back. The roster already contained a
 * `game:`-id character belonging to another account, and `validateCharacters`
 * rejected the entire save with "This in-game character is already linked to
 * another account" — for a character the caller never touched.
 *
 * A character the caller does not own must be left alone, not used to block
 * their own save. The same shape as the lobby fix: keep the stored copy.
 */

const ME = "1386800224273563868";
const OTHER = "711027724663128106";

/** Another player's linked game character, exactly as the public roster has it. */
const theirGameChar = {
  id: "game:A1pIWbd0UKoTYJ2XbL_Cw57uCNxoM4sk4CUqtC5yJ0E=",
  userId: OTHER,
  name: "Lindaa",
  aionClass: "Templar",
  level: 45,
  region: "tw",
};

/** Another player's hand-made site character. */
const theirSiteChar = {
  id: "1781466738266",
  userId: OTHER,
  name: "Their main",
  class: "Berserker",
};

const myNewGameChar = {
  id: "game:ZZZZmyOwnCharacterId000000000000000=",
  userId: ME,
  name: "Me",
  aionClass: "Mage",
  level: 30,
  region: "kr",
};

const store = () => [theirGameChar, theirSiteChar];

describe("linking a game character when others already have some", () => {
  it("saves the caller's new character", () => {
    const res = validateCharacters(store(), [...store(), myNewGameChar], ME, false);

    expect(res.ok).toBe(true);
    expect((res as any).value.some((c: any) => c.id === myNewGameChar.id)).toBe(true);
  });

  it("leaves the other player's game character exactly as it was", () => {
    const res = validateCharacters(store(), [...store(), myNewGameChar], ME, false);

    expect((res as any).value.find((c: any) => c.id === theirGameChar.id)).toEqual(theirGameChar);
  });

  it("leaves another player's site character exactly as it was", () => {
    const res = validateCharacters(store(), [...store(), myNewGameChar], ME, false);

    expect((res as any).value.find((c: any) => c.id === theirSiteChar.id)).toEqual(theirSiteChar);
  });

  it("does not let the caller steal the other player's game character", () => {
    // The full roster, with the other player's game character rewritten to
    // point at the caller — the shape `saveVerifiedCharacterEntry` produces
    // when someone links a character that is already taken.
    const forged = { ...theirGameChar, userId: ME, name: "Mine now" };
    const res = validateCharacters(store(), [forged, theirSiteChar, myNewGameChar], ME, false);

    const stored = (res as any).value.find((c: any) => c.id === theirGameChar.id);
    expect(stored.userId).toBe(OTHER);
    expect(stored.name).toBe("Lindaa");
  });

  it("still refuses to invent a character owned by someone else", () => {
    const invented = { id: "game:brandNewIdForSomebodyElse0000000=", userId: OTHER, name: "Theirs" };
    const res = validateCharacters(store(), [...store(), invented], ME, false);

    expect(res.ok).toBe(false);
  });

  it("still refuses to delete another player's character", () => {
    const res = validateCharacters(store(), [theirSiteChar], ME, false);

    expect(res.ok).toBe(false);
  });

  it("still lets the caller edit their own character", () => {
    const mine = { id: "1700000000000", userId: ME, name: "Old name" };
    const res = validateCharacters(
      [...store(), mine],
      [theirGameChar, theirSiteChar, { ...mine, name: "New name" }],
      ME,
      false
    );

    expect(res.ok).toBe(true);
    expect((res as any).value.find((c: any) => c.id === mine.id).name).toBe("New name");
  });
});
