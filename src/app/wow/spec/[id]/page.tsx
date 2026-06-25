import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/siteUrl";
import { SPECS, getSpecData } from "@/lib/wowData";
import SpecDetailClient from "./SpecDetailClient";

const siteUrl = getSiteUrl();

export async function generateStaticParams() {
  return SPECS.map((spec) => ({ id: spec.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const spec = SPECS.find((s) => s.id === id);
  if (!spec) return { title: "Spec not found" };
  const data = getSpecData(id);
  const talentKeywords = spec.seo.slice(0, 3).join(", ");
  return {
    title: `${spec.name} Talents & Build — ${spec.role === "tank" ? "Tank" : spec.role === "healer" ? "Healer" : "DPS"} BIS Gear, Enchants | UPLINK`,
    description: `Best ${spec.name} talents for Mythic+ and raid in The War Within. ${talentKeywords}. BIS gear, enchants, gems, stat priority, and talent builds from top ${spec.classId.replace("-", " ")} players.`,
    openGraph: {
      title: `${spec.name} Talents & Build — WoW Meta | UPLINK`,
      description: `${spec.name} talent trees, BIS gear, enchants, gems from top ${spec.classId.replace("-", " ")} players.`,
    },
    alternates: { canonical: `${siteUrl}/wow/spec/${id}` },
  };
}

export default async function SpecDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const spec = SPECS.find((s) => s.id === id);
  if (!spec) notFound();
  return <SpecDetailClient id={id} />;
}
