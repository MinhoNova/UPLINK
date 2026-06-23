import { getDb } from "@/db";
import { news } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leveling News — WoWLFG",
  description: "AFK leveling methods, XP farms, 80-90 boosts, rotations, and leveling updates for WoW The War Within.",
  openGraph: { title: "Leveling News — WoWLFG", description: "AFK leveling methods, XP farms, 80-90 boosts, rotations, and leveling updates for WoW The War Within." },
};

export default async function LevelingPage() {
  const db = await getDb();
  const items = await db
    .select()
    .from(news)
    .where(eq(news.section, "leveling"))
    .orderBy(desc(news.createdAt))
    .limit(50);

  return (
    <main className="min-h-screen bg-[#05050a] text-white">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center gap-2 mb-8">
          <Link href="/news/leveling" className="flex items-center gap-1.5 rounded-lg border border-[#00ffff]/25 bg-[#00ffff]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#00ffff] transition-all">
            <span>⚡</span> Leveling News
          </Link>
          <Link href="/news/dungeons" className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/40 hover:text-[#ff007f] hover:border-[#ff007f]/30 hover:bg-[#ff007f]/10 transition-all">
            <span>🏰</span> Dungeon News
          </Link>
        </div>

        <div className="space-y-4">
          {items.map((item) => (
            <article key={item.id} className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-6 hover:border-white/10 transition">
              <Link href={`/news/${item.id}`} className="block">
                <h2 className="text-lg font-black text-white mb-2 hover:text-[#00ffff] transition">{item.title}</h2>
              </Link>
              <p className="text-sm text-white/60 mb-3 line-clamp-3">{item.content}</p>
              {item.image && (
                <div className="rounded-xl overflow-hidden border border-white/5 mb-3">
                  {item.image.match(/\.(mp4|webm|mov)(\?|$)/i) ? (
                    <video src={item.image} className="w-full max-h-60 bg-black/40" controls preload="metadata" />
                  ) : (
                    <img src={item.image} alt="" className="w-full max-h-60 object-contain bg-black/40" loading="lazy" />
                  )}
                </div>
              )}
              {item.tags && JSON.parse(item.tags).length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(JSON.parse(item.tags) as string[]).map((tag) => (
                    <span key={tag} className="text-[8px] font-black bg-white/5 text-gray-400 px-2 py-0.5 rounded-full uppercase tracking-wider">#{tag}</span>
                  ))}
                </div>
              )}
            </article>
          ))}
          {items.length === 0 && (
            <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-[2rem]">
              <p className="text-gray-500 text-xs font-black uppercase tracking-widest">No news yet. Check back soon.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
