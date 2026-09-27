import { describe, it, expect } from "vitest";
import { resolveHeroBg, heroBgStyle, heroBgLabel, HERO_BG_ALLOWED, HERO_BG_DEFAULT } from "@/lib/heroBg";

describe("resolveHeroBg", () => {
  it("passes through every known key", () => {
    for (const key of HERO_BG_ALLOWED) {
      expect(resolveHeroBg(key)).toBe(key);
    }
  });

  it("falls back to scenic for unknown, missing or hostile values", () => {
    expect(resolveHeroBg(undefined)).toBe(HERO_BG_DEFAULT);
    expect(resolveHeroBg(null)).toBe(HERO_BG_DEFAULT);
    expect(resolveHeroBg("")).toBe(HERO_BG_DEFAULT);
    expect(resolveHeroBg("not-a-real-bg")).toBe(HERO_BG_DEFAULT);
    // must never be usable to inject arbitrary CSS
    expect(resolveHeroBg("url(javascript:alert(1))")).toBe(HERO_BG_DEFAULT);
    expect(resolveHeroBg('"; background: red; "')).toBe(HERO_BG_DEFAULT);
  });

  it("is case-sensitive, matching the stored allow-list", () => {
    expect(resolveHeroBg("SCENIC")).toBe(HERO_BG_DEFAULT);
    expect(resolveHeroBg("Aurora")).toBe(HERO_BG_DEFAULT);
  });
});

describe("heroBgStyle", () => {
  it("gives scenic no inline style — it renders the AION2 art image instead", () => {
    expect(heroBgStyle("scenic")).toBeUndefined();
  });

  it("gives every gradient option an inline style", () => {
    for (const key of ["void", "aurora", "ember", "glacier"] as const) {
      const style = heroBgStyle(key);
      expect(style).toBeDefined();
      expect(String(style?.background)).toContain("linear-gradient");
    }
  });

  it("returns undefined for an unknown key rather than throwing", () => {
    expect(heroBgStyle("nope" as any)).toBeUndefined();
  });
});

describe("heroBgLabel", () => {
  it("labels every option and degrades gracefully", () => {
    for (const key of HERO_BG_ALLOWED) {
      expect(heroBgLabel(key as any)).toBeTruthy();
    }
    expect(heroBgLabel("mystery" as any)).toBe("mystery");
  });
});
