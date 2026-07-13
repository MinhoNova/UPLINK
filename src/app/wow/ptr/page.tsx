import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getSiteUrl } from "@/lib/siteUrl";
import { SPECS, getClassColor } from "@/lib/wowData";
import { Calendar, Shield, Swords, HeartHandshake, ChevronRight, ExternalLink, Clock } from "lucide-react";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "WoW PTR — Patch 11.2 Class Changes, New Dungeons & Updates | WoWLFG",
  description: "World of Warcraft PTR patch notes, class tuning changes, new dungeon previews, and upcoming features for The War Within on the Public Test Realm.",
  alternates: { canonical: `${siteUrl}/wow/ptr` },
  openGraph: {
    title: "WoW PTR — Patch 11.2 Class Changes, New Dungeons & Updates",
    description: "World of Warcraft PTR patch notes, class tuning changes, new dungeon previews, and upcoming features.",
    url: `${siteUrl}/wow/ptr`,
    siteName: "WoWLFG — UPLINK",
    images: [{ url: `${siteUrl}/og.png`, width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", title: "WoW PTR — Patch 11.2 Class Changes, New Dungeons & Updates", description: "World of Warcraft PTR patch notes, class tuning changes, and upcoming features.", images: [`${siteUrl}/og.png`] },
};

const ROLE_ORDER = ["dps", "healer", "tank"] as const;
const ROLE_META: Record<string, { label: string; icon: typeof Swords; color: string }> = {
  dps: { label: "DPS", icon: Swords, color: "#ff4444" },
  healer: { label: "Healer", icon: HeartHandshake, color: "#00cc66" },
  tank: { label: "Tank", icon: Shield, color: "#4488ff" },
};

interface S2Dungeon {
  name: string;
  slug: string;
  short_name: string;
  icon_url: string;
  background_image_url: string;
}

async function getS2Dungeons(): Promise<S2Dungeon[]> {
  try {
    const res = await fetch("https://raider.io/api/v1/mythic-plus/static-data?expansion_id=11", {
      cache: "force-cache",
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const s2 = data.seasons?.find((s: any) => s.slug === "season-mn-2");
    if (!s2?.dungeons) return [];
    return s2.dungeons.map((d: any) => ({
      name: d.name,
      slug: d.slug,
      short_name: d.short_name,
      icon_url: d.icon_url,
      background_image_url: d.background_image_url,
    }));
  } catch {
    return [];
  }
}

function daysUntil(date: Date): number {
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86400000));
}

export const dynamic = "force-dynamic";

export default async function PTRPage() {
  const s2Dungeons = await getS2Dungeons();
  const seasonInfo = s2Dungeons.length > 0 ? s2Dungeons : [
    { name: "Altar of Fangs", slug: "altar-of-fangs", short_name: "AOF", icon_url: "", background_image_url: "" },
    { name: "Den of Nalorakk", slug: "den-of-nalorakk", short_name: "DON", icon_url: "", background_image_url: "" },
    { name: "Kings' Rest", slug: "kings-rest", short_name: "KR", icon_url: "", background_image_url: "" },
    { name: "Murder Row", slug: "murder-row", short_name: "MR", icon_url: "", background_image_url: "" },
    { name: "Ruby Life Pools", slug: "ruby-life-pools", short_name: "RLP", icon_url: "", background_image_url: "" },
    { name: "Temple of Sethraliss", slug: "temple-of-sethraliss", short_name: "TOS", icon_url: "", background_image_url: "" },
    { name: "The Blinding Vale", slug: "the-blinding-vale", short_name: "BV", icon_url: "", background_image_url: "" },
    { name: "Voidscar Arena", slug: "voidscar-arena", short_name: "VSA", icon_url: "", background_image_url: "" },
  ];

  const s2Start = new Date("2026-12-16T15:00:00Z");
  const daysLeft = daysUntil(s2Start);

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
      <div className="relative z-10 max-w-5xl mx-auto px-4 pt-16 sm:pt-24 pb-12">

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
            Real Raider.IO S2 season data — dungeon pool, projected tier list, talent builds, and gear recommendations.
            Data refreshes as PTR rankings populate.
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
            <div className="text-lg font-black text-white">{s2Dungeons.length || 8} Dungeons</div>
            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">S2 M+ Pool</div>
          </div>
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
            <ExternalLink className="w-5 h-5 text-amber-400 mb-2" />
            <div className="text-lg font-black text-white">40 Specs</div>
            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Full Tier List</div>
          </div>
        </div>

        {/* Dungeon Pool — with real Raider.IO images */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white/[0.03] border border-white/10 mb-10">
          <h2 className="text-base font-black uppercase tracking-[0.15em] mb-4 text-cyan-400">
            Season 2 Dungeon Pool
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {seasonInfo.map((d) => (
              <div key={d.slug} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                {d.icon_url ? (
                  <img src={d.icon_url} alt={d.name} className="w-9 h-9 rounded-lg shrink-0 object-cover" />
                ) : (
                  <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-[8px] font-black text-fuchsia-500 uppercase tracking-widest bg-fuchsia-500/10">
                    {d.short_name}
                  </span>
                )}
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

        {/* CTA */}
        <div className="p-8 rounded-2xl bg-gradient-to-br from-fuchsia-500/5 via-cyan-500/5 to-fuchsia-500/5 border border-white/10 text-center">
          <h2 className="text-lg font-black uppercase tracking-[0.15em] mb-3 text-fuchsia-400">
            Ready for Season 2?
          </h2>
          <p className="text-gray-400 text-sm mb-6 max-w-xl mx-auto">
            Browse full talent builds, BIS gear, enchants, gems, and stat priorities for every spec in PTR Season 2.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/wow/tier-list" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white text-xs font-black uppercase tracking-widest hover:from-fuchsia-400 hover:to-cyan-400 transition shadow-lg shadow-fuchsia-500/20">
              Live Tier List
            </Link>
            <Link href="/wow/leaderboard" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 text-gray-300 text-xs font-black uppercase tracking-widest border border-white/10 hover:bg-white/10 transition">
              Live Leaderboard
            </Link>
          </div>
        </div>

        {/* Links */}
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
