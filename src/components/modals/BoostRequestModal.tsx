"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, Check, Loader2, TrendingUp, Sword, Shield, Coins, Zap, Send, ScrollText } from "lucide-react";
import { DUNGEONS } from "@/lib/dungeonAssets";

type BoostRequest = {
  id: string;
  userId: string;
  userName: string;
  type: "leveling" | "dungeon";
  faction: "horde" | "alliance" | null;
  startLevel: number | null;
  endLevel: number | null;
  dungeonName: string | null;
  keyLevel: number | null;
  budget: number;
  budgetCurrency: "gold";
  notes: string;
  status: "open" | "accepted" | "closed";
  bids: Bid[];
  acceptedBidId: string | null;
  createdAt: number;
};

type Bid = {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  message: string;
  createdAt: number;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  userName: string;
};

export default function BoostRequestModal({ isOpen, onClose, currentUserId, userName }: Props) {
  const [step, setStep] = useState<number>(0);
  const [type, setType] = useState<"leveling" | "dungeon" | null>(null);
  const [faction, setFaction] = useState<"horde" | "alliance" | null>(null);
  const [startLevel, setStartLevel] = useState(1);
  const [endLevel, setEndLevel] = useState(70);
  const [dungeonName, setDungeonName] = useState("");
  const [keyLevel, setKeyLevel] = useState(2);
  const [budget, setBudget] = useState(50);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdRequest, setCreatedRequest] = useState<BoostRequest | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setType(null);
      setFaction(null);
      setStartLevel(1);
      setEndLevel(70);
      setDungeonName("");
      setKeyLevel(2);
      setBudget(50);
      setNotes("");
      setCreatedRequest(null);
    }
  }, [isOpen]);

  const handleCreate = async () => {
    if (!type) return;
    setLoading(true);
    try {
      const body: any = { action: "create", type, budget, notes };
      if (type === "leveling") {
        body.faction = faction;
        body.startLevel = startLevel;
        body.endLevel = endLevel;
      } else {
        body.dungeonName = dungeonName;
        body.keyLevel = keyLevel;
      }
      const res = await fetch("/api/boost-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setCreatedRequest(data.request);
        setStep(3);
      } else {
        alert(data.error || "Failed to create request");
      }
    } catch {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  const clampStartLevel = (val: number) => Math.max(1, Math.min(val, endLevel - 1));
  const clampEndLevel = (val: number) => Math.max(startLevel + 1, Math.min(val, 90));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 30 }}
        className="w-full max-w-xl bg-gradient-to-br from-[#0a0a16] via-[#0d0d1a] to-black border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-7 py-5 border-b border-white/5 flex items-center gap-4 shrink-0 bg-gradient-to-r from-[#0a0a16] to-[#0f0f1e]">
          <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/10 blur-[80px] rounded-full -translate-x-12 -translate-y-12 pointer-events-none" />
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center relative z-10 shadow-[0_0_20px_rgba(251,191,36,0.15)]">
            <TrendingUp className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1 relative z-10">
            <h2 className="text-base font-black text-white uppercase tracking-[0.15em]">Boost Request</h2>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em]">Set your terms — boosters bid for your run</p>
          </div>
          <button type="button" onClick={onClose} className="relative z-10 p-2 hover:bg-white/5 rounded-xl transition-colors">
            <X className="w-4 h-4 text-gray-500 hover:text-white transition-colors" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1.5 px-7 pt-4 pb-2">
          {[0, 1, 2].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                s < step ? "bg-amber-500" : s === step ? "bg-amber-500/60" : "bg-white/10"
              }`}
            />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-7 py-4">
          <AnimatePresence mode="wait">
            {step === 0 ? (
              <motion.div key="type" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">What do you need?</p>

                <button type="button" onClick={() => { setType("leveling"); setStep(1); }}
                  className="group w-full p-5 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent hover:from-green-500/10 hover:border-green-500/40 text-left transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center group-hover:shadow-[0_0_25px_rgba(34,197,94,0.2)] transition-shadow">
                      <Shield className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-base font-black text-white group-hover:text-green-300 transition-colors">Power Leveling</p>
                      <p className="text-[10px] text-gray-500 font-bold mt-0.5">1–90 &bull; Horde or Alliance &bull; Any spec</p>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-gray-600 rotate-180 ml-auto group-hover:text-green-400/60 transition-colors" />
                  </div>
                </button>

                <button type="button" onClick={() => { setType("dungeon"); setStep(1); }}
                  className="group w-full p-5 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent hover:from-purple-500/10 hover:border-purple-500/40 text-left transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 border border-purple-500/30 flex items-center justify-center group-hover:shadow-[0_0_25px_rgba(168,85,247,0.2)] transition-shadow">
                      <Sword className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-base font-black text-white group-hover:text-purple-300 transition-colors">Mythic+ Dungeon</p>
                      <p className="text-[10px] text-gray-500 font-bold mt-0.5">Any key level &bull; Any dungeon &bull; Timer optional</p>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-gray-600 rotate-180 ml-auto group-hover:text-purple-400/60 transition-colors" />
                  </div>
                </button>
              </motion.div>
            ) : step === 1 ? (
              <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <button type="button" onClick={() => setStep(0)} className="flex items-center gap-1.5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] hover:text-white transition-colors">
                  <ChevronLeft className="w-3.5 h-3.5" /> Back
                </button>

                {type === "leveling" ? (
                  <>
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Choose your faction</p>
                      <div className="grid grid-cols-2 gap-3">
                        {(["horde", "alliance"] as const).map((f) => (
                          <button key={f} type="button" onClick={() => setFaction(f)}
                            className={`group p-4 rounded-2xl border text-center transition-all duration-300 ${
                              faction === f
                                ? "border-amber-500/60 bg-amber-500/10 shadow-[0_0_25px_rgba(251,191,36,0.15)]"
                                : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]"
                            }`}
                          >
                            <img src={`/assets/${f === "horde" ? "Horde" : "Alliance"}.svg`} alt={f} className="w-12 h-12 mx-auto mb-2 opacity-80 group-hover:opacity-100 transition-opacity" />
                            <p className={`text-[11px] font-black uppercase tracking-[0.15em] ${
                              faction === f ? "text-amber-400" : "text-gray-400 group-hover:text-white/80"
                            }`}>
                              {f === "horde" ? "Horde" : "Alliance"}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2.5">From level</p>
                        <div className="flex items-center gap-2 justify-center">
                          <button onClick={() => setStartLevel(clampStartLevel(startLevel - 1))} className="w-9 h-9 flex items-center justify-center bg-white/5 rounded-xl text-white font-black hover:bg-white/15 hover:text-amber-400 transition-all">−</button>
                          <input type="number" value={startLevel} onChange={(e) => setStartLevel(clampStartLevel(Number(e.target.value) || 1))}
                            className="w-16 text-center text-xl font-black text-amber-400 tabular-nums bg-black/50 border border-white/10 rounded-xl px-2 py-1.5 outline-none focus:border-amber-500/50"
                            min={1} max={89}
                          />
                          <button onClick={() => setStartLevel(clampStartLevel(startLevel + 1))} className="w-9 h-9 flex items-center justify-center bg-white/5 rounded-xl text-white font-black hover:bg-white/15 hover:text-amber-400 transition-all">+</button>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2.5">To level</p>
                        <div className="flex items-center gap-2 justify-center">
                          <button onClick={() => setEndLevel(clampEndLevel(endLevel - 1))} className="w-9 h-9 flex items-center justify-center bg-white/5 rounded-xl text-white font-black hover:bg-white/15 hover:text-amber-400 transition-all">−</button>
                          <input type="number" value={endLevel} onChange={(e) => setEndLevel(clampEndLevel(Number(e.target.value) || 1))}
                            className="w-16 text-center text-xl font-black text-amber-400 tabular-nums bg-black/50 border border-white/10 rounded-xl px-2 py-1.5 outline-none focus:border-amber-500/50"
                            min={2} max={90}
                          />
                          <button onClick={() => setEndLevel(clampEndLevel(endLevel + 1))} className="w-9 h-9 flex items-center justify-center bg-white/5 rounded-xl text-white font-black hover:bg-white/15 hover:text-amber-400 transition-all">+</button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Select dungeon</p>
                      <div className="grid grid-cols-4 gap-2.5 max-h-[240px] overflow-y-auto custom-scrollbar">
                        {(DUNGEONS || []).map((d) => (
                          <button key={d.name} type="button" onClick={() => setDungeonName(d.name)}
                            className={`group p-3 rounded-xl border text-center transition-all duration-200 ${
                              dungeonName === d.name
                                ? "border-amber-500/60 bg-amber-500/10 shadow-[0_0_20px_rgba(251,191,36,0.1)]"
                                : "border-white/10 bg-white/[0.03] hover:border-white/25"
                            }`}
                          >
                            {d.img && <img src={d.img} alt={d.name} className="w-10 h-10 mx-auto mb-1.5 rounded-lg object-cover group-hover:scale-105 transition-transform" />}
                            <p className={`text-[8px] font-black uppercase tracking-wider truncate ${
                              dungeonName === d.name ? "text-amber-400" : "text-gray-500 group-hover:text-white/70"
                            }`}>{d.short || d.name}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2.5">Key level</p>
                      <div className="flex items-center gap-3 justify-center">
                        <button onClick={() => setKeyLevel(Math.max(2, keyLevel - 1))} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl text-white font-black hover:bg-white/15 hover:text-amber-400 transition-all">−</button>
                        <div className="text-center">
                          <span className="text-2xl font-black text-amber-400 tabular-nums">+{keyLevel}</span>
                        </div>
                        <button onClick={() => setKeyLevel(Math.min(40, keyLevel + 1))} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl text-white font-black hover:bg-white/15 hover:text-amber-400 transition-all">+</button>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2.5">Notes <span className="text-gray-600 normal-case tracking-normal">(optional)</span></p>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Warlock preferred, have own key, voice required, etc."
                    rows={2}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500/50 focus:shadow-[0_0_20px_rgba(251,191,36,0.05)] resize-none placeholder:text-gray-600 transition-all"
                  />
                </div>

                <button type="button" onClick={() => setStep(2)} disabled={type === "leveling" && !faction}
                  className="group relative w-full py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 hover:from-amber-500/30 hover:to-orange-500/30 hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(251,191,36,0.15)]"
                >
                  <Coins className="w-4 h-4" />
                  Continue to Budget
                </button>
              </motion.div>
            ) : step === 2 ? (
              <motion.div key="budget" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1.5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] hover:text-white transition-colors">
                  <ChevronLeft className="w-3.5 h-3.5" /> Back
                </button>

                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Your budget <span className="text-amber-400">(gold)</span></p>
                <p className="text-[9px] text-gray-600 font-medium">Boosters will bid on your request. Set a starting budget in gold — higher offers get faster responses.</p>

                <div className="flex items-center gap-4 justify-center py-2">
                  <button onClick={() => setBudget(Math.max(1, budget - 10))} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl text-white font-black hover:bg-white/15 hover:text-amber-400 transition-all">−</button>
                  <div className="text-center">
                    <span className="text-3xl font-black text-amber-400 tabular-nums">{budget}</span>
                    <p className="text-[9px] font-black text-amber-500/60 uppercase tracking-[0.25em] mt-0.5">K Gold</p>
                  </div>
                  <button onClick={() => setBudget(budget + 10)} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl text-white font-black hover:bg-white/15 hover:text-amber-400 transition-all">+</button>
                </div>

                <div className="flex gap-2.5 flex-wrap justify-center">
                  {[10, 25, 50, 100, 200, 500].map((v) => (
                    <button key={v} type="button" onClick={() => setBudget(v)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-200 ${
                        budget === v
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_20px_rgba(251,191,36,0.1)]"
                          : "bg-white/5 text-gray-500 border border-white/10 hover:border-white/25 hover:text-white/70"
                      }`}
                    >{v}K</button>
                  ))}
                </div>

                <button type="button" disabled={loading || budget <= 0} onClick={handleCreate}
                  className="group relative w-full py-4 rounded-2xl font-black uppercase text-sm tracking-[0.25em] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white hover:shadow-[0_0_40px_rgba(251,191,36,0.3)] hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  )}
                  {loading ? "Posting..." : `Post Request — ${budget}K Gold`}
                </button>

                <p className="text-center text-[8px] text-gray-600 font-bold uppercase tracking-[0.15em]">No upfront payment &bull; Pay booster after completion</p>
              </motion.div>
            ) : (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8 space-y-5">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.15)]">
                  <Check className="w-10 h-10 text-green-400" />
                </div>
                <div>
                  <p className="text-xl font-black text-white">Request Posted!</p>
                  <p className="text-[11px] text-gray-500 font-bold mt-1.5">Boosters will see your request and place bids shortly.</p>
                </div>
                {createdRequest && (
                  <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl p-5 border border-amber-500/20 text-left space-y-1.5">
                    <p className="text-[10px] font-black text-amber-400/60 uppercase tracking-[0.15em]">
                      {createdRequest.type === "leveling"
                        ? `Leveling ${createdRequest.startLevel} → ${createdRequest.endLevel}`
                        : `${createdRequest.dungeonName} +${createdRequest.keyLevel}`}
                    </p>
                    <p className="text-lg font-black text-amber-400 flex items-center gap-2">
                      <Coins className="w-4 h-4" />
                      {createdRequest.budget}K Gold
                    </p>
                  </div>
                )}
                <button type="button" onClick={onClose}
                  className="w-full py-3.5 rounded-2xl bg-white/5 text-gray-400 font-black uppercase text-[10px] tracking-[0.2em] hover:bg-white/10 hover:text-white transition-all border border-white/5"
                >
                  Close
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
