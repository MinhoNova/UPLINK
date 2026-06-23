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
  const sectionColor = item.section === "leveling" ? "text-[#00ffff]" : "text-[#ff007f]";

  return (
    <main className="min-h-screen bg-[#05050a] text-white">
      <nav className="sticky top-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 h-12 flex items-center gap-6">
          <Link href={`/news/${item.section}`} className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition">← {sectionLabel} News</Link>
          <span className={`text-[10px] font-black uppercase tracking-widest ${sectionColor}`}>{sectionLabel}</span>
        </div>
      </nav>

      <article className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-8 shadow-xl">
          {/* Section badge */}
          <div className={`inline-block px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${sectionColor} bg-white/5 mb-4`}>
            {sectionLabel}
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-3">{item.title}</h1>

          {/* Meta */}
          <div className="flex items-center gap-4 mb-6 text-[10px] text-gray-500 font-black uppercase tracking-wider">
            <span>By {item.authorName}</span>
            <span>{new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>

          {/* Content */}
          <p className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed mb-6">{item.content}</p>

          {/* Media */}
          {item.image && (
            <div className="rounded-2xl overflow-hidden border border-white/5 mb-6">
              {isVideo ? (
                <video src={item.image} className="w-full max-h-[70vh] bg-black/40" controls preload="metadata" />
              ) : (
                <img src={item.image} alt="" className="w-full max-h-[70vh] object-contain bg-black/40" loading="lazy" />
              )}
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {tags.map((tag) => (
                <span key={tag} className="text-[8px] font-black bg-white/5 text-gray-400 px-2 py-0.5 rounded-full uppercase tracking-wider">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </article>
    </main>
  );
}
