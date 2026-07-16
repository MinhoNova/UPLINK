"use client";

import { useEffect, useState, useCallback } from "react";
import { TrendingUp, Shield, Sword, Coins, Plus, Loader2, Send } from "lucide-react";
import Link from "next/link";

type BoostRequestsSidebarProps = {
  currentUserId: string;
  currentUserDisplay: string;
  isSuspended: boolean;
  hasPendingPayments: boolean;
  setIsBoostRequestModalOpen: (v: boolean) => void;
};

export default function BoostRequestsSidebar({
  currentUserId,
  currentUserDisplay,
  isSuspended,
  hasPendingPayments,
  setIsBoostRequestModalOpen,
}: BoostRequestsSidebarProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/boost-requests");
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const openRequests = requests.filter((r: any) => r.status === "open");

  return (
    <div className="bg-gradient-to-br from-[#0a0a16] via-[#0d0d1a] to-black border border-white/5 rounded-[2rem] p-5 sticky top-28 shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-black text-white uppercase tracking-[0.15em] flex items-center gap-2">
            Request Posting
            {!loading && openRequests.length > 0 && (
              <span className="text-[8px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center shadow-[0_0_8px_rgba(255,0,0,0.4)]">
                {openRequests.length > 9 ? "9+" : openRequests.length}
              </span>
            )}
          </h3>
          <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Boosters bid for your run</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 text-amber-400/50 animate-spin" />
        </div>
      ) : openRequests.length === 0 ? (
        <div className="text-center py-6 bg-white/[0.02] rounded-2xl border border-white/5">
          <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest">No open requests</p>
          <p className="text-[8px] text-gray-700 mt-1">Be the first to post one.</p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
          {openRequests.slice(0, 15).map((req: any) => (
            <div key={req.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-amber-500/30 transition-colors">
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                  req.type === "leveling" ? "bg-green-500/20" : "bg-purple-500/20"
                }`}>
                  {req.type === "leveling" ? (
                    <Shield className="w-3 h-3 text-green-400" />
                  ) : (
                    <Sword className="w-3 h-3 text-purple-400" />
                  )}
                </div>
                <span className="text-[9px] font-black text-white/80 truncate flex-1">
                  {req.type === "leveling"
                    ? `${req.startLevel}→${req.endLevel}`
                    : `${req.dungeonName || "Dungeon"} +${req.keyLevel}`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-amber-400 flex items-center gap-1">
                  <Coins className="w-3 h-3" />
                  {req.budget}K
                </span>
                <span className="text-[7px] font-black text-gray-600 uppercase tracking-wider">
                  by {req.userName || "Anon"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          if (isSuspended) return;
          if (hasPendingPayments) return;
          setIsBoostRequestModalOpen(true);
        }}
        className="mt-3 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 font-black uppercase text-[9px] tracking-[0.15em] hover:from-amber-500/30 hover:to-orange-500/30 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
        disabled={isSuspended || hasPendingPayments}
      >
        <Send className="w-3.5 h-3.5" />
        Post a Request
      </button>

      {openRequests.length > 0 && (
        <Link
          href="/boosts"
          className="mt-2 w-full py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 font-black uppercase text-[8px] tracking-[0.15em] hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-3 h-3" />
          View All ({openRequests.length})
        </Link>
      )}
    </div>
  );
}
