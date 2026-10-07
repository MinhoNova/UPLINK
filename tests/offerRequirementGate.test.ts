import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * The gear requirement, end to end through the roster write.
 *
 * `/api/lobbies/apply` and the Discord command were never the whole attack
 * surface: `/api/data` accepts a whole `lobbies` array, so an applicant could be
 * appended to an offer's `applicants` without ever touching the apply route. That
 * is the path these cases pin, because it is the one that took the roster the
 * offer is later read from.
 *
 * The character rows in `characters` are caller-supplied too, which is the other
 * half: the row has to carry a signature the server minted, or its numbers are
 * not the site's to believe.
 */
const { getKVMock, posterStandingMock, createLimitMock, applyLimitMock } = vi.hoisted(() => ({
  getKVMock: vi.fn(),
  posterStandingMock: vi.fn(async () => ({ allowed: true, reason: "approved" })),
  createLimitMock: vi.fn(async () => ({ ok: true })),
  applyLimitMock: vi.fn(async () => ({ ok: true })),
}));

vi.mock("@/lib/db", () => ({ getKV: getKVMock as any }));
vi.mock("@/lib/posterApproval", () => ({ getPosterStanding: posterStandingMock as any }));
vi.mock("@/lib/offerDailyLimit", () => ({
  checkAndRecordOfferCreate: createLimitMock,
  checkAndRecordOfferApply: applyLimitMock,
}));

import { validateDataWrites, validateLobbies } from "@/lib/secureDataWrite";
import { resetStatsKeyCacheForTests, signCharacterStats, STATS_SIG_FIELD } from "@/lib/characterStatsSig";
import { STAT_MAX } from "@/lib/characterStatsLimits";

const OWNER = "owner-1";
const APPLICANT = "player-2";
const CHAR_ID = "char-real-123";

/** An offer that wants a geared character. */
function lobbyWithRequirement(overrides: Record<string, unknown> = {}) {
  return {
    id: "lobby-1",
    ownerId: OWNER,
    status: "standby",
    applicants: [],
    accepted: [],
    history: [],
    minItemLevel: 480,
    minCombatPower: 30_000,
    ...overrides,
  };
}

/** The applicant slot someone would append to get themselves into the offer. */
function applicantRow(overrides: Record<string, unknown> = {}) {
  return {
    id: `game:${CHAR_ID}`,
    applicantId: APPLICANT,
    applicantName: "Player",
    aionClass: "berserker",
    role: "dps",
    level: 80,
    cpAp: 30_000,
    ...overrides,
  };
}

/** A roster row holding the real numbers, signed by the server. */
async function verifiedRow(overrides: Record<string, unknown> = {}) {
  const profile = {
    characterId: CHAR_ID,
    level: 80,
    itemLevel: 480,
    combatPower: 30_000,
  };
  const sig = await signCharacterStats(profile, APPLICANT);
  return {
    id: `game:${CHAR_ID}`,
    gameCharacterId: CHAR_ID,
    userId: APPLICANT,
    level: profile.level,
    itemLevel: profile.itemLevel,
    cpAp: profile.combatPower,
    verifiedAt: Date.now(),
    [STATS_SIG_FIELD]: sig,
    ...overrides,
  };
}

/** A roster row claiming the same character with numbers nobody verified. */
function forgedRow(overrides: Record<string, unknown> = {}) {
  return {
    id: `game:${CHAR_ID}`,
    gameCharacterId: CHAR_ID,
    userId: APPLICANT,
    level: 80,
    itemLevel: 1000,
    cpAp: 99_000,
    verifiedAt: Date.now(),
    [STATS_SIG_FIELD]: "made-up",
    ...overrides,
  };
}

function serveCharacters(rows: any[]) {
  getKVMock.mockImplementation(async (key: string) => (key === "characters" ? rows : []));
}

/**
 * The write an attacker makes: their own roster, plus the offer with themselves
 * appended to its applicants — the part the apply route would have done, done
 * through the endpoint that takes the whole array.
 */
async function submitAsApplicant(overrides: Record<string, unknown> = {}) {
  return validateDataWrites(
    { lobbies: [lobbyWithRequirement({ applicants: [applicantRow()], ...overrides })] },
    { lobbies: [lobbyWithRequirement()], registeredUsers: [] },
    APPLICANT,
    "Player"
  );
}

/** An ordinary save that touches nothing about eligibility. */
async function submitAsOwner(overrides: Record<string, unknown> = {}) {
  return validateDataWrites(
    { lobbies: [lobbyWithRequirement(overrides)] },
    { lobbies: [lobbyWithRequirement()], registeredUsers: [] },
    OWNER,
    "Owner"
  );
}

