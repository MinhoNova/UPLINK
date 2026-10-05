import { describe, it, expect, vi, afterEach } from "vitest";
import { myLinkedCharacters, gameCharIdOf, toStoredCharacter } from "@/lib/characterStore";

/**
 * Regression: "there are two My Characters in the list".
 *
 * `toStoredCharacter` writes `id: "game:<characterId>"`, but an older build
 * stored the bare `<characterId>`. Both rows belong to the same account and
 * both filters — `myLinkedCharacters` and the inline one in `MyProfileClient` —
 * matched on `userId` only, so the same in-game character was drawn twice.
 *
 * The duplicate is not cosmetic: the legacy row carries no `portraitUrl`, so
 * the list showed one card with a face and one blank card for one character.
 */

const CHAR_ID = "A1pIWbd0UKoTYJ2XbL_Cw57uCNxoM4sk4CUqtC5yJ0E=";
const HOST = "https://profileimg.plaync.com/game_profile_images/aion2/images?gameServerKey=1007&charKey=1";
const PROXY = `/api/aion2/portrait?u=${encodeURIComponent(HOST)}&v=2`;

const modern = (over: Record<string, any> = {}) => ({
  id: `game:${CHAR_ID}`,
  userId: "u1",
  name: "Zerath",
  aionClass: "dps",
  serverId: 1007,
  portraitUrl: PROXY,
  verifiedAt: 2_000,
  ...over,
});

/** The pre-`game:` row: bare id, no portrait, older stamp. */
const legacy = (over: Record<string, any> = {}) => ({
  id: CHAR_ID,
  userId: "u1",
  name: "Zerath",
  aionClass: "dps",
  serverId: 1007,
  portraitUrl: "",
  verifiedAt: 1_000,
  ...over,
});

