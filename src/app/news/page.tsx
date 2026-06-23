import Link from "next/link";

export default function NewsLanding() {
  return (
    <main className="min-h-screen bg-[#05050a] text-white">
      <nav className="sticky top-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center gap-6">
          <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition">Home</Link>
          <span className="text-sm font-black text-white tracking-wider">WoWLFG News</span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-black text-white mb-2">WoWLFG News</h1>
        <p className="text-sm text-gray-500 mb-10">Latest methods, routes, and updates for The War Within</p>

        <div className="grid md:grid-cols-2 gap-6">
          <a href="/news/leveling" className="group block bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-8 hover:border-[#00ffff]/30 transition-all">
            <div className="text-4xl mb-4">⚡</div>
            <h2 className="text-xl font-black text-white mb-2 group-hover:text-[#00ffff] transition">Leveling</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              AFK methods, XP farms, 80-90 boosts, new patch rotations, and everything leveling-related.
            </p>
            <div className="mt-4 text-[10px] font-black uppercase tracking-widest text-[#00ffff]">Browse Leveling News →</div>
          </a>

          <a href="/news/dungeons" className="group block bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-8 hover:border-[#ff007f]/30 transition-all">
            <div className="text-4xl mb-4">🏰</div>
            <h2 className="text-xl font-black text-white mb-2 group-hover:text-[#ff007f] transition">Dungeons</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Mythic+ routes, dungeon changes, new affixes, boss strategies, and seasonal updates.
            </p>
            <div className="mt-4 text-[10px] font-black uppercase tracking-widest text-[#ff007f]">Browse Dungeon News →</div>
          </a>
        </div>
      </div>
    </main>
  );
}
