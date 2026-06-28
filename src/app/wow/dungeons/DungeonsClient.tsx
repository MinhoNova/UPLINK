"use client";

import { useState } from "react";
import Link from "next/link";

const DUNGEONS = [
  { id: "nexuspoint-xenas", name: "Nexus-Point Xenas", difficulty: "Very Hard", level: 22 },
  { id: "skyreach", name: "Skyreach", difficulty: "Hard", level: 19 },
  { id: "windrunner-spire", name: "Windrunner Spire", difficulty: "Hard", level: 18 },
  { id: "maisara-caverns", name: "Maisara Caverns", difficulty: "Moderate", level: 16 },
  { id: "algethar-academy", name: "Algeth'ar Academy", difficulty: "Moderate", level: 15 },
  { id: "pit-of-saron", name: "Pit of Saron", difficulty: "Moderate", level: 14 },
  { id: "seat-of-the-triumvirate", name: "Seat of the Triumvirate", difficulty: "Easy", level: 12 },
  { id: "magisters-terrace", name: "Magisters' Terrace", difficulty: "Easy", level: 11 },
];

const DIFFICULTY_ORDER = ["Very Hard", "Hard", "Moderate", "Easy"];
const DIFFICULTY_COLORS: Record<string, string> = { "Very Hard": "text-red-400", Hard: "text-orange-400", Moderate: "text-yellow-400", Easy: "text-green-400" };
const DIFFICULTY_BG: Record<string, string> = { "Very Hard": "bg-red-500/10 border-red-500/30", Hard: "bg-orange-500/10 border-orange-500/20", Moderate: "bg-yellow-500/10 border-yellow-500/20", Easy: "bg-green-500/10 border-green-500/20" };

export default function DungeonsClient() {
  const [sortBy, setSortBy] = useState<"difficulty" | "level">("level");

  const sorted = [...DUNGEONS].sort((a, b) => sortBy === "level" ? b.level - a.level : DIFFICULTY_ORDER.indexOf(a.difficulty) - DIFFICULTY_ORDER.indexOf(b.difficulty));

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00ffff]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#ff007f]/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        <Link href="/wow" className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-[#00ffff] transition-colors">← Back to WoW</Link>
        <h1 className="text-3xl sm:text-4xl font-black text-white mt-3 mb-2 tracking-tight">
          Mythic+ <span className="text-[#ff007f]">Dungeons</span>
        </h1>
        <p className="text-sm text-gray-400 max-w-2xl mb-6">
          Midnight — Season 1 dungeon difficulty rankings based on completion rates and push scores.
        </p>

        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => setSortBy("level")} className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest transition ${sortBy === "level" ? "bg-white/10 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}>By Level</button>
          <button onClick={() => setSortBy("difficulty")} className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest transition ${sortBy === "difficulty" ? "bg-white/10 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}>By Difficulty</button>
        </div>

        <div className="space-y-3">
          {sorted.map((d) => (
            <div key={d.id} className={`${DIFFICULTY_BG[d.difficulty]} border rounded-2xl p-4 transition hover:bg-white/[0.02]`}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-black text-sm text-white">{d.name}</h3>
                <span className={`text-xs font-black ${DIFFICULTY_COLORS[d.difficulty]}`}>{d.difficulty}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-gray-500">Recommended Key Level: <span className="text-white">{d.level}</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
