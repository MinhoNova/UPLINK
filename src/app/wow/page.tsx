import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/siteUrl";
import { CLASS_COLORS, CLASS_NAMES, SPECS, getClassColor, getSpecsByClass } from "@/lib/wowData";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "WoW Tools & Class Guides — Tier Lists, Spec Builds & Rankings | WoWLFG",
  description:
    "World of Warcraft class tier lists, spec rankings, meta builds, and performance data. Browse by class — Death Knight, Demon Hunter, Druid, and all 13 classes with BIS gear, enchants, and talent builds.",
  alternates: { canonical: `${siteUrl}/wow` },
};

function ClassCard({ classId }: { classId: string }) {
  const color = getClassColor(classId);
  const specs = getSpecsByClass(classId);
  const roles = [...new Set(specs.map((s) => s.role))];

  return (
    <Link
      href={`/wow/class/${classId}`}
      className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-[#0a0a16] to-black p-5 hover:border-white/10 transition-all"
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `radial-gradient(400px at 50% 0%, ${color}12 0%, transparent 70%)` }}
      />
      <div className="relative">
        <h3 className="text-lg font-black mb-1 group-hover:text-[#00ffff] transition-colors" style={{ color }}>
          {CLASS_NAMES[classId]}
        </h3>
        <div className="flex flex-wrap gap-1 mb-2">
          {roles.map((role) => (
            <span
              key={role}
              className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${color}15`, color }}
            >
              {role === "tank" ? "Tank" : role === "healer" ? "Healer" : "DPS"}
            </span>
          ))}
        </div>
        <p className="text-[10px] text-gray-500 leading-relaxed">
          {specs.map((s) => s.name).join(" · ")}
        </p>
      </div>
    </Link>
  );
}

export default function WowLanding() {
  const classIds = Object.keys(CLASS_NAMES);

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00ffff]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#ff007f]/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            WoW <span className="text-[#00ffff]">Tools</span>
          </h1>
          <p className="text-sm text-gray-400 max-w-xl mx-auto">
            Class rankings, tier lists, meta builds, and performance data for World of Warcraft.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-20">
          <Link href="/wow/tier-list" className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-8 hover:border-[#00ffff]/30 transition group text-left">
            <h2 className="text-lg font-black text-white mb-2 group-hover:text-[#00ffff] transition">Tier List</h2>
            <p className="text-sm text-gray-500">DPS, Healer & Tank rankings. See which specs top the charts.</p>
          </Link>
          <Link href="/wow/dungeons" className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-8 hover:border-[#ff007f]/30 transition group text-left">
            <h2 className="text-lg font-black text-white mb-2 group-hover:text-[#ff007f] transition">Dungeons</h2>
            <p className="text-sm text-gray-500">Mythic+ dungeon difficulty rankings and affixes.</p>
          </Link>
          <Link href="/wow/talents" className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-8 hover:border-[#aaff00]/30 transition group text-left">
            <h2 className="text-lg font-black text-white mb-2 group-hover:text-[#aaff00] transition">Talents</h2>
            <p className="text-sm text-gray-500">All spec talent builds. Filter by role, class, or search by name.</p>
          </Link>
          <Link href="/wow/pipeline" className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-8 hover:border-[#00ffff]/30 transition group text-left">
            <h2 className="text-lg font-black text-white mb-2 group-hover:text-[#00ffff] transition">The Pipeline</h2>
            <p className="text-sm text-gray-500">Class tuning, hotfixes & Blizzard news — live from the forums.</p>
          </Link>
          <Link href="/wow/affixes" className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-8 hover:border-[#9b59b6]/30 transition group text-left">
            <h2 className="text-lg font-black text-white mb-2 group-hover:text-[#9b59b6] transition">Affixes</h2>
            <p className="text-sm text-gray-500">Mythic+ affix calendar. See current and next week&apos;s affixes.</p>
          </Link>
          <Link href="/wow/leaderboard" className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-8 hover:border-[#ff8c00]/30 transition group text-left">
            <h2 className="text-lg font-black text-white mb-2 group-hover:text-[#ff8c00] transition">Leaderboard</h2>
            <p className="text-sm text-gray-500">Top Mythic+ specs and scores for the current season.</p>
          </Link>
        </div>

        {/* Browse by Class */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 tracking-tight">
            Browse by <span className="text-[#ff007f]">Class</span>
          </h2>
          <p className="text-sm text-gray-400 max-w-xl mx-auto">
            Select a class to view all specs, talent builds, BIS gear, enchants, and stat priorities.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classIds.map((classId) => (
            <ClassCard key={classId} classId={classId} />
          ))}
        </div>
      </div>
    </div>
  );
}
