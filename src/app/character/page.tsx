"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Link2, Loader2, ShieldCheck, Sparkles, Swords, Trophy, Wand2 } from "lucide-react";
import { portraitProxyPath } from "@/lib/aion2ClassIds";
import { aionClassRole } from "@/lib/aionClassMeta";
import type { CharacterDetails, CharacterItem } from "@/lib/aion2GameApi";

type State = "idle" | "loading" | "ready" | "error";

function gradeColor(grade: string): string {
  const g = String(grade || "").toLowerCase();
  if (g.includes("myth") || g.includes("신화") || g.includes("神話")) return "#f43f5e";
  if (g.includes("legend") || g.includes("전설") || g.includes("傳說")) return "#f59e0b";
  if (g.includes("unique") || g.includes("유니크") || g.includes("唯一")) return "#a78bfa";
  if (g.includes("hero") || g.includes("영웅") || g.includes("英雄")) return "#38bdf8";
  if (g.includes("rare") || g.includes("희귀") || g.includes("稀有")) return "#34d399";
  if (g.includes("ultimate") || g.includes("超越") || g.includes("초월")) return "#22d3ee";
  if (g.includes("special")) return "#f472b6";
  return "#64748b";
}

const GEAR_SLOTS = new Set([
  "helmet", "shoulder", "torso", "pants", "gloves", "boots",
  "mainhand", "subhand", "shield", "cape",
]);

function ItemCard({ item, size = "md" }: { item: CharacterItem; size?: "md" | "lg" }) {
  const color = gradeColor(item.grade);
  const dim = size === "lg" ? "h-14 w-14" : "h-11 w-11";
  return (
    <div
      className="flex flex-col items-center gap-1.5 rounded-xl border bg-[#0a0f26]/60 p-2 text-center transition-all hover:bg-[#0a0f26]"
      style={{ borderColor: `${color}55` }}
      title={`${item.name} (${item.slotPosName || `Slot ${item.slotPos}`})${item.enchantLevel ? ` +${item.enchantLevel}` : ""}`}
    >
      <div className={`relative ${dim} overflow-hidden rounded-lg border ${size === "lg" ? "border-cyan-400/30 bg-black" : "border-white/10 bg-black"}`}>
        {item.icon ? (
          <img src={item.icon} alt="" className="h-full w-full object-contain" loading="lazy" />
        ) : null}
        {item.enchantLevel > 0 && (
          <span className="absolute bottom-0 right-0 rounded-tl-md bg-cyan-500/90 px-1 text-[7px] font-black text-black">+{item.enchantLevel}</span>
        )}
      </div>
      <p className="w-full truncate text-[7px] font-bold uppercase tracking-wider text-slate-400">{item.slotPosName || `Slot ${item.slotPos}`}</p>
      <p className="w-full truncate text-[8px] font-black text-slate-200">{item.name}</p>
    </div>
  );
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      {icon}
      <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">{children}</h2>
    </div>
  );
}

function officialPageHref(vc: CharacterDetails["profile"]): string {
  const base = vc.region === "tw" ? "https://tw.ncsoft.com/aion2" : "https://aion2.plaync.com";
  return `${base}/characters/${vc.serverId}/${encodeURIComponent(vc.characterId)}`;
}

function LoadingPanel() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/10 bg-[#0a0f26]/60 px-6 py-16">
      <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pulling live character data…</p>
    </div>
  );
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-3xl border border-red-500/25 bg-red-500/[0.04] px-6 py-10 text-center">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-red-400">Could not load character</p>
      <p className="mx-auto mt-2 max-w-md text-xs text-slate-400">{message}</p>
      <button
        onClick={onRetry}
        className="mx-auto mt-5 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-violet-600 px-4 py-2 text-[9px] font-black uppercase tracking-widest text-white transition-all hover:opacity-90"
      >
        <Link2 className="h-3 w-3" /> Retry
      </button>
    </div>
  );
}

const POWER_ICON = "https://assets.playnccdn.com/static-aion2/characters/img/info/profile_power_icon_pc.png";
const LEVEL_ICON = "https://assets.playnccdn.com/static-aion2/characters/img/info/profile_level_icon_pc.png";

