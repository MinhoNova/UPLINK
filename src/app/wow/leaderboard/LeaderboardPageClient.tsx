"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getClassColor, SPECS } from "@/lib/wowData";
import type { LeaderboardEntry } from "@/app/api/wow/leaderboard/route";
import { Swords, HeartHandshake, Shield, Trophy, RefreshCw, AlertCircle } from "lucide-react";

const ROLES = [
  { id: "all", label: "All", icon: Trophy },
  { id: "dps", label: "DPS", icon: Swords },
  { id: "healer", label: "Healer", icon: HeartHandshake },
  { id: "tank", label: "Tank", icon: Shield },
] as const;

function specIconFromId(specId: string): string {
  const spec = SPECS.find((s) => s.id === specId);
  return spec?.icon || "";
}

function specNameFromId(specId: string): string {
  const spec = SPECS.find((s) => s.id === specId);
  return spec?.name || specId.replace(/-/g, " ");
}

function classIdFromSpecId(specId: string): string {
  const spec = SPECS.find((s) => s.id === specId);
  return spec?.classId || "";
}

export default function LeaderboardPageClient() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeRole, setActiveRole] = useState("all");
  const [season, setSeason] = useState("");

  async function fetchLeaderboard() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/wow/leaderboard");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEntries(data.entries || []);
      if (data.season) setSeason(data.season);
    } catch {
      setError("Failed to load leaderboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchLeaderboard(); }, []);

  const filtered = activeRole === "all"
    ? entries
    : entries.filter((e) => {
        const cid = classIdFromSpecId(e.specId);
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
            Top Mythic+ specs and scores for the current season. Data from Raider.IO.
          </p>
          <div className="flex items-center gap-3 mt-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
            {season && <span>{season.replace("-", " ")}</span>}
            {season && <span>·</span>}
            <button onClick={fetchLeaderboard} disabled={loading} className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors disabled:opacity-50">
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </div>

        {/* Role filter */}
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

        {/* Table */}
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
                    <th className="text-left px-4 py-3 text-[9px] font-black uppercase tracking-widest text-gray-500">Spec</th>
                    <th className="text-left px-4 py-3 text-[9px] font-black uppercase tracking-widest text-gray-500 hidden sm:table-cell">Realm</th>
                    <th className="text-left px-4 py-3 text-[9px] font-black uppercase tracking-widest text-gray-500 hidden sm:table-cell">Region</th>
                    <th className="text-right px-4 py-3 text-[9px] font-black uppercase tracking-widest text-gray-500">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry) => {
                    const color = getClassColor(classIdFromSpecId(entry.specId) || entry.classId);
                    const icon = specIconFromId(entry.specId);
                    const name = specNameFromId(entry.specId);
                    return (
                      <tr key={entry.rank} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                        <td className="px-4 py-3">
                          <span className={`text-sm font-black ${entry.rank <= 3 ? "text-[#ff8c00]" : "text-gray-400"}`}>
                            {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : `#${entry.rank}`}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/wow/spec/${entry.specId}`} className="flex items-center gap-3">
                            {icon && <img src={icon} alt={name} className="w-9 h-9 rounded-lg shrink-0" />}
                            <div>
                              <div className="text-[9px] font-black uppercase tracking-wider" style={{ color }}>{entry.classId.replace(/-/g, " ")}</div>
                              <div className="text-sm font-bold text-white">{name}</div>
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-xs text-gray-500">{entry.realm}</span>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${entry.region === "US" ? "text-[#00ffff]" : "text-[#ff007f]"}`}>{entry.region}</span>
                        </td>
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
