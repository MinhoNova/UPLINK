import type { Metadata } from "next";
import LobbyPage from "@/components/aion2/LobbyPage";
import { getKV } from "@/lib/db";
import { resolveHeroBg } from "@/lib/heroBg";

function HomeSeoFooter() {
  return (
    <footer className="relative mt-16 border-t border-white/[0.06] bg-[#050814] px-6 py-16 text-white">
      <div className="mx-auto max-w-[1400px]">
        <h2 className="text-xl font-black uppercase tracking-[0.18em] text-cyan-100 sm:text-2xl">
          Aion 2 LFG — Find Your Squad for Every Dungeon, Raid &amp; PvP Battle
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-400">
          <span className="font-bold text-slate-200">Aion 2 LFG</span> (aion2lfg.com) is the
          LFG group finder and boosting hub for NCsoft&apos;s Aion 2. Post an offer or join a
          squad for daily dungeons, expeditions, Strongholds, Transcendence and Nightmare —
          plus end-game raids like <span className="text-slate-200">Beritra Brigade Fortress</span>{" "}
          and <span className="text-slate-200">Abyssal Forge: Ludra</span>.
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400">
          Looking for PvP? Farm <span className="text-slate-200">Abyss Points</span> with a
          coordinated squad. Need to progress? Leveling and profession boosts (Cooking,
          Alchemy) are one post away. Set your class, region and difficulty, and let the best
          players apply.
        </p>
        <p className="mt-3 max-w-3xl text-xs leading-relaxed text-slate-500">
          Aion 2 LFG is a fan-run community. We are not affiliated with, endorsed by, or otherwise
          connected to NCSOFT or AION.
        </p>
        <nav className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
          {[
            ["/", "Home"],
            ["/create-offer", "Create an Offer"],
            ["/reviews", "Reviews"],
            ["/discord", "Discord Server"],
            ["/about", "About Us"],
            ["/contact", "Contact"],
            ["/classes", "Classes"],
            ["/pvp", "PvP"],
            ["/leveling", "Leveling"],
            ["/dungeons", "Dungeons"],
            ["/raids", "Raids"],
            ["/ascend", "Ascend"],
          ].map(([href, label]) => (
            <a key={href} href={href} className="transition-colors hover:text-cyan-300">
              {label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: {
    absolute: "Aion 2 LFG | Group Finder for Dungeons, Raids & PvP",
  },
  description:
    "Aion 2 LFG (aion2lfg.com) — the free LFG group finder and boosting hub for Aion 2. Join or post offers for daily dungeons, expeditions, Strongholds, end-game raids (Beritra Brigade Fortress, Abyssal Forge: Ludra), Abyss Points PvP farm and leveling. Set your class, region and difficulty and let the best players apply.",
  alternates: { canonical: "https://aion2lfg.com" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://aion2lfg.com",
    siteName: "Aion 2 LFG",
    title: "Aion 2 LFG | Group Finder for Dungeons, Raids & PvP",
    description:
      "Find Aion 2 squads for dungeons, raids, PvP (Abyss Points farming) and leveling on aion2lfg.com.",
    images: [
      {
        url: "https://aion2lfg.com/og-live.png",
        width: 1200,
        height: 630,
        alt: "Aion 2 LFG — the Aion 2 group finder",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aion 2 LFG | Aion 2 Group Finder",
    description:
      "Find Aion 2 squads — dungeons, raids, PvP and leveling. LFG made easy.",
    images: ["https://aion2lfg.com/og-live.png"],
  },
};

const SITE_URL = "https://aion2lfg.com";

export default async function HomePage() {
  let initialHeroBg: string | undefined;
  let topOffers: any[] = [];
  try {
    const heroBg = await getKV("heroBg");
    initialHeroBg = resolveHeroBg(heroBg);
  } catch {
    initialHeroBg = "scenic";
  }

  try {
    const lobbies: any[] = (await getKV("lobbies")) || [];
    const open = lobbies
      .filter((l: any) => (l.status || "standby") === "standby")
      .sort((a: any, b: any) => (Number(b.id) || Number(b.createdAt) || 0) - (Number(a.id) || Number(a.createdAt) || 0))
      .slice(0, 12);
    topOffers = open;
  } catch {
    topOffers = [];
  }

  const offerJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Open Aion 2 LFG Offers",
    itemListElement: topOffers.map((offer: any, i: number) => {
      const runs = offer.selectedDungeons
        ? (Object.values(offer.selectedDungeons) as number[]).reduce((a: number, b: number) => a + b, 0)
        : offer.runsCount || 1;
      return {
        "@type": "ListItem",
        position: i + 1,
        name: `${String(offer.title || `${runs}× Boost`)} — ${String(offer.category || "dungeon")} · ${String(offer.serverRegion || "EU")}`,
        url: `${SITE_URL}/#offer-${String(offer.id)}`,
      };
    }),
  }).replace(/</g, "\\u003c");

  return (
    <>
      <h1 className="sr-only">
        Aion 2 LFG — Free Group Finder &amp; Boosting Hub for Dungeons, Raids &amp; PvP
      </h1>
      <p className="sr-only" aria-hidden="true">
        Find and join Aion 2 squads for daily dungeons, Abyss Points PvP farming, Leveling and end-game raids. Post an offer or apply in seconds on aion2lfg.com.
      </p>
      {topOffers.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: offerJsonLd }}
        />
      )}
      <LobbyPage initialHeroBg={initialHeroBg} />
      <HomeSeoFooter />
    </>
  );
}