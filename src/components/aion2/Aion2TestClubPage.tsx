"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  Shield, Sparkles, Swords, Users, Search,
  Trash2, Check, Layers, X, UserPlus, UserCheck, UserMinus, MessageCircle, Ban, History as HistoryIcon,
  Bell, BellOff
} from "lucide-react";
import { useI18n } from "@/i18n/i18n";
import { useFlag } from "@/lib/siteFlags";
import { useRouter } from "next/navigation";
import RankBadge from "@/components/RankBadge";
import { resolveLobbyBannerBg, resolveLobbyBannerAnimatedSrc } from "@/lib/vfxAssets";
import { getOwnerOngoingMissions, getJoinedOngoingMissions, isLobbyListedInPublicFeed } from "@/lib/lobbyLifecycle";
import { classThumbUrl } from "@/lib/classThumb";
import {
  AION2_CLASSES,
  AION2_ROLE_LABEL,
  aionClassRole,
  AION2_LEVEL_MAX,
} from "@/lib/aionClassMeta";
import { effectiveAvatarEffect } from "@/lib/userProfile";
import { toNameStyle, nameGlowColor } from "@/components/GradientColorPicker";
import AionAutoApplyModal from "@/components/modals/AionAutoApplyModal";
import type { AionAutoApply } from "@/components/modals/AionAutoApplyModal";
import {
  resolveProfileBanner,
  resolveProfileImage,
  resolveProfileDisplayName,
  resolveNameColor,
  isAnimatedImageUrl,
  profileImgClass,
} from "@/lib/profileImage";

/* ── FILTER TABS ── */
const FILTER_TABS = [
  { label: "ALL",       key: "All",       icon: Layers },
  { label: "DUNGEONS",  key: "Dungeons",  icon: Shield },
  { label: "RAIDS",     key: "Raids",     icon: Swords },
  { label: "LEVELING",  key: "Leveling",  icon: Sparkles },
  { label: "PVP",       key: "PVP",       icon: Swords },
];

const OFFER_NOTIFICATION_CATEGORIES = ["dungeon", "raid", "leveling", "pvp"] as const;
type OfferNotificationCategory = (typeof OFFER_NOTIFICATION_CATEGORIES)[number];
type OfferNotificationSettings = { mutedAll: boolean; mutedCategories: OfferNotificationCategory[] };
const DEFAULT_OFFER_NOTIFICATION_SETTINGS: OfferNotificationSettings = { mutedAll: false, mutedCategories: [] };

function normalizeOfferCategory(category: unknown): OfferNotificationCategory {
  const value = String(category || "dungeon").toLowerCase();
  if (value === "raids") return "raid";
  return OFFER_NOTIFICATION_CATEGORIES.includes(value as OfferNotificationCategory)
    ? value as OfferNotificationCategory
    : "dungeon";
}

