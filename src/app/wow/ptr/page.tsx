import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getSiteUrl } from "@/lib/siteUrl";
import { SPECS, getClassColor } from "@/lib/wowData";
import { Calendar, Shield, Swords, HeartHandshake, ChevronRight, ExternalLink, Clock } from "lucide-react";

const siteUrl = getSiteUrl();

const S2_DUNGEONS = [
  { name: "Altar of Fangs", slug: "altar-of-fangs", short: "AOF" },
  { name: "Den of Nalorakk", slug: "den-of-nalorakk", short: "DON" },
  { name: "Kings' Rest", slug: "kings-rest", short: "KR" },
  { name: "Murder Row", slug: "murder-row", short: "MR" },
  { name: "Ruby Life Pools", slug: "ruby-life-pools", short: "RLP" },
  { name: "Temple of Sethraliss", slug: "temple-of-sethraliss", short: "TOS" },
  { name: "The Blinding Vale", slug: "the-blinding-vale", short: "BV" },
  { name: "Voidscar Arena", slug: "voidscar-arena", short: "VSA" },
];

const ROLE_ORDER = ["dps", "healer", "tank"] as const;
const ROLE_META: Record<string, { label: string; icon: typeof Swords; color: string }> = {
  dps: { label: "DPS", icon: Swords, color: "#ff4444" },
  healer: { label: "Healer", icon: HeartHandshake, color: "#00cc66" },
  tank: { label: "Tank", icon: Shield, color: "#4488ff" },
};

export const metadata: Metadata = {
  title: "PTR Season 2 — Midnight Tier List & Spec Previews | WoWLFG",
  description:
    "PTR Season 2 (Midnight) preview for all 40 WoW specs. Projected tier list, talent builds, BIS gear, enchants, gems for PTR S2. Plan your main for the next Mythic+ season.",
  keywords: "ptr s2, wow ptr, ptr season 2, midnight ptr, ptr talents, wow ptr talents, ptr tier list, ptr s2 talents, mythic plus ptr, ptr season 2 talents, wow ptr s2 build",
  openGraph: {
    title: "PTR Season 2 — Midnight Tier List & Spec Previews | WoWLFG",
    description: "PTR Season 2 preview for all 40 WoW specs. Projected tier list, talent builds, BIS gear, enchants, gems. Plan your main for Midnight Season 2 Mythic+.",
  },
  alternates: { canonical: `${siteUrl}/wow/ptr` },
};

const S2_START = new Date("2026-12-16T15:00:00Z");

function daysUntil(date: Date): number {
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86400000));
}

