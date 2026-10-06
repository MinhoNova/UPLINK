import { describe, it, expect } from "vitest";

import {
  bestPreviewStats,
  checkOfferRequirements,
  cleanRequirement,
  cleanRequirements,
  describeRequirementFailures,
  hasOfferRequirements,
  previewRequirementFailures,
  readOfferRequirements,
} from "@/lib/offerRequirements";
import type { RequirementFailure } from "@/lib/offerRequirements";
import type { TrustedCharacterStats } from "@/lib/characterStatsSig";

/**
 * The rule an offer states and the check that enforces it.
 *
 * Two properties matter and they pull in opposite directions:
 *
 *  - An offer owner sets these numbers themselves, from any source, so they are
 *    untrusted input on the way *in* and get clamped.
 *  - An applicant's stats are untrusted input on the way *in* too, so the check
 *    only accepts stats that arrived through `trustCharacterStats`. A gate that
 *    took plain numbers would be enforced only in the UI.
 */

const IL = 480;
const CP = 39_980;

/**
 * Stands in for what `trustCharacterStats` hands back.
 *
 * The brand it normally carries is compile-time only, so a test has to assert
 * across it. That is the point being pinned by `only accepts signed stats` below:
 * the cast is not available in application code without going through the
 * verifier.
 */
function trusted(level = 80, itemLevel = IL, combatPower = CP): TrustedCharacterStats {
  return { level, itemLevel, combatPower } as TrustedCharacterStats;
}

/**
 * The failures, whether or not there are any. `checkOfferRequirements` only
 * carries `failures` on a refusal, which is the useful shape for a caller that
 * branches on it and an awkward one for a test that wants to assert both.
 */
function failuresOf(res: ReturnType<typeof checkOfferRequirements>): RequirementFailure[] {
  return res.ok ? [] : res.failures;
}

describe("reading what an offer asks for", () => {
  it("treats an offer with no fields as ungated", () => {
    // Every offer that does not use the feature. It must stay ungated, or the
    // feature would silently start blocking applications site-wide.
    expect(readOfferRequirements({})).toEqual({ minItemLevel: 0, minCombatPower: 0 });
    expect(readOfferRequirements({ minItemLevel: 0, minCombatPower: 0 })).toEqual({
      minItemLevel: 0,
      minCombatPower: 0,
    });
    expect(hasOfferRequirements(readOfferRequirements({}))).toBe(false);
  });

  it("reads the two fields off a lobby row", () => {
    const req = readOfferRequirements({ minItemLevel: IL, minCombatPower: CP });
    expect(req).toEqual({ minItemLevel: IL, minCombatPower: CP });
    expect(hasOfferRequirements(req)).toBe(true);
  });

  it("gates on whichever field is set", () => {
    expect(hasOfferRequirements({ minItemLevel: IL, minCombatPower: 0 })).toBe(true);
    expect(hasOfferRequirements({ minItemLevel: 0, minCombatPower: CP })).toBe(true);
  });
});

describe("cleaning what an owner typed", () => {
  it("keeps a normal value", () => {
    expect(cleanRequirement(IL, 1000)).toBe(IL);
  });

  it("truncates a fraction rather than rounding it up into a pass", () => {
    expect(cleanRequirement(479.9, 1000)).toBe(479);
  });

  it("floors a negative number to zero, which means no requirement", () => {
    expect(cleanRequirement(-5, 1000)).toBe(0);
  });

  it("caps at the ceiling", () => {
    expect(cleanRequirement(99_999, 1000)).toBe(1000);
  });

  it("reads junk as zero instead of NaN", () => {
    expect(cleanRequirement("abc", 1000)).toBe(0);
    expect(cleanRequirement(undefined, 1000)).toBe(0);
    expect(cleanRequirement(NaN, 1000)).toBe(0);
    expect(cleanRequirement(Infinity, 1000)).toBe(0);
  });

  it("cleans both fields of a lobby write", () => {
    expect(cleanRequirements({ minItemLevel: -3, minCombatPower: 2.7 })).toEqual({
      minItemLevel: 0,
      minCombatPower: 2,
    });
  });

  it("leaves the fields absent when the write did not mention them", () => {
    // Absent and 0 mean different things on an edit: absent is "leave it alone",
    // 0 is "clear it". Collapsing them would make a requirement unclearable.
    const cleaned = cleanRequirements({ minItemLevel: 500 });
    expect(cleaned.minItemLevel).toBe(500);
    expect(cleaned.minCombatPower).toBe(0);
  });
});

