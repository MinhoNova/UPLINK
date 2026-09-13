import type { CSSProperties } from "react";

export type HeroBgKey = "scenic" | "void" | "aurora" | "ember" | "glacier";

export interface HeroBgOption {
  key: HeroBgKey;
  label: string;
  style?: CSSProperties;
}

/* Curated allow-list. STYLE VALUES COME FROM THIS FILE ONLY —
   never from user/network input, so switching backgrounds cannot inject code. */
export const HERO_BG_OPTIONS: readonly HeroBgOption[] = [
  { key: "scenic", label: "Scenic Art" },
  {
    key: "void",
    label: "Deep Space",
    style: { background: "linear-gradient(160deg,#04060f 0%,#0a1022 55%,#0d1530 100%)" },
  },
  {
    key: "aurora",
    label: "Aurora",
    style: { background: "linear-gradient(160deg,#0b1026 0%,#1e3a8a 45%,#7c3aed 75%,#db2777 100%)" },
  },
  {
    key: "ember",
    label: "Ember Night",
    style: { background: "linear-gradient(160deg,#12070a 0%,#5f1a1a 55%,#b45309 100%)" },
  },
  {
    key: "glacier",
    label: "Glacier",
    style: { background: "linear-gradient(160deg,#041014 0%,#0e7490 50%,#38bdf8 100%)" },
  },
];

export const HERO_BG_DEFAULT: HeroBgKey = "scenic";

const HERO_BG_INDEX = new Map<string, HeroBgOption>(HERO_BG_OPTIONS.map((o) => [o.key, o]));
export const HERO_BG_ALLOWED = new Set<string>(HERO_BG_OPTIONS.map((o) => o.key));

/** Safe resolver: unknown/missing keys always collapse to the default. */
export function resolveHeroBg(raw: unknown): HeroBgKey {
  const key = String(raw ?? "");
  return HERO_BG_ALLOWED.has(key) ? (key as HeroBgKey) : HERO_BG_DEFAULT;
}

export function heroBgStyle(key: HeroBgKey): CSSProperties | undefined {
  return HERO_BG_INDEX.get(key)?.style;
}

export function heroBgLabel(key: HeroBgKey): string {
  return HERO_BG_INDEX.get(key)?.label ?? key;
}