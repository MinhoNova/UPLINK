import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/siteUrl";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Privacy Policy — WoWLFG | UPLINK",
  description:
    "WoWLFG Privacy Policy. Learn how we collect, use, and protect your data when you use our WoW boosting platform, community features, and Discord integration.",
  openGraph: {
    title: "Privacy Policy — WoWLFG",
    description: "WoWLFG Privacy Policy — how we handle your data, cookies, and Discord login information.",
    siteName: "WoWLFG — UPLINK",
  },
  alternates: { canonical: `${siteUrl}/privacy` },
};

export default function PrivacyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${siteUrl}/privacy#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Privacy Policy", item: `${siteUrl}/privacy` },
        ],
      },
      {
        "@type": "WebPage",
        "@id": `${siteUrl}/privacy`,
        url: `${siteUrl}/privacy`,
        name: "Privacy Policy",
        description: "WoWLFG Privacy Policy — data collection, cookies, Discord integration, and your rights.",
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
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-6 tracking-tight">Privacy <span className="text-[#00ffff]">Policy</span></h1>
        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-8">Last updated: June 2026</p>

        <div className="space-y-6 text-sm text-gray-400 leading-relaxed">
          <Section title="1. Information We Collect">
            <p>When you log in with Discord, we collect your Discord user ID, username, avatar, and email address. This information is used to create and manage your account on WoWLFG.</p>
            <p>We also store content you create — community posts, comments, reactions, boost requests, and news shares — along with timestamps and metadata.</p>
          </Section>

          <Section title="2. How We Use Your Data">
            <p>Your data is used exclusively to operate the WoWLFG platform: display your profile, show your posts and comments, enable community interactions, and maintain boost request records.</p>
            <p>We do not sell, rent, or share your personal data with third parties for marketing purposes.</p>
          </Section>

          <Section title="3. Cookies & Local Storage">
            <p>We use cookies and local storage to keep you logged in, remember your preferences, and maintain session state. These are essential for the platform to function.</p>
            <p>We do not use tracking cookies, analytics cookies, or third-party advertising cookies.</p>
          </Section>

          <Section title="4. Data Retention">
            <p>Your account data is retained until you request deletion. Community posts, comments, and reactions may remain visible after account deletion to preserve community context.</p>
            <p>You can request data deletion by contacting us through Discord or email.</p>
          </Section>

          <Section title="5. Third-Party Services">
            <p>WoWLFG uses Discord for authentication and Cloudflare for hosting and infrastructure. Each service has its own privacy policy governing data handling.</p>
            <p>We do not integrate any other third-party analytics, advertising, or tracking services.</p>
          </Section>

          <Section title="6. Your Rights">
            <p>You have the right to access, correct, or delete your personal data. You may also export your data upon request. Contact us through Discord or email to exercise these rights.</p>
          </Section>

          <Section title="7. Contact">
            <p>For privacy-related inquiries, contact us via Discord at <a href="https://discord.gg/r4m3Stk7XZ" className="text-[#00ffff] hover:underline">discord.gg/r4m3Stk7XZ</a> or email support@uplinklfg.com.</p>
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
