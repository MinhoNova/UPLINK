/** Aion 2 launch classes + role mapping — pure module, safe for server & client. */

export const AION2_CLASSES = [
  "Templar",
  "Gladiator",
  "Assassin",
  "Ranger",
  "Sorcerer",
  "Spiritmaster",
  "Cleric",
  "Chanter",
] as const;

export type Aion2ClassName = (typeof AION2_CLASSES)[number];

export const AION2_CLASS_ROLE: Record<string, string> = {
  Templar: "tank",
  Gladiator: "tank",
  Assassin: "dps",
  Ranger: "dps",
  Sorcerer: "dps",
  Spiritmaster: "dps",
  Cleric: "healer",
  Chanter: "healer",
};

export const AION2_ROLE_LABEL: Record<string, string> = {
  tank: "TANK",
  healer: "HEALER",
  dps: "DPS",
  support: "SUPPORT",
};

export function isAionClass(c: unknown): boolean {
  return typeof c === "string" && (AION2_CLASSES as readonly string[]).includes(c);
}

export function aionClassRole(c: unknown): string {
  if (typeof c === "string" && AION2_CLASS_ROLE[c]) return AION2_CLASS_ROLE[c];
  const str = String(c || "").toLowerCase();
  if (AION2_CLASS_ROLE[str]) return AION2_CLASS_ROLE[str];
  return "dps";
}

export function sanitizeAionClass(c: unknown): string {
  if (isAionClass(c)) return c as string;
  return "";
}

export const AION2_LEVEL_MAX = 99;
export const AION2_CPAP_MAX = 100000;

export function sanitizeAionLevel(raw: unknown): number {
  const n = parseInt(String(raw ?? ""), 10);
  if (Number.isNaN(n)) return 1;
  return Math.min(AION2_LEVEL_MAX, Math.max(1, n));
}

export function sanitizeAionCpAp(raw: unknown): number {
  const n = parseInt(String(raw ?? ""), 10);
  if (Number.isNaN(n)) return 0;
  return Math.min(AION2_CPAP_MAX, Math.max(0, n));
}