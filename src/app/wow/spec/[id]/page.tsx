import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/siteUrl";
import { SPECS, getSpecData } from "@/lib/wowData";
import SpecDetailClient from "./SpecDetailClient";

const siteUrl = getSiteUrl();

export async function generateStaticParams() {
  return SPECS.map((spec) => ({ id: spec.id }));
}

export async function generateMetadata({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<{ ptr?: string }> }): Promise<Metadata> {
  const { id } = await params;
  const ptr = searchParams ? (await searchParams).ptr === "1" : false;
  const spec = SPECS.find((s) => s.id === id);
  if (!spec) return { title: "Spec not found" };
  const data = getSpecData(id, ptr);
  const className = spec.classId.replace(/-/g, " ");
  const roleLabel = spec.role === "tank" ? "Tank" : spec.role === "healer" ? "Healer" : "DPS";
  const talentKeywords = spec.seo.join(", ");
  const ptrKeywords = `ptr ${spec.name.toLowerCase()} talents, ptr s2 ${spec.classId.toLowerCase()} ${roleLabel.toLowerCase()}, ${spec.name.toLowerCase()} ptr s2 build, wow ptr ${spec.classId.toLowerCase()} talents`;
  const seasonTag = ptr ? " (PTR Season 2 Preview)" : "";
  return {
    title: `${spec.name} Talents & ${roleLabel} Build — BIS Gear, Enchants${ptr ? " (PTR S2)" : ""} | UPLINK`,
    description: `Best ${spec.name} talents for Mythic+ and raid.${seasonTag} ${talentKeywords}. BIS gear: ${data ? data.bis.slice(0, 4).map((i) => i.name).join(", ") : `${spec.name} gear`}. Stat priority: ${data ? data.statPriority.join(", ") : "check the guide"}. Enchants, gems, and talent trees from top players.`,
    keywords: [talentKeywords, ptrKeywords].join(", "),
    openGraph: {
      title: `${spec.name} Talents & ${roleLabel} Build — WoW Meta${ptr ? " (PTR S2)" : ""} | UPLINK`,
      description: `${spec.name} talent trees, BIS gear, enchants, gems from top ${className} players.${ptr ? " PTR Season 2 preview with projected data." : ""}`,
    },
    alternates: { canonical: `${siteUrl}/wow/spec/${id}${ptr ? "?ptr=1" : ""}` },
  };
}

export default async function SpecDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<{ ptr?: string }> }) {
  const { id } = await params;
  const ptr = searchParams ? (await searchParams).ptr === "1" : false;
  const spec = SPECS.find((s) => s.id === id);
  if (!spec) notFound();
  const data = getSpecData(id, ptr);
  const className = spec.classId.replace(/-/g, " ");
  const roleLabel = spec.role === "tank" ? "Tank" : spec.role === "healer" ? "Healer" : "DPS";

  const faqItems = [
    {
      question: `What is the best talent build for ${spec.name} in Mythic+?`,
      answer: `The best Mythic+ talent build for ${spec.name} uses the talent string from top-ranked players. Check the Mythic+ tab for the latest build optimized for dungeon content.`,
    },
    {
      question: `What are the stat priorities for ${spec.name}?`,
      answer: data
        ? `The stat priority for ${spec.name} is: ${data.statPriority.join(", ")}.`
        : `Stat priorities for ${spec.name} vary by build. Check the spec detail page for current recommendations.`,
    },
    {
      question: `What is the best BIS gear for ${spec.name}?`,
      answer: data
        ? `Best-in-slot gear for ${spec.name} includes ${data.bis.slice(0, 4).map((i) => i.name).join(", ")} and more. Check the full BIS gear list for all slots.`
        : `BIS gear for ${spec.name} changes each season. Check the spec detail page for the latest recommendations.`,
    },
    {
      question: `What enchants and gems should I use for ${spec.name}?`,
      answer: data
        ? `Recommended enchants for ${spec.name} include ${data.enchants.slice(0, 3).map((e) => e.name).join(", ")}. Socket with ${data.gems.join(", ")}.`
        : `Enchants and gems for ${spec.name} depend on your stat priority. Check the spec detail page for current recommendations.`,
    },
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "WoWLFG", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "WoW", item: `${siteUrl}/wow` },
      { "@type": "ListItem", position: 3, name: spec.name },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <div className="lg:ml-[220px] max-w-4xl mx-auto px-4 pt-6 sm:pt-8">
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{roleLabel} {className}</p>
        <h1 className="text-2xl sm:text-4xl font-black text-white mb-2">{spec.name} Talents & BIS Gear</h1>
        {data && (
          <p className="text-xs text-gray-400 max-w-2xl mb-2">
            Stat Priority: {data.statPriority.join(", ")}.
            BIS gear includes {data.bis.slice(0, 4).map((i) => i.name).join(", ")}.
          </p>
        )}
      </div>
      <SpecDetailClient id={id} ptr={ptr} />
    </>
  );
}
