"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Swords, Heart, Shield, Repeat2, Zap, Crown } from "lucide-react";
import { HeroBackground } from "@/components/HeroBackground";
import {
  buildRunLeaderboard,
  buildScoreLeaderboard,
  buildRaiderRunsLeaderboard,
  buildClassRunChampions,
  buildRaiderClassRunChampions,
  collectRunRecords,
  WOW_CLASSES,
  type LeaderboardRole,
  type LeaderboardPeriod,
  type LeaderboardMetric,
  type LeaderboardClassFilter,
  type ClassChampionEntry,
} from "@/lib/leaderboard";
import { classThumbUrl, CLASS_THUMB_PX } from "@/lib/classThumb";
import type { MythicSeasonInfo } from "@/lib/mythicSeason";

const ROLE_TABS: { id: LeaderboardRole; label: string; icon: typeof Swords }[] = [
  { id: "all", label: "All", icon: Trophy },
  { id: "dps", label: "DPS", icon: Swords },
  { id: "healer", label: "Healer", icon: Heart },
  { id: "tank", label: "Tank", icon: Shield },
];

const PERIOD_TABS: { id: LeaderboardPeriod; label: string }[] = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "season", label: "Seasonal" },
];

const METRIC_TABS: { id: LeaderboardMetric; label: string; icon: typeof Zap }[] = [
  { id: "performance", label: "Performance", icon: Zap },
  { id: "runs", label: "Most Runs", icon: Repeat2 },
  { id: "class_leaders", label: "Class Leaders", icon: Crown },
];

const CLASS_FILTER_TABS: LeaderboardClassFilter[] = [
  "all",
  "Warrior",
  "Paladin",
  "Hunter",
  "Rogue",
  "Priest",
  "Death Knight",
  "Shaman",
  "Mage",
  "Warlock",
  "Monk",
  "Druid",
  "Demon Hunter",
  "Evoker",
];

const RANK_STYLES: Record<number, { border: string; glow: string; label: string }> = {
  1: { border: "border-yellow-500/50", glow: "shadow-[0_0_30px_rgba(234,179,8,0.2)]", label: "text-yellow-400" },
  2: { border: "border-gray-300/40", glow: "shadow-[0_0_20px_rgba(192,192,192,0.15)]", label: "text-gray-300" },
  3: { border: "border-amber-700/50", glow: "shadow-[0_0_20px_rgba(180,83,9,0.15)]", label: "text-amber-600" },
};

function getClassIcon(className?: string): string {
  if (!className) return classThumbUrl("DPS");
  return classThumbUrl(className);
}

const CLASS_SPEC_COLORS: Record<string, string> = {
  "Demon Hunter:Havoc": "#a78bfa",
  "Demon Hunter:Devourer": "#d8b4fe",
  "Demon Hunter:Vengeance": "#8b5cf6",
  "Death Knight:Blood": "#c41e3a",
  "Death Knight:Frost": "#5bc0de",
  "Death Knight:Unholy": "#90ee90",
  "Druid:Balance": "#ff7c0a",
  "Druid:Feral": "#ff7c0a",
  "Druid:Guardian": "#ff7c0a",
  "Druid:Restoration": "#ff7c0a",
  "Evoker:Devastation": "#33937f",
  "Evoker:Preservation": "#33937f",
  "Evoker:Augmentation": "#8a2be2",
  "Hunter:Beast Mastery": "#aad372",
  "Hunter:Marksmanship": "#aad372",
  "Hunter:Survival": "#aad372",
  "Mage:Arcane": "#3fc7eb",
  "Mage:Fire": "#ff7c0a",
  "Mage:Frost": "#3fc7eb",
  "Monk:Brewmaster": "#00ff98",
  "Monk:Mistweaver": "#00ff98",
  "Monk:Windwalker": "#00ff98",
  "Paladin:Holy": "#f48cba",
  "Paladin:Protection": "#f48cba",
  "Paladin:Retribution": "#f48cba",
  "Priest:Discipline": "#ffffff",
  "Priest:Holy": "#ffffff",
  "Priest:Shadow": "#ffffff",
  "Rogue:Assassination": "#fff468",
  "Rogue:Outlaw": "#fff468",
  "Rogue:Subtlety": "#fff468",
  "Shaman:Elemental": "#0070dd",
  "Shaman:Enhancement": "#0070dd",
  "Shaman:Restoration": "#0070dd",
  "Warlock:Affliction": "#8788ee",
  "Warlock:Demonology": "#8788ee",
  "Warlock:Destruction": "#8788ee",
  "Warrior:Arms": "#c69b6d",
  "Warrior:Fury": "#c69b6d",
  "Warrior:Protection": "#c69b6d",
};

