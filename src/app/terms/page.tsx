import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/siteUrl";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Terms of Service — WoWLFG | UPLINK",
  description:
    "WoWLFG Terms of Service. Rules and guidelines for using our WoW boosting platform, community features, blind gold auctions, and Discord services.",
  openGraph: {
    title: "Terms of Service — WoWLFG",
    description: "WoWLFG Terms of Service — rules, acceptable use, and guidelines for the WoW boosting community platform.",
    siteName: "WoWLFG — UPLINK",
  },
  alternates: { canonical: `${siteUrl}/terms` },
};

export default function TermsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${siteUrl}/terms#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Terms of Service", item: `${siteUrl}/terms` },
        ],
      },
      {
        "@type": "WebPage",
        "@id": `${siteUrl}/terms`,
        url: `${siteUrl}/terms`,
        name: "Terms of Service",
        description: "WoWLFG Terms of Service — rules, acceptable use, and platform guidelines.",
        isPartOf: { "@type": "WebSite", "@id": `${siteUrl}#website` },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00ffff]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#ff007f]/5 blur-[120px] rounded-full" />
      </div>
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-24">
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-6 tracking-tight">Terms of <span className="text-[#00ffff]">Service</span></h1>
        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-8">Last updated: June 2026</p>

        <div className="space-y-6 text-sm text-gray-400 leading-relaxed">
          <Section title="1. Acceptance of Terms">
            <p>By accessing or using WoWLFG (the "Platform"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform.</p>
          </Section>

          <Section title="2. Description of Service">
            <p>WoWLFG is a community platform for World of Warcraft players to find groups, post boost requests with blind gold auctions, browse guides, and interact through community posts and comments.</p>
          </Section>

          <Section title="3. User Accounts">
            <p>You must log in with Discord to create content on the Platform. You are responsible for maintaining the confidentiality of your Discord account. You must be at least 13 years old to use the Platform.</p>
          </Section>

          <Section title="4. Acceptable Use">
            <p>You agree not to: (a) harass, abuse, or harm other users; (b) post fraudulent, misleading, or inappropriate content; (c) attempt to manipulate the blind auction system; (d) use the Platform for any illegal activity; (e) exploit bugs or vulnerabilities for personal gain.</p>
          </Section>

          <Section title="5. Content Guidelines">
            <p>You retain ownership of content you post. By posting, you grant WoWLFG a non-exclusive license to display your content on the Platform. We reserve the right to remove content that violates these terms.</p>
          </Section>

          <Section title="6. Gold Transactions">
            <p>WoWLFG facilitates connections between players seeking boosts and boosters offering services. All gold transactions are conducted directly between users. WoWLFG is not a party to any transaction and is not responsible for disputes.</p>
          </Section>

          <Section title="7. Termination">
            <p>WoWLFG will terminate, in appropriate circumstances, accounts of users who repeatedly infringe these terms or engage in harmful behavior. We reserve the right to suspend or ban accounts at our discretion.</p>
          </Section>

          <Section title="8. Disclaimer">
            <p>The Platform is provided "as is" without warranties of any kind. WoWLFG is not affiliated with Blizzard Entertainment or Activision. World of Warcraft is a registered trademark of Blizzard Entertainment.</p>
          </Section>

          <Section title="9. Contact">
            <p>For questions about these terms, contact us via Discord at <a href="https://discord.gg/r4m3Stk7XZ" className="text-[#00ffff] hover:underline">discord.gg/r4m3Stk7XZ</a> or email support@uplinklfg.com.</p>
          </Section>
        </div>

        <div className="mt-10 text-center">
          <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-[#00ffff] transition">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-6">
      <h2 className="text-sm font-black text-white mb-3">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