export default function Aion2TestClubPage() {
  const { t } = useI18n();
  const { data: session } = useSession();
  const router = useRouter();
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
  const autoAttemptedRef = useRef<Set<string>>(new Set());
  const [hoveredUserId, setHoveredUserId] = useState<string | null>(null);
  const [hoverCard, setHoverCard] = useState<{ userId: string; rect: { top: number; left: number; bottom: number } | null; owner: any; pic: string | null } | null>(null);
  const hoverHideTimer = useRef<number | null>(null);
  const scheduleHide = () => {
    if (hoverHideTimer.current) window.clearTimeout(hoverHideTimer.current);
    hoverHideTimer.current = window.setTimeout(() => { setHoveredUserId(null); setHoverCard(null); }, 250);
  };
  const cancelHide = () => {
    if (hoverHideTimer.current) window.clearTimeout(hoverHideTimer.current);
    hoverHideTimer.current = null;
  };
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
    if (!saved || typeof saved !== "object") {
      setOfferNotificationSettings(DEFAULT_OFFER_NOTIFICATION_SETTINGS);
      return;
    }
    setOfferNotificationSettings({
      mutedAll: saved.mutedAll === true,
      mutedCategories: Array.isArray(saved.mutedCategories)
        ? saved.mutedCategories.filter((category: unknown): category is OfferNotificationCategory =>
            OFFER_NOTIFICATION_CATEGORIES.includes(String(category).toLowerCase() as OfferNotificationCategory)
          ).map((category: unknown) => normalizeOfferCategory(category))
        : [],
    });
  }, [registeredUsers, meId]);

  const saveOfferNotificationSettings = async (next: OfferNotificationSettings) => {
    if (!meId) return;
    setOfferNotificationSettings(next);
    try {
      await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: { id: meId, offerNotificationSettings: next } }),
      });
    } catch {
      /* The next poll restores the saved setting if the request fails. */
    }
  };

  const toggleOfferCategoryMute = (category: OfferNotificationCategory) => {
    const mutedCategories = offerNotificationSettings.mutedCategories.includes(category)
      ? offerNotificationSettings.mutedCategories.filter((value) => value !== category)
      : [...offerNotificationSettings.mutedCategories, category];
    void saveOfferNotificationSettings({ ...offerNotificationSettings, mutedCategories });
  };

  useEffect(() => {
    if (!meId) return;
    let cancelled = false;
    const autoApplyFor = (users: any[], lobbies: any[]) => {
      const meUser = users.find((u: any) => String(u.id) === String(meId));
      const aa = meUser?.aionAutoApply;
      if (!aa?.enabled || !aa.aionClass || !meId) return;
      const cls = String(aa.aionClass);
      const role = aionClassRole(cls);
      const candidates = (Array.isArray(lobbies) ? lobbies : []).filter((l) => {
        if (!isLobbyListedInPublicFeed(l)) return false;
        if (String(l.ownerId) === String(meId)) return false;
        const st = l.status || "standby";
        if (st !== "standby" && st !== "") return false;
        const appliedAlready = (l.applicants || []).some(
          (a: any) => String(a.applicantId || a.userId || a.id) === String(meId)
        );
        if (appliedAlready) return false;
        if (Array.isArray(l.requiredClasses) && l.requiredClasses.length > 0) {
          return l.requiredClasses.map((c: any) => String(c).trim()).includes(cls);
        }
        const rolesMap = l?.roles || {};
        return Number(rolesMap[role] || rolesMap.dps || 0) > 0;
      });
      let didApply = false;
      for (const l of candidates) {
        const key = String(l.id);
        if (autoAttemptedRef.current.has(key)) continue;
        autoAttemptedRef.current.add(key);
        didApply = true;
        fetch("/api/lobbies/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lobbyId: l.id,
            applicant: {
              id: `${meId}-main`,
              role,
              className: cls,
              aionClass: cls,
              level: Number(aa.itemLevel) || 60,
              applicantNote: "Auto-apply",
              applicantName: meName,
            },
          }),
        }).then(() => { window.dispatchEvent(new Event("data-refresh")); }).catch(() => {});
      }
      if (didApply) {
        window.dispatchEvent(new Event("data-refresh"));
        window.dispatchEvent(new Event("auto-apply-fired"));
      }
    };
    const load = () => {
      if (!meId) return;
      fetch("/api/data", { credentials: "include" })
        .then((r) => r.json())
        .then((d) => {
          if (cancelled) return;
          if (d.registeredUsers) setRegisteredUsers(d.registeredUsers);
          if (d.friends) setFriends(d.friends);
          if (d.lobbies) {
            setLobbies(d.lobbies);
            autoApplyFor(Array.isArray(d.registeredUsers) ? d.registeredUsers : [], d.lobbies);
          }
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
  }, [meId, meName]);

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

  const unpaidMissions = useMemo(
    () => missions.filter((m: any) => (m.status || "standby") === "unpaid"),
    [missions]
  );
  const activeMissions = useMemo(
    () => missions.filter((m: any) => (m.status || "standby") !== "unpaid"),
    [missions]
  );

  const renderMissionCard = (m: any) => {
    const owner = missionOwner(m);
    const vfxOn = owner && (owner.vfxSettings?.showOnOngoing !== false);
    const bgPoster = vfxOn ? resolveLobbyBannerBg(m, owner, owner?.activeVfx) : null;
    const totalRuns = m.selectedDungeons
      ? (Object.values(m.selectedDungeons) as number[]).reduce((a, b) => a + b, 0)
      : m.runsCount || 1;
    const shown = (m.accepted || []).length;
    const open = Math.max(0, 4 - shown);
    const isUnpaid = (m.status || "standby") === "unpaid";
    const accent = isUnpaid ? "red" : "cyan";
    return (
      <motion.div
        key={String(m.id)}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
        onClick={() => router.push(`/manage/${String(m.id)}`)}
        className={`tn-light relative w-full min-h-[88px] rounded-2xl border overflow-hidden flex flex-col justify-center px-3 py-2.5 cursor-pointer group shadow-[0_4px_20px_rgba(34,211,238,0.05)] hover:shadow-[0_0_24px_rgba(34,211,238,0.12)] transition-all ${
          isUnpaid
            ? "border-red-500/30 hover:border-red-400/50"
            : "border-cyan-500/20 hover:border-cyan-400/40"
        }`}
      >
        {bgPoster && (
          <div className="absolute inset-0 z-0">
            <img src={bgPoster} alt="" className="w-full h-full object-cover opacity-55 animate-pan-slow" loading="lazy" decoding="async" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#050814]/75 via-[#050814]/55 to-[#050814]/80" />
          </div>
        )}

        <div className="relative z-10 flex items-start justify-between gap-2">
          <p className="text-sm font-black uppercase tracking-tight leading-none text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">
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
          <div className="shrink-0 flex items-center gap-1.5">
            <span
              className={`px-2 py-1 rounded-full text-[7px] font-black uppercase tracking-widest border ${
                isUnpaid
                  ? "border-red-500/40 bg-red-500/15 text-red-300"
                  : m.status === "in_progress"
                    ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                    : m.status === "payment_pending"
                      ? "border-orange-500/40 bg-orange-500/15 text-orange-300"
                      : "border-cyan-500/30 bg-black/50 text-cyan-300"
              }`}
            >
              {isUnpaid ? "UNPAID" : m.status === "in_progress" ? "ACTIVE" : m.status === "payment_pending" ? "PAYMENT PENDING" : "RUNNING"}
            </span>
            <span className="px-2 py-1 rounded-full text-[7px] font-black uppercase tracking-widest border border-cyan-400/40 bg-cyan-500/15 text-cyan-200 group-hover:bg-cyan-500/30 transition-colors">
              Open Thread ›
            </span>
          </div>
        </div>

        <div className="relative z-10 mt-2 flex items-center justify-between gap-2">
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

  const missionOwner = (m: any) =>
    registeredUsers.find((u: any) => String(u.id) === String(m.ownerId)) || null;

  const historyOffers = useMemo(() => {
    if (!meId) return [];
    return (lobbies || [])
      .filter((l: any) => l.status === "completed" && l.payoutStatus === "paid")
      .sort((a: any, b: any) => (Number(b.completedAt) || Number(b.id) || 0) - (Number(a.completedAt) || Number(a.id) || 0))
      .slice(0, 8);
  }, [lobbies, meId]);

  const OPEN_TAB_CATEGORIES: Record<string, string[] | null> = {
    All: null,
    Dungeons: ["dungeon"],
    Raids: ["raid", "raids"],
    Leveling: ["leveling"],
    PVP: ["pvp"],
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

  useEffect(() => {
    const publicOffers = lobbies.filter(isLobbyListedInPublicFeed);
    const currentIds = new Set(publicOffers.map((offer: any) => String(offer.id)));
    if (!knownOfferIdsRef.current) {
      knownOfferIdsRef.current = currentIds;
      return;
    }
    const newOffers = publicOffers.filter((offer: any) => !knownOfferIdsRef.current?.has(String(offer.id)));
    knownOfferIdsRef.current = currentIds;
    if (offerNotificationSettings.mutedAll) return;
    const audibleOffers = newOffers
      .filter((offer: any) => String(offer.ownerId) !== meId)
      .filter((offer: any) => !offerNotificationSettings.mutedCategories.includes(normalizeOfferCategory(offer.category)));
    if (audibleOffers.length === 0) return;

    const sound = new Audio("/Message.mp3");
    sound.volume = 0.55;
    void sound.play().catch(() => {
      /* Browsers can block audio until the visitor has interacted with the page. */
    });

    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    audibleOffers.forEach((offer: any) => {
        new Notification(`New ${normalizeOfferCategory(offer.category)} offer`, {
          body: String(offer.title || `${offer.runsCount || 1}× Run`),
          icon: "/icon.svg",
        });
    });
  }, [lobbies, meId, offerNotificationSettings]);

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

  const classSlotsOf = (l: any) => {
    const req = l?.requiredClasses;
    if (Array.isArray(req)) {
      const acceptedClasses = new Set(
        (l?.accepted || []).map((a: any) => String(a.aionClass || a.class || a.role || "").trim().toLowerCase())
      );
      return req.map((cls: string) => ({
        cls,
        filled: acceptedClasses.has(String(cls).trim().toLowerCase()),
      }));
    }
    return null;
  };

  const openRolesLabel = (l: any) => {
    const slots = classSlotsOf(l);
    if (slots) {
      const open = slots.filter((s) => !s.filled);
      return open.length > 0 ? `OPEN: ${open.map((s) => s.cls).join(" · ")}` : "FULL";
    }
    const openRoles = openRolesOf(l);
    return openRoles.length > 0
      ? `OPEN: ${openRoles.map((r) => `${r.n} ${r.role.toUpperCase()}`).join(" · ")}`
      : "FULL";
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

  /* ── PROFILE CARD ACTIONS (friend / dm / block) ── */
  const getFriendStatus = (userId2: string) => {
    const entry = friends.find(
      (f: any) =>
        (f.requester === meId && f.target === userId2) ||
        (f.requester === userId2 && f.target === meId)
    );
    if (!entry) return "none";
    if (entry.status === "accepted") return "friends";
    if (entry.status === "pending" && entry.requester === meId) return "pending_sent";
    if (entry.status === "pending" && entry.target === meId) return "pending_received";
    return "none";
  };

  const getMutualFriendsCount = (userId2: string) => {
    const myFriendIds = new Set(
      friends
        .filter((f: any) => f.status === "accepted" && (f.requester === meId || f.target === meId))
        .map((f: any) => String(f.requester === meId ? f.target : f.requester))
    );
    const theirFriendIds = friends
      .filter((f: any) => f.status === "accepted" && (f.requester === userId2 || f.target === userId2))
      .map((f: any) => String(f.requester === userId2 ? f.target : f.requester));
    return theirFriendIds.filter(
      (id) => myFriendIds.has(id) && id !== String(meId) && id !== String(userId2)
    ).length;
  };

  const sendFriendRequest = async (targetId: string) => {
    if (!meId || String(targetId) === meId) return;
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", targetId }),
      });
      if (res.ok) {
        const result = await res.json();
        setFriends((prev: any[]) => [...(prev || []), result.friend]);
      }
    } catch {}
  };

  const unfriend = async (targetId: string) => {
    if (!meId) return;
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", targetId }),
      });
      if (res.ok) {
        setFriends((prev: any[]) =>
          (prev || []).filter(
            (f: any) =>
              !(f.status === "accepted" && ((f.requester === meId && f.target === targetId) || (f.requester === targetId && f.target === meId)))
          )
        );
      }
    } catch {}
  };

  const toggleBlock = async (targetId: string) => {
    if (!meId) return;
    const users = [...registeredUsers];
    const meIdx = users.findIndex((u: any) => String(u.id) === String(meId));
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
      if (res.ok) setRegisteredUsers(users);
    } catch {}
  };

  const openDm = (userId: string) => {
    setHoveredUserId(null);
    setHoverCard(null);
    window.dispatchEvent(new CustomEvent("open-dm-chat", { detail: { userId } }));
  };

  const handleFriendAccept = async (reqId: string) => {
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept", targetId: reqId }),
      });
      if (res.ok) {
        setFriends((prev: any[]) =>
          (prev || []).map((f: any) => (String(f.id) === String(reqId) ? { ...f, status: "accepted" } : f))
        );
      }
    } catch {}
  };

  const handleFriendDecline = async (reqId: string) => {
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline", targetId: reqId }),
      });
      if (res.ok) {
        setFriends((prev: any[]) => (prev || []).filter((f: any) => String(f.id) !== String(reqId)));
      }
    } catch {}
  };

  const isUserBlocked = (userId: string) => {
    const me = registeredUsers.find((u: any) => String(u.id) === String(meId));
    return Array.isArray(me?.blocked) && me.blocked.map(String).includes(String(userId));
  };

  const saveAutoApply = async (next: AionAutoApply) => {
    const res = await fetch("/api/user/auto-apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aionAutoApply: next }),
    });
    if (!res.ok) throw new Error("save failed");
    setRegisteredUsers((prev) =>
      (prev || []).map((u: any) =>
        String(u.id) === String(meId) ? { ...u, aionAutoApply: next } : u
      )
    );
    window.dispatchEvent(new Event("data-refresh"));
  };

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
            <div className="relative z-30 mb-6 flex max-w-full items-center gap-2">
              <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto rounded-full border border-blue-900/40 bg-[#0a0f26]/70 p-1.5 pr-2 backdrop-blur-md shadow-[0_4px_24px_rgba(34,211,238,0.06)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
              {meId && (
                <div className="shrink-0">
                  <button ref={muteButtonRef} type="button" onClick={() => setShowNotificationSettings((open) => !open)} title="Mute offer notifications" className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all ${offerNotificationSettings.mutedAll ? "border-red-500/40 bg-red-500/15 text-red-300" : "border-cyan-500/30 bg-[#0a0f26]/80 text-cyan-200 hover:border-cyan-300/60 hover:bg-cyan-500/10"}`}>
                    {offerNotificationSettings.mutedAll ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>

            {/* Offer List */}
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
                  <motion.div
                    key={`${offer.id}-${offer.createdAt || ""}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.005 }}
                    className="tn-light relative w-full min-h-[260px] sm:min-h-[220px] xl:min-h-[240px] rounded-2xl bg-white/[0.04] backdrop-blur-2xl border border-cyan-500/20 overflow-hidden flex flex-col sm:flex-row sm:items-center gap-3 pr-2 pl-3 py-3 group shadow-[0_4px_24px_rgba(34,211,238,0.08)] hover:shadow-[0_0_32px_rgba(34,211,238,0.15)] hover:bg-white/[0.06] transition-all"
                  >
                    {/* Faction VFX banner / gradient — full card */}
                    <div className="absolute inset-0 bg-black pointer-events-none overflow-hidden opacity-85 group-hover:opacity-100 transition-opacity">
                      {offerBg ? (
                        <>
                          <img
                            src={offerBg}
                            alt=""
                            className="absolute inset-0 w-full h-full object-contain object-right"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-[#050814] via-[#050814]/80 to-transparent" />
                        </>
                      ) : (
                        <div className="absolute right-0 top-0 bottom-0 w-2/5">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-800/50 via-violet-800/30 to-cyan-700/20" />
                          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0f26] via-[#0a0f26]/60 to-transparent" />
                        </div>
                      )}
                    </div>

                    {/* Creator avatar */}
                    <div className={`relative z-10 flex-shrink-0 ${hoveredUserId === String(owner?.id || "") ? "z-40" : ""}`}>
                      <div
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#050814]/80 border-2 border-cyan-400/40 flex items-center justify-center overflow-hidden shadow-[0_0_18px_rgba(59,130,246,0.25)] group-hover:border-cyan-300/70 transition-colors cursor-pointer"
                        onMouseEnter={(e) => {
                          cancelHide();
                          if (!owner?.id) return;
                          const r = e.currentTarget.getBoundingClientRect();
                          setHoveredUserId(String(owner.id));
                          setHoverCard({ userId: String(owner.id), rect: { top: r.top, left: r.left, bottom: r.bottom }, owner, pic });
                        }}
                        onMouseLeave={scheduleHide}
                      >
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
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        {offer.serverRegion && (
                          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[9px] font-black tracking-widest text-violet-300">
                            {String(offer.serverRegion).toUpperCase()}
                          </span>
                        )}
                        {classSlots ? (
                          <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                            <Users className="w-3.5 h-3.5 text-cyan-400" />
                            {openRolesLabel(offer)}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                            <Users className="w-3.5 h-3.5 text-cyan-400" />
                            {openRoles.length > 0
                              ? `OPEN: ${openRoles.map((r) => `${r.n} ${r.role.toUpperCase()}`).join(" · ")}`
                              : "FULL"}
                          </span>
                        )}
                      </div>
                      {classSlots && classSlots.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {classSlots.map((s, i) => {
                            const imgName = s.cls === "Spiritmaster" ? "Elementalist" : s.cls;
                            return (
                              <span key={i} className={`relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border ${s.filled ? "border-emerald-400/60 bg-emerald-500/15" : "border-cyan-400/40 bg-black/40"}`} title={`${s.cls}${s.filled ? " — filled" : " — open"}`}>
                                <img src={`/classes/${imgName}.png`} alt={s.cls} className="h-6 w-6 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                                {s.filled && <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border border-black" />}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="relative z-10 flex-shrink-0 sm:pl-2 flex flex-col gap-1.5 min-w-[150px]">
                      {applied ? (
                        <span className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-emerald-500/40 bg-[#050814]/85 text-emerald-300 text-[9px] font-black uppercase tracking-widest backdrop-blur-md">
                          <Check className="w-3 h-3" /> Applied
                        </span>
                      ) : (
                        <button
                          onClick={() => { setApplyTarget(offer); setApplyError(""); }}
                          disabled={!meId || applyingId === String(offer.id)}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#074f7b] to-[#41389f] text-white text-[9px] font-black uppercase tracking-widest hover:from-[#08a3c4] hover:to-[#5b4ddb] transition-all shadow-[0_0_18px_rgba(0,180,255,0.25)] disabled:opacity-50 flex items-center justify-center gap-1.5 border border-white/[0.08]"
                        >
                          <Swords className="w-3 h-3" /> {applyingId === String(offer.id) ? "Applying..." : "Apply"}
                        </button>
                      )}
                      {(isMine || isAdmin) && (
                        confirmId === String(offer.id) ? (
                          <button
                            onClick={() => deleteOffer(offer)}
                            disabled={deletingId === String(offer.id)}
                            className="px-4 py-2 rounded-lg border border-red-500/40 bg-red-600/20 text-red-300 text-[9px] font-black uppercase tracking-widest hover:bg-red-600/25 transition-all disabled:opacity-50 backdrop-blur-md"
                          >
                            {deletingId === String(offer.id) ? "Deleting..." : "Confirm Delete?"}
                          </button>
                        ) : (
                          <button
                            onClick={() => { setConfirmId(String(offer.id)); setDeleteError(""); window.setTimeout(() => setConfirmId((c) => (c === String(offer.id) ? null : c)), 4000); }}
                            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-white/15 bg-[#050814]/80 text-gray-300 text-[9px] font-black uppercase tracking-widest hover:border-red-500/40 hover:text-red-300 hover:bg-red-600/15 hover:backdrop-blur-xl transition-all backdrop-blur-md"
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
          <aside className="w-full xl:pt-[68px]">
            <div className="tn-light relative w-full rounded-3xl bg-white/[0.05] backdrop-blur-3xl border border-cyan-500/20 p-4 shadow-[0_8px_32px_rgba(34,211,238,0.05)] transition-all">
              {/* Widget Header — slim */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-blue-900/30">
                <h3 className="text-xs font-black tracking-[0.2em] uppercase text-blue-100">
                  {t("missions_header") || "ONGOING MISSIONS"}
                </h3>
                {meId ? (
                  <span className="flex items-center gap-1.5">
                    {signalScan ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                    <span className="text-[8px] font-black tracking-widest text-slate-500 uppercase">
                      {signalScan ? (t("missions_scan") || "SCANNING") : "LIVE"}
                    </span>
                  </span>
                ) : null}
              </div>

              {missions.length === 0 ? (
                <div className="flex flex-col items-center text-center py-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    {signalScan
                      ? (t("missions_scan") || "SCANNING FOR SIGNAL...")
                      : (t("missions_empty") || "NO ACTIVE MISSIONS")}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeMissions.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 px-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-300">LIVE RUNS</span>
                        <span className="ml-auto rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-[8px] font-black tracking-widest text-emerald-300">{activeMissions.length}</span>
                      </div>
                      <AnimatePresence mode="popLayout">
                        {activeMissions.map((m) => renderMissionCard(m))}
                      </AnimatePresence>
                    </div>
                  )}

                  {unpaidMissions.length > 0 && (
                    <div className="pt-3 border-t border-red-500/20">
                      <div className="flex items-center gap-2 mb-2.5 px-1">
                        <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-red-300">
                          UNPAID RUNS
                        </span>
                        <span className="ml-auto rounded-full bg-red-500/20 border border-red-500/40 px-2 py-0.5 text-[8px] font-black tracking-widest text-red-300">
                          {unpaidMissions.length}/{missions.length}
                        </span>
                      </div>
                      <AnimatePresence mode="popLayout">
                        {unpaidMissions.map((m) => renderMissionCard(m))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>

          {/* 4. History (completed & paid threads) */}
          {historyOffers.length > 0 && (
            <div className="w-full">
              <div className="tn-light relative w-full rounded-3xl bg-white/[0.05] backdrop-blur-3xl border border-emerald-500/20 p-5 shadow-[0_8px_32px_rgba(34,211,238,0.05)] transition-all">
                <div className="flex items-center gap-3 pb-4 mb-5 border-b border-emerald-900/30">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                    <HistoryIcon className="w-4 h-4 text-emerald-300" />
                  </span>
                  <h3 className="text-xs font-black tracking-[0.2em] uppercase text-emerald-100">
                    HISTORY
                  </h3>
                  <span className="ml-auto text-[8px] font-black tracking-widest text-slate-500 uppercase">
                    {historyOffers.length} completed
                  </span>
                </div>
                <div className="space-y-3">
                  {historyOffers.map((h) => {
                    const owner = lobbyOwner(h);
                    const pic = ownerPic(h) || null;
                    const totalRuns = h.selectedDungeons
                      ? (Object.values(h.selectedDungeons) as number[]).reduce((a, b) => a + b, 0)
                      : h.runsCount || 1;
                    return (
                      <motion.div
                        key={String(h.id)}
                        whileHover={{ x: 5 }}
                        onClick={() => router.push(`/manage/${String(h.id)}`)}
                        className="tn-light relative w-full rounded-2xl border border-emerald-500/20 overflow-hidden flex items-center gap-3 px-4 py-3 cursor-pointer group hover:border-emerald-400/40 hover:shadow-[0_0_24px_rgba(16,185,129,0.12)] transition-all"
                      >
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/50">
                          {pic ? (
                            <img src={pic} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-[10px] font-black text-emerald-300/60 uppercase">
                              {String(ownerName(h) || "?").slice(0, 1)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black uppercase tracking-wide text-white">
                            {h.title || `${totalRuns}× Run`}
                          </p>
                          <p className="truncate text-[9px] font-bold uppercase tracking-widest text-gray-500">
                            {ownerName(h)}
                            {h.serverRegion ? ` · ${String(h.serverRegion).toUpperCase()}` : ""}
                          </p>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-1">
                          {Number(h.pricePerRun) > 0 && (
                            <span className="text-[10px] font-black text-amber-300">
                              {Number(h.pricePerRun).toFixed(2)}M
                            </span>
                          )}
                          <span className="px-2 py-1 rounded-full text-[7px] font-black uppercase tracking-widest border border-emerald-400/40 bg-emerald-500/15 text-emerald-300">
                            Completed ✓ Paid
                          </span>
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

      {/* ── OFFER NOTIFICATION POPOVER — detached from the scrolling tabs ── */}
      {typeof document !== "undefined" && showNotificationSettings && muteButtonRef.current && createPortal(
        (() => {
          const rect = muteButtonRef.current!.getBoundingClientRect();
          const width = 256;
          const left = Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12));
          const opensUpward = rect.top >= 280;
          return (
            <div
              style={{ position: "fixed", left, top: opensUpward ? rect.top - 12 : rect.bottom + 12, transform: opensUpward ? "translateY(-100%)" : undefined, zIndex: 10000, width }}
              className="rounded-2xl border border-cyan-500/25 bg-[#080d21]/95 p-3 shadow-[0_18px_48px_rgba(0,0,0,0.6)] backdrop-blur-xl"
            >
              <p className="px-1 pb-2 text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">Offer notifications</p>
              <button
                type="button"
                onClick={() => {
                  const mutedAll = !offerNotificationSettings.mutedAll;
                  if (!mutedAll && typeof Notification !== "undefined" && Notification.permission === "default") void Notification.requestPermission();
                  void saveOfferNotificationSettings({ ...offerNotificationSettings, mutedAll });
                }}
                className={`mb-2 flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-all ${offerNotificationSettings.mutedAll ? "border-red-500/40 bg-red-500/10 text-red-200" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"}`}
              >
                <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest">{offerNotificationSettings.mutedAll ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}{offerNotificationSettings.mutedAll ? "All offers muted" : "All offers enabled"}</span>
                <span className="text-[8px] font-bold">{offerNotificationSettings.mutedAll ? "Enable" : "Mute"}</span>
              </button>
              <div className="space-y-1 border-t border-white/10 pt-2">
                {OFFER_NOTIFICATION_CATEGORIES.map((category) => {
                  const muted = offerNotificationSettings.mutedCategories.includes(category);
                  return <button type="button" key={category} onClick={() => toggleOfferCategoryMute(category)} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-[9px] font-black uppercase tracking-widest transition-colors ${muted ? "text-red-300 hover:bg-red-500/10" : "text-slate-300 hover:bg-white/5"}`}><span>{category === "pvp" ? "PvP" : `${category}s`}</span>{muted ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5 text-emerald-400" />}</button>;
                })}
              </div>
            </div>
          );
        })(),
        document.body
      )}

      {/* ── HOVER PROFILE CARD (portal — floats above everything) ── */}
      {typeof document !== "undefined" && hoverCard && hoverCard.rect && hoverCard.owner && hoveredUserId === hoverCard.userId && (
        createPortal(
          (() => {
            const rect = hoverCard.rect!;
            const owner = hoverCard.owner;
            const cardPic = hoverCard.pic;
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const popW = Math.min(380, vw - 20);
            const spaceAbove = rect.top;
            const showAbove = spaceAbove > vh * 0.38;
            const left = Math.max(10, Math.min(rect.left - 20, vw - popW - 10));
            const top = showAbove ? Math.max(10, rect.top - 12) : Math.min(vh - 12, rect.bottom + 12);
            const oid = String(owner.id || "");
            const friendStatus = oid ? getFriendStatus(oid) : "none";
            const hDisplayName = owner ? resolveProfileDisplayName(owner) : ownerName(owner);
            const hNameColor = owner ? resolveNameColor(owner) : null;
            const hAvatar = owner ? resolveProfileImage(owner) || cardPic || "" : cardPic || "";
            const hEffect = owner ? effectiveAvatarEffect(owner, owner.effect) : "none";
            const hBanner = resolveProfileBanner(owner) || "";
            const hint = hAvatar ? isAnimatedImageUrl(hAvatar) : false;
            return (
              <div
                style={{ position: "fixed", top, left, width: popW, transform: showAbove ? "translateY(-100%)" : undefined, zIndex: 9999 }}
                className="tn-light relative bg-[#080810] border border-white/10 rounded-[1.5rem] shadow-[0_32px_100px_rgba(0,0,0,0.8)] overflow-hidden pointer-events-auto w-[380px] max-w-[calc(100vw-20px)]"
                onMouseEnter={cancelHide}
                onMouseLeave={scheduleHide}
              >
                {/* Banner — full card width */}
                <div className="relative h-28 w-full bg-[#080810]">
                  {hBanner ? (
                    <img
                      src={hBanner}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080810] via-[#080810]/20 to-transparent pointer-events-none" />
                </div>

                {/* Avatar + name */}
                <div className="px-5 -mt-10 relative z-10 flex items-end gap-3">
                  <div
                    className={`rounded-full overflow-hidden border-[3px] border-[#080810] shadow-[0_0_24px_rgba(255,0,127,0.25)] bg-black shrink-0 ${hint && hEffect === "none" ? "ring-1 ring-purple-500/30" : ""}`}
                    style={{ width: 72, height: 72 }}
                  >
                    {hAvatar ? (
                      <img src={hAvatar} alt="" className={profileImgClass(hAvatar, "w-full h-full rounded-full")} onError={(e) => { (e.currentTarget as HTMLImageElement).src = cardPic || ""; }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Users className="w-6 h-6 text-gray-600" /></div>
                    )}
                  </div>
                  <div className="pb-1 flex-1 min-w-0">
                    <h3 className="text-base font-black text-white uppercase truncate leading-tight" style={hNameColor ? { ...toNameStyle(hNameColor), textShadow: `0 0 14px ${nameGlowColor(hNameColor)}77` } : undefined}>
                      {hDisplayName}
                    </h3>
                    <RankBadge
                      stats={owner?.stats}
                      ratings={owner?.ratings}
                      rankOverride={owner?.rankOverride}
                    />
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {owner?.team?.name && (
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-purple-500/40 bg-purple-500/10 text-purple-400">
                          {owner.team.name}
                        </span>
                      )}
                      {Array.isArray(owner?.team?.members) && owner.team.members.length > 0 && (
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-cyan-500/40 bg-cyan-500/10 text-cyan-400">
                          {1 + owner.team.members.filter((m: any) => m.status !== "pending").length}/4 squad
                        </span>
                      )}
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-[#5865F2]/40 bg-[#5865F2]/10 text-[#8ea1ff]">
                        Discord: {owner?.username ? `@${owner.username}` : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-4 pt-2">
                  {oid === meId ? (
                    <p className="text-center text-[10px] text-gray-500 font-bold uppercase tracking-widest py-1">
                      Your profile
                    </p>
                  ) : (
                    <>
                      {friendStatus === "pending_received" && (
                        <div className="flex gap-2 mb-3">
                          <button
                            type="button"
                            onClick={() => { const f = friends.find((fs: any) => (fs.requester === oid && fs.target === meId)); if (f) handleFriendAccept(f.id); }}
                            className="flex-1 py-2 bg-green-500/15 text-green-400 border border-green-500/35 rounded-xl hover:bg-green-500 hover:text-black transition text-[9px] font-black uppercase tracking-widest"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => { const f = friends.find((fs: any) => (fs.requester === oid && fs.target === meId)); if (f) handleFriendDecline(f.id); }}
                            className="flex-1 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500 hover:text-white transition text-[9px] font-black uppercase tracking-widest"
                          >
                            Decline
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-center gap-8 py-1.5">
                        <div className="flex flex-col items-center gap-0.5" title={`${getMutualFriendsCount(oid)} mutual friends`}>
                          <Users className="w-4 h-4 text-[#00ffff]" />
                          <span className="text-[10px] font-black text-white tabular-nums">
                            {getMutualFriendsCount(oid)}
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={isUserBlocked(oid)}
                          onClick={() => openDm(oid)}
                          title="Send message"
                          className="flex items-center gap-1.5 text-[#ff007f] hover:scale-110 transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Message</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleBlock(oid)}
                          title={isUserBlocked(oid) ? "Unblock" : "Block"}
                          className={`flex items-center gap-1.5 hover:scale-110 transition ${
                            isUserBlocked(oid) ? "text-yellow-400" : "text-red-400"
                          }`}
                        >
                          <Ban className="w-4 h-4" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Block</span>
                        </button>
                      </div>

                      <div className="mt-2">
                        {friendStatus === "friends" && (
                          <button
                            type="button"
                            onClick={() => unfriend(oid)}
                            className="group/fbtn w-full flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl border bg-[#1877f2]/20 border-[#1877f2]/40 text-[#5b9eff] text-[9px] font-black uppercase tracking-widest hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400 transition-all"
                          >
                            <UserCheck className="w-3 h-3 group-hover/fbtn:hidden" />
                            <UserMinus className="w-3 h-3 hidden group-hover/fbtn:inline-block" />
                            <span className="group-hover/fbtn:hidden">Friends</span>
                            <span className="hidden group-hover/fbtn:inline">Unfriend</span>
                          </button>
                        )}
                        {friendStatus === "none" && (
                          <button
                            type="button"
                            disabled={isUserBlocked(oid)}
                            onClick={() => sendFriendRequest(oid)}
                            className="w-full flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-[#00ffff]/15 border border-[#00ffff]/35 text-[#00ffff] text-[9px] font-black uppercase tracking-widest hover:bg-[#00ffff]/30 transition disabled:opacity-40"
                          >
                            <UserPlus className="w-3 h-3" /> Add Friend
                          </button>
                        )}
                        {friendStatus === "pending_sent" && (
                          <span className="w-full flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[9px] font-black uppercase tracking-widest">
                            Pending
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })(),
          document.body
        )
      )}

      {/* ── AUTO-APPLY SETTINGS MODAL ── */}
      <AionAutoApplyModal
        registeredUsers={registeredUsers}
        meId={meId}
        meName={meName || ""}
        onSave={saveAutoApply}
      />

    </div>
  );
}
