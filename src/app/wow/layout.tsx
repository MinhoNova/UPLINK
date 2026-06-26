import Link from "next/link";
import { Swords, Shield, ScrollText, ArrowLeft } from "lucide-react";

const SIDEBAR_LINKS = [
  { href: "/wow/tier-list", label: "Tier List", icon: Swords },
  { href: "/wow/dungeons", label: "Dungeons", icon: Shield },
  { href: "/wow/talents", label: "Talents", icon: ScrollText },
];

export default function WowLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#05050a] text-white flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-white/5 bg-black/20 p-4 gap-1 sticky top-0 h-screen">
        <Link href="/wow" className="flex items-center gap-2 px-3 py-3 rounded-xl hover:bg-white/5 transition mb-4">
          <span className="text-lg font-black">
            WoW <span className="text-[#00ffff]">Tools</span>
          </span>
        </Link>
        {SIDEBAR_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/5 transition"
            >
              <Icon className="w-4 h-4" /> {link.label}
            </Link>
          );
        })}
        <div className="mt-auto pt-4 border-t border-white/5">
          <Link href="/" className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 transition">
            <ArrowLeft className="w-3.5 h-3.5" /> Home
          </Link>
        </div>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