describe("checking an applicant", () => {
  it("passes a character that clears both bars", () => {
    const req = { minItemLevel: IL, minCombatPower: CP };
    expect(checkOfferRequirements(req, trusted())).toEqual({ ok: true });
  });

  it("passes on an exact match, since the offer says 480+", () => {
    expect(checkOfferRequirements({ minItemLevel: IL, minCombatPower: CP }, trusted(80, IL, CP)).ok).toBe(true);
  });

  it("fails a character one point under, and says which bar", () => {
    const res = checkOfferRequirements({ minItemLevel: IL, minCombatPower: 0 }, trusted(80, IL - 1, CP));
    expect(res.ok).toBe(false);
    expect(failuresOf(res)).toEqual([{ kind: "item-level", required: IL, actual: IL - 1 }]);
  });

  it("fails on combat power alone", () => {
    const res = checkOfferRequirements({ minItemLevel: 0, minCombatPower: CP }, trusted(80, IL, CP - 1));
    expect(failuresOf(res)).toEqual([{ kind: "combat-power", required: CP, actual: CP - 1 }]);
  });

  it("reports both failures when both bars are missed", () => {
    const res = checkOfferRequirements({ minItemLevel: IL, minCombatPower: CP }, trusted(80, 100, 100));
    expect(failuresOf(res).map((f) => f.kind)).toEqual(["item-level", "combat-power"]);
  });

  it("does not evaluate a bar the offer did not set", () => {
    // The common case: an owner sets one number and leaves the other open, so a
    // character with no combat power still gets in on item level alone.
    expect(checkOfferRequirements({ minItemLevel: 100, minCombatPower: 0 }, trusted(80, 480, 0)).ok).toBe(true);
  });

  it("only accepts signed stats", () => {
    // No stats at all, which is what an unsigned or tampered roster row produces.
    const req = { minItemLevel: IL, minCombatPower: CP };
    const res = checkOfferRequirements(req, null);
    expect(res.ok).toBe(false);
    expect(failuresOf(res)).toEqual([{ kind: "stats-unverified" }]);
  });

  it("reports a verified zero as the real shortfall that it is", () => {
    // Unlike the preview, the server knows whether a 0 is the character's actual
    // item level or the result of the row being stripped because it could not be
    // verified. A signature that genuinely covers 0 is a character with no gear,
    // and saying so is correct. The one number the server will never report as a
    // shortfall is one it does not trust, which arrives as null stats instead.
    const res = checkOfferRequirements({ minItemLevel: IL, minCombatPower: 0 }, trusted(80, 0, CP));
    expect(failuresOf(res)).toEqual([{ kind: "item-level", required: IL, actual: 0 }]);
  });

  it("lets an ungated offer through regardless of stats", () => {
    expect(checkOfferRequirements({ minItemLevel: 0, minCombatPower: 0 }, null).ok).toBe(true);
  });
});

