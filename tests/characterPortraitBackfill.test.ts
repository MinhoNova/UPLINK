import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Regression: a stored character was frozen at the moment its link was pasted.
 *
 * `toStoredCharacter` is the only writer of `portraitUrl`, `itemLevel` and
 * `combatPower`, and it only ran when someone pasted a character link. A row
 * therefore never picked up a new value on its own — so a character that gained
 * a level or an upgrade kept rendering its linking-time portrait, item level
 * and combat power on My Characters and in every squad card.
 *
 * The refresh control that existed was scoped to `!c.portraitUrl`, so it only
 * appeared for rows that had never published a portrait — i.e. never, for a
 * character that works. There was no way to update anything.
 *
 * The fix needs two halves: a way to re-verify a stored character from its own
 * `characterId`/`serverId`, and a control that triggers it for every row.
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

  it("My Characters re-checks every row from one control", () => {
    const client = read("app/my-characters/MyCharactersClient.tsx");
    expect(client).toMatch(/updateAllChars/);
    expect(client).toMatch(/method: "PUT"/);
    // Not scoped to portrait-less rows any more. That guard meant the control
    // only existed for characters that had never published a portrait, so a
    // working character — which always has one — had no way to re-read its
    // level, item level or combat power.
    expect(client).not.toMatch(/\{!c\.portraitUrl &&/);
    // The badge that claimed a sync was happening. Nothing synced.
    expect(client).not.toMatch(/mychars_synced/);
    expect(client).not.toMatch(/>\s*Synced\s*</);
  });

it("the refresh uses the stored game character id, not the row id", () => {
    const client = read("app/my-characters/MyCharactersClient.tsx");
    expect(client).toMatch(/characterId: gameCharIdOf\(c\),\s*serverId: Number\(c\.serverId\)/);
    // And the character's own shard, so a re-check of an EU character is not
    // answered with the empty `nae` profile that reads as "Character not found".
    expect(client).toMatch(/region: c\.region \|\| "global"/);
  });

  it("results are collected and written once, not once per character", () => {
    // `characters` is a single blob: saving per character would rewrite the
    // whole roster N times, each invalidating the public cache for every reader.
    const client = read("app/my-characters/MyCharactersClient.tsx");
    // The element type is `SignedVerifiedCharacterEntry` rather than
    // `VerifiedGameCharacter` because each result now travels with the signature
    // the server minted over its stats. The assertion is on there being ONE
    // array declared outside the worker, not on which type describes a row.
    expect(client).toMatch(/const verified: SignedVerifiedCharacterEntry\[\] = \[\]/);
    expect(client).toMatch(/saveVerifiedCharacterEntries\(verified, meId\)/);
    // ...and not from inside the per-character worker. Asserting on the worker's
    // real boundaries matters: an earlier version of this test sliced on a loop
    // header that no longer existed, so `indexOf` returned -1, the slice was one
    // character long, and the assertion passed without ever looking at the file.
    const start = client.indexOf("const worker = async () => {");
    const save = client.indexOf("saveVerifiedCharacterEntries(verified, meId)");
    expect(start).toBeGreaterThan(-1);
    expect(save).toBeGreaterThan(start);
    expect(client.slice(start, save)).not.toMatch(/saveVerifiedCharacterEntries/);
  });

  /**
   * NCSoft's character-info call measures ~1.7-2.1s on the EU shard and ~0.23s
   * on NA, and a cold portrait fetch ~0.7-1.4s. Issued one row after another,
   * three EU characters cost the sum — about six seconds — for work that has no
   * dependency between rows. These two guards are what stop that regressing back
   * into a sequential loop, and back into a refresh that lands new numbers
   * seconds before the face they belong to.
   */
  it("rows are re-verified concurrently, and the fan-out is capped", () => {
    const client = read("app/my-characters/MyCharactersClient.tsx");
    expect(client).toMatch(/await Promise\.all\(/);
    expect(client).toMatch(
      /Array\.from\(\s*\{ length: Math\.min\(UPDATE_CONCURRENCY, targets\.length\) \}/
    );
    // Below the 20-per-minute the resolve route allows per IP — a wider fan-out
    // spends the budget instead of finishing sooner and answers 429.
    expect(client).toMatch(/const UPDATE_CONCURRENCY = \d+/);
    const cap = Number(/const UPDATE_CONCURRENCY = (\d+)/.exec(client)?.[1] || "0");
    expect(cap).toBeGreaterThan(1);
    expect(cap).toBeLessThanOrEqual(20);
  });

  it("portraits start downloading before the data calls return", () => {
    const client = read("app/my-characters/MyCharactersClient.tsx");
    expect(client).toMatch(/new Image\(\)/);
    expect(client).toMatch(/rawPortraitUrlOf\(c\?\.portraitUrl\)/);
    // Warm-up must precede the fan-out, otherwise it just adds to the wait.
    const warm = client.indexOf("new Image()");
    const fanout = client.indexOf("await Promise.all(");
    expect(warm).toBeGreaterThan(-1);
    expect(fanout).toBeGreaterThan(warm);
    // And it must not go through our proxy, which is rate-limited and answers
    // 502 for datacenter egress.
    expect(client.slice(warm, fanout)).not.toMatch(/portraitProxyPath/);
  });

  it("hitting the rate limit stops new rows instead of failing them", () => {
    const client = read("app/my-characters/MyCharactersClient.tsx");
    expect(client).toMatch(/res\.status === 429/);
    // Rows never attempted are counted as throttled, not as broken characters.
    expect(client).toMatch(
      /const throttled = targets\.length - verified\.length - failed\.length/
    );
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
