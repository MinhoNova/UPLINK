"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send } from "lucide-react";
import { profileImgClass } from "@/lib/profileImage";

type LoungeMessage = {
  id: number;
  userId: string;
  userName: string;
  userImage: string;
  text: string;
  createdAt: number;
};

type Props = {
  currentUserId: string;
  canChat?: boolean;
  hideFab?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export default function ClubLoungeChatWidget({
  currentUserId,
  canChat = true,
  hideFab = false,
  open: controlledOpen,
  onOpenChange,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [messages, setMessages] = useState<LoungeMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = (v: boolean) => {
    if (onOpenChange) onOpenChange(v);
    else setInternalOpen(v);
  };

  const loadMessages = useCallback(async () => {
    if (!canChat) return;
    try {
      const res = await fetch("/api/chat/lounge", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      /* ignore */
    }
  }, [canChat]);

  useEffect(() => {
    if (!isOpen || !canChat) return;
    setLoading(true);
    loadMessages().finally(() => setLoading(false));
    const id = setInterval(loadMessages, 5000);
    return () => clearInterval(id);
  }, [isOpen, canChat, loadMessages]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOpen]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending || !canChat) return;
    setSending(true);
    try {
      const res = await fetch("/api/chat/lounge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        setDraft("");
        await loadMessages();
      }
    } finally {
      setSending(false);
    }
  };

  const handleToggle = () => {
    if (!canChat) {
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { msg: "Sign in with Discord to use live chat.", type: "error" },
        })
      );
      return;
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9998] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && canChat && (
          <motion.div
            key="lounge-panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-3 w-[min(360px,calc(100vw-2rem))] bg-[#0a0a16]/95 backdrop-blur-2xl border border-[#00ffff]/25 rounded-[1.5rem] shadow-[0_0_50px_rgba(0,255,255,0.12)] overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#00ffff]/10 via-[#8a2be2]/10 to-[#ff007f]/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00ffff] to-[#ff007f] flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-black" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white">Live Chat</p>
                  <p className="text-[8px] text-gray-500 font-bold uppercase tracking-wider">Everyone on Uplink</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div ref={scrollRef} className="h-64 sm:h-72 overflow-y-auto px-3 py-3 space-y-2">
              {loading && messages.length === 0 ? (
                <p className="text-center text-[10px] text-gray-500 font-bold uppercase tracking-widest py-8">
                  Connecting…
                </p>
              ) : messages.length === 0 ? (
                <p className="text-center text-[10px] text-gray-500 font-bold uppercase tracking-widest py-8">
                  Say hi to the community
                </p>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex gap-2 ${String(m.userId) === String(currentUserId) ? "flex-row-reverse" : ""}`}
                  >
                    <img
                      src={m.userImage}
                      alt=""
                      className={profileImgClass(m.userImage, "w-7 h-7 rounded-lg shrink-0 object-cover")}
                    />
                    <div
                      className={`max-w-[75%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                        String(m.userId) === String(currentUserId)
                          ? "bg-[#00ffff]/15 border border-[#00ffff]/25 text-white"
                          : "bg-white/[0.04] border border-white/10 text-white/85"
                      }`}
                    >
                      <p className="text-[8px] font-black uppercase tracking-wider text-[#00ffff]/80 mb-0.5">
                        {m.userName}
                      </p>
                      <p className="whitespace-pre-wrap break-words">{m.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-white/10 flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder="Message everyone…"
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00ffff]/40"
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={sending || !draft.trim()}
                className="p-2.5 rounded-xl bg-gradient-to-r from-[#00ffff] to-[#ff007f] text-black disabled:opacity-30 transition hover:opacity-90"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!hideFab && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleToggle}
          title="Live Chat"
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#00ffff] via-[#8a2be2] to-[#ff007f] text-black flex items-center justify-center relative shadow-[0_0_35px_rgba(0,255,255,0.25)]"
        >
          <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
        </motion.button>
      )}
    </div>
  );
}
