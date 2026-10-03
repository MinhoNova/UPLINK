import { describe, it, expect } from "vitest";
import { parseCharacterShareUrl } from "@/lib/aion2GameApi";
import {
  mapGameClassToSite,
  isGameClassSupported,
  isAllowedPortraitUrl,
  portraitProxyPath,
  aion2CharacterPageUrl,
  aion2CharacterInfoUrl,
  aion2CharacterEquipmentUrl,
  AION2_GAME_CLASSES,
  PORTRAIT_HOST,
} from "@/lib/aion2ClassIds";

describe("aion2ClassIds", () => {
  describe("mapGameClassToSite", () => {
    it("maps the global English class names to site classes", () => {
      expect(mapGameClassToSite("Templar")).toBe("Templar");
      expect(mapGameClassToSite("Gladiator")).toBe("Gladiator");
      expect(mapGameClassToSite("Assassin")).toBe("Assassin");
      expect(mapGameClassToSite("Ranger")).toBe("Ranger");
      expect(mapGameClassToSite("Sorcerer")).toBe("Sorcerer");
      expect(mapGameClassToSite("Spiritmaster")).toBe("Spiritmaster");
      expect(mapGameClassToSite("Cleric")).toBe("Cleric");
      expect(mapGameClassToSite("Chanter")).toBe("Chanter");
      // The global release renamed one class; both spellings are live.
      expect(mapGameClassToSite("Elementalist")).toBe("Spiritmaster");
    });

    it("is case-insensitive", () => {
      expect(mapGameClassToSite("templar")).toBe("Templar");
      expect(mapGameClassToSite("ELEMENTALIST")).toBe("Spiritmaster");
    });

    it("returns empty string for classes the site does not support", () => {
      expect(mapGameClassToSite("Fighter")).toBe("");
      expect(mapGameClassToSite("Aethertech")).toBe("");
      expect(mapGameClassToSite(null)).toBe("");
      expect(mapGameClassToSite(undefined)).toBe("");
      expect(mapGameClassToSite("")).toBe("");
    });

    it("does not resolve KR/TW label tables any more", () => {
      // Those shards are gone. A label from one must not be silently coerced
      // into a site class — an unmapped class has to stay unmapped so the UI
      // can ask the player to pick manually.
      expect(mapGameClassToSite("검성")).toBe("");
      expect(mapGameClassToSite("수호성")).toBe("");
      expect(mapGameClassToSite("魔道星")).toBe("");
      expect(mapGameClassToSite("劍星")).toBe("");
    });

    it("round-trips every class it claims to support", () => {
      for (const site of AION2_GAME_CLASSES) {
        expect(mapGameClassToSite(site)).toBe(site);
        expect(isGameClassSupported(site)).toBe(true);
      }
    });
  });

  describe("character share-link parsing", () => {
    it("parses a global character page link", () => {
      const ref = parseCharacterShareUrl(
        "https://aion2.plaync.com/en-us/characters/1101/rKx-d-9c8YwO5HqimeieGA7mjJf0yE5iSkcWffjVu6o%3D?region=nae"
      );
      expect(ref).not.toBeNull();
      expect(ref?.serverId).toBe(1101);
      // The trailing %3D is base64 padding that survives the round trip.
      expect(ref?.characterId).toBe("rKx-d-9c8YwO5HqimeieGA7mjJf0yE5iSkcWffjVu6o=");
    });

    it("parses a link with no locale prefix", () => {
      const ref = parseCharacterShareUrl("https://aion2.plaync.com/characters/1101/abc123%3D");
      expect(ref?.serverId).toBe(1101);
      expect(ref?.characterId).toBe("abc123=");
    });

    it("rejects the retired tw.ncsoft.com host", () => {
      // `tw.ncsoft.com` served the KR/TW API and is gone. Accepting it would
      // resolve to an HTML error page and surface as a confusing 502.
      expect(
        parseCharacterShareUrl("https://tw.ncsoft.com/aion2/characters/1001/A1pIWbd0UKoTYJ2XbL_Cw57uCNxoM4sk4CUqtC5yJ0E%3D")
      ).toBeNull();
    });

    it("ignores the locale prefix and trusts the global API to decide", () => {
      // An old `ko-kr` link is the same host, so it parses. Whether the
      // character exists on Global is the API's call, not the parser's — a KR
      // characterId simply does not resolve there. Whitelisting locale prefixes
      // would break the moment Global adds one.
      const ref = parseCharacterShareUrl("https://aion2.plaync.com/ko-kr/characters/1001/abc123%3D");
      expect(ref?.serverId).toBe(1001);
      expect(ref?.characterId).toBe("abc123=");
    });

    it("rejects non-official hosts and malformed links", () => {
      expect(parseCharacterShareUrl("https://evil.com/aion2/characters/1001/x")).toBeNull();
      expect(parseCharacterShareUrl("https://aion2.plaync.com/profile")).toBeNull();
      expect(parseCharacterShareUrl("not a url")).toBeNull();
      expect(parseCharacterShareUrl("")).toBeNull();
      expect(parseCharacterShareUrl("https://aion2.plaync.com/characters/abc")).toBeNull();
      expect(parseCharacterShareUrl("https://aion2.plaync.com/characters/0/abc")).toBeNull();
    });
  });

  describe("global API URLs", () => {
    const charId = "rKx-d-9c8YwO5HqimeieGA7mjJf0yE5iSkcWffjVu6o=";

    it("carries region=nae on the info call", () => {
      // Without region=nae the endpoint 302s to a 404 HTML page, and jsonFetch
      // throws on the parse. The character silently fails to resolve.
      const url = aion2CharacterInfoUrl(charId, 1101);
      expect(url).toContain("region=nae");
      expect(url).toContain("serverId=1101");
      expect(url).toContain(`characterId=${encodeURIComponent(charId)}`);
    });

    it("carries region=nae on the equipment call", () => {
      // Same requirement — verified live: equipment answers 200 with 18 items
      // only for the global region.
      const url = aion2CharacterEquipmentUrl(charId, 1101);
      expect(url).toContain("region=nae");
      expect(url).toContain("/api/character/equipment");
    });

    it("never emits a retired region code", () => {
      for (const url of [
        aion2CharacterInfoUrl(charId, 1101),
        aion2CharacterEquipmentUrl(charId, 1101),
        aion2CharacterPageUrl(1101, charId),
      ]) {
        expect(url).not.toContain("region=kr");
        expect(url).not.toContain("region=tw");
        expect(url).not.toContain("ncsoft.com");
      }
    });

    it("builds a shareable character page link", () => {
      const url = aion2CharacterPageUrl(1101, charId);
      expect(url).toBe(
        "https://aion2.plaync.com/en-us/characters/1101/rKx-d-9c8YwO5HqimeieGA7mjJf0yE5iSkcWffjVu6o%3D?region=nae"
      );
      // The built link must parse back to the same character.
      const ref = parseCharacterShareUrl(url);
      expect(ref?.serverId).toBe(1101);
      expect(ref?.characterId).toBe(charId);
    });

    it("keeps the /en-us locale prefix the official page requires", () => {
      // Verified live against a real Global character:
      //   /en-us/characters/1101/<id>?region=nae -> 200, 32747 bytes, the page
      //   /characters/1101/<id>?region=nae      -> 200,  2080 bytes, error page
      // Both are 200, so the missing segment never surfaced as an HTTP error --
      // every "Full Profile" button silently opened "page not found".
      const url = aion2CharacterPageUrl(1101, charId);
      expect(url).toContain("/en-us/characters/");
      expect(new URL(url).pathname.startsWith("/characters/")).toBe(false);
    });
  });

  describe("portrait proxy", () => {
    it("only allows the plaync portrait host", () => {
      expect(isAllowedPortraitUrl(`https://${PORTRAIT_HOST}/game_profile_images/x.jpg`)).toBe(true);
      expect(isAllowedPortraitUrl("https://evil.com/x.jpg")).toBe(false);
      expect(isAllowedPortraitUrl("")).toBe(false);
    });

    it("builds a proxied path from a full URL", () => {
      const proxied = portraitProxyPath(`https://${PORTRAIT_HOST}/game_profile_images/a.png`);
      expect(proxied.startsWith("/api/aion2/portrait?")).toBe(true);
      expect(proxied).not.toContain(`${PORTRAIT_HOST}/game_profile_images/a.png`);
    });
  });
});