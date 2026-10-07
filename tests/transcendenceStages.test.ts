import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * The Transcendence catalogue and its per-stage Item Level floors.
 *
 * Each Transcendence dungeon has four stages, each carrying a real-game Item
 * Level floor (1600/1900/2100/2300). The floor has to hold in three places and
 * they are not allowed to drift apart: the catalogue the browser builds an offer
 * from, the lookup the server clamps stored requirements up to on every write,
 * and the ceiling check that lets a 2300 number exist at all. These tests pin
 * all three against the same source.
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

import { validateLobbies } from "@/lib/secureDataWrite";
import { STAT_MAX } from "@/lib/characterStatsLimits";
import {
  TRANSCENDENCE_DUNGEONS,
  transcendenceStageFloor,
  lobbyStageItemLevel,
} from "@/lib/transcendenceStages";
import { AION_SERVICES } from "@/lib/aionServices";

const OWNER = "owner-1";

/** An offer on a Transcendence stage, as the create flow would store one. */
function transcendenceLobby(overrides: Record<string, unknown> = {}) {
  return {
    id: "lobby-t1",
    ownerId: OWNER,
    category: "dungeon",
    status: "standby",
    serviceName: "Transcendence",
    selectedOptionGroup: "Deus Research Base",
    selectedOption: "Stage 4",
    applicants: [],
    accepted: [],
    history: [],
    minItemLevel: 0,
    minCombatPower: 0,
    ...overrides,
  };
}

/** Pretend a save came through `/api/data` and read back what got stored. */
function storedWrite(next: Record<string, unknown>) {
  const res = validateLobbies([transcendenceLobby()], [transcendenceLobby(next)], OWNER, false);
  expect(res.ok).toBe(true);
  if (!res.ok) throw new Error("write rejected");
  return (res.value as any[])[0];
}

beforeEach(() => {
  process.env.NEXTAUTH_SECRET = "test-root-secret-for-transcendence";
  delete process.env.AUTH_SECRET;
  getKVMock.mockReset();
  createLimitMock.mockClear();
  applyLimitMock.mockClear();
});

describe("the catalogue", () => {
  const transcendence = AION_SERVICES.find((s) => s.name === "Transcendence");
  it("sells the two dungeons, each with the four stages at their listed prices", () => {
    expect(transcendence?.options?.map((o) => o.label)).toEqual([
      "Deus Research Base",
      "Shattered Arcanis",
    ]);
    for (const opt of transcendence?.options ?? []) {
      expect(opt.variants?.map((v) => v.label)).toEqual(["Stage 1", "Stage 2", "Stage 3", "Stage 4"]);
      expect(opt.variants?.map((v) => v.priceKina)).toEqual([7, 9, 11, 13]);
    }
  });

  it("carries the same stage floors the enforcement layer reads", () => {
    for (const opt of transcendence?.options ?? []) {
      const source = TRANSCENDENCE_DUNGEONS.find((d) => d.label === opt.label)!;
      expect(opt.variants?.map((v) => v.minItemLevel)).toEqual([...source.stageItemLevels]);
      expect(opt.variants?.map((v) => v.minItemLevel)).toEqual([1600, 1900, 2100, 2300]);
    }
  });
});

describe("the floor lookup", () => {
  it("returns 1600/1900/2100/2300 for the named stages of either dungeon", () => {
    for (const d of TRANSCENDENCE_DUNGEONS) {
      expect(transcendenceStageFloor(d.label, "Stage 1")).toBe(1600);
      expect(transcendenceStageFloor(d.label, "Stage 2")).toBe(1900);
      expect(transcendenceStageFloor(d.label, "Stage 3")).toBe(2100);
      expect(transcendenceStageFloor(d.label, "Stage 4")).toBe(2300);
    }
    expect(transcendenceStageFloor("Deus Research Base", "stage 3")).toBe(2100);
  });

  it("returns 0 for anything that is not a known Transcendence stage", () => {
    expect(transcendenceStageFloor("Deus Research Base", "Stage 5")).toBe(0);
    expect(transcendenceStageFloor("Deus Research Base", "Normal")).toBe(0);
    expect(transcendenceStageFloor("Aion Market", "Stage 2")).toBe(0);
    expect(transcendenceStageFloor(null, "Stage 2")).toBe(0);
  });

  it("reads an offer's own dropdown fields", () => {
    expect(lobbyStageItemLevel(transcendenceLobby())).toBe(2300);
    expect(
      lobbyStageItemLevel(
        transcendenceLobby({ selectedOptionGroup: "Shattered Arcanis", selectedOption: "Stage 1" })
      )
    ).toBe(1600);
    expect(
      lobbyStageItemLevel({ ...transcendenceLobby(), serviceName: "Expeditions" })
    ).toBe(0);
    expect(lobbyStageItemLevel({ ...transcendenceLobby(), selectedOption: undefined })).toBe(0);
  });
});

describe("the write clamp", () => {
  it("raises an under-floor requirement up to the stage's floor", () => {
    expect(storedWrite({ selectedOption: "Stage 4", minItemLevel: 0 }).minItemLevel).toBe(2300);
    expect(storedWrite({ selectedOption: "Stage 4", minItemLevel: 999 }).minItemLevel).toBe(2300);
    expect(
      storedWrite({ selectedOptionGroup: "Shattered Arcanis", selectedOption: "Stage 1", minItemLevel: 0 })
        .minItemLevel
    ).toBe(1600);
  });

  it("keeps a requirement the owner set above the floor", () => {
    expect(storedWrite({ selectedOption: "Stage 4", minItemLevel: 2500 }).minItemLevel).toBe(2500);
  });

  it("leaves offers that are not on a Transcendence stage alone", () => {
    expect(
      storedWrite({ serviceName: "Expeditions", selectedOption: "Normal", minItemLevel: 0 }).minItemLevel
    ).toBe(0);
    expect(
      storedWrite({ selectedOption: "Normal", minItemLevel: 0 }).minItemLevel
    ).toBe(0);
  });
});

describe("the ceiling", () => {
  it("sits above the highest stage floor, so 2300 survives every clamp", () => {
    expect(STAT_MAX.itemLevel).toBeGreaterThanOrEqual(2300);
  });
});