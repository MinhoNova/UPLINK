import { describe, it, expect } from "vitest";
import { validateCharacters } from "@/lib/secureDataWrite";
import { dropNonGlobalCharacters, publicDataView } from "@/lib/publicDataView";

/**
 * Two defects, both from the same root cause: the checks keyed on the raw row
 * `id` instead of the resolved in-game character.
 *
 * 1. Rows written before the `game:` prefix store the bare character id in `id`.
 *    `isGameCharId()` is false for those, so "the same in-game character cannot
 *    be linked to two accounts" never ran on them. Two accounts could both
 *    claim one character using the bare spelling; the per-account list deduped
 *    it away in the UI, so the store quietly held it twice.
 *
 * 2. Nothing checked the region. The site verifies against Global only, so a
 *    Taiwan/KR row is a leftover or a forged write — wrong region badge, wrong
 *    image host for the portrait, and it burns one of the account's character
 *    slots.
 */

const CHAR_ID = "A1pIWbd0UKoTYJ2XbL_Cw57uCNxoM4sk4CUqtC5yJ0E=";
const OTHER_ID = "Z9othercharidnotrealbutstableAAAAAAAAAAAAAAAA=";

const modern = (over: Record<string, any> = {}) => ({
  id: `game:${CHAR_ID}`,
  userId: "u1",
  region: "global",
  ...over,
});

/** Pre-`game:` spelling: the character id *is* the row id. */
const legacy = (over: Record<string, any> = {}) => ({
  id: CHAR_ID,
  userId: "u1",
  region: "global",
  ...over,
});

describe("validateCharacters — one in-game character, one account", () => {
  it("rejects two accounts claiming the same character via the modern id", () => {
    const res = validateCharacters([], [modern(), modern({ userId: "u2" })], "u1", false);
    expect(res.ok).toBe(false);
  });

  it("rejects two accounts claiming the same character via the bare id", () => {
    const res = validateCharacters([], [legacy(), legacy({ userId: "u2" })], "u1", false);
    expect(res.ok).toBe(false);
  });

  it("rejects a bare-id claim against an existing game: row for the same character", () => {
    const existing = [modern({ userId: "u2" })];
    const res = validateCharacters(existing, [modern({ userId: "u2" }), legacy({ userId: "u1" })], "u1", false);
    expect(res.ok).toBe(false);
  });

  it("still allows the owner to save their own roster back", () => {
    const res = validateCharacters([modern()], [modern()], "u1", false);
    expect(res.ok).toBe(true);
    expect((res as any).value).toHaveLength(1);
  });

  it("keeps a foreign character untouched instead of letting a forged copy land", () => {
    const existing = [modern({ userId: "u2", name: "Theirs" })];
    const res = validateCharacters(existing, [modern({ userId: "u2", name: "Forged" })], "u1", false);
    expect(res.ok).toBe(true);
    expect((res as any).value[0].name).toBe("Theirs");
  });

  it("still refuses to add a character on someone else's behalf", () => {
    const res = validateCharacters([], [modern({ userId: "u2" })], "u1", false);
    expect(res.ok).toBe(false);
  });

  it("still refuses to delete another account's character", () => {
    const res = validateCharacters([modern({ userId: "u2" })], [], "u1", false);
    expect(res.ok).toBe(false);
  });

  it("distinct characters are fine", () => {
    const res = validateCharacters(
      [],
      [modern(), modern({ id: `game:${OTHER_ID}` })],
      "u1",
      false
    );
    expect(res.ok).toBe(true);
    expect((res as any).value).toHaveLength(2);
  });
});

describe("validateCharacters — Global only", () => {
  const taiwan = (over: Record<string, any> = {}) => ({
    id: `game:${CHAR_ID}`,
    userId: "u1",
    region: "tw",
    ...over,
  });

  it("drops a Taiwan character", () => {
    const res = validateCharacters([], [taiwan()], "u1", false);
    expect(res.ok).toBe(true);
    expect((res as any).value).toEqual([]);
  });

  it("drops Taiwan characters even for an admin — it is cleanliness, not permission", () => {
    const res = validateCharacters([], [taiwan()], "admin", true);
    expect(res.ok).toBe(true);
    expect((res as any).value).toEqual([]);
  });

  it("drops KR rows too", () => {
    const res = validateCharacters([], [modern({ region: "kr" })], "u1", false);
    expect((res as any).value).toEqual([]);
  });

  it("keeps Global rows and ignores case", () => {
    const res = validateCharacters([], [modern({ region: "GLOBAL" })], "u1", false);
    expect((res as any).value).toHaveLength(1);
  });

  it("keeps pre-region site rows that were never region-scoped", () => {
    const res = validateCharacters([], [{ id: "site-1", userId: "u1" }], "u1", false);
    expect((res as any).value).toHaveLength(1);
  });

  it("a purge is not blocked by a client echoing the old roster back", () => {
    const existing = [taiwan({ userId: "u2" })];
    const res = validateCharacters(existing, [taiwan({ userId: "u2" })], "u1", false);
    expect(res.ok).toBe(true);
    expect((res as any).value).toEqual([]);
  });

  it("one leftover Taiwan row does not block an unrelated save", () => {
    // `saveVerifiedCharacterEntry` posts the whole public roster back, so a
    // non-global row owned by somebody else used to fail every write on the site.
    const existing = [taiwan({ userId: "u2" }), modern({ userId: "u2" })];
    const res = validateCharacters(existing, [modern({ userId: "u2" })], "u1", false);
    expect(res.ok).toBe(true);
    const value = (res as any).value as any[];
    expect(value.map((c) => c.id)).toEqual([`game:${CHAR_ID}`]);
  });
});

describe("non-Global characters disappear on read too", () => {
  it("drops Taiwan and KR rows from a published roster", () => {
    const view = publicDataView({
      characters: [
        { id: "game:a", region: "global" },
        { id: "game:b", region: "tw" },
        { id: "game:c", region: "KR" },
        { id: "site-1" },
      ],
    });
    expect((view.characters as any[]).map((c) => c.id)).toEqual(["game:a", "site-1"]);
  });

  it("keeps other keys untouched", () => {
    const view = publicDataView({ lobbies: [{ id: "l1" }], characters: [] });
    expect(view.lobbies).toHaveLength(1);
  });

  it("a non-array is handled without throwing", () => {
    expect(dropNonGlobalCharacters(undefined)).toEqual([]);
    expect(dropNonGlobalCharacters(null)).toEqual([]);
  });
});
