import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/siteUrl";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Mythic+ Boosting Guide — UPLINK",
  description:
    "Complete guide to Mythic+ boosting on UPLINK. Learn how to post a boost request, place bids in gold, accept offers, and choose the right booster for your WoW dungeon key.",
  openGraph: {
    title: "Mythic+ Boosting Guide — UPLINK",
    description:
      "Complete guide to Mythic+ boosting on UPLINK. Post requests, place bids, accept offers.",
  },
  alternates: { canonical: `${siteUrl}/guides/mythic-plus-boosting` },
};

export default function MythicPlusBoostingGuide() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${siteUrl}/guides/mythic-plus-boosting#article`,
    headline: "Mythic+ Boosting Guide",
    description:
      "Complete guide to Mythic+ boosting on UPLINK. Learn how to post a boost request, place bids in gold, accept offers, and choose the right booster.",
    author: { "@type": "Organization", name: "UPLINK", url: siteUrl },
    publisher: { "@type": "Organization", name: "UPLINK", url: siteUrl },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${siteUrl}/guides/mythic-plus-boosting` },
    datePublished: "2026-06-18",
    dateModified: "2026-06-18",
  };

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00ffff]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#ff007f]/5 blur-[120px] rounded-full" />
      </div>
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/guides" className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-[#00ffff] transition-colors">
            ← Back to Guides
          </Link>
        </div>
        <article className="prose prose-invert max-w-none">
          <h1 className="text-3xl font-black uppercase tracking-[0.2em] mb-8 text-white">
            Mythic+ Boosting Guide
          </h1>

          <section className="mb-8">
            <h2 className="text-xl font-black text-[#00ffff] uppercase tracking-wider mb-3">What is Mythic+ Boosting?</h2>
            <p className="text-gray-400 leading-relaxed">
              Mythic+ boosting on UPLINK connects <strong className="text-white">boosters</strong> with players who need
              help completing high-level Mythic+ keys. Unlike traditional boosting services that use
              fixed prices, UPLINK runs an <strong className="text-white">auction-style marketplace</strong> where boosters
              bid in gold for the right to complete your boost request.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-black text-[#00ffff] uppercase tracking-wider mb-3">How to Post a Boost Request</h2>
            <ol className="list-decimal list-inside text-gray-400 leading-relaxed space-y-2">
              <li>Click the <strong className="text-white">Boost Request</strong> button on the main page toolbar.</li>
              <li>Select your <strong className="text-white">faction</strong> (Horde or Alliance).</li>
              <li>Choose a <strong className="text-white">dungeon</strong> from the available pool and set your target <strong className="text-white">key level</strong> (up to +90).</li>
              <li>Set your <strong className="text-white">budget in gold</strong> — the maximum amount you are willing to pay.</li>
              <li>Submit your request. Boosters will see it and place bids.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-black text-[#00ffff] uppercase tracking-wider mb-3">How Bidding Works</h2>
            <p className="text-gray-400 leading-relaxed mb-3">
              Once your boost request is live on the <Link href="/boosts" className="text-[#00ffff] hover:underline">Boost Requests page</Link>,
              registered boosters can place bids. Each bid includes:
            </p>
            <ul className="list-disc list-inside text-gray-400 leading-relaxed space-y-1">
              <li>The <strong className="text-white">gold amount</strong> the booster asks for.</li>
              <li>An optional <strong className="text-white">message</strong> with their credentials or offer details.</li>
            </ul>
            <p className="text-gray-400 leading-relaxed mt-3">
              You can review all bids in real time and <strong className="text-white">accept</strong> the offer that best
              suits your needs. Once accepted, the request is locked and the booster coordinates with
              you directly via Discord.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-black text-[#00ffff] uppercase tracking-wider mb-3">Tips for Boosters</h2>
            <ul className="list-disc list-inside text-gray-400 leading-relaxed space-y-1">
              <li>Browse all open requests on the <Link href="/boosts" className="text-[#00ffff] hover:underline">Boost Requests</Link> page.</li>
              <li>Place competitive bids with a clear message about your experience.</li>
              <li>Build your reputation through the <Link href="/reviews" className="text-[#00ffff] hover:underline">Reviews</Link> system.</li>
              <li>Join the <Link href="/community" className="text-[#00ffff] hover:underline">Community</Link> to network with other players.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-black text-[#00ffff] uppercase tracking-wider mb-3">Why Use UPLINK?</h2>
            <ul className="list-disc list-inside text-gray-400 leading-relaxed space-y-1">
              <li><strong className="text-white">Gold only</strong> — no real money transactions.</li>
              <li><strong className="text-white">Auction marketplace</strong> — boosters compete for your business.</li>
              <li><strong className="text-white">Discord integration</strong> — sync with Raider.io and coordinate runs.</li>
              <li><strong className="text-white">Community reviews</strong> — see feedback before accepting a bid.</li>
            </ul>
          </section>
        </article>
      </div>
    </div>
  );
}
