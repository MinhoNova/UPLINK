"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { HeroBackground } from "@/components/HeroBackground";
import { useThemePreference as useTheme } from "@/hooks/useThemePreference";
import {
  MessageSquare, Send, Flag,
  Trash2, Swords, AlertTriangle, X, Loader2,
  Zap, ImagePlus, Globe, Users, Pin, Smile,
} from "lucide-react";
import { resolveProfileImage, profileImgClass, isAnimatedImageUrl } from "@/lib/profileImage";

const REACTION_TYPES = [
  { type: "LOL", icon: "😂", label: "LOL" },
  { type: "Love", icon: "❤️", label: "Love" },
  { type: "Wipe", icon: "💀", label: "Wipe" },
  { type: "Carry", icon: "🏆", label: "Carry" },
];

const LIGHT_MODE_STYLES = `
  .community-light { background: #e8e8f0 !important; }
  .community-light [class*="bg-\\[\\#0a0a16\\]"] { background: rgba(255,255,255,0.92) !important; }
  .community-light [class*="bg-gradient-to-br"][class*="from-\\[\\#0a0a16\\]"] { background: rgba(255,255,255,0.92) !important; }
  .community-light [class*="bg-white\\/\\[0\\.02\\]"] { background: rgba(255,255,255,0.6) !important; border-color: rgba(0,0,0,0.08) !important; }
  .community-light [class*="bg-white\\/\\[0\\.04\\]"] { background: rgba(255,255,255,0.7) !important; }
  .community-light [class*="bg-black\\/40"] { background: rgba(255,255,255,0.8) !important; }
  .community-light [class*="bg-black\\/\\[0\\.3\\]"] { background: rgba(255,255,255,0.85) !important; }
  .community-light [class*="border-white\\/5"] { border-color: rgba(0,0,0,0.1) !important; }
  .community-light [class*="border-white\\/10"] { border-color: rgba(0,0,0,0.15) !important; }
  .community-light .text-white, .community-light [class*="text-white\\/60"], .community-light [class*="text-white\\/70"], .community-light [class*="text-white\\/80"], .community-light [class*="text-white\\/90"] { color: #1a1a2e !important; }
  .community-light [class*="text-white\\/50"] { color: #555 !important; }
  .community-light [class*="text-gray-500"] { color: #666 !important; }
  .community-light [class*="text-gray-600"] { color: #888 !important; }
  .community-light [class*="text-gray-400"] { color: #999 !important; }
  .community-light input, .community-light textarea { color: #1a1a2e !important; }
  .community-light input::placeholder, .community-light textarea::placeholder { color: #aaa !important; }
  .community-light [class*="placeholder-gray-600"]::placeholder { color: #aaa !important; }
  .community-light [class*="placeholder-gray-500"]::placeholder { color: #aaa !important; }
  .community-light [class*="bg-white\\/5"] { background: rgba(0,0,0,0.05) !important; }
  .community-light [class*="bg-white\\/10"] { background: rgba(0,0,0,0.08) !important; }
  .community-light [class*="hover\\:bg-white\\/10"]:hover { background: rgba(0,0,0,0.12) !important; }
  .community-light [class*="hover\\:bg-white\\/20"]:hover { background: rgba(0,0,0,0.15) !important; }
  .community-light [class*="hover\\:border-white\\/10"]:hover { border-color: rgba(0,0,0,0.2) !important; }
  .community-light nav { background: rgba(255,255,255,0.15) !important; backdrop-filter: blur(12px) !important; }
  .community-light [class*="bg-black\\/20"] { background: rgba(255,255,255,0.8) !important; }
  .community-light [class*="bg-black\\/90"] { background: rgba(255,255,255,0.95) !important; }
  .community-light [class*="bg-black\\/90"]:not([class*="text-"]) { color: #1a1a2e !important; }
  .community-light [style*="background"]:not(nav):not([style*="transparent"]) { background-clip: padding-box; }
`;