function CharacterPortrait({ url, name }: { url: string | null; name: string }) {
  const [src, setSrc] = useState<string | null>(url ? portraitProxyPath(url) || url : null);
  const [hidden, setHidden] = useState(false);
  if (hidden || !src) {
    return (
      <div className="flex h-full w-full items-center justify-center text-3xl font-black text-cyan-400/40 uppercase">{String(name || "?").slice(0, 1)}</div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      className="h-full w-full object-cover"
      onError={() => {
        if (src !== url) setSrc(url);
        else setHidden(true);
      }}
    />
  );
}

function StatChip({ icon, value, accent, children }: { icon: string; value: string; accent: string; children?: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-black ${accent}`}>
      <img src={icon} alt="" className="h-4 w-auto" loading="lazy" />
      {value}
      {children}
    </span>
  );
}

export default function CharacterPage() {
  const [input, setInput] = useState("");
  const [link, setLink] = useState("");
  const [state, setState] = useState<State>("idle");
  const [data, setData] = useState<CharacterDetails | null>(null);
  const [error, setError] = useState("");
  const [showAllSkills, setShowAllSkills] = useState(false);

  const load = useCallback(async (u: string) => {
    if (!u) return;
    setState("loading");
    setError("");
    setData(null);
    try {
      const res = await fetch(`/api/aion2/profile?u=${encodeURIComponent(u)}`);
      const d: any = await res.json().catch(() => ({}));
      if (!res.ok || !d?.details) {
        setError(d?.error || "Could not reach NCSoft for this character.");
        setState("error");
        return;
      }
      setData(d.details as CharacterDetails);
      setState("ready");
    } catch {
      setError("Network error — try again.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    const u = new URLSearchParams(window.location.search).get("u") || "";
    setInput(u);
    if (u) load(u);
  }, [load]);

  const go = useCallback(() => {
    const u = input.trim();
    if (!u || state === "loading") return;
    window.history.replaceState(null, "", `/character?u=${encodeURIComponent(u)}`);
    setLink(u);
    load(u);
  }, [input, load, state]);

  const d = data;
  const equippedSkills = d ? d.skills.filter((s) => s.equipped) : [];

  return (
    <main className="min-h-screen bg-[#050814] text-slate-200 font-sans overflow-x-clip relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.08),transparent_55%)]" />

      <div className="relative max-w-5xl mx-auto px-6 py-10">
        <a href="/" className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-colors hover:text-cyan-300">
          <ArrowLeft className="h-3.5 w-3.5" /> Aion 2 LFG
        </a>

        <h1 className="mt-3 text-xl font-black uppercase tracking-[0.18em] text-white">
          Character <span className="text-cyan-400">Profile</span>
        </h1>

        {/* Paste box */}
        <div className="mt-5 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && go()}
            placeholder="Paste an official character link — e.g. https://tw.ncsoft.com/aion2/characters/1001/…"
            className="flex-1 min-w-0 rounded-xl border border-white/10 bg-[#0a0f26]/70 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/60"
          />
          <button
            onClick={go}
            disabled={!input.trim() || state === "loading"}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50 transition-all hover:opacity-90"
          >
            {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />} Load
          </button>
        </div>

        <div className="mt-6">
          {state === "idle" && (
            <p className="rounded-3xl border border-white/5 bg-white/[0.02] px-6 py-12 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Paste a character link to load their full live profile.
            </p>
          )}
          {state === "loading" && <LoadingPanel />}
          {state === "error" && <ErrorPanel message={error} onRetry={() => link && load(link)} />}

          {state === "ready" && d && (
            <div className="space-y-6">
              {/* Hero */}
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a0f26]/70">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10" />
                <div className="relative flex flex-wrap items-center gap-5 p-6">
                  <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border-2 border-cyan-400/30 bg-black shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                    <CharacterPortrait url={d.profile.portraitUrl} name={d.profile.name} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-black uppercase tracking-wide text-white">{d.profile.name}</h2>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${d.profile.region === "tw" ? "border-rose-500/40 bg-rose-500/10 text-rose-300" : "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"}`}>
                        <ShieldCheck className="h-2.5 w-2.5" /> {d.profile.region === "tw" ? "TW" : "KR"}
                      </span>
                      {d.profile.siteClass && (
                        <span className="flex items-center gap-1 rounded-full border border-fuchsia-500/40 bg-fuchsia-500/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-fuchsia-300">
                          <Swords className="h-2.5 w-2.5" /> {d.profile.siteClass}
                          {aionClassRole(d.profile.siteClass) ? ` · ${aionClassRole(d.profile.siteClass).toUpperCase()}` : ""}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5">{d.profile.serverName} · KR-{d.profile.serverId}</span>
                      {d.profile.raceName && <span>{d.profile.raceName}</span>}
                      {d.profile.genderName && <span>· {d.profile.genderName}</span>}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black text-emerald-300">LVL {d.profile.level}</span>
                      {d.profile.combatPower > 0 && <StatChip icon={POWER_ICON} value={d.profile.combatPower.toLocaleString()} accent="border-amber-500/40 bg-amber-500/10 text-amber-300" />}
                      {d.profile.itemLevel > 0 && <StatChip icon={LEVEL_ICON} value={d.profile.itemLevel.toLocaleString()} accent="border-violet-500/40 bg-violet-500/10 text-violet-300" />}
                    </div>
                  </div>

                  <a
                    href={officialPageHref(d.profile)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.03] px-3 py-2 text-[8px] font-black uppercase tracking-widest text-slate-300 transition-all hover:border-cyan-400/50 hover:text-cyan-200"
                  >
                    Official page <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* Stats */}
              {d.stats.length > 0 && (
                <section>
                  <SectionTitle icon={<Sparkles className="h-3.5 w-3.5 text-cyan-300" />}>Core stats</SectionTitle>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {d.stats.map((s, i) => (
                      <div key={`${s.type}-${i}`} className="rounded-xl border border-white/10 bg-[#0a0f26]/60 p-3">
                        <p className="truncate text-[8px] font-black uppercase tracking-widest text-slate-500">{s.name || s.type}</p>
                        <p className="mt-0.5 text-lg font-black text-white tabular-nums">{Number.isFinite(s.value) ? Math.round(s.value).toLocaleString() : "—"}</p>
                        {s.second.length > 0 && (
                          <p className="mt-1 text-[7px] font-bold uppercase tracking-wider leading-relaxed text-cyan-300/80">{s.second.join(" · ")}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Equipment */}
              <section>
                <SectionTitle icon={<Swords className="h-3.5 w-3.5 text-cyan-300" />}>Equipment</SectionTitle>
                {d.equipment.length === 0 ? (
                  <p className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-6 text-center text-[9px] font-bold uppercase tracking-widest text-slate-500">No equipment data available.</p>
                ) : (
                  <>
                    {(() => {
                      const sorted = [...d.equipment].sort((a, b) => a.slotPos - b.slotPos);
                      const gear = sorted.filter((it) => GEAR_SLOTS.has(String(it.slotPosName).toLowerCase()));
                      const acc = sorted.filter((it) => !GEAR_SLOTS.has(String(it.slotPosName).toLowerCase()));
                      return (
                        <>
                          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                            {gear.map((it) => <ItemCard key={`${it.slotPos}-${it.id}`} item={it} size="lg" />)}
                          </div>
                          {acc.length > 0 && (
                            <>
                              <h3 className="mt-4 mb-2 text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">Accessories</h3>
                              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                                {acc.map((it) => <ItemCard key={`${it.slotPos}-${it.id}`} item={it} size="md" />)}
                              </div>
                            </>
                          )}
                          {d.skins.length > 0 && (
                            <>
                              <h3 className="mt-4 mb-2 text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">Skins</h3>
                              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                                {d.skins.map((it) => <ItemCard key={`skin-${it.slotPos}-${it.id}`} item={it} size="md" />)}
                              </div>
                            </>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}
              </section>

              {/* Pet & Wing */}
              {(d.petWing.petName || d.petWing.wingName) && (
                <section>
                  <SectionTitle icon={<ShieldCheck className="h-3.5 w-3.5 text-cyan-300" />}>Pet & Wing</SectionTitle>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {d.petWing.petName && (
                      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0a0f26]/60 p-3">
                        {d.petWing.petIcon && <img src={d.petWing.petIcon} alt="" className="h-12 w-12 rounded-lg border border-white/10 bg-black object-contain" loading="lazy" />}
                        <div className="min-w-0">
                          <p className="truncate text-xs font-black text-white">Pet · {d.petWing.petName}</p>
                          {d.petWing.petLevel != null && <p className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Level {d.petWing.petLevel}</p>}
                        </div>
                      </div>
                    )}
                    {d.petWing.wingName && (
                      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0a0f26]/60 p-3">
                        {d.petWing.wingIcon && <img src={d.petWing.wingIcon} alt="" className="h-12 w-12 rounded-lg border border-white/10 bg-black object-contain" loading="lazy" />}
                        <p className="truncate text-xs font-black text-white">Wing · {d.petWing.wingName}</p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Daevanion */}
              {d.daevanionBoards.length > 0 && (
                <section>
                  <SectionTitle icon={<Wand2 className="h-3.5 w-3.5 text-cyan-300" />}>Daevanion Boards</SectionTitle>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {d.daevanionBoards.map((b) => (
                      <div key={b.id} className="rounded-xl border border-white/10 bg-[#0a0f26]/60 p-3">
                        <div className="flex items-center gap-2">
                          {b.icon && <img src={b.icon} alt="" className="h-7 w-7 rounded border border-white/10 bg-black object-contain" loading="lazy" />}
                          <p className="min-w-0 flex-1 truncate text-[10px] font-black text-white">{b.name}</p>
                        </div>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500" style={{ width: `${Math.min(100, Math.max(0, b.openPercent))}%` }} />
                        </div>
                        <p className="mt-1 text-[8px] font-bold uppercase tracking-widest text-slate-500">{b.openNodeCount}/{b.totalNodeCount} nodes · {Math.round(b.openPercent)}%</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Skills */}
              {d.skills.length > 0 && (
                <section>
                  <SectionTitle icon={<Sparkles className="h-3.5 w-3.5 text-cyan-300" />}>Skills</SectionTitle>
                  <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-2">
                    {equippedSkills.slice(0, 16).map((s) => (
                      <div key={s.id} className="flex flex-col items-center gap-1 rounded-xl border border-cyan-500/25 bg-cyan-500/[0.05] p-2 text-center" title={s.name}>
                        {s.icon && <img src={s.icon} alt="" className="h-10 w-10 rounded-lg border border-white/10 bg-black object-contain" loading="lazy" />}
                        <p className="w-full truncate text-[7px] font-bold uppercase tracking-wider text-slate-400">{s.category}</p>
                        <p className="w-full truncate text-[8px] font-black text-slate-100">{s.name}</p>
                        <p className="text-[7px] font-black text-cyan-300">Lv {s.skillLevel}</p>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowAllSkills((v) => !v)}
                    className="mt-3 text-[9px] font-black uppercase tracking-widest text-cyan-400 hover:text-cyan-200"
                  >
                    {showAllSkills ? "Hide" : "View all"} skills ({d.skills.length})
                  </button>
                  {showAllSkills && (
                    <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-2">
                      {d.skills.map((s) => (
                        <div key={s.id} className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-[#0a0f26]/60 p-2 text-center" title={s.name}>
                          {s.icon && <img src={s.icon} alt="" className="h-10 w-10 rounded-lg border border-white/10 bg-black object-contain" loading="lazy" />}
                          <p className="w-full truncate text-[7px] font-bold uppercase tracking-wider text-slate-500">{s.category}{s.equipped ? " · equipped" : ""}</p>
                          <p className="w-full truncate text-[8px] font-black text-slate-200">{s.name}</p>
                          <p className="text-[7px] font-black text-slate-400">Lv {s.skillLevel}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Titles */}
              {d.titles.length > 0 && (
                <section>
                  <SectionTitle icon={<Trophy className="h-3.5 w-3.5 text-cyan-300" />}>Titles & Achievements</SectionTitle>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {d.titles.map((t) => {
                      const c = gradeColor(t.grade);
                      return (
                        <div key={t.id} className="flex items-center gap-3 rounded-xl border bg-[#0a0f26]/60 p-3" style={{ borderColor: `${c}44` }}>
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-black" style={{ borderColor: `${c}66` }}>
                            <Trophy className="h-4 w-4" style={{ color: c }} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[10px] font-black text-white">{t.name}</p>
                            {t.statDesc && <p className="truncate text-[8px] font-bold uppercase tracking-wider text-cyan-300/80">{t.statDesc}</p>}
                            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/10">
                              <div className="h-full rounded-full" style={{ width: `${Math.min(100, t.ownedPercent)}%`, background: c }} />
                            </div>
                          </div>
                          <span className="shrink-0 text-[8px] font-black uppercase tracking-widest text-slate-400">{t.grade}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}