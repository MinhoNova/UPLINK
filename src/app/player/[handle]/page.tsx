import { getKV, initTables } from "@/lib/db";
import {
  resolveProfileBanner,
  resolveProfileImage,
  resolveProfileDisplayName,
  resolveNameColor,
  isAnimatedImageUrl,
  profileImgClass,
} from "@/lib/profileImage";
import { toNameStyle } from "@/components/GradientColorPicker";
import { classThumbUrl } from "@/lib/classThumb";
import { averagePlayerRating } from "@/lib/playerReviews";
import { aionClassRole } from "@/lib/aionClassMeta";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const normalized = handle.toLowerCase();

  await initTables();
  const users: any[] = (await getKV("registeredUsers")) || [];
  const user = users.find((u) => String(u.username).toLowerCase() === normalized);
  if (!user) return { title: "Player not found — Aion 2 LFG" };

  const name = resolveProfileDisplayName(user);
  const avatar = resolveProfileImage(user);
  return {
    title: `${name} — Player profile | Aion 2 LFG`,
    description: `${name}'s Aion 2 game profile — classes, item level, combat power and ratings on aion2lfg.com.`,
    openGraph: {
      title: `${name} — Aion 2 LFG`,
      description: `${name}'s Aion 2 game profile and ratings.`,
      ...(avatar ? { images: [{ url: avatar }] } : {}),
    },
  };
}

