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

const TIER_META: Record<string, { color: string; bg: string; pillarBg: string; label: string }> = {
  S: { color: "#ff8c00", bg: "rgba(255,140,0,0.12)", pillarBg: "rgba(255,140,0,0.25)", label: "S" },
  A: { color: "#9b59b6", bg: "rgba(155,89,182,0.12)", pillarBg: "rgba(155,89,182,0.25)", label: "A" },
  B: { color: "#3498db", bg: "rgba(52,152,219,0.12)", pillarBg: "rgba(52,152,219,0.25)", label: "B" },
  C: { color: "#2ecc71", bg: "rgba(46,204,113,0.12)", pillarBg: "rgba(46,204,113,0.25)", label: "C" },
  D: { color: "#ffffff", bg: "rgba(255,255,255,0.06)", pillarBg: "rgba(255,255,255,0.12)", label: "D" },
  F: { color: "#888888", bg: "rgba(136,136,136,0.12)", pillarBg: "rgba(136,136,136,0.25)", label: "F" },
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

function SpecCard({ spec, score }: { spec: { id: string; name: string; classId: string; icon: string }; score: number }) {
  const color = getClassColor(spec.classId);
  return (
    <Link
      href={`/wow/spec/${spec.id}`}
      className="group flex items-center gap-3 bg-[#0c0c18] rounded-xl px-4 py-3 transition-all duration-200 min-w-[230px] flex-1 sm:flex-none"
      style={{
        border: `2px solid ${color}35`,
        boxShadow: `0 0 0 0 ${color}00`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.boxShadow = `0 0 25px ${color}30`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = `${color}35`;
        e.currentTarget.style.boxShadow = `0 0 0 0 ${color}00`;
      }}
    >
      <img src={spec.icon} alt={spec.name} className="w-10 h-10 rounded-lg shrink-0" />
      <div className="min-w-0 flex-1">
        <span className="inline-block px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider mb-0.5" style={{ backgroundColor: `${color}20`, color }}>
          {spec.classId.replace("-", " ")}
        </span>
        <div className="text-sm font-bold text-white truncate">{spec.name}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-base font-black leading-none" style={{ color }}>{score}</div>
        <div className="text-[6px] font-black text-gray-600 uppercase tracking-widest mt-0.5">SCORE</div>
      </div>
    </Link>
  );
}

function SpecDetailCard({ specId }: { specId: string }) {
  const spec = SPECS.find((s) => s.id === specId);
  if (!spec) return null;
  const color = getClassColor(spec.classId);
  return (
    <Link href={`/wow/spec/${specId}`} className="group relative bg-gradient-to-br from-[#0c0c18] to-black rounded-[1.5rem] p-6 transition-all duration-200" style={{ border: `1.5px solid ${color}25` }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${color}60`; e.currentTarget.style.boxShadow = `0 0 40px ${color}15`; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${color}25`; e.currentTarget.style.boxShadow = `none`; }}
    >
      <div className="flex items-center gap-3 mb-4">
        <img src={spec.icon} alt={spec.name} className="w-12 h-12 rounded-xl" />
        <div>
          <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider mb-0.5" style={{ backgroundColor: `${color}20`, color }}>{spec.classId.replace("-", " ")}</span>
          <div className="text-sm font-bold text-white">{spec.name}</div>
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
}

export default function WowTierListPage() {
  const [activeRole, setActiveRole] = useState<string>("dps");
  const [content, setContent] = useState<"raid" | "mythic">("mythic");
  const tiers = TIER_DATA[activeRole] || { S: [], A: [], B: [], C: [], D: [], F: [] };

  const totalParses = Object.values(TIERS).reduce((sum, tier) => sum + Object.values(tier).flat().length, 0);

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#ff8c00]/[0.04] blur-[160px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#9b59b6]/[0.04] blur-[140px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        {/* Hero header */}
        <div className="relative mb-10 pt-8 overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-[#0c0c18] via-[#0a0a14] to-black">
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
          <div className="relative px-8 py-10">
            <Link href="/wow" className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors">← Back to WoW</Link>
            <h1 className="text-4xl sm:text-5xl font-black text-white mt-4 mb-2 tracking-tight">
              Meta <span className="text-[#ff8c00] drop-shadow-[0_0_15px_rgba(255,140,0,0.4)]">Classes</span>
            </h1>
            <p className="text-sm text-gray-400 max-w-2xl">
              WoW spec rankings for Mythic+ and raid. Updated regularly based on performance data.
            </p>
            {/* Metadata bar — like archon.gg */}
            <div className="flex flex-wrap items-center gap-4 mt-6 pt-5 border-t border-white/5">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                Last updated: 20 hours ago
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                Total Parses: <span className="text-white">{totalParses.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Type + Role Tabs */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/5">
            <button onClick={() => setContent("mythic")} className={`px-4 py-2 rounded-lg font-black text-[11px] uppercase tracking-widest transition-all ${content === "mythic" ? "bg-[#ff007f] text-white shadow-[0_0_20px_rgba(255,0,127,0.3)]" : "text-gray-500 hover:text-white"}`}>Mythic+</button>
            <button onClick={() => setContent("raid")} className={`px-4 py-2 rounded-lg font-black text-[11px] uppercase tracking-widest transition-all ${content === "raid" ? "bg-[#ff007f] text-white shadow-[0_0_20px_rgba(255,0,127,0.3)]" : "text-gray-500 hover:text-white"}`}>Raid</button>
          </div>
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/5">
            {ROLES.map((role) => {
              const Icon = role.icon;
              return (
                <button key={role.id} onClick={() => setActiveRole(role.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-black text-[11px] uppercase tracking-widest transition-all ${activeRole === role.id ? "bg-white/10 text-white" : "text-gray-500 hover:text-white"}`}>
                  <Icon className="w-3.5 h-3.5" /> {role.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tier List — archon.gg style */}
        <div className="space-y-2">
          {TIERS.map((tier) => {
            const tierSpecs = tiers[tier] || [];
            if (tierSpecs.length === 0) return null;
            const meta = TIER_META[tier];
            return (
              <div key={tier} className="rounded-xl overflow-hidden border border-white/[0.06]">
                <div className="flex items-stretch">
                  {/* Tier pillar */}
                  <div className="w-20 flex items-center justify-center shrink-0" style={{ backgroundColor: meta.pillarBg }}>
                    <span className="text-5xl font-black" style={{ color: meta.color, textShadow: `0 0 20px ${meta.color}60` }}>
                      {meta.label}
                    </span>
                  </div>
                  {/* Cards area */}
                  <div className="flex-1 bg-black/40 p-3.5">
                    <div className="flex flex-wrap gap-2.5">
                      {tierSpecs.map(({ id, score }) => {
                        const spec = SPECS.find((s) => s.id === id);
                        if (!spec) return null;
                        return <SpecCard key={id} spec={spec} score={score} />;
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
          <h2 className="text-lg font-black text-white mb-1">Spec Details</h2>
          <p className="text-sm text-gray-400 mb-6">Click any spec card above to see its full breakdown — talents, gear, enchants, gems, and stat priorities.</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {["discipline-priest", "devastation-evoker", "arms-warrior"].map((id) => (
              <SpecDetailCard key={id} specId={id} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
