"use client";

import { useCallback, useEffect, useState } from "react";
import { Globe, Loader2, ShieldBan, ShieldCheck } from "lucide-react";

type RecentIp = {
  ip: string;
  handle?: string;
  action: string;
  at: number;
};

export default function AdminIpBanPanel() {
  const [ips, setIps] = useState<string[]>([]);
  const [recent, setRecent] = useState<RecentIp[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/banned-ips")
      .then((r) => r.json())
      .then((d) => {
        setIps(d.ips || []);
        setRecent(d.recent || []);
      })
      .catch(() => {
        setIps([]);
        setRecent([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleBan = async () => {
    const ip = input.trim();
    if (!ip) return;
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/banned-ips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip, reason: reason.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Failed to ban IP");
        return;
      }
      setInput("");
      setReason("");
      setMessage("IP banned.");
      load();
    } catch {
      setMessage("Request failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleUnban = async (ip: string) => {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/banned-ips", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip }),
      });
      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error || "Failed to unban IP");
        return;
      }
      setMessage("IP unbanned.");
      load();
    } catch {
      setMessage("Request failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-12 pt-8 border-t border-white/10">
      <div className="mb-6">
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
          <Globe className="text-orange-400 w-10 h-10" /> Banned IP Addresses
        </h2>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
          Block a network address — use after repeated abuse or alt accounts. Username ban stays primary.
        </p>
      </div>

      <div className="p-6 bg-black/40 rounded-2xl border border-white/5 mb-6 space-y-4">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="185.xxx.xxx.xxx"
            className="flex-1 min-w-[200px] bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-orange-500/50 font-mono"
          />
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            className="flex-1 min-w-[160px] bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-orange-500/50"
          />
          <button
            type="button"
            disabled={busy || !input.trim()}
            onClick={handleBan}
            className="px-6 py-3 bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500 hover:text-black rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-40"
          >
            Ban IP
          </button>
        </div>
        {message && <p className="text-xs font-bold text-orange-300/90">{message}</p>}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
        </div>
      ) : ips.length === 0 ? (
        <p className="text-gray-600 text-sm italic p-8 bg-black/20 rounded-2xl border border-dashed border-white/5 text-center mb-8">
          No IP addresses banned yet.
        </p>
      ) : (
        <div className="grid gap-3 mb-8">
          {ips.map((ip) => (
            <div
              key={ip}
              className="flex items-center justify-between p-5 bg-black/40 rounded-2xl border border-orange-500/20"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-500/10 rounded-xl border border-orange-500/30 flex items-center justify-center">
                  <ShieldBan className="w-6 h-6 text-orange-400" />
                </div>
                <span className="font-mono text-white text-sm">{ip}</span>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleUnban(ip)}
                className="px-5 py-2.5 bg-[#00ffff]/10 text-[#00ffff] border border-[#00ffff]/30 hover:bg-[#00ffff] hover:text-black rounded-lg text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40"
              >
                Unban IP
              </button>
            </div>
          ))}
        </div>
      )}

      {recent.length > 0 && (
        <>
          <h3 className="text-lg font-black text-white/80 uppercase tracking-widest mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-gray-500" /> Recent IPs (from audit)
          </h3>
          <div className="grid gap-2 max-h-[240px] overflow-y-auto custom-scrollbar">
            {recent.map((row) => (
              <div
                key={`${row.ip}-${row.at}`}
                className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/5 text-xs"
              >
                <span className="font-mono text-orange-300/90">{row.ip}</span>
                <span className="text-gray-500 truncate max-w-[40%]">
                  {row.handle || "—"} · {row.action}
                </span>
                <button
                  type="button"
                  disabled={busy || ips.includes(row.ip)}
                  onClick={() => {
                    setInput(row.ip);
                    setMessage("");
                  }}
                  className="text-[9px] font-black uppercase text-orange-400 hover:text-orange-300 disabled:opacity-30"
                >
                  {ips.includes(row.ip) ? "Banned" : "Use"}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
