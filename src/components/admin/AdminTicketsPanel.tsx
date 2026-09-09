"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  TicketCheck,
  Search,
  X,
  Trash2,
  MessageSquare,
  Send,
} from "lucide-react";
import { ticketMatchesSearch, isTicketExpired, getTicketHoursLeft } from "@/lib/tickets";

export default function AdminTicketsPanel() {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const currentUserId = (session?.user as any)?.id || "";
  const currentDisplay = (session?.user as any)?.name || "Admin";

  useEffect(() => {
    fetch("/api/data")
      .then((r) => r.json())
      .then((d) => {
        setTickets(Array.isArray(d.tickets) ? d.tickets.filter((t: any) => !isTicketExpired(t)) : []);
        setUsers(Array.isArray(d.registeredUsers) ? d.registeredUsers : []);
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(
    () => tickets.filter((t) => ticketMatchesSearch(t, query)),
    [tickets, query]
  );

  const ownerOf = (t: any) =>
    users.find((u) => String(u.id) === String(t.userId)) || null;
  const friendly = (ts: any) => {
    const n = Number(ts);
    if (!n) return "—";
    return new Date(n).toLocaleString();
  };

  const persist = async (next: any[]) => {
    const res = await fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tickets: next }),
    });
    if (res.ok) setTickets(next.filter((t) => !isTicketExpired(t)));
    return res.ok;
  };

  const sendReply = async () => {
    const text = reply.trim();
    if (!text || !selected) return;
    setBusy(true);
    try {
      const msg = {
        id: Date.now(),
        from: currentDisplay,
        fromId: currentUserId,
        text,
        time: new Date().toLocaleString(),
      };
      const next = tickets.map((t) =>
        t.id === selected.id
          ? { ...t, status: "open", messages: [...(t.messages || []), msg] }
          : t
      );
      const ok = await persist(next);
      if (ok) {
        setSelected({ ...selected, status: "open", messages: [...(selected.messages || []), msg] });
        setReply("");
      }
    } finally {
      setBusy(false);
    }
  };

  const closeTicket = async () => {
    if (!selected) return;
    const next = tickets.map((t) =>
      t.id === selected.id ? { ...t, status: "closed" } : t
    );
    if (await persist(next)) setSelected({ ...selected, status: "closed" });
  };

  const deleteTicket = async () => {
    if (!selected) return;
    const next = tickets.filter((t) => t.id !== selected.id);
    if (await persist(next)) setSelected(null);
  };

  return (
    <div className="bg-gradient-to-br from-[#0c0c18] to-black border border-white/5 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <TicketCheck className="w-5 h-5 text-yellow-500" />
        </div>
        <div>
          <h2 className="text-base font-black text-white">Support Tickets</h2>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
            {filtered.length} active · auto-delete after 24h activity
          </p>
        </div>
      </div>

      {!selected ? (
        <>
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by ticket #, subject, or player..."
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white outline-none focus:border-yellow-500/50 font-bold"
            />
          </div>
          <div className="space-y-2 max-h-[460px] overflow-y-auto custom-scrollbar pr-1">
            {filtered.length === 0 && (
              <p className="text-center text-gray-600 text-[11px] font-black uppercase tracking-widest py-12">
                No tickets
              </p>
            )}
            {filtered.map((t) => {
              const owner = ownerOf(t);
              return (
                <button
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className="w-full text-left p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:border-yellow-500/30 hover:bg-white/[0.04] transition group"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="font-black text-white text-sm truncate">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${t.status === "open" ? "bg-green-500" : "bg-gray-600"}`} />
                        {t.subject || "Support"}
                      </p>
                      <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">
                        #{String(t.id).slice(-8)} · {owner?.name || t.username || t.userHandle || "Unknown"}{" "}
                        <span className="text-gray-600">@{owner?.username || ""}</span>
                      </p>
                      {owner?.team?.name && (
                        <p className="text-[9px] text-yellow-500/70 mt-0.5">
                          Team: {owner.team.name}
                          {owner.team.lastRenameAt
                            ? ` · Last rename: ${friendly(owner.team.lastRenameAt)}`
                            : " · Never renamed"}
                        </p>
                      )}
                    </div>
                    <span className="text-[9px] text-gray-600 shrink-0">
                      {(t.messages || []).length} msg · {getTicketHoursLeft(t)}h left
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div>
          <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
            <div className="min-w-0">
              <p className="font-black text-white">{selected.subject}</p>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5">
                #{String(selected.id).slice(-8)} · {ownerOf(selected)?.name || selected.username || "Unknown"} ·{" "}
                {selected.status === "open" ? (
                  <span className="text-green-400">OPEN</span>
                ) : (
                  <span className="text-gray-400">CLOSED</span>
                )}{" "}
                · {getTicketHoursLeft(selected)}h left
              </p>
              {ownerOf(selected)?.team?.name && (
                <p className="text-[9px] text-yellow-500/70 mt-1">
                  Team: {ownerOf(selected)?.team?.name} · Last rename:{" "}
                  {friendly(ownerOf(selected)?.team?.lastRenameAt)}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {selected.status === "open" && (
                <button
                  onClick={closeTicket}
                  className="px-3 py-2 rounded-xl bg-white/5 text-gray-300 border border-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition"
                >
                  Close
                </button>
              )}
              <button
                onClick={deleteTicket}
                className="px-3 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
              <button
                onClick={() => setSelected(null)}
                className="px-3 py-2 rounded-xl bg-white/5 text-gray-300 border border-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition flex items-center gap-1"
              >
                <X className="w-3 h-3" /> All Tickets
              </button>
            </div>
          </div>

          <div className="h-[300px] overflow-y-auto custom-scrollbar bg-black/40 rounded-2xl border border-white/5 p-4 space-y-3 mb-4 mt-4">
            {(selected.messages || []).map((msg: any, i: number) => (
              <div key={i} className={`flex ${String(msg.fromId) === currentUserId ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                    String(msg.fromId) === currentUserId
                      ? "bg-yellow-500/20 text-yellow-100 rounded-tr-none border border-yellow-500/20"
                      : "bg-white/[0.06] text-gray-200 rounded-tl-none border border-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-60">{msg.from}</span>
                    {String(msg.fromId) !== currentUserId && (
                      <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 rounded text-[6px] font-black uppercase tracking-widest">Player</span>
                    )}
                  </div>
                  <p className="text-sm font-bold leading-relaxed">{msg.text}</p>
                  <span className="text-[7px] text-gray-600 mt-1 block">{msg.time}</span>
                </div>
              </div>
            ))}
            {(selected.messages || []).length === 0 && (
              <p className="text-center text-gray-600 text-[10px] uppercase tracking-widest py-10">No messages</p>
            )}
          </div>

          {selected.status === "open" && (
            <div className="flex gap-2">
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !busy && sendReply()}
                placeholder="Type a reply..."
                className="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-yellow-500/50"
              />
              <button
                onClick={sendReply}
                disabled={busy || !reply.trim()}
                className="px-5 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-black text-[10px] uppercase tracking-widest transition flex items-center gap-2 disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" /> Reply
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}