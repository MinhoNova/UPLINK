import { describe, it, expect } from "vitest";
import { parseCharacterShareUrl } from "@/lib/aion2GameApi";
import {
  mapGameClassToSite,
  isGameClassSupported,
  isAllowedPortraitUrl,
  portraitProxyPath,
  PORTRAIT_HOST,
  AION2_GAME_CLASS_BY_KO,
} from "@/lib/aion2ClassIds";

describe("aion2ClassIds", () => {
  describe("mapGameClassToSite", () => {
    it("maps known Korean class names to site classes", () => {
      expect(mapGameClassToSite("검성")).toBe("Gladiator");
      expect(mapGameClassToSite("수호성")).toBe("Templar");
      expect(mapGameClassToSite("살성")).toBe("Assassin");
      expect(mapGameClassToSite("궁성")).toBe("Ranger");
      expect(mapGameClassToSite("마도성")).toBe("Sorcerer");
      expect(mapGameClassToSite("정령성")).toBe("Spiritmaster");
      expect(mapGameClassToSite("치유성")).toBe("Cleric");
      expect(mapGameClassToSite("호법성")).toBe("Chanter");
    });

    it("returns empty string for unknown classes", () => {
      expect(mapGameClassToSite("권성")).toBe("");
      expect(mapGameClassToSite("拳星")).toBe("");
      expect(mapGameClassToSite("執行官")).toBe("");
      expect(mapGameClassToSite(null)).toBe("");
      expect(mapGameClassToSite(undefined)).toBe("");
    });

    it("maps known zh-TW class names to site classes", () => {
      expect(mapGameClassToSite("劍星")).toBe("Gladiator");
      expect(mapGameClassToSite("守護星")).toBe("Templar");
      expect(mapGameClassToSite("殺星")).toBe("Assassin");
      expect(mapGameClassToSite("弓星")).toBe("Ranger");
      expect(mapGameClassToSite("魔道星")).toBe("Sorcerer");
      expect(mapGameClassToSite("精靈星")).toBe("Spiritmaster");
      expect(mapGameClassToSite("治癒星")).toBe("Cleric");
      expect(mapGameClassToSite("護法星")).toBe("Chanter");
    });

    it("has consistent reverse mapping", () => {
      for (const [ko, site] of Object.entries(AION2_GAME_CLASS_BY_KO)) {
        if (!site) continue;
        expect(mapGameClassToSite(ko)).toBe(site);
        expect(isGameClassSupported(site)).toBe(true);
      }
    });
  });

  describe("character share-link parsing", () => {
    it("parses a tw.ncsoft.com character page link", () => {
      const ref = parseCharacterShareUrl(
        "https://tw.ncsoft.com/aion2/characters/1001/A1pIWbd0UKoTYJ2XbL_Cw57uCNxoM4sk4CUqtC5yJ0E%3D"
      );
      expect(ref).not.toBeNull();
      expect(ref?.baseUrl).toBe("https://tw.ncsoft.com/aion2");
      expect(ref?.lang).toBe("language=zh-TW");
      expect(ref?.region).toBe("tw");
      expect(ref?.serverId).toBe(1001);
      expect(ref?.characterId).toBe("A1pIWbd0UKoTYJ2XbL_Cw57uCNxoM4sk4CUqtC5yJ0E=");
    });

    it("parses a kr aion2.plaync.com character page link with locale prefix", () => {
      const ref = parseCharacterShareUrl("https://aion2.plaync.com/ko-kr/characters/1001/abc123%3D");
      expect(ref?.baseUrl).toBe("https://aion2.plaync.com");
      expect(ref?.lang).toBe("lang=ko");
      expect(ref?.region).toBe("kr");
      expect(ref?.serverId).toBe(1001);
      expect(ref?.characterId).toBe("abc123=");
    });

    it("rejects non-official hosts and malformed links", () => {
      expect(parseCharacterShareUrl("https://evil.com/aion2/characters/1001/x")).toBeNull();
      expect(parseCharacterShareUrl("https://tw.ncsoft.com/aion2/profile")).toBeNull();
      expect(parseCharacterShareUrl("not a url")).toBeNull();
      expect(parseCharacterShareUrl("")).toBeNull();
      expect(parseCharacterShareUrl("https://tw.ncsoft.com/aion2/characters/abc")).toBeNull();
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