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
    description: `Best ${spec.name} talents for Mythic+ and raid in Midnight.${seasonTag} ${talentKeywords}. BIS gear, enchants, gems, stat priority, and talent builds from top ${className} players.${ptr ? " Projected Season 2 data." : ""}`,
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
      <SpecDetailClient id={id} ptr={ptr} />
    </>
  );
}
