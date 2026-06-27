"use client";

import { useState } from "react";
import Link from "next/link";
import { SPECS, getClassColor } from "@/lib/wowData";
import { Swords, HeartHandshake, Shield } from "lucide-react";

const ROLES = [
  { id: "dps", label: "DPS", icon: Swords },
  { id: "healer", label: "Healer", icon: HeartHandshake },
  { id: "tank", label: "Tank", icon: Shield },
] as const;

const TIERS = ["S", "A", "B", "C", "D", "F"] as const;

const TIER_META: Record<string, { color: string; bg: string; label: string }> = {
  S: { color: "#ff8c00", bg: "rgba(255,140,0,0.15)", label: "S" },
  A: { color: "#9b59b6", bg: "rgba(155,89,182,0.15)", label: "A" },
  B: { color: "#3498db", bg: "rgba(52,152,219,0.15)", label: "B" },
  C: { color: "#2ecc71", bg: "rgba(46,204,113,0.15)", label: "C" },
  D: { color: "#ffffff", bg: "rgba(255,255,255,0.08)", label: "D" },
  F: { color: "#888888", bg: "rgba(136,136,136,0.15)", label: "F" },
};

const TIER_DATA: Record<string, Record<string, { id: string; score: number }[]>> = {
  dps: {
    S: [
      { id: "devastation-evoker", score: 4065 },
      { id: "devourer-demon-hunter", score: 4015 },
      { id: "unholy-death-knight", score: 3970 },
      { id: "arms-warrior", score: 3880 },
    ],
    A: [
      { id: "outlaw-rogue", score: 3791 },
      { id: "retribution-paladin", score: 3736 },
      { id: "enhancement-shaman", score: 3713 },
      { id: "feral-druid", score: 3711 },
      { id: "survival-hunter", score: 3709 },
      { id: "shadow-priest", score: 3697 },
      { id: "assassination-rogue", score: 3693 },
      { id: "demonology-warlock", score: 3691 },
      { id: "elemental-shaman", score: 3672 },
      { id: "fury-warrior", score: 3665 },
      { id: "subtlety-rogue", score: 3662 },
    ],
    B: [
      { id: "marksmanship-hunter", score: 3601 },
      { id: "beast-mastery-hunter", score: 3589 },
      { id: "arcane-mage", score: 3563 },
      { id: "frost-mage", score: 3555 },
      { id: "affliction-warlock", score: 3540 },
      { id: "havoc-demon-hunter", score: 3521 },
      { id: "fire-mage", score: 3518 },
      { id: "windwalker-monk", score: 3499 },
      { id: "frost-death-knight", score: 3499 },
    ],
    C: [
      { id: "balance-druid", score: 3449 },
      { id: "destruction-warlock", score: 3414 },
      { id: "devastation-evoker", score: 3356 },
    ],
    D: [],
    F: [],
  },
  healer: {
    S: [
      { id: "discipline-priest", score: 3800 },
      { id: "restoration-shaman", score: 3750 },
    ],
    A: [
      { id: "holy-paladin", score: 3650 },
      { id: "restoration-druid", score: 3600 },
    ],
    B: [
      { id: "preservation-evoker", score: 3500 },
      { id: "mistweaver-monk", score: 3450 },
    ],
    C: [{ id: "holy-priest", score: 3300 }],
    D: [],
    F: [],
  },
  tank: {
    S: [
      { id: "protection-warrior", score: 3900 },
      { id: "blood-death-knight", score: 3850 },
    ],
    A: [
      { id: "brewmaster-monk", score: 3700 },
      { id: "guardian-druid", score: 3650 },
    ],
    B: [
      { id: "protection-paladin", score: 3550 },
      { id: "vengeance-demon-hunter", score: 3500 },
    ],
    C: [],
    D: [],
    F: [],
  },
};

