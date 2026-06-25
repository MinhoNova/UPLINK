import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/siteUrl";
import { SPECS, getClassColor } from "@/lib/wowData";

const siteUrl = getSiteUrl();

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const spec = SPECS.find((s) => s.id === id);
  if (!spec) return { title: "Spec not found" };
  const color = getClassColor(spec.classId);
  return {
    title: `${spec.name} — WoW Meta Builds, BIS Gear & Enchants | UPLINK`,
    description: `Best ${spec.name} build for Mythic+ and raid in The War Within. BIS gear, enchants, gems, stat priority, and talent builds for ${spec.name}.`,
    openGraph: {
      title: `${spec.name} — WoW Meta Builds | UPLINK`,
      description: `BIS gear, enchants, gems, and talent builds for ${spec.name}.`,
    },
    alternates: { canonical: `${siteUrl}/wow/spec/${id}` },
  };
}

const BIS_SLOTS = ["Head", "Neck", "Shoulders", "Back", "Chest", "Wrist", "Hands", "Waist", "Legs", "Feet", "Ring 1", "Ring 2", "Trinket 1", "Trinket 2", "Weapon", "Off-Hand"];

export default async function SpecDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const spec = SPECS.find((s) => s.id === id);
  if (!spec) notFound();

  const color = getClassColor(spec.classId);

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00ffff]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#ff007f]/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        <Link href="/wow/tier-list" className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-[#00ffff] transition-colors">← Back to Tier List</Link>

        {/* Spec Header */}
        <div className="flex items-center gap-4 mt-6 mb-8">
          <img src={spec.icon} alt={spec.name} className="w-16 h-16 rounded-2xl" style={{ backgroundColor: `${color}20` }} />
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">{spec.name}</h1>
            <p className="text-xs font-black uppercase tracking-wider" style={{ color }}>{spec.classId.replace("-", " ")} · {spec.role.toUpperCase()}</p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* BIS Gear */}
          <section className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-6">
            <h2 className="text-base font-black text-white mb-4">BIS Gear</h2>
            <p className="text-xs text-gray-500 mb-4">Best-in-slot gear for Mythic+ and raid. Data sourced from top parses.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {BIS_SLOTS.map((slot) => (
                <div key={slot} className="bg-white/5 rounded-xl px-3 py-2.5 flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-400">{slot}</span>
                  <span className="text-[9px] text-gray-600 italic">—</span>
                </div>
              ))}
            </div>
          </section>

          {/* Enchants */}
          <section className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-6">
            <h2 className="text-base font-black text-white mb-4">Enchants & Gems</h2>
            <p className="text-xs text-gray-500 mb-4">Recommended enchants and gems for optimal performance.</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {["Weapon", "Chest", "Cloak", "Legs", "Boots", "Rings", "Gems x3"].map((slot) => (
                <div key={slot} className="bg-white/5 rounded-xl px-3 py-2.5 flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-400">{slot}</span>
                  <span className="text-[9px] text-gray-600 italic">—</span>
                </div>
              ))}
            </div>
          </section>

          {/* Stat Priority */}
          <section className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-6">
            <h2 className="text-base font-black text-white mb-4">Stat Priority</h2>
            <p className="text-xs text-gray-500">Stat priority data coming soon.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
