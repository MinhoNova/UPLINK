import { describe, it, expect, vi } from "vitest";
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
