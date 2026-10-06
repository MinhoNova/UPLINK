import { describe, it, expect, beforeEach } from "vitest";

import {
  STATS_FRESH_MS,
  STAT_MAX,
  STATS_SIG_FIELD,
  isStatsFreshEnough,
  resetStatsKeyCacheForTests,
  signCharacterStats,
  trustCharacterStats,
  verifyCharacterStats,
} from "@/lib/characterStatsSig";
import { AION2_CPAP_MAX } from "@/lib/aionClassMeta";

/**
 * The signature over a character's stats.
 *
 * Everything here exists because the `characters` roster is client-writable: a
 * sync POSTs the whole roster back, and before this the caller's *own* row was
 * passed through with its numbers intact. Any offer stating "Item Level 460+"
 * was therefore walkable by editing one field in a request.
 *
 * So these cases pin the property the requirement check actually rests on: the
 * numbers cannot be changed after the server saw them from NCSoft. Each tamper
 * test is the bypass it replaces.
 */

const USER = "user-1";
const OTHER = "user-2";
const SECRET = "test-root-secret-for-character-stats";

/** A freshly verified character, as NCSoft would have returned it. */
const live = {
  characterId: "char-abc-123",
  level: 80,
  itemLevel: 480,
  combatPower: 39_980,
};

/** The row shape that gets written to the roster. */
function storedRow(overrides: Record<string, unknown> = {}) {
  return {
    id: `game:${live.characterId}`,
    gameCharacterId: live.characterId,
    userId: USER,
    level: live.level,
    itemLevel: live.itemLevel,
    cpAp: live.combatPower,
    verifiedAt: Date.now(),
    [STATS_SIG_FIELD]: null as string | null,
    ...overrides,
  };
}

/** A signed row, as a successful sync would store it. */
async function signedRow(overrides: Record<string, unknown> = {}) {
  const row = storedRow(overrides);
  // Signed through the profile shape, which is what the signer really receives —
  // it also pins that both spellings of the row mint the same signature.
  const sig = await signCharacterStats(live, USER);
  return { ...row, [STATS_SIG_FIELD]: sig };
}

beforeEach(() => {
  process.env.NEXTAUTH_SECRET = SECRET;
  delete process.env.AUTH_SECRET;
  resetStatsKeyCacheForTests();
});

describe("signing a character's stats", () => {
  it("round-trips: a signed row verifies and reports the same numbers", async () => {
    const row = await signedRow();
    const res = await verifyCharacterStats(row, USER);
    expect(res).toEqual({
      ok: true,
      stats: { level: 80, itemLevel: 480, combatPower: 39_980 },
    });
  });

  it("signs what the resolve route actually passes it", async () => {
    // The signer is handed the `VerifiedGameCharacter` straight off the NCSoft
    // call, which carries `characterId` and no `id` and no `gameCharacterId`. It
    // used to be read as "not a game character", return null, and leave every row
    // unsigned — which fails closed, so the feature shipped dead: no character
    // could ever satisfy an offer that asked for gear.
    const sig = await signCharacterStats(live, USER);
    expect(sig).toBeTruthy();

    // ...and that signature still verifies against the roster row, where the same
    // character is stored under `game:<id>` with no `characterId` field at all.
    const row = { ...storedRow(), [STATS_SIG_FIELD]: sig };
    expect(await trustCharacterStats(row, USER)).not.toBeNull();
  });

  it("mints the same signature for the profile shape and the stored row shape", async () => {
    const fromProfile = await signCharacterStats(live, USER);
    // The roster row has no `characterId` field at all, only `game:` in its `id`.
    // The signer has to read the same character out of both.
    const fromRow = await signCharacterStats({ ...storedRow() } as any, USER);
    expect(fromProfile).toBeTruthy();
    expect(fromProfile).toBe(fromRow);
  });

  it("hands back trustable stats", async () => {
    const trusted = await trustCharacterStats(await signedRow(), USER);
    expect(trusted).not.toBeNull();
    expect(trusted?.itemLevel).toBe(480);
    expect(trusted?.level).toBe(80);
    expect(trusted?.combatPower).toBe(39_980);
  });

  it("is stable across the same value arriving as a string or a float", async () => {
    const a = await signCharacterStats({ ...live, itemLevel: "480" as any }, USER);
    const b = await signCharacterStats({ ...live, itemLevel: 480.0 }, USER);
    expect(a).toBeTruthy();
    expect(a).toBe(b);
  });
});

