"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  Shield, Sparkles, Swords, Users, Search,
  Trash2, Check, Layers, X, UserPlus, UserCheck, UserMinus, MessageCircle, Ban, History as HistoryIcon,
  Bell, BellOff, Palette, Loader2
} from "lucide-react";
import { useI18n } from "@/i18n/i18n";
import { useFlag } from "@/lib/siteFlags";
import { useRouter } from "next/navigation";
import { resolveHeroBg, heroBgStyle, type HeroBgKey } from "@/lib/heroBg";
import { offerBannerBgStyle, OFFER_BANNER_BG_DEFAULT } from "@/lib/offerBannerBg";
import RankBadge from "@/components/RankBadge";
import { resolveOfferBannerImage, resolveVfxBannerUrl, resolveVfxSrc, type VfxEntry } from "@/lib/vfxAssets";
import { getOwnerOngoingMissions, getJoinedOngoingMissions, isLobbyListedInPublicFeed } from "@/lib/lobbyLifecycle";
import { classThumbUrl } from "@/lib/classThumb";
import { AION2_CLASSES, AION2_ROLE_LABEL, aionClassRole, AION2_LEVEL_MAX } from "@/lib/aionClassMeta";
import { effectiveAvatarEffect } from "@/lib/userProfile";
import { toNameStyle, nameGlowColor } from "@/components/GradientColorPicker";
import AionAutoApplyModal from "@/components/modals/AionAutoApplyModal";
import type { AionAutoApply } from "@/components/modals/AionAutoApplyModal";
import { resolveProfileBanner, resolveProfileImage, resolveProfileDisplayName, resolveNameColor, isAnimatedImageUrl, profileImgClass } from "@/lib/profileImage";

const FILTER_TABS = [
  { label: "ALL", key: "All", icon: Layers },
  { label: "DUNGEONS", key: "Dungeons", icon: Shield },
  { label: "RAIDS", key: "Raids", icon: Swords },
  { label: "LEVELING", key: "Leveling", icon: Sparkles },
  { label: "PVP", key: "PVP", icon: Swords },
];

const REGION_TABS = [
  { label: "ALL", key: "All", flag: "" },
  { label: "EU", key: "EU", flag: "/flags/eu.svg" },
  { label: "NA EAST", key: "NA (EAST)", flag: "/flags/us.svg" },
  { label: "NA WEST", key: "NA (WEST)", flag: "/flags/us.svg" },
];

const OFFER_NOTIFICATION_CATEGORIES = ["dungeon", "raid", "leveling", "pvp"] as const;
type OfferNotificationCategory = (typeof OFFER_NOTIFICATION_CATEGORIES)[number];
type OfferNotificationSettings = { mutedAll: boolean; mutedCategories: OfferNotificationCategory[] };
const DEFAULT_OFFER_NOTIFICATION_SETTINGS: OfferNotificationSettings = { mutedAll: false, mutedCategories: [] };

function normalizeOfferCategory(category: unknown): OfferNotificationCategory {
  const value = String(category || "dungeon").toLowerCase();
  if (value === "raids") return "raid";
  return OFFER_NOTIFICATION_CATEGORIES.includes(value as OfferNotificationCategory) ? value as OfferNotificationCategory : "dungeon";
}

