"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  TrendingUp, Coins, Loader2, Plus, ImagePlus, X, Upload, Link2, Target
} from "lucide-react";
import { resolveVfxSrc, resolveVfxBannerUrl, resolveLobbyBannerBg } from "@/lib/vfxAssets";

type Bid = {
  id: string;
  userId: string;
  userName: string;
  userHandle?: string;
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
  customBg?: string;
  status: "open" | "accepted" | "closed";
  bids: Bid[];
  totalBids?: number;
  acceptedBidId: string | null;
  createdAt: number;
};

export default function BoostsPageContent() {
  const { data: session, status } = useSession();
  const [requests, setRequests] = useState<BoostRequest[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [biddingRequestId, setBiddingRequestId] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState(0);
  const [bidMsg, setBidMsg] = useState("");
  const [bidLoading, setBidLoading] = useState(false);
  const [bgPickerId, setBgPickerId] = useState<string | null>(null);
  const [bgCustomUrl, setBgCustomUrl] = useState("");
  const [bgSaving, setBgSaving] = useState(false);
  const bgPickerRef = useRef<HTMLDivElement>(null);

  const currentUserId = (session?.user as any)?.id || "";

  const fetchAll = () => {
    Promise.all([
      fetch("/api/boost-requests").then((r) => r.json()),
      fetch("/api/data").then((r) => r.json()),
    ]).then(([brData, data]) => {
      setRequests(brData.requests || []);
      setRegisteredUsers(data.registeredUsers || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close BG picker on outside click
  useEffect(() => {
    if (!bgPickerId) return;
    const close = (e: MouseEvent) => {
      if (bgPickerRef.current && !bgPickerRef.current.contains(e.target as Node)) {
        setBgPickerId(null);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [bgPickerId]);

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
        fetchAll();
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
    if (res.ok) fetchAll();
    else { const d = await res.json(); alert(d.error || "Failed"); }
  };

  const handleCancel = async (requestId: string) => {
    await fetch("/api/boost-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel", requestId }),
    });
    fetchAll();
  };

  const handleSetBg = async (requestId: string, url: string) => {
    if (!url) return;
    setBgSaving(true);
    const res = await fetch("/api/boost-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set-bg", requestId, url }),
    });
    if (res.ok) { setBgPickerId(null); setBgCustomUrl(""); fetchAll(); }
    setBgSaving(false);
  };

  const handleUploadBg = async (requestId: string, file: File) => {
    setBgSaving(true);
    const formData = new FormData();
    formData.append("action", "set-bg");
    formData.append("requestId", requestId);
    formData.append("file", file);
    const res = await fetch("/api/boost-requests", { method: "POST", body: formData });
    if (res.ok) { setBgPickerId(null); setBgCustomUrl(""); fetchAll(); }
    setBgSaving(false);
  };

  const myRequests = requests.filter((r) => String(r.userId) === String(currentUserId));
  const openRequests = requests.filter((r) => r.status === "open");

  const getOwnerUser = (r: BoostRequest) => registeredUsers.find((u) => String(u.id) === String(r.userId));
  const resolveBg = (r: BoostRequest) => {
    if (r.customBg) return r.customBg;
    const owner = getOwnerUser(r);
    if (owner?.activeVfx) return resolveLobbyBannerBg({}, owner, owner.activeVfx);
    return null;
  };

  const factionEmoji = (f: string | null) => {
    if (f === "horde") return <img src="/assets/Horde.svg" alt="Horde" className="w-3.5 h-3.5 inline opacity-70" />;
    if (f === "alliance") return <img src="/assets/Alliance.svg" alt="Alliance" className="w-3.5 h-3.5 inline opacity-70" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
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
            <div className="space-y-3">
              {myRequests.map((r) => (
                <BoostCard
                  key={r.id}
                  r={r}
                  isOwner
                  currentUserId={currentUserId}
                  bgUrl={resolveBg(r)}
                  bgPickerId={bgPickerId}
                  onOpenBgPicker={setBgPickerId}
                  onCloseBgPicker={() => setBgPickerId(null)}
                  onSelectVfx={(url) => handleSetBg(r.id, url)}
                  onCancel={handleCancel}
                  onAccept={handleAccept}
                  bgCustomUrl={bgCustomUrl}
                  setBgCustomUrl={setBgCustomUrl}
                  bgSaving={bgSaving}
                  onSetBgUrl={() => handleSetBg(r.id, bgCustomUrl)}
                  onUploadBg={(f) => handleUploadBg(r.id, f)}
                  registeredUsers={registeredUsers}
                />
              ))}
            </div>
          </div>
        )}

        {/* Open Requests */}
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
          <div className="space-y-3">
            {openRequests.map((r) => {
              const isOwn = String(r.userId) === String(currentUserId);
              const canBid = !isOwn && !!currentUserId;
              const myBid = r.bids?.find((b: any) => String(b.userId) === String(currentUserId));
              return (
                <BoostCard
                  key={r.id}
                  r={r}
                  isOwner={isOwn}
                  currentUserId={currentUserId}
                  bgUrl={resolveBg(r)}
                  canBid={canBid}
                  myBid={myBid}
                  biddingRequestId={biddingRequestId}
                  bidAmount={bidAmount}
                  bidMsg={bidMsg}
                  bidLoading={bidLoading}
                  onBidClick={() => { setBiddingRequestId(r.id); setBidAmount(r.budget); setBidMsg(""); }}
                  onBidCancel={() => setBiddingRequestId(null)}
                  onBidAmountChange={setBidAmount}
                  onBidMsgChange={setBidMsg}
                  onBidSubmit={handleBid}
                  onAccept={handleAccept}
                  onCancel={handleCancel}
                  bgPickerId={bgPickerId}
                  onOpenBgPicker={setBgPickerId}
                  onCloseBgPicker={() => setBgPickerId(null)}
                  onSelectVfx={(url) => handleSetBg(r.id, url)}
                  bgCustomUrl={bgCustomUrl}
                  setBgCustomUrl={setBgCustomUrl}
                  bgSaving={bgSaving}
                  onSetBgUrl={() => handleSetBg(r.id, bgCustomUrl)}
                  onUploadBg={(f) => handleUploadBg(r.id, f)}
                  registeredUsers={registeredUsers}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function BoostCard({
  r, isOwner, currentUserId, bgUrl, canBid, myBid,
  biddingRequestId, bidAmount, bidMsg, bidLoading,
  onBidClick, onBidCancel, onBidAmountChange, onBidMsgChange, onBidSubmit,
  onCancel, onAccept,
  bgPickerId, onOpenBgPicker, onCloseBgPicker, onSelectVfx,
  bgCustomUrl, setBgCustomUrl, bgSaving, onSetBgUrl, onUploadBg,
  registeredUsers,
}: {
  r: BoostRequest; isOwner: boolean; currentUserId: string;
  bgUrl: string | null;
  canBid?: boolean; myBid?: Bid | null;
  biddingRequestId?: string | null; bidAmount?: number; bidMsg?: string; bidLoading?: boolean;
  onBidClick?: () => void; onBidCancel?: () => void;
  onBidAmountChange?: (v: number) => void; onBidMsgChange?: (v: string) => void; onBidSubmit?: (id: string) => void;
  onCancel?: (id: string) => void; onAccept?: (id: string, bidId: string) => void;
  bgPickerId?: string | null; onOpenBgPicker?: (id: string | null) => void; onCloseBgPicker?: () => void;
  onSelectVfx?: (url: string) => void;
  bgCustomUrl?: string; setBgCustomUrl?: (v: string) => void; bgSaving?: boolean;
  onSetBgUrl?: () => void; onUploadBg?: (file: File) => void;
  registeredUsers: any[];
}) {
  const title = r.type === "leveling"
    ? `Leveling ${r.startLevel} → ${r.endLevel}`
    : `${r.dungeonName} +${r.keyLevel}`;
  const canAcceptBid = isOwner && r.status === "open";
  const totalBidsShown = isOwner ? (r.bids?.length || 0) : (r.totalBids || 0);
  const ownerUser = registeredUsers.find((u: any) => String(u.id) === String(r.userId));
  const userVfx: any[] = ownerUser?.userVfx || [];
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-visible"
    >
      <div className={`relative w-full rounded-[2.5rem] shadow-2xl group border overflow-visible
        ${r.status === "open" ? "border-white/10 hover:border-white/30" : "border-amber-500/30"}
        bg-black/80`}
      >
        {/* Banner background — same as lobby banner */}
        {bgUrl ? (
          <div className="absolute inset-0 z-0 overflow-hidden rounded-[2.5rem]">
            <img src={bgUrl} className="w-full h-full object-cover" alt="" loading="lazy" decoding="async" />
            <div className="absolute inset-0 bg-black/20" />
          </div>
        ) : (
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#0a0a16] to-black rounded-[2.5rem]" />
        )}

        <div className="relative z-10 flex flex-col xl:flex-row items-stretch w-full min-h-[132px]">
          {/* Avatar / Faction column */}
          <div className="flex items-center gap-3 p-4 xl:p-5 xl:w-56 shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
              {r.faction ? (
                <img
                  src={`/assets/${r.faction === "horde" ? "Horde" : "Alliance"}.svg`}
                  alt={r.faction}
                  className="w-7 h-7 opacity-80"
                />
              ) : (
                <TrendingUp className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-base font-black text-white truncate">{title}</p>
              <p className="text-[9px] text-gray-500 font-bold truncate">
                by {r.userName}
                {r.notes ? ` • ${r.notes}` : ""}
              </p>
            </div>
          </div>

          {/* Gold amount */}
          <div className="flex items-center justify-center px-4 xl:px-0 xl:ml-auto">
            <div className="text-center">
              <p className={`text-3xl font-black text-yellow-400 ${r.status === "open" ? "offer-gold-pulse" : ""}`}
                 style={{ "--offer-glow-secondary": "#00ffff" } as React.CSSProperties}>
                {r.budget}K
              </p>
              <p className="text-[8px] font-black text-yellow-400/60 uppercase tracking-widest -mt-1">Gold</p>
            </div>
          </div>

          {/* Bid count + status */}
          <div className="flex items-center justify-center px-4">
            {r.status === "accepted" ? (
              <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">Accepted</span>
            ) : r.status === "closed" ? (
              <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Closed</span>
            ) : (
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                {totalBidsShown} {totalBidsShown === 1 ? "Bid" : "Bids"}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-1.5 p-3 xl:p-4 ml-auto">
            {/* BG button — same as lobby BG button */}
            {isOwner && (
              <button
                onClick={() => onOpenBgPicker?.(bgPickerId === r.id ? null : r.id)}
                className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center hover:bg-amber-500/20 transition"
                title="Choose background"
              >
                <Target className="w-4 h-4 text-amber-400" />
              </button>
            )}
            {isOwner && r.status === "open" && (
              <button onClick={() => onCancel?.(r.id)} className="px-3 py-2 rounded-xl bg-white/5 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition">
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* BG Picker — same style as lobby BG picker */}
        {isOwner && bgPickerId === r.id && (
          <div ref={bgPickerRef} className="relative z-30 px-4 pb-4" style={{ pointerEvents: "auto" }}>
            <div className="bg-[#0a0a16]/95 border border-yellow-500/40 rounded-2xl p-4 shadow-[0_0_30px_rgba(255,215,0,0.15)] backdrop-blur-xl">
              <p className="text-[9px] font-black text-yellow-500 uppercase tracking-widest mb-3">
                {bgUrl ? "🎨" : ""} Set Background
              </p>

              {/* VFX entries from Lobby Store */}
              {userVfx.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
                  {userVfx.map((entry: any, i: number) => {
                    const src = resolveVfxSrc(entry);
                    const preview = resolveVfxBannerUrl(entry);
                    const isActive = r.customBg === src || (!r.customBg && ownerUser?.activeVfx === src);
                    return (
                      <div
                        key={i}
                        onClick={() => { onSelectVfx?.(src); }}
                        className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-200 aspect-video ${
                          isActive
                            ? "border-yellow-500 shadow-[0_0_10px_rgba(255,215,0,0.3)]"
                            : "border-transparent hover:border-white/20"
                        }`}
                      >
                        <img src={preview} className="w-full h-full object-cover" alt="" />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* URL + File upload */}
              <div className="flex flex-wrap gap-2">
                <div className="flex-1 min-w-[180px] flex items-center gap-2 bg-black/50 border border-white/10 rounded-xl px-3 py-2">
                  <Link2 className="w-4 h-4 text-gray-500 shrink-0" />
                  <input
                    value={bgCustomUrl || ""}
                    onChange={(e) => setBgCustomUrl?.(e.target.value)}
                    placeholder="Paste GIF URL..."
                    className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-gray-600"
                  />
                  {bgCustomUrl && (
                    <button
                      onClick={onSetBgUrl}
                      disabled={bgSaving}
                      className="text-[8px] font-black text-[#00ffff] uppercase tracking-widest hover:underline disabled:opacity-40"
                    >
                      {bgSaving ? "..." : "Set"}
                    </button>
                  )}
                </div>
                <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-[9px] font-black uppercase tracking-widest">
                  <Upload className="w-3.5 h-3.5" /> Upload
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/gif,image/webp,image/png,image/jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) onUploadBg?.(file);
                    }}
                  />
                </label>
              </div>

              {userVfx.length === 0 && !bgCustomUrl && (
                <p className="text-[10px] text-gray-600 mt-3 text-center">
                  No backgrounds yet. Paste a URL or upload a file.
                  {ownerUser?.userVfx === undefined && currentUserId && (
                    <span> Save backgrounds in <a href="/shop" className="text-[#00ffff] hover:underline">Secret Club → Lobby Store</a>.</span>
                  )}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Bids section */}
        {(r.bids?.length > 0 || totalBidsShown > 0) && (
          <div className="relative z-10 border-t border-white/5">
            <div className="px-4 py-3 space-y-1.5">
              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">
                {isOwner ? "Bids" : "Your Bid"}
                {!isOwner && totalBidsShown > (myBid ? 1 : 0) && (
                  <span className="text-gray-600 ml-1">({totalBidsShown} total)</span>
                )}
              </p>
              {(isOwner ? r.bids : (myBid ? [myBid] : [])).map((b) => (
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
                    {canAcceptBid && (
                      <button
                        onClick={() => onAccept?.(r.id, b.id)}
                        className="text-[8px] font-black text-[#00ffff] uppercase tracking-widest hover:underline"
                      >
                        Accept
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bid form */}
        {canBid && !myBid && biddingRequestId === r.id && (
          <div className="relative z-10 border-t border-white/5 p-4 space-y-2">
            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Your bid (K Gold)</p>
            <div className="flex items-center gap-2">
              <button onClick={() => onBidAmountChange?.(Math.max(1, (bidAmount || 0) - 5))} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg text-white font-black hover:bg-white/10">−</button>
              <span className="text-xl font-black text-[#00ffff] tabular-nums w-16 text-center">{bidAmount || 0}K</span>
              <button onClick={() => onBidAmountChange?.((bidAmount || 0) + 5)} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg text-white font-black hover:bg-white/10">+</button>
            </div>
            <input value={bidMsg || ""} onChange={(e) => onBidMsgChange?.(e.target.value)} placeholder="Message (optional)" className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#00ffff]/50 placeholder:text-gray-600" />
            <div className="flex gap-2">
              <button onClick={onBidCancel} className="flex-1 py-2 rounded-lg bg-white/5 text-gray-400 text-[9px] font-black uppercase tracking-widest hover:bg-white/10">Cancel</button>
              <button disabled={bidLoading || !bidAmount || bidAmount <= 0} onClick={() => onBidSubmit?.(r.id)} className="flex-1 py-2 rounded-lg bg-gradient-to-r from-[#00ffff] to-[#ff007f] text-black text-[9px] font-black uppercase tracking-widest disabled:opacity-40 hover:opacity-90 transition">
                {bidLoading ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "Place Bid"}
              </button>
            </div>
          </div>
        )}
        {canBid && !myBid && biddingRequestId !== r.id && (
          <div className="relative z-10 border-t border-white/5">
            <button onClick={onBidClick} className="w-full py-3 rounded-b-[2.5rem] bg-gradient-to-r from-[#00ffff]/10 to-[#ff007f]/10 border-t-0 text-[#00ffff] text-[10px] font-black uppercase tracking-widest hover:from-[#00ffff]/20 hover:to-[#ff007f]/20 transition">Place Bid</button>
          </div>
        )}
        {canBid && myBid && (
          <div className="relative z-10 border-t border-white/5">
            <div className="px-4 py-2.5 flex items-center justify-between">
              <span className="text-[9px] font-black text-green-400 uppercase tracking-widest">Bid Placed</span>
              <span className="text-[9px] font-black text-gray-500">{myBid.amount}K</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