describe("forging stats does not work", () => {
  it("rejects an inflated combat power (the bypass this replaces)", async () => {
    const row = await signedRow();
    row.cpAp = 999_999;
    const res = await verifyCharacterStats(row, USER);
    expect(res).toEqual({ ok: false, reason: "bad-signature" });
    expect(await trustCharacterStats(row, USER)).toBeNull();
  });

  it("rejects an inflated item level", async () => {
    const row = await signedRow();
    row.itemLevel = 1000;
    expect(await trustCharacterStats(row, USER)).toBeNull();
  });

  it("rejects an inflated level, which is what the Level 45 gate reads", async () => {
    // The gate used to take `level` straight off the request body, so this field
    // was the cheapest way past it. Signed here at 10 and then raised to 80: the
    // only difference is the number the player did not earn.
    const row = storedRow({ level: 10 });
    row[STATS_SIG_FIELD] = await signCharacterStats({ ...live, level: 10 }, USER);
    row.level = 80;
    expect(await trustCharacterStats(row, USER)).toBeNull();
  });

  it("ignores a `combatPower` edit that leaves the signed `cpAp` alone", async () => {
    // Both names hold the same number and every reader prefers `cpAp`, the field
    // `toStoredCharacter` writes. So writing only the other one does not move the
    // gate — it still reports the verified figure, which is the correct outcome:
    // the forged field is not read at all.
    const row = await signedRow();
    (row as any).combatPower = 999_999;
    const trusted = await trustCharacterStats(row, USER);
    expect(trusted).not.toBeNull();
    expect(trusted?.combatPower).toBe(39_980);
  });

  it("rejects a level raised above STAT_MAX rather than clamping it into a pass", async () => {
    const row = await signedRow();
    row.level = 99_999;
    expect(await trustCharacterStats(row, USER)).toBeNull();
  });

  it("rejects moving the signature onto another character", async () => {
    const row = await signedRow();
    row.gameCharacterId = "char-someone-else";
    expect(await trustCharacterStats(row, USER)).toBeNull();
  });

  it("rejects a signature minted for another account", async () => {
    // Two accounts holding the same character: one player's signature must not
    // launder the other's stats into a row this account owns.
    const sig = await signCharacterStats(live, OTHER);
    const row = { ...storedRow(), [STATS_SIG_FIELD]: sig };
    const res = await verifyCharacterStats(row, USER);
    expect(res).toEqual({ ok: false, reason: "bad-signature" });
    expect(await trustCharacterStats(row, OTHER)).not.toBeNull();
  });

  it("rejects a truncated signature without throwing on the compare", async () => {
    const row = await signedRow();
    row[STATS_SIG_FIELD] = String(row[STATS_SIG_FIELD]).slice(0, 10);
    expect(await verifyCharacterStats(row, USER)).toEqual({
      ok: false,
      reason: "bad-signature",
    });
  });

  it("rejects an unsigned row, which is every row written before this existed", async () => {
    const res = await verifyCharacterStats(storedRow(), USER);
    expect(res).toEqual({ ok: false, reason: "unsigned" });
    expect(await trustCharacterStats(storedRow(), USER)).toBeNull();
  });

  it("rejects a hand-written signature", async () => {
    const row = { ...storedRow(), [STATS_SIG_FIELD]: "not-a-real-signature" };
    expect(await trustCharacterStats(row, USER)).toBeNull();
  });
});

describe("freshness", () => {
  it("accepts a row verified a moment ago", async () => {
    expect(await trustCharacterStats(await signedRow({ verifiedAt: Date.now() - 1000 }), USER)).not.toBeNull();
  });

  it("refuses a row past the freshness window", async () => {
    const stale = Date.now() - STATS_FRESH_MS - 60_000;
    expect(await trustCharacterStats(await signedRow({ verifiedAt: stale }), USER)).toBeNull();
  });

  it("refuses a timestamp pushed into the future", async () => {
    const row = await signedRow({ verifiedAt: Date.now() + 60_000 });
    expect(await trustCharacterStats(row, USER)).toBeNull();
  });

  it("refuses a missing or non-numeric timestamp", () => {
    expect(isStatsFreshEnough(undefined)).toBe(false);
    expect(isStatsFreshEnough(0)).toBe(false);
    expect(isStatsFreshEnough("soon")).toBe(false);
  });
});

describe("with no signing key configured", () => {
  beforeEach(() => {
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.AUTH_SECRET;
    resetStatsKeyCacheForTests();
  });

  it("mints nothing rather than minting something meaningless", async () => {
    expect(await signCharacterStats(live, USER)).toBeNull();
  });

  it("trusts nothing, so a gated offer is unapplyable rather than unenforced", async () => {
    expect(await trustCharacterStats(storedRow({ [STATS_SIG_FIELD]: "anything" }), USER)).toBeNull();
  });
});

describe("bounds", () => {
  it("keeps its ceilings above any real Aion 2 value", () => {
    expect(STAT_MAX.level).toBeGreaterThanOrEqual(200);
    expect(STAT_MAX.itemLevel).toBeGreaterThanOrEqual(1000);
    expect(STAT_MAX.combatPower).toBeGreaterThanOrEqual(100_000);
  });

  it("uses the site's existing combat power ceiling, not a second one", () => {
    // `sanitizeAionCpAp` already caps applicant rows at this number. Two
    // independent bounds would drift, and the lower one would start rejecting
    // real players the moment the other was raised.
    expect(STAT_MAX.combatPower).toBe(AION2_CPAP_MAX);
  });

  it("clamps a signed value rather than trusting it raw", async () => {
    // Signed as an absurd number, so the signature is genuinely valid over it,
    // and the ceiling still applies when the value is read back.
    const sig = await signCharacterStats({ ...live, itemLevel: 50_000 }, USER);
    const row = { ...storedRow({ itemLevel: 50_000 }), [STATS_SIG_FIELD]: sig };
    const res = await verifyCharacterStats(row, USER);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.stats.itemLevel).toBe(STAT_MAX.itemLevel);
  });
});
