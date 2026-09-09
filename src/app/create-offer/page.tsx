"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  Swords, ChevronLeft, Coins, Zap, ChevronDown, ArrowRight, Send, Play,
  Check, Shield, Crown, Clock, Gem, Star, Lock, Castle, Crosshair,
  FlaskConical, TrendingUp, Hash, type LucideIcon,
} from "lucide-react";
import { AION_SERVICES, AION_CATEGORIES, AionService } from "@/lib/aionServices";
import { saveDataSmart } from "@/lib/saveDataRouter";

const fmtKinah = (usd: number) => `${Math.round(usd * 1000).toLocaleString()} KINAH`;

const STEPS = ["service", "details", "confirm"] as const;
type Step = (typeof STEPS)[number];

const SPEEDS = [
  { label: "Standard", desc: "Queue within 24h", icon: Clock },
  { label: "Priority", desc: "Queue within 2h", icon: Zap },
  { label: "Express", desc: "Immediate start", icon: Star },
];

const CATEGORY_META: Record<string, { icon: LucideIcon; color: string; tile: string }> = {
  Currency: { icon: Coins, color: "text-amber-300", tile: "border-amber-400/40 bg-amber-500/10" },
  Leveling: { icon: TrendingUp, color: "text-emerald-300", tile: "border-emerald-400/40 bg-emerald-500/10" },
  Raids: { icon: Swords, color: "text-rose-300", tile: "border-rose-400/40 bg-rose-500/10" },
  Dungeons: { icon: Castle, color: "text-cyan-300", tile: "border-cyan-400/40 bg-cyan-500/10" },
  Collections: { icon: Gem, color: "text-purple-300", tile: "border-purple-400/40 bg-purple-500/10" },
  PVP: { icon: Crosshair, color: "text-orange-300", tile: "border-orange-400/40 bg-orange-500/10" },
  Professions: { icon: FlaskConical, color: "text-sky-300", tile: "border-sky-400/40 bg-sky-500/10" },
};

const STEP_HINTS: Record<Step, string> = {
  service: "Choose the mission you want to publish",
  details: "Tune quantity, speed and payment",
  confirm: "Lock in the details before going live",
};

