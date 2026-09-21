import { describe, it, expect } from "vitest";
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
      expect(mapGameClassToSite(null)).toBe("");
      expect(mapGameClassToSite(undefined)).toBe("");
    });

    it("has consistent reverse mapping", () => {
      for (const [ko, site] of Object.entries(AION2_GAME_CLASS_BY_KO)) {
        if (!site) continue;
        expect(mapGameClassToSite(ko)).toBe(site);
        expect(isGameClassSupported(site)).toBe(true);
      }
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