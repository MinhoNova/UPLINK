"use client";

import { useCallback, useEffect, useState } from "react";
import { Flag, Loader2, ShieldAlert, Trash2, X } from "lucide-react";

type ReportRow = {
  id: number;
  postId: number;
  reporterId: string;
  reason: string;
  createdAt: number;
  postContent: string;
  postAuthorId: string | null;
  postAuthorName: string;
  reporterName: string;
};

type LobbyReportRow = {
  id: string;
  lobbyId: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  details?: string;
  createdAt: number;
  lobbyTitle: string;
  lobbyCategory: string;
  ownerId: string | null;
  ownerName: string;
};

export default function AdminModerationPanel() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [lobbyReports, setLobbyReports] = useState<LobbyReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [busyLobbyId, setBusyLobbyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/moderation/reports").then((r) => r.json()),
      fetch("/api/admin/moderation/lobby-reports").then((r) => r.json()),
    ])
      .then(([a, b]: [any, any]) => {
        setReports(a.reports || []);
        setLobbyReports(b.reports || []);
      })
      .catch(() => {
        setReports([]);
        setLobbyReports([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const deletePost = async (postId: number, reportId: number) => {
    if (!confirm("Delete this post permanently?")) return;
    setBusyId(reportId);
    try {
      const res = await fetch("/api/admin/moderation/posts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.postId !== postId));
      }
    } finally {
      setBusyId(null);
    }
  };

  const dismissReport = async (reportId: number) => {
    setBusyId(reportId);
    try {
      const res = await fetch("/api/admin/moderation/reports", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });
      if (res.ok) setReports((prev) => prev.filter((r) => r.id !== reportId));
    } finally {
      setBusyId(null);
    }
  };

  const dismissLobbyReport = async (reportId: string) => {
    setBusyLobbyId(reportId);
    try {
      const res = await fetch("/api/admin/moderation/lobby-reports", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });
      if (res.ok) setLobbyReports((prev) => prev.filter((r) => r.id !== reportId));
    } finally {
      setBusyLobbyId(null);
    }
  };

  return (
    <div className="mt-12 pt-8 border-t border-white/10">
      <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2 flex items-center gap-4">
        <Flag className="text-orange-500 w-10 h-10" /> Reports Center
      </h2>
      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-6">
        Community post reports — review and remove violating content
      </p>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <p className="text-gray-600 text-sm italic p-8 bg-black/20 rounded-2xl border border-dashed border-white/5 text-center">
          No pending reports.
        </p>
      ) : (
        <div className="grid gap-4">
          {reports.map((r) => (
            <div
              key={r.id}
              className="p-6 bg-black/40 rounded-2xl border border-orange-500/20 hover:border-orange-500/40 transition-all"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest mb-1">
                    Reported by {r.reporterName}
                  </p>
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-2">
                    Post by {r.postAuthorName} · {new Date(r.createdAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-red-400/90 font-bold mb-3">Reason: {r.reason}</p>
                  <p className="text-sm text-gray-300 bg-white/[0.03] rounded-xl p-4 border border-white/5 line-clamp-4">
                    {r.postContent}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => deletePost(r.postId, r.id)}
                  className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {busyId === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  Delete Post
                </button>
                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => dismissReport(r.id)}
                  className="px-4 py-2 bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <X className="w-3 h-3" /> Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 pt-8 border-t border-white/10">
        <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2 flex items-center gap-4">
          <ShieldAlert className="text-red-500 w-9 h-9" /> Offer Scam Reports
        </h3>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-6">
          Scam reports filed from inside a thread — review the thread, then ban the owner or dismiss
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          </div>
        ) : lobbyReports.length === 0 ? (
          <p className="text-gray-600 text-sm italic p-8 bg-black/20 rounded-2xl border border-dashed border-white/5 text-center">
            No scam reports.
          </p>
        ) : (
          <div className="grid gap-4">
            {lobbyReports.map((r) => (
              <div
                key={r.id}
                className="p-6 bg-black/40 rounded-2xl border border-red-500/25 hover:border-red-500/50 transition-all"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1">
                      Reported by {r.reporterName}
                    </p>
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-2">
                      Offer owner: {r.ownerName} · {new Date(r.createdAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-red-400/90 font-bold mb-1">
                      {r.lobbyTitle} <span className="text-gray-500 normal-case">({r.lobbyCategory})</span>
                    </p>
                    <p className="text-xs text-gray-300 mb-2">Reason: {r.reason}</p>
                    {r.details && (
                      <p className="text-sm text-gray-300 bg-white/[0.03] rounded-xl p-4 border border-white/5 line-clamp-4">
                        {r.details}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={`/manage/${r.lobbyId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                  >
                    Open Thread
                  </a>
                  <button
                    type="button"
                    disabled={busyLobbyId === r.id}
                    onClick={() => dismissLobbyReport(r.id)}
                    className="px-4 py-2 bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {busyLobbyId === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />} Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
