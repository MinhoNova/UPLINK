"use client";

import type { ElementType } from "react";
import {
  BadgeCheck,
  Check,
  Crown,
  Flame,
  Heart,
  KeyRound,
  Layers,
  Medal,
  Megaphone,
  MessageSquare,
  ShieldCheck,
  Star,
  Swords,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import { useI18n } from "@/i18n/i18n";
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_TEXT,
  computeAchievements,
  unlockedCount,
  type AchievementState,
  type AchievementStats,
  type LocalizedText,
} from "@/lib/achievements";

const ICONS: Record<string, ElementType> = {
  swords: Swords,
  flame: Flame,
  medal: Medal,
  "key-round": KeyRound,
  megaphone: Megaphone,
  layers: Layers,
  crown: Crown,
  star: Star,
  heart: Heart,
  "message-square": MessageSquare,
  "badge-check": BadgeCheck,
  "shield-check": ShieldCheck,
  "user-plus": UserPlus,
  users: Users,
  trophy: Trophy,
};

function AchievementBadge({
  state,
  pick,
}: {
  state: AchievementState;
  pick: (text: LocalizedText) => string;
}) {
  const { def, unlocked, current, target, progress } = state;
  const Icon = ICONS[def.icon] || Trophy;
  const countMet = !unlocked && target > 0 && current >= target && !!def.extra;
  const body = countMet && def.extraDesc ? def.extraDesc : def.desc;

  return (
    <div
      className="rounded-2xl border p-3 transition-colors"
      style={{
        borderColor: unlocked ? `${def.color}55` : "rgba(255,255,255,0.08)",
        background: unlocked ? `${def.color}12` : "rgba(255,255,255,0.02)",
      }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border"
          style={{
            borderColor: `${def.color}${unlocked ? "66" : "22"}`,
            background: `${def.color}${unlocked ? "22" : "0d"}`,
            opacity: unlocked ? 1 : 0.55,
          }}
        >
          <Icon className="h-4 w-4" style={{ color: unlocked ? def.color : "#64748b" }} />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-[10px] font-black uppercase tracking-widest"
            style={{ color: unlocked ? def.color : "#64748b" }}
          >
            {pick(def.name)}
          </p>
          <p className="mt-0.5 text-[9px] font-bold leading-snug text-slate-500">
            {pick(body)}
          </p>
        </div>
        {unlocked ? (
          <Check className="h-3.5 w-3.5 shrink-0" style={{ color: def.color }} />
        ) : null}
      </div>
      {!unlocked ? (
        <div className="mt-2.5 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.round(progress * 100)}%`, background: def.color }}
            />
          </div>
          <span className="shrink-0 text-[8px] font-black tabular-nums text-slate-500">
            {current}/{target}
          </span>
        </div>
      ) : null}
    </div>
  );
}

export default function AchievementsPanel({
  stats,
  variant = "public",
}: {
  stats: AchievementStats;
  variant?: "public" | "own";
}) {
  const { lang } = useI18n();
  const pick = (text: LocalizedText) => (lang === "ar" ? text.ar : text.en);

  const states = computeAchievements(stats);
  const unlocked = unlockedCount(states);

  const grid = (
    <div
      className={
        variant === "own"
          ? "grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4"
          : "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
      }
    >
      {states.map((state) => (
        <AchievementBadge key={state.def.id} state={state} pick={pick} />
      ))}
    </div>
  );

  const counter = (
    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
      {unlocked} / {ACHIEVEMENTS.length}
    </span>
  );

  if (variant === "own") {
    return (
      <div className="tn-light relative w-full rounded-3xl border border-cyan-500/25 bg-[#070a1c]/70 p-6 backdrop-blur-xl mt-8">
        <div className="mb-6 flex items-center gap-3 border-b border-blue-900/30 pb-4">
          <Trophy className="h-4 w-4 text-[#ffd700]" />
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-100">
            {pick(ACHIEVEMENT_TEXT.title)}
          </h3>
          <span className="ml-auto">{counter}</span>
        </div>
        {grid}
      </div>
    );
  }

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-300">
          {pick(ACHIEVEMENT_TEXT.title)}
        </h2>
        {counter}
      </div>
      {grid}
    </section>
  );
}
