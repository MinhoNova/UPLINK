import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/siteUrl";
import {
  SPECS,
  CLASS_COLORS,
  CLASS_NAMES,
  getClassColor,
  getSpecData,
} from "@/lib/wowData";

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
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        <Link
          href="/wow"
          className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors"
        >
          ← Back to WoW
        </Link>

        <div className="mt-8 mb-12">
          <h1
            className="text-4xl sm:text-5xl font-black mb-3 tracking-tight"
            style={{ color }}
          >
            {className}
          </h1>
          <p className="text-sm text-gray-400 max-w-2xl">
            All {className} specs for Mythic+ and Raid. BIS gear, enchants,
            gems, stat priorities, and talent builds for every{" "}
            {className} specialization.
          </p>
          <div className="flex items-center gap-2 mt-4">
            {roles.map((role) => (
              <span
                key={role}
                className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border"
                style={{
                  borderColor: `${color}30`,
                  backgroundColor: `${color}10`,
                  color,
                }}
              >
                {role === "tank"
                  ? "Tank"
                  : role === "healer"
                    ? "Healer"
                    : "DPS"}
              </span>
            ))}
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
