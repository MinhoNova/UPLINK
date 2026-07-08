"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Swords, Shield, ScrollText, Radio, CalendarDays, Trophy, Users, Beaker } from "lucide-react";

const SIDEBAR_LINKS: { href: string; label: string; icon: typeof Swords; color: string; hoverBg: string }[] = [
  { href: "/wow/tier-list", label: "Tier List", icon: Swords, color: "#ff007f", hoverBg: "rgba(255,0,127,0.1)" },
  { href: "/wow/s2", label: "S2 Tier List", icon: Swords, color: "#d946ef", hoverBg: "rgba(217,70,239,0.1)" },
  { href: "/wow/dungeons", label: "Dungeons", icon: Shield, color: "#00ffff", hoverBg: "rgba(0,255,255,0.1)" },
  { href: "/wow/talents", label: "Talents", icon: ScrollText, color: "#aaff00", hoverBg: "rgba(170,255,0,0.1)" },
  { href: "/wow/affixes", label: "Affixes", icon: CalendarDays, color: "#9b59b6", hoverBg: "rgba(155,89,182,0.1)" },
  { href: "/wow/leaderboard", label: "Leaderboard", icon: Trophy, color: "#ff8c00", hoverBg: "rgba(255,140,0,0.1)" },
  { href: "/wow/pipeline", label: "The Pipeline", icon: Radio, color: "#2ecc71", hoverBg: "rgba(46,204,113,0.1)" },
];

export default function WowLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#05050a] text-white flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-white/5 bg-black/20 p-4 gap-0.5 sticky top-16 lg:top-24 h-[calc(100vh-64px)] lg:h-[calc(100vh-96px)]">
        <Link href="/wow" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/5 transition mb-2 group">
          <div className="w-8 h-8 shrink-0 overflow-hidden rounded-lg flex items-center justify-center bg-black/30 border border-white/10 group-hover:border-[#00ffff]/40 transition-all" style={{ boxShadow: '0 0 12px rgba(0,255,255,0.15)' }}>
            <svg viewBox="0 0 100 100" className="w-6 h-6">
              <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill="none" stroke="#00ffff" strokeWidth="4" strokeLinejoin="round" />
              <circle cx="50" cy="50" r="18" fill="none" stroke="#ff007f" strokeWidth="4" />
              <line x1="50" y1="5" x2="50" y2="95" stroke="#00ffff" strokeWidth="2" opacity="0.4" />
            </svg>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500">UPLINK</span>
            <span className="text-base font-black">WoW <span className="text-[#00ffff]">Tools</span></span>
          </div>
        </Link>
        {SIDEBAR_LINKS.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-200 overflow-hidden"
              style={active ? {
                background: `linear-gradient(135deg, ${link.hoverBg} 0%, rgba(255,255,255,0.02) 100%)`,
                color: link.color,
                border: `1px solid ${link.color}30`,
                boxShadow: `0 0 20px ${link.color}15`,
              } : {
                color: 'rgba(255,255,255,0.35)',
                border: '1px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = link.hoverBg;
                  e.currentTarget.style.color = link.color;
                  e.currentTarget.style.borderColor = `${link.color}20`;
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = '';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.35)';
                  e.currentTarget.style.borderColor = 'transparent';
                }
              }}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{link.label}</span>
              {active && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-4 rounded-full" style={{ backgroundColor: link.color, boxShadow: `0 0 6px ${link.color}` }} />
              )}
            </Link>
          );
        })}

        <div className="mt-2 pt-3 border-t border-white/5 space-y-0.5">
          <Link
            href="/wow/ptr"
            className="group flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-200"
            style={pathname === '/wow/ptr' ? {
              background: 'rgba(200,0,255,0.1)',
              color: '#c800ff',
              border: '1px solid rgba(200,0,255,0.3)',
              boxShadow: '0 0 15px rgba(200,0,255,0.1)',
            } : {
              color: 'rgba(255,255,255,0.25)',
              border: '1px solid transparent',
            }}
            onMouseEnter={(e) => { if (pathname !== '/wow/ptr') { e.currentTarget.style.color = '#c800ff'; e.currentTarget.style.background = 'rgba(200,0,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(200,0,255,0.2)'; } }}
            onMouseLeave={(e) => { if (pathname !== '/wow/ptr') { e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; e.currentTarget.style.background = ''; e.currentTarget.style.borderColor = 'transparent'; } }}
          >
            <Beaker className="w-3.5 h-3.5 shrink-0" />
            <span>PTR S2</span>
          </Link>
          <Link href="/wow" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-200 text-gray-500 hover:text-white hover:bg-white/5">
            <Users className="w-4 h-4 shrink-0" /> All Classes
          </Link>
        </div>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
