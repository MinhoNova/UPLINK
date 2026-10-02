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
