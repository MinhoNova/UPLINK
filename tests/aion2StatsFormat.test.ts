import { describe, it, expect } from "vitest";
import {
  AION2_ITEM_LEVEL_ICON,
  AION2_POWER_ICON,
  formatCombatPower,
  formatItemLevel,
} from "@/lib/aion2Stats";

/**
 * Combat power and item level now render the way the official character page
 * renders them. Both formatters are ports of the official frontend's own
 * functions, so these cases are pinned against the official output rather than
 * against a round number that happens to look tidy.
 */

/** Reference implementation, transcribed from
 *  static-aion2/characters/js/index.js. */
function officialPower(p: number): string {
  if (!p) return "-";
  const m = Math.abs(p);
  let b = "K";
  let y = p / 1e3;
  if (m >= 1e6) {
    b = "M";
    y = p / 1e6;
  }
  const S = Math.abs(y);
  const x = S === 0 ? 1 : Math.floor(Math.log10(S)) + 1;
  const places = Math.max(4 - x, 0);
  const C = 10 ** places;
  const R = 1e-12;
  return `${(y >= 0 ? Math.floor(y * C + R) / C : Math.ceil(y * C - R) / C).toFixed(places)}${b}`;
}

function officialItemLevel(e: number): string {
  if (e === 0) return "0";
  const t = e.toString().split(".");
  t[0] = t[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return t.join(".");
}

describe("formatCombatPower", () => {
  it("matches the official output for the character we resolved live", () => {
    // Linda, Siel: the payload the site returned with combatPower 39984.
    expect(formatCombatPower(39984)).toBe("39.98K");
  });

  it("abbreviates to four significant digits, not a fixed count", () => {
    expect(formatCombatPower(999999)).toBe("999.9K");
    expect(formatCombatPower(1000000)).toBe("1.000M");
    expect(formatCombatPower(1234567)).toBe("1.234M");
    expect(formatCombatPower(250000)).toBe("250.0K");
    expect(formatCombatPower(123456789)).toBe("123.4M");
  });

  it("switches from K to M at one million", () => {
    expect(formatCombatPower(999999)).toContain("K");
    expect(formatCombatPower(1000000)).toContain("M");
  });

  it("keeps four significant digits for very small values", () => {
    expect(formatCombatPower(123)).toBe("0.1230K");
  });

  it("renders missing or zero power as a dash", () => {
    expect(formatCombatPower(0)).toBe("-");
    expect(formatCombatPower(null)).toBe("-");
    expect(formatCombatPower(undefined)).toBe("-");
    expect(formatCombatPower("not a number")).toBe("-");
  });

  it("agrees with the reference implementation across a wide range", () => {
    for (const v of [
      1, 12, 99, 100, 123, 999, 1000, 1234, 9999, 12345, 99999, 100000, 123456,
      499999, 500000, 999999, 1000000, 1234567, 9999999, 12345678, 99999999,
      100000000, 999999999, 1234567890,
    ]) {
      expect(formatCombatPower(v)).toBe(officialPower(v));
    }
  });
});

describe("formatItemLevel", () => {
  it("does not abbreviate, unlike combat power", () => {
    // 859 is the ItemLevel stat from the live payload. Combat power for the
    // same character became "39.98K"; the item level stays exact.
    expect(formatItemLevel(859)).toBe("859");
    expect(formatItemLevel(1234567)).toBe("1,234,567");
  });

  it("groups thousands", () => {
    expect(formatItemLevel(12345)).toBe("12,345");
    expect(formatItemLevel(1000)).toBe("1,000");
    expect(formatItemLevel(999)).toBe("999");
  });

  it("keeps zero as a real value and treats missing as absent", () => {
    expect(formatItemLevel(0)).toBe("0");
    expect(formatItemLevel(null)).toBe("-");
    expect(formatItemLevel(undefined)).toBe("-");
    expect(formatItemLevel("")).toBe("-");
  });

  it("agrees with the reference implementation", () => {
    for (const v of [1, 12, 123, 859, 1000, 12345, 99999, 1234567]) {
      expect(formatItemLevel(v)).toBe(officialItemLevel(v));
    }
  });
});

describe("official icon URLs", () => {
  it("points at the assets the official stylesheet references", () => {
    // Both are the ::before backgrounds of .profile__info-power-level and
    // .profile__info-item-level. Verified to answer 200 image/png.
    expect(AION2_POWER_ICON).toBe(
      "https://assets.playnccdn.com/static-aion2/characters/img/info/profile_power_icon.png"
    );
    expect(AION2_ITEM_LEVEL_ICON).toBe(
      "https://assets.playnccdn.com/static-aion2/characters/img/info/profile_level_icon.png"
    );
  });
});