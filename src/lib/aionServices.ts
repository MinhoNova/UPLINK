"use client";

export interface AionServiceOption {
  label: string;
  priceKina: number;
  variants?: AionServiceOption[];
  img?: string;
}

export interface AionService {
  id: string;
  name: string;
  category: string;
  description: string;
  basePriceKina: number;
  priceUnit?: string;
  video?: string;
  express: number;
  superExpress: number;
  options?: AionServiceOption[];
  extras?: AionServiceOption[];
  img?: string;
}

/* Gold-only site — every price is in Kinah (millions). 1M Kinah ≈ $6.5. */
function kinah(usdEquiv: number): number {
  return Math.round((usdEquiv / 6.5) * 100) / 100;
}

export const AION_SERVICES: AionService[] = [
  {
    id: "powerleveling",
    name: "Powerleveling",
    category: "Leveling",
    description: "Fast leveling to your target. Example 1 → 30.",
    basePriceKina: kinah(169.93),
    priceUnit: "1 → 30 range",
    img: "/dungeons/leveling.png",
    express: kinah(33.99),
    superExpress: kinah(67.97),
    extras: [
      { label: "Story Quest", priceKina: kinah(20.66) },
      { label: "140 Empyrean Traces", priceKina: kinah(14.58) },
      { label: "560 Empyrean Traces", priceKina: kinah(48.6) },
      { label: "Strongholds", priceKina: kinah(13.77) },
      { label: "Sealed Dungeons", priceKina: kinah(55.08) },
    ],
  },
  {
    id: "ludra",
    name: "Abyssal Forge: Ludra",
    category: "Raids",
    description: "Raid clear. Requires Lv45 + Gear Score.",
    basePriceKina: kinah(42.92),
    img: "/dungeons/abyssal-forge-ludra.png",
    priceUnit: "per clear",
    express: kinah(8.58),
    superExpress: kinah(17.17),
  },
  {
    id: "beritra",
    name: "Beritra Brigade Fortress",
    category: "Raids",
    description: "Raid clear at Easy / Normal / Difficult.",
    basePriceKina: kinah(10.52),
    img: "/dungeons/beritra-brigade-fortress.png",
    priceUnit: "per clear",
    express: kinah(2.1),
    superExpress: kinah(4.21),
    options: [
      { label: "Normal", priceKina: kinah(3.16) },
      { label: "Difficult", priceKina: kinah(5.26) },
    ],
  },
  {
    id: "daily-dungeons",
    name: "Daily Dungeons",
    category: "Dungeons",
    description: "Get maximum rewards — up to 7 runs.",
    basePriceKina: kinah(1.77),
    priceUnit: "per day",
    express: kinah(0.35),
    superExpress: kinah(0.71),
    img: "/dungeons/daily-dungeons.png",
    extras: [
      { label: "140 Empyrean Traces", priceKina: kinah(14.58) },
      { label: "560 Empyrean Traces", priceKina: kinah(48.6) },
      { label: "All Strongholds", priceKina: kinah(13.77) },
      { label: "All Sealed Dungeons", priceKina: kinah(55.08) },
    ],
  },
  {
    id: "ascension-trials",
    name: "Ascension Trials",
    category: "Dungeons",
    description: "Highest score achieved on desired difficulty.",
    basePriceKina: kinah(14.57),
    priceUnit: "per clear",
    express: kinah(2.91),
    superExpress: kinah(5.83),
    img: "/dungeons/ascension-trials.png",
    options: [
      { label: "Easy", priceKina: kinah(13.77) },
      { label: "Normal", priceKina: kinah(17.01) },
      { label: "Difficult", priceKina: kinah(20.41) },
      { label: "Extreme", priceKina: kinah(23.73) },
    ],
  },
  {
    id: "expeditions",
    name: "Expeditions",
    category: "Dungeons",
    description: "All Season 1 expeditions · Normal & Hard difficulties.",
    basePriceKina: kinah(6.5),
    priceUnit: "per dungeon",
    express: kinah(1.04),
    superExpress: kinah(2.08),
    img: "/dungeons/expedition.png",
    options: [
      {
        label: "Krao Cave",
        priceKina: 0,
        img: "/dungeons/krao-cave.jpg",
        variants: [
          { label: "Normal", priceKina: kinah(6.5) },
          { label: "Hard", priceKina: kinah(9.75) },
        ],
      },
      {
        label: "Draupnir",
        priceKina: 0,
        img: "/dungeons/draupnir.jpg",
        variants: [
          { label: "Normal", priceKina: kinah(6.5) },
          { label: "Hard", priceKina: kinah(9.75) },
        ],
      },
      {
        label: "Urugugu Canyon",
        priceKina: 0,
        img: "/dungeons/urugugu-canyon.jpg",
        variants: [
          { label: "Normal", priceKina: kinah(7.5) },
          { label: "Hard", priceKina: kinah(11.25) },
        ],
      },
      {
        label: "Vakron Floating Island",
        priceKina: 0,
        img: "/dungeons/vakron-floating-island.jpg",
        variants: [
          { label: "Normal", priceKina: kinah(7.5) },
          { label: "Hard", priceKina: kinah(11.25) },
        ],
      },
      {
        label: "Fire Temple",
        priceKina: 0,
        img: "/dungeons/fire-temple.jpg",
        variants: [
          { label: "Normal", priceKina: kinah(9) },
          { label: "Hard", priceKina: kinah(13.5) },
        ],
      },
      {
        label: "Ferocious Horn Den",
        priceKina: 0,
        img: "/dungeons/ferocious-horn-den.jpg",
        variants: [
          { label: "Normal", priceKina: kinah(15) },
          { label: "Hard", priceKina: kinah(22.5) },
        ],
      },
      {
        label: "Dead Dramata Nest",
        priceKina: 0,
        img: "/dungeons/dead-dramata-nest.jpg",
        variants: [
          { label: "Normal", priceKina: kinah(50) },
          { label: "Hard", priceKina: kinah(75) },
        ],
      },
    ],
  },
  {
    id: "transcendence",
    name: "Transcendence",
    category: "Dungeons",
    description: "Deus Research Base / Shattered Arcanis. All stages available.",
    basePriceKina: kinah(2.5),
    priceUnit: "per stage",
    express: kinah(0.5),
    superExpress: kinah(1.0),
    img: "/dungeons/transcendence.png",
    options: [
      { label: "Stage 1-4", priceKina: kinah(1.7) },
      { label: "Stage 5-7", priceKina: kinah(2.67) },
      { label: "Stage 8", priceKina: kinah(4.78) },
      { label: "Stage 9", priceKina: kinah(6.08) },
      { label: "Stage 10", priceKina: kinah(6.8) },
    ],
  },
  {
    id: "sealed-dungeons",
    name: "Sealed Dungeons",
    category: "Dungeons",
    description: "All Sealed Dungeons on the desired continent.",
    basePriceKina: kinah(55.88),
    priceUnit: "per continent",
    express: kinah(11.18),
    superExpress: kinah(22.35),
    img: "/dungeons/sealed-dungeons.png",
    options: [
      { label: "Allied Continent", priceKina: kinah(55.08) },
      { label: "Enemy Continent", priceKina: kinah(58.32) },
    ],
  },
  {
    id: "nightmare",
    name: "Nightmare",
    category: "Dungeons",
    description: "End-game Nightmare dungeon clears.",
    basePriceKina: kinah(5.21),
    priceUnit: "per clear",
    express: kinah(1.04),
    superExpress: kinah(2.08),
    img: "/dungeons/nightmare.png",
  },
  {
    id: "strongholds",
    name: "Strongholds",
    category: "Dungeons",
    description: "Up to 30 Strongholds, both sides.",
    basePriceKina: kinah(13.68),
    priceUnit: "per continent",
    express: kinah(2.74),
    superExpress: kinah(5.47),
    options: [
      { label: "Allied Continent (15)", priceKina: kinah(12.88) },
      { label: "Enemy Continent (15)", priceKina: kinah(14.9) },
    ],
  },
  {
    id: "abyss-points",
    name: "Abyss Points Farm",
    category: "PVP",
    description: "Farm Abyss Points for exclusive gear & items.",
    basePriceKina: kinah(8.09),
    img: "/dungeons/abyss-points-farm.png",
    priceUnit: "per 10k points",
    express: kinah(1.62),
    superExpress: kinah(3.24),
    extras: [
      { label: "140 Empyrean Traces", priceKina: kinah(14.58) },
      { label: "560 Empyrean Traces", priceKina: kinah(48.6) },
    ],
  },
  {
    id: "cooking",
    name: "Cooking",
    category: "Professions",
    description: "Level Cooking to max (up to level 20).",
    basePriceKina: kinah(39.28),
    priceUnit: "level 1 → 20",
    express: kinah(7.86),
    superExpress: kinah(15.71),
  },
  {
    id: "alchemy",
    name: "Alchemy",
    category: "Professions",
    description: "Level Alchemy to max (up to level 20).",
    basePriceKina: kinah(22.35),
    priceUnit: "level 1 → 20",
    express: kinah(4.47),
    superExpress: kinah(8.94),
  },
];

export const AION_CATEGORIES = [
  "Leveling",
  "Raids",
  "Dungeons",
  "PVP",
  "Professions",
];

export const SERVICE_BY_ID = Object.fromEntries(AION_SERVICES.map((s) => [s.id, s]));

export const DUNGEON_PICKER = AION_SERVICES.filter((s) => s.category === "Dungeons" && s.img);

export const AION_CLASSES = [
  "Templar",
  "Gladiator",
  "Assassin",
  "Ranger",
  "Sorcerer",
  "Spiritmaster",
  "Cleric",
  "Chanter",
];

export const AION_CLASS_GROUPS = {
  Warrior: ["Templar", "Gladiator"],
  Scout: ["Assassin", "Ranger"],
  Mage: ["Sorcerer", "Spiritmaster"],
  Priest: ["Cleric", "Chanter"],
};

export function formatKina(n: number): string {
  return `${n.toFixed(2)}M`;
}

export function formatUsd(n: number): string {
  return formatKina(n);
}
