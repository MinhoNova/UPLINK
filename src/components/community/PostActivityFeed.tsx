"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, Loader2, MessageCircle, Heart } from "lucide-react";

export type PostActivityItem = {
  id: string;
  type: "comment" | "reaction";
  postId: number;
  actorId: string;
  actorName: string;
  actorImage: string;
  preview: string;
  reactionType?: string;
  postPreview: string;
  createdAt: number;
};

function seenKey(userId: string) {
  return `community_activity_seen_${userId}`;
}

export function usePostActivity(userId: string) {
  const [activity, setActivity] = useState<PostActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSeen, setLastSeen] = useState(0);

  useEffect(() => {
    if (!userId || typeof window === "undefined") return;
    setLastSeen(parseInt(localStorage.getItem(seenKey(userId)) || "0", 10));
  }, [userId]);

  const fetchActivity = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/community/activity");
      if (res.ok) {
        const data = await res.json();
        setActivity(data.activity || []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchActivity();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchActivity();
    }, 5000);
    return () => clearInterval(interval);
  }, [userId, fetchActivity]);

  const unreadCount = activity.filter((a) => a.createdAt > lastSeen).length;

  const markSeen = useCallback(() => {
    if (!userId) return;
    const now = Date.now();
    localStorage.setItem(seenKey(userId), String(now));
    setLastSeen(now);
  }, [userId]);

  return { activity, loading, unreadCount, fetchActivity, markSeen };
}

type PostActivityFeedProps = {
  userId: string;
  registeredUsers: any[];
  onActorClick?: (actorId: string) => void;
  onPostClick?: (postId: number) => void;
  className?: string;
};

export default function PostActivityFeed({
  userId,
  registeredUsers,
  onActorClick,
  onPostClick,
  className = "",
}: PostActivityFeedProps) {
  const { activity, loading, markSeen } = usePostActivity(userId);

  useEffect(() => {
    markSeen();
  }, [activity.length, markSeen]);

  const resolveActor = (item: PostActivityItem) => {
    const u = registeredUsers.find((r) => String(r.id) === String(item.actorId));
    return {
      name: u?.name || item.actorName || "Member",
      image: u?.profileGif || u?.avatar || item.actorImage || "",
    };
  };

  if (loading && activity.length === 0) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <Loader2 className="w-5 h-5 text-[#00ffff] animate-spin" />
      </div>
    );
  }

  if (activity.length === 0) {
    return (
      <div className={`text-center py-10 px-4 ${className}`}>
        <Bell className="w-8 h-8 text-gray-600 mx-auto mb-2 opacity-40" />
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">No post activity yet</p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 overflow-y-auto custom-scrollbar ${className}`}>
      {activity.map((item) => {
        const actor = resolveActor(item);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onPostClick?.(item.postId)}
            className="w-full text-left p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-[#00ffff]/25 hover:bg-white/[0.05] transition-all"
          >
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onActorClick?.(item.actorId);
                }}
                className="w-10 h-10 rounded-xl overflow-hidden bg-black border border-white/10 shrink-0"
              >
                <img
                  src={actor.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(actor.name)}&background=0b1020&color=00ffff&size=64`}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-white/90 leading-snug">
                  <span className="text-[#00ffff]">{actor.name}</span>
                  {item.type === "comment" ? (
                    <span className="text-gray-400 font-bold"> commented</span>
                  ) : (
                    <span className="text-gray-400 font-bold"> reacted {item.preview}</span>
                  )}
                </p>
                {item.type === "comment" && (
                  <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">{item.preview}</p>
                )}
                {item.postPreview && (
                  <p className="text-[9px] text-gray-600 mt-1.5 truncate flex items-center gap-1">
                    <MessageCircle className="w-3 h-3 shrink-0" />
                    {item.postPreview}
                  </p>
                )}
                <p className="text-[8px] text-gray-600 font-bold mt-1">
                  {new Date(item.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              {item.type === "reaction" && (
                <span className="text-lg shrink-0">{item.preview}</span>
              )}
              {item.type === "comment" && (
                <Heart className="w-3.5 h-3.5 text-gray-600 shrink-0 mt-0.5" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
