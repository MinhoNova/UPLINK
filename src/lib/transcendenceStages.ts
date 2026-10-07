/**
 * The two Transcendence dungeons and the Item Level each of their four stages
 * demands.
 *
 * This is the real-game floor, and the single source for it. The offer catalogue
 * (`aionServices.ts`) renders these stages with these numbers, the offer builder
 * auto-fills the Item Level requirement from the stage, and the server clamps
 * stored requirements up to the matching floor on every write — because an offer
 * on "Deus Research Base · Stage 4" asking for anything under 2300 would be
 * selling a clear nobody under 2300 can even enter.
 *
 * Deliberately directive-free: unlike `aionServices.ts` this module carries no
 * `"use client"`, so the apply/edit/bulk-write route handlers (server-only)
 * import the same thresholds the browser builder shows. One number, every place.
 */

export type TranscendenceDungeon = {
  label: string;
  img: string;
  stageItemLevels: readonly number[];
  /** Kinah (millions) per stage, as listed. */
  stagePrices: readonly number[];
};

export const TRANSCENDENCE_DUNGEONS: readonly TranscendenceDungeon[] = [
  {
    label: "Deus Research Base",
    img: "/dungeons/deus-research-base.png",
    stageItemLevels: [1600, 1900, 2100, 2300],
    stagePrices: [7, 9, 11, 13],
  },
  {
    label: "Shattered Arcanis",
    img: "/dungeons/shattered-arcanis.png",
    stageItemLevels: [1600, 1900, 2100, 2300],
    stagePrices: [7, 9, 11, 13],
  },
];

/** A dungeon this site sells stages for, or null. */
export function transcendenceDungeon(label: string | null | undefined): TranscendenceDungeon | null {
  if (!label) return null;
  return TRANSCENDENCE_DUNGEONS.find((d) => d.label === label) ?? null;
}

/**
 * The Item Level a named stage of a Transcendence dungeon demands.
 *
 * `0` means "not a Transcendence stage we know" — the caller treats it as "no
 * floor", so reads and writes for every other service are untouched.
 */
export function transcendenceStageFloor(
  dungeonLabel: string | null | undefined,
  stageLabel: string | null | undefined
): number {
  const dungeon = transcendenceDungeon(dungeonLabel);
  if (!dungeon || !stageLabel) return 0;
  const m = /^Stage\s*(\d+)$/i.exec(String(stageLabel).trim());
  if (!m) return 0;
  const i = Number(m[1]) - 1;
  if (!Number.isFinite(i) || i < 0 || i >= dungeon.stageItemLevels.length) return 0;
  return dungeon.stageItemLevels[i] || 0;
}

/** The floor an already-stored offer must meet, read off its own dropdown fields. */
export function lobbyStageItemLevel(lobby: any): number {
  if (String(lobby?.serviceName || "") !== "Transcendence") return 0;
  return transcendenceStageFloor(
    String(lobby?.selectedOptionGroup || ""),
    String(lobby?.selectedOption || "")
  );
}