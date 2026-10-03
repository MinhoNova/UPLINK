import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Regression: characters linked before the portrait feature kept a blank face
 * forever.
 *
 * `toStoredCharacter` is the only writer of `portraitUrl`, it only runs from
 * `saveVerifiedCharacterEntry`, and that only runs when someone pastes a
 * character link. A row saved with `portraitUrl: ""` therefore never picks one
 * up — so fixing the upstream mapping fixed new links only, and every
 * pre-existing character kept rendering the class crest on My Profile, My
 * Characters and in every squad card.
 *
 * The fix needs two halves: a way to re-verify a stored character from its
 * own `characterId`/`serverId`, and a control that triggers it.
 */

const root = join(process.cwd(), "src");
const read = (p: string) => readFileSync(join(root, p), "utf8");

describe("stored character portrait backfill", () => {
  it("the resolve route can re-verify from stored ids, not just a pasted link", () => {
    const route = read("app/api/aion2/resolve/route.ts");
    expect(route).toMatch(/export async function PUT/);
    expect(route).toMatch(/fetchGameCharacterProfile/);
    // A link is a per-account claim; a refresh must not hand back a character
    // that belongs to somebody else.
    expect(route).toMatch(/findCharacterLink/);
  });

  it("re-verifying requires a session", () => {
    const route = read("app/api/aion2/resolve/route.ts");
    const put = route.slice(route.indexOf("export async function PUT"));
    expect(put).toMatch(/requireSession/);
  });

  it("My Characters exposes the refresh control for portrait-less rows", () => {
    const client = read("app/my-characters/MyCharactersClient.tsx");
    expect(client).toMatch(/refreshChar/);
    expect(client).toMatch(/method: "PUT"/);
    // Guarded on the missing portrait so it is not just permanent UI noise.
    expect(client).toMatch(/\{!c\.portraitUrl &&/);
  });

  it("the refresh uses the stored game character id, not the row id", () => {
    const client = read("app/my-characters/MyCharactersClient.tsx");
    expect(client).toMatch(/characterId: gameCharIdOf\(c\), serverId: Number\(c\.serverId\)/);
  });

  it("an empty portrait never becomes a non-empty proxy path", () => {
    expect(read("lib/characterStore.ts")).toMatch(
      /portraitUrl: portraitProxyPath\(vc\.portraitUrl \|\| ""\)/
    );
  });
});

/**
 * `findCharacterLink` is the pre-save guard that answers "this character is
 * already linked to another account". It matched only the current
 * `game:<characterId>` spelling, so a row written before that prefix existed
 * (`id: "<characterId>"`, no `characterId`/`gameCharacterId` field) was invisible
 * to it -- the guard stayed silent and a second account could claim the same
 * character. The server-side `validateCharacters` gate catches it on write; this
 * is about the check reporting correctly instead of pretending the id is free.
 */
describe("findCharacterLink resolves legacy rows", () => {
  const CHARACTER_ID = "rKx-d-9c8YwO5HqimeieGA7mjJf0yE5iSkcWffjVu6o=";

  // What a real legacy game row looked like: the character id as its own `id`,
  // no `game:` prefix, but every field `saveVerifiedCharacterEntry` had written
  // alongside it.
  const legacyGameRow = (userId: string) => ({
    id: CHARACTER_ID,
    userId,
    region: "global",
    gameClassLabel: "templar",
    serverId: 1101,
    serverName: "Siel",
    verifiedAt: "2026-01-01T00:00:00.000Z",
    portraitUrl: "",
  });

  function withStoredCharacters(rows: any[]) {
    vi.resetModules();
    vi.doMock("@/lib/db", () => ({
      getKV: vi.fn(async (k: string) => (k === "characters" ? rows : undefined)),
      setKV: vi.fn(async () => {}),
    }));
    return import("@/lib/aion2Uniqueness");
  }

  afterEach(() => {
    vi.doUnmock("@/lib/db");
    vi.resetModules();
  });

  it("finds a modern game: row", async () => {
    const mod = await withStoredCharacters([
      { id: `game:${CHARACTER_ID}`, userId: "u1" },
    ]);
    expect((await mod.findCharacterLink(CHARACTER_ID))?.userId).toBe("u1");
  });

  it("finds a legacy bare-id row", async () => {
    // The guard matched only `id === "game:<characterId>"` before, so this row
    // was invisible and the "already linked" answer never fired for it.
    const mod = await withStoredCharacters([legacyGameRow("u2")]);
    expect((await mod.findCharacterLink(CHARACTER_ID))?.userId).toBe("u2");
  });

  it("finds a legacy row that kept an explicit characterId", async () => {
    const mod = await withStoredCharacters([
      { id: "row-1", characterId: CHARACTER_ID, userId: "u3" },
    ]);
    expect((await mod.findCharacterLink(CHARACTER_ID))?.userId).toBe("u3");
  });

  it("does not treat a metadata-free bare id as a game character", async () => {
    // Site characters also store a bare string in `id`. With no region, no class
    // and no verifiedAt there is nothing to distinguish them from a game row, so
    // matching on the bare id alone would make this guard claim unrelated site
    // rows and reject valid links as "already linked".
    const mod = await withStoredCharacters([
      { id: CHARACTER_ID, userId: "u4" },
    ]);
    expect(await mod.findCharacterLink(CHARACTER_ID)).toBeNull();
  });

  it("does not confuse an unlinked character with an empty id", async () => {
    const mod = await withStoredCharacters([
      { id: "site-abc", userId: "u5" },
      { id: `game:other`, userId: "u6" },
    ]);
    expect(await mod.findCharacterLink(CHARACTER_ID)).toBeNull();
    expect(await mod.findCharacterLink("")).toBeNull();
  });
});
