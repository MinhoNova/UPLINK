import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { getSiteUrl } from "@/lib/siteUrl";
import {
  SPECS,
  CLASS_COLORS,
  CLASS_NAMES,
  getClassColor,
  getSpecData,
} from "@/lib/wowData";
import ClassSidebar from "@/components/wow/ClassSidebar";

const CLASS_BANNERS: Record<string, string> = {
  "death-knight": "/wow/banners/death-knight.webp",
  "demon-hunter": "/wow/banners/demon-hunter.webp",
  druid: "/wow/banners/druid.webp",
  evoker: "/wow/banners/evoker.webp",
  hunter: "/wow/banners/hunter.webp",
  mage: "/wow/banners/mage.webp",
  monk: "/wow/banners/monk.webp",
  paladin: "/wow/banners/paladin.webp",
  priest: "/wow/banners/priest.webp",
  rogue: "/wow/banners/rogue.webp",
  shaman: "/wow/banners/shaman.webp",
  warlock: "/wow/banners/warlock.webp",
  warrior: "/wow/banners/warrior.webp",
};

const siteUrl = getSiteUrl();

const CLASS_IDS = Object.keys(CLASS_COLORS);

export function generateStaticParams() {
  return CLASS_IDS.map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const className = CLASS_NAMES[id];
  if (!className) return { title: "Class not found" };

  const specs = SPECS.filter((s) => s.classId === id);
  const specNames = specs.map((s) => s.name).join(", ");
  const roles = [...new Set(specs.map((s) => s.role))];

  return {
    title: `${className} Specs — ${specNames} Talent Builds, BIS Gear & Enchants | WoWLFG`,
    description: `All ${className} specs for Mythic+ and Raid. ${specNames}. BIS gear, enchants, gems, stat priorities, and talent builds for every ${className} specialization.`,
    alternates: { canonical: `${siteUrl}/wow/class/${id}` },
  };
}

export default async function ClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const className = CLASS_NAMES[id];
  if (!className) notFound();

  const color = getClassColor(id);
  const specs = SPECS.filter((s) => s.classId === id);
  const roles = [...new Set(specs.map((s) => s.role))];

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "WoWLFG", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "WoW", item: `${siteUrl}/wow` },
      { "@type": "ListItem", position: 3, name: `${className} Specs` },
    ],
  };

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(800px at 30% 15%, ${color}08 0%, transparent 60%)`,
        }}
      />
      <ClassSidebar />
      <div className="relative z-10 lg:ml-[424px] pt-16 sm:pt-24 pb-16">

        {/* ─── Class Hero Banner ─── */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-14 mt-6">
          <div className="relative w-full h-[200px] sm:h-[260px] lg:h-[320px] rounded-3xl overflow-hidden bg-black/40">
            <Image
              src={CLASS_BANNERS[id]}
              alt={className}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(5,5,10,0.7) 0%, rgba(5,5,10,0.3) 50%, rgba(5,5,10,0.7) 100%)" }} />
            <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 lg:px-14">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-none tracking-tight" style={{ textShadow: `0 2px 30px ${color}80, 0 4px 40px #000` }}>
                {className}
              </h1>
              <p className="text-xs sm:text-sm text-white/70 max-w-xl mt-3 font-medium tracking-wide drop-shadow-lg">
                All {className} specs — BIS gear, enchants, gems, stat priorities, and talent builds.
              </p>
              <div className="flex items-center gap-2 mt-3">
                {roles.map((role) => (
                  <span key={role} className="px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border" style={{ borderColor: `${color}80`, backgroundColor: `${color}40`, color: "#fff" }}>
                    {role === "tank" ? "Tank" : role === "healer" ? "Healer" : "DPS"}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Spec Grid ─── */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-14 mt-8">
          <Link href="/wow/tier-list" className="inline-flex items-center gap-1 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors mb-6"><ChevronLeft className="w-3 h-3" /> Back to Tier List</Link>
          <div className="grid sm:grid-cols-2 gap-4">
          {specs.map((spec) => {
            const data = getSpecData(spec.id);
            const statPreview = data?.statPriority?.slice(0, 3).join(" → ");
            return (
              <Link
                key={spec.id}
                href={`/wow/spec/${spec.id}`}
                className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-[#0c0c18] via-[#0a0a14] to-black p-5 hover:border-white/10 transition-all"
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: `radial-gradient(400px at 50% 0%, ${color}10 0%, transparent 70%)`,
                  }}
                />
                <div className="relative flex items-start gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src={spec.icon}
                      alt={spec.name}
                      width={56}
                      height={56}
                      className="rounded-xl"
                      style={{ backgroundColor: `${color}20` }}
                    />
                    <span
                      className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: `${color}15`,
                        color,
                      }}
                    >
                      {spec.role === "tank"
                        ? "Tank"
                        : spec.role === "healer"
                          ? "Healer"
                          : "DPS"}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-black text-white group-hover:text-[#00ffff] transition-colors">
                      {spec.name}
                    </h2>
                    {statPreview && (
                      <p className="text-[10px] text-gray-500 mt-1.5 leading-relaxed">
                        {statPreview}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {spec.seo.slice(0, 3).map((kw) => (
                        <span
                          key={kw}
                          className="px-1.5 py-0.5 rounded-full bg-white/[0.04] text-[6px] font-black uppercase tracking-widest text-gray-600"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
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
