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

  it("My Profile does not list characters at all", () => {
    const profile = read("app/my-profile/MyProfileClient.tsx");
    // My Profile is identity and presentation; /my-characters is the single
    // place a character is listed, updated and removed. Rendering them in both
    // drew one character twice, with two paths to update it.
    expect(profile).not.toMatch(/Link your first character/);
    expect(profile).not.toMatch(/My Characters/);
    expect(profile).not.toMatch(/myLinkedCharacters/);
    expect(profile).not.toMatch(/CharacterPowerStats/);
    expect(profile).not.toMatch(/\/character\?u=/);
  });

  it("the dedicated page is the only place a character is listed", () => {
    const client = read("app/my-characters/MyCharactersClient.tsx");
    expect(client).toMatch(/resolve/);
    expect(client).toMatch(/updateAllChars/);
  });
});

describe("one My Characters entry, one page", () => {
  const nav = () => read("components/navbar/Navbar.tsx");

  it("the profile menu offers My Characters exactly once", () => {
    const menu = nav().slice(nav().indexOf('role="menu"'));
    const hits = menu.match(/href="\/my-characters"/g) || [];
    expect(hits).toHaveLength(1);
  });

  it("the menu no longer offers a second character page beside it", () => {
    // `/character` has its own paste-a-link box and heading, so next to "My
    // Characters" it read as the same page twice. The route stays — it is the
    // target of every "Full Profile" button.
    const menu = nav().slice(nav().indexOf('role="menu"'));
    expect(menu).not.toMatch(/href="\/character"/);
  });

  it("the Character Profile route still works for every Full Profile link", () => {
    expect(read("app/character/page.tsx")).toContain("Character");
    const users = [
      "app/my-characters/MyCharactersClient.tsx",
      "app/player/[handle]/page.tsx",
      "components/aion2/LobbyPage.tsx",
      "components/modals/ManageModal.tsx",
    ];
    for (const f of users) {
      expect(read(f)).toMatch(/\/character\?u=/);
    }
  });
});
