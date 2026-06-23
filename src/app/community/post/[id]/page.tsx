import { getDb } from "@/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const db = await getDb();
  const post = await db.select().from(posts).where(eq(posts.id, Number(id))).limit(1).then((r) => r[0]);
  if (!post) return { title: "Post not found" };

  const title = post.title || post.content.slice(0, 60);
  const tags = JSON.parse(post.tags || "[]") as string[];
  const tagStr = tags.map((t) => `#${t}`).join(" ");

  return {
    title: `${title} — WoWLFG Community`,
    description: `${title} ${tagStr} ${post.content.slice(0, 120)}`.trim(),
    openGraph: {
      title: `${title} — WoWLFG`,
      description: post.content.slice(0, 200),
      ...(post.image ? { images: [{ url: post.image }] } : {}),
      type: "article",
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  const post = await db.select().from(posts).where(eq(posts.id, Number(id))).limit(1).then((r) => r[0]);
  if (!post) notFound();

  const tags = JSON.parse(post.tags || "[]") as string[];
  const isVideo = post.image?.match(/\.(mp4|webm|mov)(\?|$)/i);

  return (
    <main className="min-h-screen bg-[#05050a] text-white">
      {/* Navigation bar */}
      <nav className="sticky top-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 h-12 flex items-center gap-3">
          <a href="/community" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition">
            ← Community
          </a>
          {tags.map((t) => (
            <a key={t} href={`/community?tag=${t}`} className="text-[9px] font-black uppercase text-gray-500 hover:text-[#00ffff] transition">
              #{t}
            </a>
          ))}
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-6 shadow-xl">
          {/* Author */}
          <div className="flex items-center gap-3 mb-4">
            <img src={post.userImage || ""} alt="" className="w-10 h-10 rounded-full bg-black/40" />
            <div>
              <p className="text-sm font-black text-white/90">{post.userName}</p>
              <p className="text-[9px] text-gray-500 font-black">
                {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>

          {/* Title */}
          {post.title && (
            <h1 className="text-xl font-black text-white mb-3">{post.title}</h1>
          )}

          {/* Content */}
          <p className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed mb-4">{post.content}</p>

          {/* Media */}
          {post.image && (
            <div className="rounded-2xl overflow-hidden border border-white/5 mb-4">
              {isVideo ? (
                <video src={post.image} className="w-full max-h-[70vh] bg-black/40" controls preload="metadata" />
              ) : (
                <img src={post.image} alt="" className="w-full max-h-[70vh] object-contain bg-black/40" loading="lazy" />
              )}
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {tags.map((tag) => (
                <a key={tag} href={`/community?tag=${tag}`} className="text-[8px] font-black bg-white/5 text-gray-400 px-2 py-0.5 rounded-full uppercase tracking-wider hover:text-[#00ffff] hover:bg-[#00ffff]/10 transition">
                  #{tag}
                </a>
              ))}
            </div>
          )}
        </div>
      </article>
    </main>
  );
}
