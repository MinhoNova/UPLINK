"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  Shield, Sparkles, Swords, Users, Search,
  Trash2, Layers, X, UserPlus, UserCheck, UserMinus, MessageCircle, Ban, History as HistoryIcon,
  Bell, BellOff, Palette, BadgeCheck, Star, ExternalLink, IdCard, Clock
} from "lucide-react";
import SquadReviewModal from "@/components/SquadReviewModal";
import { useI18n } from "@/i18n/i18n";
import { useFlag } from "@/lib/siteFlags";
import { useRouter } from "next/navigation";
import { resolveHeroBg, heroBgStyle, type HeroBgKey } from "@/lib/heroBg";
import { offerBannerBgStyle, OFFER_BANNER_BG_DEFAULT } from "@/lib/offerBannerBg";
import RankBadge from "@/components/RankBadge";
import { resolveOfferBannerImage, resolveVfxBannerUrl, resolveVfxSrc, type VfxEntry } from "@/lib/vfxAssets";
import { getOwnerOngoingMissions, getJoinedOngoingMissions, isLobbyListedInPublicFeed, isRemovedDungeonOffer, userCanViewOfferThread } from "@/lib/lobbyLifecycle";
import { classThumbUrl } from "@/lib/classThumb";
import CharacterPortraitBadge from "@/components/aion2/CharacterPortraitBadge";
import { AION2_ROLE_LABEL, aionClassRole, AION2_LEVEL_MAX } from "@/lib/aionClassMeta";
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
];

const REGION_TABS = [
  { label: "ALL", key: "All", flag: "" },
  { label: "EU", key: "EU", flag: "/flags/eu.svg" },
  { label: "NA EAST", key: "NA (EAST)", flag: "/flags/us.svg" },
  { label: "NA WEST", key: "NA (WEST)", flag: "/flags/us.svg" },
];
const OFFER_NOTIFICATION_CATEGORIES = ["dungeon", "raid", "leveling"] as const;
type OfferNotificationCategory = (typeof OFFER_NOTIFICATION_CATEGORIES)[number];
type OfferNotificationSettings = { mutedAll: boolean; mutedCategories: OfferNotificationCategory[] };
const DEFAULT_OFFER_NOTIFICATION_SETTINGS: OfferNotificationSettings = { mutedAll: false, mutedCategories: [] };

function normalizeOfferCategory(category: unknown): OfferNotificationCategory {
  const value = String(category || "dungeon").toLowerCase();
  if (value === "raids") return "raid";
  return OFFER_NOTIFICATION_CATEGORIES.includes(value as OfferNotificationCategory) ? value as OfferNotificationCategory : "dungeon";
}

