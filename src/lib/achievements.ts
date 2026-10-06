import { RANK_ORDER, getUserRanks } from "@/lib/ranks";

export type AchievementCategory =
  | "runs"
  | "offers"
  | "reviews"
  | "roster"
  | "social"
  | "rank";

export interface LocalizedText {
  en: string;
  ar: string;
}

export interface AchievementStats {
  runs: number;
  offers: number;
  key10: number;
  reviewsReceived: number;
  reviewsGiven: number;
  avgRating: number;
  characters: number;
  friends: number;
  rankIndex: number;
}

export interface AchievementDef {
  id: string;
  category: AchievementCategory;
  color: string;
  /** Lowercase lucide icon name, resolved by the panel. */
  icon: string;
  name: LocalizedText;
  desc: LocalizedText;
  /** Shown instead of `desc` once `target` is met but `extra` still fails. */
  extraDesc?: LocalizedText;
  current: (stats: AchievementStats) => number;
  target: number;
  /** A second condition that the count alone does not satisfy. */
  extra?: (stats: AchievementStats) => boolean;
}

export interface AchievementState {
  def: AchievementDef;
  unlocked: boolean;
  current: number;
  target: number;
  /** `current / target`, clamped to 0..1. */
  progress: number;
}

export const GOLD_RANK_INDEX = RANK_ORDER.indexOf("Gold");

/** Chrome around the badge grid. Achievement text itself lives on each def. */
export const ACHIEVEMENT_TEXT: { title: LocalizedText } = {
  title: { en: "Achievements", ar: "الإنجازات" },
};

/**
 * Every threshold here reads a number the site already keeps. Nothing on this
 * list can be reached by editing a request: runs, offers, reviews, characters
 * and friendships all live in rows the caller does not write for themselves.
 */
export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first_run",
    category: "runs",
    color: "#22d3ee",
    icon: "swords",
    name: { en: "First Clear", ar: "أول مهمة" },
    desc: { en: "Complete a dungeon run.", ar: "كمّل رانة دنجن واحدة." },
    current: (s) => s.runs,
    target: 1,
  },
  {
    id: "runs_10",
    category: "runs",
    color: "#22d3ee",
    icon: "swords",
    name: { en: "Getting Started", ar: "بداية قوية" },
    desc: { en: "Complete 10 dungeon runs.", ar: "كمّل 10 رانات دنجن." },
    current: (s) => s.runs,
    target: 10,
  },
  {
    id: "runs_50",
    category: "runs",
    color: "#22d3ee",
    icon: "flame",
    name: { en: "Dungeon Veteran", ar: "محترف الدنجنات" },
    desc: { en: "Complete 50 dungeon runs.", ar: "كمّل 50 رانة دنجن." },
    current: (s) => s.runs,
    target: 50,
  },
  {
    id: "runs_150",
    category: "runs",
    color: "#22d3ee",
    icon: "medal",
    name: { en: "Dungeon Legend", ar: "أسطورة الدنجنات" },
    desc: { en: "Complete 150 dungeon runs.", ar: "كمّل 150 رانة دنجن." },
    current: (s) => s.runs,
    target: 150,
  },
  {
    id: "key_10",
    category: "runs",
    color: "#22d3ee",
    icon: "key-round",
    name: { en: "Key Master", ar: "سيد المفاتيح" },
    desc: { en: "Finish a +10 key or higher.", ar: "كمّل كي +10 أو أعلى." },
    current: (s) => s.key10,
    target: 1,
  },
  {
    id: "first_offer",
    category: "offers",
    color: "#fbbf24",
    icon: "megaphone",
    name: { en: "First Offer", ar: "أول عرض" },
    desc: { en: "Post your first offer.", ar: "انشر أول عرض ليك." },
    current: (s) => s.offers,
    target: 1,
  },
  {
    id: "offers_10",
    category: "offers",
    color: "#fbbf24",
    icon: "megaphone",
    name: { en: "Regular Poster", ar: "ناشر دائم" },
    desc: { en: "Post 10 offers.", ar: "انشر 10 عروض." },
    current: (s) => s.offers,
    target: 10,
  },
  {
    id: "offers_50",
    category: "offers",
    color: "#fbbf24",
    icon: "layers",
    name: { en: "Deal Maker", ar: "صانع صفقات" },
    desc: { en: "Post 50 offers.", ar: "انشر 50 عرض." },
    current: (s) => s.offers,
    target: 50,
  },
  {
    id: "offers_150",
    category: "offers",
    color: "#fbbf24",
    icon: "crown",
    name: { en: "Market Commander", ar: "قائد السوق" },
    desc: { en: "Post 150 offers.", ar: "انشر 150 عرض." },
    current: (s) => s.offers,
    target: 150,
  },
  {
    id: "first_review",
    category: "reviews",
    color: "#a78bfa",
    icon: "star",
    name: { en: "Reviewed", ar: "تمت مراجعتك" },
    desc: { en: "Receive your first squad review.", ar: "استلم أول ريفيو من فريقك." },
    current: (s) => s.reviewsReceived,
    target: 1,
  },
  {
    id: "beloved",
    category: "reviews",
    color: "#a78bfa",
    icon: "heart",
    name: { en: "Beloved", ar: "محبوب" },
    desc: {
      en: "5 reviews averaging 4.5 stars or higher.",
      ar: "5 ريفيوهات بمعدل 4.5 نجمة أو أعلى.",
    },
    extraDesc: {
      en: "Your average rating is below 4.5.",
      ar: "معدل تقييمك أقل من 4.5.",
    },
    current: (s) => s.reviewsReceived,
    target: 5,
    extra: (s) => s.avgRating >= 4.5,
  },
  {
    id: "critic",
    category: "reviews",
    color: "#a78bfa",
    icon: "message-square",
    name: { en: "Fair Judge", ar: "قاضٍ عادل" },
    desc: { en: "Write 5 squad reviews.", ar: "اكتب 5 ريفيوهات لزملائك." },
    current: (s) => s.reviewsGiven,
    target: 5,
  },
  {
    id: "first_character",
    category: "roster",
    color: "#34d399",
    icon: "badge-check",
    name: { en: "Verified", ar: "موثّق" },
    desc: { en: "Link a verified game character.", ar: "اربط شخصية موثقة." },
    current: (s) => s.characters,
    target: 1,
  },
  {
    id: "full_roster",
    category: "roster",
    color: "#34d399",
    icon: "shield-check",
    name: { en: "Full Roster", ar: "تشكيلة كاملة" },
    desc: { en: "Link 3 verified characters.", ar: "اربط 3 شخصيات موثقة." },
    current: (s) => s.characters,
    target: 3,
  },
  {
    id: "first_friend",
    category: "social",
    color: "#ff007f",
    icon: "user-plus",
    name: { en: "First Friend", ar: "أول صديق" },
    desc: { en: "Add a friend on UPLINK.", ar: "ضيف أول صديق ليك." },
    current: (s) => s.friends,
    target: 1,
  },
  {
    id: "squad",
    category: "social",
    color: "#ff007f",
    icon: "users",
    name: { en: "Inner Circle", ar: "الدائرة المقرّبة" },
    desc: { en: "Have 5 friends.", ar: "اشترِ 5 أصحاب." },
    current: (s) => s.friends,
    target: 5,
  },
  {
    id: "rank_gold",
    category: "rank",
    color: "#ffd700",
    icon: "trophy",
    name: { en: "Gold Rank", ar: "رانك ذهبي" },
    desc: { en: "Reach Gold rank or higher.", ar: "اوصل لرانك ذهب أو أعلى." },
    current: (s) => s.rankIndex,
    target: GOLD_RANK_INDEX,
  },
];

