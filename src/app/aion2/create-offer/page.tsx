"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Swords, ChevronLeft, Coins, Zap, ChevronDown, ArrowRight, Send, Play,
  Sparkles, Check, Shield, Crown, Clock, Gem, Package, Star, Lock,
} from "lucide-react";
import { AION_SERVICES, AION_CATEGORIES, formatUsd, AionService } from "@/lib/aionServices";

const STEPS = ["service", "details", "confirm"] as const;
type Step = (typeof STEPS)[number];

const SPEEDS = [
  { label: "Standard", desc: "Queue within 24h", icon: Clock },
  { label: "Priority", desc: "Queue within 2h", icon: Zap },
  { label: "Express", desc: "Immediate start", icon: Star },
];

const FALLBACK_BG = "/aion%202%20bg%20small.mp4";

export default function Aion2CreateOfferPage() {
  const [step, setStep] = useState<Step>("service");
  const [sel, setSel] = useState<AionService | null>(null);
  const [qty, setQty] = useState(1);
  const [payment, setPayment] = useState<"kinah" | "cash">("cash");
  const [speed, setSpeed] = useState("Standard");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [published, setPublished] = useState(false);

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
  const totalLabel =
    payment === "cash"
      ? formatUsd(price)
      : `${(price * 1000).toLocaleString()} KINAH`;

  const bgVideo = sel?.video || FALLBACK_BG;

  const advance = () => { setSpeedOpen(false); setPaymentOpen(false); setStep(STEPS[stepIndex + 1]); };
  const regress = () => { setSpeedOpen(false); setPaymentOpen(false); setStep(STEPS[stepIndex - 1]); };
  const resetOffer = () => { setStep("service"); setSel(null); setQty(1); setSpeed("Standard"); setPayment("cash"); setSpeedOpen(false); setPaymentOpen(false); setPublished(false); };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#030410] text-white selection:bg-cyan-400 selection:text-black font-sans">

      {/* ── FULL-BLEED CINEMATIC BACKGROUND (crossfades to the per-boss feed when that service is selected) ── */}
      <motion.video
        key={bgVideo}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="fixed inset-0 h-full w-full object-cover"
        src={bgVideo}
        autoPlay muted loop playsInline preload="metadata"
      />
      <div className="fixed inset-0 bg-gradient-to-b from-[#030410]/90 via-[#030410]/55 to-[#030410]/95" />
      <div className="fixed inset-0" style={{ background: "radial-gradient(ellipse at 50% 35%, transparent 10%, rgba(3,4,16,0.85) 82%)" }} />
      <div className="fixed inset-0 opacity-[0.12]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(120,220,255,0.6) 1px, transparent 0)", backgroundSize: "30px 30px" }} />

      {/* ── PREMIUM TOP BAR ── */}
      <header className="relative z-40 border-b border-white/[0.08] bg-black/45 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-5 sm:px-8 py-4">
          <a href="/aion2" className="group flex items-center gap-2 rounded-lg border border-white/[0.12] bg-white/[0.03] px-3.5 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-200 backdrop-blur-md transition-all hover:border-cyan-300/50 hover:text-white cursor-pointer">
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
                <a href="/aion2" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#074f7b] via-[#41389f] to-[#7923aa] px-7 py-3 text-xs font-black tracking-[0.18em] uppercase text-white shadow-[0_0_30px_rgba(90,120,255,0.5)] transition-all hover:-translate-y-0.5 cursor-pointer">
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
                <section className="rounded-2xl border border-white/[0.09] bg-[#070a1c]/80 shadow-[0_20px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/40 bg-gradient-to-b from-cyan-500/20 to-purple-600/20">
                        <Swords className="h-4 w-4 text-cyan-300" />
                      </span>
                      <div>
                        <p className="text-[10px] font-black tracking-[0.24em] text-gray-500 uppercase">Offer Builder</p>
                        <p className="font-serif text-base font-black capitalize text-white">{step}</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3.5 py-1.5 text-[11px] font-black tracking-[0.2em] text-cyan-300 uppercase">
                      Step {stepIndex + 1}/{STEPS.length}
                    </span>
                  </div>

                  <div className="p-5 sm:p-6">
                    <AnimatePresence mode="wait">
                      {/* STEP 1 — SERVICE */}
                      {step === "service" && (
                        <motion.div key="s1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }} className="max-h-[52vh] overflow-y-auto pr-1">
                          {AION_CATEGORIES.filter((c) => grouped[c]?.length).map((cat) => (
                            <div key={cat} className="mb-5 last:mb-0">
                              <p className="mb-2.5 flex items-center gap-2 text-[10px] font-black tracking-[0.24em] uppercase text-amber-300/90">
                                <Sparkles className="h-3.5 w-3.5" /> {cat}
                              </p>
                              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                {grouped[cat].map((svc) => {
                                  const isActive = sel?.id === svc.id;
                                  return (
                                    <button key={svc.id} type="button" onClick={() => setSel(svc)} className={`group relative overflow-hidden rounded-xl border px-3.5 py-3 text-left transition-all ${isActive ? "border-cyan-400/60 bg-white/[0.09] shadow-[0_0_22px_rgba(0,229,255,0.16)]" : "border-white/[0.09] hover:border-white/[0.18] hover:bg-white/[0.05]"}`}>
                                      {isActive && <span className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />}
                                      <span className="flex items-center justify-between">
                                        <span className={`flex h-10 w-10 items-center justify-center rounded-lg border ${isActive ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-300" : "border-white/[0.1] bg-white/[0.03] text-gray-400"} transition-colors`}>
                                          <Package className="h-[18px] w-[18px]" />
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                          {svc.video && <Play className="h-4 w-4 text-emerald-300" aria-label="Video" />}
                                          {isActive && <Check className="h-4 w-4 text-cyan-300" />}
                                        </span>
                                      </span>
                                      <span className="mt-3 block text-sm font-bold text-white">{svc.name}</span>
                                      <span className="mt-1 block truncate text-[11px] text-gray-500">{svc.description}</span>
                                      <span className="mt-2 inline-block rounded bg-black/30 px-2.5 py-1 text-xs font-black text-cyan-300">{formatUsd(svc.basePriceUsd)}/pc</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}

                      {/* STEP 2 — DETAILS */}
                      {step === "details" && sel && (
                        <motion.div key="s2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }} className="flex flex-col gap-4">
                          <div className="flex items-center justify-between rounded-xl border border-cyan-400/20 bg-white/[0.04] px-4 py-3">
                            <div className="flex items-center gap-3">
                              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-400/40 bg-cyan-500/15 text-cyan-300">
                                <Package className="h-4 w-4" />
                              </span>
                              <div>
                                <p className="text-sm font-bold text-white">{sel.name}</p>
                                <p className="text-[11px] text-gray-500">{sel.description}</p>
                              </div>
                            </div>
                            <span className="rounded-lg bg-black/30 px-2.5 py-1 text-xs font-black text-cyan-300">{formatUsd(sel.basePriceUsd)}/pc</span>
                          </div>

                          <div>
                            <p className="mb-2 text-[10px] font-black tracking-[0.24em] uppercase text-gray-400">Quantity</p>
                            <div className="flex items-center justify-between rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-3">
                              <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.06] text-lg font-black text-gray-200 transition-all hover:border-white/25 hover:text-white cursor-pointer">-</button>
                              <div className="text-center">
                                <span className="block text-2xl font-black tabular-nums text-white">{qty}</span>
                                <span className="text-[10px] font-black tracking-[0.2em] uppercase text-gray-500">{sel.priceUnit || "runs"}</span>
                              </div>
                              <button type="button" onClick={() => setQty(Math.min(100, qty + 1))} className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.06] text-lg font-black text-gray-200 transition-all hover:border-white/25 hover:text-white cursor-pointer">+</button>
                            </div>
                          </div>

                          <div>
                            <p className="mb-2 text-[10px] font-black tracking-[0.24em] uppercase text-gray-400">Speed</p>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                              {SPEEDS.map((sp) => {
                                const SpeedIcon = sp.icon;
                                const isActive = speed === sp.label;
                                return (
                                  <button key={sp.label} type="button" onClick={() => { setSpeed(sp.label); setSpeedOpen(false); }} className={`flex flex-col items-start gap-1 rounded-xl border px-3.5 py-3 text-left transition-all cursor-pointer ${isActive ? "border-cyan-400/60 bg-cyan-500/10 shadow-[0_0_18px_rgba(0,229,255,0.14)]" : "border-white/[0.09] hover:border-white/[0.18] hover:bg-white/[0.05]"}`}>
                                    <span className={`flex items-center gap-2 text-sm font-bold ${isActive ? "text-cyan-200" : "text-gray-300"}`}>
                                      <SpeedIcon className={`h-3.5 w-3.5 ${isActive ? "text-cyan-300" : "text-gray-500"}`} /> {sp.label}
                                    </span>
                                    <span className="text-[10px] text-gray-500">{sp.desc}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div>
                            <p className="mb-2 text-[10px] font-black tracking-[0.24em] uppercase text-gray-400">Payment</p>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              <button type="button" onClick={() => { setPayment("kinah"); setSpeedOpen(false); }} className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all cursor-pointer ${payment === "kinah" ? "border-amber-400/50 bg-amber-500/10 shadow-[0_0_18px_rgba(251,191,36,0.14)]" : "border-white/[0.09] hover:border-white/[0.18] hover:bg-white/[0.05]"}`}>
                                <Coins className={`h-4 w-4 ${payment === "kinah" ? "text-amber-300" : "text-gray-500"}`} />
                                <span>
                                  <span className={`block text-sm font-bold ${payment === "kinah" ? "text-amber-200" : "text-gray-300"}`}>Kinah</span>
                                  <span className="text-[10px] text-gray-500">In-game gold</span>
                                </span>
                                {payment === "kinah" && <Check className="ml-auto h-4 w-4 text-amber-300" />}
                              </button>
                              <button type="button" onClick={() => { setPayment("cash"); setSpeedOpen(false); }} className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all cursor-pointer ${payment === "cash" ? "border-emerald-400/50 bg-emerald-500/10 shadow-[0_0_18px_rgba(52,211,153,0.14)]" : "border-white/[0.09] hover:border-white/[0.18] hover:bg-white/[0.05]"}`}>
                                <Coins className={`h-4 w-4 ${payment === "cash" ? "text-emerald-300" : "text-gray-500"}`} />
                                <span>
                                  <span className={`block text-sm font-bold ${payment === "cash" ? "text-emerald-200" : "text-gray-300"}`}>Real Money</span>
                                  <span className="text-[10px] text-gray-500">USD via cash</span>
                                </span>
                                {payment === "cash" && <Check className="ml-auto h-4 w-4 text-emerald-300" />}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* STEP 3 — CONFIRM */}
                      {step === "confirm" && sel && (
                        <motion.div key="s3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }} className="flex flex-col gap-2.5">
                          {[
                            ["Service", sel.name],
                            ["Quantity", `${qty} ${sel.priceUnit || "runs"}`],
                            ["Payment", payment === "cash" ? "Real Money (Cash)" : "Kinah (In-Game Gold)"],
                            ["Speed", speed],
                            ["Rate", `${formatUsd(sel.basePriceUsd)} / pc`],
                            ["Total", totalLabel],
                          ].map(([k, v]) => (
                            <div key={k} className={`flex items-center justify-between rounded-xl border px-4 py-3 ${k === "Total" ? "border-cyan-400/40 bg-cyan-500/10 shadow-[0_0_18px_rgba(0,229,255,0.12)]" : "border-white/[0.07] bg-white/[0.03]"}`}>
                              <span className="text-[11px] font-black tracking-[0.2em] uppercase text-gray-500">{k}</span>
                              <span className={`text-sm font-black ${k === "Total" ? "text-cyan-300" : "text-white"}`}>{v}</span>
                            </div>
                          ))}
                          <p className="mt-1 text-[11px] text-gray-500">Review your offer. Publishing broadcasts it to the Aion 2 lobby.</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
</section>

                {/* ── RIGHT: ORDER SUMMARY BOARD ── */}
                <aside className="h-fit lg:sticky lg:top-6">
                  <div className="relative overflow-hidden rounded-2xl border border-cyan-300/[0.18] bg-[#070a1c]/85 shadow-[0_0_60px_rgba(0,180,255,0.12)] backdrop-blur-xl">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />
                    <span className="pointer-events-none absolute left-0 top-0 h-5 w-5 rounded-tl-2xl border-l border-t border-cyan-300/40" />
                    <span className="pointer-events-none absolute right-0 top-0 h-5 w-5 rounded-tr-2xl border-r border-t border-cyan-300/40" />

                    <div className="p-6">
                      <div className="flex items-center gap-2.5">
                        <Crown className="h-4 w-4 text-amber-300" />
                        <p className="text-xs font-black tracking-[0.26em] text-white uppercase">Order Summary</p>
                      </div>

                      {/* mini progress */}
                      <div className="mt-4 flex items-center gap-1.5">
                        {STEPS.map((s, i) => (
                          <div key={s} className={`h-1.5 flex-1 rounded-full ${stepIndex >= i ? "bg-cyan-400/70 shadow-[0_0_8px_rgba(0,229,255,0.5)]" : "bg-white/[0.08]"}`} />
                        ))}
                      </div>

                      {/* service */}
                      <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-3">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${sel ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-300" : "border-white/[0.1] bg-white/[0.03] text-gray-500"}`}>
                          <Package className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          {sel ? (
                            <>
                              <p className="truncate text-sm font-bold text-white">{sel.name}</p>
                              <p className="truncate text-[10px] text-gray-500">{sel.category} · {formatUsd(sel.basePriceUsd)}/pc</p>
                              {sel.video && (
                                <p className="mt-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">
                                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Boss Feed Active
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-gray-500">Select a service</p>
                          )}
                        </div>
                      </div>

                      {/* rows */}
                      <div className="mt-3 flex flex-col gap-1.5">
                        {[
                          ["Quantity", sel ? `${qty} ${sel.priceUnit || "runs"}` : "—"],
                          ["Speed", sel ? speed : "—"],
                          ["Payment", sel ? (payment === "cash" ? "Cash (USD)" : "Kinah") : "—"],
                        ].map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between text-xs">
                            <span className="font-black tracking-[0.18em] uppercase text-gray-500">{k}</span>
                            <span className="font-bold text-gray-300">{v}</span>
                          </div>
                        ))}
                      </div>

                      {/* total */}
                      <div className="mt-4 rounded-xl border border-cyan-400/30 bg-gradient-to-r from-cyan-500/10 to-purple-600/10 px-4 py-3.5">
                        <div className="flex items-end justify-between">
                          <span className="text-[11px] font-black tracking-[0.22em] uppercase text-gray-400">Total</span>
                          <span className="font-serif text-2xl font-black text-cyan-200 drop-shadow-[0_0_18px_rgba(0,229,255,0.4)]">{totalLabel}</span>
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
                              className={`flex items-center justify-center gap-2 rounded-xl border px-6 py-3 text-xs font-black tracking-[0.18em] uppercase transition-all ${canNext ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-200 shadow-[0_0_20px_rgba(0,229,255,0.12)] hover:bg-cyan-500/25 cursor-pointer" : "border-white/[0.08] bg-white/[0.04] text-gray-600 cursor-not-allowed"}`}
                            >
                              Continue to {step === "service" ? "Details" : "Confirm"} <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={regress} disabled={stepIndex === 0} className={`flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-transparent px-6 py-2.5 text-xs font-bold text-gray-400 transition-all ${stepIndex === 0 ? "cursor-not-allowed opacity-40" : "hover:border-white/25 hover:text-white cursor-pointer"}`}>
                              <ChevronLeft className="h-3.5 w-3.5" /> Back
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => { setSpeedOpen(false); setPaymentOpen(false); setPublished(true); }}
                            className="relative flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#074f7b] via-[#41389f] to-[#7923aa] px-7 py-3.5 text-xs font-black tracking-[0.18em] uppercase text-white shadow-[0_0_34px_rgba(90,120,255,0.5)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_50px_rgba(90,120,255,0.85)] cursor-pointer"
                          >
                            <Send className="h-3.5 w-3.5" /> Publish Offer
                          </button>
                        )}
                        <a href="/aion2" className="mt-0.5 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-gray-600 transition-colors hover:text-gray-400 hover:underline cursor-pointer">
                          Cancel & return to lobby
                        </a>
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