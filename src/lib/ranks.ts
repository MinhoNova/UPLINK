export type RankTier =
  | "Bronze"
  | "Silver"
  | "Gold"
  | "Platinum"
  | "Diamond"
  | "Master"
  | "Grandmaster"
  | "Legendary"
  | "Ascendant";

export const RANK_ORDER: RankTier[] = [
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
  "Diamond",
  "Master",
  "Grandmaster",
  "Legendary",
  "Ascendant",
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
  Legendary: 2500,
  Ascendant: 4000,
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
  Legendary: 1000,
  Ascendant: 1500,
};

export const RANK_COLORS: Record<RankTier, string> = {
  Bronze: "#cd7f32",
  Silver: "#c0c0c0",
  Gold: "#ffd700",
  Platinum: "#a5e0e5",
  Diamond: "#00ffff",
  Master: "#a78bfa",
  Grandmaster: "#ff007f",
  Legendary: "#ffb400",
  Ascendant: "#ffffff",
};

/** Per-rank emblem artwork from /public. */
export const RANK_IMAGES: Record<RankTier, string> = {
  Bronze: "/Bronze.png",
  Silver: "/Silver.png",
  Gold: "/Gold.png",
  Platinum: "/Platinum.png",
  Diamond: "/Diamond.png",
  Master: "/Master.png",
  Grandmaster: "/Grandmaster.png",
  Legendary: "/Legendary.png",
  Ascendant: "/Ascendant.png",
};

export interface RankVisual {
  tier: RankTier;
  color: string;
  image: string;
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
  return { tier, color: RANK_COLORS[tier], image: RANK_IMAGES[tier], nextRequired: next, progressPct };
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