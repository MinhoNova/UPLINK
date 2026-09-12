"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, UserCheck, UserPlus, Ban, MessageCircle, Users, UserMinus,
} from "lucide-react";
import { effectiveAvatarEffect } from "@/lib/userProfile";
import { toNameStyle, nameGlowColor } from "@/components/GradientColorPicker";
import {
  resolveProfileBanner,
  resolveProfileImage,
  resolveProfileDisplayName,
  resolveNameColor,
  isAnimatedImageUrl,
  profileImgClass,
} from "@/lib/profileImage";

type FriendEntry = {
  id: string;
  requester: string;
  target: string;
  status: string;
};

function ProfileAvatarCircle({ src, effect, size = 88 }: { src: string; effect: string; size?: number }) {
  const isGif = isAnimatedImageUrl(src);
  if (effect !== "none" && !isGif) {
    return (
      <div
        className="rounded-full overflow-hidden border-4 border-[#080810] shadow-[0_0_40px_rgba(255,0,127,0.2)] bg-black"
        style={{ width: size, height: size }}
      >
        <img src={src} alt="" className={profileImgClass(src, "w-full h-full rounded-full")} />
      </div>
    );
  }
  return (
    <div
      className="rounded-full overflow-hidden border-4 border-[#080810] shadow-[0_0_40px_rgba(255,0,127,0.2)] bg-black flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <img src={src} alt="" className={profileImgClass(src, "w-full h-full rounded-full")} />
    </div>
  );
}

