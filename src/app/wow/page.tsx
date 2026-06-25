import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/siteUrl";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "WoW Tools — Tier Lists, Meta Builds & Rankings | UPLINK",
  description:
    "World of Warcraft class tier lists, spec rankings, meta builds, and performance data. DPS, Healer, and Tank rankings for raid and Mythic+.",
  alternates: { canonical: `${siteUrl}/wow` },
};

export default function WowLanding() {
  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00ffff]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#ff007f]/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight">
          WoW <span className="text-[#00ffff]">Tools</span>
        </h1>
        <p className="text-sm text-gray-400 max-w-xl mx-auto mb-12">
          Class rankings, tier lists, and meta data for World of Warcraft.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <Link href="/wow/tier-list" className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-8 hover:border-[#00ffff]/30 transition group text-left">
            <h2 className="text-lg font-black text-white mb-2 group-hover:text-[#00ffff] transition">Tier List</h2>
            <p className="text-sm text-gray-500">DPS, Healer & Tank rankings. See which specs top the charts.</p>
          </Link>
          <div className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-8 opacity-50">
            <h2 className="text-lg font-black text-gray-500 mb-2">Meta Builds</h2>
            <p className="text-sm text-gray-600">Coming soon — talents, gear, and stat priorities.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
