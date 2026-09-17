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
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <a
            href={process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "https://discord.gg/aion2lfg"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-xl bg-[#5865F2]/15 px-6 py-3 text-[#aab8ff] border border-[#5865F2]/40 hover:bg-[#5865F2] hover:text-white font-black uppercase tracking-widest text-xs transition-all"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-5 w-5">
              <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            Join our Discord
          </a>
        </div>
        <nav className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
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