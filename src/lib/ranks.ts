export type RankTier =
  | "Bronze"
  | "Silver"
  | "Gold"
  | "Platinum"
  | "Diamond"
  | "Master"
  | "Grandmaster"
  | "LEGEND";

export const RANK_ORDER: RankTier[] = [
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
  "Diamond",
  "Master",
  "Grandmaster",
  "LEGEND",
];

/** Completed runs required for each Booster rank. */
export const BOOSTER_THRESHOLDS: Record<RankTier, number> = {
  Bronze: 1,
  Silver: 10,
  Gold: 50,
  Platinum: 150,
  Diamond: 400,
  Master: 800,
  Grandmaster: 1500,
  LEGEND: 2500,
};

/** Offers/orders posted required for each Poster rank. */
export const POSTER_THRESHOLDS: Record<RankTier, number> = {
  Bronze: 1,
  Silver: 5,
  Gold: 20,
  Platinum: 60,
  Diamond: 150,
  Master: 300,
  Grandmaster: 550,
  LEGEND: 1000,
};

export const RANK_COLORS: Record<RankTier, string> = {
  Bronze: "#cd7f32",
  Silver: "#c0c0c0",
  Gold: "#ffd700",
  Platinum: "#a5e0e5",
  Diamond: "#00ffff",
  Master: "#a78bfa",
  Grandmaster: "#ff007f",
  LEGEND: "#ffb400",
};

export interface RankVisual {
  tier: RankTier;
  color: string;
  image?: string;
  nextRequired?: number | null;
  progressPct: number;
}

function tierIndex(tier: RankTier): number {
  return RANK_ORDER.indexOf(tier);
}

function visualFor(tier: RankTier, current: number, thresholds: Record<RankTier, number>): RankVisual {
  const idx = tierIndex(tier);
  const next = idx + 1 < RANK_ORDER.length ? thresholds[RANK_ORDER[idx + 1]] : null;
  const min = thresholds[tier];
  const progressPct = next == null ? 100 : Math.min(100, Math.round(((current - min) / (next - min)) * 100));
  const visual: RankVisual = { tier, color: RANK_COLORS[tier], nextRequired: next, progressPct };
  if (tier === "LEGEND") visual.image = "/legendary%20rank.png";
  else if (tier === "Grandmaster") visual.image = "/diamond%20rank.png";
  return visual;
}

export function getBoosterRank(runs: number): RankVisual {
  let tier: RankTier = "Bronze";
  for (const t of RANK_ORDER) {
    if (runs >= BOOSTER_THRESHOLDS[t]) tier = t;
  }
  return visualFor(tier, runs, BOOSTER_THRESHOLDS);
}

export function getPosterRank(posts: number): RankVisual {
  let tier: RankTier = "Bronze";
  for (const t of RANK_ORDER) {
    if (posts >= POSTER_THRESHOLDS[t]) tier = t;
  }
  return visualFor(tier, posts, POSTER_THRESHOLDS);
}

export interface UserRanks {
  booster: RankVisual;
  poster: RankVisual;
  overall: RankVisual;
}

export function getUserRanks(runs: number, posts: number): UserRanks {
  const booster = getBoosterRank(runs);
  const poster = getPosterRank(posts);
  const overall = tierIndex(poster.tier) >= tierIndex(booster.tier) ? poster : booster;
  return { booster, poster, overall };
}