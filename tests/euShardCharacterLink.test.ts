import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  aion2GameRegionFor,
  aion2RegionFromGameRegion,
  aion2CharacterInfoUrl,
  aion2CharacterEquipmentUrl,
  aion2CharacterPageUrl,
  isSupportedGlobalRegion,
} from "@/lib/aion2ClassIds";
import { fetchGameCharacterProfile } from "@/lib/aion2GameApi";
import { validateCharacters } from "@/lib/secureDataWrite";
import { dropNonGlobalCharacters, publicDataView } from "@/lib/publicDataView";

/**
 * EU characters could not be linked at all.
 *
 * The global release runs on more than one shard code, and `aion2.plaync.com`
 * serves `/api/character/info` differently per shard: for the *same* character
 * it returns a fully populated profile under `eu` and a **200 with an entirely
 * empty `profile`** under `nae`. It never 404s the mismatch, so the site — which
 * pinned every call to `nae` — read "empty profile" as "Character not found" and
 * refused the link.
 *
 * Three separate gates had to change for an EU character to survive a round
 * trip: the API call, the write gate, and the read-side purge. Any one of them
 * still saying "global only" reintroduces the same failure silently.
 *
 * Verified against the live API for a real EU character (server 1302):
 *   region=nae -> 200, 449 bytes,  profile.characterId === null
 *   region=eu  -> 200, 3975 bytes, profile.characterName populated
 */

const CID = "5Ld-L4slCNU8JB2OIV-C-VxEZNAl9Idu14AZR_hGMG8=";
const read = (p: string) => readFileSync(join(process.cwd(), "src", p), "utf8");

afterEach(() => {
  vi.unstubAllGlobals();
});

/** A populated profile, shaped like the live payload for a EU character. */
const euProfile = (characterId: string, name: string) => ({
  profile: {
    characterId,
    characterName: name,
    characterLevel: 45,
    className: "Spiritmaster",
    combatPower: 123456,
    raceId: 1,
    raceName: "Ariel",
    regionName: "",
    serverId: 1302,
    serverName: "Nezekan",
    genderName: "Female",
    profileImage: "",
  },
  stat: { statList: [{ type: "itemlevel", value: 78 }] },
});

describe("shard code selection", () => {
  it("EU characters query the EU shard, everyone else the NA/global one", () => {
    expect(aion2GameRegionFor("eu")).toBe("eu");
    expect(aion2GameRegionFor("EU")).toBe("eu");
    expect(aion2GameRegionFor("europe")).toBe("eu");
    expect(aion2GameRegionFor("na")).toBe("nae");
    expect(aion2GameRegionFor("global")).toBe("nae");
    expect(aion2GameRegionFor("")).toBe("nae");
    expect(aion2GameRegionFor(null)).toBe("nae");
  });

  it("a retired shard never gets a queryable code", () => {
    for (const gone of ["kr", "tw", "jp", "cn"]) {
      expect(aion2GameRegionFor(gone)).toBe("nae");
      expect(isSupportedGlobalRegion(gone)).toBe(false);
    }
  });

  it("maps a stored row back to the region it verified on", () => {
    expect(aion2RegionFromGameRegion("eu")).toBe("eu");
    expect(aion2RegionFromGameRegion("nae")).toBe("na");
    expect(aion2RegionFromGameRegion("")).toBe("na");
  });
});

describe("every character URL carries the character's own shard", () => {
  it("the API calls do not pin the region", () => {
    expect(aion2CharacterInfoUrl(CID, 1302, "eu")).toContain("region=eu");
    expect(aion2CharacterInfoUrl(CID, 1302)).toContain("region=nae");
    expect(aion2CharacterEquipmentUrl(CID, 1302, "eu")).toContain("region=eu");
    expect(aion2CharacterEquipmentUrl(CID, 1302)).toContain("region=nae");
  });

  it("the official page link does not pin it either", () => {
    // `/character?u=` re-reads this URL to fetch the live data, so a `nae`
    // profile link gave every EU character an empty profile page.
    expect(aion2CharacterPageUrl(1302, CID, "eu")).toContain("region=eu");
    expect(aion2CharacterPageUrl(1302, CID, "global")).toContain("region=nae");
  });

  it("every Full Profile call site forwards the stored region", () => {
    const sites = [
      "app/character/page.tsx",
      "app/my-characters/MyCharactersClient.tsx",
      "app/player/[handle]/page.tsx",
      "components/aion2/LobbyPage.tsx",
      "components/modals/ManageModal.tsx",
    ];
    for (const f of sites) {
      expect(read(f), f).toMatch(/aion2CharacterPageUrl\([^)]*,\s*[^,)]+,\s*[a-z]+\.region\)/);
    }
  });
});

