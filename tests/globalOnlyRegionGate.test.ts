import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseCharacterShareUrl, isNonGlobalRegionLink } from "@/lib/aion2GameApi";
import { dropNonGlobalCharacters } from "@/lib/publicDataView";

/**
 * The site is Global-only.
 *
 * `parseCharacterShareUrl` read the path but ignored `?region=` entirely, so a
 * Taiwan or Korea share link parsed exactly like a Global one. Combined with a
 * build that did not gate on region, that is how non-Global characters got into
 * the roster in the first place — and they were never removed.
 */

const read = (p: string) => readFileSync(join(process.cwd(), "src", p), "utf8");

const CID = "A1pIWbd0UKoTYJ2XbL_Cw57uCNxoM4sk4CUqtC5yJ0E=";

describe("non-Global share links are refused", () => {
  it("flags the other regions", () => {
    for (const region of ["tw", "kr", "jp", "cn"]) {
      expect(isNonGlobalRegionLink(`https://aion2.plaync.com/characters/1007/${CID}?region=${region}`)).toBe(true);
    }
  });

  it("accepts Global, in every spelling the site emits", () => {
    for (const region of ["nae", "global", "na"]) {
      expect(isNonGlobalRegionLink(`https://aion2.plaync.com/characters/1007/${CID}?region=${region}`)).toBe(false);
    }
    // No region at all is the bare share link; it is verified as Global.
    expect(isNonGlobalRegionLink(`https://aion2.plaync.com/characters/1007/${CID}`)).toBe(false);
  });

  it("catches a region hidden as a path segment", () => {
    expect(isNonGlobalRegionLink(`https://aion2.plaync.com/tw/characters/1007/${CID}`)).toBe(true);
  });

  it("parseCharacterShareUrl rejects a Taiwan link outright", () => {
    expect(parseCharacterShareUrl(`https://aion2.plaync.com/characters/1007/${encodeURIComponent(CID)}?region=tw`)).toBeNull();
  });

  it("parseCharacterShareUrl still accepts a Global link", () => {
    const ref = parseCharacterShareUrl(
      `https://aion2.plaync.com/characters/1007/${encodeURIComponent(CID)}?region=nae`
    );
    expect(ref).toEqual({ serverId: 1007, characterId: CID });
  });

  it("a garbage link is not mistaken for a non-Global one", () => {
    expect(isNonGlobalRegionLink("not a url")).toBe(false);
  });
});

describe("non-Global characters are purged from storage on an ordinary read", () => {
  it("/api/data drops them and rewrites the blob", () => {
    const route = read("app/api/data/route.ts");
    expect(route).toMatch(/dropNonGlobalCharacters/);
    // A read-side filter alone would hide the rows forever; they have to be
    // written back to actually leave the database.
    expect(route).toMatch(/setKV\(\s*['"]characters['"]\s*,\s*globalOnly\s*\)/);
  });

  it("the purge runs before the roster is served", () => {
    const route = read("app/api/data/route.ts");
    // Anchor on the call site, not the import.
    const purge = route.indexOf("const globalOnly = dropNonGlobalCharacters");
    const served = route.indexOf("const scoped = filterDataForUser");
    expect(purge).toBeGreaterThan(-1);
    expect(served).toBeGreaterThan(-1);
    expect(purge).toBeLessThan(served);
  });

  it("the thread blob is filtered too", () => {
    expect(read("lib/offerThread.ts")).toMatch(/dropNonGlobalCharacters/);
  });

  it("Taiwan and KR rows are the ones removed", () => {
    const kept = dropNonGlobalCharacters<any>([
      { id: "a", region: "global" },
      { id: "b", region: "tw" },
      { id: "c", region: "kr" },
      { id: "d" },
      { id: "e", region: "TWN" },
    ]);
    expect(kept.map((c) => c.id)).toEqual(["a", "d"]);
  });
});

describe("My Characters page layout and the duplicate button", () => {
  it("the page clears the fixed h-24 navbar", () => {
    const client = read("app/my-characters/MyCharactersClient.tsx");
    expect(client).toMatch(/pt-32 sm:pt-36/);
    expect(client).not.toMatch(/px-4 pt-8 pb-24/);
  });

  it("My Profile no longer sends people to the duplicate list", () => {
    const profile = read("app/my-profile/MyProfileClient.tsx");
    // The section already renders every linked character inline, so the
    // "Manage" jump was a second route to the same list.
    expect(profile).not.toMatch(/>\s*Manage\s*</);
    // The empty state keeps its link button — there is nothing to show inline.
    expect(profile).toMatch(/Link your first character/);
  });

  it("the dedicated page still exists for linking and re-verifying", () => {
    expect(read("app/my-characters/MyCharactersClient.tsx")).toMatch(/resolve/);
    expect(read("app/my-characters/MyCharactersClient.tsx")).toMatch(/refreshChar/);
  });
});