function Stars({ rating, className = "h-3.5 w-3.5" }: { rating: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${className} ${
            i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-slate-600"
          }`}
        />
      ))}
    </span>
  );
}

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const normalized = handle.toLowerCase();

  await initTables();
  const users: any[] = (await getKV("registeredUsers")) || [];
  const user = users.find((u) => String(u.username).toLowerCase() === normalized);
  if (!user) notFound();

  const uid = String(user.id);
  const banner = resolveProfileBanner(user);
  const avatar = resolveProfileImage(user, user?.name || handle);
  const name = resolveProfileDisplayName(user);
  const nameColor = resolveNameColor(user);

  const allChars: any[] = (await getKV("characters")) || [];
  const characters = (Array.isArray(allChars) ? allChars : []).filter(
    (c) => String(c.userId) === uid
  );

  const allReviews: any[] = (await getKV("playerReviews")) || [];
  const reviews = (Array.isArray(allReviews) ? allReviews : []).filter(
    (r) => String(r.targetId) === uid
  );
  const rating = averagePlayerRating(reviews);
  const ratingCount = reviews.length;

  return (
    <main className="min-h-screen bg-[#050814] text-slate-200 font-sans overflow-x-clip relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.08),transparent_55%)]" />

      {/* Header */}
      <div className="relative max-w-4xl mx-auto px-6 py-10">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a0f26]/70">
          <div className="relative aspect-[5/2] w-full bg-[#080811]">
            {banner && (
              <img
                src={banner}
                alt=""
                className={`absolute inset-0 w-full h-full ${profileImgClass(banner, "w-full h-full")}`}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f26] via-[#0a0f26]/20 to-transparent" />
          </div>
          <div className="px-6 -mt-12 relative z-10 flex flex-wrap items-end gap-4">
            <div className="h-24 w-24 rounded-full overflow-hidden border-[3px] border-[#0a0f26] shadow-[0_0_30px_rgba(0,229,255,0.25)] bg-black shrink-0">
              <img src={avatar} alt={name} className={profileImgClass(avatar, "w-full h-full")} />
            </div>
            <div className="pb-2 min-w-0 flex-1">
              <h1
                className="text-2xl font-black uppercase tracking-wide truncate"
                style={nameColor ? { ...toNameStyle(nameColor), textShadow: `0 0 18px ${nameColor.includes("#") ? nameColor : "#00ffff"}55` } : undefined}
              >
                {name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
                <span className="rounded-full border border-[#5865F2]/40 bg-[#5865F2]/10 px-2.5 py-0.5 text-[#8ea1ff]">Discord @{user.username}</span>
                {ratingCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-amber-300">
                    <Stars rating={rating} className="h-3 w-3" />
                    {rating.toFixed(1)} · {ratingCount} {ratingCount === 1 ? "review" : "reviews"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Game characters */}
        <section className="mt-8">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300 mb-3">
            Verified game characters
          </h2>
          {characters.length === 0 ? (
            <p className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-6 text-center text-xs font-bold text-slate-500">
              No verified characters yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {characters.map((c: any) => {
                const cls = String(c.aionClass || c.className || "");
                const role = cls ? aionClassRole(cls) : "";
                const charId = String(c.id || "").replace(/^game:/, "");
                const regionBase = c.region === "tw" ? "https://tw.ncsoft.com/aion2" : "https://aion2.plaync.com";
                const profHref =
                  charId && c.serverId
                    ? `/character?u=${encodeURIComponent(`${regionBase}/characters/${c.serverId}/${encodeURIComponent(charId)}`)}`
                    : "";
                return (
                  <div
                    key={String(c.id)}
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#0a0f26]/70 p-4 transition-all hover:border-cyan-500/40"
                  >
                    {c.portraitUrl ? (
                      <img
                        src={String(c.portraitUrl)}
                        alt=""
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                        className="h-16 w-16 rounded-xl object-cover border border-white/10 bg-black"
                      />
                    ) : (
                      <img src={classThumbUrl(cls)} alt="" className="h-16 w-16 object-contain" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-white">
                        {profHref ? (
                          <a href={profHref} className="hover:text-cyan-300 transition-colors">
                            {String(c.name || "Character")} <span className="text-[9px] font-black text-cyan-500/70">→</span>
                          </a>
                        ) : (
                          String(c.name || "Character")
                        )}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {cls ? (
                          <span className="flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-cyan-200">
                            {cls}
                            {role ? ` · ${role.toUpperCase()}` : ""}
                          </span>
                        ) : (
                          <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-slate-300">
                            {String(c.gameClassLabel || c.rawClassName || "Unknown class")}
                          </span>
                        )}
                        {c.itemLevel > 0 && (
                          <span className="rounded-full border border-violet-500/40 bg-violet-500/10 px-2 py-0.5 text-[8px] font-black tracking-widest text-violet-300">
                            ILVL {Number(c.itemLevel).toLocaleString()}
                          </span>
                        )}
                        {Number(c.cpAp) > 0 && (
                          <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[8px] font-black tracking-widest text-amber-300">
                            CP {Number(c.cpAp).toLocaleString()}
                          </span>
                        )}
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[8px] font-black tracking-widest text-emerald-300">
                          LVL {Number(c.level) || "?"}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest text-slate-500">
                        <span>{String(c.serverName || `KR-${c.serverId || ""}`)}</span>
                        {c.raceName ? <span>· {String(c.raceName)}</span> : null}
                        {c.verifiedAt ? <span className="text-emerald-500/80">· Verified</span> : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Reviews */}
        <section className="mt-8">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300 mb-3">
            Squad reviews
          </h2>
          {reviews.length === 0 ? (
            <p className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-6 text-center text-xs font-bold text-slate-500">
              No reviews yet — reviews unlock after their offers complete or fail.
            </p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r: any) => (
                <div key={String(r.id)} className="rounded-2xl border border-white/10 bg-[#0a0f26]/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full overflow-hidden border border-white/10 bg-black shrink-0">
                        {r.reviewerImage ? (
                          <img
                            src={String(r.reviewerImage)}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-[10px] font-black text-cyan-300 uppercase">
                            {String(r.reviewerName || "?").slice(0, 1)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-black text-white">{String(r.reviewerName || "Player")}</p>
                        <p className="text-[8px] font-bold uppercase tracking-widest text-slate-500">
                          After: {String(r.lobbyTitle || "Offer")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Stars rating={Number(r.rating) || 0} />
                      <a
                        href={`/manage/${String(r.lobbyId)}`}
                        className="text-[8px] font-black uppercase tracking-widest text-cyan-400 hover:text-cyan-200"
                      >
                        Offer thread →
                      </a>
                    </div>
                  </div>
                  {r.comment ? <p className="mt-3 text-xs text-slate-300">{String(r.comment)}</p> : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}