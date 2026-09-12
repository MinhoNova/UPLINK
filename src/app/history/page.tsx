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

  useEffect(() => {
    if (status !== "authenticated") {
      if (status !== "loading") setLoading(false);
      return;
    }
    fetch("/api/history", { credentials: "include" })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => {
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
          {!loading && <span className="shrink-0 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-cyan-200">{completedMissions.length} paid</span>}
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
          <div className="grid gap-5 md:grid-cols-2">
            {completedMissions.map((lobby) => {
              const owner = users.find((user) => String(user.id) === String(lobby.ownerId));
              const banner = owner ? resolveLobbyBannerBg(lobby, owner, owner.activeVfx) : null;
              const completedAt = Number(lobby.completedAt);
              return (
                <article key={lobby.id} className="group relative overflow-hidden rounded-3xl border border-emerald-400/20 bg-[#0b1026] shadow-[0_16px_50px_rgba(0,0,0,0.3)]">
                  {banner && <img src={banner} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45 transition duration-500 group-hover:scale-105 group-hover:opacity-60" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070b1d] via-[#070b1d]/75 to-[#070b1d]/25" />
                  <div className="relative flex min-h-64 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-200"><CheckCircle2 className="h-3.5 w-3.5" /> Completed · paid</span>
                      {completedAt > 0 && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-300"><Clock3 className="h-3.5 w-3.5" /> {new Date(completedAt).toLocaleDateString()}</span>}
                    </div>
                    <div className="mt-auto">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">{lobby.category || "Dungeon"}</p>
                      <h2 className="mt-1 text-xl font-black text-white">{missionTitle(lobby)}</h2>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-300">
                        <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-cyan-300" /> {(lobby.accepted || []).length + 1} players</span>
                        <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-amber-300" /> {lobby.totalGold || (lobby.goldPerRun || 0) * (lobby.runsCount || 1)}K paid</span>
                      </div>
                      <div className="mt-5 flex flex-wrap gap-2">
                        <button type="button" onClick={() => { window.location.href = `/manage/${lobby.id}`; }} className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-3.5 py-2.5 text-[10px] font-black uppercase tracking-widest text-[#061019] transition hover:bg-cyan-300"><MessageCircle className="h-3.5 w-3.5" /> View thread</button>
                        <button type="button" onClick={() => setProof(String(lobby.paymentProof))} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/25 px-3.5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white transition hover:border-emerald-300/50 hover:bg-white/10"><ImageIcon className="h-3.5 w-3.5" /> Payment proof</button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {proof && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setProof(null)}><div className="max-h-[90vh] max-w-3xl overflow-auto rounded-2xl border border-white/15 bg-[#0b1026] p-3" onClick={(event) => event.stopPropagation()}><img src={proof} alt="Verified payment proof" className="h-auto w-full rounded-xl" /><button type="button" onClick={() => setProof(null)} className="mt-3 w-full rounded-xl border border-white/10 py-2 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-white/10">Close</button></div></div>}
    </main>
  );
}