const CLASS_COLORS: Record<string, string> = {
  "Demon Hunter": "#c084fc",
  "Death Knight": "#c41e3a",
  Druid: "#ff7c0a",
  Evoker: "#33937f",
  Hunter: "#aad372",
  Mage: "#3fc7eb",
  Monk: "#00ff98",
  Paladin: "#f48cba",
  Priest: "#ffffff",
  Rogue: "#fff468",
  Shaman: "#0070dd",
  Warlock: "#8788ee",
  Warrior: "#c69b6d",
};

function getSpecColor(spec: string, className?: string): string {
  if (className && spec) {
    const composite = `${className}:${spec}`;
    if (CLASS_SPEC_COLORS[composite]) return CLASS_SPEC_COLORS[composite];
  }
  if (className && CLASS_COLORS[className]) return CLASS_COLORS[className];
  return "#9ca3af";
}

function resolvePlayerVisual(user: any | null, fallbackName: string, fallbackAvatar: string) {
  const isSecret = user?.subscription?.tier === "secret_club";
  if (isSecret) {
    return {
      name: user?.name || user?.discordDisplayName || fallbackName || "Operative",
      avatar: user?.customAvatar || user?.profileGif || user?.avatar || fallbackAvatar || "",
    };
  }
  return {
    name: user?.discordDisplayName || user?.name || fallbackName || "Operative",
    avatar: user?.avatar || fallbackAvatar || "",
  };
}

function getDamageValue(role: string, char: any, entryRoleScore: number): number {
  if (entryRoleScore > 0) return entryRoleScore;
  if (role === "healer") return Number(char?.hpsValue || char?.stats?.healer || 0);
  if (role === "tank") return Number(char?.tankValue || char?.stats?.tank || 0);
  return Number(char?.dpsValue || char?.stats?.dps || 0);
}

function getDamageLabel(role: string): string {
  if (role === "healer") return "HPS";
  if (role === "tank") return "TPS";
  return "DPS";
}

function roleLabel(role: string): string {
  if (role === "healer") return "Healer";
  if (role === "tank") return "Tank";
  return "DPS";
}

function roleAccent(role: string): string {
  if (role === "healer") return "text-pink-400 border-pink-500/30 bg-pink-500/10";
  if (role === "tank") return "text-sky-400 border-sky-500/30 bg-sky-500/10";
  return "text-red-400 border-red-500/30 bg-red-500/10";
}

function getIoScore(char: any, role: string): number {
  const rs = char?.roleScores;
  if (rs) {
    const v = Number(rs[role] || rs.all || 0);
    if (v > 0) return v;
  }
  return Number(char?.score || 0);
}