export default function Aion2TestClubPage({ initialHeroBg }: { initialHeroBg?: string }) {
  const { t } = useI18n();
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("All");
  const [regionTab, setRegionTab] = useState("All");
  const motionOn = useFlag("uplink_bg_motion", true);
  const [heroBg, setHeroBg] = useState<HeroBgKey>(() => resolveHeroBg(initialHeroBg));
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
  const [bgEditOfferId, setBgEditOfferId] = useState<string | null>(null);
  const [bgSavingOfferId, setBgSavingOfferId] = useState<string | null>(null);
  const [bgError, setBgError] = useState("");
  const autoAttemptedRef = useRef<Set<string>>(new Set());
  const [hoveredUserId, setHoveredUserId] = useState<string | null>(null);
  const [hoverCard, setHoverCard] = useState<{ userId: string; rect: { top: number; left: number; bottom: number } | null; owner: any; pic: string | null } | null>(null);
  const hoverHideTimer = useRef<number | null>(null);
  const scheduleHide = () => { if (hoverHideTimer.current) window.clearTimeout(hoverHideTimer.current); hoverHideTimer.current = window.setTimeout(() => { setHoveredUserId(null); setHoverCard(null); }, 250); };
  const cancelHide = () => { if (hoverHideTimer.current) window.clearTimeout(hoverHideTimer.current); hoverHideTimer.current = null; };
  const [friends, setFriends] = useState<any[]>([]);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [offerNotificationSettings, setOfferNotificationSettings] = useState<OfferNotificationSettings>(DEFAULT_OFFER_NOTIFICATION_SETTINGS);
  const knownOfferIdsRef = useRef<Set<string> | null>(null);
  const muteButtonRef = useRef<HTMLButtonElement>(null);
  const meId = String((session?.user as any)?.id || "");
  const meName = String((session?.user as any)?.name || "Operative");

  useEffect(() => {
    const me = registeredUsers.find((u: any) => String(u.id) === meId);
    const saved = me?.offerNotificationSettings;
    if (!saved || typeof saved !== "object") { setOfferNotificationSettings(DEFAULT_OFFER_NOTIFICATION_SETTINGS); return; }
    setOfferNotificationSettings({ mutedAll: saved.mutedAll === true, mutedCategories: Array.isArray(saved.mutedCategories) ? saved.mutedCategories.filter((c: unknown): c is OfferNotificationCategory => OFFER_NOTIFICATION_CATEGORIES.includes(String(c).toLowerCase() as OfferNotificationCategory)).map((c: unknown) => normalizeOfferCategory(c)) : [] });
  }, [registeredUsers, meId]);

  const saveOfferNotificationSettings = async (next: OfferNotificationSettings) => {
    if (!meId) return;
    setOfferNotificationSettings(next);
    try { await fetch("/api/users/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile: { id: meId, offerNotificationSettings: next } }) }); } catch {}
  };

  const toggleOfferCategoryMute = (category: OfferNotificationCategory) => {
    const mutedCategories = offerNotificationSettings.mutedCategories.includes(category) ? offerNotificationSettings.mutedCategories.filter((v) => v !== category) : [...offerNotificationSettings.mutedCategories, category];
    void saveOfferNotificationSettings({ ...offerNotificationSettings, mutedCategories });
  };

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch("/api/public-data").then((r) => r.json()).then((d) => {
        if (cancelled) return;
        if (d.registeredUsers) setRegisteredUsers(d.registeredUsers);
        if (d.friends) setFriends(d.friends);
        if (d.lobbies) setLobbies(d.lobbies);
        setSignalScan(false);
      }).catch(() => { if (!cancelled) setSignalScan(false); });
    };
    load();
    window.addEventListener("focus", load);
    window.addEventListener("data-refresh", load);
    const poll = setInterval(load, 30000);
    return () => { cancelled = true; window.removeEventListener("focus", load); window.removeEventListener("data-refresh", load); clearInterval(poll); };
  }, []);

  const lobbyOwner = (l: any) => registeredUsers.find((u: any) => String(u.id) === String(l.ownerId)) || null;
  const ownerPic = (l: any) => { const o = lobbyOwner(l); return String(o?.profileGif || o?.customAvatar || o?.avatar || l.ownerImage || ""); };
  const ownerName = (l: any) => { const o = lobbyOwner(l); return String(o?.displayName || o?.name || o?.username || l.ownerDiscordName || l.serviceName || "Operative"); };
  const openRolesOf = (l: any) => { const roles = l?.roles || {}; return Object.entries(roles).filter(([, n]) => Number(n) > 0).map(([role, n]) => ({ role, n: Number(n) })); };
  const classSlotsOf = (l: any) => { const req = l?.requiredClasses; if (Array.isArray(req)) { const acceptedClasses = new Set((l?.accepted || []).map((a: any) => String(a.aionClass || a.className || a.role || "").trim().toLowerCase())); return req.map((cls: string) => ({ cls, filled: acceptedClasses.has(String(cls).trim().toLowerCase()) })); } return null; };
  const offerBgOf = (l: any) => { const o = lobbyOwner(l); return resolveOfferBannerImage(l, o); };
  const alreadyApplied = (l: any) => meId && ((l.applicants || []).some((a: any) => String(a.applicantId || a.userId || a.id) === meId) || appliedIds.has(String(l.id)));

  const OPEN_TAB_CATEGORIES: Record<string, string[] | null> = { All: null, Dungeons: ["dungeon", "dungeons"], Raids: ["raid", "raids"], Leveling: ["leveling"], PVP: ["pvp"] };

  const displayOffers = useMemo(() => {
    const cats = OPEN_TAB_CATEGORIES[activeTab] ?? null;
    return lobbies.filter(isLobbyListedInPublicFeed).filter((l) => cats === null || cats.includes(String(l.category || ""))).filter((l) => regionTab === "All" || String(l.serverRegion || "") === regionTab).sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
  }, [lobbies, activeTab, regionTab]);

  useEffect(() => {
    if (!meId) { setIsAdmin(false); return; }
    let cancelled = false;
    fetch("/api/users/me", { credentials: "include" }).then((r) => (r.ok ? r.json() : null)).then((d) => { if (!cancelled) setIsAdmin(d?.role === "admin"); }).catch(() => {});
    return () => { cancelled = true; };
  }, [meId]);

  const applyOfferBg = async (offerId: string, bg: string) => {
    setBgSavingOfferId(offerId); setBgError("");
    try {
      const res = await fetch("/api/lobbies", { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ lobbyId: offerId, customBg: bg }) });
      if (res.ok) { setLobbies((prev) => prev.map((l: any) => (String(l.id) === offerId ? { ...l, customBg: bg } : l))); setBgEditOfferId(null); } else { const d: any = await res.json().catch(() => ({})); setBgError(d?.error || "Could not update banner"); }
    } catch { setBgError("Network error"); } finally { setBgSavingOfferId(null); }
  };

  const deleteOffer = async (l: any) => {
    if (!meId || deletingId) return;
    setDeletingId(String(l.id)); setDeleteError("");
    try {
      const res = await fetch("/api/lobbies/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lobbyId: l.id }) });
      if (res.ok) { setLobbies((prev) => prev.filter((x: any) => String(x.id) !== String(l.id))); setConfirmId(null); window.dispatchEvent(new Event("data-refresh")); } else { const d = await res.json().catch(() => ({})); setDeleteError(d.error || "Could not delete"); }
    } catch { setDeleteError("Network error"); } finally { setDeletingId(null); }
  };

  const submitApply = async () => {
    const l = applyTarget;
    if (!meId || !l || applyingId) return;
    if (!applyAionClass) { setApplyError("Pick your class first"); return; }
    setApplyingId(String(l.id)); setApplyError("");
    try {
      const res = await fetch("/api/lobbies/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lobbyId: l.id, applicant: { id: `${meId}-main`, role: aionClassRole(applyAionClass), className: applyAionClass, aionClass: applyAionClass, level: Number(applyLevel) || 1, applicantNote: applyNote, applicantName: meName } }) });
      if (res.ok) { setAppliedIds((prev) => new Set([...prev, String(l.id)])); setApplyTarget(null); setApplyAionClass(""); setApplyNote(""); setApplyLevel("60"); window.dispatchEvent(new Event("data-refresh")); } else { const d = await res.json().catch(() => ({})); setApplyError(d.error || "Could not apply"); }
    } catch { setApplyError("Network error"); } finally { setApplyingId(null); }
  };

  const offerBgStyle = offerBannerBgStyle(OFFER_BANNER_BG_DEFAULT);

  return (
    <div className="min-h-screen bg-[#050814] text-slate-200 font-sans selection:bg-blue-500/30 overflow-x-clip relative">
      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {heroBg === "scenic" ? (<><div className="absolute inset-0 bg-contain bg-top bg-no-repeat" style={{ backgroundImage: `url('/AION2.png')`, WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 46%, rgba(0,0,0,0.5) 62%, rgba(0,0,0,0.18) 76%, transparent 90%)", maskImage: "linear-gradient(to bottom, black 0%, black 46%, rgba(0,0,0,0.5) 62%, rgba(0,0,0,0.18) 76%, transparent 90%)" }} /><div className="absolute inset-0 bg-[#050814]/40 mix-blend-multiply" /></>) : (<div className="absolute inset-0" style={heroBgStyle(heroBg)} />)}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050814]/12 via-[#050814]/35 to-[#050814]/95" />
        <div className="absolute inset-x-0 top-0 h-[230vh] bg-[linear-gradient(to_bottom,transparent_0%,rgba(5,8,20,0.3)_70vh,rgba(5,8,20,0.75)_120vh,rgba(5,8,20,0.97)_175vh,#050814_215vh)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(5,8,20,0.8)_100%)]" />
        <div className="aion-dotnet absolute inset-0 opacity-[0.10]" />
      </div>

      {/* Hero */}
      <section className="tn-hero relative w-full min-h-[620px] flex items-center justify-center py-12 px-4">
        <div className="relative z-10 flex flex-col items-center text-center mt-6 px-8 sm:px-14 py-10 max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="flex flex-col items-center">
            <div className="flex items-center gap-6 mt-1"><span className="h-px w-16 bg-gradient-to-r from-transparent to-blue-400/60" /><h2 className="text-sm sm:text-base font-bold tracking-[0.4em] text-blue-100 uppercase drop-shadow-[0_0_12px_rgba(56,189,248,0.6)]">{t("hero_crew") || "FIND YOUR CREW"}</h2><span className="h-px w-16 bg-gradient-to-l from-transparent to-blue-400/60" /></div>
            <p className="mt-2 text-xs text-slate-400 font-medium max-w-md">{t("hero_adventure") || "Find trusted players for your next adventure."}</p>
            <div className="w-[1px] h-8 bg-gradient-to-b from-purple-500/60 to-transparent my-4" />
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, duration: 0.5 }}>
            <motion.a href="/create-offer" className="relative group overflow-hidden rounded-full p-[1px] shadow-[0_0_35px_rgba(59,130,246,0.25)] hover:shadow-[0_0_55px_rgba(168,85,247,0.45)] transition-all duration-500 block hover:scale-105 active:scale-95">
              <span className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]" />
              <div className="relative bg-transparent px-16 py-4 rounded-full flex items-center justify-center gap-4 border border-white/12 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] transition-all"><span className="text-xs font-black tracking-[0.3em] uppercase text-white drop-shadow-[0_0_8px_rgba(0,0,0,0.4)]">{t("hero_create") || "CREATE YOUR OFFER"}</span><span className="text-blue-300 group-hover:translate-x-1 transition-transform font-bold">›</span></div>
            </motion.a>
          </motion.div>
        </div>
      </section>

      {/* Main */}
      <main className="max-w-[1600px] mx-auto px-6 pb-32 relative z-20">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-8">
          <section className="min-w-0">
            {/* Filters */}
            <div className="relative z-30 mb-6 flex max-w-full items-center gap-2">
              <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto rounded-full border border-blue-900/40 bg-[#0a0f26]/70 p-1.5 pr-2 backdrop-blur-md shadow-[0_4px_24px_rgba(34,211,238,0.06)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {FILTER_TABS.map((tab) => { const isActive = activeTab === tab.key; const Icon = tab.icon; return (<button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black tracking-[0.18em] transition-all duration-300 shrink-0 ${isActive ? 'bg-[#151c3d] text-white shadow-[inset_0_0_20px_rgba(59,130,246,0.2)] border border-blue-500/40' : 'text-slate-400 hover:text-white border border-transparent hover:bg-white/5'}`}><Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} /><span>{tab.label}</span></button>); })}
                <div className="mx-1 h-6 w-px shrink-0 bg-white/15" />
                {REGION_TABS.map((rtab) => { const isActive = regionTab === rtab.key; return (<button key={rtab.key} onClick={() => setRegionTab(rtab.key)} className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black tracking-[0.18em] transition-all duration-300 shrink-0 ${isActive ? 'bg-[#0c132a] text-cyan-300 shadow-[inset_0_0_20px_rgba(34,211,238,0.15)] border border-cyan-500/40' : 'text-slate-400 hover:text-white border border-transparent hover:bg-white/5'}`}>{rtab.flag ? (<img src={rtab.flag} alt="" className="w-4 h-4 rounded-sm object-cover" loading="lazy" decoding="async" />) : (<span className="w-4 h-4 rounded-sm bg-cyan-400/15 border border-cyan-400/30" />)}<span>{rtab.label}</span></button>); })}
              </div>
              {meId && (<div className="ml-auto shrink-0"><button ref={muteButtonRef} type="button" onClick={() => setShowNotificationSettings((o) => !o)} className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all ${offerNotificationSettings.mutedAll ? "border-red-500/40 bg-red-500/15 text-red-300" : "border-cyan-500/30 bg-[#0a0f26]/80 text-cyan-200 hover:border-cyan-300/60 hover:bg-cyan-500/10"}`}>{offerNotificationSettings.mutedAll ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}</button></div>)}
            </div>

            {/* Offers */}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {displayOffers.map((offer) => {
                  const owner = lobbyOwner(offer);
                  const pic = ownerPic(offer);
                  const isMine = String(offer.ownerId) === meId;
                  const offerBg = offerBgOf(offer);
                  const openRoles = openRolesOf(offer);
                  const classSlots = classSlotsOf(offer);
                  const applied = alreadyApplied(offer);
                  return (
                    <motion.div key={`${offer.id}-${offer.createdAt || ""}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} whileHover={{ scale: 1.005 }} onDoubleClick={(e) => { if (isMine || isAdmin) { e.stopPropagation(); setBgEditOfferId(String(offer.id)); setBgError(""); } }} className="tn-light relative w-full min-h-[110px] rounded-2xl bg-white/[0.04] border border-cyan-500/20 flex items-center justify-between gap-3 pr-2 pl-3 py-3 group shadow-[0_4px_24px_rgba(34,211,238,0.08)] hover:shadow-[0_0_32px_rgba(34,211,238,0.15)] transition-all">
                      {/* Banner BG */}
                      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none"><div className="absolute inset-0 bg-[#070b1a]" /><div className="absolute right-0 top-0 bottom-0 w-[640px] max-w-[50%]"><div className="absolute inset-0" style={offerBgStyle} />{offerBg && <img src={offerBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" loading="lazy" decoding="async" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />}<div className="absolute inset-0 bg-gradient-to-r from-[#070b1a] via-[#070b1a]/70 to-transparent" /></div></div>

                      {/* Left: Avatar + Details */}
                      <div className="relative z-10 flex items-center gap-3 flex-shrink-0">
                        {/* Avatar */}
                        <div className={`flex-shrink-0 ${hoveredUserId === String(owner?.id || "") ? "z-40" : ""}`}>
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#050814]/80 border-2 border-cyan-400/40 flex items-center justify-center overflow-hidden shadow-[0_0_18px_rgba(59,130,246,0.25)] group-hover:border-cyan-300/70 transition-colors cursor-pointer" onMouseEnter={(e) => { cancelHide(); if (!owner?.id) return; const r = e.currentTarget.getBoundingClientRect(); setHoveredUserId(String(owner.id)); setHoverCard({ userId: String(owner.id), rect: { top: r.top, left: r.left, bottom: r.bottom }, owner, pic }); }} onMouseLeave={scheduleHide}>
                            {pic ? (<img src={pic} alt="" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />) : (<Users className="w-6 h-6 text-cyan-400/70" />)}
                          </div>
                          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0a0f26]" />
                        </div>

                        {/* Offer Details */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-black tracking-widest text-white uppercase truncate">{offer.title || `${offer.runsCount || 1}× Boost`}</h4>
                            {offer.serverRegion && (<span className="px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[9px] font-black tracking-widest text-violet-300">{String(offer.serverRegion).toUpperCase()}</span>)}
                          </div>
                          {Number(offer.pricePerRun) > 0 && (
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] font-black text-amber-300">Total: {(Number(offer.pricePerRun) * (offer.runsCount || 1)).toFixed(2)}M</span>
                              <span className="text-[9px] font-bold text-amber-200/80">{Number(offer.pricePerRun).toFixed(2)}M per run</span>
                            </div>
                          )}
                          {!classSlots && openRoles.length > 0 && (<span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mt-1"><Users className="w-3.5 h-3.5 text-cyan-400" />{`OPEN: ${openRoles.map((r) => `${r.n} ${r.role.toUpperCase()}`).join(" · ")}`}</span>)}
                        </div>
                      </div>

                      {/* Center: Class Images (absolutely centered) */}
                      {classSlots && classSlots.length > 0 && (
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center gap-2">
                          {classSlots.map((s, i) => (
                            <div key={i} className="relative">
                              <img src={classThumbUrl(s.cls)} alt={s.cls} width={64} height={64} className={`w-16 h-16 object-contain drop-shadow-[0_4px_16px_rgba(34,211,238,0.6)] ${s.filled ? 'brightness-125 saturate-150' : 'brightness-100 saturate-100'}`} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                              {s.filled && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#070b1a]" />}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Right: Actions */}
                      <div className="relative z-10 flex-shrink-0 sm:pl-2 flex flex-col gap-1.5 min-w-[150px]">
                        {applied ? (
                          <span className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-emerald-500/40 bg-[#050814]/85 text-emerald-300 text-[9px] font-black uppercase tracking-widest backdrop-blur-md"><Check className="w-3 h-3" /> Applied</span>
                        ) : (
                          <button onClick={() => { setApplyTarget(offer); setApplyError(""); }} disabled={!meId || applyingId === String(offer.id)} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#074f7b] to-[#41389f] text-white text-[9px] font-black uppercase tracking-widest hover:from-[#08a3c4] hover:to-[#5b4ddb] transition-all shadow-[0_0_18px_rgba(0,180,255,0.25)] disabled:opacity-50 flex items-center justify-center gap-1.5 border border-white/[0.08]"><Swords className="w-3 h-3" /> {applyingId === String(offer.id) ? "Applying..." : "Apply"}</button>
                        )}
                        {(isMine || isAdmin) && (
                          confirmId === String(offer.id) ? (
                            <button onClick={() => deleteOffer(offer)} disabled={deletingId === String(offer.id)} className="px-4 py-2 rounded-lg border border-red-500/40 bg-red-600/20 text-red-300 text-[9px] font-black uppercase tracking-widest hover:bg-red-600/25 transition-all disabled:opacity-50 backdrop-blur-md">{deletingId === String(offer.id) ? "Deleting..." : "Confirm Delete?"}</button>
                          ) : (
                            <button onClick={() => { setConfirmId(String(offer.id)); setDeleteError(""); window.setTimeout(() => setConfirmId((c) => (c === String(offer.id) ? null : c)), 4000); }} className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-white/15 bg-[#050814]/80 text-gray-300 text-[9px] font-black uppercase tracking-widest hover:border-red-500/40 hover:text-red-300 hover:bg-red-600/15 hover:backdrop-blur-xl transition-all backdrop-blur-md"><Trash2 className="w-3 h-3" /> Delete</button>
                          )
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {displayOffers.length === 0 && (<div className="tn-light text-center py-16 bg-[#0a0f26]/40 border border-blue-900/30 rounded-[2rem]"><Search className="w-8 h-8 text-slate-600 mx-auto mb-3" /><p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{t("offers_empty") || "No offers in this category"}</p></div>)}
              {applyError && (<p className="text-center text-[10px] font-bold uppercase tracking-widest text-red-400">{applyError}</p>)}
              {deleteError && (<p className="text-center text-[10px] font-bold uppercase tracking-widest text-red-400">{deleteError}</p>)}
            </div>
          </section>

          {/* Sidebar */}
          <aside className="w-full">
            <div className="tn-light relative w-full min-h-[360px] h-full flex flex-col rounded-3xl bg-white/[0.05] backdrop-blur-3xl border border-cyan-500/20 p-4 shadow-[0_8px_32px_rgba(34,211,238,0.05)] transition-all">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-blue-900/30">
                <h3 className="text-xs font-black tracking-[0.2em] uppercase text-blue-100">{t("missions_header") || "ONGOING MISSIONS"}</h3>
                {meId ? (<span className="flex items-center gap-1.5">{signalScan ? (<span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />) : (<span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />)}<span className="text-[8px] font-black tracking-widest text-slate-500 uppercase">{signalScan ? (t("missions_scan") || "SCANNING") : "LIVE"}</span></span>) : null}
              </div>
              <div className="flex-1 flex flex-col items-center justify-center text-center py-6"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{signalScan ? (t("missions_scan") || "SCANNING FOR SIGNAL...") : (t("missions_empty") || "NO ACTIVE MISSIONS")}</p></div>
            </div>
          </aside>
        </div>
      </main>

      {/* Apply Modal */}
      <AnimatePresence>
        {applyTarget && (
          <motion.div key="apply-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => !applyingId && setApplyTarget(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }} transition={{ duration: 0.2 }} onClick={(e) => e.stopPropagation()} className="tn-light relative w-full max-w-lg rounded-3xl border border-cyan-500/25 bg-[#0a0f26]/95 p-6 shadow-[0_0_60px_rgba(0,229,255,0.18)]">
              <div className="flex items-start justify-between gap-3 mb-4">
                <h3 className="text-base font-black uppercase tracking-widest text-white">Apply to Offer</h3>
                <button onClick={() => !applyingId && setApplyTarget(null)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-gray-400 hover:text-white"><X className="h-4 w-4" /></button>
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Your class</p>
              <div className="grid grid-cols-2 gap-2">{AION2_CLASSES.map((c) => { const isActive = applyAionClass === c; return (<button key={c} type="button" onClick={() => setApplyAionClass(c)} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all ${isActive ? "border-cyan-400/60 bg-cyan-500/15" : "border-white/10 bg-white/[0.02] hover:border-white/25"}`}><img src={`/classes/${c === "Spiritmaster" ? "Elementalist" : c}.png`} alt="" className="h-6 w-6 object-contain" onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }} /><span className={`text-xs font-black ${isActive ? "text-cyan-200" : "text-gray-200"}`}>{c}</span></button>); })}</div>
              <div className="mt-4"><p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Item Level</p><div className="flex items-center gap-3"><button type="button" onClick={() => setApplyLevel(String(Math.min(AION2_LEVEL_MAX, Math.max(1, (Number(applyLevel) || 1) - 1))))} className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-lg font-black text-gray-300">−</button><input type="number" min={1} max={AION2_LEVEL_MAX} value={applyLevel} onChange={(e) => setApplyLevel(e.target.value)} className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-center text-sm font-black text-white outline-none" /><button type="button" onClick={() => setApplyLevel(String(Math.min(AION2_LEVEL_MAX, Math.max(1, (Number(applyLevel) || 1) + 1))))} className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-lg font-black text-gray-300">+</button></div></div>
              <div className="mt-4"><p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Note</p><input type="text" maxLength={200} value={applyNote} onChange={(e) => setApplyNote(e.target.value)} placeholder="Gear, availability..." className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-gray-200 outline-none" /></div>
              {applyError && (<p className="mt-3 text-center text-[10px] font-bold uppercase tracking-widest text-red-400">{applyError}</p>)}
              <button onClick={submitApply} disabled={!applyAionClass || applyingId} className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#074f7b] to-[#41389f] px-5 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50"><Swords className="w-3.5 h-3.5" /> {applyingId ? "Submitting..." : "Send Application"}</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BG Picker Modal */}
      {bgEditOfferId && (() => {
        const edOffer = lobbies.find((l: any) => String(l.id) === bgEditOfferId) || null;
        const edOwner = edOffer ? lobbyOwner(edOffer) : null;
        const edThumbs: Array<{ src: string; thumb: string }> = (Array.isArray(edOwner?.userVfx) ? (edOwner.userVfx as VfxEntry[]) : []).map((e) => ({ src: resolveVfxSrc(e), thumb: resolveVfxBannerUrl(e) })).filter((t) => Boolean(t.src) && Boolean(t.thumb));
        return (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0a0f26] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.7)]">
              <div className="flex items-center justify-between gap-2 mb-4"><div className="flex items-center gap-2"><Palette className="h-4 w-4 text-[#ff007f]" /><h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-100">Banner Background</h3></div><button onClick={() => setBgEditOfferId(null)} className="text-white/50 hover:text-white"><X className="h-4 w-4" /></button></div>
              <button onClick={() => applyOfferBg(bgEditOfferId!, "")} disabled={bgSavingOfferId === bgEditOfferId} className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:border-white/25"><p className="text-[10px] font-black uppercase tracking-widest text-white/90">Default</p></button>
              <p className="mt-4 mb-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">My backgrounds</p>
              {edThumbs.length === 0 ? (<p className="rounded-2xl border border-white/5 bg-white/[0.02] px-3 py-4 text-center text-[9px] text-white/40">No custom backgrounds yet</p>) : (
                <div className="grid grid-cols-3 gap-2 max-h-[38vh] overflow-y-auto pr-1">{edThumbs.map((t) => (<button key={t.src} onClick={() => applyOfferBg(bgEditOfferId!, t.src)} disabled={bgSavingOfferId === bgEditOfferId} className="relative aspect-video overflow-hidden rounded-xl border-2 border-white/10 hover:border-white/30"><img src={t.thumb} alt="" className="h-full w-full object-cover" /></button>))}</div>
              )}
              {bgError && (<p className="mt-3 text-center text-[9px] font-black uppercase tracking-widest text-red-400">{bgError}</p>)}
            </div>
          </div>
        );
      })()}

      <AionAutoApplyModal registeredUsers={registeredUsers} meId={meId} meName={meName || ""} onSave={async () => {}} />
    </div>
  );
}
