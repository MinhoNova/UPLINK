"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Send, Flag,
  Trash2, Swords, AlertTriangle, X, Loader2,
  Zap, ImagePlus, Video, Pin, Smile, Pencil,
  ShieldAlert, CheckCircle2, Bell, TrendingUp, Shield, Sword, Coins, Plus
} from "lucide-react";
import Link from "next/link";
import HomeFloatingActions from "@/components/HomeFloatingActions";
import SupportChatWidget from "@/components/SupportChatWidget";
import TicketModal from "@/components/modals/TicketModal";
import { resolveProfileImage, profileImgClass, resolveProfileDisplayName } from "@/lib/profileImage";
import { hasAdminPower } from "@/lib/rolesConstants";
import DeleteNewsButton from "@/components/news/DeleteNewsButton";

const REACTION_TYPES = [
  { type: "LOL", icon: "😂", label: "LOL" },
  { type: "Love", icon: "❤️", label: "Love" },
  { type: "Sad", icon: "😢", label: "Sad" },
  { type: "Wipe", icon: "💀", label: "Wipe" },
  { type: "Carry", icon: "🏆", label: "Carry" },
];

type NewsFeedProps = {
  section: "dungeons" | "leveling";
};

export default function NewsFeed({ section }: NewsFeedProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // News feed data state
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Global user state (from /api/data)
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);

  // Boost requests state (dungeons page only)
  const [boostRequests, setBoostRequests] = useState<any[]>([]);
  const [boostRequestsLoading, setBoostRequestsLoading] = useState(true);
  
  const fetchBoostRequests = useCallback(async () => {
    if (section !== "dungeons") return;
    setBoostRequestsLoading(true);
    try {
      const res = await fetch("/api/boost-requests");
      if (res.ok) {
        const data = await res.json();
        setBoostRequests(data.requests || []);
      }
    } catch {
      // silent
    } finally {
      setBoostRequestsLoading(false);
    }
  }, [section]);

  // Interactive comments state
  const [openComments, setOpenComments] = useState<Set<number>>(new Set());
  const [comments, setComments] = useState<Record<number, any[]>>({});
  const [commentInput, setCommentInput] = useState<Record<number, string>>({});
  const [replyText, setReplyText] = useState("");
  const [replyTo, setReplyTo] = useState<{ postId: number; parentId: number } | null>(null);
  const [commentReactions, setCommentReactions] = useState<Record<number, any[]>>({});
  const [postingComment, setPostingComment] = useState<number | null>(null);

  // Interactive reactors list state
  const [reactionPickerPostId, setReactionPickerPostId] = useState<number | null>(null);
  const [viewingReactors, setViewingReactors] = useState<{ postId: number; type: string; users: any[] } | null>(null);
  const [loadingReactors, setLoadingReactors] = useState(false);

  // Support chat widget state
  const [supportWidgetOpen, setSupportWidgetOpen] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketMessage, setTicketMessage] = useState("");
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [adminTicketsLastSeen, setAdminTicketsLastSeen] = useState(0);

  // Toast notifications state
  const [toasts, setToasts] = useState<any[]>([]);

  const addToast = (msg: string, type: "success" | "error" | "info" = "info") => {
    const id = Date.now();
    setToasts((prev) => [{ id, msg, type }, ...prev]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  };

  const currentUserId = (session?.user as any)?.id || "guest";
  const currentUserDisplay = session?.user?.name || "Member";
  const currentUserDiscordHandle = (session?.user as any)?.username || "";
  const isAdmin = hasAdminPower(currentUserId, currentUserDiscordHandle);

  // Fetch initial news feed
  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/news?section=${section}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error("Failed to load news", err);
    } finally {
      setLoading(false);
    }
  }, [section]);

  // Load support tickets & registered users
  useEffect(() => {
    (async () => {
      try {
        const [dataRes] = await Promise.all([
          fetch("/api/data"),
        ]);
        if (dataRes.ok) {
          const db = await dataRes.json();
          setRegisteredUsers(db.registeredUsers || []);
          if (db.tickets) {
            setTickets(db.tickets.filter((t: any) => t.status !== "closed"));
          }
        }
      } catch (err) {
        console.error("Failed to load global data", err);
      }
    })();
    fetchNews();
    fetchBoostRequests();
  }, [fetchNews, fetchBoostRequests]);

  // Support ticket actions
  const handleSendTicketMessage = async () => {
    if (!ticketMessage.trim()) return;
    const msg = { id: Date.now(), from: currentUserDisplay, fromId: currentUserId, text: ticketMessage, time: new Date().toLocaleString() };
    let updated;
    if (selectedTicket) {
      updated = tickets.map((t) => (t.id === selectedTicket.id ? { ...t, messages: [...t.messages, msg], status: "open" } : t));
      setSelectedTicket({ ...selectedTicket, messages: [...selectedTicket.messages, msg] });
    } else {
      const newTicket = {
        id: Date.now(),
        userId: currentUserId,
        username: currentUserDisplay,
        userHandle: currentUserDiscordHandle,
        subject: ticketMessage.slice(0, 50),
        messages: [msg],
        status: "open",
        createdAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      };
      updated = [newTicket, ...tickets];
      setSelectedTicket(newTicket);
    }
    setTickets(updated);
    setTicketMessage("");
    addToast("Ticket message sent!", "success");

    try {
      await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tickets: updated }),
      });
    } catch (err) {
      console.error("Failed to save tickets", err);
    }
  };

  const markAdminTicketsViewed = () => {
    if (!isAdmin || tickets.length === 0) return;
    const getTicketActivity = (t: any) => {
      const lastMsg = t.messages?.[t.messages.length - 1];
      return lastMsg ? lastMsg.id : t.createdAt;
    };
    const max = Math.max(0, ...tickets.map((t) => getTicketActivity(t)));
    setAdminTicketsLastSeen(max);
  };

  const adminTicketUnread = useMemo(() => {
    if (!isAdmin) return 0;
    const getTicketActivity = (t: any) => {
      const lastMsg = t.messages?.[t.messages.length - 1];
      return lastMsg ? lastMsg.id : t.createdAt;
    };
    return tickets.filter((t) => {
      if (t.status !== "open") return false;
      return getTicketActivity(t) > adminTicketsLastSeen;
    }).length;
  }, [tickets, isAdmin, adminTicketsLastSeen]);

  // Profile dispatcher helper
  const openProfile = (userId: string) => {
    window.dispatchEvent(new CustomEvent("open-player-profile", { detail: { userId } }));
  };

  const getUserDisplay = (userId: string) => {
    const u = registeredUsers.find((uu: any) => String(uu.id) === String(userId));
    return {
      name: u ? resolveProfileDisplayName(u) : null,
      avatar: u ? resolveProfileImage(u) : null,
    };
  };

  const renderAuthorName = (userId: string, storedName?: string) => {
    const d = getUserDisplay(userId);
    const name = d.name || storedName;
    if (!name) return <span className="text-gray-500">Member</span>;
    return <>{name}</>;
  };

  // Reusable avatar component
  const UserAvatar = ({ src, userId, className = "" }: { src: string; userId?: string; className?: string }) => {
    const profileUser = userId ? registeredUsers.find((u: any) => String(u.id) === String(userId)) : null;
    const imgSrc = profileUser ? resolveProfileImage(profileUser) : (src?.trim() || "");

    return (
      <div className={`relative ${className} shrink-0`}>
        <button onClick={() => userId && openProfile(userId)} className="w-full h-full rounded-full overflow-hidden border-2 border-white/10 p-0 bg-black">
          <img src={imgSrc || ""} alt="" className={profileImgClass(imgSrc, "w-full h-full rounded-full")} />
        </button>
      </div>
    );
  };

  // Reactions & Reactors list handlers
  const handleReaction = async (postId: number, type: string) => {
    if (!currentUserId || currentUserId === "guest") {
      addToast("Please login to react", "error");
      return;
    }

    // Optimistically update the items list state
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (!item.sourcePost || item.sourcePost.id !== postId) return item;
        const list = [...(item.sourcePost.reactions || [])];
        const existing = list.find((r: any) => r.type === type);
        if (existing) {
          if (existing.userReacted) {
            existing.count = Math.max(0, existing.count - 1);
            existing.userReacted = false;
          } else {
            existing.count++;
            existing.userReacted = true;
          }
        } else {
          list.push({ type, count: 1, userReacted: true });
        }
        return {
          ...item,
          sourcePost: { ...item.sourcePost, reactions: list },
        };
      })
    );

    try {
      await fetch("/api/community/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, type }),
      });
    } catch {
      fetchNews();
    }
  };

  const handleViewReactors = async (postId: number, type: string) => {
    setLoadingReactors(true);
    try {
      const res = await fetch(`/api/community/reactions?postId=${postId}&type=${type}`);
      const data = await res.json();
      setViewingReactors({ postId, type, users: data.users || [] });
    } catch {
      setViewingReactors(null);
    } finally {
      setLoadingReactors(false);
    }
  };

  // Comment Handlers
  const fetchComments = async (postId: number) => {
    const res = await fetch(`/api/community/comments?postId=${postId}`);
    if (res.ok) {
      const data = await res.json();
      setComments((prev) => ({ ...prev, [postId]: data }));
      // Load reactions for all comments
      const ids = data.map((c: any) => c.id);
      if (ids.length > 0) {
        const rr = await fetch(`/api/community/comment-reactions?commentIds=${ids.join(",")}`);
        if (rr.ok) {
          const rData = await rr.json();
          setCommentReactions((prev) => ({ ...prev, ...rData }));
        }
      }
    }
  };

  const toggleComments = async (postId: number) => {
    const next = new Set(openComments);
    if (next.has(postId)) {
      next.delete(postId);
    } else {
      next.add(postId);
      fetchComments(postId);
    }
    setOpenComments(next);
  };

  const postComment = async (postId: number, parentId?: number | null) => {
    const text = parentId ? replyText.trim() : commentInput[postId]?.trim();
    if (!text) return;
    setPostingComment(postId);
    const res = await fetch("/api/community/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, content: text, parentId: parentId || null }),
    });
    if (parentId) {
      setReplyText("");
      setReplyTo(null);
    } else {
      setCommentInput((prev) => ({ ...prev, [postId]: "" }));
    }
    if (res.ok) {
      await fetchComments(postId);
      addToast("Comment posted!", "success");
    }
    setPostingComment(null);
  };

  const handleCommentReaction = async (commentId: number, type: string) => {
    await fetch("/api/community/comment-reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId, type }),
    });
    const rr = await fetch(`/api/community/comment-reactions?commentIds=${commentId}`);
    if (rr.ok) {
      const data = await rr.json();
      setCommentReactions((prev) => ({ ...prev, ...data }));
    }
  };

  const deleteComment = async (postId: number, commentId: number) => {
    await fetch("/api/community/comments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId }),
    });
    fetchComments(postId);
    addToast("Comment deleted", "info");
  };

  const accentColor = section === "leveling" ? "text-[#00ffff] border-[#00ffff]/25 bg-[#00ffff]/10" : "text-[#ff007f] border-[#ff007f]/25 bg-[#ff007f]/10";
  const inactiveAccentHover = section === "leveling" ? "hover:text-[#ff007f] hover:border-[#ff007f]/30 hover:bg-[#ff007f]/10" : "hover:text-[#00ffff] hover:border-[#00ffff]/30 hover:bg-[#00ffff]/10";

  return (
    <main className="min-h-screen bg-[#05050a] text-white selection:bg-[#ff007f]/30">
      
      {/* Toast Layer */}
      <div className="fixed bottom-10 right-10 z-[9999] flex flex-col gap-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, x: 20 }}
              className={`pointer-events-auto px-8 py-5 rounded-2xl border-2 backdrop-blur-xl shadow-2xl flex items-center gap-4 min-w-[300px] max-w-md ${
                t.type === "error"
                  ? "bg-red-500/10 border-red-500 text-red-500"
                  : t.type === "success"
                  ? "bg-green-500/10 border-green-500 text-green-500"
                  : "bg-black/80 border-[#00ffff] text-[#00ffff]"
              }`}
            >
              {t.type === "error" ? <AlertTriangle className="w-6 h-6 shrink-0" /> : <Bell className="w-6 h-6 shrink-0" />}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Alert Notification</p>
                <p className="font-black text-sm">{t.msg}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Lobby Side Floating Actions */}
      <HomeFloatingActions
        onOpenSupport={() => setSupportWidgetOpen((prev) => !prev)}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        supportUnread={adminTicketUnread}
        supportOpen={supportWidgetOpen}
      />

      {/* Support Chat Widget */}
      <SupportChatWidget
        tickets={tickets}
        selectedTicket={selectedTicket}
        setSelectedTicket={setSelectedTicket}
        ticketMessage={ticketMessage}
        setTicketMessage={setTicketMessage}
        currentUserId={currentUserId}
        currentUserDisplay={currentUserDisplay}
        onSendMessage={handleSendTicketMessage}
        onOpenFullSupport={() => setIsTicketModalOpen(true)}
        hideFab
        open={supportWidgetOpen}
        onOpenChange={setSupportWidgetOpen}
      />

      {/* Support Tickets Modal */}
      <TicketModal
        isOpen={isTicketModalOpen}
        onClose={() => {
          setIsTicketModalOpen(false);
          markAdminTicketsViewed();
        }}
        tickets={tickets}
        selectedTicket={selectedTicket}
        setSelectedTicket={setSelectedTicket}
        ticketMessage={ticketMessage}
        setTicketMessage={setTicketMessage}
        onSendMessage={handleSendTicketMessage}
        onCloseTicket={(id) => {
          const updated = tickets.map((t) => (t.id === id ? { ...t, status: "closed" } : t));
          setTickets(updated);
          setSelectedTicket(null);
          fetch("/api/data", { method: "POST", body: JSON.stringify({ tickets: updated }) });
        }}
        onDeleteTicket={(id) => {
          const updated = tickets.filter((t) => String(t.id) !== String(id));
          setTickets(updated);
          setSelectedTicket(null);
          fetch("/api/data", { method: "POST", body: JSON.stringify({ tickets: updated }) });
        }}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
      />

      {/* Reactors Details Modal */}
      <AnimatePresence>
        {viewingReactors && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gradient-to-br from-[#0c0c1e] to-black border border-white/10 rounded-[2rem] w-full max-w-xs p-5 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                <h3 className="font-black text-xs uppercase tracking-wider text-gray-400">
                  Reacted {REACTION_TYPES.find((r) => r.type === viewingReactors.type)?.icon}
                </h3>
                <button onClick={() => setViewingReactors(null)} className="text-gray-500 hover:text-white transition p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {loadingReactors ? (
                <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-[#00ffff]" /></div>
              ) : viewingReactors.users.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">No reactions found</p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2.5 custom-scrollbar">
                  {viewingReactors.users.map((u) => (
                    <div key={u.userId} className="flex items-center gap-2">
                      <UserAvatar src={u.image} userId={u.userId} className="w-6 h-6" />
                      <span className="text-xs font-black text-white/80">{u.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className={`mx-auto px-4 pt-28 pb-12 ${section === "dungeons" ? "max-w-6xl" : "max-w-5xl"}`}>
        
        {/* Navigation tabs */}
        <div className="flex items-center gap-2 mb-8">
          <Link
            href="/news/leveling"
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition-all ${
              section === "leveling" ? "text-[#00ffff] border-[#00ffff]/25 bg-[#00ffff]/10" : `text-white/40 border-white/10 ${inactiveAccentHover}`
            }`}
          >
            <span>⚡</span> Leveling News
          </Link>
          <Link
            href="/news/dungeons"
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition-all ${
              section === "dungeons" ? "text-[#ff007f] border-[#ff007f]/25 bg-[#ff007f]/10" : `text-white/40 border-white/10 ${inactiveAccentHover}`
            }`}
          >
            <span>🏰</span> Dungeon News
          </Link>
        </div>

        <div className={`${section === "dungeons" ? "flex gap-8" : ""}`}>
        {/* Content feed */}
        <div className={`space-y-6 ${section === "dungeons" ? "flex-1 min-w-0" : ""}`}>
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-[#00ffff] animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-[2rem]">
              <p className="text-gray-500 text-xs font-black uppercase tracking-widest">No news yet. Check back soon.</p>
            </div>
          ) : (
            items.map((item) => {
              const hasSharedPost = !!item.sourcePost;

              // Shared Post Layout
              if (hasSharedPost) {
                const post = item.sourcePost;
                return (
                  <div
                    key={item.id}
                    className="bg-gradient-to-br from-[#070710] to-black border border-white/5 rounded-[2rem] p-5 md:p-6 shadow-2xl transition"
                  >
                    {/* Shared by header */}
                    <div className="flex items-center gap-2 mb-4">
                      {item.authorImage ? (
                        <img
                          src={item.authorImage}
                          alt=""
                          className="w-5 h-5 rounded-full border border-white/10 bg-black"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10" />
                      )}
                      <span className="text-[10px] text-gray-500 font-black">
                        Shared by <span className="text-white/80">{item.authorName}</span>
                      </span>
                      {String(item.authorId) === String(currentUserId) && (
                        <div className="ml-auto">
                          <DeleteNewsButton newsId={item.id} authorId={item.authorId} onDeleted={() => setItems((prev) => prev.filter((i) => i.id !== item.id))} />
                        </div>
                      )}
                    </div>

                                        {/* Nested original post box */}
                    <div className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-5 shadow-inner relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-[#ff007f]/5 blur-3xl rounded-full translate-x-6 -translate-y-6" />
                      
                      {/* Author Header */
}
                      <div className="flex items-center gap-3 mb-3 relative z-10">
                        <UserAvatar src={post.userImage || ""} userId={post.userId || ""} className="w-9 h-9" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-black text-white/90 truncate block">
                            {renderAuthorName(post.userId, post.userName)}
                          </span>
                          <span className="text-[9px] text-gray-500 font-black">
                            {new Date(post.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Post Title */}
                      {post.title && (
                        <Link
                          href={`/community/post/${post.id}`}
                          className="block text-base font-black text-white mb-2 relative z-10 group-hover:text-[#00ffff] transition"
                        >
                          {post.title}
                        </Link>
                      )}

                      {/* Post Content */}
                      <Link href={`/community/post/${post.id}`} className="block relative z-10">
                        <p className="text-sm text-white/70 mb-3 whitespace-pre-wrap leading-relaxed group-hover:text-white/90 transition">
                          {post.content}
                        </p>
                      </Link>

                      {/* Post Image/Video */}
                      {post.image && (
                        <Link href={`/community/post/${post.id}`} className="block mb-3 rounded-2xl overflow-hidden border border-white/5 relative z-10">
                          {post.image.match(/\.(mp4|webm|mov)(\?|$)/i) ? (
                            <video src={post.image} className="w-full max-h-96 bg-black/40" controls preload="metadata" onClick={(e) => e.stopPropagation()} />
                          ) : (
                            <img src={post.image} alt="" className="w-full max-h-96 object-contain bg-black/40" loading="lazy" />
                          )}
                        </Link>
                      )}

                      {/* Post Tags */}
                      {post.tags?.length > 0 && (
                        <div className="flex items-center gap-1.5 mb-3 flex-wrap relative z-10">
                          {post.tags.map((tag: string) => (
                            <span
                              key={tag}
                              className="text-[8px] font-black bg-white/5 text-gray-400 px-2 py-0.5 rounded-full uppercase tracking-wider"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Reactions & Actions Section */}
                      <div className="flex items-center justify-between pt-3 border-t border-white/5 relative z-10">
                        {/* Reactions pick and counts */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {REACTION_TYPES.map((rt) => {
                            const reaction = post.reactions?.find((r: any) => r.type === rt.type);
                            if (!reaction?.count) return null;
                            const active = reaction?.userReacted;
                            return (
                              <div
                                key={rt.type}
                                className="flex items-center overflow-hidden rounded-xl border transition-all bg-white/[0.04] border-white/5 hover:bg-white/10"
                              >
                                <button
                                  type="button"
                                  onClick={() => handleReaction(post.id, rt.type)}
                                  className={`flex items-center gap-1 px-1.5 py-1 text-lg transition-all ${
                                    active ? "bg-[#00ffff]/15" : ""
                                  }`}
                                >
                                  <span className="hover:scale-125 transition-transform inline-block">{rt.icon}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleViewReactors(post.id, rt.type)}
                                  className={`px-1.5 py-1 text-[10px] font-black border-l border-white/10 hover:bg-white/10 transition-all ${
                                    active ? "text-[#00ffff]" : "text-gray-500"
                                  }`}
                                  title="View reactors"
                                >
                                  {reaction.count}
                                </button>
                              </div>
                            );
                          })}

                          {reactionPickerPostId === post.id ? (
                            <div className="flex items-center gap-0.5 px-2 py-1 rounded-xl bg-black/60 border border-white/10">
                              {REACTION_TYPES.map((rt) => (
                                <button
                                  key={rt.type}
                                  type="button"
                                  onClick={() => {
                                    handleReaction(post.id, rt.type);
                                    setReactionPickerPostId(null);
                                  }}
                                  className="text-lg hover:scale-125 transition-transform px-0.5"
                                  title={rt.label}
                                >
                                  {rt.icon}
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => setReactionPickerPostId(null)}
                                className="p-0.5 text-gray-500 hover:text-white ml-1"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setReactionPickerPostId(post.id)}
                              className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/[0.04] border border-white/5 hover:bg-white/10 hover:border-[#00ffff]/30 transition"
                              title="React"
                            >
                              <Smile className="w-4 h-4 text-gray-400" />
                            </button>
                          )}
                        </div>

                        {/* Comments Toggle */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleComments(post.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-black text-gray-400 hover:text-[#00ffff] hover:bg-[#00ffff]/5 transition"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />{" "}
                            {openComments.has(post.id) ? "Hide" : `Comment${(comments[post.id]?.length || 0) > 0 ? ` (${comments[post.id].length})` : ""}`}
                          </button>
                        </div>
                      </div>

                      {/* Comments Drawer */}
                      {openComments.has(post.id) && (
                        <div className="mt-4 pt-4 border-t border-white/5 relative z-10 space-y-3">
                          {(() => {
                            const all = comments[post.id] || [];
                            const topLevel = all.filter((c: any) => !c.parentId);
                            if (topLevel.length === 0 && !all.some((c: any) => c.parentId)) {
                              return <p className="text-[10px] text-gray-500 text-center">No comments yet</p>;
                            }
                            return topLevel.map((c: any) => {
                              const replies = all.filter((r: any) => r.parentId === c.id);
                              return (
                                <div key={c.id} className="border-b border-white/[0.02] pb-3 last:border-0 last:pb-0">
                                  <div className="flex items-start gap-2.5">
                                    <UserAvatar src={c.userImage || ""} userId={c.userId || ""} className="w-6 h-6 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-black text-white/80 truncate">
                                          {renderAuthorName(c.userId, c.userName)}
                                        </span>
                                        <span className="text-[8px] text-gray-500">
                                          {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                        </span>
                                        {(String(c.userId) === String(currentUserId) || isAdmin) && (
                                          <button
                                            onClick={() => deleteComment(post.id, c.id)}
                                            className="ml-auto text-gray-600 hover:text-red-400 transition"
                                          >
                                            <X className="w-2.5 h-2.5" />
                                          </button>
                                        )}
                                      </div>
                                      <p className="text-[12px] text-white/70 mt-0.5">{c.content}</p>
                                      <div className="flex items-center gap-1 mt-1">
                                        {REACTION_TYPES.map((rt, ri) => {
                                          const r = commentReactions[c.id]?.find((rx: any) => rx.type === rt.type);
                                          const active = r?.userReacted;
                                          return (
                                            <button
                                              key={ri}
                                              onClick={() => handleCommentReaction(c.id, rt.type)}
                                              className={`text-[10px] px-1 py-0.5 rounded-lg transition ${
                                                active ? "bg-[#00ffff]/10" : "hover:bg-white/5"
                                              }`}
                                            >
                                              {rt.icon}
                                              {r?.count ? (
                                                <span className={`text-[8px] ml-0.5 font-black ${active ? "text-[#00ffff]" : "text-gray-500"}`}>
                                                  {r.count}
                                                </span>
                                              ) : null}
                                            </button>
                                          );
                                        })}
                                        <button
                                          onClick={() =>
                                            setReplyTo(
                                              replyTo?.parentId === c.id && replyTo?.postId === post.id
                                                ? null
                                                : { postId: post.id, parentId: c.id }
                                            )
                                          }
                                          className="text-[9px] font-black text-gray-500 hover:text-[#00ffff] ml-2"
                                        >
                                          Reply
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Comment Replies list */}
                                  {replies.length > 0 && (
                                    <div className="ml-8 mt-2 space-y-2 border-l border-white/5 pl-3">
                                      {replies.map((r: any) => (
                                        <div key={r.id} className="flex items-start gap-2">
                                          <UserAvatar src={r.userImage || ""} userId={r.userId || ""} className="w-5 h-5 mt-0.5" />
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-[10px] font-black text-white/80 truncate">
                                                {renderAuthorName(r.userId, r.userName)}
                                              </span>
                                              <span className="text-[7px] text-gray-500">
                                                {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                              </span>
                                              {(String(r.userId) === String(currentUserId) || isAdmin) && (
                                                <button
                                                  onClick={() => deleteComment(post.id, r.id)}
                                                  className="ml-auto text-gray-600 hover:text-red-400 transition"
                                                >
                                                  <X className="w-2.5 h-2.5" />
                                                </button>
                                              )}
                                            </div>
                                            <p className="text-[11px] text-white/60">{r.content}</p>
                                            <div className="flex items-center gap-1 mt-1">
                                              {REACTION_TYPES.map((rt, ri) => {
                                                const rr = commentReactions[r.id]?.find((rx: any) => rx.type === rt.type);
                                                return (
                                                  <button
                                                    key={ri}
                                                    onClick={() => handleCommentReaction(r.id, rt.type)}
                                                    className={`text-[9px] px-1 py-0.5 rounded-lg transition ${
                                                      rr?.userReacted ? "bg-[#00ffff]/10" : "hover:bg-white/5"
                                                    }`}
                                                  >
                                                    {rt.icon}
                                                    {rr?.count ? (
                                                      <span className={`text-[8px] ml-0.5 font-black ${rr?.userReacted ? "text-[#00ffff]" : "text-gray-500"}`}>
                                                        {rr.count}
                                                      </span>
                                                    ) : null}
                                                  </button>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            });
                          })()}

                          {/* Write Comment Box */}
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
                            <UserAvatar src={session?.user?.image || ""} userId={currentUserId} className="w-6 h-6 shrink-0" />
                            <div className="flex-1 relative">
                              <input
                                type="text"
                                placeholder={replyTo?.postId === post.id ? "Write a reply..." : "Write a comment..."}
                                value={replyTo?.postId === post.id ? replyText : commentInput[post.id] || ""}
                                onChange={(e) =>
                                  replyTo?.postId === post.id ? setReplyText(e.target.value) : setCommentInput((prev) => ({ ...prev, [post.id]: e.target.value }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") postComment(post.id, replyTo?.postId === post.id ? replyTo.parentId : null);
                                }}
                                className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#00ffff]/30"
                              />
                              {replyTo?.postId === post.id && (
                                <button
                                  onClick={() => setReplyTo(null)}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <button
                              onClick={() => postComment(post.id, replyTo?.postId === post.id ? replyTo.parentId : null)}
                              disabled={postingComment === post.id}
                              className="p-2 rounded-xl bg-white/[0.04] border border-white/5 text-[#00ffff] hover:bg-white/10 transition disabled:opacity-50"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                );
              }

              // Standard News Layout (No sourcePost)
              return (
                <article
                  key={item.id}
                  className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-6 hover:border-white/10 transition"
                >
                  <Link href={`/news/${item.id}`} className="block">
                    <h2
                      className={`text-lg font-black text-white mb-2 transition ${
                        section === "leveling" ? "hover:text-[#00ffff]" : "hover:text-[#ff007f]"
                      }`}
                    >
                      {item.title}
                    </h2>
                  </Link>
                  <p className="text-sm text-white/60 mb-3 line-clamp-3">{item.content}</p>
                  {item.image && (
                    <div className="rounded-xl overflow-hidden border border-white/5 mb-3">
                      {item.image.match(/\.(mp4|webm|mov)(\?|$)/i) ? (
                        <video src={item.image} className="w-full max-h-60 bg-black/40" controls preload="metadata" />
                      ) : (
                        <img src={item.image} alt="" className="w-full max-h-60 object-contain bg-black/40" loading="lazy" />
                      )}
                    </div>
                  )}
                  {item.tags && JSON.parse(item.tags).length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(JSON.parse(item.tags) as string[]).map((tag) => (
                        <span
                          key={tag}
                          className="text-[8px] font-black bg-white/5 text-gray-400 px-2 py-0.5 rounded-full uppercase tracking-wider"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>

        {/* Boost Requests sidebar — dungeons page only */}
        {section === "dungeons" && (
          <div className="w-80 shrink-0 space-y-4">
            <div className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-5 sticky top-28">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xs font-black text-white uppercase tracking-[0.15em] flex items-center gap-2">
                    Request Posting
                    {!boostRequestsLoading && boostRequests.length > 0 && (
                      <span className="text-[8px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center shadow-[0_0_8px_rgba(255,0,0,0.4)]">
                        {boostRequests.length > 9 ? "9+" : boostRequests.length}
                      </span>
                    )}
                  </h3>
                  <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Boosters bid for your run</p>
                </div>
              </div>

              {boostRequestsLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 text-amber-400/50 animate-spin" />
                </div>
              ) : boostRequests.length === 0 ? (
                <div className="text-center py-6 bg-white/[0.02] rounded-2xl border border-white/5">
                  <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest">No open requests</p>
                  <p className="text-[8px] text-gray-700 mt-1">Be the first to post one.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                  {boostRequests.slice(0, 20).map((req: any) => (
                    <div key={req.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-amber-500/30 transition-colors">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                          req.type === "leveling" ? "bg-green-500/20" : "bg-purple-500/20"
                        }`}>
                          {req.type === "leveling" ? (
                            <Shield className="w-3 h-3 text-green-400" />
                          ) : (
                            <Sword className="w-3 h-3 text-purple-400" />
                          )}
                        </div>
                        <span className="text-[9px] font-black text-white/80 truncate flex-1">
                          {req.type === "leveling"
                            ? `${req.startLevel}→${req.endLevel}`
                            : `${req.dungeonName || "Dungeon"} +${req.keyLevel}`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-amber-400 flex items-center gap-1">
                          <Coins className="w-3 h-3" />
                          {req.budget}K
                        </span>
                        <span className="text-[7px] font-black text-gray-600 uppercase tracking-wider">
                          by {req.userName || "Anon"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Link
                href="/boosts"
                className="mt-3 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 font-black uppercase text-[9px] tracking-[0.15em] hover:from-amber-500/30 hover:to-orange-500/30 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                View All Requests
              </Link>
            </div>
          </div>
        )}
      </div>
      </div>
    </main>
  );
}