export function emptyAchievementStats(): AchievementStats {
  return {
    runs: 0,
    offers: 0,
    key10: 0,
    reviewsReceived: 0,
    reviewsGiven: 0,
    avgRating: 0,
    characters: 0,
    friends: 0,
    rankIndex: 0,
  };
}

function asArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === "object" ? (value as Record<string, any>) : {};
}

/**
 * Reads an achievement profile out of rows the caller already has in hand.
 * `reviews`, `characters` and `friends` are passed whole and scoped here by
 * `userId`, so the public player page (full arrays) and the owner's own
 * profile (arrays already scoped to them by `filterDataForUser`) agree.
 */
export function achievementStatsFrom(source: {
  userId: string;
  stats?: unknown;
  rankOverride?: string | null;
  reviews?: unknown;
  characters?: unknown;
  friends?: unknown;
}): AchievementStats {
  const uid = String(source.userId ?? "");
  const stats = asRecord(source.stats);

  const reviews = asArray(source.reviews);
  const received = reviews.filter((r) => String(asRecord(r).targetId ?? "") === uid);
  const given = reviews.filter((r) => String(asRecord(r).reviewerId ?? "") === uid);
  const ratings = received
    .map((r) => Number(asRecord(r).rating) || 0)
    .filter((n) => n > 0);
  const avgRating = ratings.length
    ? ratings.reduce((sum, n) => sum + n, 0) / ratings.length
    : 0;

  const characters = asArray(source.characters).filter(
    (c) => String(asRecord(c).userId ?? "") === uid
  ).length;

  // A friendship is one row whichever side of it the viewer sits on, so it is
  // counted once — a self edge or a pending request never counts.
  const friends = asArray(source.friends).filter((f) => {
    const row = asRecord(f);
    if (String(row.status ?? "") !== "accepted") return false;
    return String(row.requester ?? "") === uid || String(row.target ?? "") === uid;
  }).length;

  const runs = Number(stats.total) || 0;
  const offers = Number(stats.postCount) || 0;
  const overall = getUserRanks(runs, offers, source.rankOverride ?? null).overall;
  const rankIndex = RANK_ORDER.indexOf(overall.tier);

  return {
    runs,
    offers,
    key10: Number(stats.k10) || 0,
    reviewsReceived: received.length,
    reviewsGiven: given.length,
    avgRating,
    characters,
    friends,
    rankIndex: rankIndex < 0 ? 0 : rankIndex,
  };
}

export function computeAchievements(stats: AchievementStats): AchievementState[] {
  return ACHIEVEMENTS.map((def) => {
    const current = def.current(stats);
    const target = def.target;
    const metCount = target > 0 && current >= target;
    const unlocked = metCount && (!def.extra || def.extra(stats));
    const progress =
      target > 0
        ? Math.max(0, Math.min(1, current / target))
        : unlocked
          ? 1
          : 0;
    return { def, unlocked, current, target, progress };
  });
}

export function unlockedCount(states: AchievementState[]): number {
  return states.filter((state) => state.unlocked).length;
}
