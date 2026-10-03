import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The class crest was showing *inside* the portrait disc.
 *
 * The badge painted the class thumbnail as a dimmed base layer behind the
 * portrait, on the theory that it was a graceful fallback. With no portrait
 * loaded it filled the whole frame, so a character with no face at all rendered
 * as a filled circular portrait board — the one signal that said "this is the
 * picture" while the picture was missing. The emblem belongs underneath the
 * disc, where the official site puts it.
 *
 * My Profile made it worse with a second bug: a `!c.portraitUrl` branch that
 * rendered the class image as a bare 64px rounded square, so the same missing
 * portrait looked like a square on one screen and a filled circle on another.
 */

const read = (p: string) => readFileSync(join(process.cwd(), "src", p), "utf8");
const badge = () => read("components/aion2/CharacterPortraitBadge.tsx");

describe("the portrait disc carries the portrait and nothing else", () => {
  it("no longer paints the class crest inside the disc", () => {
    expect(badge()).not.toMatch(/absolute inset-0 h-full w-full object-contain opacity-60/);
  });

  it("shows a neutral silhouette when there is no portrait", () => {
    expect(badge()).toMatch(/UserRound/);
  });

  it("keeps the class emblem under the disc", () => {
    // One emblem, below the disc, and it is the only class image left.
    const emblem = badge().match(/classThumbUrl\(cls\)/g) || [];
    expect(emblem).toHaveLength(1);
    expect(badge()).toMatch(/-mt-1 shrink-0/);
  });

  it("the disc and the emblem are separately sized", () => {
    const sizes = badge().match(/disc: "([^"]+)", thumb: "([^"]+)"/g) || [];
    expect(sizes).toHaveLength(3);
    for (const s of sizes) {
      const disc = s.match(/disc: "([^"]+)"/)![1];
      const thumb = s.match(/thumb: "([^"]+)"/)![1];
      // The emblem must stay smaller than the portrait, per the official layout.
      const discPx = parseInt(disc.match(/h-(\d+)/)![1], 10);
      const thumbPx = parseInt(thumb.match(/h-(\d+)/)![1], 10);
      expect(thumbPx).toBeLessThan(discPx);
    }
  });

  it("loads the portrait straight from plaync, as the official page does", () => {
    // The proxy answers 502 for every real portrait in production: the origin
    // (Envoy behind Google Frontend) bot-filters Cloudflare's egress. Direct
    // browser loads are the only path that works, so the badge must not pin the
    // proxy and refuse the retry.
    const portrait = read("components/aion2/CharacterPortrait.tsx");
    expect(portrait).not.toMatch(/proxyOnly/);
    expect(badge()).not.toMatch(/proxyOnly/);
  });
});

describe("My Profile uses the badge everywhere", () => {
  const profile = () => read("app/my-profile/MyProfileClient.tsx");

  it("has no square portrait fallback branch", () => {
    expect(profile()).not.toMatch(/rounded-xl border border-cyan-400\/30 bg-black object-cover/);
  });

  it("renders the stacked badge unconditionally", () => {
    expect(profile()).toMatch(/<CharacterPortraitBadge/);
    expect(profile()).not.toMatch(/\{c\.portraitUrl \? \(/);
  });

  it("no longer renders a bare square class image", () => {
    // The only remaining `classThumbUrl` use in the file is the fallback for a
    // character with no class at all, which must not be a square portrait board.
    const squares = profile().match(/classThumbUrl\(cls\)[\s\S]{0,320}?w-\d+ h-\d+ rounded-xl/g);
    expect(squares === null || squares.length === 0).toBe(true);
  });
});