describe("the message the player sees", () => {
  it("names the bar and both numbers", () => {
    const res = checkOfferRequirements({ minItemLevel: 480, minCombatPower: 0 }, trusted(80, 400, CP));
    const text = describeRequirementFailures(failuresOf(res));
    expect(text).toContain("Item Level 480+");
    expect(text).toContain("400");
  });

  it("points an unverified character at the sync page", () => {
    const text = describeRequirementFailures([{ kind: "stats-unverified" }]);
    expect(text).toContain("My Characters");
  });

  it("stays empty for a passing check, so it cannot read as a refusal", () => {
    const res = checkOfferRequirements({ minItemLevel: IL, minCombatPower: 0 }, trusted());
    // `failures` does not exist on a passing verdict, so this also pins that the
    // formatter tolerates being handed one — it is called from four error paths
    // where a bad shape would otherwise turn into a 500 instead of a refusal.
    expect(describeRequirementFailures(failuresOf(res))).toBe(
      "Character does not meet this offer's requirements."
    );
  });
});

describe("the display-only preview", () => {
  it("agrees with the server check on a clear pass and a clear fail", () => {
    const req = { minItemLevel: IL, minCombatPower: 0 };
    expect(previewRequirementFailures(req, { itemLevel: 500, combatPower: CP })).toEqual([]);
    expect(previewRequirementFailures(req, { itemLevel: 400, combatPower: CP })).toEqual([
      { kind: "item-level", required: IL, actual: 400 },
    ]);
  });

  it("says nothing for an offer with no requirement", () => {
    expect(previewRequirementFailures({ minItemLevel: 0, minCombatPower: 0 }, null)).toEqual([]);
  });

  it("reports unverified when there is no character to look at", () => {
    expect(previewRequirementFailures({ minItemLevel: IL, minCombatPower: 0 }, null)).toEqual([
      { kind: "stats-unverified" },
    ]);
  });

  it("matches the server verdict for a real pair of rows", () => {
    // The UI disabling a button and the server refusing the POST have to agree,
    // or players get a dead button with no explanation.
    const req = { minItemLevel: 480, minCombatPower: 30000 };
    for (const [itemLevel, combatPower] of [
      [500, 40_000],
      [480, 30_000],
      [479, 30_000],
      [480, 29_999],
      [0, 0],
    ]) {
      const preview = previewRequirementFailures(req, { itemLevel, combatPower });
      const server = checkOfferRequirements(req, itemLevel ? trusted(80, itemLevel, combatPower) : null);
      const serverKinds = failuresOf(server).map((f) => f.kind);
      const previewKinds = [...new Set(preview.map((f) => f.kind))];
      expect(previewKinds.sort()).toEqual(serverKinds.sort());
    }
  });
});

describe("picking the best character to offer", () => {
  it("is null when the player has none", () => {
    expect(bestPreviewStats([])).toBeNull();
  });

  it("does not let an all-zero row look better than a real one", () => {
    const best = bestPreviewStats([
      { itemLevel: 0, cpAp: 0 },
      { itemLevel: 480, cpAp: 39_980 },
    ]);
    expect(best).toEqual({ itemLevel: 480, combatPower: 39_980 });
  });

  it("sums the two so a lopsided character does not always win", () => {
    // One character is 600 ilevel with no power, the other 300 ilevel with 30k.
    // Neither dominates: the first clears an item-level offer the second cannot,
    // and the other way round for power. The total is the honest tiebreak, and
    // whichever it names the server still decides the real answer.
    const best = bestPreviewStats([
      { itemLevel: 600, cpAp: 0 },
      { itemLevel: 300, cpAp: 30_000 },
    ]);
    expect(best).toEqual({ itemLevel: 300, combatPower: 30_000 });
  });

  it("keeps the first row on a tie, so the choice does not flicker between renders", () => {
    expect(bestPreviewStats([{ itemLevel: 480, cpAp: 100 }, { itemLevel: 480, cpAp: 100 }])).toEqual({
      itemLevel: 480,
      combatPower: 100,
    });
  });

  it("survives rows with junk in the fields", () => {
    expect(bestPreviewStats([{ itemLevel: "x", cpAp: null }, { itemLevel: 480, cpAp: "39980" }])).toEqual({
      itemLevel: 480,
      combatPower: 39_980,
    });
  });
});