export default function CreateOfferPage() {
  const { data: session } = useSession();
  const [step, setStep] = useState<Step>("service");
  const [sel, setSel] = useState<AionService | null>(null);
  const [qty, setQty] = useState(1);
  const [payment, setPayment] = useState<"kinah">("kinah");
  const [speed, setSpeed] = useState("Standard");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [pubError, setPubError] = useState("");

  /* Standalone premium page — hide the global UPLINK navbar */
  useEffect(() => {
    const globalNav = document.querySelector("body > nav, nav.fixed.top-0");
    if (globalNav instanceof HTMLElement) {
      globalNav.style.display = "none";
      return () => { globalNav.style.display = ""; };
    }
  }, []);

  const grouped = useMemo(() => {
    const g: Record<string, AionService[]> = {};
    for (const cat of AION_CATEGORIES) { g[cat] = AION_SERVICES.filter((s) => s.category === cat); }
    return g;
  }, []);

  const price = sel ? sel.basePriceUsd * qty : 0;
  const canNext = !!sel;
  const stepIndex = STEPS.indexOf(step);
  const totalLabel = `${fmtKinah(price)}`;

  const advance = () => { setSpeedOpen(false); setPaymentOpen(false); setStep(STEPS[stepIndex + 1]); };
  const regress = () => { setSpeedOpen(false); setPaymentOpen(false); setStep(STEPS[stepIndex - 1]); };
  const resetOffer = () => { setStep("service"); setSel(null); setQty(1); setSpeed("Standard"); setPayment("kinah"); setSpeedOpen(false); setPaymentOpen(false); setPublished(false); setPubError(""); };

  const publishOffer = async () => {
    if (!session?.user) { setPubError("Sign in to publish an offer"); return; }
    if (!sel) return;
    setPublishing(true);
    setPubError("");
    try {
      const me = session.user as any;
      const live = await fetch("/api/data", { credentials: "include" })
        .then((r) => r.json())
        .catch(() => ({ lobbies: [] }));
      const lobbies = Array.isArray(live.lobbies) ? live.lobbies : [];
      const category = sel.category === "Leveling" ? "leveling" : "dungeon";
      const kinahPerUnit = Math.round((sel.basePriceUsd || 0) * 1000);
      const kinahTotal = kinahPerUnit * qty;
      const lobby = {
        id: Date.now(),
        ownerId: String(me.id || ""),
        ownerDiscordName: String(me.name || "Operative"),
        ownerHandle: String(me.username || ""),
        ownerImage: String(me.image || ""),
        ownerEffect: "none",
        category,
        title: `${qty}× ${sel.name}`,
        serviceName: String(sel.name || "Mission"),
        notes: `${sel.description || ""} · ${speed}`,
        totalGold: kinahTotal,
        goldPerRun: kinahPerUnit,
        runsCount: qty,
        keyLevel: String((sel as any).keyLevel || "+10"),
        isTimed: speed !== "Standard",
        roles: category === "leveling"
          ? { tank: 0, dps: qty }
          : { tank: 0, healer: 0, dps: qty },
        applicants: [],
        invited: [],
        accepted: [],
        customBg: "",
        blacklistedClasses: [],
        blockedRoles: [],
        serverRegion: "EU",
        status: "standby",
        createdAt: Date.now(),
      };
      const ok = await saveDataSmart({ lobbies: [...lobbies, lobby] });
      if (!ok) { setPubError("Could not publish your offer — please try again"); return; }
      setPublished(true);
    } catch {
      setPubError("Network error — please try again");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#050814] text-white selection:bg-cyan-400 selection:text-black font-sans">

      {/* ── SCENIC BACKGROUND — same composition as the lobby home ── */}
      <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden>
        <div className="absolute inset-0 bg-contain bg-top bg-no-repeat" style={{ backgroundImage: `url('/AION2.png')` }} />
        <div className="absolute inset-0 bg-[#050814]/40 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050814]/12 via-transparent to-[#050814]/35" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(5,8,20,0.8)_100%)]" />
        <div className="aion-dotnet absolute inset-0 opacity-[0.10]" />
      </div>

      {/* ── PREMIUM TOP BAR ── */}
      <header className="relative z-40 border-b border-white/[0.08] bg-black/45 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-5 sm:px-8 py-4">
          <a href="/" className="group flex items-center gap-2 rounded-lg border border-white/[0.12] bg-white/[0.03] px-3.5 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-200 backdrop-blur-md transition-all hover:border-cyan-300/50 hover:text-white cursor-pointer">
            <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" /> Back to Lobby
          </a>

          <div className="flex items-center gap-2.5">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/40 bg-gradient-to-b from-cyan-500/20 to-purple-600/20 shadow-[0_0_18px_rgba(0,229,255,0.25)]">
              <Swords className="h-4 w-4 text-cyan-300" />
            </span>
            <div className="leading-none">
              <p className="font-serif text-lg font-black tracking-[0.14em] bg-gradient-to-r from-white via-cyan-100 to-sky-400 bg-clip-text text-transparent">AION 2</p>
              <p className="mt-1 text-[10px] font-black tracking-[0.3em] text-amber-300/90 uppercase">Offer Forge</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            {STEPS.map((s, i) => {
              const activeStep = stepIndex === i;
              const doneStep = stepIndex > i;
              return (
                <div key={s} className="flex items-center gap-2">
                  {i > 0 && <span className={`h-px w-4 ${doneStep ? "bg-cyan-400/60" : "bg-white/15"}`} />}
                  <span className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] transition-all ${activeStep ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-200 shadow-[0_0_12px_rgba(0,229,255,0.2)]" : doneStep ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-300/80" : "border-white/[0.1] bg-white/[0.03] text-gray-500"}`}>
                    {doneStep ? <Check className="h-3.5 w-3.5" /> : <span className="text-xs">{i + 1}</span>}
                    {s}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {published ? (
          <motion.section
            key="success"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative z-20 mx-auto flex min-h-[72vh] max-w-[1400px] items-center justify-center px-5 sm:px-8"
          >
            <div className="relative w-full max-w-md rounded-3xl border border-emerald-300/25 bg-[#070a1c]/90 p-10 text-center shadow-[0_0_90px_rgba(52,211,153,0.22)] backdrop-blur-2xl">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 220, damping: 14 }}
                className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/50 bg-emerald-500/15 shadow-[0_0_45px_rgba(52,211,153,0.45)]"
              >
                <Check className="h-9 w-9 text-emerald-300" />
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/10" />
              </motion.div>
              <h2 className="font-serif text-2xl font-black tracking-wide text-white">Offer Published</h2>
              <p className="mt-2 text-xs text-slate-300/90">Your mission is live for the Aion 2 community. May the Daevas answer your call.</p>
              <div className="mt-7 flex flex-col gap-2.5">
                <a href="/" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#074f7b] via-[#41389f] to-[#7923aa] px-7 py-3 text-xs font-black tracking-[0.18em] uppercase text-white shadow-[0_0_30px_rgba(90,120,255,0.5)] transition-all hover:-translate-y-0.5 cursor-pointer">
                  <Swords className="h-3.5 w-3.5" /> Return to Lobby
                </a>
                <button type="button" onClick={resetOffer} className="rounded-xl border border-white/[0.12] bg-white/[0.03] px-7 py-3 text-xs font-black tracking-[0.18em] uppercase text-gray-300 transition-all hover:border-white/25 hover:text-white cursor-pointer">
                  New Offer
                </button>
              </div>
            </div>
          </motion.section>
        ) : (
          <motion.div
            key="forge"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative z-20"
          >
            {/* ── HUD HEADER ── */}
            <section className="mx-auto px-5 pt-9 pb-6 sm:px-8 max-w-[1400px]">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="flex items-center gap-2 text-xs font-black tracking-[0.3em] text-cyan-300 uppercase">
                    <Gem className="h-3.5 w-3.5" /> Aion 2 · Offer Forge
                  </p>
                  <h1 className="mt-3 bg-gradient-to-b from-white via-cyan-50 to-cyan-400 bg-clip-text font-serif text-5xl font-black tracking-tight text-transparent drop-shadow-[0_0_35px_rgba(34,211,238,0.35)] sm:text-6xl">
                    Forge Your Offer
                  </h1>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-400">
                    Craft a premium mission post and broadcast it to every Daeva in Atreia. Take charge of your run.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { icon: Shield, label: "24/7 Trusted", color: "text-cyan-300" },
                    { icon: Lock, label: "Escrow Ready", color: "text-amber-300" },
                    { icon: Zap, label: "Instant Post", color: "text-purple-300" },
                  ].map((chip) => (
                    <span key={chip.label} className="flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-black/40 px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-gray-300 backdrop-blur-md">
                      <chip.icon className={`h-3 w-3 ${chip.color}`} /> {chip.label}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* ── FORGE GRID ── */}
            <main className="mx-auto max-w-[1400px] px-5 pb-20 sm:px-8">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
                {/* ── LEFT: BUILDER ── */}
                <section className="tn-light rounded-2xl border border-white/[0.09] bg-[#070a1c]/80 shadow-[0_20px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-gradient-to-r from-cyan-500/[0.06] via-transparent to-purple-500/[0.06] px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <span className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/40 bg-gradient-to-b from-cyan-500/20 to-purple-600/20 shadow-[0_0_18px_rgba(0,229,255,0.18)]">
                        <Swords className="h-[18px] w-[18px] text-cyan-300" />
                      </span>
                      <div>
                        <p className="text-[9px] font-black tracking-[0.3em] text-cyan-300/80 uppercase">Offer Builder</p>
                        <p className="font-serif text-lg font-black capitalize text-white">{step}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-black tracking-[0.2em] text-cyan-300 uppercase">
                        Step {stepIndex + 1} <span className="text-cyan-400/50">/ {STEPS.length}</span>
                      </span>
                      <p className="mt-1 hidden text-[10px] text-gray-500 sm:block">{STEP_HINTS[step]}</p>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                    <AnimatePresence mode="wait">
                      {/* STEP 1 — SERVICE */}
                      {step === "service" && (
                        <motion.div key="s1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }} className="max-h-[52vh] overflow-y-auto pr-1.5">
                          {AION_CATEGORIES.filter((c) => grouped[c]?.length).map((cat) => {
                            const meta = CATEGORY_META[cat];
                            const CatIcon = meta.icon;
                            return (
                              <div key={cat} className="mb-6 last:mb-0">
                                <div className="mb-3 flex items-center gap-2">
                                  <span className={`flex h-6 w-6 items-center justify-center rounded-md border ${meta.tile}`}>
                                    <CatIcon className={`h-3.5 w-3.5 ${meta.color}`} />
                                  </span>
                                  <span className={`text-xs font-black tracking-[0.24em] uppercase ${meta.color}`}>{cat}</span>
                                  <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[9px] font-bold text-gray-500">{grouped[cat].length}</span>
                                  <span className="h-px flex-1 bg-gradient-to-r from-white/[0.12] to-transparent" />
                                </div>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                  {grouped[cat].map((svc) => {
                                    const isActive = sel?.id === svc.id;
                                    const variantCount = (svc.options?.length ?? 0) + (svc.extras?.length ?? 0);
                                    return (
                                      <button key={svc.id} type="button" onClick={() => setSel(svc)}
                                        className={`group relative rounded-xl border p-4 text-left transition-all ${isActive ? "border-cyan-400/60 bg-cyan-500/[0.08] shadow-[0_0_26px_rgba(0,229,255,0.14)]" : "border-white/[0.09] bg-white/[0.03] hover:border-white/[0.2] hover:bg-white/[0.06]"}`}>
                                        {isActive && <span className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent" />}
                                        <span className="flex items-start justify-between gap-3">
                                          <span className="flex min-w-0 items-start gap-3">
                                            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${isActive ? "border-cyan-400/50 bg-cyan-500/15" : "border-white/[0.1] bg-white/[0.04]"} transition-colors`}>
                                              <CatIcon className={`h-5 w-5 ${isActive ? "text-cyan-300" : meta.color}`} />
                                            </span>
                                            <span className="min-w-0">
                                              <span className="flex items-center gap-1.5">
                                                <span className="truncate text-sm font-bold text-white">{svc.name}</span>
                                                {svc.video && <Play className="h-3.5 w-3.5 shrink-0 text-emerald-300" aria-label="Video" />}
                                              </span>
                                              <span className="mt-0.5 block truncate text-[11px] text-gray-500">{svc.description}</span>
                                            </span>
                                          </span>
                                          {isActive ? (
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-cyan-400/60 bg-cyan-500/20">
                                              <Check className="h-3.5 w-3.5 text-cyan-300" />
                                            </span>
                                          ) : (
                                            <span className="shrink-0 rounded-md bg-black/30 px-2 py-1 text-xs font-black text-cyan-300 tabular-nums">{fmtKinah(svc.basePriceUsd)}</span>
                                          )}
                                        </span>
                                        {variantCount > 0 ? (
                                          <span className="mt-3 flex flex-wrap items-center gap-1.5">
                                            {[...(svc.options ?? []), ...(svc.extras ?? [])].slice(0, 2).map((o) => (
                                              <span key={o.label} className="rounded border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 text-[9px] font-bold text-gray-400">{o.label}</span>
                                            ))}
                                            {variantCount > 2 && (
                                              <span className="rounded border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 text-[9px] font-bold text-gray-500">+{variantCount - 2} more</span>
                                            )}
                                          </span>
                                        ) : (
                                          <span className="mt-3 flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.14em] text-gray-600">
                                            {fmtKinah(svc.basePriceUsd)} <span className="text-gray-700">/</span> {svc.priceUnit ?? "pc"}
                                          </span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </motion.div>
                      )}

                      {/* STEP 2 — DETAILS */}
                      {step === "details" && sel && (() => {
                        const meta = CATEGORY_META[sel.category] ?? CATEGORY_META.Raids;
                        const CatIcon = meta.icon;
                        return (
                          <motion.div key="s2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }} className="flex flex-col gap-5">
                            <div className="flex items-center justify-between gap-3 rounded-xl border border-cyan-400/25 bg-cyan-500/[0.07] px-4 py-3.5">
                              <div className="flex min-w-0 items-center gap-3">
                                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${meta.tile}`}>
                                  <CatIcon className={`h-5 w-5 ${meta.color}`} />
                                </span>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-bold text-white">{sel.name}</p>
                                  <p className="truncate text-[11px] text-gray-500">{sel.description}</p>
                                </div>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="text-base font-black text-cyan-300 tabular-nums">{fmtKinah(sel.basePriceUsd)}</p>
                                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-gray-500">{sel.priceUnit ?? "per pc"}</p>
                              </div>
                            </div>

                            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                              <p className="mb-3 flex items-center gap-2 text-[10px] font-black tracking-[0.24em] uppercase text-gray-400">
                                <Hash className="h-3.5 w-3.5 text-cyan-400" /> Quantity
                              </p>
                              <div className="flex items-center justify-between gap-4">
                                <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.06] text-lg font-black text-gray-200 transition-all hover:border-white/25 hover:text-white cursor-pointer">-</button>
                                <div className="text-center">
                                  <span className="block text-3xl font-black tabular-nums text-white">{qty}</span>
                                  <span className="text-[10px] font-black tracking-[0.2em] uppercase text-gray-500">{sel.priceUnit || "runs"}</span>
                                </div>
                                <button type="button" onClick={() => setQty(Math.min(100, qty + 1))} className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.06] text-lg font-black text-gray-200 transition-all hover:border-white/25 hover:text-white cursor-pointer">+</button>
                              </div>
                            </div>

                            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                              <p className="mb-3 flex items-center gap-2 text-[10px] font-black tracking-[0.24em] uppercase text-gray-400">
                                <Zap className="h-3.5 w-3.5 text-cyan-400" /> Speed
                              </p>
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                {SPEEDS.map((sp) => {
                                  const SpeedIcon = sp.icon;
                                  const isActive = speed === sp.label;
                                  return (
                                    <button key={sp.label} type="button" onClick={() => { setSpeed(sp.label); setSpeedOpen(false); }}
                                      className={`relative flex items-center gap-3 rounded-xl border px-3.5 py-3.5 text-left transition-all cursor-pointer ${isActive ? "border-cyan-400/60 bg-cyan-500/10 shadow-[0_0_18px_rgba(0,229,255,0.14)]" : "border-white/[0.09] hover:border-white/[0.18] hover:bg-white/[0.05]"}`}>
                                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${isActive ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-300" : "border-white/[0.1] bg-white/[0.04] text-gray-500"}`}>
                                        <SpeedIcon className="h-4 w-4" />
                                      </span>
                                      <span className="min-w-0 flex-1">
                                        <span className={`block text-sm font-bold ${isActive ? "text-cyan-200" : "text-gray-200"}`}>{sp.label}</span>
                                        <span className="block text-[10px] text-gray-500">{sp.desc}</span>
                                      </span>
                                      {isActive && <Check className="h-4 w-4 shrink-0 text-cyan-300" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                              <p className="mb-3 flex items-center gap-2 text-[10px] font-black tracking-[0.24em] uppercase text-gray-400">
                                <Coins className="h-3.5 w-3.5 text-cyan-400" /> Payment
                              </p>
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-1">
                                <button type="button" onClick={() => { setPayment("kinah"); setSpeedOpen(false); }}
                                  className={`flex items-center gap-3 rounded-xl border px-4 py-4 text-left transition-all cursor-pointer ${payment === "kinah" ? "border-amber-400/50 bg-amber-500/10 shadow-[0_0_18px_rgba(251,191,36,0.14)]" : "border-white/[0.09] hover:border-white/[0.18] hover:bg-white/[0.05]"}`}>
                                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${payment === "kinah" ? "border-amber-400/40 bg-amber-500/15" : "border-white/[0.1] bg-white/[0.04] text-gray-500"}`}>
                                    <Coins className={`h-4 w-4 ${payment === "kinah" ? "text-amber-300" : "text-gray-500"}`} />
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className={`block text-sm font-bold ${payment === "kinah" ? "text-amber-200" : "text-gray-200"}`}>Kinah</span>
                                    <span className="block text-[10px] text-gray-500">In-game gold</span>
                                  </span>
                                  {payment === "kinah" && <Check className="h-4 w-4 shrink-0 text-amber-300" />}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })()}

                      {/* STEP 3 — CONFIRM */}
                      {step === "confirm" && sel && (
                        <motion.div key="s3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }} className="flex flex-col gap-4">
                          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-5 py-2.5">
                            {[
                              ["Service", sel.name],
                              ["Quantity", `${qty} × ${sel.priceUnit || "runs"}`],
                              ["Speed", speed],
                              ["Payment", "Kinah · In-Game"],
                              ["Rate", `${fmtKinah(sel.basePriceUsd)} / ${sel.priceUnit ?? "pc"}`],
                            ].map(([k, v], ix) => (
                              <div key={k} className={`flex items-center justify-between gap-4 py-3 ${ix < 4 ? "border-b border-white/[0.06]" : ""}`}>
                                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">{k}</span>
                                <span className="truncate text-sm font-bold text-white">{v}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between gap-4 rounded-xl border border-cyan-400/35 bg-gradient-to-r from-cyan-500/[0.12] to-purple-600/[0.12] px-5 py-4">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-400">Total</p>
                              <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-gray-500">KINAH · In-Game</p>
                            </div>
                            <p className="font-serif text-2xl font-black text-cyan-200 drop-shadow-[0_0_18px_rgba(0,229,255,0.4)] tabular-nums">{totalLabel}</p>
                          </div>
                          <p className="text-[11px] text-gray-500">Review your offer. Publishing broadcasts it to the Aion 2 lobby.</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
</section>

                {/* ── RIGHT: ORDER SUMMARY BOARD ── */}
                <aside className="h-fit lg:sticky lg:top-6">
                  <div className="tn-light relative overflow-hidden rounded-2xl border border-cyan-300/[0.18] bg-[#070a1c]/85 shadow-[0_0_60px_rgba(0,180,255,0.12)] backdrop-blur-xl">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />
                    <span className="pointer-events-none absolute left-0 top-0 h-5 w-5 rounded-tl-2xl border-l border-t border-cyan-300/40" />
                    <span className="pointer-events-none absolute right-0 top-0 h-5 w-5 rounded-tr-2xl border-r border-t border-cyan-300/40" />

                    <div className="p-6">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-amber-300" />
                          <p className="text-xs font-black tracking-[0.26em] text-white uppercase">Order Summary</p>
                        </div>
                        {sel && (
                          <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-emerald-300">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Ready
                          </span>
                        )}
                      </div>

                      {/* mini progress */}
                      <div className="mt-4 flex items-center gap-1.5">
                        {STEPS.map((s, i) => (
                          <div key={s} className={`h-1.5 flex-1 rounded-full ${stepIndex >= i ? "bg-cyan-400/70 shadow-[0_0_8px_rgba(0,229,255,0.5)]" : "bg-white/[0.08]"}`} />
                        ))}
                      </div>

                      {/* service */}
                      <div className={`mt-5 rounded-xl border p-4 ${sel ? "border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.09] to-purple-500/[0.05]" : "border-white/[0.08] bg-white/[0.03]"}`}>
                        {sel ? (() => {
                          const meta = CATEGORY_META[sel.category] ?? CATEGORY_META.Raids;
                          const CatIcon = meta.icon;
                          return (
                            <div className="flex items-start gap-3">
                              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${meta.tile}`}>
                                <CatIcon className={`h-5 w-5 ${meta.color}`} />
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="truncate text-sm font-bold text-white">{sel.name}</p>
                                  <p className="shrink-0 text-sm font-black text-cyan-300 tabular-nums">{fmtKinah(sel.basePriceUsd)}<span className="ml-0.5 text-[9px] font-bold uppercase text-gray-600">/pc</span></p>
                                </div>
                                <p className="mt-0.5 truncate text-[11px] text-gray-500">{sel.category}</p>
                                {sel.video && (
                                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-300">
                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Boss Feed Active
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })() : (
                          <div className="flex items-center gap-3">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.04] text-gray-500">
                              <Swords className="h-5 w-5" />
                            </span>
                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-500">Pick a service to start</p>
                          </div>
                        )}
                      </div>

                      {/* detail rows */}
                      <div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-2.5">
                        {[
                          ["Quantity", sel ? `${qty} × ${sel.priceUnit || "runs"}` : "—"],
                          ["Speed", sel ? speed : "—"],
                          ["Payment", sel ? "Kinah · In-Game" : "—"],
                        ].map(([k, v], ix) => (
                          <div key={k} className={`flex items-center justify-between gap-3 py-2.5 ${ix < 2 ? "border-b border-white/[0.06]" : ""}`}>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{k}</span>
                            <span className={`text-xs font-bold ${sel ? "text-gray-200" : "text-gray-600"}`}>{v}</span>
                          </div>
                        ))}
                      </div>

                      {/* total */}
                      <div className="mt-4 overflow-hidden rounded-xl border border-cyan-400/35 bg-gradient-to-r from-cyan-500/[0.12] to-purple-600/[0.12]">
                        <div className="flex items-end justify-between gap-3 px-5 py-4">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-400">Total</p>
                            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-gray-500">KINAH · In-Game</p>
                          </div>
                          <p className="font-serif text-2xl font-black text-cyan-200 drop-shadow-[0_0_18px_rgba(0,229,255,0.4)] tabular-nums">{totalLabel}</p>
                        </div>
                      </div>

                      {/* actions */}
                      <div className="mt-5 flex flex-col gap-2">
                        {step !== "confirm" ? (
                          <>
                            <button
                              type="button"
                              onClick={advance}
                              disabled={!canNext}
                              className={`flex items-center justify-center gap-2 rounded-xl border px-6 py-3.5 text-xs font-black tracking-[0.18em] uppercase transition-all ${canNext ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-200 shadow-[0_0_20px_rgba(0,229,255,0.12)] hover:bg-cyan-500/25 cursor-pointer" : "border-white/[0.08] bg-white/[0.04] text-gray-600 cursor-not-allowed"}`}
                            >
                              {step === "service" ? "Continue to Details" : "Continue to Confirm"} <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={regress} disabled={stepIndex === 0} className={`flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-transparent px-6 py-3 text-xs font-bold text-gray-400 transition-all ${stepIndex === 0 ? "cursor-not-allowed opacity-40" : "hover:border-white/25 hover:text-white cursor-pointer"}`}>
                              <ChevronLeft className="h-3.5 w-3.5" /> Back
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={publishOffer}
                              disabled={publishing}
                              className="relative flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#074f7b] via-[#41389f] to-[#7923aa] px-7 py-4 text-xs font-black tracking-[0.18em] uppercase text-white shadow-[0_0_34px_rgba(90,120,255,0.5)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_50px_rgba(90,120,255,0.85)] cursor-pointer disabled:opacity-60"
                            >
                              <Send className="h-3.5 w-3.5" /> {publishing ? "Publishing..." : "Publish Offer"}
                            </button>
                            {pubError && (
                              <p className="text-center text-[10px] font-bold uppercase tracking-widest text-red-400">{pubError}</p>
                            )}
                          </>
                        )}
                        <a href="/" className="mt-0.5 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-gray-600 transition-colors hover:text-gray-400 hover:underline cursor-pointer">
                          Cancel & return to lobby
                        </a>
                        <div className="mt-2 flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-gray-600">
                          <Shield className="h-3 w-3" /> 100% Escrow protected · Instant post
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}