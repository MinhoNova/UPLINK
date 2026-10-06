/**
 * Per-offer minimum gear requirements, and the check that gates applying on them.
 *
 * The rule the whole feature rests on: an offer may say "I need Item Level 460+"
 * because the dungeon genuinely will not let a character under 460 inside. A
 * player who does not meet it cannot apply, and can see why before they try.
 *
 * Both numbers are optional and independent. Zero means "no requirement", which
 * is what an offer that does not use this feature stores, so existing offers are
 * unaffected and nothing needs migrating.
 *
 * The check is deliberately written to take `TrustedCharacterStats` — the
 * branded type `trustCharacterStats` returns — and nothing else. It cannot be
 * handed a client's own numbers, so the only way to pass is to hold a character
 * whose stats the server verified against NCSoft itself. See
 * `characterStatsSig.ts` for why that matters.
 *
 * Every entry point that can add a row to `lobby.applicants` runs this:
 *   - `POST /api/lobbies/apply`      the apply button
 *   - `validateLobbies` via `/api/data`  a bulk write, which otherwise bypasses
 *                                       the apply route entirely
 *   - `applyToLobbyFromDiscord`      the bot's apply button
 * A gate on one of the three would be a suggestion.
 */

import type { TrustedCharacterStats } from "@/lib/characterStatsSig";
import { STAT_MAX } from "@/lib/characterStatsLimits";

export type OfferRequirements = {
  /** 0 = not required. */
  minItemLevel: number;
  /** 0 = not required. */
  minCombatPower: number;
};

/**
 * Which way a character fell short.
 *
 * `stats-unverified` is its own case rather than a pair of number mismatches,
 * because the fix is different: the player's numbers may well be fine, the site
 * just has not been told. Showing "you have 0 Item Level" to someone whose
 * character is 480 would be a lie, so the reason has to name the actual problem.
 */
export type RequirementFailureKind = "stats-unverified" | "item-level" | "combat-power";

export type RequirementFailure = {
  kind: RequirementFailureKind;
  /** What the offer asked for, e.g. 460. Absent for `stats-unverified`. */
  required?: number;
  /** What the character actually has. Absent for `stats-unverified`. */
  actual?: number;
};

export type RequirementCheck =
  | { ok: true }
  | { ok: false; failures: RequirementFailure[] };

/** An offer with no requirements set. */
export const NO_REQUIREMENTS: OfferRequirements = { minItemLevel: 0, minCombatPower: 0 };

/**
 * Clamp one requirement coming off the wire.
 *
 * The same helper sanitises a value being written *and* one being read, so a
 * stored requirement is never looser than the one that was submitted, and an
 * out-of-range stored value cannot be used to lock everybody out. Negative, NaN,
 * Infinity, non-numeric and over-ceiling all collapse to 0 = no requirement.
 */
export function cleanRequirement(value: unknown, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(Math.trunc(n), max);
}

/** Sanitise a pair off the create/edit wire. */
export function cleanRequirements(input: any): OfferRequirements {
  return {
    minItemLevel: cleanRequirement(input?.minItemLevel, STAT_MAX.itemLevel),
    minCombatPower: cleanRequirement(input?.minCombatPower, STAT_MAX.combatPower),
  };
}

/**
 * Read an offer's requirements, sanitising on read.
 *
 * Offers are read in a dozen places that all want the same answer, and some of
 * them are historical rows written before these fields existed. Normalising here
 * means every reader sees a real number or a clean 0 and nobody has to remember
 * to guard.
 */
export function readOfferRequirements(lobby: any): OfferRequirements {
  return cleanRequirements(lobby);
}

/** Whether an offer constrains anything at all. */
export function hasOfferRequirements(req: OfferRequirements): boolean {
  return req.minItemLevel > 0 || req.minCombatPower > 0;
}

/**
 * Check a character against an offer's requirements.
 *
 * `stats === null` means the server could not verify the character's stats — no
 * signature, a bad one, or one too old to stand behind. It fails, and it fails
 * with `stats-unverified` so the UI can tell the player to re-sync instead of
 * quoting them a number the site never confirmed.
 */
