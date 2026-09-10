"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  Shield, Sparkles, Swords, Users, Search,
  Radio, Trash2, Check, Layers, X
} from "lucide-react";
import { useI18n } from "@/i18n/i18n";
import { useFlag } from "@/lib/siteFlags";
import { resolveLobbyBannerBg, resolveLobbyBannerAnimatedSrc } from "@/lib/vfxAssets";
import { resolveNameColor } from "@/lib/profileImage";
import { toNameStyle, nameGlowColor } from "@/components/GradientColorPicker";
import { getOwnerOngoingMissions, getJoinedOngoingMissions, isLobbyListedInPublicFeed } from "@/lib/lobbyLifecycle";
import { roleIconUrl } from "@/lib/classThumb";
import {
  AION2_CLASSES,
  AION2_ROLE_LABEL,
  aionClassRole,
  AION2_LEVEL_MAX,
} from "@/lib/aionClassMeta";

/* ── FILTER TABS ── */
const FILTER_TABS = [
  { label: "ALL",       key: "All",       icon: Layers },
  { label: "DUNGEONS",  key: "Dungeons",  icon: Shield },
  { label: "LEVELING",  key: "Leveling",  icon: Sparkles },
  { label: "PVP",       key: "PVP",       icon: Swords },
];

export default function Aion2TestClubPage() {
  const { t } = useI18n();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("All");
  const motionOn = useFlag("uplink_bg_motion", true);

  const [lobbies, setLobbies] = useState<any[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [signalScan, setSignalScan] = useState(true);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [applyError, setApplyError] = useState("");
  const [applyTarget, setApplyTarget] = useState<any>(null);
  const [applyAionClass, setApplyAionClass] = useState("");
  const [applyLevel, setApplyLevel] = useState("60");
  const [applyNote, setApplyNote] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const meId = String((session?.user as any)?.id || "");
  const meName = String((session?.user as any)?.name || "Operative");

  useEffect(() => {
    if (!meId) return;
    let cancelled = false;
    const load = () => {
      if (!meId) return;
      fetch("/api/data", { credentials: "include" })
        .then((r) => r.json())
        .then((d) => {
          if (cancelled) return;
          if (d.registeredUsers) setRegisteredUsers(d.registeredUsers);
          if (d.lobbies) setLobbies(d.lobbies);
          setSignalScan(false);
        })
        .catch(() => { if (!cancelled) setSignalScan(false); });
    };
    load();
    window.addEventListener("focus", load);
    window.addEventListener("data-refresh", load);
    const poll = setInterval(load, 8000);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", load);
      window.removeEventListener("data-refresh", load);
      clearInterval(poll);
    };
  }, [meId]);

  const missions = useMemo(() => {
    if (!meId) return [];
    const seen = new Set<string>();
    const out: any[] = [];
    for (const m of [
      ...getOwnerOngoingMissions(lobbies, meId),
      ...getJoinedOngoingMissions(lobbies, meId),
    ]) {
      const key = String(m.id);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(m);
    }
    return out.slice(0, 6);
  }, [lobbies, meId]);

  const missionOwner = (m: any) =>
    registeredUsers.find((u: any) => String(u.id) === String(m.ownerId)) || null;

  const OPEN_TAB_CATEGORIES: Record<string, string[] | null> = {
    All: null,
    Dungeons: ["dungeon"],
    Leveling: ["leveling"],
    PVP: [],
  };

  const displayOffers = useMemo(
    () => {
      const cats = OPEN_TAB_CATEGORIES[activeTab] ?? null;
      return lobbies
        .filter(isLobbyListedInPublicFeed)
        .filter((l) => cats === null || cats.includes(String(l.category || "")))
        .sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
    },
    [lobbies, activeTab]
  );

  const lobbyOwner = (l: any) =>
    registeredUsers.find((u: any) => String(u.id) === String(l.ownerId)) || null;

  const ownerPic = (l: any) => {
    const o = lobbyOwner(l);
    return String(o?.profileGif || o?.customAvatar || o?.avatar || l.ownerImage || "");
  };

  const ownerName = (l: any) => {
    const o = lobbyOwner(l);
    return String(o?.displayName || o?.name || o?.username || l.ownerDiscordName || l.serviceName || "Operative");
  };

  const openRolesOf = (l: any) => {
    const roles = l?.roles || {};
    return Object.entries(roles)
      .filter(([, n]) => Number(n) > 0)
      .map(([role, n]) => ({ role, n: Number(n) }));
  };

  const offerBgOf = (l: any) => {
    const o = lobbyOwner(l);
    if (!o || o.vfxSettings?.showOnBanner === false) return null;
    return (
      resolveLobbyBannerAnimatedSrc(l, o, o?.activeVfx) ||
      String(o?.profileGif || "") ||
      null
    );
  };

  const alreadyApplied = (l: any) =>
    meId && ((l.applicants || []).some((a: any) => String(a.applicantId || a.userId || a.id) === meId) || appliedIds.has(String(l.id)));

  const submitApply = async () => {
    const l = applyTarget;
    if (!meId || !l || applyingId) return;
    if (!applyAionClass) { setApplyError("Pick your class first"); return; }
    setApplyingId(String(l.id));
    setApplyError("");
    try {
      const res = await fetch("/api/lobbies/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lobbyId: l.id,
          applicant: {
            id: `${meId}-main`,
            role: aionClassRole(applyAionClass),
            className: applyAionClass,
            aionClass: applyAionClass,
            level: Number(applyLevel) || 1,
            applicantNote: applyNote,
            applicantName: meName,
          },
        }),
      });
      if (res.ok) {
        setAppliedIds((prev) => new Set([...prev, String(l.id)]));
        setApplyTarget(null);
        setApplyAionClass("");
        setApplyNote("");
        setApplyLevel("60");
        window.dispatchEvent(new Event("data-refresh"));
      } else {
        const d = await res.json().catch(() => ({}));
        setApplyError(d.error || "Could not apply");
      }
    } catch {
      setApplyError("Network error");
    } finally {
      setApplyingId(null);
    }
  };

  useEffect(() => {
    if (!meId) { setIsAdmin(false); return; }
    let cancelled = false;
    fetch("/api/users/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled) setIsAdmin(d?.role === "admin"); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [meId]);

  const deleteOffer = async (l: any) => {
    if (!meId || deletingId) return;
    setDeletingId(String(l.id));
    setDeleteError("");
    try {
      const res = await fetch("/api/lobbies/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lobbyId: l.id }),
      });
      if (res.ok) {
        setLobbies((prev) => prev.filter((x: any) => String(x.id) !== String(l.id)));
        setConfirmId(null);
        window.dispatchEvent(new Event("data-refresh"));
      } else {
        const d = await res.json().catch(() => ({}));
        setDeleteError(d.error || "Could not delete this offer");
      }
    } catch {
      setDeleteError("Network error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#050814] text-slate-200 font-sans selection:bg-blue-500/30 overflow-x-hidden relative">

      {/* Scenic Background Artwork — full page, behind all content, never cut */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0 bg-contain bg-top bg-no-repeat"
          style={{
            backgroundImage: `url('/AION2.png')`,
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 46%, rgba(0,0,0,0.5) 62%, rgba(0,0,0,0.18) 76%, transparent 90%)",
            maskImage: "linear-gradient(to bottom, black 0%, black 46%, rgba(0,0,0,0.5) 62%, rgba(0,0,0,0.18) 76%, transparent 90%)",
          }}
        />
        <div className="absolute inset-0 bg-[#050814]/40 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050814]/12 via-[#050814]/35 to-[#050814]/95" />
        <div className="absolute inset-x-0 top-0 h-[230vh] bg-[linear-gradient(to_bottom,transparent_0%,rgba(5,8,20,0.3)_70vh,rgba(5,8,20,0.75)_120vh,rgba(5,8,20,0.97)_175vh,#050814_215vh)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(5,8,20,0.8)_100%)]" />
        <div className="aion-dotnet absolute inset-0 opacity-[0.10]" />
      </div>

      {/* ══════════════════════════════════════════════════════════
          HERO SECTION
          ══════════════════════════════════════════════════════════ */}
      <section className="tn-hero relative w-full min-h-[620px] flex items-center justify-center py-12 px-4">

        {/* Center glow — subtle, doesn't wash out the image */}
        <motion.div
          animate={motionOn ? {
            scale: [1, 1.12, 1],
            opacity: [0.15, 0.28, 0.15],
          } : undefined}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] rounded-full blur-[110px] pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(56,189,248,0.18) 0%, rgba(168,85,247,0.10) 50%, transparent 75%)",
          }}
        />

        {/* Left / Right aurora glows — very subtle */}
        <motion.div
          animate={motionOn ? {
            scale: [1, 1.12, 1],
            opacity: [0.08, 0.18, 0.08],
          } : undefined}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vh] rounded-full blur-[140px]"
          style={{
            background: "radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)",
          }}
        />
        <motion.div
          animate={motionOn ? {
            scale: [1, 1.15, 1],
            opacity: [0.06, 0.15, 0.06],
          } : undefined}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -top-[10%] -right-[10%] w-[50vw] h-[50vh] rounded-full blur-[140px]"
          style={{
            background: "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)",
          }}
        />

        {/* Hero Content — no glass wrapper, transparent background */}
        <div className="relative z-10 flex flex-col items-center text-center mt-6 px-8 sm:px-14 py-10 max-w-2xl mx-auto">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center"
          >
            {/* FIND YOUR CREW with side lines */}
            <div className="flex items-center gap-6 mt-1">
              <span className="h-px w-16 bg-gradient-to-r from-transparent to-blue-400/60" />
              <h2 className="text-sm sm:text-base font-bold tracking-[0.4em] text-blue-100 uppercase drop-shadow-[0_0_12px_rgba(56,189,248,0.6)]">
                {t("hero_crew") || "FIND YOUR CREW"}
              </h2>
              <span className="h-px w-16 bg-gradient-to-l from-transparent to-blue-400/60" />
            </div>

            {/* DUNGEONS · RAIDS · LEVELING */}
            <p className="mt-4 text-[11px] font-bold tracking-[0.3em] text-slate-300 uppercase">
              {((t("hero_tagline") || "DUNGEONS · RAIDS · LEVELING").split("·").map((part: string, i: number) => (
                <span key={i}>
                  {i > 0 && <span className="mx-2 text-purple-400/80 drop-shadow-[0_0_6px_rgba(168,85,247,0.8)]">✦</span>}
                  {part.trim()}
                </span>
              )))}
            </p>

            {/* Subtext */}
            <p className="mt-2 text-xs text-slate-400 font-medium max-w-md">
              {t("hero_adventure") || "Find trusted players for your next adventure."}
            </p>

            {/* Vertical Accent Line */}
            <div className="w-[1px] h-8 bg-gradient-to-b from-purple-500/60 to-transparent my-4" />
          </motion.div>

          {/* CREATE YOUR OFFER Button — transparent, no glass */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <motion.a
              href="/create-offer"
              className="relative group overflow-hidden rounded-full p-[1px] shadow-[0_0_35px_rgba(59,130,246,0.25)] hover:shadow-[0_0_55px_rgba(168,85,247,0.45)] transition-all duration-500 block hover:scale-105 active:scale-95"
            >
              {/* Animated border gradient */}
              <span className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]" />

              {/* Button inner: transparent, no backdrop-blur */}
              <div className="relative bg-transparent px-16 py-4 rounded-full flex items-center justify-center gap-4 border border-white/12 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] transition-all">
                <span className="text-xs font-black tracking-[0.3em] uppercase text-white drop-shadow-[0_0_8px_rgba(0,0,0,0.4)]">
                  {t("hero_create") || "CREATE YOUR OFFER"}
                </span>
                <span className="text-blue-300 group-hover:translate-x-1 transition-transform font-bold">›</span>
              </div>
            </motion.a>
          </motion.div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          MAIN CONTENT GRID
          ══════════════════════════════════════════════════════════ */}
      <main className="max-w-[1600px] mx-auto px-6 pb-24 relative z-20">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-8">

          {/* Center Column: Offers */}
          <section className="min-w-0">
            {/* Filter Tabs — aligned above the offer cards */}
            <div className="flex items-center gap-2 p-1.5 mb-6 w-fit max-w-full overflow-x-auto bg-[#0a0f26]/70 backdrop-blur-md rounded-full border border-blue-900/40 shadow-[0_4px_24px_rgba(34,211,238,0.06)]">
              {FILTER_TABS.map((tab) => {
                const isActive = activeTab === tab.key;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black tracking-[0.18em] transition-all duration-300 shrink-0 ${
                      isActive
                        ? 'bg-[#151c3d] text-white shadow-[inset_0_0_20px_rgba(59,130,246,0.2)] border border-blue-500/40'
                        : 'text-slate-400 hover:text-white border border-transparent hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Offer List */}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {displayOffers.map((offer) => {
                  const owner = lobbyOwner(offer);
                  const pic = ownerPic(offer);
                  const name = ownerName(offer);
                  const ownerColor = resolveNameColor(owner);
                  const openRoles = openRolesOf(offer);
                  const applied = alreadyApplied(offer);
                  const isMine = String(offer.ownerId) === meId;
                  const offerBg = offerBgOf(offer);
                  return (
                  <motion.div
                    key={`${offer.id}-${offer.createdAt || ""}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.005 }}
                    className="tn-light relative w-full min-h-[104px] rounded-2xl bg-white/[0.04] backdrop-blur-2xl border border-cyan-500/20 overflow-hidden flex flex-col sm:flex-row sm:items-center gap-3 pr-2 pl-3 py-3 group shadow-[0_4px_24px_rgba(34,211,238,0.08)] hover:shadow-[0_0_32px_rgba(34,211,238,0.15)] hover:bg-white/[0.06] transition-all"
                  >
                    {/* Faction VFX banner / gradient — full card */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-85 group-hover:opacity-100 transition-opacity">
                      {offerBg ? (
                        <>
                          <img
                            src={offerBg}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-[#050814] via-[#050814]/75 to-[#050814]/10" />
                        </>
                      ) : (
                        <div className="absolute right-0 top-0 bottom-0 w-2/5">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-800/50 via-violet-800/30 to-cyan-700/20" />
                          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0f26] via-[#0a0f26]/60 to-transparent" />
                        </div>
                      )}
                    </div>

                    {/* Creator avatar */}
                    <div className="relative z-10 flex-shrink-0">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#050814]/80 border-2 border-cyan-400/40 flex items-center justify-center overflow-hidden shadow-[0_0_18px_rgba(59,130,246,0.25)] group-hover:border-cyan-300/70 transition-colors">
                        {pic ? (
                          <img src={pic} alt="" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                        ) : (
                          <Users className="w-6 h-6 text-cyan-400/70" />
                        )}
                      </div>
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0a0f26]" />
                    </div>

                    {/* Offer Details */}
                    <div className="relative z-10 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
                          {String(offer.category || "dungeon").toUpperCase()}
                        </span>
                        {applied && (
                          <span className="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border border-emerald-400/40 bg-emerald-500/10 text-emerald-300">
                            Applied
                          </span>
                        )}
                      </div>
                      <h4 className="mt-1.5 text-sm font-black tracking-widest text-white uppercase group-hover:text-cyan-200 transition-colors truncate">
                        {offer.title || `${offer.runsCount || 1}× Boost`}
                      </h4>
                      <p
                        className="text-[9px] font-bold text-cyan-200/70 uppercase tracking-widest"
                        style={ownerColor ? { ...toNameStyle(ownerColor), textShadow: `0 0 12px ${nameGlowColor(ownerColor)}66` } : undefined}
                      >
                        {name}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        {offer.serverRegion && (
                          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[9px] font-black tracking-widest text-violet-300">
                            {String(offer.serverRegion).toUpperCase()}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                          <Users className="w-3.5 h-3.5 text-cyan-400" />
                          {openRoles.length > 0
                            ? `OPEN: ${openRoles.map((r) => `${r.n} ${r.role.toUpperCase()}`).join(" · ")}`
                            : "FULL"}
                        </span>
                      </div>
                    </div>

                    {/* Apply / Live / Delete */}
                    <div className="relative z-10 flex-shrink-0 sm:pl-2 flex flex-col gap-1.5 min-w-[150px]">
                      {applied ? (
                        <span className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-[9px] font-black uppercase tracking-widest">
                          <Check className="w-3 h-3" /> Applied
                        </span>
                      ) : (
                        <button
                          onClick={() => { setApplyTarget(offer); setApplyError(""); }}
                          disabled={!meId || applyingId === String(offer.id)}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#074f7b] to-[#41389f] text-white text-[9px] font-black uppercase tracking-widest hover:from-[#08a3c4] hover:to-[#5b4ddb] transition-all shadow-[0_0_18px_rgba(0,180,255,0.25)] disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          <Swords className="w-3 h-3" /> {applyingId === String(offer.id) ? "Applying..." : "Apply"}
                        </button>
                      )}
                      {(isMine || isAdmin) && (
                        confirmId === String(offer.id) ? (
                          <button
                            onClick={() => deleteOffer(offer)}
                            disabled={deletingId === String(offer.id)}
                            className="px-4 py-2 rounded-lg border border-red-500/40 bg-red-600/15 text-red-300 text-[9px] font-black uppercase tracking-widest hover:bg-red-600/25 transition-all disabled:opacity-50"
                          >
                            {deletingId === String(offer.id) ? "Deleting..." : "Confirm Delete?"}
                          </button>
                        ) : (
                          <button
                            onClick={() => { setConfirmId(String(offer.id)); setDeleteError(""); window.setTimeout(() => setConfirmId((c) => (c === String(offer.id) ? null : c)), 4000); }}
                            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-gray-400 text-[9px] font-black uppercase tracking-widest hover:border-red-500/40 hover:text-red-300 hover:bg-red-600/10 transition-all"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        )
                      )}
                    </div>
                  </motion.div>
                  );
                })}
              </AnimatePresence>

              {displayOffers.length === 0 && (
                <div className="tn-light text-center py-16 bg-[#0a0f26]/40 border border-blue-900/30 rounded-[2rem]">
                  <Search className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                    {t("offers_empty") || "No offers in this category"}
                  </p>
                </div>
              )}

              {applyError && (
                <p className="text-center text-[10px] font-bold uppercase tracking-widest text-red-400">{applyError}</p>
              )}
              {deleteError && (
                <p className="text-center text-[10px] font-bold uppercase tracking-widest text-red-400">{deleteError}</p>
              )}
            </div>
          </section>

          {/* 3. Right Sidebar: Ongoing Missions */}
          <aside className="w-full">
            <div className="tn-light relative w-full rounded-3xl bg-white/[0.05] backdrop-blur-3xl border border-cyan-500/20 p-5 shadow-[0_8px_32px_rgba(34,211,238,0.05)] transition-all">
              {/* Widget Header */}
              <div className="flex items-center gap-3 pb-4 mb-5 border-b border-blue-900/30">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10">
                  <Shield className="w-4 h-4 text-blue-300" />
                </span>
                <h3 className="text-xs font-black tracking-[0.2em] uppercase text-blue-100">
                  {t("missions_header") || "ONGOING MISSIONS"}
                </h3>
                {meId && (
                  <span className="ml-auto flex items-center gap-1.5">
                    {signalScan ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                    <span className="text-[8px] font-black tracking-widest text-slate-500 uppercase">
                      {signalScan ? (t("missions_scan") || "SCANNING") : "LIVE"}
                    </span>
                  </span>
                )}
              </div>

              {/* Center Sigil Empty State */}
              {missions.length === 0 ? (
                <div className="flex flex-col items-center text-center py-10">
                  <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl" />
                    <Shield className="w-8 h-8 text-blue-400/70 drop-shadow-[0_0_10px_rgba(59,130,246,0.9)] animate-pulse" />
                    {signalScan && <Radio className="absolute w-5 h-5 text-blue-300/60 animate-ping" />}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    {signalScan
                      ? (t("missions_scan") || "SCANNING FOR SIGNAL...")
                      : (t("missions_empty") || "NO ACTIVE MISSIONS")}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {missions.map((m) => {
                      const owner = missionOwner(m);
                      const vfxOn =
                        owner && (owner.vfxSettings?.showOnOngoing !== false);
                      const bgPoster = vfxOn
                        ? resolveLobbyBannerBg(m, owner, owner?.activeVfx)
                        : null;
                      const totalRuns = m.selectedDungeons
                        ? (Object.values(m.selectedDungeons) as number[]).reduce((a, b) => a + b, 0)
                        : m.runsCount || 1;
                      const shown = (m.accepted || []).length
                      const open = Math.max(0, 4 - shown);
                      return (
                        <motion.div
                          key={String(m.id)}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.01 }}
                          className="tn-light relative w-full min-h-[104px] rounded-2xl border border-cyan-500/20 overflow-hidden flex flex-col justify-center px-4 py-3 cursor-default group shadow-[0_4px_20px_rgba(34,211,238,0.05)] hover:border-cyan-400/40 transition-all"
                        >
                          {bgPoster && (
                            <div className="absolute inset-0 z-0">
                              <img src={bgPoster} alt="" className="w-full h-full object-cover opacity-55" loading="lazy" decoding="async" />
                              <div className="absolute inset-0 bg-gradient-to-b from-[#050814]/75 via-[#050814]/55 to-[#050814]/80" />
                            </div>
                          )}

                          <div className="relative z-10 flex items-start justify-between gap-2">
                            <p className="text-base font-black uppercase tracking-tight leading-none text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">
                              {m.category === "leveling" ? (
                                <>
                                  <span className="text-[9px] font-black text-cyan-300/90 align-middle mr-1">Leveling</span>
                                  <span className="text-[#00ffff]">{m.startLevel || "1"}-{m.endLevel || "80"}</span>
                                </>
                              ) : (
                                <>
                                  <span className="mr-1 text-[#00ffff]">{totalRuns}x</span> RUN
                                </>
                              )}
                            </p>
                            <span className="shrink-0 px-2 py-1 rounded-full text-[7px] font-black uppercase tracking-widest border border-cyan-500/30 bg-black/50 text-cyan-300">
                              {m.status === "in_progress" ? "ACTIVE" : m.status === "payment_pending" ? "PAYMENT PENDING" : "RUNNING"}
                            </span>
                          </div>

                          <div className="relative z-10 mt-2.5 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                              {m.serverRegion && (
                                <span className="px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-300">
                                  {String(m.serverRegion).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[7px] font-black text-slate-400 uppercase tracking-[0.15em] mr-0.5">Squad {shown}/4</span>
                              <div className="flex -space-x-1">
                                {(m.accepted || []).slice(0, 4).map((a: any, i: number) => (
                                  <div key={i} className="w-5 h-5 rounded-md border border-white/15 bg-black/70 flex items-center justify-center overflow-hidden">
                                    <img src={roleIconUrl(a.role || "dps")} width={16} height={16} className="w-4 h-4 object-contain" alt="" />
                                  </div>
                                ))}
                                {Array.from({ length: Math.max(0, open) }).map((_, i) => (
                                  <div key={i} className="w-5 h-5 rounded-md border border-dashed border-white/15 bg-black/40" />
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </aside>

        </div>
      </main>

      {/* ── APPLY TO OFFER MODAL ── */}
      <AnimatePresence>
        {applyTarget && (
          <motion.div
            key="apply-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => !applyingId && setApplyTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="tn-light relative w-full max-w-md rounded-3xl border border-cyan-500/25 bg-[#0a0f26]/95 p-6 shadow-[0_0_60px_rgba(0,229,255,0.18)]"
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />

              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.24em] text-cyan-300">Signal Request</p>
                  <h3 className="mt-1 text-base font-black uppercase tracking-wide text-white truncate">
                    {applyTarget.title || `${applyTarget.runsCount || 1}× Boost`}
                  </h3>
                </div>
                <button
                  onClick={() => !applyingId && setApplyTarget(null)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-gray-400 transition-all hover:border-white/25 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="mt-4 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Your class</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {AION2_CLASSES.map((c) => {
                  const isActive = applyAionClass === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setApplyAionClass(c)}
                      className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-all ${isActive ? "border-cyan-400/60 bg-cyan-500/15 shadow-[0_0_16px_rgba(0,229,255,0.15)]" : "border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.05]"}`}
                    >
                      <span className={`text-xs font-black tracking-wide ${isActive ? "text-cyan-200" : "text-gray-200"}`}>{c}</span>
                      <span className={`text-[8px] font-black tracking-widest ${isActive ? "text-cyan-300" : "text-gray-500"}`}>
                        {AION2_ROLE_LABEL[aionClassRole(c)] || aionClassRole(c).toUpperCase()}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Level</p>
                  <input
                    type="number"
                    min={1}
                    max={AION2_LEVEL_MAX}
                    value={applyLevel}
                    onChange={(e) => setApplyLevel(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm font-black text-white outline-none transition-all focus:border-cyan-400/50"
                  />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Note (optional)</p>
                  <input
                    type="text"
                    maxLength={200}
                    value={applyNote}
                    onChange={(e) => setApplyNote(e.target.value)}
                    placeholder="Gear, availability..."
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-gray-200 outline-none transition-all focus:border-cyan-400/50"
                  />
                </div>
              </div>

              {applyError && (
                <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-widest text-red-400">{applyError}</p>
              )}

              <div className="mt-5 flex items-center gap-2">
                <button
                  onClick={submitApply}
                  disabled={!applyAionClass || applyingId}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#074f7b] to-[#41389f] px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:from-[#08a3c4] hover:to-[#5b4ddb] disabled:opacity-50"
                >
                  <Swords className="w-3.5 h-3.5" /> {applyingId ? "Submitting..." : "Send Application"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
