"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldX, ShieldCheck, Loader2, UserX } from "lucide-react";

type BanRecord = {
  id: string;
  handle?: string;
  reason?: string;
  at?: number;
  name?: unknown;
  username?: unknown;
  avatar?: string;
  tier?: string;
};

function friendlyDate(ts?: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminUserBanPanel() {
  const [bans, setBans] = useState<BanRecord[]>([]);
  const [legacyHandles, setLegacyHandles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/user-bans")
      .then((r) => r.json())
      .then((d) => {
        setBans(d.bans || []);
        setLegacyHandles(d.legacyHandles || []);
      })
      .catch(() => {
        setBans([]);
        setLegacyHandles([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (action: "ban" | "unban", payload: Record<string, unknown>) => {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/user-bans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || `Failed to ${action}`);
        return;
      }
      setMessage(action === "ban" ? "User banned." : "User unbanned.");
      if (action === "ban") {
        setInput("");
        setReason("");
      }
      load();
    } catch {
      setMessage("Request failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleBan = () => run("ban", { handle: input.trim() || undefined, reason: reason.trim() || undefined });
  const handleUnban = (b: BanRecord) => run("unban", { userId: b.id, handle: b.handle });
  const handleLegacyUnban = (h: string) => run("unban", { handle: h });

  return (
    <div className="mt-10 pt-8 border-t border-white/10">
      <div className="mb-6">
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
          <ShieldX className="text-red-400 w-10 h-10" /> Banned Users
        </h2>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
          Suspend by username or Discord ID. Bans follow the user id — renaming or re-logging in cannot bypass.
        </p>
      </div>

      <div className="p-6 bg-black/40 rounded-2xl border border-white/5 mb-6 space-y-4">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Username or Discord ID"
            className="flex-1 min-w-[200px] bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-red-500/50"
          />
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            className="flex-1 min-w-[160px] bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-red-500/50"
          />
          <button
            type="button"
            disabled={busy || !input.trim()}
            onClick={handleBan}
            className="px-6 py-3 bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-40"
          >
            Ban User
          </button>
        </div>
        {message && <p className="text-xs font-bold text-red-300/90">{message}</p>}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 text-red-400 animate-spin" />
        </div>
      ) : bans.length === 0 && legacyHandles.length === 0 ? (
        <p className="text-gray-600 text-sm italic p-8 bg-black/20 rounded-2xl border border-dashed border-white/5 text-center mb-8">
          No users banned yet.
        </p>
      ) : (
        <>
          <div className="grid gap-3 mb-6">
            {bans.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-3 p-4 bg-black/40 rounded-2xl border border-red-500/20 flex-wrap"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center overflow-hidden shrink-0">
                    {b.avatar ? (
                      <img src={b.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <UserX className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-white truncate flex items-center gap-2">
                      {String(b.name || b.username || b.handle || b.id)}
                    </p>
                    <p className="text-[9px] font-mono text-gray-600 truncate">
                      {b.handle ? `@${b.handle} · ` : ""}
                      {b.id} {b.tier ? `· ${b.tier}` : ""}
                    </p>
                    <p className="text-[10px] text-red-300/80 truncate max-w-[360px]">
                      {(b.reason || "No reason") + ` · ${friendlyDate(b.at)}`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleUnban(b)}
                  className="px-5 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-black rounded-lg text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40"
                >
                  Unban
                </button>
              </div>
            ))}
          </div>

          {legacyHandles.length > 0 && (
            <>
              <h3 className="text-lg font-black text-white/80 uppercase tracking-widest mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-gray-500" /> Legacy handle bans
              </h3>
              <div className="grid gap-2 max-h-[240px] overflow-y-auto custom-scrollbar mb-8">
                {legacyHandles.map((h) => (
                  <div
                    key={h}
                    className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/5 text-xs"
                  >
                    <span className="font-mono text-red-300/90">@{h}</span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleLegacyUnban(h)}
                      className="text-[9px] font-black uppercase text-emerald-400 hover:text-emerald-300 disabled:opacity-30"
                    >
                      Unban
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}