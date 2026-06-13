"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Swords, Heart, Shield } from "lucide-react";
import { HeroBackground } from "@/components/HeroBackground";
import {
  buildRunLeaderboard,
  buildScoreLeaderboard,
  collectRunRecords,
  type LeaderboardRole,
  type LeaderboardPeriod,
} from "@/lib/leaderboard";
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

const RANK_STYLES: Record<number, { border: string; glow: string; label: string }> = {
  1: { border: "border-yellow-500/50", glow: "shadow-[0_0_30px_rgba(234,179,8,0.2)]", label: "text-yellow-400" },
  2: { border: "border-gray-300/40", glow: "shadow-[0_0_20px_rgba(192,192,192,0.15)]", label: "text-gray-300" },
  3: { border: "border-amber-700/50", glow: "shadow-[0_0_20px_rgba(180,83,9,0.15)]", label: "text-amber-600" },
};

function getClassIcon(className?: string): string {
  if (!className) return "/classes/DPS.svg";
  const map: Record<string, string> = {
    "Death Knight": "DEATH KNIGHT",
    "Demon Hunter": "DEMON HUNTER",
  };
  const file = map[className] || className.toUpperCase();
  return `/classes/${file}.svg`;
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

  const hasSyncedRuns = useMemo(
    () => collectRunRecords(lobbies, characters).length > 0,
    [lobbies, characters]
  );

  const entries = useMemo(() => {
    if (hasSyncedRuns) {
      return buildRunLeaderboard(lobbies, characters, users, roleFilter, period, season.startMs);
    }
    return buildScoreLeaderboard(characters, users, roleFilter);
  }, [lobbies, characters, users, roleFilter, period, season.startMs, hasSyncedRuns]);

  const usingRuns = hasSyncedRuns;

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
                    {season.name} · synced runs from missions
                  </p>
                </div>
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest text-[#00ffff]/60 border border-[#00ffff]/20 rounded-lg px-2 py-1 w-fit">
                Season resets via Raider.io
              </span>
            </div>
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
            {entries.map((entry, i) => {
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
                        className="w-8 h-8 object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/classes/DPS.svg"; }}
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

                  {/* Right: overall damage */}
                  <div className="shrink-0 text-right pl-2">
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
                  </div>
                </motion.div>
              );
            })}

            {entries.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center border border-white/5 rounded-[2rem] bg-white/[0.02]">
                <Trophy className="w-14 h-14 text-gray-600 mb-4 opacity-40" />
                <p className="text-sm font-black text-gray-500 uppercase tracking-widest">No entries yet</p>
                <p className="text-xs text-gray-600 mt-2 max-w-sm">
                  Runs sync when missions complete on UPLINK. Sync your character in the Armory for scores.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
