"use client";
import { motion } from "framer-motion";
import { Trophy, Star, Hash } from "lucide-react";

export function getRank(totalRuns: number): { title: string; color: string; minRuns: number } {
  if (totalRuns >= 1000) return { title: "ELITE", color: "#ff007f", minRuns: 1000 };
  if (totalRuns >= 500) return { title: "DIAMOND", color: "#00ffff", minRuns: 500 };
  if (totalRuns >= 250) return { title: "PLATINUM", color: "#e5e4e2", minRuns: 250 };
  if (totalRuns >= 100) return { title: "GOLD", color: "#ffd700", minRuns: 100 };
  if (totalRuns >= 25) return { title: "SILVER", color: "#c0c0c0", minRuns: 25 };
  return { title: "BRONZE", color: "#cd7f32", minRuns: 0 };
}

export function getCategoryLevel(runs: number): number {
  if (runs >= 1000) return 10;
  if (runs >= 750) return 9;
  if (runs >= 500) return 8;
  if (runs >= 350) return 7;
  if (runs >= 200) return 6;
  if (runs >= 100) return 5;
  if (runs >= 50) return 4;
  if (runs >= 25) return 3;
  if (runs >= 10) return 2;
  if (runs >= 1) return 1;
  return 0;
}

export function getAverageRating(ratings?: number[]): number {
  if (!ratings || ratings.length === 0) return 0;
  const sum = ratings.reduce((a, b) => a + b, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}

interface RankBadgeProps {
  stats?: { total?: number; levelingTotal?: number; dungeonTotal?: number; postCount?: number };
  ratings?: number[];
  compact?: boolean;
  showCategory?: 'leveling' | 'dungeon';
}

export default function RankBadge({ stats, ratings, compact, showCategory }: RankBadgeProps) {
  const total = stats?.total || 0;
  const rank = getRank(total);
  const avgRating = getAverageRating(ratings);
  const ratingCount = ratings?.length || 0;
  const postCount = stats?.postCount || 0;
  const categoryRuns = showCategory === 'leveling' ? (stats?.levelingTotal || 0) : (showCategory === 'dungeon' ? (stats?.dungeonTotal || 0) : 0);
  const catLevel = showCategory ? getCategoryLevel(categoryRuns) : 0;

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-[7px] font-black tracking-widest" style={{ color: rank.color }}>{rank.title}</span>
        {avgRating > 0 && (
          <div className="flex items-center gap-0.5">
            <Star className="w-2 h-2 text-yellow-500 fill-yellow-500" />
            <span className="text-[7px] font-black text-yellow-500">{avgRating.toFixed(1)}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {/* Rank */}
      <div className="flex items-center gap-1.5">
        <Trophy className="w-3 h-3" style={{ color: rank.color }} />
        <span className="text-[9px] font-black tracking-widest" style={{ color: rank.color }}>{rank.title}</span>
      </div>

      {/* Rating */}
      {avgRating > 0 && (
        <div className="flex items-center gap-1">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-2.5 h-2.5 ${s <= Math.round(avgRating) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'}`}
              />
            ))}
          </div>
          <span className="text-[8px] font-black text-yellow-500">{avgRating.toFixed(1)}</span>
          <span className="text-[7px] text-gray-500">({ratingCount})</span>
        </div>
      )}

      {/* Post count */}
      {postCount > 0 && (
        <div className="flex items-center gap-1">
          <Hash className="w-2.5 h-2.5 text-gray-500" />
          <span className="text-[8px] font-black text-gray-400">{postCount} posts</span>
        </div>
      )}

      {/* Category level */}
      {showCategory && catLevel > 0 && (
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md" style={{ backgroundColor: `${rank.color}15`, border: `1px solid ${rank.color}30` }}>
          <span className="text-[7px] font-black uppercase tracking-widest" style={{ color: rank.color }}>
            {showCategory === 'leveling' ? 'Leveling' : 'Dungeon'} {catLevel}/10
          </span>
        </div>
      )}
    </div>
  );
}
