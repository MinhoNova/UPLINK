import Aion2TestClubPage from "@/components/aion2/Aion2TestClubPage";

function HomeSeoFooter() {
  return (
    <footer className="relative border-t border-white/[0.06] bg-[#050814] px-6 py-16 text-white">
      <div className="mx-auto max-w-[1400px]">
        <h1 className="text-xl font-black uppercase tracking-[0.18em] text-cyan-100 sm:text-2xl">
          Aion 2 LFG — Find Your Squad for Every Dungeon, Raid &amp; PvP Battle
        </h1>
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
        <nav className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
          {[
            ["/create-offer", "Create an Offer"],
            ["/guides", "Guides"],
            ["/boosts", "Boosts"],
            ["/reviews", "Reviews"],
            ["/gold-auction", "Gold Auction"],
            ["/news", "News"],
            ["/about", "About"],
            ["/contact", "Contact"],
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

export default function HomePage() {
  return (
    <>
      <Aion2TestClubPage />
      <HomeSeoFooter />
    </>
  );
}