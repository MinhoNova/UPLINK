"use client";

export interface AionServiceOption {
  label: string;
  priceUsd: number;
}

export interface AionService {
  id: string;
  name: string;
  category: string;
  description: string;
  basePriceUsd: number;
  priceUnit?: string;
  express: number;
  superExpress: number;
  options?: AionServiceOption[];
  extras?: AionServiceOption[];
}

const EU_VAT_EUR = 1.0;

function eur(n: number): number {
  return Math.round(n * 1.09 * 100) / 100;
}

export const AION_SERVICES: AionService[] = [
  {
    id: "kinah",
    name: "Kinah",
    category: "Currency",
    description: "Quick delivery of Kinah — any amount.",
    basePriceUsd: eur(5.71),
    priceUnit: "per Million (M)",
    express: eur(1.14),
    superExpress: eur(2.28),
  },
  {
    id: "powerleveling",
    name: "Powerleveling",
    category: "Leveling",
    description: "Fast leveling to your target. Example 1 → 30.",
    basePriceUsd: eur(169.93),
    priceUnit: "1 → 30 range",
    express: eur(33.99),
    superExpress: eur(67.97),
    extras: [
      { label: "Story Quest", priceUsd: eur(20.66) },
      { label: "140 Empyrean Traces", priceUsd: eur(14.58) },
      { label: "560 Empyrean Traces", priceUsd: eur(48.6) },
      { label: "Strongholds", priceUsd: eur(13.77) },
      { label: "Sealed Dungeons", priceUsd: eur(55.08) },
    ],
  },
  {
    id: "ludra",
    name: "Abyssal Forge: Ludra",
    category: "Raids",
    description: "Raid clear. Requires Lv45 + Gear Score.",
    basePriceUsd: eur(42.92),
    priceUnit: "per clear",
    express: eur(8.58),
    superExpress: eur(17.17),
  },
  {
    id: "beritra",
    name: "Beritra Brigade Fortress",
    category: "Raids",
    description: "Raid clear at Easy / Normal / Difficult.",
    basePriceUsd: eur(10.52),
    priceUnit: "per clear",
    express: eur(2.1),
    superExpress: eur(4.21),
    options: [
      { label: "Normal", priceUsd: eur(3.16) },
      { label: "Difficult", priceUsd: eur(5.26) },
    ],
  },
  {
    id: "hourly-driving",
    name: "Aion 2 Hourly Driving",
    category: "Collections",
    description: "Any task — skip the grind.",
    basePriceUsd: eur(8.09),
    priceUnit: "per hour",
    express: eur(1.62),
    superExpress: eur(3.24),
  },
  {
    id: "empyrean-traces",
    name: "Empyrean Traces Farm",
    category: "Collections",
    description: "Both continents.",
    basePriceUsd: eur(0.8),
    priceUnit: "per farm",
    express: eur(0.16),
    superExpress: eur(0.32),
    options: [
      { label: "Allied Side Traces", priceUsd: eur(47.79) },
      { label: "Enemy Side Traces", priceUsd: eur(55.08) },
    ],
  },
  {
    id: "expeditions",
    name: "Expeditions",
    category: "Dungeons",
    description: "Krao Cave, Draupnir, Urugugu Canyon, Vakron's, Fire Temple, Ferocious Horn Den, Dead Dramata's Nest. Conquest variants available.",
    basePriceUsd: eur(5.21),
    priceUnit: "per dungeon",
    express: eur(1.04),
    superExpress: eur(2.08),
    options: [
      { label: "Conquest", priceUsd: 0 },
      { label: "Conquest Hard", priceUsd: eur(2.61) },
    ],
  },
  {
    id: "transcendence",
    name: "Transcendence",
    category: "Dungeons",
    description: "Deus Research Base / Shattered Arcanis. All stages available.",
    basePriceUsd: eur(2.5),
    priceUnit: "per stage",
    express: eur(0.5),
    superExpress: eur(1.0),
    options: [
      { label: "Stage 1-4", priceUsd: eur(1.7) },
      { label: "Stage 5-7", priceUsd: eur(2.67) },
      { label: "Stage 8", priceUsd: eur(4.78) },
      { label: "Stage 9", priceUsd: eur(6.08) },
      { label: "Stage 10", priceUsd: eur(6.8) },
    ],
  },
  {
    id: "sealed-dungeons",
    name: "Sealed Dungeons",
    category: "Dungeons",
    description: "All Sealed Dungeons on the desired continent.",
    basePriceUsd: eur(55.88),
    priceUnit: "per continent",
    express: eur(11.18),
    superExpress: eur(22.35),
    options: [
      { label: "Allied Continent", priceUsd: eur(55.08) },
      { label: "Enemy Continent", priceUsd: eur(58.32) },
    ],
  },
  {
    id: "strongholds",
    name: "Strongholds",
    category: "Dungeons",
    description: "Up to 30 Strongholds, both sides.",
    basePriceUsd: eur(13.68),
    priceUnit: "per continent",
    express: eur(2.74),
    superExpress: eur(5.47),
    options: [
      { label: "Allied Continent (15)", priceUsd: eur(12.88) },
      { label: "Enemy Continent (15)", priceUsd: eur(14.9) },
    ],
  },
  {
    id: "ascension-trials",
    name: "Ascension Trials",
    category: "Dungeons",
    description: "Highest score achieved on desired difficulty.",
    basePriceUsd: eur(14.57),
    priceUnit: "per clear",
    express: eur(2.91),
    superExpress: eur(5.83),
    options: [
      { label: "Easy", priceUsd: eur(13.77) },
      { label: "Normal", priceUsd: eur(17.01) },
      { label: "Difficult", priceUsd: eur(20.41) },
      { label: "Extreme", priceUsd: eur(23.73) },
    ],
  },
  {
    id: "daily-dungeons",
    name: "Daily Dungeons",
    category: "Dungeons",
    description: "Get maximum rewards — up to 7 runs.",
    basePriceUsd: eur(1.77),
    priceUnit: "per day",
    express: eur(0.35),
    superExpress: eur(0.71),
    extras: [
      { label: "140 Empyrean Traces", priceUsd: eur(14.58) },
      { label: "560 Empyrean Traces", priceUsd: eur(48.6) },
      { label: "All Strongholds", priceUsd: eur(13.77) },
      { label: "All Sealed Dungeons", priceUsd: eur(55.08) },
    ],
  },
  {
    id: "abyss-points",
    name: "Abyss Points Farm",
    category: "PVP",
    description: "Farm Abyss Points for exclusive gear & items.",
    basePriceUsd: eur(8.09),
    priceUnit: "per 10k points",
    express: eur(1.62),
    superExpress: eur(3.24),
    extras: [
      { label: "140 Empyrean Traces", priceUsd: eur(14.58) },
      { label: "560 Empyrean Traces", priceUsd: eur(48.6) },
    ],
  },
  {
    id: "cooking",
    name: "Cooking",
    category: "Professions",
    description: "Level Cooking to max (up to level 20).",
    basePriceUsd: eur(39.28),
    priceUnit: "level 1 → 20",
    express: eur(7.86),
    superExpress: eur(15.71),
  },
  {
    id: "alchemy",
    name: "Alchemy",
    category: "Professions",
    description: "Level Alchemy to max (up to level 20).",
    basePriceUsd: eur(22.35),
    priceUnit: "level 1 → 20",
    express: eur(4.47),
    superExpress: eur(8.94),
  },
];

export const AION_CATEGORIES = [
  "Currency",
  "Leveling",
  "Raids",
  "Dungeons",
  "Collections",
  "PVP",
  "Professions",
];

export const SERVICE_BY_ID = Object.fromEntries(AION_SERVICES.map((s) => [s.id, s]));

export const AION_CLASSES = [
  "Templar",
  "Gladiator",
  "Assassin",
  "Ranger",
  "Sorcerer",
  "Spiritmaster",
  "Chanter",
  "Cleric",
  "Gunner",
  "Aethertech",
  "Songweaver",
];

export const AION_CLASS_GROUPS = {
  Warrior: ["Templar", "Gladiator"],
  Scout: ["Assassin", "Ranger"],
  Mage: ["Sorcerer", "Spiritmaster"],
  Priest: ["Chanter", "Cleric"],
  Techist: ["Gunner", "Aethertech", "Songweaver"],
};

export function formatUsd(n: number): string {
  return `$${n.toFixed(2)}`;
}