describe("a character resolves on whichever live shard holds it", () => {
  const stubFetch = (byRegion: Record<string, any>) => {
    vi.stubGlobal("fetch", async (url: string) => {
      const region = new URL(url).searchParams.get("region") || "";
      const payload = byRegion[region] ?? { profile: { characterId: null } };
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify(payload),
      } as any;
    });
  };

  it("an EU character verifies when the link says eu", async () => {
    stubFetch({ eu: euProfile(CID, "Amadozoz001") });
    const vc = await fetchGameCharacterProfile(CID, 1302, "eu");
    expect(vc).not.toBeNull();
    expect(vc!.name).toBe("Amadozoz001");
    expect(vc!.serverName).toBe("Nezekan");
    expect(vc!.region).toBe("eu");
    expect(vc!.itemLevel).toBe(78);
  });

  it("the empty nae profile no longer hides an EU character", async () => {
    // The exact live behaviour: `nae` answers 200 with nulls, `eu` with data.
    stubFetch({ nae: { profile: { characterId: null } }, eu: euProfile(CID, "Amadozoz001") });
    const vc = await fetchGameCharacterProfile(CID, 1302, "na");
    expect(vc?.name).toBe("Amadozoz001");
    expect(vc?.region).toBe("eu");
  });

  it("a bare link with no region still finds an EU character", async () => {
    stubFetch({ nae: { profile: { characterId: null } }, eu: euProfile(CID, "Amadozoz001") });
    expect((await fetchGameCharacterProfile(CID, 1302))?.name).toBe("Amadozoz001");
  });

  it("an NA character is unaffected", async () => {
    stubFetch({ nae: euProfile(CID, "SomeoneNA") });
    const vc = await fetchGameCharacterProfile(CID, 1101, "na");
    expect(vc?.name).toBe("SomeoneNA");
    expect(vc?.region).toBe("na");
  });

  it("a character on neither live shard is still not found", async () => {
    stubFetch({});
    expect(await fetchGameCharacterProfile(CID, 9999, "eu")).toBeNull();
  });
});

describe("an EU row survives the write gate and the read purge", () => {
  const euRow = (over: Record<string, any> = {}) => ({
    id: `game:${CID}`,
    userId: "u1",
    region: "eu",
    gameClassLabel: "Spiritmaster",
    serverId: 1302,
    verifiedAt: 1,
    ...over,
  });

  it("is stored, for a member and for an admin", () => {
    expect((validateCharacters([], [euRow()], "u1", false) as any).value).toHaveLength(1);
    expect((validateCharacters([], [euRow()], "admin", true) as any).value).toHaveLength(1);
  });

  it("is not purged on read", () => {
    expect(dropNonGlobalCharacters<any>([euRow()])).toHaveLength(1);
    const view = publicDataView({ characters: [euRow(), { id: "game:tw", region: "tw" }] });
    expect((view.characters as any[]).map((c) => c.id)).toEqual([`game:${CID}`]);
  });

  it("still refuses the retired shards and forged spellings", () => {
    for (const gone of ["tw", "kr", "jp", "cn", "TWN"]) {
      expect(isSupportedGlobalRegion(gone), gone).toBe(false);
      expect((validateCharacters([], [euRow({ region: gone })], "u1", false) as any).value, gone).toEqual([]);
    }
  });

  it("keeps pre-region rows that were never shard-scoped", () => {
    expect((validateCharacters([], [{ id: "site-1", userId: "u1" }], "u1", false) as any).value).toHaveLength(1);
  });

  it("still refuses to add a character on someone else's behalf", () => {
    expect(validateCharacters([], [euRow({ userId: "u2" })], "u1", false).ok).toBe(false);
  });
});

describe("the re-check control sends the stored shard", () => {
  it("the PUT route reads a region off the body", () => {
    const route = read("app/api/aion2/resolve/route.ts");
    expect(route).toMatch(/aion2RegionFromGameRegion\(body\?\.region\)/);
    expect(route).toMatch(/fetchGameCharacterProfile\(characterId, serverId, region\)/);
  });
});