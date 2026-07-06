import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/siteUrl";
import { SPECS, getSpecData, CLASS_NAMES } from "@/lib/wowData";
import { generateMetaTitle, generateMetaDescription, generateKeywords, generateFAQItems, generateIntroContent, getRelatedSpecs } from "@/lib/wow-seo";
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
  return {
    title: generateMetaTitle(spec, ptr),
    description: generateMetaDescription(spec, data, ptr),
    keywords: generateKeywords(spec, data).join(", "),
    openGraph: {
      title: `${spec.name} Talents & Build — WoW Meta${ptr ? " (PTR S2)" : ""} | UPLINK`,
      description: generateMetaDescription(spec, data, ptr).slice(0, 200),
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

  const faqItems = generateFAQItems(spec, data);
  const intro = generateIntroContent(spec, data, ptr);
  const related = getRelatedSpecs(spec);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "WoWLFG", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "WoW", item: `${siteUrl}/wow` },
      { "@type": "ListItem", position: 3, name: `${spec.name} Talents & BIS Gear`, item: `${siteUrl}/wow/spec/${id}` },
    ],
  };

  const cnFull = CLASS_NAMES[spec.classId] || spec.classId.replace(/-/g, " ");

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <div className="lg:ml-[220px] max-w-4xl mx-auto px-4 pt-6 sm:pt-8">
        <h1 className="text-2xl sm:text-4xl font-black text-white mb-1">{intro.heading}</h1>
        <p className="text-xs sm:text-sm text-gray-400 leading-relaxed mb-3">{intro.body}</p>
        {intro.bullets && (
          <ul className="text-[11px] text-gray-500 space-y-0.5 mb-2 list-disc list-inside">
            {intro.bullets.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        )}
        <p className="text-[10px] text-gray-600 mb-4">
          Keywords: {generateKeywords(spec, data).slice(0, 8).join(", ")}.
        </p>
        <nav className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
          <span className="text-gray-500">Related:</span>
          {related.sameRole.slice(0, 6).map((s) => (
            <Link key={s.id} href={`/wow/spec/${s.id}`} className="text-blue-400 hover:text-blue-300 underline underline-offset-2">{s.name}</Link>
          ))}
        </nav>
        <nav className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
          <Link href={`/wow/class/${spec.classId}`} className="text-blue-400 hover:text-blue-300 underline underline-offset-2">{cnFull} Class Page</Link>
          <Link href={`/wow/tier-list`} className="text-blue-400 hover:text-blue-300 underline underline-offset-2">Meta Tier List</Link>
          <Link href={`/wow/talents`} className="text-blue-400 hover:text-blue-300 underline underline-offset-2">All Talents</Link>
          {ptr && <Link href={`/wow/spec/${id}`} className="text-yellow-500 hover:text-yellow-400 underline underline-offset-2">Live (Season 2)</Link>}
          {!ptr && <Link href={`/wow/spec/${id}?ptr=1`} className="text-yellow-500 hover:text-yellow-400 underline underline-offset-2">PTR Preview</Link>}
        </nav>
        <div dir="rtl" className="text-[10px] text-gray-600 mb-6 leading-relaxed">
          <p>دليل {spec.name} في World of Warcraft — افضل تالنتات، تجهيزات، و ترتيب الاحصائيات لـ {cnFull} تخصص {spec.role === "tank" ? "تانك" : spec.role === "healer" ? "هيلر" : "دمج"}.</p>
        </div>
      </div>
      <SpecDetailClient id={id} ptr={ptr} />
      <div className="lg:ml-[220px] max-w-4xl mx-auto px-4 pt-8 pb-12">
        <hr className="border-gray-800 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Same Role</h2>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5">
              {related.sameRole.length > 0 ? related.sameRole.slice(0, 10).map((s) => (
                <Link key={s.id} href={`/wow/spec/${s.id}`} className="text-[11px] text-blue-400 hover:text-blue-300 underline underline-offset-2">{s.name}</Link>
              )) : <span className="text-[11px] text-gray-600">No other specs in this role</span>}
            </div>
          </div>
          <div>
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Same Class</h2>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5">
              {related.sameClass.length > 0 ? related.sameClass.slice(0, 6).map((s) => (
                <Link key={s.id} href={`/wow/spec/${s.id}`} className="text-[11px] text-blue-400 hover:text-blue-300 underline underline-offset-2">{s.name}</Link>
              )) : <span className="text-[11px] text-gray-600">No other specs in this class</span>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
