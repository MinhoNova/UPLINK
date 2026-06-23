import { getDb } from "@/db";
import { news } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const db = await getDb();
  const item = await db.select().from(news).where(eq(news.id, Number(id))).limit(1).then((r) => r[0]);
  if (!item) return { title: "Not found" };

  const tags = JSON.parse(item.tags || "[]") as string[];
  const tagStr = tags.map((t) => `#${t}`).join(" ");

  return {
    title: `${item.title} — WoWLFG News`,
    description: `${item.title} ${tagStr} ${item.content.slice(0, 160)}`.trim().slice(0, 200),
    openGraph: {
      title: `${item.title} — WoWLFG News`,
      description: item.content.slice(0, 200),
      ...(item.image ? { images: [{ url: item.image }] } : {}),
      type: "article",
    },
  };
}

export default async function NewsDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  const item = await db.select().from(news).where(eq(news.id, Number(id))).limit(1).then((r) => r[0]);
  if (!item) notFound();

  const tags = JSON.parse(item.tags || "[]") as string[];
  const isVideo = item.image?.match(/\.(mp4|webm|mov)(\?|$)/i);
  const sectionLabel = item.section === "leveling" ? "Leveling" : "Dungeons";

  return (
    <main className="min-h-screen bg-[#05050a] text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center gap-2 mb-8">
          <Link href="/news/leveling" className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition-all ${item.section === "leveling" ? "border-[#00ffff]/25 bg-[#00ffff]/10 text-[#00ffff]" : "border-white/10 text-white/40 hover:text-[#00ffff] hover:border-[#00ffff]/30 hover:bg-[#00ffff]/10"}`}>
            <span>⚡</span> Leveling News
          </Link>
          <Link href="/news/dungeons" className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition-all ${item.section === "dungeons" ? "border-[#ff007f]/25 bg-[#ff007f]/10 text-[#ff007f]" : "border-white/10 text-white/40 hover:text-[#ff007f] hover:border-[#ff007f]/30 hover:bg-[#ff007f]/10"}`}>
            <span>🏰</span> Dungeon News
          </Link>
        </div>

        <article>
          <div className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-8 shadow-xl">
            <div className={`inline-block px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${item.section === "leveling" ? "text-[#00ffff]" : "text-[#ff007f]"} bg-white/5 mb-4`}>
              {sectionLabel}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white mb-3">{item.title}</h1>

            <div className="flex items-center gap-4 mb-6 text-[10px] text-gray-500 font-black uppercase tracking-wider">
              <span>By {item.authorName}</span>
              <span>{new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>

            <p className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed mb-6">{item.content}</p>

            {item.image && (
              <div className="rounded-2xl overflow-hidden border border-white/5 mb-6">
                {isVideo ? (
                  <video src={item.image} className="w-full max-h-[70vh] bg-black/40" controls preload="metadata" />
                ) : (
                  <img src={item.image} alt="" className="w-full max-h-[70vh] object-contain bg-black/40" loading="lazy" />
                )}
              </div>
            )}

            {tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {tags.map((tag) => (
                  <span key={tag} className="text-[8px] font-black bg-white/5 text-gray-400 px-2 py-0.5 rounded-full uppercase tracking-wider">#{tag}</span>
                ))}
              </div>
            )}
          </div>
        </article>
      </div>
    </main>
  );
}
