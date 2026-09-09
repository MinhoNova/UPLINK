"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Shield,
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
} from "lucide-react";
import { resolveProfileImage } from "@/lib/profileImage";
import { getUserRanks } from "@/lib/ranks";
import {
  importLobbyVfxFromUrl,
  uploadLobbyVfxBlob,
  importProfileGifFromUrl,
  extractGifPosterBlob,
} from "@/lib/clientImagePoster";
import { resolveVfxSrc, resolveVfxBannerUrl } from "@/lib/vfxAssets";

const TEAM_MAX = 5;

export default function MyProfileClient() {
  const { data: session, status } = useSession();

  const [users, setUsers] = useState<any[]>([]);
  const [lobbies, setLobbies] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const myId = String((session?.user as any)?.id || "");

  const refresh = useCallback(() => {
    if (!myId) return;
    fetch("/api/data", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.registeredUsers) setUsers(d.registeredUsers);
        if (d.lobbies) setLobbies(d.lobbies);
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

  useEffect(() => {
    setTeamName(me?.team?.name || "");
    setTeamMembers(Array.isArray(me?.team?.members) ? me.team.members : []);
  }, [me?.id, me?.team?.name]);

  const myRanks = useMemo(() => {
    const stats = me?.stats || {};
    return getUserRanks(Number(stats.total) || 0, Number(stats.postCount) || 0, me?.rankOverride || null);
  }, [me]);

  const myVfx: any[] = me?.userVfx || [];

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
    if (teamMembers.length >= TEAM_MAX) {
      flash(`Max ${TEAM_MAX} team members`, "err");
      return;
    }
    setTeamMembers((prev) => [
      ...prev,
      { id: u.id, name: u.name || u.username, avatar: u.customAvatar || u.avatar || "" },
    ]);
  };

  const saveTeam = async () => {
    const ok = await patchMe({ team: { name: teamName.trim(), members: teamMembers } });
    if (ok) flash("Team saved");
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

  const avatarSrc = resolveProfileImage(me, session?.user?.name || "U");
  const rank = myRanks.overall;

  return (
    <div className="min-h-screen bg-[#050814] text-slate-200 font-sans selection:bg-blue-500/30 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vh] rounded-full blur-[140px]"
          style={{ background: "radial-gradient(circle, rgba(56,189,248,0.10) 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vh] rounded-full blur-[140px]"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.10) 0%, transparent 70%)" }} />
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[999] px-5 py-3 rounded-2xl border text-xs font-black uppercase tracking-widest shadow-2xl ${toast.type === "ok" ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300" : "bg-red-500/15 border-red-500/40 text-red-300"}`}>
          {toast.msg}
        </div>
      )}

      <main className="relative z-10 max-w-[1400px] mx-auto px-6 pt-28 pb-24">
        {/* Hero card */}
        <div className="tn-light relative w-full rounded-3xl bg-white/[0.04] backdrop-blur-3xl border border-cyan-500/25 p-8 shadow-[0_8px_32px_rgba(34,211,238,0.06)] mb-8 overflow-hidden">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative shrink-0">
              <div className="w-28 h-28 rounded-full bg-[#050814]/80 border border-blue-500/40 flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.25)]">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle2 className="w-14 h-14 text-blue-400/70" />
                )}
              </div>
              {me?.profileGif && (
                <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-emerald-300" />
                </span>
              )}
            </div>

            <div className="flex-1 text-center md:text-left min-w-0">
              <h1 className="font-serif text-2xl sm:text-3xl font-black tracking-[0.18em] uppercase text-blue-50">
                {(me?.displayName || me?.name || session?.user?.name || "Operative").toUpperCase()}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3">
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300">
                  <Crown className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{rank.tier}</span>
                </span>
                <img src={rank.image} alt={rank.tier} title={`${rank.tier} — Booster: ${Number(me?.stats?.total) || 0} runs · Poster: ${Number(me?.stats?.postCount) || 0} posts`} className="h-8 w-8 object-contain" />
                {me?.team?.name && (
                  <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300">
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{me.team.name}</span>
                  </span>
                )}
              </div>
              <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                {me?.battleTag || "@" + (me?.username || "")} · {(me?.stats?.total || 0)} runs completed
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Picture */}
          <div className="tn-light relative w-full rounded-3xl bg-white/[0.04] backdrop-blur-3xl border border-cyan-500/25 p-6">
            <div className="flex items-center gap-3 pb-4 mb-6 border-b border-blue-900/30">
              <UserCircle2 className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-black tracking-[0.2em] uppercase text-blue-100 font-serif">PROFILE PICTURE</h3>
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
          </div>

          {/* Team */}
          <div className="tn-light relative w-full rounded-3xl bg-white/[0.04] backdrop-blur-3xl border border-cyan-500/25 p-6">
            <div className="flex items-center gap-3 pb-4 mb-6 border-b border-blue-900/30">
              <Users className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-black tracking-[0.2em] uppercase text-blue-100 font-serif">MY TEAM</h3>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-auto">{teamMembers.length}/{TEAM_MAX}</span>
            </div>

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
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Add Members (up to {TEAM_MAX})</p>
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
              {teamMembers.length === 0 ? (
                <p className="py-6 text-center text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  No team members yet — recruit up to {TEAM_MAX} players
                </p>
              ) : (
                teamMembers.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-[#050814]/80 border border-white/10 flex items-center justify-center shrink-0">
                      {m.avatar ? <img src={m.avatar} className="w-full h-full object-cover" alt="" /> : <UserCircle2 className="w-4 h-4 text-slate-500" />}
                    </div>
                    <span className="flex-1 text-xs font-bold text-white truncate">{m.name}</span>
                    <button
                      onClick={() => setTeamMembers((prev) => prev.filter((x) => x.id !== m.id))}
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
          </div>
        </div>

        {/* Lobby Store */}
        <div className="tn-light relative w-full rounded-3xl bg-white/[0.04] backdrop-blur-3xl border border-cyan-500/25 p-6 mt-8">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-blue-900/30">
            <ShieldCheck className="w-4 h-4 text-[#ff007f]" />
            <h3 className="text-xs font-black tracking-[0.2em] uppercase text-blue-100 font-serif">MY LOBBY BACKGROUNDS</h3>
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