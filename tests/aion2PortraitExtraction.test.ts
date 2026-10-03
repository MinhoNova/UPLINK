import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchGameCharacterProfile } from "@/lib/aion2GameApi";

/**
 * Regression: no in-game portrait appeared anywhere on the site.
 *
 * The upstream `/api/character/info` is undocumented. It answers 200 with a
 * fully-nulled `profile` skeleton for a character it does not know, and it has
 * shipped the portrait under `profileImage` *and* other spellings. The mapping
 * read exactly one key, so any rename silently produced `portraitUrl: null` and
 * every screen fell back to the class crest / site avatar.
 *
 * `pickPortraitUrl` now tries the known spellings and then sweeps the payload
 * for any allowlisted `profileimg.plaync.com/game_profile_images/` URL.
 */

const PORTRAIT_HOST_URL =
  "https://profileimg.plaync.com/game_profile_images/aion2/images?gameServerKey=1007&charKey=42";

function baseProfile(over: Record<string, any> = {}) {
  return {
    characterId: "42",
    characterName: "Zerath",
    characterLevel: 65,
    className: "Warlord",
    combatPower: 123_456,
    genderName: "Female",
    raceId: 2,
    raceName: "Asmodians",
    serverId: 1007,
    serverName: "Kpq",
    ...over,
  };
}

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
  vi.restoreAllMocks();
});

function mockCharacterPayload(payload: any) {
  globalThis.fetch = vi.fn(async () =>
    new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "content-type": "application/json" },
    })
  ) as unknown as typeof fetch;
}

describe("fetchGameCharacterProfile portrait extraction", () => {
  it("reads the documented profileImage key", async () => {
    mockCharacterPayload({ profile: baseProfile({ profileImage: PORTRAIT_HOST_URL }) });
    const c = await fetchGameCharacterProfile("42", 1007);
    expect(c?.portraitUrl).toBe(PORTRAIT_HOST_URL);
  });

  it("still finds the portrait when the field is renamed", async () => {
    mockCharacterPayload({ profile: baseProfile({ profileImg: PORTRAIT_HOST_URL }) });
    const c = await fetchGameCharacterProfile("42", 1007);
    expect(c?.portraitUrl).toBe(PORTRAIT_HOST_URL);
  });

  it("finds the portrait nested elsewhere in the payload", async () => {
    mockCharacterPayload({
      profile: baseProfile(),
      media: { gallery: [{ thumbnail: PORTRAIT_HOST_URL }] },
    });
    const c = await fetchGameCharacterProfile("42", 1007);
    expect(c?.portraitUrl).toBe(PORTRAIT_HOST_URL);
  });

  it("leaves portraitUrl null when the payload has none", async () => {
    mockCharacterPayload({ profile: baseProfile({ profileImage: null }) });
    const c = await fetchGameCharacterProfile("42", 1007);
    expect(c?.portraitUrl).toBeNull();
  });

  it("never accepts a portrait from a non-plaync host", async () => {
    mockCharacterPayload({
      profile: baseProfile({ profileImage: "https://evil.example.com/a.jpg" }),
      more: { deep: "https://evil.example.com/b.jpg" },
    });
    const c = await fetchGameCharacterProfile("42", 1007);
    expect(c?.portraitUrl).toBeNull();
  });

  it("rejects the all-null skeleton the API returns for an unknown character", async () => {
    mockCharacterPayload({
      profile: {
        characterId: null,
        characterName: null,
        profileImage: null,
        serverName: "",
      },
    });
    expect(await fetchGameCharacterProfile("42", 1007)).toBeNull();
  });
});

/**
 * Captured verbatim from the live Global API for a real character:
 *   GET https://aion2.plaync.com/api/character/info
 *       ?lang=en&characterId=rKx-d-9c8YwO5HqimeieGA7mjJf0yE5iSkcWffjVu6o%3D
 *       &serverId=1101&region=nae
 *
 * This is the shape every Global character actually returns, so it is the test
 * that matters -- the synthetic fixtures above all guessed the field layout.
 *
 * Two facts were only discoverable from a real character:
 *
 *  1. The path is `game_profile_images/aion2global/`, not `aion2/`. The `aion2/`
 *     form belongs to the KR image host and returns a 9,594-byte PNG
 *     placeholder for keys Global does not own.
 *  2. `charKey` is NOT the characterId. The characterId is an opaque base64
 *     string ("rKx-d-...kWffjVu6o=") while `charKey` is numeric
 *     (309903949359131652). Nothing can be synthesised locally: the URL has to be
 *     taken verbatim from `profileImage`.
 *
 * The image itself answers 200 / image/jpeg / 31,291 bytes.
 */
describe("real Global payload (captured from the live API)", () => {
  const CHARACTER_ID = "rKx-d-9c8YwO5HqimeieGA7mjJf0yE5iSkcWffjVu6o=";
  const PROFILE_IMAGE =
    "https://profileimg.plaync.com/game_profile_images/aion2global/images?gameServerKey=1101&charKey=309903949359131652";

  function realGlobalPayload() {
    return {
      profile: {
        characterId: CHARACTER_ID,
        characterLevel: 45,
        characterName: "Linda",
        className: "Templar",
        combatPower: 39984,
        gender: 2,
        genderName: "Female",
        pcId: 10,
        profileImage: PROFILE_IMAGE,
        raceId: 1,
        raceName: "Elyos",
        // Empty string, not "nae" -- so the Global region check must not
        // require a truthy regionName or real characters would be rejected.
        regionName: "",
        serverId: 1101,
        serverName: "Siel",
        titleGrade: "Rare",
        titleId: 13030001,
        titleName: "Verteron Cartographer",
      },
      stat: { statList: [{ name: "Might", type: "STR", value: 25 }] },
      title: { ownedCount: 36, titleList: null },
      ranking: { rankingList: null },
      daevanion: { boardList: null },
    };
  }

  it("resolves to a full profile with the portrait attached", async () => {
    mockCharacterPayload(realGlobalPayload());
    const c = await fetchGameCharacterProfile(CHARACTER_ID, 1101);
    expect(c).not.toBeNull();
    expect(c?.name).toBe("Linda");
    expect(c?.portraitUrl).toBe(PROFILE_IMAGE);
    expect(c?.level).toBe(45);
    expect(c?.serverName).toBe("Siel");
  });

  it("accepts the aion2global image path through the allowlist", async () => {
    // The allowlist pins the `/game_profile_images/` prefix, which both the KR
    // (`aion2/`) and Global (`aion2global/`) hosts sit under. Pinning the exact
    // `aion2/` segment instead would have silently rejected every real portrait.
    mockCharacterPayload(realGlobalPayload());
    const c = await fetchGameCharacterProfile(CHARACTER_ID, 1101);
    const u = new URL(c!.portraitUrl!);
    expect(u.hostname).toBe("profileimg.plaync.com");
    expect(u.pathname.startsWith("/game_profile_images/")).toBe(true);
    expect(u.searchParams.get("gameServerKey")).toBe("1101");
    expect(u.searchParams.get("charKey")).toBe("309903949359131652");
  });

  it("takes the charKey from the payload rather than the characterId", async () => {
    mockCharacterPayload(realGlobalPayload());
    const c = await fetchGameCharacterProfile(CHARACTER_ID, 1101);
    const charKey = new URL(c!.portraitUrl!).searchParams.get("charKey");
    expect(charKey).not.toBe(CHARACTER_ID);
    expect(charKey).toMatch(/^\d+$/);
  });
});