export default function WowTierListPage() {
  const [activeRole, setActiveRole] = useState<string>("dps");
  const [content, setContent] = useState<"raid" | "mythic">("mythic");
  const tiers = TIER_DATA[activeRole] || { S: [], A: [], B: [], C: [], D: [], F: [] };

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      {/* Hero glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-1/3 w-[600px] h-[600px] bg-[#ff8c00]/5 blur-[160px] rounded-full" />
        <div className="absolute bottom-[-10%] right-1/4 w-[500px] h-[500px] bg-[#ff007f]/5 blur-[140px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10 pt-8">
          <Link href="/wow" className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-[#00ffff] transition-colors">← Back to WoW</Link>
          <h1 className="text-4xl sm:text-5xl font-black text-white mt-4 mb-3 tracking-tight">
            Meta <span className="text-[#ff8c00] drop-shadow-[0_0_12px_rgba(255,140,0,0.5)]">Classes</span>
          </h1>
          <p className="text-sm text-gray-400 max-w-2xl">
            WoW spec rankings for Mythic+ and raid. Updated regularly based on performance data.
          </p>
        </div>

        {/* Content Type + Role Tabs row */}
        <div className="flex flex-wrap items-center gap-3 mb-10">
          <div className="flex items-center gap-2">
            <button onClick={() => setContent("mythic")} className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${content === "mythic" ? "bg-[#ff007f] text-white shadow-[0_0_25px_rgba(255,0,127,0.4)]" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}>Mythic+</button>
            <button onClick={() => setContent("raid")} className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${content === "raid" ? "bg-[#ff007f] text-white shadow-[0_0_25px_rgba(255,0,127,0.4)]" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}>Raid</button>
          </div>
          <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />
          <div className="flex items-center gap-2">
            {ROLES.map((role) => {
              const Icon = role.icon;
              return (
                <button key={role.id} onClick={() => setActiveRole(role.id)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeRole === role.id ? "bg-white/10 text-white border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05)]" : "bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent"}`}>
                  <Icon className="w-4 h-4" /> {role.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tier List */}
        <div className="space-y-3">
          {TIERS.map((tier) => {
            const tierSpecs = tiers[tier] || [];
            if (tierSpecs.length === 0) return null;
            const meta = TIER_META[tier];
            return (
              <div key={tier} className="rounded-2xl overflow-hidden border border-white/5">
                <div className="flex items-stretch">
                  {/* Tier pillar — full color, glowing */}
                  <div
                    className="w-20 flex items-center justify-center shrink-0 relative"
                    style={{ backgroundColor: meta.bg }}
                  >
                    <span
                      className="text-5xl font-black drop-shadow-[0_0_15px_var(--tier-glow)]"
                      style={{ color: meta.color, "--tier-glow": `${meta.color}80` } as React.CSSProperties}
                    >
                      {meta.label}
                    </span>
                  </div>
                  {/* Cards area — dark background */}
                  <div className="flex-1 bg-black/60 backdrop-blur-sm p-4">
                    <div className="flex flex-wrap gap-3">
                      {tierSpecs.map(({ id, score }) => {
                        const spec = SPECS.find((s) => s.id === id);
                        if (!spec) return null;
                        const color = getClassColor(spec.classId);
                        return (
                          <Link
                            key={id}
                            href={`/wow/spec/${id}`}
                            className="group flex items-center gap-3 bg-[#0a0a12] rounded-xl px-4 py-3 transition-all duration-300 min-w-[220px] flex-1 sm:flex-none"
                            style={{
                              border: `2px solid ${color}30`,
                              boxShadow: `0 0 20px ${color}08`,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = color;
                              e.currentTarget.style.boxShadow = `0 0 30px ${color}25`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = `${color}30`;
                              e.currentTarget.style.boxShadow = `0 0 20px ${color}08`;
                            }}
                          >
                            <img src={spec.icon} alt={spec.name} className="w-11 h-11 rounded-xl shrink-0 ring-2 ring-transparent group-hover:ring-current transition-all duration-300" style={{ ringColor: `${color}50` }} />
                            <div className="min-w-0 flex-1">
                              <div className="text-[9px] font-black uppercase tracking-wider" style={{ color }}>{spec.classId.replace("-", " ")}</div>
                              <div className="text-sm font-black text-white truncate group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-[color] transition-all">{spec.name}</div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-sm font-black" style={{ color }}>{score}</div>
                              <div className="text-[7px] font-black text-gray-500 uppercase tracking-widest">SCORE</div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!TIERS.some((t) => (tiers[t] || []).length > 0) && (
          <div className="text-center py-12 text-gray-500 text-xs font-black uppercase tracking-widest">No data available for this role yet.</div>
        )}

        {/* Spec Detail Section */}
        <div className="mt-16 border-t border-white/5 pt-10">
          <h2 className="text-xl font-black text-white mb-2">Spec Details</h2>
          <p className="text-sm text-gray-400 mb-6">Click any spec card above to see its full breakdown — talents, gear, enchants, gems, and stat priorities.</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {["discipline-priest", "devastation-evoker", "arms-warrior"].map((id) => {
              const spec = SPECS.find((s) => s.id === id);
              if (!spec) return null;
              const color = getClassColor(spec.classId);
              return (
                <Link key={id} href={`/wow/spec/${id}`} className="group relative bg-gradient-to-br from-[#0a0a16] to-black rounded-[1.5rem] p-6 transition-all duration-300" style={{ border: `1.5px solid ${color}25`, boxShadow: `0 0 25px ${color}08` }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${color}60`;
                    e.currentTarget.style.boxShadow = `0 0 40px ${color}20`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${color}25`;
                    e.currentTarget.style.boxShadow = `0 0 25px ${color}08`;
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <img src={spec.icon} alt={spec.name} className="w-12 h-12 rounded-xl ring-2" style={{ ringColor: `${color}40` }} />
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-wider" style={{ color }}>{spec.classId.replace("-", " ")}</div>
                      <div className="text-sm font-black text-white">{spec.name}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-white/5 rounded-lg p-2.5 border border-white/5"><span className="text-gray-500">BIS Gear</span><br /><span className="text-white font-black">View →</span></div>
                    <div className="bg-white/5 rounded-lg p-2.5 border border-white/5"><span className="text-gray-500">Enchants</span><br /><span className="text-white font-black">View →</span></div>
                    <div className="bg-white/5 rounded-lg p-2.5 border border-white/5"><span className="text-gray-500">Gems</span><br /><span className="text-white font-black">View →</span></div>
                    <div className="bg-white/5 rounded-lg p-2.5 border border-white/5"><span className="text-gray-500">Stats</span><br /><span className="text-white font-black">View →</span></div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
