"use client";

import { useState, useEffect, useCallback } from "react";
import { Users2, RefreshCw, ChevronLeft, ChevronRight, CalendarDays, Clock } from "lucide-react";

interface VisitEntry {
  id: string;
  username: string;
  name: string;
  avatar: string;
  count: number;
  firstSeenAt: number;
  lastSeenAt: number;
  ips: string[];
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function todayStamp() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(date: string, delta: number) {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d + delta);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

function fmtTime(ts?: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminVisitsPanel() {
  const [date, setDate] = useState(todayStamp());
  const [visits, setVisits] = useState<VisitEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (d: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/visits?date=${d}`);
      const data = await res.json();
      setVisits(Array.isArray(data.visits) ? data.visits : []);
    } catch {
      setVisits([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load(date);
  }, [date, load]);

  const totalSessions = visits.reduce((acc, v) => acc + (v.count || 0), 0);

  return (
    <div id="admin-daily-visits" className="scroll-mt-24">
      <div className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Users2 className="text-[#00ffff] w-5 h-5" />
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-tighter">Daily Visits</h2>
              <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">
                Every player login today — count, IPs, times
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDate(addDays(date, -1))}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-bold text-white">
              <CalendarDays className="w-3.5 h-3.5 text-[#00ffff]" />
              {date}
            </div>

            <button
              onClick={() => setDate(addDays(date, 1))}
              disabled={date >= todayStamp()}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {date !== todayStamp() && (
              <button
                onClick={() => setDate(todayStamp())}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 text-[9px] font-black uppercase tracking-widest transition"
              >
                Today
              </button>
            )}
            <button
              onClick={() => load(date)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Users2 className="w-4 h-4" style={{ color: "#00ffff" }} />
              <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#00ffff" }}>
                Players
              </span>
            </div>
            <div className="text-3xl font-black text-white">{visits.length}</div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="w-4 h-4" style={{ color: "#aaff00" }} />
              <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#aaff00" }}>
                Sessions
              </span>
            </div>
            <div className="text-3xl font-black text-white">{totalSessions}</div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4" style={{ color: "#ff007f" }} />
              <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#ff007f" }}>
                Last Visit
              </span>
            </div>
            <div className="text-sm font-black text-white truncate">
              {visits.length ? fmtTime(Math.max(...visits.map((v) => v.lastSeenAt || 0))) : "—"}
            </div>
          </div>
        </div>

        {loading && visits.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 animate-pulse">
                <div className="h-4 w-40 bg-white/5 rounded mb-2" />
                <div className="h-3 w-24 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        ) : visits.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-xs font-black uppercase tracking-widest">
            No player visits recorded on this day.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/5">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="text-left px-4 py-3 text-[8px] font-black uppercase tracking-widest text-gray-500">Player</th>
                  <th className="text-left px-4 py-3 text-[8px] font-black uppercase tracking-widest text-gray-500">Discord ID</th>
                  <th className="text-left px-4 py-3 text-[8px] font-black uppercase tracking-widest text-gray-500">Sessions</th>
                  <th className="text-left px-4 py-3 text-[8px] font-black uppercase tracking-widest text-gray-500">First Seen</th>
                  <th className="text-left px-4 py-3 text-[8px] font-black uppercase tracking-widest text-gray-500">Last Seen</th>
                  <th className="text-right px-4 py-3 text-[8px] font-black uppercase tracking-widest text-gray-500">IPs</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((v) => (
                  <tr key={v.id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden shrink-0 border border-white/10">
                          {v.avatar ? (
                            <img src={v.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Users2 className="w-4 h-4 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{v.name || "—"}</div>
                          <div className="text-[9px] text-gray-500">@{v.username || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-[10px] font-mono text-gray-400 bg-white/[0.03] px-1.5 py-0.5 rounded">{v.id}</code>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] text-[#00ffff] font-black">{v.count}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] text-gray-400">{fmtTime(v.firstSeenAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] text-gray-400">{fmtTime(v.lastSeenAt)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {v.ips.length ? (
                        <div className="flex flex-col items-end gap-0.5">
                          {v.ips.map((ip, i) => (
                            <span key={i} className="text-[9px] font-mono text-orange-300">{ip}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}