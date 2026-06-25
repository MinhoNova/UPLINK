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

// Top specs by role (sample data — will be replaced with API data)
const TIER_DATA: Record<string, Record<string, string[]>> = {
  dps: {
    S: ["devastation-evoker", "beast-mastery-hunter", "assassination-rogue"],
    A: ["fire-mage", "unholy-death-knight", "elemental-shaman", "havoc-demon-hunter"],
    B: ["windwalker-monk", "frost-death-knight", "retribution-paladin", "balance-druid", "shadow-priest"],
    C: ["outlaw-rogue", "fury-warrior", "feral-druid", "survival-hunter", "arcane-mage"],
    D: ["subtlety-rogue", "frost-mage", "arms-warrior", "enhancement-shaman", "demonology-warlock", "affliction-warlock", "destruction-warlock", "marksmanship-hunter", "devourer-demon-hunter"],
  },
  healer: {
    S: ["discipline-priest", "restoration-shaman"],
    A: ["holy-paladin", "restoration-druid"],
    B: ["preservation-evoker", "mistweaver-monk"],
    C: ["holy-priest"],
    D: [],
  },
  tank: {
    S: ["protection-warrior", "blood-death-knight"],
    A: ["brewmaster-monk", "guardian-druid"],
    B: ["protection-paladin", "devourer-demon-hunter"],
    C: [],
    D: [],
  },
};

export default function WowTierListPage() {
    const [activeRole, setActiveRole] = useState<string>("dps");

    const tiers = TIER_DATA[activeRole] || { S: [], A: [], B: [], C: [], D: [] };

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00ffff]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#ff007f]/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <Link href="/wow" className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-[#00ffff] transition-colors">← Back to WoW</Link>
          <h1 className="text-4xl sm:text-5xl font-black text-white mt-4 mb-3 tracking-tight">
            WoW Tier <span className="text-[#00ffff]">List</span>
          </h1>
          <p className="text-sm text-gray-400 max-w-2xl mx-auto">
            Spec rankings based on raid performance data. Updated regularly.
          </p>
        </div>

        {/* Role Tabs */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {ROLES.map((role) => {
            const Icon = role.icon;
            return (
              <button
                key={role.id}
                onClick={() => setActiveRole(role.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                  activeRole === role.id
                    ? "bg-[#ff007f] text-white shadow-[0_0_20px_rgba(255,0,127,0.3)]"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {role.label}
              </button>
            );
          })}
        </div>

        {/* Tier List */}
        <div className="space-y-2">
          {TIERS.map((tier) => {
            const tierSpecs = tiers[tier] || [];
            if (tierSpecs.length === 0) return null;
            return <TierRow key={tier} tier={tier} specIds={tierSpecs} />;
          })}
        </div>

        {!TIERS.some((t) => (tiers[t] || []).length > 0) && (
          <div className="text-center py-12 text-gray-500 text-xs font-black uppercase tracking-widest">
            No data available for this role yet.
          </div>
        )}
      </div>
    </div>
  );
}

function TierRow({ tier, specIds }: { tier: string; specIds: string[] }) {
  const tierColors: Record<string, string> = {
    S: "from-[#ffd700]/20 via-[#ffd700]/10 to-transparent border-[#ffd700]/30",
    A: "from-[#00ff88]/15 via-[#00ff88]/5 to-transparent border-[#00ff88]/20",
    B: "from-[#00ccff]/10 via-[#00ccff]/5 to-transparent border-[#00ccff]/15",
    C: "from-[#aa77ff]/10 via-[#aa77ff]/5 to-transparent border-[#aa77ff]/15",
    D: "from-[#ff6666]/10 via-[#ff6666]/5 to-transparent border-[#ff6666]/15",
  };

  return (
    <div className={`bg-gradient-to-r ${tierColors[tier]} border rounded-[2rem] p-4`}>
      <div className="flex items-start gap-4">
        <div className={`text-3xl font-black min-w-[4rem] text-center pt-2 ${
          tier === "S" ? "text-[#ffd700]" : tier === "A" ? "text-[#00ff88]" : tier === "B" ? "text-[#00ccff]" : tier === "C" ? "text-[#aa77ff]" : "text-[#ff6666]"
        }`}>
          {tier}
        </div>
        <div className="flex flex-wrap gap-3 flex-1">
          {specIds.map((specId) => {
            const spec = SPECS.find((s) => s.id === specId);
            if (!spec) return null;
            const color = getClassColor(spec.classId);
            return (
              <div
                key={spec.id}
                className="flex items-center gap-2.5 bg-black/60 border rounded-xl px-3 py-2"
                style={{ borderColor: `${color}40` }}
              >
                <img src={spec.icon} alt={spec.name} className="w-8 h-8 rounded-lg" style={{ backgroundColor: `${color}20` }} />
                <span className="text-xs font-black text-white/90" style={{ color }}>{spec.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
