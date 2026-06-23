import Link from "next/link";

export default function NewsLanding() {
  return (
    <main className="min-h-screen bg-[#05050a] text-white">
      <div className="max-w-5xl mx-auto px-4 pt-28 pb-12">
        <h1 className="text-3xl font-black text-white mb-2">WoWLFG News</h1>
        <p className="text-sm text-gray-500 mb-8">Latest methods, routes, and updates for The War Within</p>

        <div className="flex items-center gap-2 mb-12">
          <Link href="/news/leveling" className="flex items-center gap-1.5 rounded-lg border border-[#00ffff]/25 bg-[#00ffff]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#00ffff] hover:bg-[#00ffff]/20 transition-all">
            <span>⚡</span> Leveling News
          </Link>
          <Link href="/news/dungeons" className="flex items-center gap-1.5 rounded-lg border border-[#ff007f]/25 bg-[#ff007f]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#ff007f] hover:bg-[#ff007f]/20 transition-all">
            <span>🏰</span> Dungeon News
          </Link>
        </div>

        <p className="text-center text-gray-500 text-xs font-black uppercase tracking-widest">Choose a section above to browse news.</p>
      </div>
    </main>
  );
}
