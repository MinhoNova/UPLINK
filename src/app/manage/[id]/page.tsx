"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, CheckCircle2, Bell } from "lucide-react";
import { useSession } from "next-auth/react";
import { LiveKitRoom, RoomAudioRenderer, useTracks, useLocalParticipant } from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";
import { PageContext, usePage } from "@/contexts/PageContext";
import { useThemePreference } from "@/hooks/useThemePreference";
import { useI18n } from "@/i18n/i18n";
import AutoAcceptTimer, { AUTO_ACCEPT_DURATION_MS } from "@/components/AutoAcceptTimer";
import LongPressButton from "@/components/LongPressButton";
import SecretClubCard from "@/components/SecretClubCard";
import ClassRoleIcons from "@/components/ClassRoleIcons";
import InviteTimer from "@/components/InviteTimer";
import OfferThreadSelect from "@/components/OfferThreadSelect";
import HoverStarRating from "@/components/HoverStarRating";
import PaymentModal from "@/components/modals/PaymentModal";
import ManageModal from "@/components/modals/ManageModal";
import { acceptedExcludingMember, appendOfferFamilyMessage, cancelLobbyInvite, canOwnerCancelLobby, confirmApplicantJoin, getOfferFamilyMessages, getViewableOfferThreads, inviteApplicantToLobby, isEmbeddedFootArchive, isLevelingOffer, isVoiceLobbyOpen, memberIdentityKey, mergeLobbiesFromServer, repairLobbyRoles, resolveOpenMissionThreadTarget, splitLobbyAfterMemberExit, userCanAccessVoice, userCanViewOfferThread, userIsActiveInOtherDungeonOffer, withdrawUserFromAllLobbies } from "@/lib/lobbyLifecycle";
import { effectiveAvatarEffect, effectiveProfileGif, isSecretClubTier, mergeRegisteredUsersFromServer, resolveNotificationRecipient } from "@/lib/userProfile";
import { resolveProfileDisplayName, resolveProfileImage } from "@/lib/profileImage";
import { sanitizeApplicantNote } from "@/lib/applicantNote";

const EFFECTS: Record<string, string> = { none: "", electric_circle: "" };
const EFFECT_IMG: Record<string, string> = {};

const DUNGEONS = [
  { name: "Krao Cave", img: "/classes/Krao Cave.webp", short: "KC" },
  { name: "Draupnir", img: "/classes/Draupnir.webp", short: "DR" },
  { name: "Urugugu Canyon", img: "/classes/Urugugu Canyon.webp", short: "UC" },
  { name: "Vakron's Floating Island", img: "/classes/Vakron.webp", short: "VF" },
  { name: "Fire Temple", img: "/classes/Fire Temple.webp", short: "FT" },
  { name: "Ferocious Horn Den", img: "/classes/Ferocious Horn Den.webp", short: "FHD" },
  { name: "Dead Dramata's Nest", img: "/classes/Dead Dramata's Nest.webp", short: "DDN" },
  { name: "Abyssal Forge: Ludra", img: "/classes/Ludra.webp", short: "LU" },
];

const CLASS_ROLE_OPTIONS: Record<string, string[]> = {
  Templar: ["tank", "dps"],
  Gladiator: ["dps", "tank"],
  Assassin: ["dps"],
  Ranger: ["dps"],
  Sorcerer: ["dps"],
  Spiritmaster: ["dps", "healer"],
  Chanter: ["dps", "healer", "tank"],
  Cleric: ["healer", "dps"],
  Gunner: ["dps"],
  Aethertech: ["dps", "tank"],
  Songweaver: ["dps", "healer"],
};

const WOW_CLASS_GROUPS: Record<string, string[]> = {
  Warrior: ["Templar", "Gladiator"],
  Scout: ["Assassin", "Ranger"],
  Mage: ["Sorcerer", "Spiritmaster"],
  Priest: ["Chanter", "Cleric"],
  Techist: ["Gunner", "Aethertech", "Songweaver"],
};

