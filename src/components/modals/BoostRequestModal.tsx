"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Coins, ChevronLeft, Check, Loader2, TrendingUp, Sword, Shield } from "lucide-react";
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

const STEPS = ["type", "details", "budget", "done"] as const;

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
  const [requests, setRequests] = useState<BoostRequest[]>([]);
  const [tab, setTab] = useState<"create" | "browse">("create");
  const [biddingRequestId, setBiddingRequestId] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState(0);
  const [bidMsg, setBidMsg] = useState("");
  const [bidLoading, setBidLoading] = useState(false);

  const fetchRequests = () => {
    fetch("/api/boost-requests")
      .then((r) => r.json())
      .then((d) => setRequests(d.requests || []))
      .catch(() => {});
  };

  useEffect(() => {
    if (isOpen) {
      fetchRequests();
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
      setTab("create");
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
        fetchRequests();
      } else {
        alert(data.error || "Failed to create request");
      }
    } catch {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleBid = async (requestId: string) => {
    if (bidAmount <= 0) return;
    setBidLoading(true);
    try {
      const res = await fetch("/api/boost-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bid", requestId, amount: bidAmount, message: bidMsg }),
      });
      const data = await res.json();
      if (res.ok) {
        setBiddingRequestId(null);
        setBidAmount(0);
        setBidMsg("");
        fetchRequests();
      } else {
        alert(data.error || "Failed to place bid");
      }
    } catch {
      alert("Network error");
    } finally {
      setBidLoading(false);
    }
  };

  const handleAccept = async (requestId: string, bidId: string) => {
    const res = await fetch("/api/boost-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept", requestId, bidId }),
    });
    const data = await res.json();
    if (res.ok) fetchRequests();
    else alert(data.error || "Failed to accept bid");
  };

  const handleCancel = async (requestId: string) => {
    const res = await fetch("/api/boost-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel", requestId }),
    });
    if (res.ok) fetchRequests();
  };

  const myOpenRequests = requests.filter((r) => String(r.userId) === String(currentUserId) && r.status === "open");
  const openRequests = requests.filter((r) => r.status === "open" && String(r.userId) !== String(currentUserId));
  const myPastRequests = requests.filter((r) => String(r.userId) === String(currentUserId) && r.status !== "open");

  const clampStartLevel = (val: number) => Math.max(1, Math.min(val, endLevel - 1));
  const clampEndLevel = (val: number) => Math.max(startLevel + 1, Math.min(val, 90));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-gradient-to-br from-[#0a0a16] to-black border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Boost Request</h2>
            <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Find a booster — gold only</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 px-4 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setTab("create")}
            className={`text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-t-xl transition ${tab === "create" ? "text-amber-400 border-b-2 border-amber-400" : "text-gray-500"}`}
          >
            New Request
          </button>
          <button
            type="button"
            onClick={() => { setTab("browse"); fetchRequests(); }}
            className={`text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-t-xl transition ${tab === "browse" ? "text-amber-400 border-b-2 border-amber-400" : "text-gray-500"}`}
          >
            Browse {openRequests.length > 0 ? `(${openRequests.length})` : ""}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          {tab === "create" ? (
            step === 0 ? (
              /* Step 1: Choose type */
              <div className="space-y-3">
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">What do you need?</p>
                <button
                  type="button"
                  onClick={() => { setType("leveling"); setStep(1); }}
                  className={`w-full p-4 rounded-2xl border text-left transition ${
                    type === "leveling" ? "border-[#00ffff]/60 bg-[#00ffff]/10" : "border-white/10 bg-white/[0.03] hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">Power Leveling</p>
                      <p className="text-[9px] text-gray-500">1–90 • Horde or Alliance</p>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => { setType("dungeon"); setStep(1); }}
                  className={`w-full p-4 rounded-2xl border text-left transition ${
                    type === "dungeon" ? "border-[#00ffff]/60 bg-[#00ffff]/10" : "border-white/10 bg-white/[0.03] hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 border border-purple-500/30 flex items-center justify-center">
                      <Sword className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">Mythic+ Dungeon</p>
                      <p className="text-[9px] text-gray-500">Any key level & dungeon</p>
                    </div>
                  </div>
                </button>
              </div>
            ) : step === 1 ? (
              /* Step 2: Details */
              <div className="space-y-4">
                <button type="button" onClick={() => setStep(0)} className="flex items-center gap-1 text-[9px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition">
                  <ChevronLeft className="w-3 h-3" /> Back
                </button>

                {type === "leveling" ? (
                  <>
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Choose your faction</p>
                    <div className="grid grid-cols-2 gap-3">
                      {(["horde", "alliance"] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setFaction(f)}
                          className={`p-3 rounded-2xl border text-center transition ${
                            faction === f ? "border-[#00ffff]/60 bg-[#00ffff]/10 shadow-[0_0_20px_rgba(0,255,255,0.1)]" : "border-white/10 bg-white/[0.03] hover:border-white/20"
                          }`}
                        >
                          <img
                            src={`/assets/${f === "horde" ? "Horde" : "Alliance"}.svg`}
                            alt={f}
                            className="w-10 h-10 mx-auto mb-1 opacity-80"
                          />
                          <p className={`text-[10px] font-black uppercase tracking-widest ${faction === f ? "text-[#00ffff]" : "text-gray-400"}`}>
                            {f === "horde" ? "Horde" : "Alliance"}
                          </p>
                        </button>
                      ))}
                    </div>

                    <div>
                      <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">From level</p>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setStartLevel(clampStartLevel(startLevel - 1))} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg text-white font-black hover:bg-white/10">−</button>
                        <input
                          type="number"
                          value={startLevel}
                          onChange={(e) => setStartLevel(clampStartLevel(Number(e.target.value) || 1))}
                          className="w-16 text-center text-lg font-black text-[#00d4ff] tabular-nums bg-black/50 border border-white/10 rounded-lg px-2 py-1 outline-none focus:border-[#00ffff]/50"
                          min={1}
                          max={89}
                        />
                        <button onClick={() => setStartLevel(clampStartLevel(startLevel + 1))} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg text-white font-black hover:bg-white/10">+</button>
                      </div>
                    </div>

                    <div>
                      <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">To level</p>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setEndLevel(clampEndLevel(endLevel - 1))} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg text-white font-black hover:bg-white/10">−</button>
                        <input
                          type="number"
                          value={endLevel}
                          onChange={(e) => setEndLevel(clampEndLevel(Number(e.target.value) || 1))}
                          className="w-16 text-center text-lg font-black text-[#ff007f] tabular-nums bg-black/50 border border-white/10 rounded-lg px-2 py-1 outline-none focus:border-[#ff007f]/50"
                          min={2}
                          max={90}
                        />
                        <button onClick={() => setEndLevel(clampEndLevel(endLevel + 1))} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg text-white font-black hover:bg-white/10">+</button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Select dungeon</p>
                    <div className="grid grid-cols-3 gap-2 max-h-[240px] overflow-y-auto custom-scrollbar">
                      {(DUNGEONS || []).map((d) => (
                        <button
                          key={d.name}
                          type="button"
                          onClick={() => setDungeonName(d.name)}
                          className={`p-2 rounded-xl border text-center transition ${
                            dungeonName === d.name ? "border-[#00ffff]/60 bg-[#00ffff]/10" : "border-white/10 bg-white/[0.03] hover:border-white/20"
                          }`}
                        >
                          {d.img && <img src={d.img} alt={d.name} className="w-10 h-10 mx-auto mb-1 rounded-lg object-cover" />}
                          <p className={`text-[7px] font-black uppercase tracking-wider truncate ${dungeonName === d.name ? "text-[#00ffff]" : "text-gray-400"}`}>{d.short || d.name}</p>
                        </button>
                      ))}
                    </div>

                    <div>
                      <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Key level</p>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setKeyLevel(Math.max(2, keyLevel - 1))} className="w-8 h-8 flex items-center justify-center bg-[#ff007f]/20 rounded-lg text-white font-black hover:bg-[#ff007f]/30">−</button>
                        <span className="text-lg font-black text-[#00d4ff] tabular-nums w-12 text-center">{keyLevel}</span>
                        <button onClick={() => setKeyLevel(Math.min(40, keyLevel + 1))} className="w-8 h-8 flex items-center justify-center bg-[#00ffff]/20 rounded-lg text-black font-black hover:bg-[#00ffff]/30">+</button>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Notes (optional)</p>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Warlock preferred, have own key, etc."
                    rows={2}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-500/50 resize-none placeholder:text-gray-600"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={type === "leveling" && !faction}
                  className="w-full py-3 bg-gradient-to-r from-[#00ffff] to-[#ff007f] text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:opacity-90 disabled:opacity-40 transition"
                >
                  Continue to Budget
                </button>
              </div>
            ) : step === 2 ? (
              /* Step 3: Budget — gold only */
              <div className="space-y-4">
                <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1 text-[9px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition">
                  <ChevronLeft className="w-3 h-3" /> Back
                </button>

                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Your budget (gold)</p>
                <p className="text-[8px] text-gray-600">Boosters will bid on your request. Set a starting budget in gold.</p>

                <div className="flex items-center gap-3 justify-center">
                  <button onClick={() => setBudget(Math.max(1, budget - 10))} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl text-white font-black hover:bg-white/10">−</button>
                  <div className="text-center">
                    <span className="text-2xl font-black text-yellow-400 tabular-nums">{budget}</span>
                    <p className="text-[8px] font-black text-yellow-400/60 uppercase tracking-widest">K Gold</p>
                  </div>
                  <button onClick={() => setBudget(budget + 10)} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl text-white font-black hover:bg-white/10">+</button>
                </div>

                <div className="flex gap-2 flex-wrap justify-center">
                  {[10, 25, 50, 100, 200, 500].map((v) => (
                    <button key={v} type="button" onClick={() => setBudget(v)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition ${
                      budget === v ? "bg-yellow-400/20 text-yellow-400 border border-yellow-400/40" : "bg-white/5 text-gray-500 border border-white/10 hover:border-white/20"
                    }`}>{v}K</button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={loading || budget <= 0}
                  onClick={handleCreate}
                  className="w-full py-3.5 rounded-xl font-black uppercase text-[11px] tracking-widest transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {loading ? "Posting..." : `Post Request — ${budget}K Gold`}
                </button>
              </div>
            ) : (
              /* Step 4: Done */
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-lg font-black text-white">Request Posted!</p>
                <p className="text-[10px] text-gray-500">Boosters will see your request and place bids.</p>
                {createdRequest && (
                  <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 text-left space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {createdRequest.type === "leveling"
                        ? `Leveling ${createdRequest.startLevel}→${createdRequest.endLevel}`
                        : `${createdRequest.dungeonName} +${createdRequest.keyLevel}`}
                    </p>
                    <p className="text-sm font-black text-amber-400">{createdRequest.budget}K Gold</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => { setTab("browse"); fetchRequests(); }}
                  className="w-full py-3 rounded-xl bg-white/5 text-gray-400 font-black uppercase text-[10px] tracking-widest hover:bg-white/10 hover:text-white transition"
                >
                  Browse Other Requests
                </button>
              </div>
            )
          ) : (
            /* Browse Tab */
            <div className="space-y-3">
              {myOpenRequests.length > 0 && (
                <div>
                  <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-2">Your Open Requests</p>
                  {myOpenRequests.map((r) => (
                    <div key={r.id} className="p-4 rounded-2xl bg-white/[0.03] border border-amber-500/20 mb-2">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-xs font-black text-white">
                            {r.type === "leveling" ? `Leveling ${r.startLevel}→${r.endLevel}` : `${r.dungeonName} +${r.keyLevel}`}
                          </p>
                          <p className="text-[9px] font-black text-amber-400">{r.budget}K Gold</p>
                        </div>
                        <button type="button" onClick={() => handleCancel(r.id)} className="text-[8px] text-gray-600 hover:text-red-400 font-black uppercase tracking-widest">Cancel</button>
                      </div>
                      {r.bids.length > 0 && (
                        <div className="space-y-1.5 mt-2 pt-2 border-t border-white/5">
                          <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Bids ({r.bids.length})</p>
                          {r.bids.map((b) => (
                            <div key={b.id} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/[0.02]">
                              <div>
                                <p className="text-[10px] font-black text-white">{b.userName}</p>
                                <p className="text-[8px] text-gray-500">{b.message}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs font-black text-green-400">{b.amount}K</p>
                                <button
                                  type="button"
                                  onClick={() => handleAccept(r.id, b.id)}
                                  className="text-[8px] font-black text-[#00ffff] uppercase tracking-widest hover:underline"
                                >
                                  Accept
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {r.bids.length === 0 && (
                        <p className="text-[8px] text-gray-600 italic">No bids yet</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Open Requests</p>
              {openRequests.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="w-10 h-10 text-gray-600 mx-auto mb-3 opacity-40" />
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">No open requests</p>
                </div>
              ) : (
                openRequests.map((r) => (
                  <div key={r.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        {r.faction && (
                          <img
                            src={`/assets/${r.faction === "horde" ? "Horde" : "Alliance"}.svg`}
                            alt={r.faction}
                            className="w-4 h-4 opacity-60"
                          />
                        )}
                        <p className="text-xs font-black text-white">
                          {r.type === "leveling" ? `Leveling ${r.startLevel}→${r.endLevel}` : `${r.dungeonName} +${r.keyLevel}`}
                        </p>
                      </div>
                      <p className="text-xs font-black text-amber-400">{r.budget}K</p>
                    </div>
                    <p className="text-[9px] text-gray-500 mb-2">by {r.userName}{r.notes ? ` • ${r.notes}` : ""}</p>

                    {biddingRequestId === r.id ? (
                      <div className="space-y-2 mt-2 pt-2 border-t border-white/5">
                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Your bid (K Gold)</p>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setBidAmount(Math.max(1, bidAmount - 5))} className="w-7 h-7 flex items-center justify-center bg-white/5 rounded-lg text-white font-black">−</button>
                          <span className="text-base font-black text-[#00ffff] tabular-nums w-16 text-center">{bidAmount}K</span>
                          <button onClick={() => setBidAmount(bidAmount + 5)} className="w-7 h-7 flex items-center justify-center bg-white/5 rounded-lg text-white font-black">+</button>
                        </div>
                        <input
                          value={bidMsg}
                          onChange={(e) => setBidMsg(e.target.value)}
                          placeholder="Message (optional)"
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#00ffff]/50 placeholder:text-gray-600"
                        />
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setBiddingRequestId(null)} className="flex-1 py-2 rounded-lg bg-white/5 text-gray-400 text-[9px] font-black uppercase tracking-widest">Cancel</button>
                          <button type="button" disabled={bidLoading || bidAmount <= 0} onClick={() => handleBid(r.id)} className="flex-1 py-2 rounded-lg bg-gradient-to-r from-[#00ffff] to-[#ff007f] text-black text-[9px] font-black uppercase tracking-widest disabled:opacity-40">
                            {bidLoading ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "Place Bid"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setBiddingRequestId(r.id); setBidAmount(r.budget); setBidMsg(""); }}
                        className="w-full py-2 rounded-lg bg-gradient-to-r from-[#00ffff]/10 to-[#ff007f]/10 border border-[#00ffff]/20 text-[#00ffff] text-[9px] font-black uppercase tracking-widest hover:bg-[#00ffff]/20 transition"
                      >
                        Place Bid
                      </button>
                    )}
                  </div>
                ))
              )}

              {myPastRequests.length > 0 && (
                <div className="mt-4">
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2">Past Requests</p>
                  {myPastRequests.map((r) => (
                    <div key={r.id} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 mb-1 opacity-60">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-white">
                          {r.type === "leveling" ? `Leveling ${r.startLevel}→${r.endLevel}` : `${r.dungeonName} +${r.keyLevel}`}
                        </p>
                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{r.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
