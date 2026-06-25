import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/siteUrl";
import { Mail, MessageSquare, Shield } from "lucide-react";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Contact Us — WoWLFG | UPLINK",
  description:
    "Get in touch with the WoWLFG team. Join our Discord community, report issues, or send us an email. We are here to help with WoW boosting, gold auctions, and platform support.",
  openGraph: {
    title: "Contact WoWLFG — UPLINK",
    description: "Contact the WoWLFG team via Discord or email. We respond quickly to support requests and feedback.",
    siteName: "WoWLFG — UPLINK",
  },
  alternates: { canonical: `${siteUrl}/contact` },
};

export default function ContactPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${siteUrl}/contact#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Contact Us", item: `${siteUrl}/contact` },
        ],
      },
      {
        "@type": "ContactPage",
        "@id": `${siteUrl}/contact`,
        url: `${siteUrl}/contact`,
        name: "Contact WoWLFG",
        description: "Contact the WoWLFG team for support, feedback, or inquiries about WoW boosting.",
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
        <h1 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tight">Contact <span className="text-[#00ffff]">Us</span></h1>
        <p className="text-sm text-gray-400 leading-relaxed mb-10">
          Have a question, need support, or want to give feedback? We are here to help.
        </p>

        <div className="space-y-4 mb-12">
          {[
            { icon: MessageSquare, title: "Discord", desc: "Join our community Discord for fastest support, discussion, and updates.", link: "https://discord.gg/r4m3Stk7XZ", linkText: "Join Discord →" },
            { icon: Mail, title: "Email", desc: "For business inquiries or formal requests, send us an email.", link: "mailto:support@uplinklfg.com", linkText: "support@uplinklfg.com" },
            { icon: Shield, title: "Report an Issue", desc: "Found a bug or want to report a user? Contact us and we will look into it promptly.", link: "/community", linkText: "Report via Community →" },
          ].map((m) => (
            <div key={m.title} className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-6 flex items-start gap-4">
              <m.icon className="w-6 h-6 text-[#00ffff] mt-1 shrink-0" />
              <div>
                <h2 className="text-sm font-black text-white mb-1">{m.title}</h2>
                <p className="text-xs text-gray-500 mb-2">{m.desc}</p>
                <a href={m.link} className="text-[10px] font-black uppercase tracking-widest text-[#ff007f] hover:underline">{m.linkText}</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
