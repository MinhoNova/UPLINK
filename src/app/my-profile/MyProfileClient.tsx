"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  Sparkles,
  Users,
  Upload,
  Link as LinkIcon,
  Trash2,
  Check,
  UserPlus,
  Save,
  Loader2,
  UserCircle2,
  Crown,
  X,
  ExternalLink,
  Copy,
} from "lucide-react";
import GradientColorPicker, { toNameStyle, nameGlowColor } from "@/components/GradientColorPicker";
import { resolveProfileBanner, resolveProfileImage } from "@/lib/profileImage";
import { getUserRanks } from "@/lib/ranks";
import {
  importLobbyVfxFromUrl,
  uploadLobbyVfxBlob,
  importProfileGifFromUrl,
  extractGifPosterBlob,
} from "@/lib/clientImagePoster";
import { resolveVfxSrc, resolveVfxBannerUrl } from "@/lib/vfxAssets";

const TEAM_MAX = 4;
const TEAM_MAX_MEMBERS = 3;
const TEAM_RENAME_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

export default function MyProfileClient() {
  const { data: session, status } = useSession();

  const [users, setUsers] = useState<any[]>([]);
  const [lobbies, setLobbies] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const myId = String((session?.user as any)?.id || "");
  const [dataLoaded, setDataLoaded] = useState(false);

  const refresh = useCallback(() => {
    if (!myId) return;
    fetch("/api/data", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.registeredUsers) setUsers(d.registeredUsers);
        if (d.lobbies) setLobbies(d.lobbies);
        if (d.notifications) setNotifications(d.notifications);
        setDataLoaded(true);
      })
      .catch(() => {});
  }, [myId]);

  useEffect(() => {
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("data-refresh", refresh);
    const poll = setInterval(refresh, 8000);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("data-refresh", refresh);
      clearInterval(poll);
    };
  }, [refresh]);

  const me = useMemo(
    () => users.find((u: any) => String(u.id) === myId) || null,
    [users, myId]
  );

  const [avatarInput, setAvatarInput] = useState<string>("");
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [vfxUrl, setVfxUrl] = useState("");
  const [vfxBusy, setVfxBusy] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamQuery, setTeamQuery] = useState("");
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [nameColor, setNameColor] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerBusy, setBannerBusy] = useState(false);

  useEffect(() => {
    setTeamName(me?.team?.name || "");
    setTeamMembers(Array.isArray(me?.team?.members) ? me.team.members : []);
    setDisplayNameInput(me?.displayName || "");
    setNameColor(me?.nameColor || "");
    setBannerUrl(resolveProfileBanner(me) || "");
  }, [me?.id, me?.team?.name, me?.banner, me?.bannerDisabled]);

  const teamConfirmed = useMemo(
    () => teamMembers.filter((m: any) => m.status !== "pending").length,
    [teamMembers]
  );

  const teamTotal = me?.team?.name || teamMembers.length > 0 ? 1 + teamConfirmed : 0;

  const myRanks = useMemo(() => {
    const stats = me?.stats || {};
    return getUserRanks(Number(stats.total) || 0, Number(stats.postCount) || 0, me?.rankOverride || null);
  }, [me]);

  const myVfx: any[] = me?.userVfx || [];

  const publicUrl = `/community/${String(me?.username || "").toLowerCase()}`;

  const flash = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const patchMe = async (patch: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: { id: myId, ...patch } }),
      });
      const data = await res.json();
      if (!res.ok) {
        flash(data.error || "Save failed", "err");
        return false;
      }
      window.dispatchEvent(new Event("data-refresh"));
      return true;
    } catch {
      flash("Network error", "err");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarFile = async (file: File) => {
    const isGif = file.type.includes("gif") || file.name.toLowerCase().endsWith(".gif");
    if (!isGif && file.size > 4 * 1024 * 1024) {
      flash("File too large (max 4MB)", "err");
      return;
    }
    setAvatarBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file, file.name);
      fd.append("field", isGif ? "profileGif" : "customAvatar");
      if (isGif) {
        const poster = await extractGifPosterBlob(file);
        if (poster) fd.append("poster", poster, "poster.webp");
      }
      const res = await fetch("/api/user/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.url) {
        flash(data.error || "Upload failed", "err");
        return;
      }
      await patchMe(
        isGif
          ? { profileGif: data.url, profileGifThumb: data.thumbUrl || null }
          : { customAvatar: data.url }
      );
      flash("Profile picture updated");
    } catch {
      flash("Upload failed", "err");
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleAvatarUrl = async () => {
    const url = avatarInput.trim();
    if (!url) return;
    setAvatarBusy(true);
    try {
      const imported = await importProfileGifFromUrl(url);
      await patchMe({ profileGif: imported.url, profileGifThumb: imported.thumbUrl || null });
      setAvatarInput("");
      flash("Profile GIF added");
    } catch (err: any) {
      flash(err?.message || "Could not load GIF", "err");
    } finally {
      setAvatarBusy(false);
    }
  };

  const removeGif = async () => {
    await patchMe({ profileGif: null, profileGifThumb: null });
    flash("Profile GIF removed");
  };

  const handleBannerFile = async (file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      flash("File too large (max 8MB)", "err");
      return;
    }
    setBannerBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file, file.name);
      fd.append("field", "banner");
      const res = await fetch("/api/user/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.url) {
        flash(data.error || "Upload failed", "err");
        return;
      }
      const ok = await patchMe({ banner: data.url, bannerDisabled: false });
      if (ok) {
        setBannerUrl(data.url);
        flash("Banner updated — shows on your community profile too");
      }
    } catch {
      flash("Upload failed", "err");
    } finally {
      setBannerBusy(false);
    }
  };

  const removeBanner = async () => {
    const ok = await patchMe({ banner: null, bannerDisabled: true });
    if (ok) {
      setBannerUrl("");
      flash("Banner removed");
    }
  };

  const saveNameColor = async () => {
    const c = nameColor.trim();
    if (c && !/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c) && !/^linear-gradient\(90deg,\s*#[0-9a-fA-F]{3,6},\s*#[0-9a-fA-F]{3,6}\)$/.test(c)) {
      flash("Enter a valid hex color like #00ffff", "err");
      return;
    }
    const ok = await patchMe({ nameColor: c || null });
    if (ok) flash(c ? "Name color applied everywhere" : "Name color reset");
  };

  const handleVfxFile = async (file: File) => {
    setVfxBusy(true);
    try {
      const isGif = file.type.includes("gif") || file.name.toLowerCase().endsWith(".gif");
      const data = await uploadLobbyVfxBlob(file, isGif ? "lobby.gif" : file.name || "lobby.webp");
      const next = [...(me?.userVfx || []), data.entry];
      const ok = await patchMe({ userVfx: next });
      if (ok) flash("Lobby background added");
    } catch (err: any) {
      flash(err?.message || "Upload failed", "err");
    } finally {
      setVfxBusy(false);
    }
  };

  const handleVfxUrl = async () => {
    const url = vfxUrl.trim();
    if (!url) return;
    setVfxBusy(true);
    try {
      const data = await importLobbyVfxFromUrl(url);
      const next = [...(me?.userVfx || []), data.entry];
      const ok = await patchMe({ userVfx: next });
      if (ok) {
        setVfxUrl("");
        flash("Lobby background added");
      }
    } catch (err: any) {
      flash(err?.message || "Could not import URL", "err");
    } finally {
      setVfxBusy(false);
    }
  };

  const activateVfx = async (src: string) => {
    const ok = await patchMe({ activeVfx: src === me?.activeVfx ? null : src });
    if (ok) flash(me?.activeVfx === src ? "Background deactivated" : "Background activated");
  };

  const deleteVfx = async (src: string) => {
    const next = (me?.userVfx || []).filter((e: any) => resolveVfxSrc(e) !== src);
    const patch: Record<string, unknown> = { userVfx: next };
    if (me?.activeVfx === src) patch.activeVfx = null;
    const ok = await patchMe(patch);
    if (ok) flash("Background deleted");
  };

  const candidateTeam = useMemo(() => {
    const q = teamQuery.trim().toLowerCase();
    if (!q) return [];
    const mine = new Set(teamMembers.map((m) => m.id));
    return users
      .filter(
        (u: any) =>
          String(u.id) !== myId &&
          !mine.has(String(u.id)) &&
          ((u.name || "").toLowerCase().includes(q) ||
            (u.username || "").toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [users, teamQuery, teamMembers, myId]);

  const addTeamMember = (u: any) => {
    if (teamMembers.length >= TEAM_MAX_MEMBERS) {
      flash(`Team is full (max ${TEAM_MAX} with you)`, "err");
      return;
    }
    setTeamMembers((prev) => [
      ...prev,
      {
        id: u.id,
        name: u.name || u.username,
        avatar: u.avatar || u.customAvatar || "",
        status: "pending",
        inviteNotifId: Date.now(),
      },
    ]);
  };

  const sendTeamInviteNotification = async (memberId?: string) => {
    try {
      await fetch("/api/teams/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId: myId, memberId: memberId || null }),
      });
    } catch {}
  };

  const saveTeam = async () => {
    const wantName = teamName.trim();
    const prevName = String(me?.team?.name || "").trim();
    const lastRenameAt = Number(me?.team?.lastRenameAt) || 0;
    const isRename = prevName && wantName && wantName !== prevName;
    if (isRename && lastRenameAt && Date.now() - lastRenameAt < TEAM_RENAME_COOLDOWN_MS) {
      const daysLeft = Math.ceil((TEAM_RENAME_COOLDOWN_MS - (Date.now() - lastRenameAt)) / (24 * 60 * 60 * 1000));
      flash(`Team rename available in ${daysLeft} day${daysLeft > 1 ? "s" : ""} — or open a support ticket`, "err");
      return;
    }
    if (!wantName && teamMembers.length === 0) return;

    const patch: Record<string, unknown> = {
      team: {
        name: wantName,
        members: teamMembers,
        ...(lastRenameAt ? { lastRenameAt } : {}),
        ...(wantName !== prevName && (!prevName || !lastRenameAt) ? { lastRenameAt: Date.now() } : {}),
      },
    };

    const ok = await patchMe(patch);
    if (ok) {
      window.dispatchEvent(new Event("data-refresh"));
      refresh();
      const pendingIds = teamMembers.filter((m: any) => m.status === "pending").map((m: any) => String(m.id));
      for (const memberId of pendingIds) await sendTeamInviteNotification(memberId);
      if (pendingIds.length === 0) await sendTeamInviteNotification();
      flash("Team saved");
    }
  };

  const incomingInvites = useMemo(
    () =>
      notifications.filter(
        (n: any) =>
          String(n?.type) === "team_invite" &&
          String(n?.toUser || "").toLowerCase() === String(me?.username || "").toLowerCase()
      ),
    [notifications, me?.username]
  );

  const respondToInvite = async (notif: any, action: "accept" | "decline") => {
    if (!notif?.ownerId) return;
    try {
      const res = await fetch("/api/teams/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId: notif.ownerId, action }),
      });
      if (res.ok) {
        const next = notifications.filter((n: any) => Number(n.id) !== Number(notif.id));
        setNotifications(next);
        refresh();
        window.dispatchEvent(new Event("data-refresh"));
        flash(action === "accept" ? "Team invite accepted" : "Team invite declined");
      } else {
        const d = await res.json().catch(() => ({}));
        flash(d.error || "Request failed", "err");
      }
    } catch {
      flash("Network error", "err");
    }
  };

  const saveDisplayName = async () => {
    const ok = await patchMe({ displayName: displayNameInput.trim() || null });
    if (ok) flash(displayNameInput.trim() ? "Display name saved" : "Display name reset");
  };

  const copyDiscordHandle = async () => {
    const handle = String(me?.username || "");
    if (!handle) return;
    try {
      await navigator.clipboard.writeText(handle);
      flash("Discord handle copied");
    } catch {
      flash("Could not copy", "err");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#050814] text-slate-200 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (status !== "authenticated" || !myId) {
    return (
      <div className="min-h-screen bg-[#050814] text-slate-200 flex items-center justify-center">
        <p className="text-xs uppercase tracking-widest text-slate-500">Sign in to view your profile</p>
      </div>
    );
  }

  if (!dataLoaded) {
    return (
      <div className="min-h-screen bg-[#050814] text-slate-200 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  const avatarSrc = resolveProfileImage(me, session?.user?.name || "U");
  const rank = myRanks.overall;

  return (
    <div className="relative min-h-screen bg-[#050814] text-slate-200 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {/* Scenic artwork + dot-net — same composition as the lobby home && Offer Forge */}
      <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden>
        <div className="absolute inset-0 bg-cover bg-center sm:bg-contain sm:bg-top sm:bg-no-repeat" style={{ backgroundImage: `url('/AION2.png')` }} />
        <div className="absolute inset-0 bg-[#050814]/40 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050814]/12 via-transparent to-[#050814]/35" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(5,8,20,0.8)_100%)]" />
        <div className="aion-dotnet absolute inset-0 opacity-[0.10]" />
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[999] px-5 py-3 rounded-2xl border text-xs font-black uppercase tracking-widest shadow-2xl ${toast.type === "ok" ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300" : "bg-red-500/15 border-red-500/40 text-red-300"}`}>
          {toast.msg}
        </div>
      )}

      <main className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-24">
        {/* ══ HERO ══ */}
        <div className="tn-light relative w-full rounded-3xl bg-[#070a1c]/70 backdrop-blur-xl border border-cyan-500/25 overflow-hidden mb-8 shadow-[0_8px_32px_rgba(34,211,238,0.06)]">
          {resolveProfileBanner(me) && (
            <>
              <img src={resolveProfileBanner(me)!} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#050814]/85 via-[#050814]/45 to-[#050814]/20" />
              <div className="absolute inset-0 bg-gradient-to-b from-[#050814]/30 via-transparent to-[#050814]/60" />
            </>
          )}
          <div className="h-[3px] w-full bg-gradient-to-r from-cyan-400/0 via-cyan-400/70 to-purple-500/60" />
          <div className="relative p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 lg:gap-10 items-center">
            {/* Avatar */}
            <div className="relative w-fit mx-auto lg:mx-0">
              <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-blue-500/20 blur-2xl animate-pulse" />
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#050814]/80 border-2 border-blue-500/40 flex items-center justify-center overflow-hidden shadow-[0_0_40px_rgba(59,130,246,0.3)]">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle2 className="w-14 h-14 text-blue-400/70" />
                  )}
                </div>
                <img
                  src={rank.image}
                  alt={rank.tier}
                  title={`${rank.tier} — Booster: ${Number(me?.stats?.total) || 0} runs · Poster: ${Number(me?.stats?.postCount) || 0} posts`}
                  className="absolute -bottom-1 -right-1 w-12 h-12 object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.35)]"
                />
              </div>
            </div>

            {/* Identity + stats */}
            <div className="min-w-0 text-center lg:text-left flex flex-col justify-center">
              <h1
                className="text-2xl sm:text-3xl font-black tracking-[0.18em] uppercase"
                style={me?.nameColor ? { ...toNameStyle(me.nameColor), textShadow: `0 0 20px ${nameGlowColor(me.nameColor)}88` } : { color: "#eff6ff" }}
              >
                {(me?.displayName || me?.name || session?.user?.name || "Operative").toUpperCase()}
              </h1>
              <button
                onClick={copyDiscordHandle}
                title="Click to copy Discord username"
                className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-lg bg-[#5865F2]/15 border border-[#5865F2]/40 text-[#8ea1ff] hover:bg-[#5865F2]/25 transition-all px-2.5 py-1"
              >
                <span className="text-[#5865F2] font-black text-[10px]">D</span>
                <span className="text-[10px] font-bold">@{me?.username || me?.name || "—"}</span>
                <Copy className="w-3 h-3" />
              </button>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 mt-4">
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300">
                  <Crown className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{rank.tier}</span>
                </span>
                {me?.team?.name && (
                  <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300">
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{me.team.name}</span>
                  </span>
                )}
              </div>

              {/* Quick stats */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 mt-5">
                <span className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10">
                  <span className="text-lg font-black text-cyan-300 mr-1.5">{Number(me?.stats?.total) || 0}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Runs</span>
                </span>
                <span className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10">
                  <span className="text-lg font-black text-purple-300 mr-1.5">{Number(me?.stats?.postCount) || 0}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Posts</span>
                </span>
                <span className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10">
                  <span className="text-lg font-black text-emerald-300 mr-1.5">{teamTotal}/{TEAM_MAX}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Squad</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-6">
                <a
                  href={publicUrl}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/15 to-purple-500/15 border border-cyan-500/30 text-cyan-200 hover:from-cyan-500/25 hover:to-purple-500/25 hover:border-cyan-400/50 transition-all font-black text-[10px] uppercase tracking-widest"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Public Profile
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Picture */}
          <div className="tn-light relative w-full rounded-3xl bg-[#070a1c]/70 backdrop-blur-xl border border-cyan-500/25 p-6">
            <div className="flex items-center gap-3 pb-4 mb-6 border-b border-blue-900/30">
              <UserCircle2 className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-black tracking-[0.2em] uppercase text-blue-100">PROFILE PICTURE</h3>
            </div>

            <div className="flex items-center gap-5 mb-6">
              <div className="w-20 h-20 rounded-full overflow-hidden border border-blue-500/30 bg-[#050814]/80 flex items-center justify-center shrink-0">
                {avatarSrc ? <img src={avatarSrc} className="w-full h-full object-cover" alt="" /> : <UserCircle2 className="w-9 h-9 text-blue-400/60" />}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Animated GIF or image</p>
                <p className="text-[9px] text-slate-600 mt-1">Animated backgrounds show on the offers you post.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <label className="cursor-pointer flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 transition-all text-[10px] font-black uppercase tracking-widest text-blue-200">
                <Upload className="w-3.5 h-3.5" />
                {avatarBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Upload"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={avatarBusy}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) void handleAvatarFile(f);
                  }}
                />
              </label>
              <a href="#avatar-url" className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest text-slate-300">
                <LinkIcon className="w-3.5 h-3.5" />
                GIF URL
              </a>
            </div>

            <div id="avatar-url" className="flex gap-2 mb-4">
              <input
                value={avatarInput}
                onChange={(e) => setAvatarInput(e.target.value)}
                placeholder="https://media.giphy.com/...gif"
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-400/50 text-sm font-bold placeholder:text-slate-700"
              />
              <button
                onClick={handleAvatarUrl}
                disabled={avatarBusy || !avatarInput.trim()}
                className="px-5 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-black font-black text-[10px] uppercase tracking-widest disabled:opacity-40 transition-all"
              >
                Add
              </button>
            </div>

            {me?.profileGif && (
              <button
                onClick={removeGif}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 transition-all text-[10px] font-black uppercase tracking-widest"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove GIF
              </button>
            )}

            <div className="mt-6 pt-5 border-t border-blue-900/30">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">
                Custom display name <span className="text-slate-700 normal-case tracking-normal">(your Discord name still shows on your public profile)</span>
              </p>
              <div className="flex gap-2">
                <input
                  value={displayNameInput}
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  placeholder={me?.name || "Game name"}
                  maxLength={40}
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-400/50 text-sm font-bold placeholder:text-slate-700"
                />
                <button
                  onClick={saveDisplayName}
                  disabled={saving}
                  className="px-5 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-black font-black text-[10px] uppercase tracking-widest disabled:opacity-40 transition-all"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Banner */}
            <div className="mt-6 pt-5 border-t border-blue-900/30">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">
                Profile banner <span className="text-slate-700 normal-case tracking-normal">(GIF or image — shows on your community profile, like Facebook)</span>
              </p>
              <div className="w-full h-16 rounded-xl overflow-hidden border border-cyan-500/25 bg-black/40 relative mb-3">
                {bannerUrl ? (
                  <img src={bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[9px] font-black uppercase tracking-widest text-slate-600">Banner removed</div>
                )}
              </div>
              <div className="flex gap-2">
                <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 transition-all text-[10px] font-black uppercase tracking-widest text-blue-200">
                  <Upload className="w-3.5 h-3.5" />
                  {bannerBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Upload Banner"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={bannerBusy}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (f) void handleBannerFile(f);
                    }}
                  />
                </label>
                {bannerUrl && (
                  <button
                    onClick={removeBanner}
                    disabled={bannerBusy}
                    className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 transition-all text-[10px] font-black uppercase tracking-widest"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Name Color */}
            <div className="mt-6 pt-5 border-t border-blue-900/30">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3">
                Name color <span className="text-slate-700 normal-case tracking-normal">(gradient or solid — applies everywhere)</span>
              </p>
              <GradientColorPicker value={nameColor} onChange={setNameColor} />
              <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Preview</p>
                <p
                  className="text-xl font-black uppercase tracking-widest truncate"
                  style={nameColor.trim() ? { ...toNameStyle(nameColor.trim()), textShadow: `0 0 18px ${nameGlowColor(nameColor.trim())}88` } : undefined}
                >
                  {(displayNameInput.trim() || me?.username || me?.name || session?.user?.name || "Operative")}
                </p>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={saveNameColor}
                  disabled={saving || !nameColor.trim()}
                  className="px-5 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-black font-black text-[10px] uppercase tracking-widest disabled:opacity-40 transition-all flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save Color
                </button>
              </div>
            </div>
          </div>

          {/* Team */}
          <div className="tn-light relative w-full rounded-3xl bg-[#070a1c]/70 backdrop-blur-xl border border-cyan-500/25 p-6">
            <div className="flex items-center gap-3 pb-4 mb-6 border-b border-blue-900/30">
              <Users className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-black tracking-[0.2em] uppercase text-blue-100">MY TEAM</h3>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-auto">{teamTotal}/{TEAM_MAX}</span>
            </div>

            {incomingInvites.length > 0 && (
              <div className="mb-5 space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Team Invitations</p>
                {incomingInvites.map((n: any) => (
                  <div key={n.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#5865F2]/10 border border-[#5865F2]/30">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{n.teamName || "Team"}</p>
                      <p className="text-[9px] text-slate-400 truncate">
                        <span className="text-[#8ea1ff]">{n.fromUser || "@" + (n.fromHandle || "")}</span> invited you
                      </p>
                    </div>
                    <button
                      onClick={() => respondToInvite(n, "accept")}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500 hover:text-black transition-all text-[9px] font-black uppercase tracking-widest"
                    >
                      <Check className="w-3 h-3" /> Accept
                    </button>
                    <button
                      onClick={() => respondToInvite(n, "decline")}
                      className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mb-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Team Name</p>
              <input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Team Leqed"
                maxLength={40}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-400/50 text-sm font-bold placeholder:text-slate-700"
              />
            </div>

            <div className="mb-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Add Members (up to {TEAM_MAX_MEMBERS})</p>
              <div className="flex gap-2">
                <input
                  value={teamQuery}
                  onChange={(e) => setTeamQuery(e.target.value)}
                  placeholder="Search by name or @username..."
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-400/50 text-sm font-bold placeholder:text-slate-700"
                />
              </div>
              {teamQuery.trim() && (
                <div className="mt-2 rounded-xl border border-white/10 bg-black/40 max-h-48 overflow-y-auto">
                  {candidateTeam.length === 0 ? (
                    <p className="px-4 py-3 text-[10px] text-slate-600 font-bold uppercase tracking-widest">No players found</p>
                  ) : (
                    candidateTeam.map((u: any) => (
                      <button
                        key={u.id}
                        onClick={() => addTeamMember(u)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-all text-left"
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-[#050814]/80 border border-white/10 flex items-center justify-center shrink-0">
                          {u.customAvatar || u.avatar ? (
                            <img src={u.customAvatar || u.avatar} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <UserCircle2 className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{u.name || u.username}</p>
                          <p className="text-[9px] text-slate-500 truncate">@{u.username}</p>
                        </div>
                        <UserPlus className="w-4 h-4 text-purple-400 shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-purple-500/[0.07] border border-purple-500/25">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-[#050814]/80 border border-purple-500/30 flex items-center justify-center shrink-0">
                  {me?.customAvatar || me?.profileGif || me?.avatar ? (
                    <img src={me?.customAvatar || me?.profileGif || me?.avatar} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <UserCircle2 className="w-4 h-4 text-slate-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-black text-white truncate block">{me?.name || me?.username || "You"}</span>
                  <span className="text-[7px] font-black uppercase tracking-widest text-purple-300/90">Leader · You</span>
                </div>
                <Crown className="w-3.5 h-3.5 text-purple-300/70 shrink-0" />
              </div>
              {teamMembers.length === 0 ? (
                <div className="flex flex-col items-center text-center py-8">
                  <div className="relative w-14 h-14 mb-3 flex items-center justify-center">
                    <div className="absolute inset-0 bg-purple-500/15 rounded-full blur-xl" />
                    <Users className="w-7 h-7 text-purple-400/60" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    No squad yet
                  </p>
                  <p className="text-[9px] text-slate-600 mt-1 max-w-[240px]">
                    Search usernames above to recruit up to {TEAM_MAX_MEMBERS} players.
                  </p>
                </div>
              ) : (
                teamMembers.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-[#050814]/80 border border-white/10 flex items-center justify-center shrink-0">
                      {m.avatar ? <img src={m.avatar} className="w-full h-full object-cover" alt="" /> : <UserCircle2 className="w-4 h-4 text-slate-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-white truncate block">{m.name}</span>
                      {m.status === "pending" && (
                        <span className="text-[7px] font-black uppercase tracking-widest text-amber-400/90">Awaiting accept</span>
                      )}
                    </div>
                    <button
                      onClick={async () => {
                        const next = teamMembers.filter((x) => x.id !== m.id);
                        setTeamMembers(next);
                        const patch: Record<string, unknown> = {
                          team: {
                            name: teamName.trim(),
                            members: next,
                            ...(me?.team?.lastRenameAt ? { lastRenameAt: me.team.lastRenameAt } : {}),
                          },
                        };
                        const ok = await patchMe(patch);
                        if (ok) {
                          window.dispatchEvent(new Event("data-refresh"));
                          refresh();
                          flash("Removed from squad");
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={saveTeam}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/40 text-white font-black text-[11px] uppercase tracking-widest hover:from-purple-500/30 hover:to-cyan-500/30 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Team
            </button>
            {(() => {
              const lastAt = Number(me?.team?.lastRenameAt) || 0;
              if (!lastAt) return null;
              const left = TEAM_RENAME_COOLDOWN_MS - (Date.now() - lastAt);
              if (left <= 0) return null;
              const days = Math.ceil(left / (24 * 60 * 60 * 1000));
              return (
                <p className="mt-3 text-[8px] text-slate-500 font-bold uppercase tracking-widest text-center">
                  Rename locked — next change in {days} day{days > 1 ? "s" : ""}
                </p>
              );
            })()}
          </div>
        </div>

        {/* Lobby Store */}
        <div className="tn-light relative w-full rounded-3xl bg-[#070a1c]/70 backdrop-blur-xl border border-cyan-500/25 p-6 mt-8">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-blue-900/30">
            <ShieldCheck className="w-4 h-4 text-[#ff007f]" />
            <h3 className="text-xs font-black tracking-[0.2em] uppercase text-blue-100">MY LOBBY BACKGROUNDS</h3>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-auto">
              Animated backgrounds appear on your offers & lobby
            </span>
          </div>

          <div className="flex flex-wrap gap-3 mb-8">
            <div className="flex-1 min-w-[220px] flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  value={vfxUrl}
                  onChange={(e) => setVfxUrl(e.target.value)}
                  placeholder="Paste GIF URL..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 outline-none focus:border-[#ff007f]/60 text-sm font-bold placeholder:text-slate-700"
                />
              </div>
              <button
                onClick={handleVfxUrl}
                disabled={vfxBusy || !vfxUrl.trim()}
                className="px-5 py-3.5 rounded-xl bg-[#ff007f] hover:bg-[#ff007f]/80 text-white font-black text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(255,0,127,0.4)] disabled:opacity-40 transition-all flex items-center gap-2"
              >
                {vfxBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LinkIcon className="w-3.5 h-3.5" />}
                Import
              </button>
            </div>
            <label className="cursor-pointer flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-black text-[10px] uppercase tracking-widest transition-all">
              {vfxBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Upload File
              <input
                type="file"
                accept="image/gif,image/webp,image/png,image/jpeg"
                className="hidden"
                disabled={vfxBusy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) void handleVfxFile(f);
                }}
              />
            </label>
          </div>

          {myVfx.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-center py-16">
              <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
                <div className="absolute inset-0 bg-[#ff007f]/15 rounded-full blur-xl" />
                <Shield className="w-8 h-8 text-[#ff007f]/70" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                No backgrounds yet — add your first one
              </p>
              <p className="text-[9px] text-slate-600 mt-1">
                It will appear in your hero preview above and on every offer you post.
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {myVfx.map((entry: any, i: number) => {
                const src = resolveVfxSrc(entry);
                const preview = resolveVfxBannerUrl(entry);
                const isActive = me?.activeVfx === src;
                return (
                  <motion.div
                    key={`${src}-${i}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`relative group border-2 rounded-2xl aspect-video overflow-hidden transition-all ${isActive ? "border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.25)]" : "border-white/10 hover:border-[#ff007f]/50"}`}
                  >
                    <img src={preview} className="w-full h-full object-cover" alt="" loading="lazy" />
                    {isActive && (
                      <span className="absolute top-3 left-3 bg-emerald-500 text-black font-black text-[9px] px-2 py-1 rounded-lg uppercase">Active</span>
                    )}
                    <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4 gap-3">
                      <button
                        onClick={() => activateVfx(src)}
                        className={`flex items-center gap-1.5 py-2 px-4 text-white font-black text-[10px] uppercase rounded-xl transition-all ${me?.activeVfx === src ? "bg-slate-600/90 hover:bg-slate-500" : "bg-emerald-600/90 hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]"}`}
                      >
                        {isActive ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                        {isActive ? "Active" : "Activate"}
                      </button>
                      <button
                        onClick={() => deleteVfx(src)}
                        className="py-2 px-4 bg-red-600/90 hover:bg-red-500 text-white font-black text-[10px] uppercase rounded-xl transition-all flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