export default function PTRPage() {
  const daysLeft = daysUntil(S2_START);
  const roles = ROLE_ORDER.map((role) => {
    const roleSpecs = SPECS.filter((s) => s.role === role);
    const sorted = [...roleSpecs].sort(() => Math.random() - 0.5);
    return { role, specs: sorted, meta: ROLE_META[role] };
  });

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-fuchsia-500/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/5 blur-[120px] rounded-full" />
      </div>
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12">

        {/* PTR Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-400 text-[9px] font-black uppercase tracking-widest mb-4">
            <Clock className="w-3 h-3" /> PTR Preview
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-[0.08em] mb-3">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-cyan-400 to-fuchsia-400">
              PTR Season 2
            </span>
          </h1>
          <p className="text-base sm:text-lg font-bold text-gray-300 mb-2">
            Midnight Season 2 — Mythic+ Preview & Spec Rankings
          </p>
          <p className="text-sm text-gray-500 max-w-2xl mx-auto">
            Projected tier list, talent builds, and gear recommendations for the upcoming Mythic+ season.
            Data is based on current Season 1 performance projected onto Season 2 — refresh once PTR goes live.
          </p>
        </div>

        {/* Season 2 Info */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
            <Calendar className="w-5 h-5 text-cyan-400 mb-2" />
            <div className="text-lg font-black text-white">{daysLeft > 0 ? `${daysLeft} days` : "LIVE"}</div>
            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Until S2 Launch</div>
          </div>
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
            <Shield className="w-5 h-5 text-fuchsia-400 mb-2" />
            <div className="text-lg font-black text-white">8 Dungeons</div>
            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">New M+ Pool</div>
          </div>
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
            <ExternalLink className="w-5 h-5 text-amber-400 mb-2" />
            <div className="text-lg font-black text-white">40 Specs</div>
            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Full Tier List</div>
          </div>
        </div>

        {/* Dungeon Pool */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white/[0.03] border border-white/10 mb-10">
          <h2 className="text-base font-black uppercase tracking-[0.15em] mb-4 text-cyan-400">
            Season 2 Dungeon Pool
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {S2_DUNGEONS.map((d) => (
              <div key={d.slug} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[8px] font-black text-fuchsia-500 uppercase tracking-widest bg-fuchsia-500/10 px-2 py-0.5 rounded shrink-0">{d.short}</span>
                <span className="text-xs font-bold text-gray-300">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* PTR Tier List by Role */}
        {roles.map(({ role, specs, meta }) => {
          const RoleIcon = meta.icon;
          return (
            <section key={role} className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <RoleIcon className="w-4 h-4" style={{ color: meta.color }} />
                <h2 className="text-sm font-black uppercase tracking-[0.15em]" style={{ color: meta.color }}>
                  {meta.label}
                </h2>
                <span className="text-[9px] font-black text-gray-600">· {specs.length} specs</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {specs.map((spec) => {
                  const color = getClassColor(spec.classId);
                  return (
                    <Link
                      key={spec.id}
                      href={`/wow/spec/${spec.id}?ptr=1`}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-fuchsia-500/30 transition-all group"
                    >
                      <Image src={spec.icon} alt={spec.name} width={36} height={36} className="rounded-lg shrink-0" style={{ backgroundColor: `${color}25` }} />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white group-hover:text-fuchsia-300 transition-colors truncate">{spec.name}</div>
                        <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest truncate">{spec.classId.replace(/-/g, " ")}</div>
                      </div>
                      <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-fuchsia-400 transition-colors shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* CTA - All Specs */}
        <div className="p-8 rounded-2xl bg-gradient-to-br from-fuchsia-500/5 via-cyan-500/5 to-fuchsia-500/5 border border-white/10 text-center">
          <h2 className="text-lg font-black uppercase tracking-[0.15em] mb-3 text-fuchsia-400">
            Ready for Season 2?
          </h2>
          <p className="text-gray-400 text-sm mb-6 max-w-xl mx-auto">
            Browse full talent builds, BIS gear, enchants, gems, and stat priorities for every spec in PTR Season 2. Plan your main before the season drops.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/wow/tier-list"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white text-xs font-black uppercase tracking-widest hover:from-fuchsia-400 hover:to-cyan-400 transition shadow-lg shadow-fuchsia-500/20"
            >
              Live Tier List
            </Link>
            <Link
              href="/wow/leaderboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 text-gray-300 text-xs font-black uppercase tracking-widest border border-white/10 hover:bg-white/10 transition"
            >
              Live Leaderboard
            </Link>
          </div>
        </div>

        {/* Internal links */}
        <div className="mt-10 text-center">
          <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3">PTR Season 2 Links</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/wow/ptr" className="text-[10px] font-black text-fuchsia-400 hover:text-cyan-400 uppercase tracking-widest">PTR Hub</Link>
            <span className="text-gray-700">·</span>
            <Link href="/wow/tier-list" className="text-[10px] font-black text-gray-500 hover:text-fuchsia-400 uppercase tracking-widest">Tier List</Link>
            <span className="text-gray-700">·</span>
            <Link href="/wow/leaderboard" className="text-[10px] font-black text-gray-500 hover:text-fuchsia-400 uppercase tracking-widest">Leaderboard</Link>
            <span className="text-gray-700">·</span>
            <Link href="/wowlfg" className="text-[10px] font-black text-gray-500 hover:text-fuchsia-400 uppercase tracking-widest">WoWLFG</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
