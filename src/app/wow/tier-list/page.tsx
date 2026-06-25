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

const TIERS = ["S", "A", "B", "C", "D"] as const;

const TIER_COLORS: Record<string, string> = {
  S: "from-[#ffd700]/10 border-[#ffd700]/30",
  A: "from-[#00ff88]/10 border-[#00ff88]/20",
  B: "from-[#00ccff]/10 border-[#00ccff]/15",
  C: "from-[#aa77ff]/10 border-[#aa77ff]/15",
  D: "from-[#ff6666]/10 border-[#ff6666]/15",
};

const TIER_TEXT: Record<string, string> = {
  S: "text-[#ffd700]", A: "text-[#00ff88]", B: "text-[#00ccff]", C: "text-[#aa77ff]", D: "text-[#ff6666]",
};

const TIER_BG: Record<string, string> = {
  S: "bg-[#ffd700]/10", A: "bg-[#00ff88]/10", B: "bg-[#00ccff]/10", C: "bg-[#aa77ff]/10", D: "bg-[#ff6666]/10",
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
      { id: "devourer-demon-hunter", score: 3500 },
    ],
    C: [],
    D: [],
  },
};

export default function WowTierListPage() {
  const [activeRole, setActiveRole] = useState<string>("dps");
  const [content, setContent] = useState<"raid" | "mythic">("mythic");
  const tiers = TIER_DATA[activeRole] || { S: [], A: [], B: [], C: [], D: [] };

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00ffff]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#ff007f]/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8 pt-8">
          <Link href="/wow" className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-[#00ffff] transition-colors">← Back to WoW</Link>
          <h1 className="text-3xl sm:text-4xl font-black text-white mt-3 mb-2 tracking-tight">
            Meta <span className="text-[#00ffff]">Classes</span>
          </h1>
          <p className="text-sm text-gray-400 max-w-2xl">
            WoW spec rankings for Mythic+ and raid. Updated regularly based on performance data.
          </p>
        </div>

        {/* Content Type Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => setContent("mythic")} className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${content === "mythic" ? "bg-[#ff007f] text-white shadow-[0_0_20px_rgba(255,0,127,0.3)]" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}>Mythic+</button>
          <button onClick={() => setContent("raid")} className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${content === "raid" ? "bg-[#ff007f] text-white shadow-[0_0_20px_rgba(255,0,127,0.3)]" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}>Raid</button>
        </div>

        {/* Role Tabs */}
        <div className="flex items-center gap-2 mb-8">
          {ROLES.map((role) => {
            const Icon = role.icon;
            return (
              <button key={role.id} onClick={() => setActiveRole(role.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeRole === role.id ? "bg-white/10 text-white border border-white/20" : "bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent"}`}>
                <Icon className="w-4 h-4" /> {role.label}
              </button>
            );
          })}
        </div>

        {/* Tier List */}
        <div className="space-y-2">
          {TIERS.map((tier) => {
            const tierSpecs = tiers[tier] || [];
            if (tierSpecs.length === 0) return null;
            return (
              <div key={tier} className={`bg-gradient-to-r ${TIER_COLORS[tier]} border rounded-2xl overflow-hidden`}>
                <div className="flex items-stretch">
                  <div className={`w-12 flex items-center justify-center font-black text-xl shrink-0 ${TIER_BG[tier]}`}>
                    <span className={TIER_TEXT[tier]}>{tier}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 p-3 flex-1">
                    {tierSpecs.map(({ id, score }) => {
                      const spec = SPECS.find((s) => s.id === id);
                      if (!spec) return null;
                      const color = getClassColor(spec.classId);
                      return (
                        <Link
                          key={id}
                          href={`/wow/spec/${id}`}
                          className="flex items-center gap-2 bg-black/60 border rounded-xl px-3 py-2 hover:bg-black/80 transition min-w-[180px]"
                          style={{ borderColor: `${color}30` }}
                        >
                          <img src={spec.icon} alt={spec.name} className="w-9 h-9 rounded-lg shrink-0" style={{ backgroundColor: `${color}20` }} />
                          <div className="min-w-0">
                            <div className="text-[9px] font-black uppercase tracking-wider" style={{ color }}>{spec.classId.replace("-", " ")}</div>
                            <div className="text-xs font-black text-white truncate">{spec.name}</div>
                          </div>
                          <div className="ml-auto text-right shrink-0">
                            <div className="text-xs font-black text-white">{score}</div>
                            <div className="text-[7px] font-black text-gray-500 uppercase tracking-wider">Score</div>
                          </div>
                        </Link>
                      );
                    })}
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
        <div className="mt-12 border-t border-white/5 pt-8">
          <h2 className="text-lg font-black text-white mb-4">Spec Details</h2>
          <p className="text-sm text-gray-400 mb-4">Click any spec card above to see its full breakdown — talents, gear, enchants, gems, and stat priorities.</p>
          <div className="grid sm:grid-cols-3 gap-3">
            {["discipline-priest", "devastation-evoker", "arms-warrior"].map((id) => {
              const spec = SPECS.find((s) => s.id === id);
              if (!spec) return null;
              const color = getClassColor(spec.classId);
              return (
                <Link key={id} href={`/wow/spec/${id}`} className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[1.5rem] p-5 hover:border-white/20 transition group">
                  <div className="flex items-center gap-3 mb-3">
                    <img src={spec.icon} alt={spec.name} className="w-10 h-10 rounded-xl" style={{ backgroundColor: `${color}20` }} />
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-wider" style={{ color }}>{spec.classId.replace("-", " ")}</div>
                      <div className="text-sm font-black text-white">{spec.name}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-white/5 rounded-lg p-2"><span className="text-gray-500">BIS Gear</span><br /><span className="text-white font-black">View →</span></div>
                    <div className="bg-white/5 rounded-lg p-2"><span className="text-gray-500">Enchants</span><br /><span className="text-white font-black">View →</span></div>
                    <div className="bg-white/5 rounded-lg p-2"><span className="text-gray-500">Gems</span><br /><span className="text-white font-black">View →</span></div>
                    <div className="bg-white/5 rounded-lg p-2"><span className="text-gray-500">Stats</span><br /><span className="text-white font-black">View →</span></div>
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
