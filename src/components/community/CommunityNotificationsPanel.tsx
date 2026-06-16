"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  X, Users, UserCheck, Search, Check, CheckCheck, DoorClosed,
} from "lucide-react";
import PostActivityFeed, { usePostActivity } from "@/components/community/PostActivityFeed";
import { resolveProfileImage, profileImgClass, resolveProfileDisplayName } from "@/lib/profileImage";
import DmThreadView from "@/components/chat/DmThreadView";
import { getDmMsgKey, computeDmUnreadCounts, buildDmContactList, getAcceptedFriendIds, type DmMessage } from "@/lib/dmHelpers";
import { isPrimaryAdmin } from "@/lib/rolesConstants";

type Tab = "chat" | "alerts" | "requests";

export default function CommunityNotificationsPanel() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [tab, setTab] = useState<Tab>("chat");
  const [search, setSearch] = useState("");
  const [data, setData] = useState<any>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState<any>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [chatError, setChatError] = useState<string | null>(null);

  const currentUserId = (session?.user as { id?: string })?.id || "";
  const currentHandle = (session?.user as { username?: string })?.username || "";
  const isAdmin = isPrimaryAdmin(currentUserId, currentHandle);
  const { unreadCount, markSeen } = usePostActivity(currentUserId);

  const isCommunity = pathname === "/community";

  const loadData = useCallback(() => {
    fetch("/api/data")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isCommunity || status !== "authenticated") return;
    loadData();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") loadData();
    }, 2000);
    return () => clearInterval(interval);
  }, [isCommunity, status, loadData]);

  useEffect(() => {
    const handler = () => setMobileOpen((p) => !p);
    window.addEventListener("toggle-community-notifications", handler);
    const closeHandler = () => setMobileOpen(false);
    window.addEventListener("community-notifications-close", closeHandler);
    return () => {
      window.removeEventListener("toggle-community-notifications", handler);
      window.removeEventListener("community-notifications-close", closeHandler);
    };
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const userId = (e as CustomEvent<{ userId: string }>).detail?.userId;
      if (!userId) return;
      const resolve = (users: any[]) => {
        const user = users.find((u: any) => String(u.id) === String(userId));
        if (!user) return;
        setMobileOpen(true);
        setTab("chat");
        setSelectedChatUser(user);
        setSearch("");
      };
      if (data?.registeredUsers?.length) resolve(data.registeredUsers);
      else fetch("/api/data").then((r) => r.json()).then((d) => { setData(d); resolve(d.registeredUsers || []); }).catch(() => {});
    };
    window.addEventListener("open-dm-chat", handler);
    return () => window.removeEventListener("open-dm-chat", handler);
  }, [data]);

  const friends = data?.friends || [];
  const registeredUsers = data?.registeredUsers || [];
  const directMessages = data?.directMessages || [];
  const readMessages = data?.readMessages || {};

  const friendIdSet = useMemo(
    () => getAcceptedFriendIds(currentUserId, friends),
    [friends, currentUserId]
  );

  const ONLINE_WINDOW_MS = 5 * 60 * 1000;
  const onlineFriendsCount = useMemo(() => {
    const now = Date.now();
    return [...friendIdSet].filter((fid) => {
      const u = registeredUsers.find((r: any) => String(r.id) === String(fid));
      return typeof u?.lastSeenAt === "number" && now - u.lastSeenAt < ONLINE_WINDOW_MS;
    }).length;
  }, [friendIdSet, registeredUsers]);

  const pendingRequests = useMemo(
    () => friends.filter((f: any) => f.status === "pending" && f.target === currentUserId),
    [friends, currentUserId]
  );

  const getMsgKey = getDmMsgKey;

  useEffect(() => {
    if (!data || !currentHandle) return;
    setUnreadCounts(computeDmUnreadCounts(directMessages, readMessages, currentHandle));
  }, [data, currentHandle, directMessages, readMessages]);

  const chatUserList = useMemo(
    () =>
      buildDmContactList({
        registeredUsers,
        friends,
        directMessages,
        currentUserId,
        currentHandle,
        isAdmin,
        search,
        unreadCounts,
      }),
    [registeredUsers, friends, directMessages, currentUserId, currentHandle, isAdmin, search, unreadCounts]
  );

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

  const markAsRead = async (fromUsername: string) => {
    try {
      await dmRequest({ action: "markRead", fromUsername });
      loadData();
      window.dispatchEvent(new CustomEvent("data-refresh"));
    } catch {}
    setUnreadCounts((prev) => {
      const next = { ...prev };
      delete next[fromUsername];
      return next;
    });
  };

  const markDelivered = async (fromUsername: string) => {
    try {
      await dmRequest({ action: "markDelivered", fromUsername });
      loadData();
    } catch {}
  };

  useEffect(() => {
    if (!mobileOpen || !currentHandle || !directMessages.length) return;
    for (const m of directMessages) {
      if (m.to === currentHandle && m.from) void markDelivered(m.from);
    }
  }, [mobileOpen, directMessages.length, currentHandle]);

  const sendMessage = async (to: string, text: string, image?: string) => {
    const trimmed = text.trim();
    if (!trimmed && !image) return;
    setChatError(null);
    const timestamp = Date.now();
    const optimistic: DmMessage = { from: currentHandle, to, text: trimmed, timestamp, ...(image ? { image } : {}) };
    const prevMessages = data?.directMessages || [];
    setData((prev: any) => ({
      ...prev,
      directMessages: [...(prev?.directMessages || []), optimistic],
    }));
    try {
      const result = await dmRequest({ action: "send", to, text: trimmed, ...(image ? { image } : {}) });
      if (result.message) {
        setData((prev: any) => ({
          ...prev,
          directMessages: (prev.directMessages || []).map((m: any) =>
            m.timestamp === timestamp ? result.message : m
          ),
        }));
      }
    } catch (e: unknown) {
      setData((prev: any) => ({ ...prev, directMessages: prevMessages }));
      const err = e as Error & { suspended?: boolean };
      setChatError(err.message || "Failed to send");
      if (err.suspended) setTimeout(() => { window.location.reload(); }, 2500);
      throw e;
    }
  };

  const handleSaveEdit = async (msg: DmMessage, text: string) => {
    if (!msg.timestamp) return;
    const key = getMsgKey(msg);
    try {
      await dmRequest({ action: "edit", timestamp: msg.timestamp, text });
      setData((prev: any) => ({
        ...prev,
        directMessages: (prev.directMessages || []).map((m: any) =>
          getMsgKey(m) === key ? { ...m, text, edited: true } : m
        ),
      }));
    } catch {
      loadData();
    }
  };

  const handleDeleteMsg = async (msg: DmMessage) => {
    if (!msg.timestamp) return;
    const key = getMsgKey(msg);
    try {
      await dmRequest({ action: "delete", timestamp: msg.timestamp });
      setData((prev: any) => ({
        ...prev,
        directMessages: (prev.directMessages || []).filter((m: any) => getMsgKey(m) !== key),
      }));
    } catch {
      loadData();
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
            m.timestamp === msg.timestamp && m.from === msg.from ? result.message : m
          ),
        }));
      }
    } catch {}
  };

  const openProfile = (userId: string) => {
    window.dispatchEvent(new CustomEvent("open-player-profile", { detail: { userId } }));
  };

  const openPost = (postId: number) => {
    markSeen();
    window.location.href = `/community#post-${postId}`;
  };

  const handleFriendAction = async (reqId: string, action: "accept" | "decline") => {
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, targetId: reqId }),
      });
      if (res.ok) loadData();
    } catch {}
  };

  const selectChatUser = (user: any) => {
    setSelectedChatUser(user);
    setSearch("");
  };

  useEffect(() => {
    if (!selectedChatUser) return;
    void markAsRead(selectedChatUser.username);
  }, [selectedChatUser?.username, directMessages.length]);

  const totalChatUnread = Object.values(unreadCounts).reduce((s, n) => s + n, 0);

  if (status !== "authenticated" || !isCommunity) return null;

  const panelContent = (
    <div className="relative bg-gradient-to-br from-[#0c0c18] via-[#080810] to-black border border-white/10 rounded-[2rem] shadow-[0_24px_80px_rgba(0,0,0,0.65),0_0_40px_rgba(0,255,255,0.08)] backdrop-blur-xl overflow-hidden flex flex-col max-h-[calc(100vh-7rem)] h-[calc(100vh-7rem)]">
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#00ffff]/8 blur-3xl rounded-full translate-x-8 -translate-y-8 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#ff007f]/6 blur-3xl rounded-full -translate-x-10 translate-y-10 pointer-events-none" />

      <div className="px-5 py-4 border-b border-white/5 relative z-10 flex items-center gap-3 bg-black/30 shrink-0">
        {selectedChatUser && tab === "chat" ? (
          <>
            <button
              type="button"
              onClick={() => { setSelectedChatUser(null); }}
              className="p-2 hover:bg-white/5 rounded-xl transition"
            >
              <DoorClosed className="w-4 h-4 text-gray-400" />
            </button>
            <button
              type="button"
              onClick={() => openProfile(selectedChatUser.id)}
              className="w-9 h-9 rounded-full overflow-hidden border border-white/10 shrink-0"
            >
              <img
                src={resolveProfileImage(selectedChatUser)}
                alt=""
                className={profileImgClass(resolveProfileImage(selectedChatUser), "w-full h-full")}
              />
            </button>
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-sm text-white truncate">{resolveProfileDisplayName(selectedChatUser)}</h3>
              <p className="text-[8px] text-[#00ffff] font-black uppercase tracking-widest">Direct Message</p>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 min-w-0">
              <h3 className="font-black uppercase tracking-[0.18em] text-sm text-white">Secret Club</h3>
            </div>
            <span className="text-[9px] font-black text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
              {onlineFriendsCount} online
            </span>
          </>
        )}
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="p-2 hover:bg-white/5 rounded-xl transition lg:hidden"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {!(selectedChatUser && tab === "chat") && (
        <div className="flex border-b border-white/5 px-5 pt-3 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setTab("chat")}
            className={`text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all relative ${tab === "chat" ? "bg-[#00ffff]/15 text-[#00ffff] border border-[#00ffff]/30 shadow-[0_0_16px_rgba(0,255,255,0.12)]" : "text-gray-500 hover:text-white hover:bg-white/5"}`}
          >
            Chat
            {totalChatUnread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[7px] font-black rounded-full flex items-center justify-center">
                {totalChatUnread > 9 ? "9+" : totalChatUnread}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => { setTab("alerts"); markSeen(); }}
            className={`text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all relative ${tab === "alerts" ? "bg-[#00ffff]/15 text-[#00ffff] border border-[#00ffff]/30" : "text-gray-500 hover:text-white hover:bg-white/5"}`}
          >
            Alerts
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[7px] font-black rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setTab("requests")}
            className={`text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all relative ${tab === "requests" ? "bg-[#00ffff]/15 text-[#00ffff] border border-[#00ffff]/30" : "text-gray-500 hover:text-white hover:bg-white/5"}`}
          >
            Requests
            {pendingRequests.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[7px] font-black rounded-full flex items-center justify-center">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-hidden relative z-10 min-h-0 flex flex-col">
        {tab === "chat" && selectedChatUser && (
          <div className="flex flex-col flex-1 min-h-0 p-4">
            <DmThreadView
              peerUsername={selectedChatUser.username}
              currentHandle={currentHandle}
              messages={directMessages}
              chatError={chatError}
              readReceiptsFromPeer={data?.readReceiptsFrom?.[selectedChatUser.username] || []}
              deliveredReceiptsFromPeer={data?.deliveredReceiptsFrom?.[selectedChatUser.username] || []}
              scrollClassName="max-h-[min(520px,calc(100vh-18rem))]"
              onSend={(text, image) => sendMessage(selectedChatUser.username, text, image)}
              onEdit={handleSaveEdit}
              onDelete={handleDeleteMsg}
              onReact={handleReact}
            />
          </div>
        )}

        {tab === "chat" && !selectedChatUser && (
          <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
            <div className="px-5 pt-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={isAdmin ? "Search any member..." : "Search friends..."}
                  className="w-full bg-black/50 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#00ffff]/40 transition-colors text-white/90 placeholder-gray-600"
                />
              </div>
            </div>
            <div className="p-3 space-y-1">
              {chatUserList.length === 0 ? (
                <p className="text-[10px] text-gray-600 text-center italic py-10 px-4">
                  {search
                    ? isAdmin
                      ? "No members found"
                      : "No friends found"
                    : isAdmin
                      ? "No conversations yet"
                      : "No friends yet — accept a friend request to start chatting"}
                </p>
              ) : (
                chatUserList.map((user: any) => {
                  const img = resolveProfileImage(user);
                  const displayName = resolveProfileDisplayName(user);
                  return (
                    <div
                      key={user.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => selectChatUser(user)}
                      onKeyDown={(e) => { if (e.key === "Enter") selectChatUser(user); }}
                      className="w-full p-3 rounded-2xl hover:bg-white/[0.05] border border-transparent hover:border-white/5 transition-all flex items-center gap-3 group cursor-pointer"
                    >
                      <button
                        type="button"
                        title="View Profile"
                        onClick={(e) => { e.stopPropagation(); openProfile(user.id); }}
                        className="relative w-11 h-11 rounded-full overflow-hidden bg-black border-2 border-white/10 shrink-0 hover:border-[#00ffff]/50 transition-all group/avatar"
                      >
                        <img src={img} alt="" className={profileImgClass(img, "w-full h-full rounded-full")} />
                      </button>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-black text-white/90 truncate">{displayName}</p>
                        {unreadCounts[user.username] > 0 ? (
                          <p className="text-[8px] text-[#00ffff] font-bold uppercase tracking-widest">Unread</p>
                        ) : friendIdSet.has(String(user.id)) ? (
                          <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">Friend</p>
                        ) : null}
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
                          <span className="bg-red-500 text-white text-[7px] font-black rounded-full px-1.5 py-0.5 shrink-0">
                            {unreadCounts[user.username]}
                          </span>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {tab === "alerts" && (
          <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
            <PostActivityFeed
              userId={currentUserId}
              registeredUsers={registeredUsers}
              onActorClick={openProfile}
              onPostClick={openPost}
              className="p-3"
            />
          </div>
        )}

        {tab === "requests" && (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2 min-h-0">
            {pendingRequests.length === 0 ? (
              <div className="flex flex-col items-center py-10 bg-white/[0.02] border border-dashed border-white/5 rounded-2xl">
                <UserCheck className="w-6 h-6 text-gray-600 mb-2" />
                <p className="text-[10px] text-gray-600 italic">No pending requests</p>
              </div>
            ) : (
              pendingRequests.map((req: any) => {
                const fromUser = registeredUsers.find((u: any) => String(u.id) === String(req.requester));
                const img = resolveProfileImage(fromUser);
                return (
                  <div key={req.id} className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/10 hover:border-[#00ffff]/30 rounded-2xl p-3 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <button type="button" onClick={() => openProfile(fromUser?.id)} className="w-10 h-10 rounded-full overflow-hidden bg-black border border-white/10 shrink-0">
                        <img src={img} alt="" className={profileImgClass(img)} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-white/90 truncate">{fromUser?.name || "Unknown"}</p>
                        <p className="text-[8px] text-[#00ffff] font-bold uppercase">Wants to connect</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => handleFriendAction(req.id, "accept")} className="flex-1 py-2 bg-green-500/10 text-green-400 border border-green-500/30 rounded-xl hover:bg-green-500 hover:text-black transition text-[9px] font-black uppercase flex items-center justify-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Accept
                      </button>
                      <button type="button" onClick={() => handleFriendAction(req.id, "decline")} className="flex-1 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500 hover:text-white transition text-[9px] font-black uppercase flex items-center justify-center gap-1">
                        <X className="w-3.5 h-3.5" /> Decline
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {!mobileOpen && (
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="fixed right-5 top-[5.5rem] z-[70] w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0c0c18] to-black border border-white/10 shadow-lg flex items-center justify-center hover:border-[#00ffff]/40 transition lg:hidden"
        >
          <Users className="w-5 h-5 text-[#00ffff]" />
          {(unreadCount > 0 || pendingRequests.length > 0 || totalChatUnread > 0) && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
              {unreadCount + pendingRequests.length + totalChatUnread > 9 ? "9+" : unreadCount + pendingRequests.length + totalChatUnread}
            </span>
          )}
        </button>
      )}

      <div className={`fixed right-5 top-[5.5rem] w-[min(380px,calc(100vw-2.5rem))] z-[70] ${mobileOpen ? "block" : "hidden lg:block"}`}>
        {panelContent}
      </div>
    </>
  );
}
