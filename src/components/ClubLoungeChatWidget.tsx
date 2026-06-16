"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  ImagePlus,
  Smile,
  Reply,
} from "lucide-react";
import { profileImgClass } from "@/lib/profileImage";
import {
  COMMUNITY_CHAT_INPUT_EMOJIS,
  COMMUNITY_CHAT_REACTION_EMOJIS,
  type CommunityChatMessage,
  type CommunityChatReplyRef,
} from "@/lib/communityChat";

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
  const [messages, setMessages] = useState<CommunityChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [reactionPickerId, setReactionPickerId] = useState<number | null>(null);
  const [replyTo, setReplyTo] = useState<CommunityChatReplyRef | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    const id = setInterval(loadMessages, 4000);
    return () => clearInterval(id);
  }, [isOpen, canChat, loadMessages]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOpen, replyTo, imagePreview]);

  const uploadChatImage = async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("field", "chatImage");
    const res = await fetch("/api/user/upload", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) throw new Error(data.error || "Upload failed");
    return data.url as string;
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file || file.size > 4 * 1024 * 1024) return;
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
        return;
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 4 * 1024 * 1024) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSend = async () => {
    const text = draft.trim();
    if ((!text && !imageFile) || sending || !canChat) return;
    setSending(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        imageUrl = (await uploadChatImage(imageFile)) || undefined;
      }
      const res = await fetch("/api/chat/lounge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          text,
          ...(imageUrl ? { image: imageUrl } : {}),
          ...(replyTo ? { replyTo } : {}),
        }),
      });
      if (res.ok) {
        setDraft("");
        setImagePreview(null);
        setImageFile(null);
        setReplyTo(null);
        setEmojiPickerOpen(false);
        await loadMessages();
      }
    } finally {
      setSending(false);
    }
  };

  const handleReact = async (messageId: number, emoji: string) => {
    try {
      await fetch("/api/chat/lounge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "react", messageId, emoji }),
      });
      setReactionPickerId(null);
      await loadMessages();
    } catch {
      /* ignore */
    }
  };

  const insertEmoji = (emoji: string) => {
    setDraft((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const startReply = (m: CommunityChatMessage) => {
    setReplyTo({
      id: m.id,
      userId: String(m.userId),
      userName: m.userName,
      text: m.text || (m.image ? "📷 Image" : ""),
    });
    inputRef.current?.focus();
  };

  const handleToggle = () => {
    if (!canChat) {
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { msg: "Sign in with Discord to use Community Chat.", type: "error" },
        })
      );
      return;
    }
    setIsOpen(!isOpen);
  };

  const renderReactions = (m: CommunityChatMessage) => {
    const reactions = m.reactions || {};
    const entries = Object.entries(reactions);
    if (!entries.length) return null;
    return (
      <div className={`flex flex-wrap gap-1 mt-1 ${String(m.userId) === String(currentUserId) ? "justify-end" : "justify-start"}`}>
        {entries.map(([uid, emoji]) => (
          <button
            key={uid}
            type="button"
            onClick={() => void handleReact(m.id, emoji)}
            className={`text-[11px] px-1.5 py-0.5 rounded-full border transition ${
              uid === String(currentUserId)
                ? "bg-[#00ffff]/15 border-[#00ffff]/30"
                : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9998] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && canChat && (
          <motion.div
            key="community-chat-panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-3 w-[min(360px,calc(100vw-2rem))] bg-[#0a0a16]/95 backdrop-blur-2xl border border-[#00ffff]/25 rounded-[1.5rem] shadow-[0_0_50px_rgba(0,255,255,0.12)] overflow-hidden flex flex-col"
          >
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#00ffff]/10 via-[#8a2be2]/10 to-[#ff007f]/10 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00ffff] to-[#ff007f] flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-black" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white">Community Chat</p>
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

            <div ref={scrollRef} className="h-64 sm:h-72 overflow-y-auto px-3 py-3 space-y-3 custom-scrollbar">
              {loading && messages.length === 0 ? (
                <p className="text-center text-[10px] text-gray-500 font-bold uppercase tracking-widest py-8">
                  Connecting…
                </p>
              ) : messages.length === 0 ? (
                <p className="text-center text-[10px] text-gray-500 font-bold uppercase tracking-widest py-8">
                  Say hi to the community
                </p>
              ) : (
                messages.map((m) => {
                  const isMine = String(m.userId) === String(currentUserId);
                  return (
                    <div
                      key={m.id}
                      className={`group flex gap-2 ${isMine ? "flex-row-reverse" : ""}`}
                    >
                      <img
                        src={m.userImage}
                        alt=""
                        className={profileImgClass(m.userImage, "w-7 h-7 rounded-lg shrink-0 object-cover mt-0.5")}
                      />
                      <div className={`max-w-[78%] min-w-0 ${isMine ? "items-end" : "items-start"} flex flex-col`}>
                        <div
                          className={`rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                            isMine
                              ? "bg-[#00ffff]/15 border border-[#00ffff]/25 text-white"
                              : "bg-white/[0.04] border border-white/10 text-white/85"
                          }`}
                        >
                          <p className="text-[8px] font-black uppercase tracking-wider text-[#00ffff]/80 mb-1">
                            {m.userName}
                          </p>
                          {m.replyTo ? (
                            <div className="mb-1.5 px-2 py-1 rounded-lg border-l-2 border-[#ff007f]/60 bg-black/30 text-[10px] text-white/60">
                              <span className="font-black text-[#ff007f]/90">{m.replyTo.userName}</span>
                              <p className="truncate">{m.replyTo.text || "…"}</p>
                            </div>
                          ) : null}
                          {m.image ? (
                            <img
                              src={m.image}
                              alt=""
                              className="max-w-full max-h-40 rounded-xl mb-1.5 border border-white/10 object-contain"
                              loading="lazy"
                            />
                          ) : null}
                          {m.text ? <p className="whitespace-pre-wrap break-words">{m.text}</p> : null}
                        </div>

                        {renderReactions(m)}

                        <div className={`flex gap-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${reactionPickerId === m.id ? "opacity-100" : ""}`}>
                          {reactionPickerId === m.id ? (
                            <div className="flex items-center gap-0.5 px-2 py-1 rounded-xl bg-black/70 border border-white/10">
                              {COMMUNITY_CHAT_REACTION_EMOJIS.map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => void handleReact(m.id, emoji)}
                                  className="text-base hover:scale-125 transition-transform px-0.5"
                                >
                                  {emoji}
                                </button>
                              ))}
                              <button type="button" onClick={() => setReactionPickerId(null)} className="p-0.5 text-gray-500 hover:text-white ml-1">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                title="React"
                                onClick={() => setReactionPickerId(m.id)}
                                className="p-1 rounded-lg bg-white/5 text-gray-400 hover:text-[#00ffff] transition"
                              >
                                <Smile className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                title="Reply"
                                onClick={() => startReply(m)}
                                className="p-1 rounded-lg bg-white/5 text-gray-400 hover:text-[#ff007f] transition"
                              >
                                <Reply className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 border-t border-white/10 space-y-2 shrink-0">
              {replyTo ? (
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-[#ff007f]/10 border border-[#ff007f]/25">
                  <Reply className="w-3.5 h-3.5 text-[#ff007f] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[8px] font-black uppercase text-[#ff007f]">Reply to {replyTo.userName}</p>
                    <p className="text-[10px] text-white/70 truncate">{replyTo.text || "…"}</p>
                  </div>
                  <button type="button" onClick={() => setReplyTo(null)} className="p-1 text-gray-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : null}

              {imagePreview ? (
                <div className="relative inline-block">
                  <img src={imagePreview} alt="" className="max-h-20 rounded-xl border border-white/10" />
                  <button
                    type="button"
                    onClick={() => { setImagePreview(null); setImageFile(null); }}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : null}

              {emojiPickerOpen ? (
                <div className="flex flex-wrap gap-1 p-2 rounded-xl bg-black/50 border border-white/10">
                  {COMMUNITY_CHAT_INPUT_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      className="text-lg hover:scale-125 transition-transform px-0.5"
                    >
                      {emoji}
                    </button>
                  ))}
                  <button type="button" onClick={() => setEmojiPickerOpen(false)} className="ml-auto p-1 text-gray-500 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : null}

              <div className="flex gap-1.5">
                <input ref={fileInputRef} type="file" accept="image/*,.gif" className="hidden" onChange={handleFileSelect} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-[#00ffff] hover:border-[#00ffff]/30 transition shrink-0"
                  title="Upload image"
                >
                  <ImagePlus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setEmojiPickerOpen((v) => !v)}
                  className={`p-2 rounded-xl border transition shrink-0 ${
                    emojiPickerOpen
                      ? "bg-[#00ffff]/15 border-[#00ffff]/30 text-[#00ffff]"
                      : "bg-white/5 border-white/10 text-gray-400 hover:text-[#00ffff]"
                  }`}
                  title="Emoji"
                >
                  <Smile className="w-4 h-4" />
                </button>
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onPaste={handlePaste}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSend();
                    }
                  }}
                  placeholder="Message the community…"
                  className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-[#00ffff]/40"
                />
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={sending || (!draft.trim() && !imageFile)}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-[#00ffff] to-[#ff007f] text-black disabled:opacity-30 transition hover:opacity-90 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!hideFab && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleToggle}
          title="Community Chat"
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#00ffff] via-[#8a2be2] to-[#ff007f] text-black flex items-center justify-center relative shadow-[0_0_35px_rgba(0,255,255,0.25)]"
        >
          <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
        </motion.button>
      )}
    </div>
  );
}
