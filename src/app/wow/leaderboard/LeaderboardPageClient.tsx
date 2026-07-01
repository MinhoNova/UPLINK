"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getClassColor, SPECS } from "@/lib/wowData";
import type { LeaderboardEntry } from "@/app/api/wow/leaderboard/route";
import { Swords, HeartHandshake, Shield, Trophy, AlertCircle, ExternalLink } from "lucide-react";
import CharacterAvatar from "@/components/wow/CharacterAvatar";

const ROLES = [
  { id: "all", label: "All", icon: Trophy },
  { id: "dps", label: "DPS", icon: Swords },
  { id: "healer", label: "Healer", icon: HeartHandshake },
  { id: "tank", label: "Tank", icon: Shield },
] as const;

const MEDALS = ["🥇", "🥈", "🥉"];

const REGION_FLAGS: Record<string, string> = {
  US: "/flags/us.svg",
  EU: "/flags/eu.svg",
};

function playerProfileUrl(name: string, realm: string, region: string): string {
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  const params = new URLSearchParams({ realm, region });
  return `/wow/player/${slug}?${params.toString()}`;
}

function classIdFromSpecId(specId: string): string {
  return SPECS.find((s) => s.id === specId)?.classId || "";
}

export default function LeaderboardPageClient() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeRole, setActiveRole] = useState("all");
  const [seasonDisplay, setSeasonDisplay] = useState("");

  async function fetchLeaderboard() {
    try {
      const res = await fetch("/api/wow/leaderboard");
      if (!res.ok) return;
      const data = await res.json();
      setEntries(data.entries || []);
      if (data.seasonDisplay) setSeasonDisplay(data.seasonDisplay);
    } catch { /* will retry */ }
  }

  useEffect(() => {
    fetchLeaderboard().finally(() => setLoading(false));
    const interval = setInterval(fetchLeaderboard, 60000);
    return () => clearInterval(interval);
  }, []);

  const filtered = activeRole === "all"
    ? entries
    : entries.filter((e) => {
        const spec = SPECS.find((s) => s.id === e.specId);
        return spec?.role === activeRole;
      });

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-1/3 w-[600px] h-[600px] bg-[#ff8c00]/[0.03] blur-[160px] rounded-full" />
        <div className="absolute bottom-[-10%] right-1/4 w-[500px] h-[500px] bg-[#ff007f]/[0.03] blur-[140px] rounded-full" />
      </div>
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12">
        <div className="mb-10 pt-8">
          <Link href="/wow" className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors">← Back to WoW</Link>
          <h1 className="text-4xl sm:text-5xl font-black text-white mt-4 mb-2 tracking-tight">
            M+ <span className="text-[#ff8c00] drop-shadow-[0_0_15px_rgba(255,140,0,0.4)]">Leaderboard</span>
          </h1>
          <p className="text-sm text-gray-400 max-w-2xl">
            Top Mythic+ players and scores for the current season. Data from Raider.IO — auto-updates every minute.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
              Live
            </span>
            {seasonDisplay && (
              <><span>·</span><span className="text-white">{seasonDisplay}</span></>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/5 mb-8 w-fit">
          {ROLES.map((role) => {
            const Icon = role.icon;
            return (
              <button key={role.id} onClick={() => setActiveRole(role.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-black text-[11px] uppercase tracking-widest transition-all ${activeRole === role.id ? "bg-[#ff007f]/20 text-[#ff007f]" : "text-gray-500 hover:text-white"}`}>
                <Icon className="w-3.5 h-3.5" /> {role.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 animate-pulse">
                <div className="w-6 h-4 bg-white/10 rounded" />
                <div className="w-10 h-10 bg-white/10 rounded-lg" />
                <div className="flex-1"><div className="h-4 bg-white/10 rounded w-1/3 mb-1" /><div className="h-3 bg-white/10 rounded w-1/4" /></div>
                <div className="w-16 h-4 bg-white/10 rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-black uppercase tracking-widest">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-xs font-black uppercase tracking-widest">No entries for this role.</div>
        ) : (
          <div className="rounded-2xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="text-left px-4 py-3 text-[9px] font-black uppercase tracking-widest text-gray-500 w-12">Rank</th>
                    <th className="text-left px-4 py-3 text-[9px] font-black uppercase tracking-widest text-gray-500">Player</th>
                    <th className="text-left px-4 py-3 text-[9px] font-black uppercase tracking-widest text-gray-500 hidden sm:table-cell">Realm</th>
                    <th className="text-left px-4 py-3 text-[9px] font-black uppercase tracking-widest text-gray-500 hidden sm:table-cell w-16">Region</th>
                    <th className="text-right px-4 py-3 text-[9px] font-black uppercase tracking-widest text-gray-500">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry) => {
                    const color = getClassColor(classIdFromSpecId(entry.specId) || entry.classId);
                    const spec = SPECS.find((s) => s.id === entry.specId);
                    const icon = spec?.icon || "";
                    const flag = REGION_FLAGS[entry.region?.toUpperCase()] || null;
                    const profileUrl = playerProfileUrl(entry.name, entry.realm, entry.region);
                    return (
                      <tr key={entry.rank} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                        {/* Rank */}
                        <td className="px-4 py-3">
                          {entry.rank <= 3 ? (
                            <span className="text-lg drop-shadow-[0_0_8px_rgba(255,215,0,0.4)]">{MEDALS[entry.rank - 1]}</span>
                          ) : (
                            <span className="text-xs font-black text-gray-500">#{entry.rank}</span>
                          )}
                        </td>
                        {/* Player Name + Spec */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {/* Character render + Spec */}
                            <Link href={`/wow/spec/${entry.specId}`}>
                              <CharacterAvatar name={entry.name} realm={entry.realm} region={entry.region} specIcon={icon} classColor={color} size={36} />
                            </Link>
                            <div className="min-w-0">
                              {/* Player name - clickable to profile */}
                              <Link
                                href={profileUrl}
                                className="text-sm font-bold text-white hover:text-[#00ffff] transition-colors truncate block"
                              >
                                {entry.name}
                              </Link>
                              {/* Spec + Class */}
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[8px] font-black uppercase tracking-wider" style={{ color: `${color}bb` }}>{spec?.name || entry.specId.replace(/-/g, " ")}</span>
                                <Link href={`/wow/player/${entry.name.toLowerCase().replace(/\s+/g, "-")}?realm=${encodeURIComponent(entry.realm)}&region=${entry.region}`}>
                                  <ExternalLink className="w-2.5 h-2.5 text-gray-600 hover:text-white transition-colors" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        </td>
                        {/* Realm */}
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-xs text-gray-500 truncate block max-w-[120px]">{entry.realm}</span>
                        </td>
                        {/* Region with flag */}
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <div className="flex items-center gap-1.5">
                            {flag && (
                              <Image src={flag} alt={entry.region} width={18} height={12} className="rounded-[2px] shrink-0" />
                            )}
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{entry.region}</span>
                          </div>
                        </td>
                        {/* Score */}
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-black" style={{ color }}>{entry.score.toLocaleString()}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