export default function LobbyPage({ initialHeroBg }: { initialHeroBg?: string }) {
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
  const [cancellingApplyId, setCancellingApplyId] = useState<string | null>(null);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [unfriendHover, setUnfriendHover] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [applyTarget, setApplyTarget] = useState<any>(null);
  const [applyAionClass, setApplyAionClass] = useState("");
  const [applyLevel, setApplyLevel] = useState("60");
  const [applyCp, setApplyCp] = useState("");
  const [applyNote, setApplyNote] = useState("");
  const [autoAccept, setAutoAccept] = useState(false);
  const [applySelCharId, setApplySelCharId] = useState("");
  const [applyCharOpen, setApplyCharOpen] = useState(false);
  const [charactersList, setCharactersList] = useState<any[]>([]);
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
  const [reviewOffer, setReviewOffer] = useState<any>(null);
  const hoverHideTimer = useRef<number | null>(null);
  const scheduleHide = () => { if (hoverHideTimer.current) window.clearTimeout(hoverHideTimer.current); hoverHideTimer.current = window.setTimeout(() => { setHoveredUserId(null); setHoverCard(null); }, 250); };
  const cancelHide = () => { if (hoverHideTimer.current) window.clearTimeout(hoverHideTimer.current); hoverHideTimer.current = null; };
  const [friends, setFriends] = useState<any[]>([]);
  const [friendActionMsg, setFriendActionMsg] = useState<string | null>(null);
  const friendMsgTimer = useRef<number | null>(null);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [offerNotificationSettings, setOfferNotificationSettings] = useState<OfferNotificationSettings>(DEFAULT_OFFER_NOTIFICATION_SETTINGS);
  const knownOfferIdsRef = useRef<Set<string> | null>(null);
  const muteButtonRef = useRef<HTMLButtonElement>(null);
  const meId = String((session?.user as any)?.id || "");
  const meName = String((session?.user as any)?.name || "Operative");

  useEffect(() => {
    if (!meId) return;
    fetch("/api/user/auto-apply").then((r) => r.json()).then((d: any) => { if (d && typeof d.autoAccept === "boolean") setAutoAccept(d.autoAccept); }).catch(() => {});
  }, [meId]);
  const filterLabel = (key: string) => ({ All: t("tab_all"), Dungeons: t("tab_dungeons"), Raids: t("tab_raids"), Leveling: t("tab_leveling") }[key] || key);
  const regionLabel = (key: string) => ({ All: t("region_all"), EU: "EU", "NA (EAST)": t("region_naEast"), "NA (WEST)": t("region_naWest") }[key] || key);

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
      fetch("/api/public-data").then((r) => r.json()).then((d: any) => {
        if (cancelled) return;
        if (d.registeredUsers) setRegisteredUsers(d.registeredUsers);
        if (d.lobbies) setLobbies(d.lobbies);
        if (d.characters && Array.isArray(d.characters)) setCharactersList(d.characters);
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

  // ── Ongoing Missions (sidebar with animated banners) ──
  const missions = useMemo(() => {
    if (!meId) return [];
    const seen = new Set<string>();
    const out: any[] = [];
    for (const m of [...getOwnerOngoingMissions(lobbies, meId), ...getJoinedOngoingMissions(lobbies, meId)]) {
      const key = String(m.id);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(m);
    }
    return out.slice(0, 6);
  }, [lobbies, meId]);

  const missionOwner = (m: any) => registeredUsers.find((u: any) => String(u.id) === String(m.ownerId)) || null;

  const unpaidMissions = useMemo(() => missions.filter((m: any) => (m.status || "standby") === "unpaid"), [missions]);
  const activeMissions = useMemo(() => missions.filter((m: any) => (m.status || "standby") !== "unpaid"), [missions]);

  const renderMissionCard = (m: any) => {
    const owner = missionOwner(m);
    const bgPoster = resolveOfferBannerImage(m, owner, "showOnOngoing");
    const totalRuns = m.selectedDungeons ? (Object.values(m.selectedDungeons) as number[]).reduce((a: number, b: number) => a + b, 0) : m.runsCount || 1;
    const shown = (m.accepted || []).length;
    const open = Math.max(0, 4 - shown);
    const isUnpaid = (m.status || "standby") === "unpaid";
    return (
      <motion.div key={String(m.id)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.01 }} onClick={() => { if (userCanViewOfferThread(m, meId) || isAdmin) { router.push(`/manage/${String(m.id)}`); } }} className={`tn-light relative w-full min-h-[110px] rounded-2xl border overflow-hidden flex flex-col justify-center px-3 py-3 cursor-pointer group shadow-[0_4px_20px_rgba(34,211,238,0.05)] hover:shadow-[0_0_24px_rgba(34,211,238,0.12)] transition-all ${isUnpaid ? "border-red-500/30 hover:border-red-400/50" : "border-cyan-500/20 hover:border-cyan-400/40"}`}>
        <div className="absolute inset-0 bg-[#070b1a]" />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0" style={offerBgStyle} />
          {bgPoster && <img src={bgPoster} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" loading="lazy" decoding="async" />}
          <div className="absolute inset-0 bg-gradient-to-r from-[#070b1a] via-[#070b1a]/70 to-transparent" />
        </div>
        <div className="relative z-10 flex items-start justify-between gap-2">
          <p className="text-sm font-black uppercase tracking-tight leading-none text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">
            {m.category === "leveling" ? (<><span className="text-[9px] font-black text-cyan-300/90 align-middle mr-1">{t("mission_leveling")}</span><span className="text-[#00ffff]">{m.startLevel || "1"}-{m.endLevel || "80"}</span></>) : (<><span className="mr-1 text-[#00ffff]">{totalRuns}x</span> {t("mission_run")}</>)}
          </p>
          <div className="shrink-0 flex items-center gap-1.5">
            <span className={`px-2 py-1 rounded-full text-[7px] font-black uppercase tracking-widest border ${isUnpaid ? "border-red-500/40 bg-red-500/15 text-red-300" : m.status === "in_progress" ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300" : m.status === "payment_pending" ? "border-orange-500/40 bg-orange-500/15 text-orange-300" : "border-cyan-500/30 bg-black/50 text-cyan-300"}`}>
              {isUnpaid ? t("mission_unpaid") : m.status === "in_progress" ? t("mission_active") : m.status === "payment_pending" ? t("mission_paymentPending") : t("mission_running")}
            </span>
            <span className="px-2 py-1 rounded-full text-[7px] font-black uppercase tracking-widest border border-cyan-400/40 bg-cyan-500/15 text-cyan-200 group-hover:bg-cyan-500/30 transition-colors">{t("mission_openThread")}</span>
          </div>
        </div>
        <div className="relative z-10 mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            {m.serverRegion && (<span className="px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-300">{String(m.serverRegion).toUpperCase()}</span>)}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[7px] font-black text-slate-400 uppercase tracking-[0.15em] mr-0.5">{t("mission_squad")} {shown}/4</span>
            <div className="flex -space-x-1">
              {(m.accepted || []).slice(0, 4).map((a: any, i: number) => (
                <div key={i} className="w-5 h-5 rounded-md border border-white/15 bg-black/70 flex items-center justify-center overflow-hidden">
                  <img src={classThumbUrl(a.class || a.aionClass || a.role || "dps")} width={16} height={16} className="w-4 h-4 object-contain" alt="" title={a.class || a.aionClass || a.role || "dps"} />
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
  };

  const historyOffers = useMemo(() => {
    if (!meId) return [];
    return (lobbies || []).filter((l: any) => String(l.category || "").toLowerCase() !== "pvp" && !isRemovedDungeonOffer(l) && (l.status === "completed" || l.status === "failed")).sort((a: any, b: any) => (Number(b.completedAt) || Number(b.id) || 0) - (Number(a.completedAt) || Number(a.id) || 0)).slice(0, 20);
  }, [lobbies, meId]);

  const OPEN_TAB_CATEGORIES: Record<string, string[] | null> = { All: null, Dungeons: ["dungeon", "dungeons"], Raids: ["raid", "raids"], Leveling: ["leveling"] };

  const displayOffers = useMemo(() => {
    const cats = OPEN_TAB_CATEGORIES[activeTab] ?? null;
    return lobbies.filter(isLobbyListedInPublicFeed).filter((l) => cats === null || cats.includes(String(l.category || ""))).filter((l) => regionTab === "All" || String(l.serverRegion || "") === regionTab).sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
  }, [lobbies, activeTab, regionTab]);

  useEffect(() => {
    if (!meId) { setIsAdmin(false); return; }
    let cancelled = false;
    fetch("/api/users/me", { credentials: "include" }).then((r) => (r.ok ? r.json() : null)).then((d: any) => { if (!cancelled) setIsAdmin(d?.role === "admin"); }).catch(() => {});
    return () => { cancelled = true; };
  }, [meId]);

  const applyOfferBg = async (offerId: string, bg: string) => {
    setBgSavingOfferId(offerId); setBgError("");
    try {
      const res = await fetch("/api/lobbies", { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ lobbyId: offerId, customBg: bg }) });
      if (res.ok) { setLobbies((prev) => prev.map((l: any) => (String(l.id) === offerId ? { ...l, customBg: bg } : l))); setBgEditOfferId(null); } else { const d: any = await res.json().catch(() => ({})); setBgError(d?.error || t("err_couldNotUpdateBanner")); }
    } catch { setBgError(t("err_network")); } finally { setBgSavingOfferId(null); }
  };

  const deleteOffer = async (l: any) => {
    if (!meId || deletingId) return;
    setDeletingId(String(l.id)); setDeleteError("");
    try {
      const res = await fetch("/api/lobbies/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lobbyId: l.id }) });
      if (res.ok) { setLobbies((prev) => prev.filter((x: any) => String(x.id) !== String(l.id))); setConfirmId(null); window.dispatchEvent(new Event("data-refresh")); } else { const d: any = await res.json().catch(() => ({})); setDeleteError(d.error || t("err_couldNotDelete")); }
    } catch { setDeleteError(t("err_network")); } finally { setDeletingId(null); }
  };

  const applyMyChars = charactersList.filter((c: any) => String(c.userId) === String(meId));
  const applyChar = applyMyChars.find((c: any) => String(c.id) === applySelCharId) || applyMyChars[0] || null;

  const applyGameCharId = (c: any): string => {
    if (!c) return "";
    const rid = String(c.id || "");
    if (rid.startsWith("game:")) return rid.slice(5);
    return String(c.gameCharacterId || c.characterId || "");
  };

  const reapplyCharId = applyChar ? `game:${applyGameCharId(applyChar)}` : `${meId}-main`;

  const charProfileHref = (c: any): string => {
    const charId = applyGameCharId(c);
    if (!charId || !c?.serverId) return "";
    const regionBase = c.region === "tw" ? "https://tw.ncsoft.com/aion2" : "https://aion2.plaync.com";
    const official = `${regionBase}/characters/${c.serverId}/${encodeURIComponent(charId)}`;
    return `/character?u=${encodeURIComponent(official)}`;
  };

  const seedApplyFields = (c: any) => {
    if (!c) return;
    if (c.aionClass) setApplyAionClass(c.aionClass);
    else if (c.gameClassLabel) setApplyAionClass(c.gameClassLabel);
    if (Number(c.level) > 0) setApplyLevel(String(c.level));
    else setApplyLevel("60");
    if (Number(c.cpAp || c.combatPower) > 0) setApplyCp(String(c.cpAp || c.combatPower));
    else setApplyCp("");
  };

  useEffect(() => {
    if (!applyTarget) return;
    const list = applyMyChars;
    const current = applySelCharId && list.some((c: any) => String(c.id) === applySelCharId);
    if (!current) {
      const first = list[0] || null;
      setApplySelCharId(first ? String(first.id) : "");
      seedApplyFields(first);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyTarget?.id, charactersList]);

  const pickApplyChar = (c: any) => {
    setApplySelCharId(String(c.id));
    setApplyCharOpen(false);
    seedApplyFields(c);
  };

  const submitApply = async () => {
    const l = applyTarget;
    if (!meId || !l || applyingId) return;
    if (!applyChar) { setApplyError(t("apply_noCharacter")); return; }
    if (!applyAionClass) { setApplyError(t("err_pickClass")); return; }
    if (Number(applyChar.level ?? 0) < 45) { setApplyError(t("apply_levelRequired") || "Boosting offers require Level 45+"); return; }
    setApplyingId(String(l.id)); setApplyError("");
    const charId = reapplyCharId;
    const gid = applyGameCharId(applyChar);
    try {
      const res = await fetch("/api/lobbies/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lobbyId: l.id, applicant: { id: charId, role: aionClassRole(applyAionClass), className: applyAionClass, aionClass: applyAionClass, level: Number(applyLevel) || 1, cpAp: Number(applyCp) || 0, applicantNote: applyNote, applicantName: meName, ...(gid ? { gameCharacterId: gid, itemLevel: Number(applyChar.itemLevel) || 0, serverId: applyChar.serverId, serverName: applyChar.serverName, region: applyChar.region || "kr", portraitUrl: String(applyChar.portraitUrl || ""), siteClass: applyChar.aionClass || "", raceName: applyChar.raceName || "", genderName: applyChar.genderName || "", level: Number(applyLevel) || Number(applyChar.level) || 1, cpAp: Number(applyCp) || Number(applyChar.cpAp || applyChar.combatPower) || 0 } : {}) } }) });
      if (res.ok) {
        setAppliedIds((prev) => new Set([...prev, String(l.id)])); setApplyTarget(null); setApplyAionClass(""); setApplyNote(""); setApplyLevel("60"); setApplyCp(""); setApplySelCharId(""); setApplyCharOpen(false); window.dispatchEvent(new Event("data-refresh"));
      } else { const d: any = await res.json().catch(() => ({})); setApplyError(d.error || t("err_couldNotApply")); }
    } catch { setApplyError(t("err_network")); } finally { setApplyingId(null); }
  };

  const cancelApply = async (l: any) => {
    if (!meId || !l || cancellingApplyId) return;
    setCancellingApplyId(String(l.id)); setApplyError("");
    try {
      const res = await fetch(`/api/lobbies/apply?lobbyId=${encodeURIComponent(String(l.id))}`, { method: "DELETE" });
      if (res.ok) {
        setAppliedIds((prev) => { const next = new Set(prev); next.delete(String(l.id)); return next; });
        setCancelConfirmId(null);
        window.dispatchEvent(new Event("data-refresh"));
      } else { const d: any = await res.json().catch(() => ({})); setApplyError(d.error || t("err_couldNotCancelApply")); }
    } catch { setApplyError(t("err_network")); } finally { setCancellingApplyId(null); }
  };

  const loadFriends = () => {
    if (!meId) return;
    fetch("/api/friends")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: any) => { if (d?.friends) setFriends(d.friends); })
      .catch(() => {});
  };

  useEffect(() => {
    if (!meId) { setFriends([]); return; }
    loadFriends();
    window.addEventListener("data-refresh", loadFriends);
    return () => window.removeEventListener("data-refresh", loadFriends);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meId]);

  const getFriendStatus = (userId2: string) => {
    const entry = friends.find((f: any) =>
      (String(f.requester) === meId && String(f.target) === String(userId2)) ||
      (String(f.requester) === String(userId2) && String(f.target) === meId)
    );
    if (!entry) return "none";
    if (entry.status === "accepted") return "friends";
    if (entry.status === "pending" && String(entry.requester) === meId) return "pending_sent";
    if (entry.status === "pending" && String(entry.target) === meId) return "pending_received";
    return "none";
  };

  const isUserBlocked = (userId: string) => {
    const me = registeredUsers.find((u: any) => String(u.id) === meId);
    return Array.isArray(me?.blocked) && me.blocked.map(String).includes(String(userId));
  };

  const flashFriendMsg = (msg: string) => {
    setFriendActionMsg(msg);
    if (friendMsgTimer.current) window.clearTimeout(friendMsgTimer.current);
    friendMsgTimer.current = window.setTimeout(() => setFriendActionMsg(null), 4000);
  };

  const sendFriendRequest = async (targetId: string) => {
    if (!meId || String(targetId) === meId) return;
    try {
      const res = await fetch("/api/friends", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "request", targetId }) });
      if (res.ok) {
        const result: any = await res.json();
        setFriends((prev: any[]) => [...(prev || []), result.friend]);
        window.dispatchEvent(new CustomEvent("data-refresh"));
        flashFriendMsg(t("hp_requestSent") || "Friend request sent");
      } else {
        const d: any = await res.json().catch(() => ({}));
        flashFriendMsg(d.error || t("hp_requestFailed") || "Could not send friend request");
      }
    } catch { flashFriendMsg(t("err_network")); }
  };

  const handleFriendAccept = async (reqId: string) => {
    try {
      const res = await fetch("/api/friends", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "accept", targetId: reqId }) });
      if (res.ok) {
        setFriends((prev: any[]) => (prev || []).map((f: any) => (String(f.id) === String(reqId) ? { ...f, status: "accepted" } : f)));
        window.dispatchEvent(new CustomEvent("data-refresh"));
        flashFriendMsg(t("hp_requestAccepted") || "You are now friends");
      } else {
        const d: any = await res.json().catch(() => ({}));
        flashFriendMsg(d.error || t("hp_requestFailed") || "Could not accept friend request");
      }
    } catch { flashFriendMsg(t("err_network")); }
  };

  const handleUnfriend = async (targetId: string) => {
    try {
      const res = await fetch("/api/friends", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "remove", targetId }) });
      if (res.ok) {
        setFriends((prev: any[]) => (prev || []).filter((f: any) => !(String(f.requester) === meId && String(f.target) === String(targetId)) && !(String(f.requester) === String(targetId) && String(f.target) === meId)));
        window.dispatchEvent(new CustomEvent("data-refresh"));
        flashFriendMsg(t("hp_unfriended") || "Removed from friends");
      } else {
        const d: any = await res.json().catch(() => ({}));
        flashFriendMsg(d.error || t("hp_requestFailed") || "Could not remove friend");
      }
    } catch { flashFriendMsg(t("err_network")); }
  };

  const toggleBlock = async (targetId: string) => {
    if (!meId || !targetId) return;
    const meIdx = registeredUsers.findIndex((u: any) => String(u.id) === meId);
    if (meIdx === -1) return;
    const me = registeredUsers[meIdx];
    const blocked = Array.isArray(me.blocked) ? [...me.blocked.map(String)] : [];
    const exists = blocked.includes(String(targetId));
    const nextMe = { ...me, blocked: exists ? blocked.filter((id) => id !== String(targetId)) : [...blocked, String(targetId)] };
    try {
      const res = await fetch("/api/users/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile: nextMe }) });
      if (res.ok) {
        setRegisteredUsers((prev: any[]) => prev.map((u) => (String(u.id) === meId ? { ...u, blocked: nextMe.blocked } : u)));
        window.dispatchEvent(new Event("data-refresh"));
        flashFriendMsg(isUserBlocked(targetId) ? (t("hp_unblocked") || "Unblocked") : (t("hp_blocked") || "Blocked"));
      } else {
        const d: any = await res.json().catch(() => ({}));
        flashFriendMsg(d.error || t("err_network"));
      }
    } catch { flashFriendMsg(t("err_network")); }
  };

  const openDm = (userId: string) => {
    setHoveredUserId(null);
    setHoverCard(null);
    window.dispatchEvent(new CustomEvent("open-dm-chat", { detail: { userId } }));
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

      {/* Hero spacer — keeps original height after removing the Discord CTA */}
      <div className="relative z-10 pt-16 pb-10 px-6 text-center">
        <div className="h-[3rem]" />
      </div>
      <div className="h-8" />

      {/* Main */}
      <main className="max-w-[1600px] mx-auto px-6 pb-32 relative z-20">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-8">
          <section className="min-w-0">
            {/* Filters */}
            <div className="relative z-30 mb-6 flex max-w-full items-center gap-2">
              <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto rounded-full border border-blue-900/40 bg-[#0a0f26]/70 p-1.5 pr-2 backdrop-blur-md shadow-[0_4px_24px_rgba(34,211,238,0.06)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {FILTER_TABS.map((tab) => { const isActive = activeTab === tab.key; const Icon = tab.icon; return (<button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black tracking-[0.18em] transition-all duration-300 shrink-0 ${isActive ? 'bg-[#151c3d] text-white shadow-[inset_0_0_20px_rgba(59,130,246,0.2)] border border-blue-500/40' : 'text-slate-400 hover:text-white border border-transparent hover:bg-white/5'}`}><Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} /><span>{filterLabel(tab.key)}</span></button>); })}
                <div className="mx-1 h-6 w-px shrink-0 bg-white/15" />
                {REGION_TABS.map((rtab) => { const isActive = regionTab === rtab.key; return (<button key={rtab.key} onClick={() => setRegionTab(rtab.key)} className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black tracking-[0.18em] transition-all duration-300 shrink-0 ${isActive ? 'bg-[#0c132a] text-cyan-300 shadow-[inset_0_0_20px_rgba(34,211,238,0.15)] border border-cyan-500/40' : 'text-slate-400 hover:text-white border border-transparent hover:bg-white/5'}`}>{rtab.flag ? (<img src={rtab.flag} alt="" className="w-4 h-4 rounded-sm object-cover" loading="lazy" decoding="async" />) : (<span className="w-4 h-4 rounded-sm bg-cyan-400/15 border border-cyan-400/30" />)}<span>{regionLabel(rtab.key)}</span></button>); })}
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
                    <motion.div key={`${offer.id}-${offer.createdAt || ""}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} whileHover={{ scale: 1.005 }} onDoubleClick={(e) => { if (isMine || isAdmin) { e.stopPropagation(); setBgEditOfferId(String(offer.id)); setBgError(""); } }} className="tn-light relative w-full min-h-[110px] rounded-2xl bg-white/[0.04] border border-cyan-500/20 flex items-center gap-3 pr-2 pl-3 py-3 group shadow-[0_4px_24px_rgba(34,211,238,0.08)] hover:shadow-[0_0_32px_rgba(34,211,238,0.15)] transition-all">
                      {/* Banner BG */}
                      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none"><div className="absolute inset-0 bg-[#070b1a]" /><div className="absolute right-0 top-0 bottom-0 w-[640px] max-w-[50%]"><div className="absolute inset-0" style={offerBgStyle} />{offerBg && <img src={offerBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" loading="lazy" decoding="async" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />}<div className="absolute inset-0 bg-gradient-to-r from-[#070b1a] via-[#070b1a]/70 to-transparent" /></div></div>

                      {/* Creator avatar + Offer Details */}
                      <div className={`relative z-10 flex items-center gap-3 flex-shrink-0 max-w-[45%] ${hoveredUserId === String(owner?.id || "") ? "z-40" : ""}`}>
                        <div className="relative">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#050814]/80 border-2 border-cyan-400/40 flex items-center justify-center overflow-hidden shadow-[0_0_18px_rgba(59,130,246,0.25)] group-hover:border-cyan-300/70 transition-colors cursor-pointer" onMouseEnter={(e) => { cancelHide(); if (!owner?.id) return; const r = e.currentTarget.getBoundingClientRect(); setHoveredUserId(String(owner.id)); setHoverCard({ userId: String(owner.id), rect: { top: r.top, left: r.left, bottom: r.bottom }, owner, pic }); }} onMouseLeave={scheduleHide} onClick={() => { if (!owner?.id) return; setHoveredUserId(null); setHoverCard(null); window.dispatchEvent(new CustomEvent("open-player-profile", { detail: { userId: String(owner.id) } })); }}>
                            {pic ? (<img src={pic} alt="" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />) : (<Users className="w-6 h-6 text-cyan-400/70" />)}
                          </div>
                          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0a0f26]" />
                        </div>

                        {/* Offer Details Next to Avatar */}
                        <div className="min-w-0 max-w-[280px]">
                          {/* Region Badge with Flag */}
                          {offer.serverRegion && (
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <img
                                src={String(offer.serverRegion).toLowerCase().includes("na") ? "/flags/us.svg" : "/flags/eu.svg"}
                                alt={String(offer.serverRegion)}
                                className="w-3 h-3 rounded-sm object-cover"
                                loading="lazy"
                                decoding="async"
                              />
                              <span className="text-[9px] font-black tracking-widest text-violet-300">{String(offer.serverRegion).toUpperCase()}</span>
                            </div>
                          )}
                          {/* Title */}
                          <h4 className="text-sm font-black tracking-widest text-white uppercase truncate">{offer.title || `${offer.runsCount || 1}× ${t("offer_titleBoost")}`}</h4>
                          {/* Prices */}
                          {Number(offer.pricePerRun) > 0 && (
                            <div className="flex items-center gap-3 mt-1 whitespace-nowrap">
                              <span className="text-sm font-black text-amber-300">{t("offer_totalPlayer")} {(Number(offer.pricePerRun) * (offer.runsCount || 1)).toFixed(2)}M</span>
                              <span className="text-sm font-bold text-amber-200/80">{Number(offer.pricePerRun).toFixed(2)}M {t("offer_perRun")}</span>
                            </div>
                          )}
                          {!classSlots && openRoles.length > 0 && (<span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mt-1"><Users className="w-3.5 h-3.5 text-cyan-400" />{`${t("offer_open")} ${openRoles.map((r) => `${r.n} ${r.role.toUpperCase()}`).join(" · ")}`}</span>)}
                        </div>
                      </div>

                      {/* Class Images - Dead Center of Card */}
                      {classSlots && classSlots.length > 0 && (
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3 z-20">
                          {classSlots.map((s, i) => (
                            <div key={i} className="relative">
                              <img src={classThumbUrl(s.cls)} alt={s.cls} width={64} height={64} className={`w-16 h-16 object-contain drop-shadow-[0_4px_16px_rgba(34,211,238,0.6)] transition-all duration-300 ${s.filled ? 'opacity-25 grayscale brightness-[0.45] saturate-0' : 'brightness-100 saturate-100'}`} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                              {s.filled && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500/80 border-2 border-[#070b1a] shadow-[0_0_8px_rgba(239,68,68,0.7)]" />}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="relative z-10 ml-auto flex-shrink-0 sm:pl-2 flex flex-col gap-1.5 min-w-[150px]">
                        {applied ? (
                          cancelConfirmId === String(offer.id) ? (
                            <button onClick={() => cancelApply(offer)} disabled={cancellingApplyId === String(offer.id)} className="px-5 py-2.5 rounded-xl border border-red-500/40 bg-red-600/20 text-red-300 text-[9px] font-black uppercase tracking-widest hover:bg-red-600/25 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 backdrop-blur-md"><UserMinus className="w-3 h-3" /> {cancellingApplyId === String(offer.id) ? t("offer_cancellingApply") : t("offer_confirmCancelApply")}</button>
                          ) : (
                            <button onClick={() => { setCancelConfirmId(String(offer.id)); setApplyError(""); window.setTimeout(() => setCancelConfirmId((c) => (c === String(offer.id) ? null : c)), 4000); }} className="px-5 py-2.5 rounded-xl border border-red-500/40 bg-[#050814]/85 text-red-300 text-[9px] font-black uppercase tracking-widest hover:bg-red-600/25 hover:text-red-200 transition-all flex items-center justify-center gap-1.5 backdrop-blur-md"><UserMinus className="w-3 h-3" /> {t("offer_cancelApply")}</button>
                          )
                        ) : (
                          <button onClick={() => { setApplyTarget(offer); setApplyError(""); }} disabled={!meId || applyingId === String(offer.id)} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#074f7b] to-[#41389f] text-white text-[9px] font-black uppercase tracking-widest hover:from-[#08a3c4] hover:to-[#5b4ddb] transition-all shadow-[0_0_18px_rgba(0,180,255,0.25)] disabled:opacity-50 flex items-center justify-center gap-1.5 border border-white/[0.08]"><Swords className="w-3 h-3" /> {applyingId === String(offer.id) ? t("offer_applying") : t("offer_apply")}</button>
                        )}
                        {(isMine || isAdmin) && (
                          confirmId === String(offer.id) ? (
                            <button onClick={() => deleteOffer(offer)} disabled={deletingId === String(offer.id)} className="px-4 py-2 rounded-lg border border-red-500/40 bg-red-600/20 text-red-300 text-[9px] font-black uppercase tracking-widest hover:bg-red-600/25 transition-all disabled:opacity-50 backdrop-blur-md">{deletingId === String(offer.id) ? t("offer_deleting") : t("offer_confirmDelete")}</button>
                          ) : (
                            <button onClick={() => { setConfirmId(String(offer.id)); setDeleteError(""); window.setTimeout(() => setConfirmId((c) => (c === String(offer.id) ? null : c)), 4000); }} className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-white/15 bg-[#050814]/80 text-gray-300 text-[9px] font-black uppercase tracking-widest hover:border-red-500/40 hover:text-red-300 hover:bg-red-600/15 hover:backdrop-blur-xl transition-all backdrop-blur-md"><Trash2 className="w-3 h-3" /> {t("offer_delete")}</button>
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

          {/* Sidebar - Ongoing Missions */}
          <aside className="w-full lg:self-start">
            <div className="tn-light relative flex w-full max-h-[calc(100vh-7.5rem)] flex-col rounded-3xl bg-white/[0.05] backdrop-blur-3xl border border-cyan-500/20 p-4 shadow-[0_8px_32px_rgba(34,211,238,0.05)] transition-all lg:sticky lg:top-[6.5rem] overflow-hidden">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-blue-900/30 shrink-0">
                <h3 className="text-xs font-black tracking-[0.2em] uppercase text-blue-100">{t("missions_header") || "ONGOING MISSIONS"}</h3>
                {meId ? (<span className="flex items-center gap-1.5">{signalScan ? (<span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />) : (<span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />)}<span className="text-[8px] font-black tracking-widest text-slate-500 uppercase">{signalScan ? (t("missions_scan") || "SCANNING") : t("missions_live")}</span></span>) : null}
              </div>
              {missions.length === 0 ? (
                <div className="flex min-h-[200px] flex-1 flex-col items-center justify-center text-center py-6"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{signalScan ? (t("missions_scan") || "SCANNING FOR SIGNAL...") : (t("missions_empty") || "NO ACTIVE MISSIONS")}</p></div>
              ) : (
                <div className="custom-scrollbar -m-1 flex-1 min-h-0 space-y-4 overflow-y-auto p-1">
                  {activeMissions.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 px-1"><span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" /><span className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-300">{t("missions_liveRuns")}</span><span className="ml-auto rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-[8px] font-black tracking-widest text-emerald-300">{activeMissions.length}</span></div>
                      <AnimatePresence mode="popLayout">{activeMissions.map((m) => renderMissionCard(m))}</AnimatePresence>
                    </div>
                  )}
                  {unpaidMissions.length > 0 && (
                    <div className="pt-3 border-t border-red-500/20">
                      <div className="flex items-center gap-2 mb-2.5 px-1"><span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" /><span className="text-[9px] font-black uppercase tracking-[0.18em] text-red-300">{t("missions_unpaidRuns")}</span><span className="ml-auto rounded-full bg-red-500/20 border border-red-500/40 px-2 py-0.5 text-[8px] font-black tracking-widest text-red-300">{unpaidMissions.length}/{missions.length}</span></div>
                      <AnimatePresence mode="popLayout">{unpaidMissions.map((m) => renderMissionCard(m))}</AnimatePresence>
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>

          {/* History (completed & paid threads) */}
          {historyOffers.length > 0 && (
            <div className="w-full">
              <div className="tn-light relative w-full rounded-3xl bg-white/[0.05] backdrop-blur-3xl border border-emerald-500/20 p-5 shadow-[0_8px_32px_rgba(34,211,238,0.05)] transition-all">
                <div className="flex items-center gap-3 pb-4 mb-5 border-b border-emerald-900/30">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10"><HistoryIcon className="w-4 h-4 text-emerald-300" /></span>
                  <h3 className="text-xs font-black tracking-[0.2em] uppercase text-emerald-100">{t("history_header")}</h3>
                  <span className="ml-auto text-[8px] font-black tracking-widest text-slate-500 uppercase">{historyOffers.length} {t("history_completed")}</span>
                </div>
                <div className="space-y-3">
                  {historyOffers.map((h) => {
                    const owner = lobbyOwner(h);
                    const pic = ownerPic(h) || null;
                    const totalRuns = h.selectedDungeons ? (Object.values(h.selectedDungeons) as number[]).reduce((a: number, b: number) => a + b, 0) : h.runsCount || 1;
                    return (
                      <motion.div key={String(h.id)} whileHover={{ x: 5 }} onClick={() => { if (userCanViewOfferThread(h, meId) || isAdmin) { router.push(`/manage/${String(h.id)}`); } }} className="tn-light relative w-full rounded-2xl border border-emerald-500/20 overflow-hidden flex items-center gap-3 px-4 py-3 cursor-pointer group hover:border-emerald-400/40 hover:shadow-[0_0_24px_rgba(16,185,129,0.12)] transition-all">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/50">
                          {pic ? (<img src={pic} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />) : (<span className="flex h-full w-full items-center justify-center text-[10px] font-black text-emerald-300/60 uppercase">{String(ownerName(h) || "?").slice(0, 1)}</span>)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black uppercase tracking-wide text-white">{h.title || `${totalRuns}× ${t("history_runFallback")}`}</p>
                          <p className="truncate text-[9px] font-bold uppercase tracking-widest text-gray-500">{ownerName(h)}{h.serverRegion ? ` · ${String(h.serverRegion).toUpperCase()}` : ""}</p>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-1">
                          {Number(h.pricePerRun) > 0 && (<span className="text-[10px] font-black text-amber-300">{Number(h.pricePerRun).toFixed(2)}M{t("history_slashRun")}</span>)}
                          <span className={`text-[8px] font-black uppercase tracking-widest ${h.status === "failed" ? "text-red-400" : h.payoutStatus === "paid" ? "text-emerald-400" : "text-amber-400"}`}>{h.status === "failed" ? t("history_failed") || "Failed" : h.payoutStatus === "paid" ? t("history_paid") : t("history_unpaid") || "Unpaid"}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); setReviewOffer(h); }}
                            className="inline-flex items-center gap-1 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-yellow-300 hover:bg-yellow-500/20 transition-all"
                          >
                            <Star className="w-3 h-3" /> {t("history_review") || "Review"}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Apply Modal */}
      <AnimatePresence>
        {applyTarget && (
          <motion.div key="apply-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => !applyingId && setApplyTarget(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }} transition={{ duration: 0.2 }} onClick={(e) => e.stopPropagation()} className="tn-light relative w-full max-w-lg rounded-3xl border border-cyan-500/25 bg-[#0a0f26]/95 p-6 shadow-[0_0_60px_rgba(0,229,255,0.18)]">
              <div className="flex items-start justify-between gap-3 mb-4">
                <h3 className="text-base font-black uppercase tracking-widest text-white">{t("apply_title")}</h3>
                <button onClick={() => !applyingId && setApplyTarget(null)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-gray-400 hover:text-white"><X className="h-4 w-4" /></button>
              </div>
              <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2"><BadgeCheck className="w-3.5 h-3.5 text-violet-300" /> {t("apply_pickCharacter") || "Pick your character"}</p>
              {applyChar ? (
                <div className="mt-4 rounded-2xl border border-violet-500/25 bg-violet-500/[0.04] p-3 relative">
                  <button
                    type="button"
                    onClick={() => setApplyCharOpen((v) => !v)}
                    className="w-full flex items-center gap-3 text-left"
                  >
                    <CharacterPortraitBadge src={applyChar.portraitUrl} aionClass={applyChar.aionClass || applyChar.gameClassLabel || applyChar.siteClass || "dps"} fallback={applyChar.name || ""} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-emerald-200">{applyChar.name || "Character"}</p>
                      <p className="truncate text-[9px] font-black uppercase tracking-widest text-cyan-300">{applyChar.aionClass || applyChar.gameClassLabel || "Unknown class"}</p>
                      <p className="truncate text-[8px] font-bold uppercase tracking-widest text-slate-400">
                        {applyChar.raceName || "—"}{applyChar.genderName ? ` · ${applyChar.genderName}` : ""} · {applyChar.serverName}
                        <span className="ml-1.5 rounded border border-white/10 bg-white/5 px-1 py-px text-[7px] uppercase text-slate-300">{applyChar.region === "tw" ? "TW" : "KR"}</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <BadgeCheck className="h-4 w-4 text-emerald-400" />
                      {(() => { const href = charProfileHref(applyChar); return href ? (
                        <a href={href} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-[7px] font-black uppercase tracking-widest text-cyan-300 hover:bg-cyan-500/20 transition-all">
                          <ExternalLink className="w-2.5 h-2.5" /> {t("verify_fullProfile") || "Full profile"}
                        </a>
                      ) : null; })()}
                    </div>
                  </button>
                  {applyCharOpen && applyMyChars.length > 1 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 overflow-y-auto custom-scrollbar rounded-xl border border-white/10 bg-[#0a0f26] shadow-2xl max-h-[220px]">
                      {applyMyChars.map((c: any) => {
                        const isSel = String(c.id) === String(applyChar?.id);
                        return (
                          <button
                            key={String(c.id)}
                            type="button"
                            onClick={() => pickApplyChar(c)}
                            className={`w-full flex items-center gap-3 p-2.5 text-left transition-all ${isSel ? "bg-emerald-500/10 text-emerald-300" : "text-white hover:bg-white/5"}`}
                          >
                            <CharacterPortraitBadge src={c.portraitUrl} aionClass={c.aionClass || c.gameClassLabel || "dps"} fallback={c.name || ""} size="sm" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-black">{c.name}</span>
                              <span className="block truncate text-[7px] font-black uppercase tracking-widest text-slate-500">{c.aionClass || c.gameClassLabel} · {c.serverName || ""}</span>
                            </span>
                            <span className="text-[8px] font-black text-violet-300 tabular-nums shrink-0">{Number(c.itemLevel) > 0 ? Number(c.itemLevel).toLocaleString() : "—"} iLvl</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                    <div className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-2 py-1.5 text-center">
                      <p className="text-[7px] font-black uppercase tracking-widest text-violet-400"><img src="https://assets.playnccdn.com/static-aion2/characters/img/info/profile_level_icon_pc.png" alt="" className="inline-block h-2.5 w-auto align-[-1px] mr-0.5" loading="lazy" />Item Lv</p>
                      <p className="text-sm font-black text-violet-300 tabular-nums">{Number(applyChar.itemLevel) > 0 ? Number(applyChar.itemLevel).toLocaleString() : "—"}</p>
                    </div>
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-center">
                      <p className="text-[7px] font-black uppercase tracking-widest text-amber-400"><img src="https://assets.playnccdn.com/static-aion2/characters/img/info/profile_power_icon_pc.png" alt="" className="inline-block h-2.5 w-auto align-[-1px] mr-0.5" loading="lazy" />CP</p>
                      <p className="text-sm font-black text-amber-300 tabular-nums">{Number(applyChar.cpAp || applyChar.combatPower) > 0 ? Number(applyChar.cpAp || applyChar.combatPower).toLocaleString() : "—"}</p>
                    </div>
                  </div>
                  {Number(applyChar.level) < 45 && (
                    <div className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1.5 text-center">
                      <p className="text-[8px] font-black uppercase tracking-widest text-red-400">{t("apply_levelRequired") || "Boosting offers require Level 45+"}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-orange-500/25 bg-orange-500/[0.06] p-4 text-center">
                  <p className="text-[9px] font-black uppercase tracking-widest text-orange-300">{t("apply_noCharacter") || "You don't have any linked characters yet"}</p>
                  <p className="mt-1 text-[8px] font-bold uppercase tracking-widest text-slate-500">{t("apply_addCharacterHint") || "Link your character once in My Characters — then apply with it anywhere"}</p>
                  <button
                    type="button"
                    onClick={() => router.push("/my-characters")}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-[9px] font-black uppercase tracking-widest text-white hover:from-emerald-500 hover:to-teal-500 transition-all"
                  >
                    <IdCard className="w-3.5 h-3.5" /> {t("apply_addCharacter") || "Add your character"}
                  </button>
                </div>
              )}
              <div className="mt-4"><p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">{t("apply_note")}</p><input type="text" maxLength={200} value={applyNote} onChange={(e) => setApplyNote(e.target.value)} placeholder={t("apply_notePlaceholder")} className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-gray-200 outline-none" /></div>
              {applyError && (<p className="mt-3 text-center text-[10px] font-bold uppercase tracking-widest text-red-400">{applyError}</p>)}
              <button onClick={submitApply} disabled={!applyChar || !applyAionClass || !!applyingId} className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#074f7b] to-[#41389f] px-5 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50"><Swords className="w-3.5 h-3.5" /> {applyingId ? t("apply_submitting") : (applyChar ? (t("apply_send") || "Apply") : (t("apply_linkFirst") || "Link Character First"))}</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Hover Card */}
      {typeof document !== "undefined" && hoverCard && hoverCard.rect && hoverCard.owner && hoveredUserId === hoverCard.userId && (
        createPortal(
          (() => {
            const rect = hoverCard.rect!;
            const owner = hoverCard.owner;
            const cardPic = hoverCard.pic;
            const oid = owner ? String(owner.id || "") : "";
            const friendStatus = oid ? getFriendStatus(oid) : "none";
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const popW = Math.min(380, vw - 20);
            const spaceAbove = rect.top;
            const showAbove = spaceAbove > vh * 0.38;
            const left = Math.max(10, Math.min(rect.left - 20, vw - popW - 10));
            const top = showAbove ? Math.max(10, rect.top - 12) : Math.min(vh - 12, rect.bottom + 12);
            const hAvatar = owner ? resolveProfileImage(owner) || cardPic || "" : cardPic || "";
            const hBanner = resolveProfileBanner(owner) || "";
            const hDisplayName = owner ? resolveProfileDisplayName(owner) : "";
            const hNameColor = owner ? resolveNameColor(owner) : null;
            return (
              <div
                style={{ position: "fixed", top, left, width: popW, transform: showAbove ? "translateY(-100%)" : undefined, zIndex: 9999 }}
                className="tn-light relative bg-[#080810] border border-white/10 rounded-[1.5rem] shadow-[0_32px_100px_rgba(0,0,0,0.8)] overflow-hidden pointer-events-auto w-[380px] max-w-[calc(100vw-20px)]"
                onMouseEnter={cancelHide}
                onMouseLeave={scheduleHide}
              >
                <div className="relative aspect-[5/2] w-full bg-[#080810]">
                  {hBanner && <img src={hBanner} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080810] via-[#080810]/20 to-transparent pointer-events-none" />
                </div>
                {oid && String(oid) !== meId && (
                  <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
                    {friendStatus === "none" && (
                      <button
                        type="button"
                        title={!meId ? (t("hp_loginToAdd") || "Log in to add friends") : (isUserBlocked(oid) ? (t("hp_youBlocked") || "You blocked this player") : (t("hp_addFriend")))}
                        disabled={!meId || isUserBlocked(oid)}
                        onClick={() => sendFriendRequest(oid)}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#00ffff]/40 bg-black/50 backdrop-blur text-[#00ffff] hover:scale-110 hover:bg-[#00ffff]/20 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-black/50"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                    )}
                    {friendStatus === "pending_sent" && (
                      <span title={t("hp_pending")} className="flex h-9 w-9 items-center justify-center rounded-full border border-yellow-500/40 bg-black/50 backdrop-blur text-yellow-400 cursor-default">
                        <Clock className="w-4 h-4" />
                      </span>
                    )}
                    {friendStatus === "pending_received" && (
                      <button
                        type="button"
                        onClick={() => { const f = friends.find((fs: any) => String(fs.requester) === oid && String(fs.target) === meId); if (f) handleFriendAccept(f.id); }}
                        title={t("hp_accept")}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-green-500/40 bg-black/50 backdrop-blur text-green-400 hover:scale-110 hover:bg-green-500/20 transition"
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>
                    )}
                    {friendStatus === "friends" && (
                      <button
                        type="button"
                        onMouseEnter={() => setUnfriendHover(true)}
                        onMouseLeave={() => setUnfriendHover(false)}
                        onClick={() => handleUnfriend(oid)}
                        title={unfriendHover ? (t("hp_unfriend")) : (t("hp_friends"))}
                        className={`flex h-9 w-9 items-center justify-center rounded-full border bg-black/50 backdrop-blur transition ${unfriendHover ? "border-red-500/50 text-red-400 hover:bg-red-500/20" : "border-[#1877f2]/40 text-[#5b9eff]"}`}
                      >
                        {unfriendHover ? <UserMinus className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    )}
                    <button type="button" onClick={() => oid && openDm(oid)} title={t("hp_message")} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ff007f]/40 bg-black/50 backdrop-blur text-[#ff007f] hover:scale-110 hover:bg-[#ff007f]/15 transition">
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleBlock(oid)}
                      title={isUserBlocked(oid) ? (t("hp_unblock") || "Unblock") : (t("hp_block") || "Block")}
                      className={`flex h-9 w-9 items-center justify-center rounded-full border bg-black/50 backdrop-blur transition ${isUserBlocked(oid) ? "border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/15" : "border-red-500/40 text-red-400 hover:bg-red-500/15 hover:scale-110"}`}
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="px-5 -mt-10 relative z-10 flex items-end gap-3">
                  <div className="rounded-full overflow-hidden border-[3px] border-[#080810] shadow-[0_0_24px_rgba(255,0,127,0.25)] bg-black shrink-0" style={{ width: 80, height: 80 }}>
                    {hAvatar ? (<img src={hAvatar} alt="" className={profileImgClass(hAvatar, "w-full h-full rounded-full")} onError={(e) => { (e.currentTarget as HTMLImageElement).src = cardPic || ""; }} />) : (<div className="w-full h-full flex items-center justify-center"><Users className="w-6 h-6 text-gray-600" /></div>)}
                  </div>
                  <div className="pb-1 flex-1 min-w-0">
                    <h3 className="text-base font-black text-white uppercase truncate leading-tight" style={hNameColor ? { ...toNameStyle(hNameColor), textShadow: `0 0 14px ${nameGlowColor(hNameColor)}77` } : undefined}>
                      {hDisplayName}
                    </h3>
                    <RankBadge stats={owner?.stats} ratings={owner?.ratings} rankOverride={owner?.rankOverride} />
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {owner?.team?.name && (<span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-purple-500/40 bg-purple-500/10 text-purple-400">{owner.team.name}</span>)}
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-[#5865F2]/40 bg-[#5865F2]/10 text-[#8ea1ff]">{t("hp_discord")} {owner?.username || "—"}</span>
                    </div>
                  </div>
                </div>
                <div className="px-5 pb-4 pt-2">
                  <div className="flex items-center justify-center gap-5 py-1.5">
                    <div className="flex flex-col items-center gap-0.5">
                      <Users className="w-4 h-4 text-[#00ffff]" />
                      <span className="text-[10px] font-black text-white tabular-nums">{owner?.friends?.length ?? 0}</span>
                    </div>
                  </div>
                  {friendActionMsg && (
                    <p className="mt-2 text-center text-[9px] font-black uppercase tracking-widest text-red-400">{friendActionMsg}</p>
                  )}
                </div>
              </div>
            );
          })(),
          document.body
        )
      )}

      {/* BG Picker Modal */}
      {bgEditOfferId && (() => {
        const edOffer = lobbies.find((l: any) => String(l.id) === bgEditOfferId) || null;
        const edOwner = edOffer ? lobbyOwner(edOffer) : null;
        const edThumbs: Array<{ src: string; thumb: string }> = (Array.isArray(edOwner?.userVfx) ? (edOwner.userVfx as VfxEntry[]) : []).map((e) => ({ src: resolveVfxSrc(e), thumb: resolveVfxBannerUrl(e) })).filter((t) => Boolean(t.src) && Boolean(t.thumb));
        return (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0a0f26] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.7)]">
              <div className="flex items-center justify-between gap-2 mb-4"><div className="flex items-center gap-2"><Palette className="h-4 w-4 text-[#ff007f]" /><h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-100">{t("bg_title")}</h3></div><button onClick={() => setBgEditOfferId(null)} className="text-white/50 hover:text-white"><X className="h-4 w-4" /></button></div>
              <button onClick={() => applyOfferBg(bgEditOfferId!, "")} disabled={bgSavingOfferId === bgEditOfferId} className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:border-white/25"><p className="text-[10px] font-black uppercase tracking-widest text-white/90">{t("bg_default")}</p></button>
              <p className="mt-4 mb-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{t("bg_mine")}</p>
              {edThumbs.length === 0 ? (<p className="rounded-2xl border border-white/5 bg-white/[0.02] px-3 py-4 text-center text-[9px] text-white/40">{t("bg_empty")}</p>) : (
                <div className="grid grid-cols-3 gap-2 max-h-[38vh] overflow-y-auto pr-1">{edThumbs.map((t) => (<button key={t.src} onClick={() => applyOfferBg(bgEditOfferId!, t.src)} disabled={bgSavingOfferId === bgEditOfferId} className="relative aspect-video overflow-hidden rounded-xl border-2 border-white/10 hover:border-white/30"><img src={t.thumb} alt="" className="h-full w-full object-cover" /></button>))}</div>
              )}
              {bgError && (<p className="mt-3 text-center text-[9px] font-black uppercase tracking-widest text-red-400">{bgError}</p>)}
            </div>
          </div>
        );
      })()}

      {reviewOffer && (<SquadReviewModal lobby={reviewOffer} meId={meId} registeredUsers={registeredUsers} onClose={() => setReviewOffer(null)} />)}

      <AionAutoApplyModal
        registeredUsers={registeredUsers}
        meId={meId}
        meName={meName || ""}
        autoAccept={autoAccept}
        onAutoAcceptChange={async (next) => {
          setAutoAccept(next);
          try {
            const d: any = await fetch("/api/user/auto-apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ autoAccept: next }) }).then((r) => r.json());
            if (!d?.success) setAutoAccept(!next);
          } catch { setAutoAccept(!next); }
        }}
        onSave={async (next) => {
          const d: any = await fetch("/api/user/auto-apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ aionAutoApply: next }) }).then((r) => r.json());
          if (!d?.success) throw new Error("save_failed");
        }}
      />
    </div>
  );
}