export default function LeaderboardView({
  lobbies,
  characters,
  users,
  season,
}: {
  lobbies: any[];
  characters: any[];
  users: any[];
  season: MythicSeasonInfo;
}) {
  const [roleFilter, setRoleFilter] = useState<LeaderboardRole>("all");
  const [period, setPeriod] = useState<LeaderboardPeriod>("season");
  const [metric, setMetric] = useState<LeaderboardMetric>("performance");
  const [classFilter, setClassFilter] = useState<LeaderboardClassFilter>("all");

  const hasSyncedRuns = useMemo(
    () => collectRunRecords(lobbies, characters).length > 0,
    [lobbies, characters]
  );

  const entries = useMemo(() => {
    if (metric === "class_leaders") return [];
    if (metric === "runs") {
      if (hasSyncedRuns) {
        return buildRunLeaderboard(lobbies, characters, users, roleFilter, period, season.startMs, classFilter);
      }
      return buildRaiderRunsLeaderboard(characters, users, roleFilter, classFilter);
    }
    if (hasSyncedRuns) {
      return buildRunLeaderboard(lobbies, characters, users, roleFilter, period, season.startMs, classFilter);
    }
    return buildScoreLeaderboard(characters, users, roleFilter);
  }, [lobbies, characters, users, roleFilter, period, season.startMs, hasSyncedRuns, metric, classFilter]);

  const classChampions = useMemo(() => {
    if (metric !== "class_leaders") return [];
    if (hasSyncedRuns) {
      return buildClassRunChampions(lobbies, characters, users, roleFilter, period, season.startMs);
    }
    return buildRaiderClassRunChampions(characters, users, roleFilter);
  }, [lobbies, characters, users, roleFilter, period, season.startMs, hasSyncedRuns, metric]);

  const championsByClass = useMemo(() => {
    const map = new Map<string, ClassChampionEntry[]>();
    for (const champ of classChampions) {
      if (!map.has(champ.className)) map.set(champ.className, []);
      map.get(champ.className)!.push(champ);
    }
    return map;
  }, [classChampions]);

  const usingRuns = metric === "runs" || metric === "class_leaders" || hasSyncedRuns;
  const runsPrimary = metric === "runs";
  const classLeadersPrimary = metric === "class_leaders";

  return (
    <div className="relative min-h-screen text-white">
      <HeroBackground />
      <div className="relative z-10 pt-28 pb-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-yellow-500/[0.08] via-[#05050a] to-[#00ffff]/[0.06] px-8 py-7 mb-6 shadow-[0_0_40px_rgba(234,179,8,0.08)]">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-yellow-500/15 blur-3xl" />
            <div className="relative flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-center gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-yellow-500/40 bg-black/50 shadow-[0_0_24px_rgba(234,179,8,0.25)]">
                  <Trophy className="h-7 w-7 text-yellow-400" strokeWidth={2.25} />
                </div>
                <div>
                  <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-black uppercase tracking-tighter text-yellow-400 sm:text-4xl">
                    Leaderboard
                  </h1>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500">
                    {classLeadersPrimary
                      ? `${season.name} · top player per class & role · any key`
                      : runsPrimary
                        ? `${season.name} · most runs · any key level`
                        : `${season.name} · synced runs from missions`}
                  </p>
                </div>
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest text-[#00ffff]/60 border border-[#00ffff]/20 rounded-lg px-2 py-1 w-fit">
                Season resets via Raider.io
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {METRIC_TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setMetric(id)}
                className={`h-9 px-4 rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center gap-1.5 transition-all border ${
                  metric === id
                    ? "bg-[#8a2be2]/15 text-[#c084fc] border-[#8a2be2]/40"
                    : "bg-white/5 text-gray-500 border-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {ROLE_TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setRoleFilter(id)}
                className={`h-9 px-4 rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center gap-1.5 transition-all border ${
                  roleFilter === id
                    ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/40"
                    : "bg-white/5 text-gray-500 border-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>

          {runsPrimary && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {CLASS_FILTER_TABS.map((cls) => (
                <button
                  key={cls}
                  onClick={() => setClassFilter(cls)}
                  className={`h-7 px-2.5 rounded-lg font-black uppercase text-[7px] tracking-widest transition-all border ${
                    classFilter === cls
                      ? "bg-orange-500/15 text-orange-300 border-orange-500/40"
                      : "bg-white/[0.03] text-gray-600 border-white/5 hover:text-gray-400"
                  }`}
                >
                  {cls === "all" ? "All Classes" : cls}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-6">
            {PERIOD_TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setPeriod(id)}
                className={`h-8 px-3 rounded-lg font-black uppercase text-[8px] tracking-widest transition-all border ${
                  period === id
                    ? "bg-[#00ffff]/10 text-[#00ffff] border-[#00ffff]/40"
                    : "bg-white/[0.03] text-gray-600 border-white/5 hover:text-gray-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {classLeadersPrimary ? (
              <>
                {WOW_CLASSES.map((className, classIdx) => {
                  const slots = championsByClass.get(className) || [];
                  if (!slots.length) return null;
                  const classColor = CLASS_COLORS[className] || "#9ca3af";
                  return (
                    <motion.div
                      key={className}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: classIdx * 0.02 }}
                      className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-sm overflow-hidden"
                    >
                      <div
                        className="flex items-center gap-3 px-4 py-3 border-b border-white/10"
                        style={{ background: `linear-gradient(90deg, ${classColor}18, transparent)` }}
                      >
                        <div className="w-10 h-10 shrink-0 rounded-lg border border-white/10 bg-black/60 flex items-center justify-center overflow-hidden">
                          <img
                            src={getClassIcon(className)}
                            alt={className}
                            width={CLASS_THUMB_PX}
                            height={CLASS_THUMB_PX}
                            className="w-8 h-8 object-contain"
                            decoding="async"
                          />
                        </div>
                        <p
                          className="text-sm font-black uppercase tracking-widest"
                          style={{ color: classColor, textShadow: `0 0 14px ${classColor}55` }}
                        >
                          {className}
                        </p>
                      </div>
                      <div className="divide-y divide-white/5">
                        {slots.map((slot) => {
                          const player = slot.user
                            ? resolvePlayerVisual(slot.user, slot.topChar?.userName || slot.topChar?.name || "", slot.topChar?.userAvatar || "")
                            : null;
                          const avatar = player?.avatar?.trim()
                            ? player.avatar
                            : player
                              ? `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=0b1020&color=00ffff&size=128&bold=true`
                              : "";
                          return (
                            <div key={`${slot.className}-${slot.role}`} className="flex items-center gap-3 px-4 py-3">
                              <span className={`shrink-0 h-7 min-w-[4.5rem] px-2 rounded-lg border text-[8px] font-black uppercase tracking-widest flex items-center justify-center ${roleAccent(slot.role)}`}>
                                {roleLabel(slot.role)}
                              </span>
                              {slot.runCount > 0 && player ? (
                                <>
                                  <div className="w-9 h-9 shrink-0 rounded-full overflow-hidden border border-white/15 bg-black">
                                    <img src={avatar} alt={player.name} className="w-full h-full object-cover" />
                                  </div>
                                  <p className="text-sm font-black uppercase tracking-wide text-white truncate min-w-0 flex-1">
                                    {player.name}
                                  </p>
                                  <div className="shrink-0 text-right">
                                    <div className="text-lg font-black tabular-nums text-orange-400 leading-none">
                                      {slot.runCount}
                                    </div>
                                    <div className="text-[7px] font-black uppercase tracking-widest text-gray-600 mt-0.5">
                                      runs
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                                  No runs yet
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}
                {classChampions.every((c) => c.runCount === 0) && (
                  <div className="flex flex-col items-center justify-center py-24 text-center border border-white/5 rounded-[2rem] bg-white/[0.02]">
                    <Crown className="w-14 h-14 text-gray-600 mb-4 opacity-40" />
                    <p className="text-sm font-black text-gray-500 uppercase tracking-widest">No class leaders yet</p>
                    <p className="text-xs text-gray-600 mt-2 max-w-sm">
                      Complete missions to crown the top DPS, Healer, and Tank for each class.
                    </p>
                  </div>
                )}
              </>
            ) : (
              entries.map((entry, i) => {
              const rank = i + 1;
              const c = entry.topChar;
              const user = entry.user;
              const rankStyle = RANK_STYLES[rank];
              const role = entry.role || (c.role || "dps").toLowerCase();
              const player = resolvePlayerVisual(user, c.userName || c.name, c.userAvatar);
              const avatar = player.avatar?.trim()
                ? player.avatar
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=0b1020&color=00ffff&size=128&bold=true`;
              const spec = c.spec || c.active_spec_name || "";
              const specColor = getSpecColor(spec, c.class);
              const damage = getDamageValue(role, c, entry.roleScore);
              const damageLabel = getDamageLabel(role);
              const ioScore = getIoScore(c, role);
              const specLabel = spec || c.class || role;

              return (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`flex items-center gap-3 sm:gap-4 rounded-2xl border bg-black/60 backdrop-blur-sm px-3 sm:px-4 py-3 transition-all hover:bg-white/[0.04] ${
                    rankStyle ? `${rankStyle.border} ${rankStyle.glow}` : "border-white/10 hover:border-white/20"
                  }`}
                >
                  {/* Rank */}
                  <div className={`w-7 shrink-0 text-center font-black text-base tabular-nums ${rankStyle?.label || "text-gray-600"}`}>
                    {rank <= 3 ? <Medal className={`w-5 h-5 mx-auto ${rankStyle?.label}`} /> : rank}
                  </div>

                  {/* Player avatar + name */}
                  <div className="w-11 h-11 shrink-0 rounded-full overflow-hidden border-2 border-white/15 bg-black">
                    <img src={avatar} alt={player.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 max-w-[28%] sm:max-w-[22%] shrink-0">
                    <p className="text-sm font-black uppercase tracking-wide text-white truncate">{player.name}</p>
                  </div>

                  {/* Class + spec + IO */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-10 h-10 shrink-0 rounded-lg border border-white/10 bg-black/60 flex items-center justify-center overflow-hidden">
                      <img
                        src={getClassIcon(c.class)}
                        alt={c.class || "class"}
                        width={CLASS_THUMB_PX}
                        height={CLASS_THUMB_PX}
                        className="w-8 h-8 object-contain"
                        decoding="async"
                        onError={(e) => { (e.target as HTMLImageElement).src = classThumbUrl("DPS"); }}
                      />
                    </div>
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <span
                        className="text-[11px] font-black uppercase tracking-widest truncate"
                        style={{ color: specColor, textShadow: `0 0 14px ${specColor}55` }}
                      >
                        {specLabel}
                      </span>
                      <span className="flex items-baseline gap-0.5 shrink-0">
                        <span className="text-sm font-black tabular-nums text-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.45)]">
                          {ioScore > 0 ? ioScore.toLocaleString(undefined, { maximumFractionDigits: 1 }) : "—"}
                        </span>
                        <span className="text-[8px] font-black uppercase tracking-widest text-orange-400/90">IO</span>
                      </span>
                    </div>
                  </div>

                  {/* Right: runs or overall damage */}
                  <div className="shrink-0 text-right pl-2">
                    {runsPrimary ? (
                      <>
                        <div className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-500 mb-0.5">Runs</div>
                        <div className="text-xl sm:text-2xl font-black tabular-nums leading-none text-orange-400 drop-shadow-[0_0_16px_rgba(251,146,60,0.45)]">
                          {entry.runCount > 0 ? entry.runCount.toLocaleString() : "—"}
                        </div>
                        <div className="text-[8px] font-black uppercase tracking-widest text-orange-400/80 mt-0.5">
                          {classFilter === "all" ? "any key" : classFilter}
                        </div>
                        {damage > 0 && (
                          <div className="text-[7px] font-black uppercase tracking-widest text-gray-600 mt-1">
                            {Math.round(damage).toLocaleString()} {damageLabel}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-500 mb-0.5">Overall</div>
                        {damage > 0 ? (
                          <div className="text-xl sm:text-2xl font-black tabular-nums leading-none text-white drop-shadow-[0_0_16px_rgba(0,255,255,0.5)]">
                            {Math.round(damage).toLocaleString()}
                          </div>
                        ) : (
                          <div className="text-lg font-black text-gray-600 leading-none">—</div>
                        )}
                        <div className="text-[8px] font-black uppercase tracking-widest text-[#00ffff]/80 mt-0.5">{damageLabel}</div>
                        {usingRuns && entry.runCount > 0 && (
                          <div className="text-[7px] font-black uppercase tracking-widest text-gray-600 mt-1">
                            {entry.runCount} run{entry.runCount !== 1 ? "s" : ""}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {!classLeadersPrimary && entries.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center border border-white/5 rounded-[2rem] bg-white/[0.02]">
                <Trophy className="w-14 h-14 text-gray-600 mb-4 opacity-40" />
                <p className="text-sm font-black text-gray-500 uppercase tracking-widest">No entries yet</p>
                <p className="text-xs text-gray-600 mt-2 max-w-sm">
                  Runs sync when missions complete on UPLINK. Sync your character in the Armory for scores.
                </p>
              </div>
            )}
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
