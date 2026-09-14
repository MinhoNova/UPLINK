import { getSiteUrl } from "@/lib/siteUrl";

const CATEGORIES = ["dungeons", "raids", "pvp", "leveling"] as const;
const REGIONS = ["eu", "na"] as const;

export async function generateStaticParams() {
  const params: { region: string; category: string }[] = [];
  for (const region of REGIONS) {
    for (const category of CATEGORIES) {
      params.push({ region, category });
    }
  }
  return params;
}

export default async function LfgFilterPage({ params }: { params: Promise<{ region: string; category: string }> }) {
  const { region, category } = await params;
  const siteUrl = getSiteUrl();
  const regionLabel = region === "eu" ? "EU" : "NA";
  const title = `${regionLabel} ${category.charAt(0).toUpperCase() + category.slice(1)} LFG — Find Aion 2 Squads`;
  const description = `Find Aion 2 ${category} squads on ${regionLabel} servers.`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: `${siteUrl}/lfg/${region}/${category}`,
  };

  return (
    <main className="min-h-screen bg-[#050814] text-slate-200 py-12 px-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black uppercase tracking-widest text-white mb-4">{title}</h1>
        <p className="text-slate-400 mb-8">{description}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {CATEGORIES.map((cat) => (
            <a key={cat} href={`/lfg/${region}/${cat}`} className={`p-3 rounded-xl border text-center text-[10px] font-black uppercase tracking-widest transition-all ${cat === category ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-300" : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-cyan-400/30"}`}>{cat}</a>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mb-8">
          {REGIONS.map((reg) => (
            <a key={reg} href={`/lfg/${reg}/${category}`} className={`p-3 rounded-xl border text-center text-[10px] font-black uppercase tracking-widest transition-all ${reg === region ? "border-purple-400/60 bg-purple-500/15 text-purple-300" : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-purple-400/30"}`}>{reg === "eu" ? "EU" : "NA"}</a>
          ))}
        </div>
        <div className="p-6 rounded-2xl border border-cyan-500/20 bg-white/[0.03] text-center">
          <a href="/" className="inline-block px-6 py-2 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-black uppercase tracking-widest">View All Offers</a>
        </div>
      </div>
    </main>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ region: string; category: string }> }) {
  const { region, category } = await params;
  const regionLabel = region === "eu" ? "EU" : "NA";
  const catLabel = category.charAt(0).toUpperCase() + category.slice(1);
  return {
    title: `${regionLabel} ${catLabel} LFG — Find Aion 2 Squads | Aion 2 LFG`,
    description: `Find Aion 2 ${category} squads on ${regionLabel} servers.`,
    alternates: { canonical: `/lfg/${region}/${category}` },
  };
}
