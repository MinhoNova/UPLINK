export interface Affix {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: "base" | "rotating" | "seasonal" | "challenger";
}

const ALL_AFFIXES: Affix[] = [
  { id: "fortified", name: "Fortified", description: "Non-boss enemies have 20% more health and deal up to 20% more damage.", icon: "F", tier: "base" },
  { id: "tyrannical", name: "Tyrannical", description: "Bosses have 30% more health and deal up to 15% more damage.", icon: "T", tier: "base" },
  { id: "bolstering", name: "Bolstering", description: "When any non-boss enemy dies, it bolsters nearby allies, increasing their maximum health by 15% and damage by 20%.", icon: "B", tier: "rotating" },
  { id: "raging", name: "Raging", description: "Non-boss enemies enrage at 30% health, dealing 50% increased damage until killed.", icon: "R", tier: "rotating" },
  { id: "sanguine", name: "Sanguine", description: "When enemies die, they leave a pool of sanguine ichor that heals their allies and damages players.", icon: "S", tier: "rotating" },
  { id: "spiteful", name: "Spiteful", description: "When killed, enemies leave a Spiteful shade that fixates on a random player and chases them.", icon: "Sp", tier: "rotating" },
  { id: "storming", name: "Storming", description: "Hostile cyclones frequently appear around enemies, knocking players into the air.", icon: "St", tier: "rotating" },
  { id: "bursting", name: "Bursting", description: "When killed, non-boss enemies explode, applying a stacking damage-over-time debuff to the group.", icon: "Bu", tier: "rotating" },
  { id: "volcanic", name: "Volcanic", description: "Enemies cause eruptions of lava beneath distant players.", icon: "V", tier: "rotating" },
  { id: "grievous", name: "Grievous", description: "Players below 90% health suffer increasing damage over time.", icon: "G", tier: "rotating" },
  { id: "explosive", name: "Explosive", description: "Enemies periodically summon volatile Explosive Orbs that must be destroyed.", icon: "E", tier: "rotating" },
  { id: "necrotic", name: "Necrotic", description: "Enemy melee attacks apply a stacking Necrotic Wound, reducing healing received.", icon: "N", tier: "rotating" },
  { id: "quaking", name: "Quaking", description: "Periodically, all players emit a shockwave, interrupting nearby players and dealing damage.", icon: "Q", tier: "rotating" },
  { id: "skittish", name: "Skittish", description: "Enemies generate disproportionately high threat against players not currently tanking them.", icon: "Sk", tier: "rotating" },
  { id: "inspiring", name: "Inspiring", description: "Some non-boss enemies have an Inspiring Aura that empowers nearby allies.", icon: "I", tier: "rotating" },
  { id: "entangling", name: "Entangling", description: "When killed, some enemies leave behind entangling vines that root players.", icon: "En", tier: "rotating" },
  { id: "xalatath", name: "Xal'atath's Bargain", description: "Powerful enemies drop motes that empower players when collected, but empower enemies otherwise.", icon: "X", tier: "seasonal" },
  { id: "ascendant", name: "Ascendant", description: "Players ascend briefly, gaining a damage bonus but becoming vulnerable to interrupts.", icon: "A", tier: "challenger" },
  { id: "challenger", name: "Challenger's Peril", description: "The death penalty timer is increased by 5 seconds per player death in the dungeon.", icon: "C", tier: "challenger" },
];

export const AFFIXES = new Map(ALL_AFFIXES.map((a) => [a.id, a]));

export function getAffix(id: string): Affix {
  return AFFIXES.get(id) || { id, name: id, description: "", icon: "?", tier: "rotating" };
}

const SEASONAL_ROTATIONS: Record<string, string[]> = {
  "season-mn-1": ["xalatath"],
  "season-mn-2": ["xalatath"],
};

const BASE_ROTATION = ["tyrannical", "fortified"];

const ROTATING_POOL = [
  "bolstering", "raging", "sanguine", "spiteful",
  "storming", "bursting", "volcanic", "grievous",
  "explosive", "necrotic", "quaking", "skittish",
  "inspiring", "entangling",
];

export interface AffixWeek {
  weekNumber: number;
  startDate: Date;
  base: string;
  rotating: string[];
  seasonal: string[];
  all: string[];
}

export function getAffixForWeek(seasonStart: Date, weekNumber: number, seasonSlug: string = "season-mn-2"): AffixWeek {
  const startDate = new Date(seasonStart.getTime() + (weekNumber - 1) * 7 * 24 * 60 * 60 * 1000);
  const baseIdx = (weekNumber - 1) % BASE_ROTATION.length;
  const rotIdx = ((weekNumber - 1) * 2) % ROTATING_POOL.length;
  const rotating = [ROTATING_POOL[rotIdx], ROTATING_POOL[(rotIdx + 1) % ROTATING_POOL.length]];

  return {
    weekNumber,
    startDate,
    base: BASE_ROTATION[baseIdx],
    rotating,
    seasonal: SEASONAL_ROTATIONS[seasonSlug] || [],
    all: [BASE_ROTATION[baseIdx], ...rotating, ...(SEASONAL_ROTATIONS[seasonSlug] || [])],
  };
}

export function getCurrentWeek(seasonStart: Date): number {
  const now = Date.now();
  const diff = now - seasonStart.getTime();
  return Math.max(1, Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1);
}

export function getAffixColor(id: string): string {
  const colors: Record<string, string> = {
    fortified: "#ff8c00",
    tyrannical: "#9b59b6",
    bolstering: "#e74c3c",
    raging: "#e74c3c",
    sanguine: "#c0392b",
    spiteful: "#8e44ad",
    storming: "#3498db",
    bursting: "#2ecc71",
    volcanic: "#e67e22",
    grievous: "#1abc9c",
    explosive: "#f39c12",
    necrotic: "#2c3e50",
    quaking: "#7f8c8d",
    skittish: "#d35400",
    inspiring: "#2980b9",
    entangling: "#27ae60",
    xalatath: "#ff007f",
    ascendant: "#00ffff",
    challenger: "#ffffff",
  };
  return colors[id] || "#888888";
}