/* ---------- VoiceRoomContent (LiveKit) ---------- */
const VoiceRoomContent = ({ roomName, onDisconnect, inline, users, currentUserId, currentUserAvatar }: { roomName: string; onDisconnect: () => void; inline?: boolean; users?: any[]; currentUserId?: string; currentUserAvatar?: string }) => {
  const tracks = useTracks([Track.Source.Microphone]);
  const { localParticipant } = useLocalParticipant();
  const [isMuted, setIsMuted] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [showDevices, setShowDevices] = useState(false);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((d) => {
      setDevices(d.filter((device) => device.kind === "audioinput"));
    });
  }, []);

  const toggleMute = () => {
    localParticipant.setMicrophoneEnabled(isMuted);
    setIsMuted(!isMuted);
  };

  const switchDevice = async (deviceId: string) => {
    await localParticipant.setMicrophoneEnabled(true, { deviceId });
    setShowDevices(false);
  };

  const [isDeafened, setIsDeafened] = useState(false);
  const userMap = useMemo(() => {
    const map = new Map<string, any>();
    (users || []).forEach((u: any) => {
      if (u.id) map.set(String(u.id), u);
      if (u.username) map.set(u.username.toLowerCase(), u);
      if (u.name) map.set(u.name.toLowerCase(), u);
      if (u.displayName) map.set(u.displayName.toLowerCase(), u);
    });
    return map;
  }, [users]);

  const toggleDeafen = () => {
    const newValue = !isDeafened;
    setIsDeafened(newValue);
    tracks.forEach((t) => {
      if (!t.participant.isLocal) (t.participant as any).setVolume?.(newValue ? 0 : 1);
    });
  };

  useEffect(() => {
    if (isDeafened) {
      tracks.forEach((t) => {
        if (!t.participant.isLocal) (t.participant as any).setVolume?.(0);
      });
    }
  }, [tracks]);

  return inline ? (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3">
        {tracks.map((t: any) => {
          const pid = String(t.participant.identity);
          const pUser = userMap.get(pid) || userMap.get(pid.toLowerCase());
          const isSelf = pid === currentUserId;
          const pAvatar = isSelf && currentUserAvatar ? pUser?.profileGif || currentUserAvatar : pUser?.profileGif || pUser?.avatar || pUser?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${pid}`;
          return (
            <div key={t.participant.sid} className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full border-2 transition-all duration-300 overflow-hidden ${t.participant.isSpeaking ? "border-[#00ffff] shadow-[0_0_8px_#00ffff]" : "border-white/10"}`}>
                <img src={pAvatar} alt={pid} className="w-full h-full object-cover" onError={(e: any) => { if (e.target.src.includes("dicebear")) return; e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${pid}`; }} />
              </div>
              <span className="text-[7px] font-bold text-gray-400 truncate max-w-[60px] text-center leading-none">{pUser?.displayName || pUser?.name || "Player"}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-1.5">
        <div className="relative">
          <button onClick={() => setShowDevices(!showDevices)} className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <span className="text-[8px] font-black">DEV</span>
          </button>
          {showDevices && (
            <div className="absolute bottom-full right-0 mb-2 w-56 bg-black border border-white/10 rounded-xl p-2 shadow-2xl z-[1001]">
              <p className="text-[7px] font-black uppercase tracking-widest text-gray-500 p-1.5 border-b border-white/5 mb-1">Input Devices</p>
              <div className="space-y-0.5 max-h-36 overflow-y-auto custom-scrollbar">
                {devices.map((d) => (
                  <button key={d.deviceId} onClick={() => switchDevice(d.deviceId)} className="w-full text-left p-1.5 rounded-lg hover:bg-[#00ffff]/10 hover:text-[#00ffff] transition-all text-[8px] font-bold truncate flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 shrink-0" /> {d.label || `Mic ${d.deviceId.slice(0, 5)}`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <button onClick={toggleMute} className={`p-1.5 rounded-lg border transition-all ${isMuted ? "bg-red-500/20 border-red-500/40 text-red-500" : "bg-white/5 border-white/10 text-white hover:bg-white/10"}`}>
          <span className="text-[8px] font-black">{isMuted ? "MUT" : "MIC"}</span>
        </button>
        <button onClick={toggleDeafen} className={`p-1.5 rounded-lg border transition-all ${isDeafened ? "bg-red-500/20 border-red-500/40 text-red-500" : "bg-white/5 border-white/10 text-white hover:bg-white/10"}`}>
          <span className="text-[8px] font-black">{isDeafened ? "DEAF" : "SND"}</span>
        </button>
        <button onClick={onDisconnect} className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all">
          <Plane className="w-3 h-3" />
        </button>
      </div>
    </div>
  ) : (
    <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-0 left-0 right-0 z-[1000] bg-black/80 backdrop-blur-2xl border-t border-white/10 px-8 py-3 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-4 w-1/4">
        <div className="w-10 h-10 rounded-xl bg-[#00ffff]/10 flex items-center justify-center border border-[#00ffff]/20">
          <span className="w-5 h-5 text-[#00ffff] animate-pulse">RADIO</span>
        </div>
        <div className="hidden sm:block">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Connected</h3>
          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest truncate max-w-[150px]">{roomName}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 overflow-x-auto px-4 no-scrollbar">
        {tracks.map((t: any) => (
          <div key={t.participant.sid} className="relative group">
            <div className={`w-10 h-10 rounded-full border-2 transition-all duration-300 ${t.participant.isSpeaking ? "border-[#00ffff] shadow-[0_0_15px_#00ffff]" : "border-white/10"}`}>
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${t.participant.identity}`} alt={t.participant.identity} className="w-full h-full rounded-full object-cover" />
            </div>
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black border border-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              {t.participant.identity}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 w-1/4 justify-end relative">
        <div className="relative">
          <button onClick={() => setShowDevices(!showDevices)} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <span className="w-4 h-4">DEV</span>
          </button>
          {showDevices && (
            <div className="absolute bottom-full right-0 mb-4 w-64 bg-black border border-white/10 rounded-2xl p-2 shadow-2xl z-[1001]">
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-500 p-2 border-b border-white/5 mb-2">Input Devices</p>
              <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                {devices.map((d) => (
                  <button key={d.deviceId} onClick={() => switchDevice(d.deviceId)} className="w-full text-left p-2 rounded-xl hover:bg-[#00ffff]/10 hover:text-[#00ffff] transition-all text-[9px] font-bold truncate flex items-center gap-2">
                    <span className="w-3 h-3 shrink-0" /> {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <button onClick={toggleDeafen} className={`p-2.5 rounded-xl border transition-all ${isDeafened ? "bg-red-500/20 border-red-500/40 text-red-500" : "bg-white/5 border-white/10 text-white hover:bg-white/10"}`}>
          <span className="w-4 h-4">{isDeafened ? "DEAF" : "SND"}</span>
        </button>
        <button onClick={toggleMute} className={`p-2.5 rounded-xl border transition-all ${isMuted ? "bg-red-500/20 border-red-500/40 text-red-500" : "bg-white/5 border-white/10 text-white hover:bg-white/10"}`}>
          <span className="w-4 h-4">{isMuted ? "MUT" : "MIC"}</span>
        </button>
        <button onClick={onDisconnect} className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)]">
          <Plane className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

/* ---------- InteractivePartyCard ---------- */
const InteractivePartyCard = ({ role, accepted, visual, AvatarComponent, hideIdentity, onAvatarClick, userData }: { role: string; accepted: any; visual: any; AvatarComponent: any; hideIdentity?: boolean; onAvatarClick?: (user: any) => void; userData?: any }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  return (
    <div className="w-24 h-32 p-1.5 cursor-pointer relative" style={{ perspective: 1000 }} onClick={() => setIsFlipped(!isFlipped)}>
      <motion.div className="relative w-full h-full" animate={{ rotateY: isFlipped ? 180 : 0 }} transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }} style={{ transformStyle: "preserve-3d" }}>
        <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-black/20 border border-white/10 rounded-2xl shadow-lg" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
          <img src={`/classes/${role.toUpperCase()}.svg`} className="w-12 h-12 object-contain mb-1" />
          {accepted && <span className="text-[9px] uppercase font-black text-green-400 mt-1 tracking-widest animate-pulse">INVITED</span>}
        </div>
        <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-black/20 border border-[#ff007f]/50 rounded-2xl p-1.5 shadow-[0_0_20px_rgba(255,0,127,0.3)]" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
          {accepted ? (
            <>
              {hideIdentity ? (
                <div className="w-full h-full flex items-center justify-center overflow-hidden">
                  <SecretClubCard variant="compact" />
                </div>
              ) : (
                <>
                  <div className="mb-0.5 flex justify-center">
                    <ClassRoleIcons className={(accepted.class || accepted.aionClass || "DPS").toUpperCase()} role={role} size={24} overlap={8} />
                  </div>
                  {isFlipped && AvatarComponent && (
                    <div onClick={(e) => { e.stopPropagation(); if (onAvatarClick && userData) onAvatarClick(userData); }}>
                      <AvatarComponent src={visual?.avatar || accepted.avatar} effect={visual?.effect} fallbackName={accepted.applicantName || accepted.raiderName || "Operative"} className="w-10 h-10 rounded-full border-2 border-[#ff007f] object-cover mb-0.5" userId={accepted.applicantId || accepted.userId} />
                    </div>
                  )}
                  <span className="text-[8px] font-black text-white truncate w-full text-center uppercase">{accepted.applicantName || accepted.raiderName}</span>
                  <span className="text-[#00ffff] font-bold text-[7px]">LVL {(accepted.level || accepted.applicantLevel || "60")}</span>
                </>
              )}
            </>
          ) : (
            <span className="text-[10px] text-white/50 uppercase font-black tracking-widest">Open</span>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default function ManagePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const lobbyId = String(params?.id || "");

  const { t } = useI18n();
  const { theme, setTheme } = useThemePreference();
  const { data: session, status } = useSession();

  const [lobbies, setLobbies] = useState<any[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [bannedUsers, setBannedUsers] = useState<string[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [toasts, setToasts] = useState<any[]>([]);
  const [voiceToken, setVoiceToken] = useState<string | null>(null);
  const [voiceServerUrl, setVoiceServerUrl] = useState<string | null>(null);
  const [isJoiningVoice, setIsJoiningVoice] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [chatMessage, setChatMessage] = useState("");
  const [chatImagePreview, setChatImagePreview] = useState<string | null>(null);
  const [reportScamTarget, setReportScamTarget] = useState<any>(null);
  const [activeMemberAction, setActiveMemberAction] = useState<any>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [ratePickerData, setRatePickerData] = useState<any>(null);
  const [ratingModalData, setRatingModalData] = useState<any>(null);
  const [electricColor, setElectricColor] = useState(0);
  const [myEffect] = useState("none");
  const registryRef = useRef<any[]>([]);
  registryRef.current = registeredUsers;

  const voiceJoinInFlight = useRef(false);
  const voiceJoinCooldownUntil = useRef(0);
  const splitInFlightRef = useRef(false);
  const autoAcceptBusyRef = useRef(false);
  const hasFetchedRef = useRef(false);
  const knownLobbyIds = useRef<Set<string>>(new Set());

  const currentUserId = (session?.user as any)?.id || "guest";
  const currentUserDisplay = useMemo(() => {
    const me = registeredUsers.find((u: any) => String(u.id) === String(currentUserId));
    return resolveProfileDisplayName(me, session?.user?.name || "Guest");
  }, [registeredUsers, currentUserId, session?.user?.name]);
  const currentUserDiscordHandle = (session?.user as any)?.username || "";
  const isAdmin = currentUserDiscordHandle === "minhonovazen" || currentUserId === "1497295886223544471";
  const myVfxBg = useMemo(() => registeredUsers.find((u: any) => u.id === currentUserId)?.activeVfx, [registeredUsers, currentUserId]);

  const targetLobby = useMemo(() => {
    return lobbies.find((l: any) => String(l.id) === String(lobbyId)) || lobbies.find((l: any) => String(l.id)?.endsWith(`-${lobbyId}`)) || null;
  }, [lobbies, lobbyId]);

  /* ----- DATA LOADING (mirror old page) ----- */
  useEffect(() => {
    if (!currentUserId || currentUserId === "guest") return;
    let cancelled = false;
    const load = () => {
      if (cancelled) return;
      fetch("/api/data", { credentials: "include" })
        .then((r) => r.json())
        .then((d) => {
          if (cancelled) return;
          if (Array.isArray(d.lobbies)) {
            const ready = (d.lobbies || []).map(repairLobbyRoles);
            setLobbies((prev) => mergeLobbiesFromServer(ready, prev.map(repairLobbyRoles), currentUserId, splitInFlightRef.current || autoAcceptBusyRef.current).map(repairLobbyRoles));
            if (hasFetchedRef.current && ready.length) {
              const others = ready.filter((l: any) => String(l.ownerId) !== String(currentUserId));
              const currentIds = new Set<string>(others.map((l: any) => String(l.id)));
              const newIds = Array.from(currentIds).filter((id: string) => !knownLobbyIds.current.has(id));
              knownLobbyIds.current = new Set([...knownLobbyIds.current, ...currentIds]);
              if (newIds.length) addToast("New offer available!", "info");
            } else if (ready.length) {
              hasFetchedRef.current = true;
              knownLobbyIds.current = new Set(ready.filter((l: any) => String(l.ownerId) !== String(currentUserId)).map((l: any) => String(l.id)));
            }
          }
          if (d.registeredUsers) setRegisteredUsers((prev) => mergeRegisteredUsersFromServer(d.registeredUsers, prev, currentUserId, false));
          if (Array.isArray(d.notifications)) setNotifications(d.notifications);
          if (Array.isArray(d.bannedUsers)) setBannedUsers(d.bannedUsers);
          if (Array.isArray(d.friends)) setFriends(d.friends);
        })
        .catch(() => {});
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
  }, [currentUserId]);

  /* ----- TOAST / SOUND / SAVE ----- */
  const addToast = (msg: string, type: "success" | "error" | "info" = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [{ id, msg, type }, ...prev]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 5000);
  };

  const playSound = (type: "notify" | "reward" | "terminal" | "error") => {
    const audios: Record<string, string> = {
      notify: "https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3",
      reward: "https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3",
      terminal: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
      error: "https://assets.mixkit.co/active_storage/sfx/2360/2360-preview.mp3",
    };
    const audio = new Audio(audios[type]);
    audio.volume = type === "reward" ? 0.5 : 0.3;
    audio.play().catch(() => {});
  };

  const saveGlobalData = useCallback(async (updates: any) => {
    const hasProfileUpdate = Boolean(updates?.registeredUsers && currentUserId && updates.registeredUsers.some((u: any) => String(u.id) === String(currentUserId)));
    if (hasProfileUpdate) {
      const self = updates.registeredUsers.find((u: any) => String(u.id) === String(currentUserId));
      if (self) {
        await fetch("/api/users/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ profile: self }) }).catch(() => {});
      }
    }
    const { registeredUsers: _ru, ...rest } = updates || {};
    const restKeys = Object.keys(rest);
    if (restKeys.length === 0) { window.dispatchEvent(new CustomEvent("data-refresh")); return; }
    const res = await fetch("/api/data", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(rest) }).catch(() => null);
    window.dispatchEvent(new CustomEvent("data-refresh"));
    if (res && !res.ok) { const err = await res.json().catch(() => ({})); if (err.error) addToast(err.error, "error"); }
  }, [currentUserId]);

  /* ----- CONTEXT HELPERS ----- */
  const getUserTier = useCallback((userId?: any): "free" | "secret_club" => {
    return "secret_club";
  }, []);

  const getUserTierLabel = (userId?: any) => {
    const tier = getUserTier(userId);
    if (tier === "secret_club") return { label: "CLUB", color: "text-yellow-400 border-yellow-500/50 bg-yellow-500/20" };
    return null;
  };

  const isUserHidden = (userId?: any) => {
    if (!userId || String(userId) === String(currentUserId)) return false;
    const user = registeredUsers.find((u: any) => String(u.id) === String(userId));
    return getUserTier(userId) === "secret_club" && user?.hiddenIdentity === true;
  };

  const getVfxSettings = (user: any) => user?.vfxSettings || { showOnBanner: true, showOnOngoing: true, showOnModal: true };

  const renderDualColorName = (name: string) => {
    if (!name) return <span className="text-[#00ffff]">Unknown</span>;
    const parts = name.split(" ");
    if (parts.length > 1) return <><span className="text-[#00ffff]">{parts[0]}</span> <span className="text-[#ff007f]">{parts.slice(1).join(" ")}</span></>;
    const mid = Math.floor(name.length / 2);
    return <><span className="text-[#00ffff]">{name.slice(0, mid)}</span><span className="text-[#ff007f]">{name.slice(mid)}</span></>;
  };

  const getFriendStatus = (userId2: string) => {
    const entry = friends.find((f: any) => (f.requester === currentUserId && f.target === userId2) || (f.requester === userId2 && f.target === currentUserId));
    if (!entry) return "none";
    if (entry.status === "accepted") return "friends";
    if (entry.status === "pending" && entry.requester === currentUserId) return "pending_sent";
    if (entry.status === "pending" && entry.target === currentUserId) return "pending_received";
    return "none";
  };

  const isUserBlocked = (userId2: string) => {
    const me = registeredUsers.find((u: any) => String(u.id) === String(currentUserId));
    return !!me?.blocked?.includes(String(userId2));
  };

  const resolveUserVisual = (identifier?: string, userId?: string) => {
    const lookup = (identifier || "").toLowerCase().trim();
    const matched = registeredUsers.find((u: any) => {
      const byId = userId && String(u.id || "").toLowerCase() === String(userId).toLowerCase();
      const byName = (u.name || "").toLowerCase() === lookup;
      const byHandle = (u.username || "").toLowerCase() === lookup;
      return byId || byName || byHandle;
    });
    if (matched) return { avatar: matched.customAvatar || matched.profileGif || matched.avatar || "", effect: effectiveAvatarEffect(matched, matched.effect || "none") };
    return { avatar: "", effect: "none" };
  };

  const resolveMemberVisual = (member: any) => {
    const directEffect = member?.applicantEffect || member?.effect || "none";
    const memberUser = registeredUsers.find((u: any) => String(u.id) === String(member?.applicantId || member?.userId || ""));
    if (memberUser) return { avatar: resolveProfileImage(memberUser), effect: effectiveAvatarEffect(memberUser, memberUser.effect || directEffect) };
    const directAvatar = member?.applicantAvatar || member?.avatar || "";
    if (directAvatar) return { avatar: directAvatar, effect: directEffect };
    const lookup = [member?.discordName, member?.applicantName, member?.name, member?.applicantId].filter(Boolean).map((v: any) => String(v).toLowerCase().trim());
    const matched = registeredUsers.find((u: any) => { const id = String(u.id || "").toLowerCase(); const uname = String(u.username || "").toLowerCase(); const name = String(u.name || "").toLowerCase(); return lookup.includes(id) || lookup.includes(uname) || lookup.includes(name); });
    return { avatar: matched ? resolveProfileImage(matched) : "", effect: matched ? effectiveAvatarEffect(matched, matched.effect || directEffect) : directEffect };
  };

  const resolveChatIdentity = useCallback((userId?: string, stored?: { from?: string; fromAvatar?: string; fromHandle?: string }) => {
    const user = userId ? registeredUsers.find((u: any) => String(u.id) === String(userId)) : null;
    if (user) return { name: resolveProfileDisplayName(user, stored?.from || "Operative"), avatar: resolveProfileImage(user, user.name || "U") || stored?.fromAvatar || "" };
    const lookup = (stored?.fromHandle || stored?.from || "").toLowerCase().trim();
    if (lookup) {
      const matched = registeredUsers.find((u: any) => String(u.id || "").toLowerCase() === lookup || (u.name || "").toLowerCase() === lookup || (u.discordDisplayName || "").toLowerCase() === lookup);
      if (matched) return { name: resolveProfileDisplayName(matched, stored?.from || "Operative"), avatar: resolveProfileImage(matched, matched.name || "U") || stored?.fromAvatar || "" };
    }
    return { name: stored?.from || "Unknown", avatar: stored?.fromAvatar || "" };
  }, [registeredUsers]);

  /* ----- AvatarWithEffect ----- */
  const AvatarWithEffect = useMemo(() => {
    const C = ({ src, effect = "none", className = "", fallbackName = "Operative", userId }: { src: string; effect?: string; className?: string; fallbackName?: string; userId?: string }) => {
      const profileUser = userId ? registryRef.current.find((u: any) => String(u.id) === String(userId)) : null;
      const profileGif = effectiveProfileGif(profileUser);
      const displayEffect = profileUser ? effectiveAvatarEffect(profileUser, effect) : effect;
      const safeSrc = profileGif || (src?.trim() ? src : `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=0b1020&color=00ffff&size=256&bold=true`);
      return (
        <motion.div className={`relative flex-shrink-0 flex items-center justify-center transition-all ${className}`}>
          {displayEffect !== "none" && displayEffect !== "electric_circle" && EFFECT_IMG[displayEffect] ? (
            <div className="absolute inset-0 z-[5] flex items-center justify-center pointer-events-none">
              <div className="relative w-full h-full flex items-center justify-center">
                <img src={EFFECT_IMG[displayEffect]} className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_0_30px_rgba(255,215,0,0.4)]" />
                <div className="relative z-10 w-[60%] h-[60%] rounded-full overflow-hidden bg-black border-2 border-yellow-500/30 shadow-[0_0_15px_rgba(255,215,0,0.3)]">
                  <img src={safeSrc} className="w-full h-full object-cover rounded-full" alt="avatar" />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className={`absolute inset-[-4px] rounded-full z-0 transition-all duration-700 ${EFFECTS[displayEffect as keyof typeof EFFECTS]}`}></div>
              <div className="rounded-full relative z-10 bg-black w-full h-full flex overflow-hidden border-2 border-white/10 shadow-inner aspect-square">
                <img src={safeSrc} className="w-full h-full object-cover rounded-full" alt="avatar" />
              </div>
              {displayEffect === "electric_circle" && (
                <div className="absolute pointer-events-none rounded-full overflow-hidden" style={{ width: "calc(100% + 24px)", height: "calc(100% + 24px)", left: "-12px", top: "-12px", zIndex: 30 }}>
                  <iframe src={`/effects/electric-circle.html?color=${electricColor}`} className="w-full h-full border-0 pointer-events-none" />
                </div>
              )}
            </>
          )}
        </motion.div>
      );
    };
    return C;
  }, [electricColor]);

  /* ----- RATING ----- */
  const buildRatingTargets = useCallback((l: any) => {
    const uid = String(currentUserId);
    const isOwner = String(l.ownerId) === uid;
    const targets: { id: string; name: string; avatar: string; role: string }[] = [];
    if (!isOwner) {
      const idn = resolveChatIdentity(l.ownerId, { from: l.ownerDiscordName || l.ownerName || "Commander", fromAvatar: l.ownerImage || "" });
      targets.push({ id: String(l.ownerId), name: idn.name, avatar: idn.avatar, role: "COMMANDER" });
    }
    for (const a of l.accepted || []) {
      const aid = a.applicantId || a.userId;
      if (!aid || String(aid) === uid) continue;
      const idn = resolveChatIdentity(aid, { from: a.applicantName || a.name || "Operative", fromAvatar: a.applicantImage || "" });
      targets.push({ id: String(aid), name: idn.name, avatar: idn.avatar, role: "OPERATIVE" });
    }
    return targets;
  }, [currentUserId, resolveChatIdentity]);

  const openRatePicker = useCallback((l: any) => {
    const targets = buildRatingTargets(l);
    if (targets.length === 0) { addToast("No squad-mates to review here.", "info"); return; }
    const label = l.category === "leveling" ? `Leveling ${l.startLevel || "1"}-${l.endLevel || "80"}` : `${l.runsCount || 1}x ${l.keyLevel || "+10"}`;
    setRatePickerData({ lobbyId: l.id, missionTitle: label, targets });
  }, [buildRatingTargets, addToast]);

  const submitSquadRating = useCallback((rateeId: string, score: number) => {
    setRegisteredUsers((prev: any) => {
      const updated = [...prev];
      const uIdx = updated.findIndex((u: any) => String(u.id) === String(rateeId));
      if (uIdx !== -1) {
        const ratings = [...(updated[uIdx].ratings || []), score];
        updated[uIdx] = { ...updated[uIdx], ratings };
        saveGlobalData({ registeredUsers: updated });
      }
      return updated;
    });
    setRatingModalData(null);
    addToast(`Rating ${score.toFixed(1)} submitted ✓`, "success");
  }, [addToast, saveGlobalData]);

  /* ----- LOBBY ACTIONS ----- */
  const handleAccept = async (applicant: any) => {
    if (!targetLobby) return;
    const visual = resolveMemberVisual(applicant);
    const acceptedApplicant = {
      ...applicant,
      applicantAvatar: applicant.applicantAvatar || visual.avatar || "",
      applicantEffect: applicant.applicantEffect || visual.effect || "none",
      raiderRegion: String(applicant.raiderRegion || applicant.region || "").toLowerCase(),
      raiderRealm: applicant.raiderRealm || applicant.realm,
      raiderName: applicant.raiderName || applicant.name,
    };
    const ownerUser = registeredUsers.find((u: any) => String(u.id) === String(currentUserId));
    const isAuto = isSecretClubTier(ownerUser) && false;
    const instantJoin = isAuto && isLevelingOffer(targetLobby);
    const notifId = Date.now();
    let updated = lobbies.map((l) => {
      if (l.id === targetLobby.id) {
        if (instantJoin) return confirmApplicantJoin(l, acceptedApplicant);
        return inviteApplicantToLobby(l, acceptedApplicant, notifId);
      }
      return l;
    });
    updated = withdrawUserFromAllLobbies(updated, memberIdentityKey(acceptedApplicant), targetLobby.id, targetLobby);
    let newNotifications = notifications;
    if (!instantJoin) {
      const newNotif = {
        id: notifId,
        toUser: resolveNotificationRecipient(applicant, registeredUsers),
        fromUser: currentUserDisplay,
        fromHandle: currentUserDiscordHandle,
        fromAvatar: session?.user?.image,
        message: `Invited to ${targetLobby.title}!`,
        type: "lobby_accept",
        lobbyId: targetLobby.id,
        applicantId: applicant.id,
        applicantName: applicant.applicantName || applicant.name,
        applicantData: acceptedApplicant,
        inviteExpiresAt: Date.now() + 60000,
        timestamp: Date.now(),
      };
      newNotifications = [...notifications, newNotif];
    }
    setNotifications(newNotifications);
    setLobbies(updated);
    await saveGlobalData({ lobbies: updated, ...(instantJoin ? {} : { notifications: newNotifications }) });
    if (applicant.applicantId) {
      fetch("/api/discord/notify-invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lobbyId: targetLobby.id, notifId, applicantDiscordId: String(applicant.applicantId || applicant.userId) }) }).catch(() => {});
    }
    addToast(instantJoin ? `${applicant.name} auto-accepted!` : `${applicant.name} invited! 60s.`, "success");
  };

  const handleReject = (applicantId: number) => {
    if (!targetLobby) return;
    const updated = lobbies.map((l) => (l.id === targetLobby.id ? { ...l, applicants: l.applicants.filter((a: any) => a.id !== applicantId) } : l));
    setLobbies(updated);
    saveGlobalData({ lobbies: updated });
    addToast("Transmission terminated.", "info");
  };

  const handleSendMessage = (lobbyId: string) => {
    if (!chatMessage.trim() && !chatImagePreview) return;
    const lobby = lobbies.find((l) => l.id === lobbyId);
    if (!lobby) return;
    const newMsg = {
      id: Date.now(),
      from: currentUserDisplay,
      fromHandle: currentUserDiscordHandle,
      fromAvatar: session?.user?.image || "",
      fromEffect: myEffect,
      text: chatMessage,
      image: chatImagePreview,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    const updated = appendOfferFamilyMessage(lobbies, lobby, newMsg);
    const updatedTarget = updated.find((l: any) => l.id === lobbyId) || null;
    setLobbies(updated);
    saveGlobalData({ lobbies: updated });
    setChatMessage("");
    setChatImagePreview(null);
  };

  const handleUpdateLobby = async (updatedLobby: any) => {
    const prev = lobbies.find((l) => l.id === updatedLobby.id);
    let updated = lobbies.map((l) => (l.id === updatedLobby.id ? updatedLobby : l));
    const prevMsgs = prev?.messages || [];
    const nextMsgs = updatedLobby.messages || [];
    if (nextMsgs.length > prevMsgs.length) {
      for (const msg of nextMsgs.slice(prevMsgs.length)) {
        updated = appendOfferFamilyMessage(updated, updatedLobby, msg);
      }
      const synced = updated.find((l) => l.id === updatedLobby.id);
      if (synced) updatedLobby = synced;
    }
    setLobbies(updated);
    saveGlobalData({ lobbies: updated });
    addToast("Operation parameters updated.", "success");
  };

  /* ----- KICK / LEAVE ----- */
  const handleCancelMember = (member: any) => {
    if (!targetLobby || targetLobby.status !== "standby") return;
    const notifId = member.inviteNotifId;
    const updated = lobbies.map((l) => {
      if (l.id !== targetLobby.id) return l;
      if (member.status === "invited") return repairLobbyRoles(cancelLobbyInvite(l, member));
      return repairLobbyRoles({ ...l, accepted: acceptedExcludingMember(l.accepted || [], member) });
    });
    const updNotifs = notifId ? notifications.filter((n) => n.id !== notifId) : notifications;
    setLobbies(updated);
    if (notifId) setNotifications(updNotifs);
    saveGlobalData({ lobbies: updated, ...(notifId ? { notifications: updNotifs } : {}) });
    addToast(`${member.applicantName || member.name} removed.`, "info");
  };

  const handleLeaveLobby = (lobbyId: string) => {
    const lobby = lobbies.find((l) => l.id === lobbyId);
    if (lobby && lobby.status === "standby") {
      const member = lobby.accepted?.find((a: any) => memberIdentityKey(a) === String(currentUserId));
      if (member) {
        handleCancelMember(member);
        router.push("/");
        addToast("You left the group.", "info");
        return;
      }
    }
    setActiveMemberAction({ lobbyId, member: null, isKick: false });
  };

  const confirmLeaveOrKick = async (lobbyId: string, member: any, isKick: boolean, completed: number) => {
    const updatedUsers = [...registeredUsers];
    const lobby = lobbies.find((l) => l.id === lobbyId);
    if (!lobby) return;
    if (!member && !isKick) {
      member = lobby.accepted?.find((a: any) => memberIdentityKey(a) === String(currentUserId));
    }
    if (!member) return;
    const historySnapshot = completed > 0 ? { ...member, applicantId: memberIdentityKey(member), leftAt: Date.now(), runsAtExit: completed, reason: isKick ? "kicked" : "left" } : null;
    lobby.accepted.forEach((m: any) => {
      if (memberIdentityKey(m) === memberIdentityKey(member)) {
        const uIdx = updatedUsers.findIndex((u: any) => u.id === m.applicantId || u.username === m.applicantId);
        if (uIdx !== -1) {
          const stats = updatedUsers[uIdx].stats || { total: 0, k5: 0, k10: 0, k15: 0, k20: 0 };
          stats.total += Number(completed);
          updatedUsers[uIdx].stats = stats;
        }
      }
    });
    const actorIdentity = resolveChatIdentity(isKick ? currentUserId : member.applicantId || member.userId, {
      from: isKick ? currentUserDisplay : member.applicantName || member.name || "Operative",
      fromHandle: isKick ? currentUserDiscordHandle : member.applicantDiscordHandle || member.discordName || member.applicantName || member.name,
      fromAvatar: isKick ? session?.user?.image || "" : member.applicantAvatar || member.avatar || "",
    });
    const leaveMsg = {
      id: Date.now() + 1,
      fromId: isKick ? currentUserId : member.applicantId || member.userId,
      from: actorIdentity.name,
      fromHandle: isKick ? currentUserDiscordHandle : member.applicantDiscordHandle || member.discordName || member.applicantName || member.name,
      fromAvatar: actorIdentity.avatar,
      fromEffect: isKick ? myEffect : member.applicantEffect || member.effect || "none",
      text: `${member.applicantName || member.name || "Operative"} ${isKick ? "was kicked from" : "left"} the offer after ${completed} run${completed === 1 ? "" : "s"}.`,
      image: null,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    const splitResult = splitLobbyAfterMemberExit(lobbies, lobbyId, member, Math.max(0, completed), isKick, leaveMsg, historySnapshot || member);
    if (!splitResult) return;
    const updated = splitResult.lobbies.map(repairLobbyRoles);
    const leaverSelf = memberIdentityKey(member) === String(currentUserId) && !isKick;
    setLobbies(updated);
    setRegisteredUsers(updatedUsers);
    splitInFlightRef.current = true;
    try {
      const res = await fetch("/api/lobbies/split-exit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lobbyId, member, completed: Math.max(0, completed), isKick, leaveMsg, historySnapshot }) });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.lobbies)) setLobbies(data.lobbies.map(repairLobbyRoles));
      } else {
        await saveGlobalData({ lobbies: updated });
      }
    } catch {
      await saveGlobalData({ lobbies: updated });
    } finally {
      splitInFlightRef.current = false;
      window.dispatchEvent(new CustomEvent("data-refresh"));
    }
    if (memberIdentityKey(member) === String(currentUserId)) saveGlobalData({ registeredUsers: updatedUsers });
    setActiveMemberAction(null);
    if (leaverSelf) {
      router.push("/");
    } else {
      const focusId = splitResult.childLobby?.id || splitResult.focusLobbyId;
      const focus = updated.find((l: any) => String(l.id) === String(focusId));
      if (!focus) return;
    }
    addToast(splitResult.childLobby ? (isKick ? "Operative kicked. Remaining runs reposted." : "You left the group. Remaining runs reposted.") : (isKick ? "Operative kicked." : "You left the group."), "info");
  };

  const terminateLobby = (lobbyId: string) => {
    const lobbyKey = String(lobbyId);
    const updated = lobbies.filter((l) => String(l.id) !== lobbyKey);
    const updatedNotifs = notifications.filter((n: any) => String(n.lobbyId) !== lobbyKey);
    setLobbies(updated);
    setNotifications(updatedNotifs);
    if (voiceToken && String(targetLobby?.id) === lobbyKey) {
      setVoiceToken(null);
      localStorage.removeItem("uplink_voice_lobby");
    }
    saveGlobalData({ lobbies: updated, notifications: updatedNotifs });
    addToast("Offer cancelled.", "info");
    router.push("/");
  };

  /* ----- VOICE ----- */
  const handleJoinVoice = async (lobbyId: string) => {
    if (!session?.user || currentUserId === "guest") { addToast("Sign in with Discord to use voice.", "error"); return; }
    if (!lobbyId || String(lobbyId) === "undefined") return;
    const target = lobbies.find((l) => String(l.id) === String(lobbyId));
    if (!target || !userCanAccessVoice(target, currentUserId, currentUserDiscordHandle)) return;
    if (voiceToken) { setVoiceToken(null); setVoiceServerUrl(null); localStorage.removeItem("uplink_voice_lobby"); return; }
    const now = Date.now();
    if (voiceJoinInFlight.current || now < voiceJoinCooldownUntil.current) return;
    voiceJoinInFlight.current = true;
    voiceJoinCooldownUntil.current = now + 2500;
    setIsJoiningVoice(true);
    try {
      const resp = await fetch(`/api/livekit?room=${encodeURIComponent(String(lobbyId))}`, { credentials: "include" });
      const data = await resp.json().catch(() => ({}));
      if (data.token) {
        setVoiceToken(data.token);
        if (data.serverUrl) setVoiceServerUrl(String(data.serverUrl));
        localStorage.setItem("uplink_voice_lobby", String(lobbyId));
        addToast("Voice link established.", "success");
      } else if (resp.status === 503) {
        addToast(data.error || "Voice is not configured on this server. Contact admin.", "error");
      } else if (resp.status === 429) {
        const waitSec = data.retryAfterMs ? Math.ceil(Number(data.retryAfterMs) / 1000) : 5;
        voiceJoinCooldownUntil.current = Date.now() + waitSec * 1000;
        addToast(data.error || `Slow down — wait ${waitSec}s before joining again.`, "info");
      } else if (resp.status === 401) {
        addToast("Session expired — sign in again to use voice.", "error");
      } else if (resp.status === 403 && data.code === "VOICE_LOCKED") {
      } else if (resp.status === 403) {
        addToast(data.error || "Voice access denied.", "error");
      } else {
        addToast(data.error || "Voice link failed. Restart the site if this persists.", "error");
      }
    } catch (err) {
      addToast("Signal lost. Try again.", "error");
    } finally {
      voiceJoinInFlight.current = false;
      setIsJoiningVoice(false);
    }
  };

  // Auto-disconnect when lobby closes
  useEffect(() => {
    if (voiceToken && targetLobby && !isVoiceLobbyOpen(targetLobby)) {
      setVoiceToken(null);
      setVoiceServerUrl(null);
      localStorage.removeItem("uplink_voice_lobby");
      addToast("Voice link closed.", "info");
    }
  }, [targetLobby?.status, targetLobby?.roles, voiceToken]);

  /* ----- MISSION THREAD ----- */
  const openMissionThread = (lobbyId: string) => {
    const seed = lobbies.find((x: any) => String(x.id) === String(lobbyId));
    if (!seed) { addToast("Could not load that mission. Try refreshing.", "error"); return; }
    const l = resolveOpenMissionThreadTarget(seed, currentUserId, lobbies, currentUserDiscordHandle);
    if (!l || !userCanViewOfferThread(l, currentUserId, currentUserDiscordHandle)) { addToast("You are no longer on this mission.", "error"); return; }
    if (voiceToken) {
      const stored = localStorage.getItem("uplink_voice_lobby");
      if (!stored || String(stored) !== String(l.id)) { setVoiceToken(null); localStorage.removeItem("uplink_voice_lobby"); }
    }
    router.push(`/manage/${l.id}`);
  };

  /* ----- PROFILE PREVIEW ----- */
  const openPlayerProfile = useCallback((u: any) => {
    const id = typeof u === "string" ? u : u?.id || u?.applicantId || u?.userId;
    if (id) window.dispatchEvent(new CustomEvent("open-player-profile", { detail: { userId: id } }));
  }, []);

  /* ----- PAYMENT ----- */
  const handleDiscardProof = () => {
    if (!targetLobby) return;
    const updated = { ...targetLobby, status: "in_progress", paymentProof: null };
    setLobbies((prev) => prev.map((l) => (l.id === targetLobby.id ? updated : l)));
    saveGlobalData({ lobbies: lobbies.map((l) => (l.id === targetLobby.id ? updated : l)) });
    addToast("Proof discarded.", "info");
  };

  const handlePasteProof = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (!targetLobby) return;
    const img = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
    if (!img) return;
    const file = img.getAsFile();
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const updated = { ...targetLobby, paymentProof: reader.result as string, status: "payment_pending" };
      setLobbies((prev) => prev.map((l) => (l.id === targetLobby.id ? updated : l)));
      saveGlobalData({ lobbies: lobbies.map((l) => (l.id === targetLobby.id ? updated : l)) });
      addToast("Payment proof attached.", "success");
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmPayout = () => {
    if (!targetLobby) return;
    const updated = { ...targetLobby, status: "completed", payoutStatus: "paid" };
    const paymentMsg = { id: Date.now(), from: currentUserDisplay, fromHandle: currentUserDiscordHandle, fromAvatar: session?.user?.image || "", fromEffect: myEffect, text: "Payment confirmed", image: targetLobby.paymentProof, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    const withMsg = appendOfferFamilyMessage(lobbies, updated, paymentMsg);
    const next = withMsg.map((l: any) => (l.id === targetLobby.id ? { ...l, payoutStatus: "paid" } : l));
    setLobbies(next);
    saveGlobalData({ lobbies: next });
    setIsPaymentModalOpen(false);
    addToast("Payout confirmed!", "success");
    playSound("reward");
  };

  const pageContextValue = useMemo(() => ({
    currentUserId,
    currentUserDisplay,
    currentUserDiscordHandle,
    isAdmin,
    session,
    myEffect,
    myVfxBg,
    registeredUsers,
    setRegisteredUsers,
    EFFECTS,
    EFFECT_IMG,
    theme,
    setTheme,
    addToast,
    saveGlobalData,
    playSound,
    t,
    getUserTier,
    getUserTierLabel,
    getVfxSettings,
    renderDualColorName,
    isUserHidden,
    resolveMemberVisual,
    resolveUserVisual,
    resolveChatIdentity,
    openRatePicker,
    DUNGEONS,
    WOW_CLASS_GROUPS,
    CLASS_ROLE_OPTIONS,
    AUTO_ACCEPT_DURATION_MS,
    AvatarWithEffect,
    electricColor,
    setElectricColor,
  }), [currentUserId, currentUserDisplay, currentUserDiscordHandle, isAdmin, session, myEffect, myVfxBg, registeredUsers, setRegisteredUsers, theme, setTheme, addToast, saveGlobalData, playSound, t, getUserTier, getUserTierLabel, getVfxSettings, renderDualColorName, isUserHidden, resolveMemberVisual, resolveUserVisual, resolveChatIdentity, openRatePicker, AvatarWithEffect, electricColor, setElectricColor]);

  if (!lobbyId) return null;

  const voiceConnected = !!voiceToken;
  const serverUrl = voiceServerUrl || process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://uplink-sist6urm.livekit.cloud";

  return (
    <>
      <PageContext.Provider value={pageContextValue}>
        {voiceConnected ? (
          <LiveKitRoom audio={voiceConnected} video={false} token={voiceToken ?? undefined} serverUrl={serverUrl} connect={voiceConnected}
            onError={() => { setVoiceToken(null); setVoiceServerUrl(null); localStorage.removeItem("uplink_voice_lobby"); addToast("Voice connection failed. Try again.", "error"); }}
            onDisconnected={() => { setVoiceToken(null); setVoiceServerUrl(null); localStorage.removeItem("uplink_voice_lobby"); }}>
            <ManageContent
              targetLobby={targetLobby}
              onClose={() => router.push("/")}
              lobbies={lobbies}
              setLobbies={setLobbies}
              activeMemberAction={activeMemberAction}
              setActiveMemberAction={setActiveMemberAction}
              confirmLeaveOrKick={confirmLeaveOrKick}
              handleUpdateLobby={handleUpdateLobby}
              handleAccept={handleAccept}
              handleReject={handleReject}
              handleSendMessage={handleSendMessage}
              handleLeaveLobby={handleLeaveLobby}
              setIsPaymentModalOpen={setIsPaymentModalOpen}
              reportScamTarget={reportScamTarget}
              setReportScamTarget={setReportScamTarget}
              holdProgress={holdProgress}
              setHoldProgress={setHoldProgress}
              voiceToken={voiceToken}
              setVoiceToken={setVoiceToken}
              handleJoinVoice={handleJoinVoice}
              isJoiningVoice={isJoiningVoice}
              chatMessage={chatMessage}
              setChatMessage={setChatMessage}
              chatImagePreview={chatImagePreview}
              setChatImagePreview={setChatImagePreview}
              notifications={notifications}
              setNotifications={setNotifications}
              VoiceRoomContent={VoiceRoomContent}
              InteractivePartyCard={InteractivePartyCard}
              openMissionThread={openMissionThread}
              bannedUsers={bannedUsers}
              setBannedUsers={setBannedUsers}
              currentUserDiscordHandle={currentUserDiscordHandle}
              deleteConfirmation={deleteConfirmation}
              setDeleteConfirmation={setDeleteConfirmation}
              InviteTimer={InviteTimer}
              setPreviewUser={openPlayerProfile}
              getFriendStatus={getFriendStatus}
              isUserBlocked={isUserBlocked}
              onTerminateLobby={terminateLobby}
            />
            <RoomAudioRenderer />
          </LiveKitRoom>
        ) : (
          <ManageContent
            targetLobby={targetLobby}
            onClose={() => router.push("/")}
            lobbies={lobbies}
            setLobbies={setLobbies}
            activeMemberAction={activeMemberAction}
            setActiveMemberAction={setActiveMemberAction}
            confirmLeaveOrKick={confirmLeaveOrKick}
            handleUpdateLobby={handleUpdateLobby}
            handleAccept={handleAccept}
            handleReject={handleReject}
            handleSendMessage={handleSendMessage}
            handleLeaveLobby={handleLeaveLobby}
            setIsPaymentModalOpen={setIsPaymentModalOpen}
            reportScamTarget={reportScamTarget}
            setReportScamTarget={setReportScamTarget}
            holdProgress={holdProgress}
            setHoldProgress={setHoldProgress}
            voiceToken={voiceToken}
            setVoiceToken={setVoiceToken}
            handleJoinVoice={handleJoinVoice}
            isJoiningVoice={isJoiningVoice}
            chatMessage={chatMessage}
            setChatMessage={setChatMessage}
            chatImagePreview={chatImagePreview}
            setChatImagePreview={setChatImagePreview}
            notifications={notifications}
            setNotifications={setNotifications}
            VoiceRoomContent={VoiceRoomContent}
            InteractivePartyCard={InteractivePartyCard}
            openMissionThread={openMissionThread}
            bannedUsers={bannedUsers}
            setBannedUsers={setBannedUsers}
            currentUserDiscordHandle={currentUserDiscordHandle}
            deleteConfirmation={deleteConfirmation}
            setDeleteConfirmation={setDeleteConfirmation}
            InviteTimer={InviteTimer}
            setPreviewUser={openPlayerProfile}
            getFriendStatus={getFriendStatus}
            isUserBlocked={isUserBlocked}
            onTerminateLobby={terminateLobby}
          />
        )}
      </PageContext.Provider>

      {/* TOASTS */}
      <div className="fixed bottom-10 right-10 z-[200] flex flex-col gap-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div key={toast.id} initial={{ opacity: 0, x: 50, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.8, x: 20 }} className={`pointer-events-auto px-8 py-5 rounded-2xl border-2 backdrop-blur-xl shadow-2xl flex items-center gap-4 min-w-[300px] ${toast.type === "error" ? "bg-red-500/10 border-red-500 text-red-500" : toast.type === "success" ? "bg-green-500/10 border-green-500 text-green-500" : "bg-black/80 border-[#00ffff] text-[#00ffff]"}`}>
              {toast.type === "error" ? <ShieldAlert className="w-6 h-6" /> : toast.type === "success" ? <CheckCircle2 className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
              <div><p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Frequency Alert</p><p className="font-black text-sm">{toast.msg}</p></div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* RATE SQUAD PICKER */}
      <AnimatePresence>
        {ratePickerData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setRatePickerData(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[#0a0a16] border border-yellow-500/30 rounded-[2rem] p-6 max-w-sm w-full shadow-[0_0_40px_rgba(234,179,8,0.12)]" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-sm font-black uppercase tracking-widest text-yellow-400 text-center mb-1">Rate Squad</h3>
              {ratePickerData.missionTitle && <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 text-center mb-4">{ratePickerData.missionTitle}</p>}
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 text-center mb-3">Choose who to review</p>
              <div className="flex flex-col gap-2 mb-4">
                {ratePickerData.targets.map((tt: any) => (
                  <button key={tt.id} onClick={() => { setRatingModalData({ lobbyId: ratePickerData.lobbyId, rateeId: tt.id, rateeName: tt.name }); setRatePickerData(null); }}
                    className={`w-full px-4 py-3 rounded-xl border text-left flex items-center gap-3 transition-all ${tt.role === "COMMANDER" ? "bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20 hover:border-yellow-500/50" : "bg-white/5 border-white/10 hover:bg-yellow-500/10 hover:border-yellow-500/30"}`}>
                    {tt.avatar ? <img src={tt.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-white/10" /> : <div className="w-9 h-9 rounded-full bg-white/10" />}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black text-white truncate">{tt.name}</div>
                      <div className={`text-[8px] font-black uppercase tracking-widest ${tt.role === "COMMANDER" ? "text-yellow-400" : "text-[#00ffff]"}`}>{tt.role === "COMMANDER" ? "Commander" : "Operative"}</div>
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => setRatePickerData(null)} className="w-full py-2 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all rounded-xl bg-white/5 hover:bg-white/10">Skip</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RATING MODAL */}
      <AnimatePresence>
        {ratingModalData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setRatingModalData(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[#0a0a16] border border-yellow-500/40 rounded-[2rem] p-6 max-w-sm w-full shadow-[0_0_40px_rgba(234,179,8,0.15)]" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-sm font-black uppercase tracking-widest text-white text-center mb-1">Rate {ratingModalData.rateeName}</h3>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 text-center mb-5">How was your experience?</p>
              <HoverStarRating onSubmit={(score: number) => submitSquadRating(ratingModalData.rateeId, score)} />
              <button onClick={() => setRatingModalData(null)} className="w-full mt-4 py-2 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all rounded-xl bg-white/5 hover:bg-white/10">Skip</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PAYMENT MODAL */}
      <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} lobby={targetLobby} onLobbyChange={(l: any) => setLobbies((prev: any[]) => prev.map((x) => (x.id === l.id ? l : x)))} currentUserId={currentUserId} isAdmin={isAdmin}
        onPasteProof={handlePasteProof} onDiscardProof={handleDiscardProof} onConfirmPayout={handleConfirmPayout} />
    </>
  );
}

const ManageContent = ({
  targetLobby,
  onClose,
  lobbies,
  setLobbies,
  activeMemberAction,
  setActiveMemberAction,
  confirmLeaveOrKick,
  handleUpdateLobby,
  handleAccept,
  handleReject,
  handleSendMessage,
  handleLeaveLobby,
  setIsPaymentModalOpen,
  reportScamTarget,
  setReportScamTarget,
  holdProgress,
  setHoldProgress,
  voiceToken,
  setVoiceToken,
  handleJoinVoice,
  isJoiningVoice,
  chatMessage,
  setChatMessage,
  chatImagePreview,
  setChatImagePreview,
  notifications,
  setNotifications,
  VoiceRoomContent: VoiceRoomContentProp,
  InteractivePartyCard: InteractivePartyCardProp,
  openMissionThread,
  bannedUsers,
  setBannedUsers,
  currentUserDiscordHandle,
  deleteConfirmation,
  setDeleteConfirmation,
  InviteTimer: InviteTimerProp,
  setPreviewUser,
  getFriendStatus,
  isUserBlocked,
  onTerminateLobby,
}: any) => {
  const { registeredUsers } = usePage();

  const [localTarget, setLocalTarget] = useState<any>(targetLobby);
  const effectiveTarget = localTarget || targetLobby;

  return (
    <div className="min-h-screen bg-[#05050a] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,255,255,0.06),transparent_60%),radial-gradient(circle_at_80%_80%,rgba(255,0,127,0.06),transparent_60%)]" />
      <ManageModal
        isOpen={true}
        onClose={onClose}
        targetLobby={effectiveTarget}
        setTargetLobby={setLocalTarget}
        lobbies={lobbies}
        setLobbies={setLobbies}
        activeMemberAction={activeMemberAction}
        setActiveMemberAction={setActiveMemberAction}
        confirmLeaveOrKick={confirmLeaveOrKick}
        handleUpdateLobby={handleUpdateLobby}
        handleAccept={handleAccept}
        handleReject={handleReject}
        handleSendMessage={handleSendMessage}
        handleLeaveLobby={handleLeaveLobby}
        setIsPaymentModalOpen={setIsPaymentModalOpen}
        reportScamTarget={reportScamTarget}
        setReportScamTarget={setReportScamTarget}
        holdProgress={holdProgress}
        setHoldProgress={setHoldProgress}
        voiceToken={voiceToken}
        setVoiceToken={setVoiceToken}
        handleJoinVoice={handleJoinVoice}
        isJoiningVoice={isJoiningVoice}
        chatMessage={chatMessage}
        setChatMessage={setChatMessage}
        chatImagePreview={chatImagePreview}
        setChatImagePreview={setChatImagePreview}
        notifications={notifications}
        setNotifications={setNotifications}
        VoiceRoomContent={VoiceRoomContentProp}
        InteractivePartyCard={InteractivePartyCardProp}
        openMissionThread={openMissionThread}
        bannedUsers={bannedUsers}
        setBannedUsers={setBannedUsers}
        currentUserDiscordHandle={currentUserDiscordHandle}
        deleteConfirmation={deleteConfirmation}
        setDeleteConfirmation={setDeleteConfirmation}
        InviteTimer={InviteTimerProp}
        ownerAutoAcceptActive={false}
        setPreviewUser={setPreviewUser}
        getFriendStatus={getFriendStatus}
        isUserBlocked={isUserBlocked}
        onTerminateLobby={onTerminateLobby}
      />
      {!effectiveTarget && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/95 p-8">
          <div className="text-center">
            <h2 className="text-4xl font-black uppercase tracking-[0.3em] text-white mb-4">Transmission Lost</h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mb-8">This offer no longer exists.</p>
            <button onClick={onClose} className="px-10 py-4 bg-white text-black font-black uppercase text-xs rounded-2xl hover:bg-[#00ffff] transition-all">Return to Uplink</button>
          </div>
        </div>
      )}
    </div>
  );
};