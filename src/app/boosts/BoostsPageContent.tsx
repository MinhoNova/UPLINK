"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { TrendingUp, Coins, Loader2, Plus } from "lucide-react";
import { DUNGEONS } from "@/lib/dungeonAssets";

type Bid = {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  message: string;
  createdAt: number;
};

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

export default function BoostsPageContent() {
  const { data: session, status } = useSession();
  const [requests, setRequests] = useState<BoostRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [biddingRequestId, setBiddingRequestId] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState(0);
  const [bidMsg, setBidMsg] = useState("");
  const [bidLoading, setBidLoading] = useState(false);

  const currentUserId = (session?.user as any)?.id || "";

  const fetchRequests = () => {
    fetch("/api/boost-requests")
      .then((r) => r.json())
      .then((d) => { setRequests(d.requests || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, []);

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
    if (res.ok) fetchRequests();
    else { const d = await res.json(); alert(d.error || "Failed"); }
  };

  const handleCancel = async (requestId: string) => {
    await fetch("/api/boost-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel", requestId }),
    });
    fetchRequests();
  };

  const myRequests = requests.filter((r) => String(r.userId) === String(currentUserId));
  const openRequests = requests.filter((r) => r.status === "open");

  const factionEmoji = (f: string | null) => {
    if (f === "horde") return <img src="/assets/Horde.svg" alt="Horde" className="w-3.5 h-3.5 inline opacity-70" />;
    if (f === "alliance") return <img src="/assets/Alliance.svg" alt="Alliance" className="w-3.5 h-3.5 inline opacity-70" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center mb-4">
            <TrendingUp className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-[0.2em] mb-2">Boost Requests</h1>
          <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-5">Gold-only marketplace • Find or offer boost contracts</p>
          <a href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-widest hover:from-amber-500/30 hover:to-orange-500/30 transition-all">
            <Plus className="w-4 h-4" /> New Request
          </a>
        </motion.div>

        {/* My Requests */}
        {currentUserId && myRequests.length > 0 && (
          <div className="mb-10">
            <h2 className="text-sm font-black text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Coins className="w-4 h-4" /> My Requests
            </h2>
            <div className="space-y-2">
              {myRequests.map((r) => (
                <div key={r.id} className="p-4 rounded-2xl bg-white/[0.03] border border-amber-500/20">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-black text-white">
                        {r.faction && factionEmoji(r.faction)} {r.type === "leveling" ? `Leveling ${r.startLevel}→${r.endLevel}` : `${r.dungeonName} +${r.keyLevel}`}
                      </p>
                      <p className="text-[10px] text-gray-500">{r.budget}K Gold {r.status !== "open" ? `• ${r.status}` : ""}</p>
                    </div>
                    {r.status === "open" && (
                      <button onClick={() => handleCancel(r.id)} className="text-[9px] text-gray-600 hover:text-red-400 font-black uppercase tracking-widest">Cancel</button>
                    )}
                  </div>
                  {r.bids.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
                      <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Bids ({r.bids.length})</p>
                      {r.bids.map((b) => (
                        <div key={b.id} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02]">
                          <div>
                            <p className="text-[11px] font-black">{b.userName}</p>
                            <p className="text-[8px] text-gray-500">{b.message}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-green-400">{b.amount}K</p>
                            {r.status === "open" && (
                              <button onClick={() => handleAccept(r.id, b.id)} className="text-[8px] font-black text-[#00ffff] uppercase tracking-widest hover:underline">Accept</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Open Requests — Auction Style */}
        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" /> Open Requests ({openRequests.length})
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          </div>
        ) : openRequests.length === 0 ? (
          <div className="text-center py-20">
            <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-black text-gray-500">No Open Requests</p>
            <p className="text-[11px] text-gray-600 mt-1">Check back later for new boost contracts.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {openRequests.map((r) => {
              const isOwn = String(r.userId) === String(currentUserId);
              const canBid = !isOwn && !!currentUserId;
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-amber-500/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {r.faction && (
                          <img
                            src={`/assets/${r.faction === "horde" ? "Horde" : "Alliance"}.svg`}
                            alt={r.faction}
                            className="w-4 h-4 opacity-60 shrink-0"
                          />
                        )}
                        <p className="text-base font-black text-white truncate">
                          {r.type === "leveling"
                            ? `Leveling ${r.startLevel} → ${r.endLevel}`
                            : `${r.dungeonName} +${r.keyLevel}`}
                        </p>
                      </div>
                      <p className="text-[10px] text-gray-500">
                        by <span className="text-gray-400 font-bold">{r.userName}</span>
                        {r.notes ? ` • ${r.notes}` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-black text-yellow-400">{r.budget}K</p>
                      <p className="text-[7px] font-black text-yellow-400/60 uppercase tracking-widest">Gold</p>
                    </div>
                  </div>

                  {/* Bids Section */}
                  {r.bids.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5">
                      <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">
                        Current Bids ({r.bids.length})
                      </p>
                      {r.bids.map((b) => (
                        <div key={b.id} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02]">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center shrink-0">
                              <span className="text-[8px] font-black text-amber-400">{b.userName.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-black text-white truncate">{b.userName}</p>
                              {b.message && <p className="text-[8px] text-gray-500 truncate">{b.message}</p>}
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <p className="text-sm font-black text-green-400">{b.amount}K</p>
                            {isOwn && (
                              <button
                                onClick={() => handleAccept(r.id, b.id)}
                                className="text-[8px] font-black text-[#00ffff] uppercase tracking-widest hover:underline"
                              >
                                Accept
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Bid Form */}
                  {canBid && biddingRequestId === r.id ? (
                    <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                      <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Your bid (K Gold)</p>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setBidAmount(Math.max(1, bidAmount - 5))} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg text-white font-black hover:bg-white/10">−</button>
                        <span className="text-xl font-black text-[#00ffff] tabular-nums w-16 text-center">{bidAmount}K</span>
                        <button onClick={() => setBidAmount(bidAmount + 5)} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg text-white font-black hover:bg-white/10">+</button>
                      </div>
                      <input
                        value={bidMsg}
                        onChange={(e) => setBidMsg(e.target.value)}
                        placeholder="Message (optional)"
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#00ffff]/50 placeholder:text-gray-600"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => setBiddingRequestId(null)} className="flex-1 py-2 rounded-lg bg-white/5 text-gray-400 text-[9px] font-black uppercase tracking-widest hover:bg-white/10">Cancel</button>
                        <button disabled={bidLoading || bidAmount <= 0} onClick={() => handleBid(r.id)} className="flex-1 py-2 rounded-lg bg-gradient-to-r from-[#00ffff] to-[#ff007f] text-black text-[9px] font-black uppercase tracking-widest disabled:opacity-40 hover:opacity-90 transition">
                          {bidLoading ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "Place Bid"}
                        </button>
                      </div>
                    </div>
                  ) : canBid ? (
                    <button
                      onClick={() => { setBiddingRequestId(r.id); setBidAmount(r.budget); setBidMsg(""); }}
                      className="mt-3 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00ffff]/10 to-[#ff007f]/10 border border-[#00ffff]/20 text-[#00ffff] text-[10px] font-black uppercase tracking-widest hover:bg-[#00ffff]/20 transition"
                    >
                      Place Bid
                    </button>
                  ) : null}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
