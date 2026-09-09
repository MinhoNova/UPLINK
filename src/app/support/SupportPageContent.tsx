"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  TicketCheck,
  MessageSquare,
  ChevronLeft,
  X,
  Plus,
} from "lucide-react";
import { isTicketExpired, getTicketHoursLeft } from "@/lib/tickets";

export default function SupportPageContent() {
  const { data: session, status } = useSession();
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const currentUserId = (session?.user as any)?.id || "";
  const currentDisplay = (session?.user as any)?.name || "Member";

  const load = () => {
    fetch("/api/data")
      .then((r) => r.json())
      .then((d) => {
        setTickets(
          (Array.isArray(d.tickets) ? d.tickets : []).filter((t: any) => !isTicketExpired(t))
        );
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (status !== "authenticated") return;
    load();
    window.addEventListener("data-refresh", load);
    return () => window.removeEventListener("data-refresh", load);
  }, [status, currentUserId]);

  const myTickets = useMemo(
    () =>
      [...tickets]
        .filter((t: any) => String(t.userId) === String(currentUserId))
        .sort((a: any, b: any) => Number(b.createdAt || b.id) - Number(a.createdAt || a.id)),
    [tickets, currentUserId]
  );
  const selected = myTickets.find((t) => t.id === selectedId) || null;

  const save = async (next: any[]) => {
    const res = await fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tickets: next }),
    });
    return res.ok;
  };

  const mergeSave = async (ownRunner: () => any[]): Promise<boolean> => {
    const merged = tickets.map((t) => {
      if (String(t.userId) !== String(currentUserId)) return t;
      const updated = ownRunner().find((u) => String(u.id) === String(t.id));
      return updated || t;
    });
    const ownNew = ownRunner().filter(
      (u) => !merged.some((m) => String(m.id) === String(u.id))
    );
    return save([...merged, ...ownNew].filter((t: any) => !isTicketExpired(t)));
  };

  const send = async () => {
    const text = message.trim();
    if (!text || busy) return;
    setBusy(true);
    try {
      const msg = { id: Date.now(), from: currentDisplay, fromId: currentUserId, text, time: new Date().toLocaleString() };
      let ok: boolean;
      if (selected) {
        const target = selected;
        ok = await mergeSave(() =>
          myTickets.map((t) =>
            t.id === target.id ? { ...t, status: "open", messages: [...(t.messages || []), msg] } : t
          )
        );
      } else {
        const fresh = {
          id: Date.now(),
          userId: currentUserId,
          username: currentDisplay,
          userHandle: (session?.user as any)?.username || "",
          subject: text.slice(0, 50),
          messages: [msg],
          status: "open",
          createdAt: Date.now(),
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        };
        ok = await mergeSave(() => [fresh]);
      }
      if (ok) {
        load();
        setMessage("");
      }
    } finally {
      setBusy(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#050814] text-slate-200 flex items-center justify-center">
        <TicketCheck className="w-8 h-8 text-yellow-400 animate-pulse" />
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen bg-[#050814] text-slate-200 flex items-center justify-center">
        <p className="text-xs uppercase tracking-widest text-slate-500">Sign in to open a ticket</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050814] text-slate-200 font-sans selection:bg-yellow-500/30 overflow-x-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden>
        <div className="absolute inset-0 bg-cover bg-center sm:bg-contain sm:bg-top sm:bg-no-repeat" style={{ backgroundImage: `url('/AION2.png')` }} />
        <div className="absolute inset-0 bg-[#050814]/40 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050814]/12 via-transparent to-[#050814]/35" />
        <div className="aion-dotnet absolute inset-0 opacity-[0.10]" />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        <div className="tn-light relative w-full rounded-3xl bg-[#070a1c]/70 backdrop-blur-xl border border-yellow-500/25 overflow-hidden shadow-[0_8px_32px_rgba(234,179,8,0.08)]">
          <div className="h-[3px] w-full bg-gradient-to-r from-yellow-500/0 via-yellow-500/70 to-yellow-500/0" />
          <div className="p-6 sm:p-8 min-h-[72vh] flex flex-col">
            <div className="flex items-center gap-3 mb-8">
              <a href="/" className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </a>
              <div className="p-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
                <TicketCheck className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black uppercase tracking-wider text-white">Support Center</h1>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                  {selected ? `Ticket #${String(selected.id).slice(-6)} · ${getTicketHoursLeft(selected)}h left` : `${myTickets.length} ticket${myTickets.length === 1 ? "" : "s"} · auto-delete after 24h`}
                </p>
              </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
              <div className="lg:w-72 shrink-0 space-y-2">
                <button
                  onClick={() => {
                    setSelectedId(null);
                    setMessage("");
                  }}
                  className={`w-full flex items-center gap-2 px-4 py-3 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest ${!selected ? "bg-yellow-500/15 text-yellow-300 border-yellow-500/40" : "bg-white/[0.03] text-gray-400 border-white/10 hover:bg-white/10"}`}
                >
                  <Plus className="w-3.5 h-3.5" /> New Ticket
                </button>
                {myTickets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedId(t.id as number)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${selected?.id === t.id ? "bg-yellow-500/15 border-yellow-500/40" : "bg-white/[0.03] border-white/5 hover:bg-white/[0.06]"}`}
                  >
                    <p className="text-xs font-black text-white truncate">{t.subject}</p>
                    <p className="text-[8px] text-gray-500 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${t.status === "open" ? "bg-green-500" : "bg-gray-600"}`} />
                      {t.status === "open" ? "Open" : "Closed"} · #{String(t.id).slice(-6)}
                    </p>
                  </button>
                ))}
                {myTickets.length === 0 && (
                  <p className="text-[10px] text-gray-600 italic px-2 py-6 text-center">No tickets yet</p>
                )}
              </div>

              <div className="flex-1 flex flex-col min-h-0 bg-black/40 rounded-2xl border border-white/5 overflow-hidden">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4 min-h-[300px]">
                  {selected ? (
                    (selected.messages || []).map((msg: any, i: number) => (
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
                              <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 rounded text-[6px] font-black uppercase tracking-widest">Staff</span>
                            )}
                          </div>
                          <p className="text-sm font-bold leading-relaxed">{msg.text}</p>
                          <span className="text-[7px] text-gray-600 mt-1 block">{msg.time}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <div className="w-14 h-14 rounded-full bg-yellow-500/10 border border-yellow-500/25 flex items-center justify-center mb-4">
                        <MessageSquare className="w-7 h-7 text-yellow-500/70" />
                      </div>
                      <p className="text-sm font-black uppercase tracking-wider text-white/80 mb-2">Need Help?</p>
                      <p className="text-[10px] text-gray-500 max-w-[300px] leading-relaxed">
                        Write a message below to open a new support ticket. Our team will respond shortly.
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-white/5 bg-black/40">
                  {selected && selected.status === "closed" ? (
                    <p className="text-center text-[9px] text-gray-600 uppercase tracking-widest py-2">
                      This ticket is closed — start a new one for a new topic.
                    </p>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && send()}
                        placeholder={selected ? "Type a reply..." : "Type a message to create a ticket..."}
                        className="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-500/60 transition-all text-white placeholder:text-gray-600"
                      />
                      <button
                        onClick={send}
                        disabled={busy || !message.trim()}
                        className="px-6 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-40 flex items-center gap-2 shadow-lg shadow-yellow-500/20"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        {selected ? "Reply" : "New"}
                      </button>
                    </div>
                  )}
                  {selected && (
                    <button
                      onClick={() => { setSelectedId(null); setMessage(""); }}
                      className="mt-2 w-full py-1 text-[8px] font-black text-gray-600 hover:text-yellow-500 uppercase tracking-widest transition flex items-center justify-center gap-1"
                    >
                      <X className="w-3 h-3" /> Close this ticket view
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}