export default function PlayerProfileModal() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [profileUser, setProfileUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [unfriendHover, setUnfriendHover] = useState(false);

  const currentUserId = (session?.user as { id?: string })?.id || "";

  const loadData = useCallback(() => {
    fetch("/api/data")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const userId = (e as CustomEvent<{ userId: string }>).detail?.userId;
      if (!userId) return;
      setUnfriendHover(false);
      const resolve = (users: any[]) => {
        const u = users.find((r) => String(r.id) === String(userId));
        if (u) {
          setProfileUser(u);
          setOpen(true);
        }
      };
      if (data?.registeredUsers?.length) {
        resolve(data.registeredUsers);
      } else {
        fetch("/api/data")
          .then((r) => r.json())
          .then((d) => {
            setData(d);
            resolve(d.registeredUsers || []);
          })
          .catch(() => {});
      }
    };
    window.addEventListener("open-player-profile", handler);
    return () => window.removeEventListener("open-player-profile", handler);
  }, [data]);

  useEffect(() => {
    if (status !== "authenticated") return;
    loadData();
  }, [status, loadData]);

  const friends: FriendEntry[] = data?.friends || [];
  const registeredUsers = data?.registeredUsers || [];

  const getFriendStatus = (userId2: string) => {
    const entry = friends.find(
      (f) =>
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
        .filter((f) => f.status === "accepted" && (f.requester === currentUserId || f.target === currentUserId))
        .map((f) => String(f.requester === currentUserId ? f.target : f.requester))
    );
    const theirFriendIds = friends
      .filter((f) => f.status === "accepted" && (f.requester === userId2 || f.target === userId2))
      .map((f) => String(f.requester === userId2 ? f.target : f.requester));
    return theirFriendIds.filter(
      (id) => myFriendIds.has(id) && id !== String(currentUserId) && id !== String(userId2)
    ).length;
  };

  const isUserBlocked = (userId: string) => {
    const me = registeredUsers.find((u: any) => String(u.id) === String(currentUserId));
    return Array.isArray(me?.blocked) && me.blocked.map(String).includes(String(userId));
  };

  const handleSendFriendRequest = async (targetId: string) => {
    if (isUserBlocked(targetId)) return;
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", targetId }),
      });
      if (res.ok) {
        const result = await res.json();
        setData((prev: any) => ({ ...prev, friends: [...(prev?.friends || []), result.friend] }));
      }
    } catch {}
  };

  const handleUnfriend = async (targetId: string) => {
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", targetId }),
      });
      if (res.ok) {
        setData((prev: any) => ({
          ...prev,
          friends: (prev?.friends || []).filter(
            (f: FriendEntry) =>
              !(
                f.status === "accepted" &&
                ((f.requester === currentUserId && f.target === targetId) ||
                  (f.requester === targetId && f.target === currentUserId))
              )
          ),
        }));
        setUnfriendHover(false);
      }
    } catch {}
  };

  const handleFriendAction = async (reqId: string, action: "accept" | "decline") => {
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, targetId: reqId }),
      });
      if (res.ok) {
        setData((prev: any) => {
          const updated = { ...prev };
          if (action === "accept") {
            updated.friends = updated.friends.map((f: FriendEntry) =>
              f.id === reqId ? { ...f, status: "accepted" } : f
            );
          } else {
            updated.friends = updated.friends.filter((f: FriendEntry) => f.id !== reqId);
          }
          return updated;
        });
      }
    } catch {}
  };

  const handleToggleBlock = async (targetId: string) => {
    const users = [...registeredUsers];
    const meIdx = users.findIndex((u: any) => String(u.id) === String(currentUserId));
    if (meIdx === -1) return;
    const blocked = Array.isArray(users[meIdx].blocked) ? [...users[meIdx].blocked.map(String)] : [];
    const exists = blocked.includes(String(targetId));
    users[meIdx] = {
      ...users[meIdx],
      blocked: exists ? blocked.filter((id) => id !== String(targetId)) : [...blocked, String(targetId)],
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

  const openDm = () => {
    if (!profileUser) return;
    setOpen(false);
    window.dispatchEvent(new CustomEvent("open-dm-chat", { detail: { userId: profileUser.id } }));
  };

  const friendStatus = profileUser ? getFriendStatus(profileUser.id) : "none";
  const isSelf = profileUser && String(profileUser.id) === String(currentUserId);
  const avatarSrc = profileUser ? resolveProfileImage(profileUser) : "";
  const effect = profileUser ? effectiveAvatarEffect(profileUser, profileUser.effect) : "none";
  const bannerSrc = resolveProfileBanner(profileUser) || "";
  const displayName = profileUser ? resolveProfileDisplayName(profileUser) : "";
  const nameColor = profileUser ? resolveNameColor(profileUser) : null;

  if (status !== "authenticated") return null;

  return (
    <AnimatePresence>
      {open && profileUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="w-full max-w-[420px] bg-[#080810] border border-white/10 rounded-[2rem] shadow-[0_32px_100px_rgba(0,0,0,0.8)] overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Banner — full card width */}
            <div className="relative h-36 w-full bg-[#080810]">
              {bannerSrc ? (
                <img
                  src={bannerSrc}
                  alt=""
                  className={`absolute inset-0 w-full h-full ${isAnimatedImageUrl(bannerSrc) ? "object-cover" : "object-cover"}`}
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-[#080810] via-[#080810]/20 to-transparent pointer-events-none" />

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 p-2 rounded-xl bg-black/50 border border-white/10 hover:bg-black/70 transition z-20"
              >
                <X className="w-4 h-4 text-white/80" />
              </button>

              {!isSelf && (
                <div className="absolute top-3 left-3 z-20">
                  {friendStatus === "friends" && (
                    <button
                      type="button"
                      onMouseEnter={() => setUnfriendHover(true)}
                      onMouseLeave={() => setUnfriendHover(false)}
                      onClick={() => handleUnfriend(profileUser.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider transition-all ${
                        unfriendHover
                          ? "bg-red-500/20 border-red-500/50 text-red-400"
                          : "bg-[#1877f2]/20 border-[#1877f2]/40 text-[#5b9eff]"
                      }`}
                    >
                      {unfriendHover ? (
                        <>
                          <UserMinus className="w-3.5 h-3.5" />
                          Unfriend
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          Friends
                        </>
                      )}
                    </button>
                  )}
                  {friendStatus === "none" && (
                    <button
                      type="button"
                      disabled={isUserBlocked(profileUser.id)}
                      onClick={() => handleSendFriendRequest(profileUser.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00ffff]/15 border border-[#00ffff]/35 text-[#00ffff] text-[10px] font-black uppercase tracking-wider hover:bg-[#00ffff]/30 transition disabled:opacity-40"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Add Friend
                    </button>
                  )}
                  {friendStatus === "pending_sent" && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[10px] font-black uppercase tracking-wider">
                      Pending
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Avatar + name */}
            <div className="px-5 -mt-12 relative z-10 flex items-end gap-3">
              <ProfileAvatarCircle src={avatarSrc} effect={effect} size={96} />
              <div className="pb-1 flex-1 min-w-0">
                <h3 className="text-xl font-black text-white truncate leading-tight" style={nameColor ? { ...toNameStyle(nameColor), textShadow: `0 0 14px ${nameGlowColor(nameColor)}77` } : undefined}>{displayName}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {profileUser?.team?.name && (
                    <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-purple-500/40 bg-purple-500/10 text-purple-400">
                      {profileUser.team.name}
                    </span>
                  )}
                  {Array.isArray(profileUser?.team?.members) && profileUser.team.members.length > 0 && (
                    <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-cyan-500/40 bg-cyan-500/10 text-cyan-400">
                      {1 + profileUser.team.members.filter((m: any) => m.status !== "pending").length}/4 squad
                    </span>
                  )}
                  <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-[#5865F2]/40 bg-[#5865F2]/10 text-[#8ea1ff]">
                    Discord: {profileUser?.username ? `@${profileUser.username}` : "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-5 pb-5 pt-3">
              {!isSelf && friendStatus === "pending_received" && (
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      const req = friends.find(
                        (f) => f.requester === profileUser.id && f.target === currentUserId
                      );
                      if (req) handleFriendAction(req.id, "accept");
                    }}
                    className="flex-1 py-2 bg-green-500/15 text-green-400 border border-green-500/35 rounded-xl hover:bg-green-500 hover:text-black transition text-[10px] font-black uppercase tracking-widest"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const req = friends.find(
                        (f) => f.requester === profileUser.id && f.target === currentUserId
                      );
                      if (req) handleFriendAction(req.id, "decline");
                    }}
                    className="flex-1 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500 hover:text-white transition text-[10px] font-black uppercase tracking-widest"
                  >
                    Decline
                  </button>
                </div>
              )}

              {!isSelf && (
                <div className="flex items-center justify-center gap-8 pt-2 pb-1">
                  <div
                    className="flex flex-col items-center gap-0.5"
                    title={`${getMutualFriendsCount(profileUser.id)} mutual friends`}
                  >
                    <Users className="w-5 h-5 text-[#00ffff]" />
                    <span className="text-[10px] font-black text-white tabular-nums">
                      {getMutualFriendsCount(profileUser.id)}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isUserBlocked(profileUser.id) || friendStatus !== "friends"}
                    onClick={openDm}
                    title="Send message"
                    className="p-1 text-[#ff007f] hover:scale-110 transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleBlock(profileUser.id)}
                    title={isUserBlocked(profileUser.id) ? "Unblock" : "Block"}
                    className={`p-1 hover:scale-110 transition ${
                      isUserBlocked(profileUser.id) ? "text-yellow-400" : "text-red-400"
                    }`}
                  >
                    <Ban className="w-5 h-5" />
                  </button>
                </div>
              )}

              {isSelf && (
                <p className="text-center text-[10px] text-gray-500 font-bold uppercase tracking-widest py-2">
                  Your profile
                </p>
              )}

              {Array.isArray(profileUser?.team?.members) && profileUser.team.members.length > 0 && (
                <div className="mt-3 bg-white/[0.03] border border-purple-500/20 rounded-2xl p-4">
                  <p className="text-[8px] font-black uppercase tracking-widest text-purple-400 mb-3 flex items-center gap-1.5">
                    <Users className="w-3 h-3" /> {profileUser.team.name || "Team"} — Roster
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <div
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30"
                      title={`${profileUser?.name || profileUser?.username || ""} (Leader)`}
                    >
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-white/5 flex items-center justify-center shrink-0 relative">
                        {profileUser?.customAvatar || profileUser?.avatar || profileUser?.profileGif ? (
                          <img
                            src={profileUser?.customAvatar || profileUser?.avatar || profileUser?.profileGif}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users className="w-3 h-3 text-gray-500" />
                        )}
                      </div>
                      <span className="text-[9px] font-bold text-white truncate max-w-[110px]">
                        {profileUser?.name || profileUser?.username || "Leader"}
                        <span className="text-purple-300/90"> · Leader</span>
                      </span>
                    </div>
                    {profileUser.team.members.map((m: any, i: number) => (
                      <div
                        key={`${m.id}-${i}`}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10"
                        title={m.name}
                      >
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-white/5 flex items-center justify-center shrink-0 relative">
                          {m.avatar ? (
                            <img src={m.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Users className="w-3 h-3 text-gray-500" />
                          )}
                        </div>
                        <span className="text-[9px] font-bold text-gray-300 truncate max-w-[110px]">
                          {m.name}
                          {m.status === "pending" && <span className="text-amber-400/90"> ·</span>}
                        </span>
                        {m.status === "pending" && (
                          <span className="text-[6px] font-black uppercase text-amber-400">Pending</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