beforeEach(() => {
  process.env.NEXTAUTH_SECRET = "test-root-secret-for-offer-gate";
  delete process.env.AUTH_SECRET;
  resetStatsKeyCacheForTests();
  getKVMock.mockReset();
  createLimitMock.mockClear();
  applyLimitMock.mockClear();
});

describe("appending yourself to an offer that asks for gear", () => {
  it("is refused when the roster row is unsigned", async () => {
    serveCharacters([
      { id: `game:${CHAR_ID}`, userId: APPLICANT, itemLevel: 1000, cpAp: 99_000, verifiedAt: Date.now() },
    ]);
    const res = await submitAsApplicant();
    expect(res.ok).toBe(false);
  });

  it("is refused when the roster row's signature does not cover its numbers", async () => {
    // The attack in full: a row claiming Item Level 1000 and 99k power, written
    // straight into the roster, with the signature field filled in so it looks
    // like a synced character.
    serveCharacters([forgedRow()]);
    const res = await submitAsApplicant();
    expect(res.ok).toBe(false);
  });

  it("is refused when the signed character is simply under the bar", async () => {
    // The honest version: a real, verified, but under-geared character.
    serveCharacters([await verifiedRow({ itemLevel: 300, cpAp: 10_000 })]);
    const res = await submitAsApplicant();
    expect(res.ok).toBe(false);
  });

  it("is refused when the roster row belongs to somebody else", async () => {
    // A row owned by another account must not be usable to qualify, however
    // strong it is.
    serveCharacters([await verifiedRow({ userId: "someone-else" })]);
    const res = await submitAsApplicant();
    expect(res.ok).toBe(false);
  });

  it("is allowed when the server's own signature covers the numbers", async () => {
    serveCharacters([await verifiedRow()]);
    const res = await submitAsApplicant();
    expect(res.ok).toBe(true);
  });

  it("is allowed when the character clears the only bar the offer sets", async () => {
    const row = await verifiedRow();
    row.cpAp = 0;
    row[STATS_SIG_FIELD] = await signCharacterStats(
      { characterId: CHAR_ID, level: 80, itemLevel: 480, combatPower: 0 },
      APPLICANT
    );
    serveCharacters([row]);

    const res = await validateDataWrites(
      {
        lobbies: [
          lobbyWithRequirement({
            minItemLevel: 480,
            minCombatPower: 0,
            applicants: [applicantRow()],
          }),
        ],
      },
      {
        lobbies: [lobbyWithRequirement({ minItemLevel: 480, minCombatPower: 0 })],
        registeredUsers: [],
      },
      APPLICANT,
      "Player"
    );
    expect(res.ok).toBe(true);
  });

  it("does not re-judge an applicant who was already on the offer", async () => {
    // Their row may have gone stale since they applied. Re-checking on every save
    // would drop people out of offers they had already joined.
    serveCharacters([forgedRow()]);
    const already = [applicantRow()];
    const res = await validateDataWrites(
      { lobbies: [lobbyWithRequirement({ applicants: already })] },
      { lobbies: [lobbyWithRequirement({ applicants: already })], registeredUsers: [] },
      OWNER,
      "Owner"
    );
    expect(res.ok).toBe(true);
  });
});

describe("offers that ask for nothing", () => {
  it("stay open, so the feature cannot block applications site-wide", async () => {
    serveCharacters([forgedRow()]);
    const res = await validateDataWrites(
      {
        lobbies: [
          lobbyWithRequirement({
            minItemLevel: 0,
            minCombatPower: 0,
            applicants: [applicantRow()],
          }),
        ],
      },
      {
        lobbies: [lobbyWithRequirement({ minItemLevel: 0, minCombatPower: 0 })],
        registeredUsers: [],
      },
      APPLICANT,
      "Player"
    );
    expect(res.ok).toBe(true);
  });
});

describe("requirements an owner types", () => {
  it("are clamped on the way in rather than stored as typed", () => {
    const res = validateLobbies(
      [lobbyWithRequirement()],
      [lobbyWithRequirement({ minItemLevel: 99_999, minCombatPower: -5 })],
      OWNER,
      false
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const rows = res.value as any[];
    expect(rows[0].minItemLevel).toBe(STAT_MAX.itemLevel);
    expect(rows[0].minCombatPower).toBe(0);
  });

  it("leaves an offer that never set them alone", () => {
    const bare = lobbyWithRequirement({ minItemLevel: undefined, minCombatPower: undefined });
    const res = validateLobbies([lobbyWithRequirement()], [bare], OWNER, false);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const rows = res.value as any[];
    expect(rows[0].minItemLevel).toBeFalsy();
    expect(rows[0].minCombatPower).toBeFalsy();
  });

  it("does not 500 on an absurd requirement", async () => {
    serveCharacters([]);
    const res = await submitAsOwner({ minItemLevel: 9999 });
    expect(typeof res.ok).toBe("boolean");
  });
});
