"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare, Search, Trash2 } from "lucide-react";
import { ticketMatchesSearch, isTicketExpired, getTicketHoursLeft } from "@/lib/tickets";

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: any[];
  selectedTicket: any | null;
  setSelectedTicket: (t: any) => void;
  ticketMessage: string;
  setTicketMessage: (msg: string) => void;
  currentUserId: string;
  isAdmin: boolean;
  onSendMessage: () => void;
  onCloseTicket: (ticketId: number) => void;
  onDeleteTicket: (ticketId: number | string) => void;
}

export default function TicketModal({
  isOpen,
  onClose,
  tickets,
  selectedTicket,
  setSelectedTicket,
  ticketMessage,
  setTicketMessage,
  currentUserId,
  isAdmin,
  onSendMessage,
  onCloseTicket,
  onDeleteTicket,
}: TicketModalProps) {
  const [ticketSearch, setTicketSearch] = useState("");
  const [deleteConfirmTicket, setDeleteConfirmTicket] = useState<any>(null);
  const userTickets = tickets
    .filter((t: any) => !isTicketExpired(t))
    .filter((t: any) => isAdmin || t.userId === currentUserId)
    .filter((t: any) => (isAdmin ? ticketMatchesSearch(t, ticketSearch) : true));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-2xl h-[80vh] bg-[#0a0a16] border-2 border-yellow-500/40 rounded-[2.5rem] p-6 shadow-2xl relative flex flex-col"
          >
            {deleteConfirmTicket && (
              <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-sm rounded-[2.5rem] p-6">
                <div className="bg-[#05050a] border border-yellow-500/40 p-8 rounded-3xl max-w-sm w-full text-center shadow-[0_0_40px_rgba(255,215,0,0.12)]">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                    <Trash2 className="w-7 h-7 text-red-400" />
                  </div>
                  <h3 className="text-xl font-black text-white mb-2 uppercase tracking-wider">Delete Ticket?</h3>
                  <p className="text-gray-400 text-sm mb-2">
                    Ticket #{String(deleteConfirmTicket.id).slice(-8)}
                  </p>
                  <p className="text-gray-500 text-xs mb-8 leading-relaxed">
                    This will permanently remove the ticket and all messages. This cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmTicket(null)}
                      className="flex-1 py-3 bg-white/5 text-white font-black uppercase text-[10px] rounded-xl hover:bg-white/10 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteTicket(deleteConfirmTicket.id);
                        setDeleteConfirmTicket(null);
                        setSelectedTicket(null);
                      }}
                      className="flex-1 py-3 bg-red-600 text-white font-black uppercase text-[10px] rounded-xl hover:bg-red-500 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
            <motion.button
              onClick={() => { onClose(); setSelectedTicket(null); }}
              className="absolute top-6 right-6 p-3 bg-white/5 hover:bg-white/10 rounded-full z-50"
            >
              <X />
            </motion.button>
            <h2 className="sr-only">Support Tickets</h2>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
                <MessageSquare className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-wider text-white">Support Center</h2>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                  {selectedTicket
                    ? `Ticket #${selectedTicket.id.toString().slice(-6)} · ${getTicketHoursLeft(selectedTicket)}h left`
                    : `${userTickets.length} tickets · auto-delete after 24h`}
                </p>
              </div>
            </div>

            {selectedTicket ? (
              <div className="flex flex-col min-h-0 bg-black/40 rounded-[2rem] border border-white/5 overflow-hidden flex-1">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-gradient-to-r from-white/[0.02] to-transparent">
                  <div className="flex items-center gap-4">
                    <div className={`w-2.5 h-2.5 rounded-full shadow-lg ${selectedTicket.status === 'open' ? 'bg-green-500 shadow-green-500/50 animate-pulse' : 'bg-gray-500'}`}></div>
                    <div>
                      <p className="text-white font-black text-base">{selectedTicket.subject}</p>
                      <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5">
                        <span className={selectedTicket.status === 'open' ? 'text-green-400' : 'text-gray-400'}>
                          {selectedTicket.status === 'open' ? '● ACTIVE' : '● CLOSED'}
                        </span>
                        <span className="mx-2">•</span>
                        Ticket #{selectedTicket.id.toString().slice(-6)}
                        <span className="mx-2">•</span>
                        {getTicketHoursLeft(selectedTicket)}h remaining
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isAdmin && selectedTicket.status === 'open' && (
                      <button
                        type="button"
                        onClick={() => onCloseTicket(selectedTicket.id)}
                        className="px-4 py-2.5 bg-gray-500/10 text-gray-400 border border-gray-500/30 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-500 hover:text-white transition-all flex items-center gap-2"
                      >
                        <X className="w-3 h-3" /> Close
                      </button>
                    )}
                    {(isAdmin || String(selectedTicket.userId) === String(currentUserId)) && (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmTicket(selectedTicket)}
                        className="px-4 py-2.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedTicket(null)}
                      className="px-4 py-2.5 bg-white/5 text-gray-400 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                      <MessageSquare className="w-3 h-3" /> All Tickets
                    </button>
                  </div>
                </div>
                <div className="overflow-y-auto p-6 space-y-4 flex-1">
                  {selectedTicket.messages.map((msg: any, i: number) => (
                    <div key={i} className={`flex items-end gap-3 ${msg.fromId === currentUserId ? 'justify-end' : 'justify-start'}`}>
                      {msg.fromId !== currentUserId && (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black uppercase ${isAdmin ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : 'bg-[#00ffff]/20 text-[#00ffff] border border-[#00ffff]/30'}`}>
                          {isAdmin ? 'A' : 'U'}
                        </div>
                      )}
                      <div className={`max-w-[80%] ${msg.fromId === currentUserId ? 'order-1' : ''}`}>
                        <div className={`px-5 py-4 rounded-2xl ${msg.fromId === currentUserId ? 'bg-yellow-500/20 text-yellow-100 rounded-tr-none border border-yellow-500/20' : 'bg-white/[0.06] text-gray-200 rounded-tl-none border border-white/5'}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{msg.from}</span>
                            {isAdmin && msg.fromId !== currentUserId && (
                              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-500 rounded text-[7px] font-black uppercase tracking-widest">Staff</span>
                            )}
                          </div>
                          <p className="text-sm font-bold leading-relaxed">{msg.text}</p>
                        </div>
                        <span className="text-[8px] text-gray-600 mt-1.5 block px-1">{msg.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {selectedTicket.status === 'open' && (
                  <div className="px-6 py-4 border-t border-white/5 bg-black/40">
                    <div className="flex gap-3">
                      <input
                        value={ticketMessage}
                        onChange={(e) => setTicketMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onSendMessage()}
                        placeholder="Type a reply..."
                        className="flex-1 bg-black/60 border border-white/10 rounded-2xl px-5 py-3.5 text-sm outline-none focus:border-yellow-500/60 transition-all text-white"
                      />
                      <button
                        onClick={onSendMessage}
                        className="px-8 bg-yellow-500 hover:bg-yellow-400 text-black rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-yellow-500/20 flex items-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4" /> Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col flex-1 min-h-0">
                {isAdmin && (
                  <div className="relative mb-4 shrink-0">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={ticketSearch}
                      onChange={(e) => setTicketSearch(e.target.value)}
                      placeholder="Search by ticket number or subject..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white outline-none focus:border-yellow-500/50 font-bold"
                    />
                  </div>
                )}
                <div className="overflow-y-auto space-y-3 pr-2 flex-1">
                  {userTickets.length > 0 && (
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Recent Tickets</p>
                      <span className="text-[8px] text-gray-600">
                        {userTickets.filter((t: any) => t.status === 'open').length} open
                      </span>
                    </div>
                  )}
                  {userTickets.map((t: any) => (
                    <div
                      key={t.id}
                      onClick={() => { if (isAdmin || t.userId === currentUserId) setSelectedTicket(t); }}
                      className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-yellow-500/30 hover:bg-white/[0.04] cursor-pointer transition-all group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${t.status === 'open' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-gray-600'}`}></div>
                          <div className="min-w-0">
                            <p className="font-black text-white text-sm truncate">{t.subject}</p>
                            <p className="text-[8px] text-gray-500 uppercase tracking-widest mt-0.5">
                              Ticket #{String(t.id).slice(-8)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2.5 py-1 rounded-full text-[7px] font-black uppercase tracking-widest ${t.status === 'open' ? 'bg-green-500/15 text-green-400 border border-green-500/25' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
                            {t.status === 'open' ? 'Open' : 'Closed'}
                          </span>
                          {(isAdmin || String(t.userId) === String(currentUserId)) && (
                            <button
                              type="button"
                              title="Delete ticket"
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirmTicket(t); }}
                              className={`p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all ${isAdmin ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-gray-600">
                        <span className="flex items-center gap-2">
                          <span className="text-yellow-500/70">{t.username}</span>
                          <span>•</span>
                          <span>{t.messages.length} msg</span>
                        </span>
                        <span>{getTicketHoursLeft(t)}h left</span>
                      </div>
                    </div>
                  ))}
                  {userTickets.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-white/5 rounded-[2rem] bg-white/[0.01]">
                      <div className="p-4 bg-yellow-500/10 rounded-full border border-yellow-500/20 mb-6">
                        <MessageSquare className="w-8 h-8 text-yellow-500" />
                      </div>
                      <p className="text-lg font-black uppercase tracking-wider text-white mb-2">No Tickets Yet</p>
                      <p className="text-[10px] text-gray-500 max-w-xs leading-relaxed">Send a message below to create a support ticket. Our team will respond shortly.</p>
                    </div>
                  )}
                </div>
                <div className="pt-4 border-t border-white/5 mt-4">
                  <div className="flex gap-3">
                    <input
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && onSendMessage()}
                      placeholder="Type a message to create a new ticket..."
                      className="flex-1 bg-black/60 border border-white/10 rounded-2xl px-5 py-3.5 text-sm outline-none focus:border-yellow-500/60 transition-all text-white"
                    />
                    <button
                      onClick={onSendMessage}
                      className="px-6 bg-yellow-500 hover:bg-yellow-400 text-black rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-yellow-500/20 flex items-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" /> New
                    </button>
                  </div>
                  <p className="text-[8px] text-gray-600 mt-2 text-center">Tickets auto-delete after 24 hours · send a message to open a new one</p>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
