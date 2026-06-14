"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { MessageCircle, Users, X, Check, CheckCheck, Search, DoorClosed, UserCheck, VolumeX, UserPlus, Ban } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DmThreadView from "@/components/chat/DmThreadView";
import { getDmMsgKey, computeDmUnreadCounts, totalDmUnreadCount, getDmConversationPeernames, isDmMessageRead, type DmMessage } from "@/lib/dmHelpers";
import { resolveProfileImage, resolveProfileDisplayName, profileImgClass } from "@/lib/profileImage";

export default function DirectCommsPanel() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isCommunity = pathname === "/community";
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<"dm" | "requests" | "muted">("dm");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [unreadCounts, setUnreadCounts] = useState<{ [key: string]: number }>({});
  const [messageNotification, setMessageNotification] = useState<any>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const selectedUserRef = useRef<any>(null);
  const isOpenRef = useRef(false);
  const [mutedUsers, setMutedUsers] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(`muted_users_${(session?.user as any)?.username || "default"}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handler = () => setIsOpen((p) => !p);
    window.addEventListener("toggle-dm", handler);
    return () => window.removeEventListener("toggle-dm", handler);
  }, []);

  useEffect(() => {
    if (isOpen) window.dispatchEvent(new CustomEvent("community-notifications-close"));
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: Event) => {
      const userId = (e as CustomEvent<{ userId?: string }>).detail?.userId;
      const sessionId = (session?.user as { id?: string })?.id || "";
      const targetId = userId || sessionId;
      if (targetId) {
        window.dispatchEvent(new CustomEvent("open-player-profile", { detail: { userId: targetId } }));
      }
    };
    window.addEventListener("open-dm-profile", handler);
    return () => window.removeEventListener("open-dm-profile", handler);
  }, [session]);

  useEffect(() => {
    const handler = (e: Event) => {
      if (isCommunity) return;
      const userId = (e as CustomEvent<{ userId: string }>).detail?.userId;
      if (!userId) return;
      const resolveChat = (users: any[]) => {
        const user = users.find((u: any) => String(u.id) === String(userId));
        if (!user) return;
        setIsOpen(true);
        setTab("dm");
        setSelectedUser(user);
      };
      if (data?.registeredUsers?.length) {
        resolveChat(data.registeredUsers);
      } else {
        fetch("/api/data")
          .then((r) => r.json())
          .then((d) => {
            setData(d);
            resolveChat(d.registeredUsers || []);
          })
          .catch(() => {});
      }
    };
    window.addEventListener("open-dm-chat", handler);
    return () => window.removeEventListener("open-dm-chat", handler);
  }, [data, isCommunity]);

  useEffect(() => {
    if (status !== "authenticated") return;
    
    const pollData = () => {
      fetch("/api/data")
        .then((r) => r.json())
        .then((d) => setData((prev: any) => JSON.stringify(prev) === JSON.stringify(d) ? prev : d))
        .catch(() => {});
    };
    pollData();
    const pollInterval = setInterval(() => {
      if (document.visibilityState === "visible") pollData();
    }, 2000);
    const onRefresh = () => pollData();
    window.addEventListener("data-refresh", onRefresh);
    
    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("data-refresh", onRefresh);
    };
  }, [status]);

  useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);
  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (status !== "authenticated") return;
    fetch("/api/data")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, [isOpen, status]);

  useEffect(() => {
    if (!data) return;
    const currentHandle = (session?.user as any)?.username || "";
    const directMessages = data?.directMessages || [];
    const readMessages = data?.readMessages || {};
    setUnreadCounts(computeDmUnreadCounts(directMessages, readMessages, currentHandle));
  }, [data, session]);

  // Monitor for new messages and show notifications
  useEffect(() => {
    if (!data) return;
    const currentUserId = (session?.user as any)?.id || "";
    const currentHandle = (session?.user as any)?.username || "";
    const directMessages = data?.directMessages || [];
    const registeredUsers = data?.registeredUsers || [];
    
    const lastMessageKey = `last_msg_shown_${currentHandle}`;
    const lastShown = parseInt(localStorage.getItem(lastMessageKey) || "0");
    
    const incomingMessages = directMessages.filter((m: any) => {
      const msgTime = m.timestamp || Date.now();
      return m.to === currentHandle && msgTime > lastShown;
    });
    
    if (incomingMessages.length > 0) {
      const lastMessage = incomingMessages[incomingMessages.length - 1];
      const senderUser =
        registeredUsers.find((u: any) => u.username === lastMessage.from) ||
        { id: lastMessage.from, username: lastMessage.from, name: lastMessage.from };

      const inActiveChat =
        isOpenRef.current &&
        selectedUserRef.current?.username === lastMessage.from;

      if (senderUser && !mutedUsers.includes(senderUser.username) && !inActiveChat) {
        const readMessages = data?.readMessages || {};
        const allCounts = computeDmUnreadCounts(directMessages, readMessages, currentHandle);
        const unreadCount = allCounts[senderUser.username] || 0;

        setMessageNotification({
          user: senderUser,
          message: lastMessage.text || (lastMessage.image ? "📷 Image" : ""),
          timestamp: lastMessage.timestamp || Date.now(),
          unreadCount: unreadCount
        });

        playMessageSound();
        localStorage.setItem(lastMessageKey, String(lastMessage.timestamp || Date.now()));
      } else if (inActiveChat) {
        localStorage.setItem(lastMessageKey, String(lastMessage.timestamp || Date.now()));
      }
    }
  }, [data, session, mutedUsers]);

  const currentUserId = (session?.user as any)?.id || "";
  const currentHandle = (session?.user as any)?.username || "";
  const registeredUsers = data?.registeredUsers || [];
  const directMessages = data?.directMessages || [];
  const friends = data?.friends || [];

  const pendingRequests = friends.filter((f: any) => f.status === "pending" && f.target === currentUserId);

  const playMessageSound = async () => {
    try {
      // Try multiple approaches to play sound
      const audioUrl = "/Message.mp3";
      
      // Approach 1: Standard Audio element with retries
      const playAudio = () => {
        const audio = new Audio(audioUrl);
        audio.volume = 0.7;
        audio.preload = "auto";
        
        audio.addEventListener("error", (e) => {
          console.error("Audio error:", e);
        });
        
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.log("Play error (retrying with timeout):", error);
            // Retry after a short delay
            setTimeout(() => {
              const audio2 = new Audio(audioUrl);
              audio2.volume = 0.7;
              audio2.play().catch(() => {
                console.log("Second play attempt failed");
              });
            }, 100);
          });
        }
      };
      
      playAudio();
      
      // Approach 2: Use Web Audio API as fallback
      try {
        const audioContext = new (window as any).AudioContext() || new (window as any).webkitAudioContext();
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start(0);
      } catch (e) {
        // Web Audio API failed, but HTML Audio should have worked
      }
    } catch (error) {
      console.error("Sound playback error:", error);
    }
  };

  const dmRequest = async (payload: Record<string, unknown>) => {
    const res = await fetch("/api/dm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || "Request failed") as Error & { retryAfterMs?: number; suspended?: boolean };
      err.retryAfterMs = data.retryAfterMs;
      err.suspended = data.suspended;
      throw err;
    }
    return data;
  };

  const handleSaveEdit = async (msg: DmMessage, text: string) => {
    if (!msg.timestamp) return;
    const key = getDmMsgKey(msg);
    const prevMessages = directMessages;
    const optimistic = directMessages.map((m: any) =>
      getDmMsgKey(m) === key ? { ...m, text, edited: true } : m
    );
    setData((prev: any) => ({ ...prev, directMessages: optimistic }));
    try {
      await dmRequest({ action: "edit", timestamp: msg.timestamp, text });
    } catch {
      setData((prev: any) => ({ ...prev, directMessages: prevMessages }));
    }
  };

  const handleDeleteMsg = async (msg: DmMessage) => {
    if (!msg.timestamp) return;
    const key = getDmMsgKey(msg);
    const prevMessages = directMessages;
    const optimistic = directMessages.filter((m: any) => getDmMsgKey(m) !== key);
    setData((prev: any) => ({ ...prev, directMessages: optimistic }));
    try {
      await dmRequest({ action: "delete", timestamp: msg.timestamp });
    } catch {
      setData((prev: any) => ({ ...prev, directMessages: prevMessages }));
    }
  };

  const handleReact = async (msg: DmMessage, emoji: string) => {
    if (!msg.timestamp) return;
    try {
      const result = await dmRequest({ action: "react", timestamp: msg.timestamp, emoji });
      if (result.message) {
        setData((prev: any) => ({
          ...prev,
          directMessages: (prev.directMessages || []).map((m: any) =>
            m.timestamp === msg.timestamp && (m.from === msg.from) ? result.message : m
          ),
        }));
      }
    } catch {}
  };

  const sendMessage = async (to: string, text: string, image?: string) => {
    const trimmed = text.trim();
    if (!trimmed && !image) return;
    setChatError(null);
    const timestamp = Date.now();
    const optimistic: DmMessage = { from: currentHandle, to, text: trimmed, timestamp, ...(image ? { image } : {}) };
    const prevMessages = directMessages;
    setData((prev: any) => ({ ...prev, directMessages: [...directMessages, optimistic] }));
    try {
      const result = await dmRequest({ action: "send", to, text: trimmed, ...(image ? { image } : {}) });
      if (result.message) {
        setData((prev: any) => ({
          ...prev,
          directMessages: prev.directMessages.map((m: any) =>
            m.timestamp === timestamp ? result.message : m
          ),
        }));
      }
    } catch (e: unknown) {
      setData((prev: any) => ({ ...prev, directMessages: prevMessages }));
      const err = e as Error & { retryAfterMs?: number; suspended?: boolean };
      setChatError(err.message || "Failed to send message");
      if (err.suspended) {
        setTimeout(() => { window.location.reload(); }, 2500);
      }
      throw e;
    }
  };

  const markAsRead = async (fromUsername: string) => {
    try {
      const result = await dmRequest({ action: "markRead", fromUsername });
      if (result.readMessages || result.deliveredMessages) {
        setData((prev: any) => ({
          ...prev,
          ...(result.readMessages ? { readMessages: result.readMessages } : {}),
        }));
      }
      window.dispatchEvent(new CustomEvent("data-refresh"));
    } catch {}
    setUnreadCounts((prev) => {
      const updated = { ...prev };
      delete updated[fromUsername];
      return updated;
    });
  };

  const markDelivered = async (fromUsername: string) => {
    try {
      await dmRequest({ action: "markDelivered", fromUsername });
      window.dispatchEvent(new CustomEvent("data-refresh"));
    } catch {}
  };

  useEffect(() => {
    if (!isOpen || !currentHandle || !directMessages.length) return;
    const peers = new Set<string>();
    for (const m of directMessages) {
      if (m.to === currentHandle && m.from) peers.add(m.from);
    }
    for (const peer of peers) {
      void markDelivered(peer);
    }
  }, [isOpen, directMessages.length, currentHandle]);

  useEffect(() => {
    if (!selectedUser || !isOpen) return;
    void markAsRead(selectedUser.username);
  }, [selectedUser?.username, isOpen, directMessages.length]);

  const getFriendStatus = (userId2: string) => {
    const entry = friends.find((f: any) =>
      (f.requester === currentUserId && f.target === userId2) ||
      (f.requester === userId2 && f.target === currentUserId)
    );
    if (!entry) return "none";
    if (entry.status === "accepted") return "friends";
    if (entry.status === "pending" && entry.requester === currentUserId) return "pending_sent";
    if (entry.status === "pending" && entry.target === currentUserId) return "pending_received";
    return "none";
  };

  const getMutualFriendsCount = (userId2: string) => {
    const myFriendIds = new Set(
      friends
        .filter((f: any) => f.status === "accepted" && (f.requester === currentUserId || f.target === currentUserId))
        .map((f: any) => String(f.requester === currentUserId ? f.target : f.requester))
    );
    const theirFriendIds = friends
      .filter((f: any) => f.status === "accepted" && (f.requester === userId2 || f.target === userId2))
      .map((f: any) => String(f.requester === userId2 ? f.target : f.requester));
    return theirFriendIds.filter((id: string) => myFriendIds.has(id) && id !== String(currentUserId) && id !== String(userId2)).length;
  };

  const isUserBlocked = (userId: string) => {
    const me = registeredUsers.find((u: any) => String(u.id) === String(currentUserId));
    return Array.isArray(me?.blocked) && me.blocked.map(String).includes(String(userId));
  };

  const handleToggleBlock = async (targetId: string) => {
    const users = [...registeredUsers];
    const meIdx = users.findIndex((u: any) => String(u.id) === String(currentUserId));
    if (meIdx === -1) return;
    const blocked = Array.isArray(users[meIdx].blocked) ? [...users[meIdx].blocked.map(String)] : [];
    const exists = blocked.includes(String(targetId));
    users[meIdx] = {
      ...users[meIdx],
      blocked: exists ? blocked.filter((id: string) => id !== String(targetId)) : [...blocked, String(targetId)],
    };
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: users[meIdx] }),
      });
      if (res.ok) setData((prev: any) => ({ ...prev, registeredUsers: users }));
    } catch {}
  };

  const friendIdSet = useMemo(
    () =>
      new Set(
        friends
          .filter((f: any) => f.status === "accepted" && (f.requester === currentUserId || f.target === currentUserId))
          .map((f: any) => String(f.requester === currentUserId ? f.target : f.requester))
      ),
    [friends, currentUserId]
  );

  const dmFriendUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const conversationPeers = getDmConversationPeernames(directMessages, currentHandle);
    const byUsername = new Map(
      registeredUsers
        .filter((u: any) => u.username && u.username !== currentHandle)
        .map((u: any) => [u.username, u] as const)
    );

    for (const peer of conversationPeers) {
      if (!byUsername.has(peer)) {
        byUsername.set(peer, { id: peer, username: peer, name: peer });
      }
    }

    let list = [...byUsername.values()].filter(
      (u: any) =>
        !isUserBlocked(u.id) &&
        (!q || (u.displayName || u.name || "").toLowerCase().includes(q))
    );

    if (!q) {
      list = list.filter(
        (u: any) => conversationPeers.has(u.username) || (unreadCounts[u.username] || 0) > 0
      );
    }

    const lastAt = (username: string) => {
      const msgs = directMessages.filter(
        (m: any) =>
          (m.from === currentHandle && m.to === username) ||
          (m.to === currentHandle && m.from === username)
      );
      return msgs.length ? Math.max(...msgs.map((m: any) => m.timestamp || 0)) : 0;
    };

    return [...list].sort((a, b) => {
      const aUnread = unreadCounts[a.username] || 0;
      const bUnread = unreadCounts[b.username] || 0;
      if (aUnread !== bUnread) return bUnread - aUnread;
      const aT = lastAt(a.username);
      const bT = lastAt(b.username);
      if (aT && bT) return bT - aT;
      if (aT) return -1;
      if (bT) return 1;
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [registeredUsers, currentHandle, search, directMessages, unreadCounts]);

  const openPlayerProfile = (userId: string) => {
    window.dispatchEvent(new CustomEvent("open-player-profile", { detail: { userId } }));
  };

  const handleSendFriendRequest = async (targetId: string) => {
    if (isUserBlocked(targetId)) return;
    try {
      const res = await fetch("/api/friends", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", targetId }),
      });
      if (res.ok) {
        const result = await res.json();
        setData({ ...data, friends: [...friends, result.friend] });
      }
    } catch {}
  };

  const handleFriendAction = async (reqId: string, action: "accept" | "decline") => {
    try {
      const res = await fetch("/api/friends", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, targetId: reqId }),
      });
      if (res.ok) {
        const updated = { ...data };
        if (action === "accept") {
          updated.friends = updated.friends.map((f: any) => f.id === reqId ? { ...f, status: "accepted" } : f);
        } else {
          updated.friends = updated.friends.filter((f: any) => f.id !== reqId);
        }
        setData(updated);
      }
    } catch {}
  };

  if (status !== "authenticated") return null;

  return (
    <>
      {!isCommunity && isOpen && (
        <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
        </div>
      )}
      {!isCommunity && (
      <div className={`fixed right-5 top-[5.5rem] w-[min(460px,calc(100vw-2.5rem))] z-[70] transform transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0 pointer-events-none'}`}>
        <div className="relative bg-gradient-to-br from-[#0c0c18] via-[#080810] to-black border border-white/10 rounded-[2rem] shadow-[0_24px_80px_rgba(0,0,0,0.65),0_0_40px_rgba(255,0,127,0.08)] backdrop-blur-xl overflow-hidden flex flex-col max-h-[calc(100vh-7rem)]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#00ffff]/8 blur-3xl rounded-full translate-x-8 -translate-y-8 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#ff007f]/6 blur-3xl rounded-full -translate-x-10 translate-y-10 pointer-events-none" />

          <div className="px-5 py-4 border-b border-white/5 relative z-10 flex items-center gap-3 bg-black/30">
            <div className="w-9 h-9 rounded-xl bg-[#ff007f]/15 border border-[#ff007f]/25 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-[#ff007f]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-black uppercase tracking-[0.18em] text-sm text-white">Direct Message</h3>
            </div>
            <span className="text-[9px] font-black text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">{friendIdSet.size} friends</span>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-xl transition">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="flex border-b border-white/5 px-5 pt-3 gap-2">
            <button onClick={() => setTab("dm")} className={`text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all ${tab === "dm" ? "bg-[#ff007f]/15 text-[#ff007f] border border-[#ff007f]/30 shadow-[0_0_16px_rgba(255,0,127,0.12)]" : "text-gray-500 hover:text-white hover:bg-white/5"}`}>DM</button>
            <button onClick={() => setTab("requests")} className={`text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all relative ${tab === "requests" ? "bg-[#ff007f]/15 text-[#ff007f] border border-[#ff007f]/30" : "text-gray-500 hover:text-white hover:bg-white/5"}`}>
              Requests
              {pendingRequests.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[7px] font-black rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(255,0,0,0.5)]">
                  {pendingRequests.length}
                </span>
              )}
            </button>
            <button onClick={() => setTab("muted")} className={`text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all relative ${tab === "muted" ? "bg-yellow-500/15 text-yellow-400 border border-yellow-400/30" : "text-gray-500 hover:text-white hover:bg-white/5"}`}>
              Muted
              {mutedUsers.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-yellow-500 text-black text-[7px] font-black rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(234,179,8,0.5)]">
                  {mutedUsers.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
            {tab === "dm" && (
              <>
                {!selectedUser ? (
                  <div>
                    <div className="px-5 pt-4">
                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search any member..."
                          className="w-full bg-black/50 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#00ffff]/40 transition-colors text-white/90 placeholder-gray-600"
                        />
                      </div>
                    </div>
                    <div className="p-3 space-y-1">
                      {dmFriendUsers.length === 0 && (
                        <p className="text-[10px] text-gray-600 text-center italic py-10 px-4 leading-relaxed">
                          {search ? "No matching members" : "No conversations yet — search to message a member"}
                        </p>
                      )}
                      {dmFriendUsers.map((user: any) => (
                        <div
                          key={user.username}
                          role="button"
                          tabIndex={0}
                          onClick={() => { setSelectedUser(user); setMessageNotification(null); }}
                          onKeyDown={(e) => { if (e.key === "Enter") { setSelectedUser(user); setMessageNotification(null); } }}
                          className="w-full p-3 rounded-2xl hover:bg-white/[0.05] border border-transparent hover:border-white/5 transition-all flex items-center gap-3 group relative cursor-pointer"
                        >
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); openPlayerProfile(user.id); }}
                            className="w-11 h-11 rounded-2xl overflow-hidden bg-black border border-white/10 shrink-0 shadow-inner hover:border-[#00ffff]/40 hover:shadow-[0_0_12px_rgba(0,255,255,0.15)] transition-all flex items-center justify-center"
                          >
                            <img src={resolveProfileImage(user)} className={profileImgClass(resolveProfileImage(user), "w-full h-full")} alt="" />
                          </button>
                          <div className="text-left flex-1 min-w-0 flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-black text-white/90 truncate group-hover:text-white transition-colors">
                                {resolveProfileDisplayName(user)}
                              </p>
                            </div>
                            {unreadCounts[user.username] > 0 && (
                              <>
                                <button
                                  type="button"
                                  title="Mark as read"
                                  onClick={(e) => { e.stopPropagation(); void markAsRead(user.username); }}
                                  className="p-1.5 rounded-lg bg-green-500/10 border border-green-500/25 text-green-400 hover:bg-green-500/20 hover:text-green-300 transition-all shrink-0"
                                >
                                  <CheckCheck className="w-3.5 h-3.5" />
                                </button>
                                <span className="bg-red-500 text-white text-[7px] font-black rounded-full px-1.5 py-0.5 shrink-0 shadow-[0_0_8px_rgba(255,0,0,0.5)]">
                                  {unreadCounts[user.username]}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col p-5">
                    <div className="flex items-center gap-3 pb-4 mb-4 border-b border-white/5">
                      <button onClick={() => { setSelectedUser(null); setSearch(""); }} className="p-2 hover:bg-white/5 rounded-xl transition">
                        <DoorClosed className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openPlayerProfile(selectedUser.id)}
                        className="w-10 h-10 rounded-2xl overflow-hidden bg-black border border-white/10 shrink-0 hover:border-[#00ffff]/40 transition-all flex items-center justify-center"
                      >
                        <img src={resolveProfileImage(selectedUser)} className={profileImgClass(resolveProfileImage(selectedUser), "w-full h-full")} alt="" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-white truncate">
                          {resolveProfileDisplayName(selectedUser)}
                        </p>
                        <p className="text-[9px] text-[#00ffff] font-black uppercase tracking-widest">Direct Message</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openPlayerProfile(selectedUser.id)}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#00ffff]/30 hover:bg-[#00ffff]/10 transition"
                        title="View profile"
                      >
                        <UserCheck className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    <DmThreadView
                      peerUsername={selectedUser.username}
                      currentHandle={currentHandle}
                      messages={directMessages}
                      chatError={chatError}
                      readReceiptsFromPeer={data?.readReceiptsFrom?.[selectedUser.username] || []}
                      deliveredReceiptsFromPeer={data?.deliveredReceiptsFrom?.[selectedUser.username] || []}
                      onSend={(text, image) => sendMessage(selectedUser.username, text, image)}
                      onEdit={handleSaveEdit}
                      onDelete={handleDeleteMsg}
                      onReact={handleReact}
                    />
                  </div>
                )}
              </>
            )}

            {tab === "requests" && (
              <div className="p-4 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-3.5 h-3.5 text-[#00ffff]" />
                    <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Friend Requests</p>
                    {pendingRequests.length > 0 && <span className="ml-auto text-[8px] font-black text-[#00ffff] bg-[#00ffff]/10 px-2 py-0.5 rounded-full">{pendingRequests.length}</span>}
                  </div>
                  {pendingRequests.length === 0 ? (
                    <div className="flex flex-col items-center py-6 bg-white/[0.02] border border-dashed border-white/5 rounded-2xl">
                      <UserCheck className="w-6 h-6 text-gray-600 mb-2" />
                      <p className="text-[10px] text-gray-600 italic">No pending friend requests</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pendingRequests.map((req: any) => {
                        const fromUser = registeredUsers.find((u: any) => String(u.id) === String(req.requester));
                        return (
                          <div key={req.id} className="group relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/10 hover:border-[#00ffff]/30 rounded-2xl p-3 transition-all duration-300 shadow-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-black border border-white/10 shrink-0 flex items-center justify-center">
                                <img src={resolveProfileImage(fromUser)} className={profileImgClass(resolveProfileImage(fromUser), "w-full h-full")} alt="" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-white/90 truncate">{fromUser ? resolveProfileDisplayName(fromUser) : "Unknown"}</p>
                                <p className="text-[8px] text-gray-500 font-medium">Wants to be friends</p>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <button onClick={() => handleFriendAction(req.id, "accept")} className="px-3 py-2 bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/40 text-green-400 rounded-xl hover:bg-green-500 hover:text-black transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-[0_0_12px_rgba(34,197,94,0.15)]">
                                  <Check className="w-3 h-3" /> Accept
                                </button>
                                <button onClick={() => handleFriendAction(req.id, "decline")} className="px-3 py-2 bg-white/5 border border-white/10 text-gray-400 rounded-xl hover:bg-red-500 hover:text-white hover:border-red-500/50 transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                  <X className="w-3 h-3" /> Decline
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}

            {tab === "muted" && (
              <div className="p-4 space-y-4">
                {mutedUsers.length === 0 ? (
                  <div className="flex flex-col items-center py-8 bg-white/[0.02] border border-dashed border-white/5 rounded-2xl">
                    <VolumeX className="w-6 h-6 text-gray-600 mb-2" />
                    <p className="text-[10px] text-gray-600 italic">No muted users</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {mutedUsers.map((username: string) => {
                      const mutedUser = registeredUsers.find((u: any) => u.username === username);
                      if (!mutedUser) return null;
                      return (
                        <div key={username} className="group relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/10 hover:border-yellow-500/30 rounded-2xl p-3 transition-all duration-300">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-black border border-white/10 shrink-0 flex items-center justify-center">
                              <img src={resolveProfileImage(mutedUser)} className={profileImgClass(resolveProfileImage(mutedUser), "w-full h-full")} alt="" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-white/90 truncate">{resolveProfileDisplayName(mutedUser)}</p>
                              <p className="text-[8px] text-yellow-400 font-bold">Muted</p>
                            </div>
                            <button
                              onClick={() => {
                                const newMutedList = mutedUsers.filter((u: string) => u !== username);
                                setMutedUsers(newMutedList);
                                localStorage.setItem(`muted_users_${currentHandle}`, JSON.stringify(newMutedList));
                              }}
                              className="px-3 py-2 bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/40 text-green-400 rounded-xl hover:bg-green-500 hover:text-black transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-[0_0_12px_rgba(34,197,94,0.15)]"
                            >
                              Unmute
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* MESSAGE NOTIFICATIONS - Bottom Right (hidden on community — chat is inline there) */}
      {!isCommunity && (
      <div className="fixed bottom-8 right-8 z-[100] space-y-3 pointer-events-none">
        <AnimatePresence>
          {messageNotification && (
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.92, x: 20 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, y: 20, scale: 0.94, x: 16 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="pointer-events-auto"
            >
              <div
                onClick={() => {
                  setSelectedUser(messageNotification.user);
                  markAsRead(messageNotification.user?.username);
                  setIsOpen(true);
                  setTab("dm");
                  setMessageNotification(null);
                }}
                className="group min-w-[320px] max-w-[400px] bg-gradient-to-br from-[#10101c] via-[#0a0a14] to-black border border-[#ff007f]/35 rounded-[1.75rem] shadow-[0_20px_60px_rgba(0,0,0,0.55),0_0_30px_rgba(255,0,127,0.15)] backdrop-blur-xl overflow-hidden cursor-pointer hover:border-[#ff007f]/55 hover:shadow-[0_24px_70px_rgba(0,0,0,0.6),0_0_40px_rgba(255,0,127,0.22)] transition-all"
              >
                <div className="p-4 flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-black border-2 border-[#ff007f]/40 shrink-0 shadow-[0_0_20px_rgba(255,0,127,0.2)] flex items-center justify-center">
                    <img src={resolveProfileImage(messageNotification.user)} className={profileImgClass(resolveProfileImage(messageNotification.user), "w-full h-full")} alt="" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-black text-[#ff007f] truncate">
                        {messageNotification.user ? resolveProfileDisplayName(messageNotification.user) : "Member"}
                      </p>
                      {messageNotification.unreadCount > 0 && (
                        <span className="text-[9px] font-black bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full shrink-0">
                          {messageNotification.unreadCount} new
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/90 leading-relaxed line-clamp-3 mt-1">{messageNotification.message}</p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newMutedList = [...mutedUsers, messageNotification.user?.username];
                        setMutedUsers(newMutedList);
                        localStorage.setItem(`muted_users_${currentHandle}`, JSON.stringify(newMutedList));
                        setMessageNotification(null);
                      }}
                      title="Mute this user"
                      className="p-2 hover:bg-white/10 rounded-xl transition text-gray-500 hover:text-white"
                    >
                      <VolumeX className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMessageNotification(null);
                      }}
                      className="p-2 hover:bg-white/10 rounded-xl transition text-gray-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      )}
    </>
  );
}
