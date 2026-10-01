"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { CheckCircle2, Clock3, History, ImageIcon, MessageCircle, ShieldCheck, Users } from "lucide-react";
import { resolveLobbyBannerBg } from "@/lib/vfxAssets";

function missionTitle(lobby: any) {
  if (lobby.category === "leveling") return `Leveling ${lobby.startLevel || 1}–${lobby.endLevel || 80}`;
  if (lobby.selectedDungeons && typeof lobby.selectedDungeons === "object") {
    const names = Object.entries(lobby.selectedDungeons)
      .filter(([, count]) => Number(count) > 0)
      .map(([name, count]) => `${count}× ${name}`);
    if (names.length) return names.join(" · ");
  }
  return lobby.title || lobby.serviceName || `${lobby.runsCount || 1}× Dungeon Run`;
}

export default function HistoryPage() {
  const { status } = useSession();
  const [lobbies, setLobbies] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [proof, setProof] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (status !== "authenticated") {
      if (status !== "loading") setLoading(false);
      return;
    }
    fetch("/api/history", { credentials: "include" })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: any) => {
        setLobbies(Array.isArray(data.lobbies) ? data.lobbies : []);
        setUsers(Array.isArray(data.registeredUsers) ? data.registeredUsers : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status]);

  const completedMissions = useMemo(
    () => [...lobbies].sort((a, b) => Number(b.completedAt || 0) - Number(a.completedAt || 0)),
    [lobbies]
  );
  const totalPages = Math.max(1, Math.ceil(completedMissions.length / pageSize));
  const pageMissions = completedMissions.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  if (status === "unauthenticated") {
    return <main className="min-h-screen bg-[#050816] px-6 pt-36 text-center text-sm font-bold text-slate-400">Sign in to view your history.</main>;
  }

  return (
    <main className="min-h-screen bg-[#050816] px-4 pb-20 pt-28 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300"><History className="h-4 w-4" /> Mission archive</p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">History</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">Completed missions with a verified payment proof. Only the offer owner and players who joined the thread can view them.</p>
          </div>
          {!loading && <span className="shrink-0 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-cyan-200">{completedMissions.length} / 100 paid</span>}
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center text-sm font-bold text-slate-500">Loading mission history…</div>
        ) : completedMissions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
            <History className="mx-auto h-10 w-10 text-slate-600" />
            <h2 className="mt-4 text-lg font-black text-white">No paid missions yet</h2>
            <p className="mt-2 text-sm text-slate-500">A mission appears here after it is completed and its payment proof is confirmed.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {pageMissions.map((lobby) => {
              const owner = users.find((user) => String(user.id) === String(lobby.ownerId));
              const banner = owner ? resolveLobbyBannerBg(lobby, owner, owner.activeVfx) : null;
              const completedAt = Number(lobby.completedAt);
              const pic = String(owner?.customAvatar || owner?.profileGif || owner?.avatar || lobby.ownerImage || "");
              const ownerLabel = String(owner?.displayName || owner?.name || owner?.username || lobby.ownerDiscordName || "Commander");
              const playerCount = (lobby.accepted || []).length + 1;
              const goldPaid = Number(lobby.totalGold || (lobby.goldPerRun || 0) * (lobby.runsCount || 1));
              return (
                <article key={lobby.id} className="group relative flex min-h-[132px] w-full items-center gap-3 overflow-hidden rounded-2xl border border-emerald-500/20 bg-white/[0.04] py-3 pl-3 pr-3 shadow-[0_4px_24px_rgba(16,185,129,0.06)] backdrop-blur-2xl transition-all hover:border-emerald-400/40 hover:shadow-[0_0_32px_rgba(16,185,129,0.14)]">
                  {/* Banner bleeding in from the right, same treatment as a lobby offer card. */}
                  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                    <div className="absolute inset-0 bg-[#070b1a]" />
                    <div className="absolute bottom-0 right-0 top-0 w-[900px] max-w-[62%]">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-transparent to-emerald-500/20" />
                      {banner && (
                        <img
                          src={banner}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover opacity-60 transition duration-500 group-hover:opacity-75"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-[#070b1a] via-[#070b1a]/70 to-transparent" />
                    </div>
                  </div>

                  {/* Owner avatar on the left, exactly like the lobby card. */}
                  <div className="relative z-10 flex flex-shrink-0 items-center gap-3">
                    <div className="relative">
                      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-emerald-400/40 bg-[#050814]/80 shadow-[0_0_18px_rgba(16,185,129,0.25)] transition-colors group-hover:border-emerald-300/70 sm:h-16 sm:w-16">
                        {pic ? (
                          <img src={pic} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                        ) : (
                          <Users className="h-6 w-6 text-emerald-400/70" />
                        )}
                      </div>
                      <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#0a0f26] bg-emerald-500" />
                    </div>

                    <div className="min-w-0 max-w-[260px]">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-emerald-200">
                          <CheckCircle2 className="h-3 w-3" /> Completed · paid
                        </span>
                        {lobby.serverRegion ? (
                          <span className="shrink-0 text-[9px] font-black uppercase tracking-widest text-slate-500">{String(lobby.serverRegion).toUpperCase()}</span>
                        ) : null}
                      </div>
                      <h2 className="mt-1.5 truncate text-sm font-black uppercase tracking-widest text-white">{missionTitle(lobby)}</h2>
                      <p className="mt-0.5 truncate text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">{lobby.category || "Dungeon"}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-400">
                        <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-cyan-300" /> {playerCount} players</span>
                        <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-amber-300" /> {goldPaid}K paid</span>
                        {completedAt > 0 ? (
                          <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-slate-500" /> {new Date(completedAt).toLocaleDateString()}</span>
                        ) : null}
                      </div>
                      <p className="mt-1 truncate text-[9px] font-black uppercase tracking-widest text-slate-500">{ownerLabel}</p>
                    </div>
                  </div>

                  {/* Same two buttons the card had before. */}
                  <div className="relative z-10 ml-auto flex min-w-[168px] flex-shrink-0 flex-col gap-1.5 sm:pl-2">
                    <button type="button" onClick={() => { window.location.href = `/manage/${lobby.id}`; }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-3.5 py-2.5 text-[10px] font-black uppercase tracking-widest text-[#061019] transition hover:bg-cyan-300">
                      <MessageCircle className="h-3.5 w-3.5" /> View thread
                    </button>
                    <button type="button" onClick={() => setProof(String(lobby.paymentProof))} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md transition hover:border-emerald-300/50 hover:bg-white/10">
                      <ImageIcon className="h-3.5 w-3.5" /> Payment proof
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {completedMissions.length > pageSize && (
          <nav className="mt-8 flex items-center justify-center gap-3" aria-label="History pages">
            <button type="button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-xl border border-white/15 bg-white/[0.03] px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-200 transition hover:border-cyan-300/50 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-35">Previous</button>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Page {page} of {totalPages}</span>
            <button type="button" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="rounded-xl border border-white/15 bg-white/[0.03] px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-200 transition hover:border-cyan-300/50 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-35">Next</button>
          </nav>
        )}
      </div>

      {proof && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setProof(null)}><div className="max-h-[90vh] max-w-3xl overflow-auto rounded-2xl border border-white/15 bg-[#0b1026] p-3" onClick={(event) => event.stopPropagation()}><img src={proof} alt="Verified payment proof" className="h-auto w-full rounded-xl" /><button type="button" onClick={() => setProof(null)} className="mt-3 w-full rounded-xl border border-white/10 py-2 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-white/10">Close</button></div></div>}
    </main>
  );
}
