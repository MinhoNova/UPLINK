"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Sparkles } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function AssistantChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError("");
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        reply?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error || "The assistant is unavailable right now.");
        setMessages([...next, { role: "assistant", content: "Something went wrong. Please try again." }]);
        return;
      }
      setMessages([...next, { role: "assistant", content: data.reply || "" }]);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-[9996] flex flex-col items-start">
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[360px] max-w-[calc(100vw-3rem)] bg-[#0a0a16]/95 backdrop-blur-2xl border border-cyan-400/20 rounded-[1.5rem] shadow-[0_0_40px_rgba(0,255,255,0.08)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-gradient-to-r from-cyan-400/[0.05] to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    UPLINK Assistant
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                  </h3>
                  <p className="text-[8px] text-gray-500 uppercase tracking-widest">
                    AI helper — how the site works
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg hover:bg-white/5 transition-all"
                aria-label="Close assistant"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="h-[320px] overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="w-12 h-12 rounded-full bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center mb-4">
                    <Bot className="w-6 h-6 text-cyan-400/60" />
                  </div>
                  <p className="text-sm font-black text-white/80 uppercase tracking-wider mb-2">Need a hand?</p>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    Ask me anything about UPLINK — dungeons, raids, PvP farming, leveling, regions, classes and the Discord server.
                  </p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm font-bold leading-relaxed ${
                      msg.role === "user"
                        ? "bg-cyan-400/20 text-cyan-50 rounded-tr-none border border-cyan-400/20"
                        : "bg-white/[0.06] text-gray-200 rounded-tl-none border border-white/5"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl bg-white/[0.06] border border-white/5 rounded-tl-none">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/60 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/60 animate-bounce [animation-delay:0.15s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/60 animate-bounce [animation-delay:0.3s]" />
                    </div>
                  </div>
                </div>
              )}
              {error && !loading && messages.length > 0 && (
                <p className="text-[9px] text-red-400/80 text-center">{error}</p>
              )}
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-white/5 bg-black/40">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Ask about UPLINK..."
                  className="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-cyan-400/60 transition-all text-white placeholder:text-gray-600"
                />
                <button
                  onClick={send}
                  disabled={loading || !input.trim()}
                  aria-label="Send message"
                  className="w-10 h-10 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black flex items-center justify-center transition-all shadow-lg shadow-cyan-400/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-2 text-[7px] text-gray-600 uppercase tracking-widest text-center">
                AI answers may be imperfect — verify important deals on the site.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        aria-label="Open UPLINK assistant"
        className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 text-black shadow-[0_0_30px_rgba(0,255,255,0.25)] hover:shadow-[0_0_40px_rgba(0,255,255,0.4)] transition-shadow flex items-center justify-center"
      >
        {open ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </motion.button>
    </div>
  );
}