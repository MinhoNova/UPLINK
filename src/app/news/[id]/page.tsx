import { getDb } from "@/db";
import { news, posts, reactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getKV, initTables } from "@/lib/db";
import { resolvePublicAuthorFields } from "@/lib/profileImage";

const REACTION_ICONS: Record<string, string> = {
  LOL: "😂", Love: "❤️", Sad: "😢", Wipe: "💀", Carry: "🏆",
};

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

  // Fetch sourcePost if exists
  let sourcePost: any = null;
  if (item.sourcePostId) {
    const dbPost = await db.select().from(posts).where(eq(posts.id, item.sourcePostId)).limit(1).then((r) => r[0]) as any;
    if (dbPost) {
      await initTables();
      const registeredUsers = ((await getKV("registeredUsers")) || []) as any[];
      const author = registeredUsers.find((u: any) => String(u.id) === String(dbPost.userId));
      const authorFields = resolvePublicAuthorFields(author, { name: dbPost.userName, image: dbPost.userImage });

      const postReactions = await db.select().from(reactions).where(eq(reactions.postId, dbPost.id));
      const reactionMap: Record<string, { type: string; count: number }> = {};
      for (const r of postReactions as any[]) {
        if (!reactionMap[r.type]) reactionMap[r.type] = { type: r.type, count: 0 };
        reactionMap[r.type].count++;
      }

      sourcePost = {
        ...dbPost,
        userName: authorFields.userName,
        userImage: authorFields.userImage,
        reactions: Object.values(reactionMap),
        tags: JSON.parse(dbPost.tags || "[]"),
      };
    }
  }

  return (
    <main className="min-h-screen bg-[#05050a] text-white">
      <div className="max-w-4xl mx-auto px-4 pt-28 pb-12">
        <div className="flex items-center gap-2 mb-8">
          <Link href="/news/leveling" className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition-all ${item.section === "leveling" ? "border-[#00ffff]/25 bg-[#00ffff]/10 text-[#00ffff]" : "border-white/10 text-white/40 hover:text-[#00ffff] hover:border-[#00ffff]/30 hover:bg-[#00ffff]/10"}`}>
            <span>⚡</span> Leveling News
          </Link>
          <Link href="/news/dungeons" className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition-all ${item.section === "dungeons" ? "border-[#ff007f]/25 bg-[#ff007f]/10 text-[#ff007f]" : "border-white/10 text-white/40 hover:text-[#ff007f] hover:border-[#ff007f]/30 hover:bg-[#ff007f]/10"}`}>
            <span>🏰</span> Dungeon News
          </Link>
        </div>

        {sourcePost ? (
          <div className={`border-2 border-dashed ${item.section === "leveling" ? "border-[#00ffff]/20" : "border-[#ff007f]/20"} rounded-[2.5rem] p-5 md:p-6 shadow-2xl`}>
            {/* Share badge */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                <span>🔁</span> Shared from Community
              </div>
              <div className="text-[10px] text-gray-500 font-black">
                Shared by: <span className="text-white/80">{item.authorName}</span>
              </div>
            </div>

            {/* Original post card */}
            <div className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-5 shadow-inner relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#ff007f]/5 blur-3xl rounded-full translate-x-6 -translate-y-6" />
              <div className="flex items-center gap-3 mb-3 relative z-10">
                <img src={sourcePost.userImage || ""} alt="" className="w-9 h-9 rounded-full border-2 border-white/10 bg-black" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-black text-white/90 truncate block">{sourcePost.userName}</span>
                  <span className="text-[9px] text-gray-500 font-black">
                    {new Date(sourcePost.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>

              {sourcePost.title && (
                <h2 className="text-base font-black text-white mb-2 relative z-10">{sourcePost.title}</h2>
              )}
              <p className="text-sm text-white/70 mb-3 whitespace-pre-wrap leading-relaxed relative z-10">{sourcePost.content}</p>

              {sourcePost.image && (
                <div className="mb-3 rounded-2xl overflow-hidden border border-white/5 relative z-10">
                  {sourcePost.image.match(/\.(mp4|webm|mov)(\?|$)/i) ? (
                    <video src={sourcePost.image} className="w-full max-h-96 bg-black/40" controls preload="metadata" />
                  ) : (
                    <img src={sourcePost.image} alt="" className="w-full max-h-96 object-contain bg-black/40" />
                  )}
                </div>
              )}

              {sourcePost.tags?.length > 0 && (
                <div className="flex items-center gap-1.5 mb-3 flex-wrap relative z-10">
                  {sourcePost.tags.map((tag: string) => (
                    <span key={tag} className="text-[8px] font-black bg-white/5 text-gray-400 px-2 py-0.5 rounded-full uppercase tracking-wider">#{tag}</span>
                  ))}
                </div>
              )}

              {/* Static reactions display */}
              {sourcePost.reactions?.length > 0 && (
                <div className="flex items-center gap-2 pt-3 border-t border-white/5 relative z-10">
                  {sourcePost.reactions.map((r: any) => (
                    <span key={r.type} className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white/[0.04] border border-white/5 text-sm">
                      {REACTION_ICONS[r.type] || r.type} <span className="text-[10px] font-black text-gray-400">{r.count}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* View Main Post */}
            <div className="mt-4 flex justify-end">
              <Link
                href={`/community/post/${sourcePost.id}`}
                className={`flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white hover:bg-white/10 transition-all ${item.section === "leveling" ? "hover:border-[#00ffff]/40" : "hover:border-[#ff007f]/40"}`}
              >
                View Main Post 🔗
              </Link>
            </div>
          </div>
        ) : (
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
        )}
      </div>
    </main>
  );
}