export function checkOfferRequirements(
  req: OfferRequirements,
  stats: TrustedCharacterStats | null
): RequirementCheck {
  const failures: RequirementFailure[] = [];

  const wantsItemLevel = req.minItemLevel > 0;
  const wantsCombatPower = req.minCombatPower > 0;
  if (!wantsItemLevel && !wantsCombatPower) return { ok: true };

  if (!stats) {
    // Only worth saying once, however many requirements the offer sets.
    return { ok: false, failures: [{ kind: "stats-unverified" }] };
  }

  if (wantsItemLevel && stats.itemLevel < req.minItemLevel) {
    failures.push({ kind: "item-level", required: req.minItemLevel, actual: stats.itemLevel });
  }
  if (wantsCombatPower && stats.combatPower < req.minCombatPower) {
    failures.push({ kind: "combat-power", required: req.minCombatPower, actual: stats.combatPower });
  }

  return failures.length ? { ok: false, failures } : { ok: true };
}

/**
 * English sentence for an HTTP error body and the Discord bot, which cannot
 * render a component. The web UI builds its own from `failures` so it can
 * translate; this is the server-side floor so every non-React caller still tells
 * the player something true.
 */
export function describeRequirementFailures(failures: RequirementFailure[] | undefined): string {
  if (!failures?.length) return "Character does not meet this offer's requirements.";
  const parts = failures.map((f) => {
    switch (f.kind) {
      case "stats-unverified":
        return "this offer needs your verified Item Level / Combat Power — sync your character in My Characters first";
      case "item-level":
        return `Item Level ${f.required}+ required (your character is ${f.actual ?? 0})`;
      case "combat-power":
        return `Combat Power ${f.required}+ required (your character is ${f.actual ?? 0})`;
    }
  });
  return `Cannot apply: ${parts.join("; ")}.`;
}

/* ------------------------------------------------------------------------- *
 * Display only
 *
 * Everything below this line is for rendering the Apply button and the character
 * picker. None of it decides anything — `checkOfferRequirements` on the server is
 * the only authority, and it is the one that counts. A client that disagrees with
 * this gets a button that looks pressable and an error on submit, which is the
 * safe direction to be wrong in.
 * ------------------------------------------------------------------------- */

/** Plain, unverified numbers as they sit on a stored character row. */
export type PreviewStats = {
  itemLevel: number;
  combatPower: number;
};

/**
 * Why this character would be turned away, for the hover text.
 *
 * A stored stat of 0 is reported as `stats-unverified` rather than as a numeric
 * shortfall, because that is what it almost always means: the server zeroes the
 * stats of any row whose signature it cannot verify, so the zeros a player sees
 * here are the sanitised ones, not a claim that their character has no gear.
 * Telling somebody with an Item Level 480 character that they "have 0" would be
 * worse than useless — they would go and buy gear they do not need.
 */
export function previewRequirementFailures(
  req: OfferRequirements,
  stats: PreviewStats | null
): RequirementFailure[] {
  if (!hasOfferRequirements(req)) return [];
  if (!stats) return [{ kind: "stats-unverified" }];

  const il = Math.max(0, Number(stats.itemLevel) || 0);
  const cp = Math.max(0, Number(stats.combatPower) || 0);
  const failures: RequirementFailure[] = [];

  if (req.minItemLevel > 0) {
    if (il === 0) failures.push({ kind: "stats-unverified" });
    else if (il < req.minItemLevel) failures.push({ kind: "item-level", required: req.minItemLevel, actual: il });
  }
  if (req.minCombatPower > 0) {
    if (cp === 0) failures.push({ kind: "stats-unverified" });
    else if (cp < req.minCombatPower) failures.push({ kind: "combat-power", required: req.minCombatPower, actual: cp });
  }

  return failures;
}

/** Best a character's stored numbers can do against an offer — used to decide
 *  whether the Apply button is worth pressing at all before a character is picked.
 *
 *  "Best" is the sum of the two stats rather than either one alone, because the
 *  offer may gate on one, the other, or both, and a character that is strong on
 *  one and weak on the other is not uniformly better than another. Ties keep the
 *  first row, so the ordering is stable between renders.
 */
export function bestPreviewStats(rows: any[]): PreviewStats | null {
  let best: PreviewStats | null = null;
  for (const row of rows) {
    const cur: PreviewStats = {
      itemLevel: Math.max(0, Number(row?.itemLevel) || 0),
      combatPower: Math.max(0, Number(row?.cpAp ?? row?.combatPower) || 0),
    };
    if (!best || cur.itemLevel + cur.combatPower > best.itemLevel + best.combatPower) best = cur;
  }
  return best;
}
