import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
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
  "death-knight": "/wow/banners/Blood_Death_Knight.webp",
  "demon-hunter": "/wow/banners/Havoc_Demon_Hunter.webp",
  druid: "/wow/banners/druid.webp",
  evoker: "/wow/banners/evoker.webp",
  hunter: "/wow/banners/Beast_Mastery_Hunter.webp",
  mage: "/wow/banners/mage.webp",
  monk: "/wow/banners/Windwalker_Monk.webp",
  paladin: "/wow/banners/Retribution_Paladin.webp",
  priest: "/wow/banners/Shadow_Priest.webp",
  rogue: "/wow/banners/Outlaw_Rogue.webp",
  shaman: "/wow/banners/Elemental_Shaman.webp",
  warlock: "/wow/banners/Affliction_Warlock.webp",
  warrior: "/wow/banners/Arms_Warrior.webp",
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
      <div className="relative z-10 lg:ml-[220px] max-w-4xl mx-auto px-4 pt-16 sm:pt-24 pb-12">
        <Link
          href="/wow"
          className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors"
        >
          ← Back to WoW
        </Link>

        <div className="mt-8 mb-12">
          <div className="relative w-full h-[180px] sm:h-[240px] rounded-2xl overflow-hidden mb-6">
            <Image
              src={CLASS_BANNERS[id]}
              alt={className}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 640px) 100vw, 800px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#05050a] via-[#05050a]/10 to-transparent" />
            <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4">
              <h1 className="text-2xl sm:text-4xl font-black text-white drop-shadow-2xl" style={{ textShadow: `0 2px 20px ${color}80, 0 2px 8px #000` }}>
                {className}
              </h1>
              <p className="text-xs sm:text-sm text-white/90 max-w-xl drop-shadow-lg mt-1" style={{ textShadow: "0 1px 8px #000" }}>
                All {className} specs — BIS gear, enchants, gems, stat priorities, and talent builds.
              </p>
              <div className="flex items-center gap-2 mt-2">
                {roles.map((role) => (
                  <span
                    key={role}
                    className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border"
                    style={{
                      borderColor: `${color}80`,
                      backgroundColor: `${color}40`,
                      color: '#fff',
                      textShadow: "0 1px 4px #000",
                    }}
                  >
                    {role === "tank" ? "Tank" : role === "healer" ? "Healer" : "DPS"}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

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
  );
}
