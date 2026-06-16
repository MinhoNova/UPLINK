"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, ChevronRight } from "lucide-react";

interface SupportChatWidgetProps {
  tickets: any[];
  selectedTicket: any | null;
  setSelectedTicket: (t: any) => void;
  ticketMessage: string;
  setTicketMessage: (msg: string) => void;
  currentUserId: string;
  currentUserDisplay: string;
  onSendMessage: () => void;
  onOpenFullSupport: () => void;
  ticketsLastViewedAt?: number;
  onViewTickets?: () => void;
  isAdmin?: boolean;
  adminUnreadCount?: number;
  hideFab?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function SupportChatWidget({
  tickets,
  selectedTicket,
  setSelectedTicket,
  ticketMessage,
  setTicketMessage,
  currentUserId,
  currentUserDisplay,
  onSendMessage,
  onOpenFullSupport,
  ticketsLastViewedAt = 0,
  onViewTickets,
  isAdmin,
  adminUnreadCount = 0,
  hideFab = false,
  open: controlledOpen,
  onOpenChange,
}: SupportChatWidgetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = (v: boolean) => {
    if (onOpenChange) onOpenChange(v);
    else setInternalOpen(v);
  };
  const userTickets = tickets.filter((t: any) => t.userId === currentUserId);
  const activeTicket = selectedTicket && selectedTicket.userId === currentUserId && selectedTicket.status === "open"
    ? selectedTicket
    : userTickets.find((t: any) => t.status === "open") || null;
  const unreadCount = userTickets.filter((t: any) =>
    t.status === "open" && t.messages?.some((m: any) => m.id > ticketsLastViewedAt)
  ).length;
  const displayTicket = activeTicket || null;

  const handleToggle = () => {
    if (!isOpen && !selectedTicket && activeTicket) setSelectedTicket(activeTicket);
    setIsOpen(!isOpen);
    if (!isOpen) onViewTickets?.();
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-[9999] flex flex-col items-start max-w-[calc(100vw-2rem)]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[min(360px,calc(100vw-2rem))] bg-[#0a0a16]/95 backdrop-blur-2xl border border-yellow-500/30 rounded-[1.5rem] shadow-[0_0_40px_rgba(255,215,0,0.1)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-gradient-to-r from-yellow-500/[0.04] to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-yellow-500" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Support</h3>
                  <p className="text-[8px] text-gray-500 uppercase tracking-widest">
                    {unreadCount > 0
                      ? `${unreadCount} unread ticket${unreadCount > 1 ? 's' : ''}`
                      : 'No unread tickets'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-white/5 transition-all"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Messages */}
            <div className="h-[320px] overflow-y-auto p-4 space-y-3">
              {displayTicket && displayTicket.messages?.length > 0 ? (
                displayTicket.messages.map((msg: any, i: number) => (
                  <div
                    key={i}
                    className={`flex ${msg.fromId === currentUserId ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                        msg.fromId === currentUserId
                          ? 'bg-yellow-500/20 text-yellow-100 rounded-tr-none border border-yellow-500/20'
                          : 'bg-white/[0.06] text-gray-200 rounded-tl-none border border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-60">
                          {msg.from === currentUserDisplay ? 'You' : msg.from}
                        </span>
                        {msg.fromId === 'bot' && (
                          <span className="px-1.5 py-0.5 bg-[#00ffff]/20 text-[#00ffff] rounded text-[6px] font-black uppercase tracking-widest">Bot</span>
                        )}
                        {msg.fromId !== currentUserId && msg.fromId !== 'bot' && (
                          <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 rounded text-[6px] font-black uppercase tracking-widest">Staff</span>
                        )}
                      </div>
                      <p className="text-sm font-bold leading-relaxed">{msg.text}</p>
                      <span className="text-[7px] text-gray-600 mt-1 block">{msg.time}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-4">
                    <MessageSquare className="w-6 h-6 text-yellow-500/60" />
                  </div>
                  <p className="text-sm font-black text-white/80 uppercase tracking-wider mb-2">Need Help?</p>
                  <p className="text-[10px] text-gray-500 max-w-[260px] leading-relaxed">
                    Send a message below and our team will get back to you.
                  </p>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-white/5 bg-black/40">
              <div className="flex gap-2">
                <input
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      onSendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-500/60 transition-all text-white placeholder:text-gray-600"
                />
                <button
                  onClick={onSendMessage}
                  className="w-10 h-10 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black flex items-center justify-center transition-all shadow-lg shadow-yellow-500/20"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => { onOpenFullSupport(); handleClose(); }}
                className="w-full mt-2 py-1.5 text-[8px] font-black text-gray-500 hover:text-yellow-500 uppercase tracking-widest transition-all flex items-center justify-center gap-1"
              >
                Open Support Center <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      {!hideFab && (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleToggle}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 text-black shadow-[0_0_30px_rgba(255,215,0,0.3)] hover:shadow-[0_0_40px_rgba(255,215,0,0.5)] transition-shadow flex items-center justify-center relative"
      >
        <MessageSquare className="w-6 h-6" />
        {!isOpen && (isAdmin ? adminUnreadCount : unreadCount) > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-[#0a0a16] flex items-center justify-center text-[8px] font-black text-white shadow-lg">
            {isAdmin ? adminUnreadCount : unreadCount}
          </div>
        )}
      </motion.button>
      )}
    </div>
  );
}