describe("myLinkedCharacters", () => {
  it("collapses a legacy row and a game: row for the same character", () => {
    expect(myLinkedCharacters([modern(), legacy()], "u1")).toHaveLength(1);
    expect(myLinkedCharacters([legacy(), modern()], "u1")).toHaveLength(1);
  });

  it("keeps the row that actually has a portrait", () => {
    const kept = myLinkedCharacters([legacy(), modern()], "u1");
    expect(kept[0].portraitUrl).toBe(PROXY);
  });

  it("keeps the most recently verified row when neither has a portrait", () => {
    const kept = myLinkedCharacters(
      [legacy({ verifiedAt: 1_000 }), modern({ portraitUrl: "", verifiedAt: 5_000 })],
      "u1"
    );
    expect(kept).toHaveLength(1);
    expect(kept[0].verifiedAt).toBe(5_000);
  });

  it("still shows genuinely different characters side by side", () => {
    const other = modern({ id: "game:OTHER", name: "Second", portraitUrl: `${PROXY}b` });
    expect(myLinkedCharacters([modern(), other], "u1")).toHaveLength(2);
  });

  it("never leaks another account's characters", () => {
    expect(myLinkedCharacters([modern(), modern({ id: "game:X", userId: "u2" })], "u1")).toHaveLength(1);
  });

  it("keeps rows with no resolvable character id visible and removable", () => {
    const orphan = { id: "orphan-1", userId: "u1", name: "No id" };
    expect(myLinkedCharacters([orphan], "u1")).toEqual([orphan]);
  });

  it("preserves the original ordering", () => {
    const a = modern({ id: "game:A" });
    const b = modern({ id: "game:B" });
    expect(myLinkedCharacters([a, b], "u1").map((c: any) => c.id)).toEqual(["game:A", "game:B"]);
  });

  it("gameCharIdOf resolves both id shapes to the same character", () => {
    expect(gameCharIdOf(modern())).toBe(CHAR_ID);
    expect(gameCharIdOf(legacy())).toBe(CHAR_ID);
  });

  it("toStoredCharacter mints the game: id the dedupe relies on", () => {
    const stored = toStoredCharacter(
      {
        characterId: CHAR_ID,
        name: "Zerath",
        siteClass: "dps",
        gameClassLabel: "Warlord",
        level: 65,
        combatPower: 1,
        itemLevel: 700,
        serverId: 1007,
        serverName: "Kpq",
        raceId: 2,
        raceName: "Asmodians",
        portraitUrl: HOST,
        region: "global",
        verifiedAt: 2_000,
      } as any,
      "u1"
    );
    expect(stored.id).toBe(`game:${CHAR_ID}`);
    expect(stored.portraitUrl).toBe(PROXY);
  });

  it("does not mistake a plain site character for a game character", () => {
    const siteChar = { id: "b7f1c0de-1111-2222-3333-444455556666", userId: "u1", region: "us" };
    expect(gameCharIdOf(siteChar)).toBe("");
    expect(myLinkedCharacters([siteChar], "u1")).toEqual([siteChar]);
  });

  it("re-saving over a legacy row yields exactly one row, with a portrait", async () => {
    const { saveVerifiedCharacterEntry } = await import("@/lib/characterStore");
    const fetchMock = vi.fn(async (input: any) => {
      const url = String(input);
      if (url.includes("/api/public-data")) {
        return new Response(JSON.stringify({ characters: [legacy(), modern()] }), {
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetchMock);
    // `writeCharacters` announces the write with a `data-refresh` DOM event; the
    // node environment has no window, and the throw would be swallowed into a
    // misleading `{ ok: false }`.
    vi.stubGlobal("window", { dispatchEvent: () => true });

    const res = await saveVerifiedCharacterEntry(
      {
        characterId: CHAR_ID,
        name: "Zerath",
        siteClass: "dps",
        gameClassLabel: "Warlord",
        level: 65,
        combatPower: 1,
        itemLevel: 700,
        serverId: 1007,
        serverName: "Kpq",
        raceId: 2,
        raceName: "Asmodians",
        portraitUrl: HOST,
        region: "global",
        verifiedAt: 9_000,
      } as any,
      "u1"
    );

    expect(res.ok).toBe(true);
    const post = fetchMock.mock.calls.find((c: any) => String(c[0]).includes("/api/data"));
    const written = JSON.parse(String((post as any)[1].body)).characters as any[];
    expect(written).toHaveLength(1);
    expect(written[0].id).toBe(`game:${CHAR_ID}`);
    expect(written[0].portraitUrl).toBe(PROXY);
    vi.unstubAllGlobals();
  });
});

/**
 * "Update Characters" refreshes a whole page of rows at once.
 *
 * `characters` is a single blob, so the naive loop costs one full-roster
 * rewrite per character — N reads, N writes, and each write invalidates the
 * public cache for every reader on the site. Collecting first and writing once
 * also makes the refresh atomic: a partial failure mid-loop cannot leave half
 * the page updated against a roster the caller did not ask for.
 */
describe("saveVerifiedCharacterEntries", () => {
  const SECOND = "B2qWeRtYuIoP0987654321zZxXwVvUuTtS=";

  const stub = (characters: any[]) => {
    const fetchMock = vi.fn(async (input: any) => {
      const url = String(input);
      if (url.includes("/api/public-data")) {
        return new Response(JSON.stringify({ characters }), {
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "content-type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { dispatchEvent: () => true });
    return fetchMock;
  };

  const vc = (characterId: string, over: Record<string, any> = {}) =>
    ({
      characterId,
      name: "Zerath",
      siteClass: "dps",
      gameClassLabel: "Warlord",
      level: 65,
      combatPower: 1,
      itemLevel: 700,
      serverId: 1007,
      serverName: "Kpq",
      raceId: 2,
      raceName: "Asmodians",
      portraitUrl: HOST,
      region: "global",
      verifiedAt: 9_000,
      ...over,
    }) as any;

  const writtenOf = (fetchMock: any) => {
    const posts = fetchMock.mock.calls.filter((c: any) => String(c[0]).includes("/api/data"));
    return JSON.parse(String(posts[posts.length - 1][1].body)).characters as any[];
  };

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("updates every row in a single write", async () => {
    const { saveVerifiedCharacterEntries } = await import("@/lib/characterStore");
    const fetchMock = stub([
      modern({ verifiedAt: 1, itemLevel: 700 }),
      { ...modern({ id: `game:${SECOND}` }), verifiedAt: 1, itemLevel: 700 },
      // Somebody else's row, which must survive untouched.
      { ...modern({ id: "game:other", userId: "u2" }), name: "Theirs" },
    ]);

    const res = await saveVerifiedCharacterEntries(
      [vc(CHAR_ID, { itemLevel: 999, verifiedAt: 9_000 }), vc(SECOND, { itemLevel: 1111, verifiedAt: 9_000 })],
      "u1"
    );

    expect(res.ok).toBe(true);
    // One read, one write — not one of each per character.
    const posts = fetchMock.mock.calls.filter((c: any) => String(c[0]).includes("/api/data"));
    expect(posts).toHaveLength(1);
    const written = writtenOf(fetchMock);
    expect(written).toHaveLength(3);
    const mine = written.filter((c) => c.userId === "u1");
    expect(mine.map((c) => c.itemLevel).sort((a, b) => a - b)).toEqual([999, 1111]);
    expect(written.find((c) => c.userId === "u2")?.name).toBe("Theirs");
  });

  it("a row not in the refresh set is carried through unchanged", async () => {
    const { saveVerifiedCharacterEntries } = await import("@/lib/characterStore");
    const stubbed = stub([
      { ...modern({ verifiedAt: 1 }), itemLevel: 700 },
      { ...modern({ id: `game:${SECOND}` }), verifiedAt: 1, itemLevel: 700 },
    ]);

    await saveVerifiedCharacterEntries([vc(CHAR_ID, { itemLevel: 999 })], "u1");

    const written = writtenOf(stubbed);
    expect(written.find((c) => c.id === `game:${SECOND}`)?.itemLevel).toBe(700);
    expect(written.find((c) => c.id === `game:${CHAR_ID}`)?.itemLevel).toBe(999);
  });

  it("still collapses duplicate copies of the same character", async () => {
    const { saveVerifiedCharacterEntries } = await import("@/lib/characterStore");
    // Both the modern and the legacy spelling of the same character.
    const stubbed = stub([modern({ verifiedAt: 1 }), legacy({ verifiedAt: 1 }), { id: "site-1", userId: "u1" }]);

    await saveVerifiedCharacterEntries([vc(CHAR_ID, { itemLevel: 999 })], "u1");

    const written = writtenOf(stubbed);
    expect(written.filter((c) => c.id === `game:${CHAR_ID}`)).toHaveLength(1);
    expect(written.map((c) => c.id)).toContain("site-1");
  });

  it("does not touch a character belonging to another account", async () => {
    const { saveVerifiedCharacterEntries } = await import("@/lib/characterStore");
    const stubbed = stub([modern({ userId: "u2", name: "Theirs", verifiedAt: 1 })]);

    await saveVerifiedCharacterEntries([vc(CHAR_ID, { name: "Forged" })], "u1");

    expect(writtenOf(stubbed)[0].name).toBe("Theirs");
  });

  it("an empty set writes nothing at all", async () => {
    const { saveVerifiedCharacterEntries } = await import("@/lib/characterStore");
    const fetchMock = stub([modern()]);
    const res = await saveVerifiedCharacterEntries([], "u1");
    expect(res.ok).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