export default function CommunityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const lightMode = theme === 'light';
  const [access, setAccess] = useState<boolean | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [detectedImageUrl, setDetectedImageUrl] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [reportModal, setReportModal] = useState<{ postId: number } | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [openComments, setOpenComments] = useState<Set<number>>(new Set());
  const [comments, setComments] = useState<Record<number, any[]>>({});
  const [commentInput, setCommentInput] = useState<Record<number, string>>({});
  const [postingComment, setPostingComment] = useState<number | null>(null);
  const [commentReactions, setCommentReactions] = useState<Record<number, { type: string; count: number; userReacted: boolean }[]>>({});
  const [replyTo, setReplyTo] = useState<{ postId: number; parentId: number } | null>(null);
  const [replyText, setReplyText] = useState("");
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [postVisibility, setPostVisibility] = useState<"public" | "friends_of_friends">("public");
  const [reactionPickerPostId, setReactionPickerPostId] = useState<number | null>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/"); return; }
    if (status !== "authenticated") return;
    (async () => {
      const [accessRes, dataRes] = await Promise.all([
        fetch("/api/community/check-access"),
        fetch("/api/data"),
      ]);
      const d = await accessRes.json();
      setAccess(d.access);
      const db = await dataRes.json();
      setRegisteredUsers(db.registeredUsers || []);
      setFriends(db.friends || []);
      if (!d.access) setLoading(false);
    })();
  }, [status, router]);

   useEffect(() => {
      if (access === true) fetchPosts();
   }, [status, router]);

   const currentUserId = (session?.user as any)?.id || "";
  const currentUserHandle = (session?.user as any)?.username || "";
  const isAdmin = currentUserId === "1497295886223544471" || currentUserHandle === "minhonovazen";

  const openProfile = (userId: string) => {
    window.dispatchEvent(new CustomEvent("open-player-profile", { detail: { userId } }));
  };

  const getUserDisplay = (userId: string) => {
    const u = registeredUsers.find((uu: any) => String(uu.id) === String(userId));
    return { name: u?.name || null, avatar: u?.profileGif || null };
  };

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

  const fetchPosts = useCallback(async () => {
    try {
      console.log("Fetching posts...");
      const res = await fetch(`/api/community/posts${filterTag ? `?tag=${filterTag}` : ""}`);
      if (res.ok) {
        let allPosts = await res.json();
        if (showMyPosts) {
          allPosts = allPosts.filter((p: any) => String(p.userId) === String(currentUserId));
        }
        setPosts(allPosts);
      } else {
        console.error("fetchPosts response not ok:", res.status);
      }
    } catch (e) {
      console.error("fetchPosts failed:", e);
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
    }
  }, [filterTag, showMyPosts, currentUserId]);

   useEffect(() => {
      if (access === true) fetchPosts();
   }, [access, fetchPosts]);

   useEffect(() => {
     const handleToggle = () => setShowMyPosts(prev => !prev);
    window.addEventListener('toggle-community-profile', handleToggle);
    return () => window.removeEventListener('toggle-community-profile', handleToggle);
  }, []);

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { alert("Max 10MB"); return; }
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
        return;
      }
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { alert("Max 8MB"); e.target.value = ""; return; }
    setImageFile(file);
    setDetectedImageUrl(null);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("field", "banner");
    const res = await fetch("/api/user/upload", { method: "POST", body: formData });
    if (res.ok) {
      const data = await res.json();
      const me = registeredUsers.find((u: any) => String(u.id) === String(currentUserId));
      if (me) {
        const updated = { ...me, banner: data.url };
        const users = registeredUsers.map((u) => (String(u.id) === String(currentUserId) ? updated : u));
        setRegisteredUsers(users);
        await fetch("/api/users/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile: updated }),
        });
      }
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Upload failed");
    }
    e.target.value = "";
  };

  const myProfile = registeredUsers.find((u: any) => String(u.id) === String(currentUserId));

  const extractImageUrl = (text: string): string | null => {
    const urlRegex = /(https?:\/\/[^\s]+\.(?:gif|png|jpg|jpeg|webp)(?:\?[^\s]*)?)|(https?:\/\/(?:media\.giphy\.com|giphy\.com|tenor\.com|i\.imgur\.com|imgur\.com|cdn\.discordapp\.com)[^\s]+)/i;
    const match = text.match(urlRegex);
    return match ? match[1] || match[2] : null;
  };

  const handleContentChange = (text: string) => {
    setContent(text);
    if (!imageFile) {
      const url = extractImageUrl(text);
      setDetectedImageUrl(url);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (!content.trim() && !imageFile && !detectedImageUrl) return;
    setPosting(true);
    setPostError(null);
    // Strip the detected URL from content so it doesn't appear as text
    let cleanContent = content.trim();
    let urlToSend = detectedImageUrl;
    if (urlToSend) {
      cleanContent = cleanContent.replace(urlToSend, "").replace(/\s+/g, " ").trim();
    }
    // Ensure hashtags are included visibly in the post content
    const tagsText = (selectedTags || []).map(t=>`#${t}`).join(' ');
    if (tagsText && !cleanContent.includes('#')) {
      cleanContent = `${cleanContent} ${tagsText}`.trim();
    }

    try {
      let res: Response;
      if (urlToSend) {
        res = await fetch("/api/community/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: cleanContent, tags: selectedTags, imageUrl: urlToSend, visibility: postVisibility }),
        });
      } else {
        const formData = new FormData();
        formData.append("content", cleanContent);
        formData.append("tags", JSON.stringify(selectedTags));
        formData.append("visibility", postVisibility);
        if (imageFile) formData.append("image", imageFile);
        res = await fetch("/api/community/posts", { method: "POST", body: formData });
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setPostError(err.error || `Failed to post (${res.status})`);
        return;
      }
      setContent(""); setImageFile(null); setImagePreview(null); setDetectedImageUrl(null); setSelectedTags([]); setPostVisibility("public");
      fetchPosts();
    } catch {
      setPostError("Network error — try again");
    } finally {
      setPosting(false);
    }
  };

  const handleReaction = async (postId: number, type: string) => {
    await fetch("/api/community/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, type }),
    });
    fetchPosts();
  };

  const handleDeletePost = async (postId: number) => {
    await fetch("/api/community/posts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    });
    fetchPosts();
  };

  const handlePinPost = async (postId: number, pinned: boolean) => {
    const res = await fetch("/api/community/posts/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, pinned }),
    });
    if (res.ok) fetchPosts();
  };

  const toggleComments = async (postId: number) => {
    setOpenComments((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
        fetchComments(postId);
      }
      return next;
    });
  };

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

  const postComment = async (postId: number, parentId?: number | null) => {
    const text = parentId ? replyText.trim() : commentInput[postId]?.trim();
    if (!text) return;
    setPostingComment(postId);
    const res = await fetch("/api/community/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, content: text, parentId: parentId || null }),
    });
    if (parentId) { setReplyText(""); setReplyTo(null); }
    else setCommentInput((prev) => ({ ...prev, [postId]: "" }));
    if (res.ok) await fetchComments(postId);
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
  };

  const handleReport = async () => {
    if (!reportModal || !reportReason.trim()) return;
    await fetch("/api/community/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: reportModal.postId, reason: reportReason }),
    });
    setReportModal(null); setReportReason("");
  };

  if (status === "loading" || (status === "authenticated" && access === null)) {
    return (
      <div className="min-h-screen bg-[#06060c] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00ffff] animate-spin" />
      </div>
    );
  }

  if (access === false) {
    return (
      <div className="min-h-screen bg-[#06060c] flex items-center justify-center relative">
        <div className="fixed inset-0 z-0 pointer-events-none"><HeroBackground /></div>
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,255,255,0.08)_0%,_transparent_60%)] pointer-events-none z-[1]" />
        <div className="relative z-10 bg-white/[0.03] border border-yellow-500/30 rounded-[2rem] p-8 max-w-md text-center backdrop-blur-xl">
          <Swords className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <h1 className="text-xl font-black text-yellow-500 mb-2 uppercase tracking-widest">Access Denied</h1>
          <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-6">Secret Club clearance required</p>
          <a href="/" className="inline-block px-8 py-3 bg-gradient-to-r from-[#00ffff] to-[#ff007f] text-black font-black uppercase text-xs tracking-widest rounded-xl hover:opacity-90 transition">
            Return to UPLINK
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`${lightMode ? 'community-light' : ''} min-h-screen text-white`}>
      {lightMode && <style dangerouslySetInnerHTML={{ __html: LIGHT_MODE_STYLES }} />}
      {/* HeroBackground — grid + particles + glow like main page */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <HeroBackground light={lightMode} />
      </div>
      {/* Extra neon atmospheric glows */}
      {!lightMode && (
        <>
          <div className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-[#ff007f]/15 via-[#00ffff]/10 to-[#8a2be2]/15 blur-[130px] rounded-full pointer-events-none z-[1]" />
          <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,255,255,0.08)_0%,_transparent_60%)] pointer-events-none z-[1]" />
        </>
      )}
      {lightMode && (
        <>
          <div className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-[#8888ff]/10 via-[#cc88ff]/8 to-[#ff88cc]/10 blur-[130px] rounded-full pointer-events-none z-[1]" />
          <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(136,136,255,0.05)_0%,_transparent_50%)] pointer-events-none z-[1]" />
        </>
      )}

      <div className="pt-24 sm:pt-28 px-3 sm:px-6 lg:pr-[400px]">

        <div className="max-w-[1600px] mx-auto py-4 sm:py-6">
          <div className="flex-1 min-w-0 w-full max-w-3xl mx-auto relative z-10">
            {/* My Profile — Facebook-style banner */}
            {showMyPosts && session?.user && (
              <div className="mb-6 rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden border border-white/5 bg-black shadow-xl">
                <div className="relative h-28 sm:h-32 w-full overflow-hidden group">
                  {myProfile?.banner ? (
                    <img
                      src={myProfile.banner}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover object-center scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-[#ff007f]/30 via-[#8a2be2]/25 to-[#00ffff]/30" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    className="absolute top-3 right-3 px-3 py-1.5 bg-black/50 border border-white/20 rounded-xl text-[9px] font-black uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition z-20"
                  >
                    Edit Banner
                  </button>
                  <button onClick={() => setShowMyPosts(false)} className="absolute top-3 left-3 px-3 py-1.5 bg-black/50 border border-white/10 rounded-xl text-[9px] font-black text-gray-300 hover:text-white hover:bg-black/70 transition uppercase tracking-wider z-20">
                    Back to Feed
                  </button>
                  <input ref={bannerInputRef} type="file" accept="image/*,.gif" className="hidden" onChange={handleBannerUpload} />
                  <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 pb-3 sm:pb-4 flex items-end gap-3 z-10">
                    <button type="button" onClick={() => openProfile(currentUserId)} className="relative shrink-0">
                      <div className="absolute inset-0 rounded-full bg-[#00ffff]/30 blur-md scale-110" />
                      <div className="relative w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] rounded-full overflow-hidden border-[3px] border-[#00ffff]/50 shadow-[0_0_20px_rgba(0,255,255,0.35)] bg-black">
                        <img
                          src={resolveProfileImage(myProfile || { name: session.user.name, avatar: session.user.image })}
                          alt=""
                          className={profileImgClass(resolveProfileImage(myProfile || {}), "w-full h-full rounded-full object-cover")}
                        />
                      </div>
                    </button>
                    <h2 className="text-base sm:text-lg font-black text-white tracking-wider truncate drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] pb-1">
                      {myProfile?.displayName || myProfile?.name || session.user.name}
                    </h2>
                  </div>
                </div>
              </div>
            )}
            {/* Create Post (hide when viewing my profile) */}
            <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-wrap items-center gap-2">
              <button onClick={() => setFilterTag(null)} className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg transition ${!filterTag ? "bg-[#00ffff]/20 text-[#00ffff] shadow-[0_0_10px_rgba(0,255,255,0.15)]" : "bg-white/5 text-gray-500 hover:bg-white/10"}`}>
                All
              </button>
              {["Mythic+", "Raid", "PvP", "Meme", "Leveling", "Delves"].map((tag) => (
                <button key={tag} onClick={() => setFilterTag(tag === filterTag ? null : tag)} className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg transition ${filterTag === tag ? "bg-[#00ffff]/20 text-[#00ffff]" : "bg-white/5 text-gray-500 hover:bg-white/10"}`}>
                  {tag}
                </button>
              ))}
              {session?.user && (
                <button
                  type="button"
                  onClick={() => setShowMyPosts((v) => !v)}
                  className={`ml-auto flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition ${showMyPosts ? "border-[#00ffff]/40 bg-[#00ffff]/15 text-[#00ffff]" : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"}`}
                >
                  <UserAvatar src={session.user.image || ""} userId={(session.user as any)?.id || ""} className="w-5 h-5 rounded-lg" />
                  My Posts
                </button>
              )}
            </div>
            <div className="bg-gradient-to-br from-[#0a0a16] to-black border border-white/5 rounded-[2rem] p-5 mb-6 shadow-xl backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#00ffff]/5 blur-3xl rounded-full translate-x-6 -translate-y-6" />
              <div className="flex gap-3 relative z-10">
                <UserAvatar src={session?.user?.image || ""} userId={(session?.user as any)?.id || ""} className="w-10 h-10" />
                <div className="flex-1">
                  <textarea
                    value={content}
                    onChange={(e) => { setPostError(null); handleContentChange(e.target.value); }}
                    onPaste={handlePaste}
                    placeholder="Share something with the club... (paste image/GIF here or paste a link)"
                    className="w-full bg-transparent text-sm text-white/80 placeholder-gray-600 outline-none resize-none min-h-[60px]"
                    rows={2}
                  />
                  {postError && (
                    <p className="mt-2 text-[10px] font-black uppercase tracking-wider text-red-400">{postError}</p>
                  )}
                  {/* Image preview (from file upload or detected URL in text) */}
                  {(imagePreview || detectedImageUrl) && (
                    <div className="relative mt-2 inline-block">
                      <img src={imagePreview || detectedImageUrl || ""} alt="" className="max-h-40 rounded-xl border border-white/10" />
                      <button onClick={() => { setImageFile(null); setImagePreview(null); setDetectedImageUrl(null); }} className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5 flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Audience</span>
                      <button
                        type="button"
                        onClick={() => setPostVisibility("public")}
                        className={`flex items-center gap-1.5 text-[8px] font-black uppercase px-2.5 py-1.5 rounded-lg border transition ${
                          postVisibility === "public"
                            ? "border-[#00ffff]/40 bg-[#00ffff]/10 text-[#00ffff]"
                            : "border-white/10 text-gray-600 hover:text-gray-400"
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5" /> Public
                      </button>
                      <button
                        type="button"
                        onClick={() => setPostVisibility("friends_of_friends")}
                        className={`flex items-center gap-1.5 text-[8px] font-black uppercase px-2.5 py-1.5 rounded-lg border transition ${
                          postVisibility === "friends_of_friends"
                            ? "border-[#ff007f]/40 bg-[#ff007f]/10 text-[#ff007f]"
                            : "border-white/10 text-gray-600 hover:text-gray-400"
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" /> Friends
                      </button>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      <input ref={imageInputRef} type="file" accept="image/*,.gif" className="hidden" onChange={handleImageSelect} />
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase text-gray-500 hover:text-[#00ffff] hover:bg-[#00ffff]/10 transition"
                        title="Upload image"
                      >
                        <ImagePlus className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex items-center gap-1">
                        {["Mythic+", "Raid", "PvP", "Meme", "Leveling", "Delves"].map((tag) => (
                          <button key={tag} onClick={() => toggleTag(tag)} className={`text-[8px] font-black uppercase px-1.5 py-1 rounded transition ${selectedTags.includes(tag) ? "bg-[#00ffff]/20 text-[#00ffff]" : "text-gray-600 hover:text-gray-400"}`}>
                            #{tag}
                          </button>
                        ))}
                      </div>
                      <button onClick={handleSubmit} disabled={posting || (!content.trim() && !imageFile && !detectedImageUrl)} className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-[#00ffff] to-[#ff007f] text-black rounded-xl font-black text-[10px] uppercase hover:opacity-90 transition disabled:opacity-30">
                        {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />} Post
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-[#00ffff] animate-spin" /></div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-[2rem]">
                <MessageSquare className="w-10 h-10 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-500 text-xs font-black uppercase tracking-widest">{filterTag ? `No posts with #${filterTag}` : "No posts yet. First drop goes down in history."}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post: any, idx: number) => (
                  <motion.div id={`post-${post.id}`} key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className={`bg-gradient-to-br from-[#0a0a16] to-black border rounded-[2rem] p-5 shadow-xl backdrop-blur-xl relative overflow-hidden hover:border-white/10 transition-all ${post.pinnedAt ? "border-yellow-500/30 ring-1 ring-yellow-500/20" : "border-white/5"}`}>
                    <div className="absolute top-0 right-0 w-16 h-16 bg-[#ff007f]/5 blur-3xl rounded-full translate-x-6 -translate-y-6" />
                    {post.pinnedAt && (
                      <div className="absolute top-4 right-4 z-20 flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/15 border border-yellow-500/30 text-[8px] font-black uppercase tracking-widest text-yellow-400">
                        <Pin className="w-3 h-3" /> Pinned
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-3 relative z-10">
                      <UserAvatar src={post.userImage || ""} userId={post.userId || ""} className="w-9 h-9" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-black text-white/90 truncate block">{(() => { const d = getUserDisplay(post.userId); return d.name || post.userName; })()}</span>
                        <span className="text-[9px] text-gray-500 font-black">{new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        <span className="text-[8px] font-black uppercase flex items-center gap-1 mt-0.5 text-gray-500">
                          {post.visibility === "friends_of_friends" || post.visibility === "friends" ? (
                            <>
                              <Users className="w-3 h-3 text-[#ff007f]/80" />
                              <span className="text-[#ff007f]/80">Friends</span>
                            </>
                          ) : (
                            <>
                              <Globe className="w-3 h-3 text-[#00ffff]/80" />
                              <span className="text-[#00ffff]/80">Public</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-white/70 mb-3 whitespace-pre-wrap leading-relaxed relative z-10">{post.content}</p>
                    {post.image && (
                      <div className="mb-3 rounded-2xl overflow-hidden border border-white/5 relative z-10">
                        <img src={post.image} alt="" className="w-full max-h-96 object-contain bg-black/40" loading="lazy" />
                      </div>
                    )}
                    {post.tags?.length > 0 && (
                      <div className="flex items-center gap-1.5 mb-3 flex-wrap relative z-10">
                        {post.tags.map((tag: string) => (
                          <span key={tag} className="text-[8px] font-black bg-white/5 text-gray-400 px-2 py-0.5 rounded-full uppercase tracking-wider">#{tag}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t border-white/5 relative z-10">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {REACTION_TYPES.map((rt) => {
                          const reaction = post.reactions?.find((r: any) => r.type === rt.type);
                          if (!reaction?.count) return null;
                          const active = reaction?.userReacted;
                          return (
                            <button
                              key={rt.type}
                              type="button"
                              onClick={() => handleReaction(post.id, rt.type)}
                              className={`flex items-center gap-1 px-2 py-1 rounded-xl text-sm transition-all ${
                                active ? "bg-[#00ffff]/15 border border-[#00ffff]/30" : "bg-white/[0.04] border border-white/5 hover:bg-white/10"
                              }`}
                            >
                              <span>{rt.icon}</span>
                              <span className={`text-[10px] font-black ${active ? "text-[#00ffff]" : "text-gray-500"}`}>{reaction.count}</span>
                            </button>
                          );
                        })}
                        {reactionPickerPostId === post.id ? (
                          <div className="flex items-center gap-0.5 px-2 py-1 rounded-xl bg-black/60 border border-white/10">
                            {REACTION_TYPES.map((rt) => (
                              <button
                                key={rt.type}
                                type="button"
                                onClick={() => { handleReaction(post.id, rt.type); setReactionPickerPostId(null); }}
                                className="text-base hover:scale-125 transition-transform px-0.5"
                                title={rt.label}
                              >
                                {rt.icon}
                              </button>
                            ))}
                            <button type="button" onClick={() => setReactionPickerPostId(null)} className="p-0.5 text-gray-500 hover:text-white ml-1">
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
                      <div className="flex items-center gap-1">
                        {isAdmin && (
                          <button
                            onClick={() => handlePinPost(post.id, !post.pinnedAt)}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[9px] font-black transition ${post.pinnedAt ? "text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20" : "text-gray-600 hover:text-yellow-400 hover:bg-yellow-500/5"}`}
                          >
                            <Pin className="w-3 h-3" /> {post.pinnedAt ? "Unpin" : "Pin"}
                          </button>
                        )}
                        <button onClick={() => toggleComments(post.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[9px] font-black text-gray-600 hover:text-[#00ffff] hover:bg-[#00ffff]/5 transition">
                          <MessageSquare className="w-3 h-3" /> {openComments.has(post.id) ? "Hide" : `Comment${(comments[post.id]?.length || 0) > 0 ? ` (${comments[post.id].length})` : ""}`}
                        </button>
                        {(String(post.userId) === String(currentUserId) || isAdmin) && (
                          <button onClick={() => handleDeletePost(post.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[9px] font-black text-gray-600 hover:text-red-400 hover:bg-red-500/5 transition">
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        )}
                        <button onClick={() => setReportModal({ postId: post.id })} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[9px] font-black text-gray-600 hover:text-red-400 hover:bg-red-500/5 transition">
                          <Flag className="w-3 h-3" /> Report
                        </button>
                      </div>
                    </div>
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
                              <div key={c.id}>
                                <div className="flex items-start gap-2.5">
                                  <UserAvatar src={c.userImage || ""} userId={c.userId || ""} className="w-6 h-6 mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] font-black text-white/80 truncate">{(() => { const d = getUserDisplay(c.userId); return d.name || c.userName; })()}</span>
                                      <span className="text-[8px] text-gray-500">{new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                                      {String(c.userId) === String(currentUserId) && (
                                        <button onClick={() => deleteComment(post.id, c.id)} className="ml-auto text-gray-600 hover:text-red-400 transition">
                                          <X className="w-2.5 h-2.5" />
                                        </button>
                                      )}
                                    </div>
                                    <p className="text-[12px] text-white/70">{c.content}</p>
                                    <div className="flex items-center gap-0.5 mt-1">
                                      {["😂","❤️","💀","🏆"].map((icon, ri) => {
                                        const r = commentReactions[c.id]?.find((rx: any) => rx.type === ["LOL","Love","Wipe","Carry"][ri]);
                                        const active = r?.userReacted;
                                        return (
                                          <button key={ri} onClick={() => handleCommentReaction(c.id, ["LOL","Love","Wipe","Carry"][ri])} className={`text-[10px] px-1 py-0.5 rounded-lg transition ${active ? "bg-[#00ffff]/10" : "hover:bg-white/5"}`}>
                                            {icon}{r?.count ? <span className={`text-[8px] ml-0.5 font-black ${active ? "text-[#00ffff]" : "text-gray-500"}`}>{r.count}</span> : null}
                                          </button>
                                        );
                                      })}
                                      <button onClick={() => setReplyTo(replyTo?.parentId === c.id && replyTo?.postId === post.id ? null : { postId: post.id, parentId: c.id })} className="text-[9px] font-black text-gray-500 hover:text-[#00ffff] ml-1">
                                        Reply
                                      </button>
                                    </div>
                                    {/* Inline reply input */}
                                    {replyTo?.postId === post.id && replyTo?.parentId === c.id && (
                                      <div className="flex items-center gap-2 mt-2">
                                        <UserAvatar src={session?.user?.image || ""} userId={(session?.user as any)?.id || ""} className="w-5 h-5 shrink-0" />
                                        <input
                                          value={replyText}
                                          onChange={(e) => setReplyText(e.target.value)}
                                          onKeyDown={(e) => { if (e.key === "Enter") postComment(post.id, c.id); if (e.key === "Escape") { setReplyTo(null); setReplyText(""); } }}
                                          placeholder={`Reply to ${c.userName}...`}
                                          autoFocus
                                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1 text-[10px] outline-none focus:border-[#00ffff]/40 transition-colors text-white/80 placeholder-gray-600"
                                        />
                                        <button onClick={() => postComment(post.id, c.id)} disabled={postingComment === post.id} className="p-1 text-[#00ffff] hover:bg-[#00ffff]/10 rounded-lg transition disabled:opacity-30">
                                          <Send className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
                                    {/* Nested replies */}
                                    {replies.length > 0 && (
                                      <div className="mt-2 space-y-2 ml-3 pl-3 border-l border-white/5">
                                        {replies.map((r: any) => (
                                          <div key={r.id} className="flex items-start gap-2">
                                            <UserAvatar src={r.userImage || ""} userId={r.userId || ""} className="w-5 h-5 mt-0.5" />
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-black text-white/70 truncate">{(() => { const d = getUserDisplay(r.userId); return d.name || r.userName; })()}</span>
                                                <span className="text-[7px] text-gray-500">{new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                                                {String(r.userId) === String(currentUserId) && (
                                                  <button onClick={() => deleteComment(post.id, r.id)} className="ml-auto text-gray-600 hover:text-red-400 transition">
                                                    <X className="w-2 h-2" />
                                                  </button>
                                                )}
                                              </div>
                                              <p className="text-[11px] text-white/60">{r.content}</p>
                                              <div className="flex items-center gap-0.5 mt-0.5">
                                                {["😂","❤️","💀","🏆"].map((icon, ri) => {
                                                  const rr = commentReactions[r.id]?.find((rx: any) => rx.type === ["LOL","Love","Wipe","Carry"][ri]);
                                                  return (
                                                    <button key={ri} onClick={() => handleCommentReaction(r.id, ["LOL","Love","Wipe","Carry"][ri])} className={`text-[9px] px-1 py-0.5 rounded-lg transition ${rr?.userReacted ? "bg-[#00ffff]/10" : "hover:bg-white/5"}`}>
                                                      {icon}{rr?.count ? <span className={`text-[7px] ml-0.5 font-black ${rr?.userReacted ? "text-[#00ffff]" : "text-gray-500"}`}>{rr.count}</span> : null}
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
                                </div>
                              </div>
                            );
                          });
                        })()}
                        <div className="flex items-center gap-2 pt-1">
                          <UserAvatar src={session?.user?.image || ""} userId={(session?.user as any)?.id || ""} className="w-6 h-6 shrink-0" />
                          <input
                            value={commentInput[post.id] || ""}
                            onChange={(e) => setCommentInput((prev) => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === "Enter") postComment(post.id); }}
                            placeholder="Write a comment..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-[11px] outline-none focus:border-[#00ffff]/40 transition-colors text-white/80 placeholder-gray-600"
                          />
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => postComment(post.id)} disabled={postingComment === post.id} className="p-1.5 bg-[#00ffff]/10 text-[#00ffff] rounded-xl hover:bg-[#00ffff]/20 transition disabled:opacity-30">
                            <Send className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {reportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#0a0a16] border border-white/10 rounded-[2rem] p-6 w-full max-w-sm mx-4 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h3 className="text-sm font-black uppercase tracking-widest text-red-400">Report Post</h3>
            </div>
            <textarea value={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder="Why are you reporting this post?" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-red-400/30 resize-none min-h-[80px]" rows={3} />
            <div className="flex items-center justify-end gap-2 mt-4">
              <button onClick={() => { setReportModal(null); setReportReason(""); }} className="px-5 py-2 text-[10px] font-black text-gray-500 hover:text-white transition">Cancel</button>
              <button onClick={handleReport} disabled={!reportReason.trim()} className="px-5 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl text-[10px] font-black hover:bg-red-500 hover:text-white transition disabled:opacity-30">Submit Report</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
