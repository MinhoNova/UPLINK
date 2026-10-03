import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Combat power and item level used to be invented chips: an amber "CP" box and
 * a violet "ILVL" box, each showing the raw number via `toLocaleString()`. The
 * official character page shows neither the colours nor the full number — it
 * puts both inside one pill, with its own icons, and abbreviates combat power
 * to four significant digits.
 *
 * This test pins the transcription so the pill cannot drift back into an
 * approximation of the official layout.
 */

const read = (p: string) => readFileSync(join(process.cwd(), "src", p), "utf8");
const pill = () => read("components/aion2/CharacterPowerStats.tsx");

describe("the combat power / item level pill", () => {
  it("uses the official pill geometry", () => {
    // .profile__info-level-con: flex, fit-content, gap 18px, 6px 16px padding,
    // fully rounded, #ffffff14 background.
    expect(pill()).toMatch(/rounded-full/);
    expect(pill()).toMatch(/bg-white\/\[0\.08\]/);
    expect(pill()).toMatch(/gap-\[18px\]/);
    expect(pill()).toMatch(/px-4 py-1\.5/);
    expect(pill()).toMatch(/w-fit/);
  });

  it("colours the numbers the way the official page does", () => {
    // .profile__info-power-level is #78f2fb; item level is plain white.
    expect(pill()).toMatch(/text-\[#78f2fb\]/);
    expect(pill()).toMatch(/text-white/);
    expect(pill()).not.toMatch(/text-amber-300/);
    expect(pill()).not.toMatch(/text-violet-300/);
  });

  it("uses the official icons, not lucide stand-ins", () => {
    expect(pill()).toMatch(/AION2_POWER_ICON/);
    expect(pill()).toMatch(/AION2_ITEM_LEVEL_ICON/);
  });

  it("routes the numbers through the official formatters", () => {
    expect(pill()).toMatch(/formatCombatPower\(cp\)/);
    expect(pill()).toMatch(/formatItemLevel\(il\)/);
    // The old raw-number rendering must be gone from the component.
    expect(pill()).not.toMatch(/toLocaleString/);
  });

  it("omits each half when its value is missing, like the official page", () => {
    expect(pill()).toMatch(/\{cp > 0 \?/);
    expect(pill()).toMatch(/\{il > 0 \?/);
  });
});

describe("no invented CP/ILVL chips remain on the character surfaces", () => {
  const surfaces: [string, string][] = [
    ["app/character/page.tsx", "the character profile"],
    ["app/my-profile/MyProfileClient.tsx", "My Profile"],
    ["app/my-characters/MyCharactersClient.tsx", "My Characters"],
    ["components/aion2/LobbyPage.tsx", "the lobby"],
    ["components/modals/ManageModal.tsx", "Manage"],
    ["components/modals/AionAutoApplyModal.tsx", "auto-apply"],
    ["components/OfferApplyAlertHost.tsx", "the apply alert"],
  ];

  it("every surface renders the shared pill", () => {
    for (const [file] of surfaces) {
      expect(read(file), file).toMatch(/CharacterPowerStats/);
    }
  });

  it("no stat readout still prints a raw combat-power number", () => {
    // Auto-apply's two threshold-prose lines are the documented exception below,
    // so they are discounted before checking the rest of each surface.
    const prose =
      /cfg\.combatPower\.toLocaleString\(\)|Number\(cfg\.combatPower\)\.toLocaleString\(\)/g;
    for (const [file] of surfaces) {
      const src = read(file).replace(prose, "");
      // A stat readout must go through the formatter, which is what turns
      // 39984 into "39.98K".
      const rawCp = src.match(/(combatPower|cpAp)\)?\.toLocaleString/g);
      expect(rawCp === null || rawCp.length === 0, file).toBe(true);
    }
  });

  it("keeps exact numbers in the auto-apply threshold prose, on purpose", () => {
    // Auto-apply states the criteria the user configured. Abbreviating a
    // threshold to "39.98K" next to a pill reading the same value would make the
    // two disagree about the number the filter actually uses, so these two lines
    // stay exact. Everything that is a *readout* goes through the formatter.
    const src = read("components/modals/AionAutoApplyModal.tsx");
    const prose = src.match(/cfg\.combatPower\.toLocaleString\(\)|Number\(cfg\.combatPower\)\.toLocaleString\(\)/g);
    expect(prose).toHaveLength(2);
  });
});