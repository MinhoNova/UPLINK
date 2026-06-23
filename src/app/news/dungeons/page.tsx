import { getDb } from "@/db";
import { news } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dungeon News — WoWLFG",
  description: "Mythic+ routes, dungeon changes, new affixes, boss strategies, and seasonal updates for WoW The War Within.",
  openGraph: { title: "Dungeon News — WoWLFG", description: "Mythic+ routes, dungeon changes, new affixes, boss strategies, and seasonal updates for WoW The War Within." },
};

export default async function DungeonsPage() {
  const db = await getDb();
  const items = await db
    .select()
    .from(news)
    .where(eq(news.section, "dungeons"))
    .orderBy(desc(news.createdAt))
    .limit(50);

  return (
    <main className="min-h-screen bg-[#05050a] text-white">
      <nav className="sticky top-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center gap-6">
          <Link href="/news" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition">← News</Link>
          <span className="text-sm font-black text-white tracking-wider">Dungeon News</span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-black text-white mb-8">🏰 Dungeon News</h1>

        <div className="space-y-4">
          {items.map((item) => (
            <article key={item.id} className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-6 hover:border-white/10 transition">
              <Link href={`/news/${item.id}`} className="block">
                <h2 className="text-lg font-black text-white mb-2 hover:text-[#ff007f] transition">{item.title}</h2>
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
