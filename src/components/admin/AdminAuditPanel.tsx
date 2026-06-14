"use client";

import { useCallback, useEffect, useState } from "react";
import { ScrollText, Loader2, ShieldAlert } from "lucide-react";
import { formatIpForAdmin } from "@/lib/formatIp";

type AuditEntry = {
  id: string;
  action: string;
  userId: string;
  handle?: string;
  target?: string;
  meta?: Record<string, unknown>;
  timestamp: number;
};

const ACTION_LABELS: Record<string, string> = {
  "chat.spam.suspend": "Chat spam — auto suspended",
  "chat.spam.cooldown": "Chat spam — cooldown",
  "dm.delete": "DM deleted",
  "upload.avatar": "Avatar upload",
  "admin.bannedUsers": "Ban list updated",
  "admin.ipBan": "IP banned",
  "admin.ipUnban": "IP unbanned",
  "onboarding.ipBan": "Onboarding abuse — IP banned",
  "admin.roleChange": "Role changed",
};

export default function AdminAuditPanel() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "chat">("all");

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/audit?limit=150")
      .then((r) => r.json())
      .then((d) => setLogs(d.logs || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered =
    filter === "chat"
      ? logs.filter((l) => l.action.startsWith("chat."))
      : logs;

  return (
    <div id="admin-audit" className="mt-12 pt-8 border-t border-white/10 scroll-mt-24">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
            <ScrollText className="text-violet-400 w-10 h-10" /> Security Audit Log
          </h2>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
          Suspensions, IP bans, uploads, and security events — scroll down in Admin if you only see users above
        </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFilter("chat")}
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition ${filter === "chat" ? "bg-violet-500/15 border-violet-500/40 text-violet-300" : "border-white/10 text-gray-500"}`}
          >
            Chat / Spam
          </button>
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition ${filter === "all" ? "bg-violet-500/15 border-violet-500/40 text-violet-300" : "border-white/10 text-gray-500"}`}
          >
            All Events
          </button>
          <button
            type="button"
            onClick={load}
            className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/10 text-gray-400 hover:text-white"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-gray-600 text-sm italic p-8 bg-black/20 rounded-2xl border border-dashed border-white/5 text-center">
          No audit events yet.
        </p>
      ) : (
        <div className="grid gap-2 max-h-[420px] overflow-y-auto custom-scrollbar">
          {filtered.map((entry) => (
            <div
              key={entry.id}
              className={`p-4 rounded-2xl border flex items-start gap-4 ${
                entry.action === "chat.spam.suspend"
                  ? "bg-red-500/5 border-red-500/25"
                  : "bg-black/40 border-white/5"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                {entry.action === "chat.spam.suspend" ? (
                  <ShieldAlert className="w-5 h-5 text-red-400" />
                ) : (
                  <ScrollText className="w-5 h-5 text-violet-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-white uppercase tracking-wide">
                  {ACTION_LABELS[entry.action] || entry.action}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">
                  User: <span className="text-yellow-500/90">{entry.handle || entry.userId}</span>
                  {entry.meta?.strikes != null && (
                    <span className="ml-2 text-red-400/80">· strikes: {String(entry.meta.strikes)}</span>
                  )}
                  {entry.meta?.auto === true && (
                    <span className="ml-2 text-red-400/80">· auto-ban</span>
                  )}
                </p>
                {typeof entry.meta?.ip === "string" && (() => {
                  const ip = formatIpForAdmin(entry.meta.ip as string);
                  return (
                    <p className={`text-[10px] mt-1 font-mono ${ip.isLocal ? "text-gray-500" : "text-orange-300"}`}>
                      IP: <span className="font-black">{ip.text}</span>
                      {ip.raw && ip.isLocal && (
                        <span className="text-gray-600 ml-1">({ip.raw})</span>
                      )}
                    </p>
                  );
                })()}
                <p className="text-[9px] text-gray-600 mt-1">
                  {new Date(entry.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
