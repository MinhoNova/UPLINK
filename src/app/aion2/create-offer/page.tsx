"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Swords, ChevronLeft, Coins, Zap, ChevronDown, ArrowRight, Send, Sparkles, Check, Package,
} from "lucide-react";
import { AION_SERVICES, AION_CATEGORIES, formatUsd, AionService } from "@/lib/aionServices";

const STEPS = ["service", "details", "confirm"] as const;
type Step = (typeof STEPS)[number];

export default function Aion2CreateOfferPage() {
  const [step, setStep] = useState<Step>("service");
  const [sel, setSel] = useState<AionService | null>(null);
  const [qty, setQty] = useState(1);
  const [payment, setPayment] = useState<"kinah" | "cash">("cash");
  const [speed, setSpeed] = useState("Standard");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [published, setPublished] = useState(false);
  const speeds = ["Standard", "Priority", "Express"];

  /* Hide the global UPLINK navbar so only our page shows */
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

  const handlePublish = () => {
    if (!sel) return;
    setPublished(true);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030410] text-white selection:bg-cyan-500 selection:text-black font-sans">

      {/* ═══ FULL-BLEED BACKGROUND VIDEO ═══ */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/aion%202%20bg%20small.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      {/* Readability scrim */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030410]/85 via-[#030410]/40 to-[#030410]/90" />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 20%, rgba(3,4,16,0.75) 78%)" }} />

      {/* ═══ TOP BAR ═══ */}
      <header className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-5 sm:px-8 py-5">
        <a href="/aion2" className="group flex items-center gap-2 rounded-lg border border-white/[0.12] bg-black/40 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200 backdrop-blur-md transition-all hover:border-cyan-300/50 hover:text-white cursor-pointer">
          <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" /> Back to Lobby
        </a>
        <div className="flex items-center gap-2">
          <Swords className="h-6 w-6 text-cyan-300" />
          <span className="text-xl font-black tracking-[0.18em] bg-gradient-to-r from-white via-cyan-100 to-sky-400 bg-clip-text text-transparent font-serif">AION</span>
          <span className="text-xl font-black italic tracking-wider bg-gradient-to-b from-cyan-200 to-purple-400 bg-clip-text text-transparent font-serif">2</span>
        </div>
        <div className="w-[150px] hidden sm:block" />
      </header>

      {/* ═══ CENTER CONTENT ═══ */}
      <main className="relative z-20 flex min-h-screen items-center justify-center px-4 py-24">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait">
            {published ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="rounded-3xl border border-cyan-300/25 bg-[#060818]/90 p-10 text-center shadow-[0_0_80px_rgba(0,180,255,0.25)] backdrop-blur-2xl"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 220, damping: 14 }}
                  className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/50 bg-emerald-500/15 shadow-[0_0_40px_rgba(52,211,153,0.4)]"
                >
                  <Check className="h-9 w-9 text-emerald-300" />
                </motion.div>
                <h2 className="text-sm font-black tracking-[0.22em] uppercase text-white font-serif">Offer Published</h2>
                <p className="mt-2 text-[11px] text-slate-300/90">Your mission is live for the community. Ready to dive into Atreia?</p>
                <div className="mt-6 flex justify-center">
                  <a href="/aion2" className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#074f7b] via-[#41389f] to-[#7923aa] px-7 py-3 text-[10px] font-black tracking-[0.18em] uppercase text-white shadow-[0_0_30px_rgba(90,120,255,0.5)] transition-all hover:-translate-y-0.5 cursor-pointer">
                    <Swords className="h-3.5 w-3.5" /> Return to Lobby
                  </a>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="panel"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="relative rounded-3xl border border-cyan-200/[0.22] bg-[#060818]/88 p-6 sm:p-8 shadow-[0_0_80px_rgba(0,160,255,0.2)] backdrop-blur-2xl"
              >
                {/* top shimmer + corner accents */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />
                <span className="pointer-events-none absolute left-0 top-0 h-4 w-4 rounded-tl-3xl border-l border-t border-cyan-300/40" />
                <span className="pointer-events-none absolute right-0 top-0 h-4 w-4 rounded-tr-3xl border-r border-t border-cyan-300/40" />

                {/* Header */}
                <div className="relative flex items-center justify-center gap-3">
                  <Sparkles className="h-4 w-4 text-cyan-300" />
                  <h1 className="text-sm font-black tracking-[0.28em] uppercase text-white font-serif">CREATE OFFER</h1>
                  <Sparkles className="h-4 w-4 text-cyan-300" />
                </div>

                {/* Stepper */}
                <div className="mt-6 flex items-center">
                  {STEPS.map((s, i) => {
                    const active = stepIndex === i;
                    const done = stepIndex > i;
                    return (
                      <div key={s} className={`flex items-center ${i > 0 ? "flex-1" : ""}`}>
                        {i > 0 && <span className={`mx-2 sm:mx-3 h-px flex-1 ${done ? "bg-cyan-400/60" : "bg-white/[0.12]"}`} />}
                        <div className="flex items-center gap-2">
                          <div className={`relative flex h-8 w-8 items-center justify-center rounded-full border font-black text-[11px] transition-all ${active ? "border-cyan-400/80 bg-gradient-to-b from-cyan-500/40 to-purple-600/30 text-white shadow-[0_0_16px_rgba(0,229,255,0.4)]" : done ? "border-cyan-400/30 bg-cyan-500/15 text-cyan-200" : "border-white/[0.12] bg-white/[0.04] text-gray-500"}`}>
                            {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-[0.16em] ${active ? "text-cyan-200" : done ? "text-cyan-300/80" : "text-gray-500"}`}>{s}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 border-t border-white/[0.08] pt-5">
                  <AnimatePresence mode="wait">
                    {/* STEP 1 — SERVICE */}
                    {step === "service" && (
                      <motion.div key="s1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }} className="flex max-h-[46vh] flex-col gap-3 overflow-y-auto pr-1">
                        {AION_CATEGORIES.filter((c) => grouped[c]?.length).map((cat) => (
                          <div key={cat}>
                            <p className="mb-2 text-[8px] font-black tracking-[0.22em] uppercase text-gray-400">{cat}</p>
                            <div className="flex flex-col gap-1.5">
                              {grouped[cat].map((svc) => {
                                const isActive = sel?.id === svc.id;
                                return (
                                  <button key={svc.id} type="button" onClick={() => setSel(svc)} className={`group relative flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all ${isActive ? "border-cyan-400/60 bg-white/[0.09] shadow-[0_0_16px_rgba(0,229,255,0.14)]" : "border-transparent hover:border-white/[0.1] hover:bg-white/[0.04]"}`}>
                                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${isActive ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-300" : "border-white/[0.1] bg-white/[0.03] text-gray-400"} transition-colors`}>
                                      <Package className="h-4 w-4" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                      <span className={`block text-[12px] font-bold ${isActive ? "text-white" : "text-gray-300"}`}>{svc.name}</span>
                                      <span className="block truncate text-[9px] text-gray-500">{svc.description}</span>
                                    </span>
                                    <span className="shrink-0 rounded bg-black/30 px-2 py-1 text-[10px] font-black text-cyan-300">{formatUsd(svc.basePriceUsd)}/pc</span>
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
                        {/* selected summary */}
                        <div className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5">
                          <span className="text-[11px] font-bold text-gray-300">{sel.name}</span>
                          <span className="text-[10px] font-black text-cyan-300">{formatUsd(sel.basePriceUsd)}/pc</span>
                        </div>

                        {/* Quantity stepper */}
                        <div>
                          <p className="mb-2 text-[8px] font-black tracking-[0.22em] uppercase text-gray-400">Quantity</p>
                          <div className="flex items-center justify-center gap-4 rounded-lg border border-white/[0.1] bg-white/[0.03] px-4 py-3">
                            <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] border border-white/[0.12] text-lg font-black text-gray-200 transition-all hover:border-white/25 hover:text-white cursor-pointer">-</button>
                            <span className="w-16 text-center text-lg font-black tabular-nums text-white">{qty}</span>
                            <button type="button" onClick={() => setQty(Math.min(100, qty + 1))} className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] border border-white/[0.12] text-lg font-black text-gray-200 transition-all hover:border-white/25 hover:text-white cursor-pointer">+</button>
                          </div>
                        </div>

                        {/* Speed select */}
                        <div>
                          <p className="mb-2 text-[8px] font-black tracking-[0.22em] uppercase text-gray-400">Speed</p>
                          <div className="relative">
                            <button type="button" onClick={() => { setSpeedOpen(!speedOpen); setPaymentOpen(false); }} className="flex w-full items-center justify-between rounded-lg border border-white/[0.12] bg-white/[0.04] px-3 py-3 text-[12px] font-bold text-gray-200 transition-all hover:border-cyan-400/40 hover:bg-white/[0.07] cursor-pointer">
                              <span className="flex items-center gap-2"><Zap className="h-4 w-4 text-cyan-300" /> {speed}</span>
                              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${speedOpen ? "rotate-180" : ""}`} />
                            </button>
                            <AnimatePresence>
                              {speedOpen && (
                                <motion.div initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.97 }} transition={{ duration: 0.16 }} className="absolute top-full left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border border-white/[0.14] bg-[#0d1026] shadow-2xl">
                                  {speeds.map((s) => (
                                    <button key={s} type="button" onClick={() => { setSpeed(s); setSpeedOpen(false); }} className={`flex w-full items-center justify-between px-3 py-2.5 text-[11px] font-bold transition-colors cursor-pointer ${speed === s ? "bg-cyan-500/15 text-cyan-300" : "text-gray-300 hover:bg-white/[0.06]"}`}>
                                      {s} {speed === s && <Check className="h-3.5 w-3.5" />}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        {/* Payment select */}
                        <div>
                          <p className="mb-2 text-[8px] font-black tracking-[0.22em] uppercase text-gray-400">Payment</p>
                          <div className="relative">
                            <button type="button" onClick={() => { setPaymentOpen(!paymentOpen); setSpeedOpen(false); }} className="flex w-full items-center justify-between rounded-lg border border-white/[0.12] bg-white/[0.04] px-3 py-3 text-[12px] font-bold text-gray-200 transition-all hover:border-cyan-400/40 hover:bg-white/[0.07] cursor-pointer">
                              <span className="flex items-center gap-2">
                                <Coins className={`h-4 w-4 ${payment === "kinah" ? "text-amber-400" : "text-emerald-400"}`} />
                                {payment === "kinah" ? "Kinah (In-Game Gold)" : "Real Money (Cash)"}
                              </span>
                              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${paymentOpen ? "rotate-180" : ""}`} />
                            </button>
                            <AnimatePresence>
                              {paymentOpen && (
                                <motion.div initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.97 }} transition={{ duration: 0.16 }} className="absolute top-full left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border border-white/[0.14] bg-[#0d1026] shadow-2xl">
                                  <button type="button" onClick={() => { setPayment("kinah"); setPaymentOpen(false); }} className={`flex w-full items-center gap-2 px-3 py-2.5 text-[11px] font-bold transition-colors cursor-pointer ${payment === "kinah" ? "bg-cyan-500/15 text-cyan-300" : "text-gray-300 hover:bg-white/[0.06]"}`}><Coins className="h-4 w-4 text-amber-400" /> Kinah (In-Game Gold)</button>
                                  <button type="button" onClick={() => { setPayment("cash"); setPaymentOpen(false); }} className={`flex w-full items-center gap-2 px-3 py-2.5 text-[11px] font-bold transition-colors cursor-pointer ${payment === "cash" ? "bg-cyan-500/15 text-cyan-300" : "text-gray-300 hover:bg-white/[0.06]"}`}><Coins className="h-4 w-4 text-emerald-400" /> Real Money (Cash)</button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 3 — CONFIRM */}
                    {step === "confirm" && sel && (
                      <motion.div key="s3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }} className="flex flex-col gap-3.5">
                        {[
                          ["SERVICE", sel.name],
                          ["QUANTITY", `${qty} ${sel.priceUnit || "runs"}`],
                          ["PAYMENT", payment === "cash" ? "Real Money (Cash)" : "Kinah (In-Game Gold)"],
                          ["SPEED", speed],
                          ["TOTAL", payment === "cash" ? formatUsd(price * qty) : `${price * qty}K KINAH`],
                        ].map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2.5">
                            <span className="text-[9px] font-black tracking-[0.2em] uppercase text-gray-500">{k}</span>
                            <span className={`text-[12px] font-black ${k === "TOTAL" ? "text-cyan-300" : "text-white"}`}>{v}</span>
                          </div>
                        ))}
                        <p className="text-[9px] text-gray-500">Review your offer. Publishing broadcasts it to the Aion 2 lobby.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Actions */}
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/[0.08] pt-5">
                  {step === "service" ? (
                    <a href="/aion2" className="rounded-lg border border-white/[0.12] bg-transparent px-4 py-2.5 text-[10px] font-bold text-gray-400 transition-all hover:border-white/25 hover:text-white cursor-pointer">Cancel</a>
                  ) : (
                    <button type="button" onClick={() => { setSpeedOpen(false); setPaymentOpen(false); setStep(STEPS[stepIndex - 1]); }} className="flex items-center gap-2 rounded-lg border border-white/[0.12] bg-transparent px-4 py-2.5 text-[10px] font-bold text-gray-400 transition-all hover:border-white/25 hover:text-white cursor-pointer">
                      <ChevronLeft className="h-3.5 w-3.5" /> Back
                    </button>
                  )}
                  {step !== "confirm" ? (
                    <button type="button" onClick={() => setStep(STEPS[stepIndex + 1])} disabled={!canNext} className={`flex items-center gap-2 rounded-lg px-6 py-2.5 text-[10px] font-black tracking-[0.15em] uppercase transition-all ${canNext ? "bg-cyan-500/15 border border-cyan-400/50 text-cyan-200 shadow-[0_0_16px_rgba(0,229,255,0.12)] hover:bg-cyan-500/25 cursor-pointer" : "border border-white/[0.08] bg-white/[0.04] text-gray-600 cursor-not-allowed"}`}>Next <ArrowRight className="h-3.5 w-3.5" /></button>
                  ) : (
                    <button type="button" onClick={handlePublish} className="relative flex items-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-[#074f7b] via-[#41389f] to-[#7923aa] px-7 py-2.5 text-[10px] font-black tracking-[0.15em] uppercase text-white shadow-[0_0_30px_rgba(90,120,255,0.5)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_44px_rgba(90,120,255,0.8)] cursor-pointer">
                      <Send className="h-3.5 w-3.5" /> Publish Offer
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}