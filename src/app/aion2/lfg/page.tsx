"use client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Sword, Send, Users, Sparkles, X, Loader2 } from "lucide-react";

export default function Aion2LFGPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [posting, setPosting] = useState(false);
  const [form, setForm] = useState({ type: "dungeon", budget: "", notes: "" });

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch("/api/boost-requests?game=aion2");
      if (res.ok) {
        const data = (await res.json()) as { requests?: any[] };
        setRequests(data.requests || []);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleCreate = async () => {
    if (!form.budget) return;
    setPosting(true);
    try {
      const res = await fetch("/api/boost-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          game: "aion2",
          type: form.type,
          budget: Number(form.budget),
          notes: form.notes,
        }),
      });
      if (res.ok) {
        setForm({ type: "dungeon", budget: "", notes: "" });
        setShowForm(false);
        await fetchRequests();
      }
    } catch { /* ignore */ } finally {
      setPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#020212] via-[#04042a] to-[#020212] text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-[0.15em]">Aion 2 LFG</h1>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Looking for group — find your party</p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="ml-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400 font-black uppercase text-[9px] tracking-[0.15em] hover:from-indigo-500/30 hover:to-purple-500/30 transition-all flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            Post Listing
          </button>
        </div>

        {/* Post Form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 bg-gradient-to-br from-[#0a0a16] to-black border border-indigo-500/20 rounded-[2rem] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-white uppercase tracking-widest">
                <Sparkles className="w-4 h-4 inline mr-2 text-indigo-400" />
                New Listing
              </h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid gap-4">
              <div>
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                >
                  <option value="dungeon">Dungeon / Rift</option>
                  <option value="leveling">Leveling</option>
                  <option value="pvp">PvP / Abyss</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">Budget (Kinah)</label>
                <input
                  type="number"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  placeholder="e.g. 500"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="What are you looking for?"
                  rows={2}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
                />
              </div>
              <button
                type="button"
                onClick={handleCreate}
                disabled={posting || !form.budget}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black uppercase text-[10px] tracking-[0.2em] hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {posting ? "Posting..." : "Post Listing"}
              </button>
            </div>
          </motion.div>
        )}

        {/* Listings */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-[2rem]">
            <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-black uppercase tracking-widest">No listings yet</p>
            <p className="text-gray-600 text-[10px] font-bold mt-2">Be the first to post!</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {requests.filter((r: any) => r.status === "open").map((req: any) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-5 hover:border-indigo-500/30 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                    <Sword className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white capitalize">{req.type || "General"}</p>
                    <p className="text-[9px] text-gray-500 font-bold mt-0.5">
                      by {req.userName || "Anonymous"} &bull; {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-indigo-400">{req.budget}K</p>
                    <p className="text-[8px] text-indigo-500/60 font-black uppercase tracking-widest">Kinah</p>
                  </div>
                </div>
                  {req.notes && (
                  <p className="text-xs text-gray-400 bg-white/[0.02] rounded-xl px-3 py-2 border border-white/5">{req.notes}</p>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-8 text-center">
          <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">
            Powered by UPLINK &bull; Aion 2 community LFG
          </p>
        </div>
      </div>
    </div>
  );
}
