"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
   PlusCircle, Plus, X, Check, Swords, Trash2, UserCheck, Key, Coins, ShieldAlert, Users, Shield, Target, DoorClosed, DoorOpen, LogOut, Bell, CircleDollarSign, CheckCircle2, Clock, AlertTriangle, ShieldCheck, Radio, Play, MessageSquare, Trophy, ChevronDown, ChevronRight, Zap, TrendingUp, ShieldX, Heart, Crosshair, Lock, Eye, Send, Wand2, Star, Search, Compass,
   Mic, MicOff, Headphones, PhoneOff, VolumeX, Volume2, Video, VideoOff, Phone, Settings
} from "lucide-react";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { PageContext } from "@/contexts/PageContext";
import { useThemePreference } from "@/hooks/useThemePreference";
import { ProtocolMark, PROTOCOL_MARK_OPTIONS, type ProtocolMarkVariant } from "@/components/ProtocolMark";

import { 
  LiveKitRoom, 
  RoomAudioRenderer, 
  ControlBar, 
  useTracks,
  ParticipantTile,
  LayoutContext,
  ParticipantLoop,
  ParticipantName,
  useIsSpeaking,
  useLocalParticipant,
  AudioVisualizer,
  RoomContext,
  useParticipantInfo
} from '@livekit/components-react';
import { Track, RoomEvent, Participant, Room } from 'livekit-client';
import '@livekit/components-styles';

/* --- COMPONENTS --- */
import BoostRequestModal from "@/components/modals/BoostRequestModal";
import SecretClubCard from "@/components/SecretClubCard";
import ClassRoleIcons from "@/components/ClassRoleIcons";
import AutoAcceptTimer, { AUTO_ACCEPT_DURATION_MS } from "@/components/AutoAcceptTimer";
import LongPressButton from "@/components/LongPressButton";
import OnboardingModal from "@/components/modals/OnboardingModal";
import PaymentModal from "@/components/modals/PaymentModal";
import TicketModal from "@/components/modals/TicketModal";
import SupportChatWidget from "@/components/SupportChatWidget";
import ClubLoungeChatWidget from "@/components/ClubLoungeChatWidget";
import HomeFloatingActions from "@/components/HomeFloatingActions";
import OngoingMissionsPanel from "@/components/OngoingMissionsPanel";
import EditingGoldModal from "@/components/modals/EditingGoldModal";
import CreateOfferModal from "@/components/modals/CreateOfferModal";
import ArmoryModal from "@/components/modals/ArmoryModal";
import ManageModal from "@/components/modals/ManageModal";
import AutoApplySettingsModal from "@/components/modals/AutoApplySettingsModal";
import InviteTimer from "@/components/InviteTimer";
import RankBadge, { getRank, getCategoryLevel, getAverageRating } from "@/components/RankBadge";
import HoverStarRating from "@/components/HoverStarRating";
import { acceptedExcludingMember, acceptApplicantAcrossLobbies, appendOfferFamilyMessage, buildOfferEditChatText, buildSquadTemplateFromRoles, cancelLobbyInvite, canOwnerCancelLobby, confirmApplicantJoin, findResurrectedChildForParent, getJoinedOngoingMissions, getOfferFamilyRootId, getOfferThreadFamily, getOccupantsBySlot, getOwnerOngoingMissions, getViewableOfferThreads, inviteApplicantToLobby, isEmbeddedFootArchive, isLevelingOffer, isLobbyListedInPublicFeed, isOwnerLobbyGridRepost, isVoiceLobbyOpen, memberIdentityKey, memberMatchesUser, mergeLobbiesFromServer, applicantsLiveSnapshot, purgeExpiredLobbyInvites, repairLobbyRoles, resolveOpenMissionThreadTarget, splitLobbyAfterMemberExit, userCanAccessVoice, userCanViewOfferThread, userExitBlockedFromLobby, userHasJoinedOngoingMission, userIsActiveInDungeonOffer, userIsActiveInOffer, userIsActiveInOtherDungeonOffer, userIsOfferOwner, userParticipatedInThread, withdrawApplicantFromOfferFamily, withdrawUserFromAllLobbies } from "@/lib/lobbyLifecycle";
import { mergeRegisteredUsersFromServer, notificationMatchesUser, resolveNotificationRecipient, revokeSecretClubPerks, isSecretClubTier, effectiveAvatarEffect, effectiveProfileGif, getSubscriptionDaysLeft } from "@/lib/userProfile";
import AdminModerationPanel from "@/components/admin/AdminModerationPanel";
import AdminAuditPanel from "@/components/admin/AdminAuditPanel";
import AdminIpBanPanel from "@/components/admin/AdminIpBanPanel";
import AdminAnalyticsPanel from "@/components/admin/AdminAnalyticsPanel";
import { getTicketActivity, TICKET_TTL_MS, isTicketExpired } from "@/lib/tickets";
import { validateBattleTag } from "@/lib/battleTagValidation";
import { resolveProfileDisplayName, resolveProfileImage, resolveOfferFeedProfileImage } from "@/lib/profileImage";
import { sanitizeApplicantNote, sanitizeApplicantNoteDraft } from "@/lib/applicantNote";
import { buildCharacterFromRaiderProfile, mergeMyCharactersFromServer, getRemovedCharacterKeys, clearRemovedCharacterKey } from "@/lib/raiderCharacter";
import WelcomePlansModal from "@/components/modals/WelcomePlansModal";
import { lobbyRunCount } from "@/lib/lobbyDisplay";
import { classThumbUrl, roleIconUrl, roleIconClass } from "@/lib/classThumb";
import { OfferFeedAvatar as OfferFeedAvatarBase } from "@/components/OfferFeedAvatar";
import { resolveLobbyBannerBg, resolveVfxBannerUrl, resolveVfxSrc } from "@/lib/vfxAssets";
import { formatIpForAdmin } from "@/lib/formatIp";
import { isPrimaryAdmin, hasAdminPower } from "@/lib/rolesConstants";

const VoiceParticipant = ({ participant }: { participant: Participant }) => {
  const isSpeaking = useIsSpeaking(participant);
  const { identity } = useParticipantInfo({ participant });

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative flex flex-col items-center gap-2"
    >
      <div className={`relative p-1 rounded-full transition-all duration-300 ${isSpeaking ? 'bg-[#00ffff] shadow-[0_0_20px_#00ffff]' : 'bg-white/10'}`}>
        <div className="w-16 h-16 rounded-full overflow-hidden bg-black border-2 border-white/20">
          <img 
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${identity}`} 
            alt={identity} 
            className="w-full h-full object-cover"
          />
        </div>
        {isSpeaking && (
           <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5 h-4 items-end pb-1">
              {[1,2,3].map(i => (
                 <motion.div 
                    key={i}
                    animate={{ height: [4, 12, 4] }}
                    transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                    className="w-1 bg-[#00ffff] rounded-full"
                 />
              ))}
           </div>
        )}
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest text-white/70">{identity}</span>
    </motion.div>
  );
};

const VoiceRoomContent = ({ roomName, onDisconnect, inline, users, currentUserId, currentUserAvatar }: { roomName: string; onDisconnect: () => void; inline?: boolean; users?: any[]; currentUserId?: string; currentUserAvatar?: string }) => {
  const tracks = useTracks([Track.Source.Microphone]);
  const { localParticipant } = useLocalParticipant();
  const [isMuted, setIsMuted] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [showDevices, setShowDevices] = useState(false);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(d => {
      setDevices(d.filter(device => device.kind === 'audioinput'));
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
    tracks.forEach(t => {
      if (!t.participant.isLocal) {
        (t.participant as any).setVolume?.(newValue ? 0 : 1);
      }
    });
  };

  // Keep new participants silent while deafened
  useEffect(() => {
    if (isDeafened) {
      tracks.forEach(t => {
        if (!t.participant.isLocal) {
          (t.participant as any).setVolume?.(0);
        }
      });
    }
  }, [tracks]);

  return inline ? (
    <div className="flex items-center gap-4">
      {/* Participants */}
      <div className="flex items-center gap-3">
        {tracks.map((t) => {
          const pid = String(t.participant.identity);
          const pUser = userMap.get(pid) || userMap.get(pid.toLowerCase());
          const isSelf = pid === currentUserId;
          const pAvatar = isSelf && currentUserAvatar ? (pUser?.profileGif || currentUserAvatar) : (pUser?.profileGif || pUser?.avatar || pUser?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${pid}`);
          return (
            <div key={t.participant.sid} className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full border-2 transition-all duration-300 overflow-hidden ${t.participant.isSpeaking ? 'border-[#00ffff] shadow-[0_0_8px_#00ffff]' : 'border-white/10'}`}>
                <img src={pAvatar} alt={pid} className="w-full h-full object-cover" onError={(e: any) => { if (e.target.src.includes('dicebear')) return; e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${pid}`; }} />
              </div>
              <span className="text-[7px] font-bold text-gray-400 truncate max-w-[60px] text-center leading-none">{pUser?.displayName || pUser?.name || "Player"}</span>
            </div>
          );
        })}
      </div>
      {/* Controls */}
      <div className="flex items-center gap-1.5">
        <div className="relative">
          <button onClick={() => setShowDevices(!showDevices)} className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <Settings className="w-3 h-3" />
          </button>
          {showDevices && (
            <div className="absolute bottom-full right-0 mb-2 w-56 bg-black border border-white/10 rounded-xl p-2 shadow-2xl z-[1001]">
              <p className="text-[7px] font-black uppercase tracking-widest text-gray-500 p-1.5 border-b border-white/5 mb-1">Input Devices</p>
              <div className="space-y-0.5 max-h-36 overflow-y-auto custom-scrollbar">
                {devices.map(d => (
                  <button key={d.deviceId} onClick={() => switchDevice(d.deviceId)} className="w-full text-left p-1.5 rounded-lg hover:bg-[#00ffff]/10 hover:text-[#00ffff] transition-all text-[8px] font-bold truncate flex items-center gap-1.5">
                    <Mic className="w-2.5 h-2.5 shrink-0" /> {d.label || `Mic ${d.deviceId.slice(0, 5)}`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <button onClick={toggleMute} className={`p-1.5 rounded-lg border transition-all ${isMuted ? 'bg-red-500/20 border-red-500/40 text-red-500' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}>
          {isMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
        </button>
        <button onClick={toggleDeafen} className={`p-1.5 rounded-lg border transition-all ${isDeafened ? 'bg-red-500/20 border-red-500/40 text-red-500' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}>
          {isDeafened ? <VolumeX className="w-3 h-3" /> : <Headphones className="w-3 h-3" />}
        </button>
        <button onClick={onDisconnect} className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all">
          <PhoneOff className="w-3 h-3" />
        </button>
      </div>
    </div>
  ) : (
    <motion.div 
      initial={{ y: 100 }} 
      animate={{ y: 0 }} 
      exit={{ y: 100 }}
      className="fixed bottom-0 left-0 right-0 z-[1000] bg-black/80 backdrop-blur-2xl border-t border-white/10 px-8 py-3 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
    >
      {/* Room Info */}
      <div className="flex items-center gap-4 w-1/4">
        <div className="w-10 h-10 rounded-xl bg-[#00ffff]/10 flex items-center justify-center border border-[#00ffff]/20">
          <Radio className="w-5 h-5 text-[#00ffff] animate-pulse" />
        </div>
        <div className="hidden sm:block">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Connected</h3>
          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest truncate max-w-[150px]">{roomName}</p>
        </div>
      </div>

      {/* Participants */}
      <div className="flex items-center gap-3 overflow-x-auto px-4 no-scrollbar">
        {tracks.map((t) => (
          <div key={t.participant.sid} className="relative group">
            <div className={`w-10 h-10 rounded-full border-2 transition-all duration-300 ${t.participant.isSpeaking ? 'border-[#00ffff] shadow-[0_0_15px_#00ffff]' : 'border-white/10'}`}>
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${t.participant.identity}`} 
                alt={t.participant.identity} 
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black border border-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              {t.participant.identity}
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 w-1/4 justify-end relative">
        <div className="relative">
          <button onClick={() => setShowDevices(!showDevices)} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <Settings className="w-4 h-4" />
          </button>
          {showDevices && (
            <div className="absolute bottom-full right-0 mb-4 w-64 bg-black border border-white/10 rounded-2xl p-2 shadow-2xl z-[1001]">
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-500 p-2 border-b border-white/5 mb-2">Input Devices</p>
              <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                {devices.map(d => (
                  <button key={d.deviceId} onClick={() => switchDevice(d.deviceId)} className="w-full text-left p-2 rounded-xl hover:bg-[#00ffff]/10 hover:text-[#00ffff] transition-all text-[9px] font-bold truncate flex items-center gap-2">
                    <Mic className="w-3 h-3 shrink-0" /> {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button onClick={toggleDeafen} className={`p-2.5 rounded-xl border transition-all ${isDeafened ? 'bg-red-500/20 border-red-500/40 text-red-500' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}>
          {isDeafened ? <VolumeX className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
        </button>

        <button onClick={toggleMute} className={`p-2.5 rounded-xl border transition-all ${isMuted ? 'bg-red-500/20 border-red-500/40 text-red-500' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}>
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <button onClick={onDisconnect} className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)]">
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

const VoiceRoom = ({ roomName, token, serverUrl, onDisconnect, inline, users }: { roomName: string; token: string; serverUrl: string; onDisconnect: () => void; inline?: boolean; users?: any[] }) => {
  return (
    <LiveKitRoom
      audio={true}
      video={false}
      token={token}
      serverUrl={serverUrl}
      onDisconnected={onDisconnect}
    >
      <VoiceRoomContent roomName={roomName} onDisconnect={onDisconnect} inline={inline} users={users} />
    </LiveKitRoom>
  );
};

const RoleCard = ({ role, accepted, lobby, charClass, hideIdentity }: { role: string, accepted: any, lobby: any, charClass?: string; hideIdentity?: boolean }) => {
   const [isFlipped, setIsFlipped] = useState(false);

   return (
      <div
         className="w-32 h-48 [perspective:1000px] cursor-pointer"
         onClick={() => setIsFlipped(!isFlipped)}
      >
         <div className={`relative w-full h-full transition-all duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
            {/* Front Side: Role Icon */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-transparent [backface-visibility:hidden]">
               <div className="mb-4 flex justify-center">
                  {charClass ? (
                     <ClassRoleIcons className={charClass} role={role} size={64} overlap={18} />
                  ) : (
                     <img src={roleIconUrl(role)} width={128} height={128} className={`w-16 h-16 object-contain drop-shadow-lg ${roleIconClass(role, "lg")}`} alt={role} />
                  )}
               </div>
            </div>
            {/* Back Side: Profile */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-transparent rounded-2xl p-4 [transform:rotateY(180deg)] [backface-visibility:hidden]">
               <div className={`transition-opacity duration-500 ease-in-out ${isFlipped ? 'opacity-100' : 'opacity-0'} flex flex-col items-center w-full`}>
                  {accepted ? (
                     <>
                        {hideIdentity ? (
                           <div className="flex items-center justify-center w-full h-full">
                              <SecretClubCard variant="compact" />
                           </div>
               ) : (
                 <>
                    <img
                       src={accepted.avatar}
                       className="w-16 h-16 rounded-full mb-2 border-2 border-[#ff007f] object-cover"
                       onError={(e: any) => { e.target.src = '/classes/DPS.svg'; }}
                    />
                    <span className="text-sm font-black text-white truncate w-full text-center">{accepted.raiderName}</span>
                 </>
               )}
                        <span className="text-[#ff007f] font-bold text-xs mb-2">IO: {Number(String(accepted.score).replace('+', '') || 0).toLocaleString()}</span>
                        {/* CONDITIONAL INVITE BUTTON */}
                        {lobby?.status !== 'standby' && !hideIdentity && (
                           <button
                              onClick={(e) => {
                                 e.stopPropagation();
                                 navigator.clipboard.writeText(`/inv ${accepted.raiderName}`);
                              }}
                              className="w-full py-1 bg-white/10 hover:bg-[#ff007f] text-white text-[9px] font-black uppercase rounded-lg transition-all"
                           >
                              Copy /inv
                           </button>
                        )}
                     </>
                  ) : (
                     <span className="text-xs text-white/50 uppercase font-black tracking-widest">Open</span>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
};

const InteractivePartyCard = ({ role, accepted, visual, AvatarComponent, hideIdentity, rankStats, rankRatings, onAvatarClick, userData }: { role: string; accepted: any; visual: any; AvatarComponent: any; hideIdentity?: boolean; rankStats?: any; rankRatings?: number[]; onAvatarClick?: (user: any) => void; userData?: any }) => {
   const [isFlipped, setIsFlipped] = useState(false);
   const isInvited = accepted?.status === "invited";

   return (
      <div className="w-24 h-32 p-1.5 cursor-pointer relative shrink-0" style={{ perspective: 1000 }} onClick={() => setIsFlipped(!isFlipped)}>
         <motion.div className="relative w-full h-full" animate={{ rotateY: isFlipped ? 180 : 0 }} transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }} style={{ transformStyle: "preserve-3d" }}>
            {/* FRONT */}
            <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-black/20 border border-white/10 rounded-2xl shadow-lg" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
               <img src={roleIconUrl(role)} width={128} height={128} className={`w-12 h-12 object-contain mb-1 drop-shadow-lg ${roleIconClass(role, "lg")}`} alt={role} />
               {accepted && isInvited && <span className="text-[9px] uppercase font-black text-green-400 mt-1 tracking-widest animate-pulse">INVITED</span>}
            </div>
            {/* BACK */}
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
                                  <ClassRoleIcons className={accepted.class || 'DPS'} role={role} size={24} overlap={8} />
                               </div>
                              {isFlipped && AvatarComponent && (
                                  <div onClick={(e) => { e.stopPropagation(); if (onAvatarClick && userData) onAvatarClick(userData); }}>
                                     <AvatarComponent src={visual?.avatar || accepted.avatar} effect={visual?.effect} fallbackName={accepted.applicantName || accepted.raiderName || "Operative"} className="w-10 h-10 rounded-full border-2 border-[#ff007f] object-cover mb-0.5" userId={accepted.applicantId || accepted.userId} />
                                  </div>
                               )}
                              <span className="text-[8px] font-black text-white truncate w-full text-center uppercase">{accepted.applicantName || accepted.raiderName}</span>
                              <span className="text-[#ff007f] font-bold text-[7px]">IO: {Number(String(accepted.score || 0).replace('+', '')).toLocaleString()}</span>
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

/* --- ASSETS & MOCKS --- */
const DUNGEONS = [
   { name: "Algeth'ar Academy", img: "/classes/Algeth'ar Academy.webp", short: "AA" },
   { name: "Magisters Terrace", img: "/classes/Magisters Terrace.webp", short: "MT" },
   { name: "Maisara Caverns", img: "/classes/Maisara Caverns.webp", short: "MC" },
   { name: "Nexus-Point Xenas", img: "/classes/Nexus-Point Xenas.webp", short: "NPX" },
   { name: "Pit of Saron", img: "/classes/Pit of Saron.webp", short: "POS" },
   { name: "Seat of the Triumvirate", img: "/classes/Seat of the Triumvirate.webp", short: "SEAT" },
   { name: "Skyreach", img: "/classes/Skyreach.webp", short: "SR" },
   { name: "Windrunner Spire", img: "/classes/Windrunner Spire.webp", short: "WS" }
];
const DUNGEON_SHORT_MAP = Object.fromEntries(DUNGEONS.map(d => [d.short, d]));
const DUNGEON_NAME_MAP = Object.fromEntries(DUNGEONS.map(d => [d.name, d]));
const resolveDungeonSelection = (key?: string | null) => key ? DUNGEON_NAME_MAP[key] || DUNGEON_SHORT_MAP[key] || null : null;

const CLASS_ROLE_OPTIONS: Record<string, string[]> = {
   "Evoker": ["dps", "healer"],
   "Demon Hunter": ["dps", "tank"],
   "Druid": ["dps", "healer", "tank"],
   "Monk": ["dps", "healer", "tank"],
   "Paladin": ["dps", "healer", "tank"],
   "Priest": ["dps", "healer"],
   "Shaman": ["dps", "healer"],
   "Warrior": ["dps", "tank"],
   "Death Knight": ["dps", "tank"],
   "Hunter": ["dps"],
   "Rogue": ["dps"],
   "Mage": ["dps"],
   "Warlock": ["dps"]
};

const WOW_CLASSES = [
   "Warrior", "Paladin", "Hunter", "Rogue", "Priest", "Death Knight", "Shaman", "Mage", "Warlock", "Monk", "Druid", "Demon Hunter", "Evoker"
];

const WOW_CLASS_GROUPS = {
   "Plate": ["Warrior", "Paladin", "Death Knight"],
   "Mail": ["Hunter", "Shaman", "Evoker"],
   "Leather": ["Rogue", "Monk", "Druid", "Demon Hunter"],
   "Cloth": ["Mage", "Priest", "Warlock"]
};

const CLASS_GROUP_LABEL_STYLE: Record<string, string> = {
   Plate: "text-[#f1f5f9] drop-shadow-[0_0_10px_rgba(203,213,225,0.85)]",
   Mail: "text-[#67e8f9] drop-shadow-[0_0_10px_rgba(34,211,238,0.75)]",
   Leather: "text-[#fcd34d] drop-shadow-[0_0_10px_rgba(251,191,36,0.75)]",
   Cloth: "text-[#ddd6fe] drop-shadow-[0_0_10px_rgba(167,139,250,0.8)]",
};

const EFFECTS: Record<string, string> = {
   none: "",
   electric_circle: "",
};

const EFFECT_IMG: Record<string, string> = {};

import { HeroBackground } from "@/components/HeroBackground";


const MaintenanceUI = () => (
   <div className="fixed inset-0 z-[999] bg-[#05050a] flex flex-col items-center justify-center p-8 text-center">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,255,0.05),transparent_70%)]"></div>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#ff007f]/10 blur-[120px] rounded-full animate-pulse"></div>
      </div>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative z-10 flex flex-col items-center">
         <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.05)]">
            <ShieldAlert className="w-12 h-12 text-[#ff007f] animate-pulse" />
         </div>
         <h1 className="text-4xl font-black uppercase tracking-[0.3em] text-white mb-4">Tactical Shield Active</h1>
         <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] max-w-md leading-relaxed">
            The uplink is currently undergoing security recalibration. Internal circuits are shielded. Please re-initiate transmission in a few moments.
         </p>
         <div className="mt-10 flex gap-4">
            <div className="w-2 h-2 rounded-full bg-white/20 animate-bounce"></div>
            <div className="w-2 h-2 rounded-full bg-white/20 animate-bounce [animation-delay:0.2s]"></div>
            <div className="w-2 h-2 rounded-full bg-white/20 animate-bounce [animation-delay:0.4s]"></div>
         </div>
         <button onClick={() => window.location.reload()} className="mt-12 px-10 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">Re-Scan Network</button>
      </motion.div>
    </div>
);

export default function HomePage() {
   // Check if splash has been shown in this session
   const [isLoading, setIsLoading] = useState(false);
   const [loadingProgress, setLoadingProgress] = useState(0);
   const [hasError, setHasError] = useState(false);

   useEffect(() => {
      const hasSeenSplash = sessionStorage.getItem("uplink_splash_seen");
      if (!hasSeenSplash) {
         setIsLoading(true);
         const interval = setInterval(() => {
            setLoadingProgress(prev => {
               if (prev >= 100) return 100;
               return prev + 2; 
            });
         }, 50);

         const timer = setTimeout(() => {
            setIsLoading(false);
            sessionStorage.setItem("uplink_splash_seen", "true");
         }, 3000);
         return () => {
            clearTimeout(timer);
            clearInterval(interval);
         };
      }
   }, []);

   // Bypass maintenance UI entirely
   if (false && hasError) return <MaintenanceUI />;

   const { data: session, status } = useSession();

   const [lobbies, setLobbies] = useState<any[]>([]);
   const [goldOffers, setGoldOffers] = useState<any[]>([]);
   const [notifications, setNotifications] = useState<any[]>([]);
   const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
   const registeredUsersRef = useRef(registeredUsers);
   registeredUsersRef.current = registeredUsers;
   const [bannedUsers, setBannedUsers] = useState<string[]>([]);
   const [globalCharacters, setGlobalCharacters] = useState<any[]>([]);
   const [applications, setApplications] = useState<any[]>([]);
    const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(() => {
       if (typeof window === "undefined") return false;
       return localStorage.getItem("uplink_is_registered") !== "true";
    });
    const [globalDataReady, setGlobalDataReady] = useState(false);
    const [isWelcomePlansOpen, setIsWelcomePlansOpen] = useState(false);
    const [onboardingData, setOnboardingData] = useState({ interests: [] as string[], raiderLink: "", battleTag: "" });
    const [onboardingError, setOnboardingError] = useState("");
    const [voiceToken, setVoiceToken] = useState<string | null>(null);
    const [voiceServerUrl, setVoiceServerUrl] = useState<string | null>(null);
    const [isJoiningVoice, setIsJoiningVoice] = useState(false);
    const [holdProgress, setHoldProgress] = useState(0);
     const holdTimerRef = useRef<any>(null);
     const reconnectAttempted = useRef(false);
     const voiceJoinInFlight = useRef(false);
     const voiceJoinCooldownUntil = useRef(0);

    const currentUserId = (session?.user as any)?.id || "guest";
   const currentUserDisplay = useMemo(() => {
      const me = registeredUsers.find((u: any) => String(u.id) === String(currentUserId));
      return resolveProfileDisplayName(me, session?.user?.name || "Guest");
   }, [registeredUsers, currentUserId, session?.user?.name]);
   const siteOwnerAvatar = useMemo(() => {
      const me = registeredUsers.find((u: any) => String(u.id) === String(currentUserId));
      return resolveOfferFeedProfileImage(me, currentUserDisplay);
   }, [registeredUsers, currentUserId, currentUserDisplay]);
    const currentUserDiscordHandle = (session?.user as any)?.username || "";
    const isAdmin = hasAdminPower(currentUserId, currentUserDiscordHandle);
    const isPrimary = isPrimaryAdmin(currentUserId, currentUserDiscordHandle);

    const [activeMainTab, setActiveMainTab] = useState(() => {
       if (typeof window !== "undefined") {
          const saved = localStorage.getItem("uplink_active_main_tab");
          return saved === "leaderboard" ? "boosts" : saved || "boosts";
       }
       return "boosts";
    });
    const [myCharacters, setMyCharacters] = useState<any[]>([]);
    const [myEffect, setMyEffect] = useState("none");
    const myVfxBg = useMemo(() => registeredUsers.find((u: any) => u.id === currentUserId)?.activeVfx, [registeredUsers, currentUserId]);
    const myOfferDrafts = useMemo(
      () => registeredUsers.find((u: any) => String(u.id) === String(currentUserId))?.offerDrafts || [],
      [registeredUsers, currentUserId]
    );
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [activeMemberAction, setActiveMemberAction] = useState<{ lobbyId: string, member: any, isKick: boolean } | null>(null);
    const [directMessages, setDirectMessages] = useState<any[]>([]);
    const [friends, setFriends] = useState<any[]>([]);
    const openPlayerProfile = (u: any) => {
       const id = typeof u === "string" ? u : (u?.id || u?.applicantId || u?.userId);
       if (id) window.dispatchEvent(new CustomEvent("open-player-profile", { detail: { userId: id } }));
    };

    const [adminSearchQuery, setAdminSearchQuery] = useState("");
    const [adminIpLookup, setAdminIpLookup] = useState<Record<string, string>>({});
    const [tickets, setTickets] = useState<any[]>([]);
    const [adminTicketsLastSeen, setAdminTicketsLastSeen] = useState(() => {
       if (typeof window !== "undefined") return parseInt(localStorage.getItem("uplink_admin_tickets_seen") || "0", 10) || 0;
       return 0;
    });
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [supportWidgetOpen, setSupportWidgetOpen] = useState(false);
    const [loungeWidgetOpen, setLoungeWidgetOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [ticketMessage, setTicketMessage] = useState("");
    const [showingBgPicker, setShowingBgPicker] = useState<string | null>(null);
    const [reportScamTarget, setReportScamTarget] = useState<any>(null);
    const [isGifModalOpen, setIsGifModalOpen] = useState(false);
    const [gifInputUrl, setGifInputUrl] = useState("");
    const [autoApplyEnabled, setAutoApplyEnabled] = useState(() => {
       if (typeof window === "undefined") return false;
       return localStorage.getItem("uplink_auto_apply") === "true";
    });
    const syncAutoApplyEnabled = useCallback((enabled: boolean) => {
       setAutoApplyEnabled(enabled);
       if (typeof window === "undefined") return;
       localStorage.setItem("uplink_auto_apply", enabled ? "true" : "false");
       window.dispatchEvent(
          new CustomEvent("set-auto-apply-enabled", { detail: { enabled } })
       );
    }, []);
    useEffect(() => {
       if (activeMainTab !== "admin" || !isAdmin) return;
       fetch("/api/admin/banned-ips")
          .then((r) => r.json())
          .then((d) => {
             const map: Record<string, string> = {};
             for (const u of d.userIps || []) {
                if (u.lastKnownIp) {
                   if (u.userId) map[String(u.userId)] = u.lastKnownIp;
                   if (u.username) map[String(u.username)] = u.lastKnownIp;
                }
             }
             for (const row of d.recent || []) {
                if (row.handle && row.ip && !map[row.handle]) map[row.handle] = row.ip;
             }
             setAdminIpLookup(map);
          })
          .catch(() => setAdminIpLookup({}));
    }, [activeMainTab, isAdmin]);
    useEffect(() => {
        if (!autoApplyEnabled || currentUserId === "guest") return;
        if (!registeredUsers.length) return;
        const user = registeredUsers.find(
           (u: any) => String(u.id) === String(currentUserId) || u.username === currentUserId
        );
        const sub = user?.subscription;
        const isSecretClub =
           currentUserId === "1497295886223544471" ||
           (sub?.tier === "secret_club" && (!sub.endDate || Date.now() <= sub.endDate));
        if (!isSecretClub) {
            syncAutoApplyEnabled(false);
        }
    }, [currentUserId, registeredUsers, autoApplyEnabled, syncAutoApplyEnabled]);
    useEffect(() => {
      const onKey = (e: KeyboardEvent) => {
        if (e.key !== "Escape") return;
        setIsArmoryModalOpen(false);
        setIsCreateModalOpen(false);
        setIsApplyModalOpen(false);
        setIsManageModalOpen(false);
        setIsPaymentModalOpen(false);
        setIsAutoApplySettingsOpen(false);
        setIsOnboardingModalOpen(false);
        setIsWelcomePlansOpen(false);
        setIsNotifOpen(false);
        setIsGifModalOpen(false);
        setIsTicketModalOpen(false);
        setIsBoostRequestModalOpen(false);
        setKickModal(null);
        setLeaveModal(null);
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, []);
    const [autoAppliedLobbies, setAutoAppliedLobbies] = useState<string[]>(() => {
       if (typeof window !== "undefined") {
          const saved = localStorage.getItem("uplink_auto_applied");
          try { return saved ? JSON.parse(saved) : []; } catch(e) {}
       }
       return [];
    });
    // Kick/Leave Flow & Anti-Scam State
   const [kickModal, setKickModal] = useState<{lobbyId: string, member: any} | null>(null);
   const [leaveModal, setLeaveModal] = useState<string | null>(null);
   const [completedRunsInput, setCompletedRunsInput] = useState("0");
   const [hasPendingPayments, setHasPendingPayments] = useState(() => {
      if (typeof window !== "undefined") return localStorage.getItem("uplink_pending_payments") === "true";
      return false;
    });
    const [isSuspended, setIsSuspended] = useState(() => {
       if (typeof window !== "undefined") return localStorage.getItem("uplink_is_suspended") === "true";
       return false;
    });
    const [isAutoApplySettingsOpen, setIsAutoApplySettingsOpen] = useState(false);
    const [hoveredLockedId, setHoveredLockedId] = useState<string | null>(null);
    const [autoApplyMinGold, setAutoApplyMinGold] = useState(() => {
        if (typeof window !== "undefined") return parseInt(localStorage.getItem("uplink_auto_min_gold") || "0") || 0;
        return 0;
     });
    const [autoAcceptEnabled, setAutoAcceptEnabled] = useState(() => {
        if (typeof window !== "undefined") {
           const isEnabled = localStorage.getItem("uplink_auto_accept") === "true";
           // Ø§Ù„Ù‚ÙˆØ© Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„Ø§Ø´ØªØ±Ø§Ùƒ Ø¹Ù†Ø¯ Ø¨Ø¯Ø¡ Ø§Ù„ØªØ´ØºÙŠÙ„
           return isEnabled;
        }
        return false;
     });

     const [autoAcceptEndTime, setAutoAcceptEndTime] = useState(() => {
        if (typeof window !== "undefined") return parseInt(localStorage.getItem("uplink_auto_accept_end") || "0") || 0;
        return 0;
     });
    const [hiddenIdentity, setHiddenIdentity] = useState(() => {
        if (typeof window !== "undefined") return localStorage.getItem("uplink_hidden_identity") === "true";
        return false;
     });
    const [offerSoundsEnabled, setOfferSoundsEnabled] = useState(() => {
        if (typeof window !== "undefined") return localStorage.getItem("uplink_offer_sounds") !== "false";
        return true;
     });
    const [autoApplyCategory, setAutoApplyCategory] = useState(() => {
        if (typeof window !== "undefined") return localStorage.getItem("uplink_auto_category") || "dungeon";
        return "dungeon";
     });
    const [autoApplyKey, setAutoApplyKey] = useState<string | null>(() => {
        if (typeof window !== "undefined") return localStorage.getItem("uplink_auto_apply_key");
        return null;
     });
    const [autoApplyKeyLevel, setAutoApplyKeyLevel] = useState(() => {
        if (typeof window !== "undefined") return parseInt(localStorage.getItem("uplink_auto_key_level") || "10") || 10;
        return 10;
     });
    const [autoApplyDropLevel, setAutoApplyDropLevel] = useState(() => {
        if (typeof window !== "undefined") return parseInt(localStorage.getItem("uplink_auto_drop_level") || "15") || 15;
        return 15;
     });
    const [applyNote, setApplyNote] = useState(() => {
        if (typeof window !== "undefined") return sanitizeApplicantNote(localStorage.getItem("uplink_apply_note") || "");
        return "";
     });
      const [autoApplyCharId, setAutoApplyCharId] = useState<string | null>(() => {
         if (typeof window !== "undefined") return localStorage.getItem("uplink_auto_char_id");
         return null;
      });
      const [showKeyDropdown, setShowKeyDropdown] = useState(false);
      const [showCharacterDropdown, setShowCharacterDropdown] = useState(false);

    useEffect(() => {
      localStorage.setItem("uplink_active_main_tab", activeMainTab);
   }, [activeMainTab]);

   const globalData = useMemo(() => ({
      lobbies,
      goldOffers,
      notifications,
      registeredUsers,
      characters: globalCharacters,
      directMessages,
      applications
   }), [lobbies, goldOffers, notifications, registeredUsers, globalCharacters, directMessages, applications, bannedUsers]);

   const [isHomeHovered, setIsHomeHovered] = useState(false);

   const [isArmoryModalOpen, setIsArmoryModalOpen] = useState(() => {
      if (typeof window !== "undefined") {
         return localStorage.getItem("uplink_armory_open") === "true";
      }
      return false;
   });
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isBoostRequestModalOpen, setIsBoostRequestModalOpen] = useState(false);
    const [submitError, setSubmitError] = useState("");
   const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
   const [isManageModalOpen, setIsManageModalOpen] = useState(false);
   const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
   const [activeArmoryTab, setActiveArmoryTab] = useState(() => {
      if (typeof window !== "undefined") {
         const saved = localStorage.getItem("uplink_active_armory_tab");
       return saved === "leaderboard" || saved === "team" ? "armory" : saved || "armory";
      }
      return "armory";
   });

   useEffect(() => {
      localStorage.setItem("uplink_armory_open", isArmoryModalOpen.toString());
   }, [isArmoryModalOpen]);

   useEffect(() => {
      localStorage.setItem("uplink_active_armory_tab", activeArmoryTab);
   }, [activeArmoryTab]);

    useEffect(() => {
       localStorage.setItem("uplink_auto_accept", autoAcceptEnabled.toString());
    }, [autoAcceptEnabled]);

     useEffect(() => {
        localStorage.setItem("uplink_auto_accept_end", autoAcceptEndTime.toString());
     }, [autoAcceptEndTime]);

     // Restore auto-accept after refresh once profiles load; disable if tier expired or session ended
     useEffect(() => {
        if (!registeredUsers.length || !currentUserId) return;
        const storedOn = localStorage.getItem("uplink_auto_accept") === "true";
        const end = parseInt(localStorage.getItem("uplink_auto_accept_end") || "0") || 0;
        const canUse = getUserTier(currentUserId) === "secret_club";
        if (!canUse) {
           setAutoAcceptEnabled(false);
           if (storedOn) localStorage.setItem("uplink_auto_accept", "false");
           return;
        }
        if (storedOn && end > Date.now()) {
           setAutoAcceptEnabled(true);
           setAutoAcceptEndTime(end);
        } else if (storedOn) {
           setAutoAcceptEnabled(false);
           localStorage.setItem("uplink_auto_accept", "false");
        }
     }, [currentUserId, registeredUsers]);

     useEffect(() => {
        localStorage.setItem("uplink_auto_category", autoApplyCategory);
     }, [autoApplyCategory]);

     useEffect(() => {
        if (autoApplyKey) localStorage.setItem("uplink_auto_apply_key", autoApplyKey);
        else localStorage.removeItem("uplink_auto_apply_key");
     }, [autoApplyKey]);

     useEffect(() => {
        localStorage.setItem("uplink_auto_key_level", autoApplyKeyLevel.toString());
     }, [autoApplyKeyLevel]);

     useEffect(() => {
        localStorage.setItem("uplink_auto_drop_level", autoApplyDropLevel.toString());
     }, [autoApplyDropLevel]);

     useEffect(() => {
        localStorage.setItem("uplink_apply_note", applyNote);
     }, [applyNote]);

      useEffect(() => {
         if (autoApplyCharId) localStorage.setItem("uplink_auto_char_id", autoApplyCharId);
         else localStorage.removeItem("uplink_auto_char_id");
      }, [autoApplyCharId]);

      useEffect(() => {
         if (myCharacters.length === 0) {
            if (autoApplyCharId) setAutoApplyCharId(null);
            return;
         }
         if (!autoApplyCharId || !myCharacters.some(c => String(c.id) === String(autoApplyCharId))) {
            setAutoApplyCharId(myCharacters[0].id);
         }
      }, [myCharacters, autoApplyCharId]);

      useEffect(() => {
         localStorage.setItem("uplink_hidden_identity", hiddenIdentity.toString());
      }, [hiddenIdentity]);

    // Sync hiddenIdentity from registeredUsers
     useEffect(() => {
        const user = registeredUsers.find((u: any) => String(u.id) === String(currentUserId));
        if (user && user.hiddenIdentity !== undefined) {
           setHiddenIdentity(user.hiddenIdentity === true);
        }
     }, [registeredUsers, currentUserId]);

     useEffect(() => {
        const user = registeredUsers.find((u: any) => String(u.id) === String(currentUserId));
        if (user?.effect) {
           setMyEffect(user.effect);
           if (currentUserId !== "guest" && user.effect !== "none") {
              localStorage.setItem(`UL_EFFECT_${currentUserId}`, user.effect);
           }
        }
     }, [registeredUsers, currentUserId]);

     const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; index: number; userId: string } | null>(null);
   const [electricColor, setElectricColor] = useState(() => { try { return parseInt(localStorage.getItem('UL_ELECTRIC_COLOR') || '0'); } catch { return 0; } });
   const [toasts, setToasts] = useState<any[]>([]);

   // Properly defined helper function available to all components
   const getVfxSettings = (user: any) => {
      if (!user) return { showOnBanner: true, showOnOngoing: true, showOnModal: true };
      return user.vfxSettings || { showOnBanner: true, showOnOngoing: true, showOnModal: true };
   }; const [lang] = useState("en");
   const { theme, setTheme, toggleTheme } = useThemePreference();
   const [editingLobby, setEditingLobby] = useState<any>(null);
   const [editingGold, setEditingGold] = useState<any>(null);
   const [chatMessage, setChatMessage] = useState("");
   const [chatImagePreview, setChatImagePreview] = useState<string | null>(null);
   const [inviteToReview, setInviteToReview] = useState<any>(null);
    const shownNotifIds = useRef<string[]>([]);
    const handleRef = useRef<string>("");
    const knownLobbyIds = useRef<Set<string>>(new Set());
    const knownTicketIds = useRef<Set<string>>(new Set());
    const ticketMsgCount = useRef<Map<string, number>>(new Map());
    const hasFetchedTicketsRef = useRef(false);
    const applyingLobbyIds = useRef<Set<string>>(new Set());
    const runAutoApplyRef = useRef<(() => Promise<void>) | null>(null);

   useEffect(() => { handleRef.current = currentUserDiscordHandle; }, [currentUserDiscordHandle]);

   // Auto-dismiss invite popup after 60s
   useEffect(() => {
      if (!inviteToReview) return;
      const remaining = 60000 - (Date.now() - inviteToReview.timestamp);
      if (remaining <= 0) { setInviteToReview(null); return; }
      const timer = setTimeout(() => setInviteToReview(null), remaining);
      return () => clearTimeout(timer);
   }, [inviteToReview]);

   useEffect(() => {
      if (status !== "authenticated" || !session?.user) {
         setIsOnboardingModalOpen(false);
         return;
      }
      if (!globalDataReady) return;
      const isRegistered = registeredUsers.some(
         (u: any) => u.id === currentUserId || u.username === currentUserDiscordHandle
      );
      if (!isRegistered) {
         setIsOnboardingModalOpen(true);
         localStorage.setItem("uplink_is_registered", "false");
      } else {
         setIsOnboardingModalOpen(false);
         localStorage.setItem("uplink_is_registered", "true");
      }
   }, [status, session, registeredUsers, currentUserId, currentUserDiscordHandle, globalDataReady]);

   useEffect(() => {
      if (status !== "authenticated" || !session?.user || isOnboardingModalOpen) return;
      if (localStorage.getItem("uplink_is_registered") !== "true") return;
      const me = registeredUsers.find((u: any) => String(u.id) === String(currentUserId));
      if (me && !me.welcomePlansSeen && !me.welcomeFreeClaimed) {
         setIsWelcomePlansOpen(true);
      }
   }, [status, session, registeredUsers, currentUserId, isOnboardingModalOpen]);





   // Close Access on Escape
   useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
         if (e.key === "Escape") {
            setIsArmoryModalOpen(false);
            setIsCreateModalOpen(false);
            setIsApplyModalOpen(false);
            setIsManageModalOpen(false);
             setIsNotifOpen(false);
            setInviteToReview(null);
             setIsAutoApplySettingsOpen(false);
             setIsBoostRequestModalOpen(false);
          }
       };
       window.addEventListener("keydown", handleKeyDown);
       return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Listen for profile click from shared Navbar
   useEffect(() => {
      const handler = () => setIsArmoryModalOpen(true);
      window.addEventListener('open-armory-modal', handler);
      return () => window.removeEventListener('open-armory-modal', handler);
   }, []);

    // Listen for Auto-Apply Settings toggle from shared Navbar
   useEffect(() => {
      const handler = () => setIsAutoApplySettingsOpen(prev => !prev);
      window.addEventListener('toggle-auto-apply-settings', handler);
      return () => window.removeEventListener('toggle-auto-apply-settings', handler);
   }, []);

   // Listen for toast messages from shared Navbar
   useEffect(() => {
      const handler = (e: Event) => {
         const { msg, type } = (e as CustomEvent).detail;
         setToasts(prev => {
            const id = Date.now();
            const result = [{ id, msg, type: type || "info" }, ...prev];
            setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 5000);
            return result;
         });
      };
      window.addEventListener('show-toast', handler);
      return () => window.removeEventListener('show-toast', handler);
   }, []);

   const sanitizeInput = (input: string) => {
      return input
         .replace(/[<>"'`]/g, '')
         .replace(/javascript:/gi, '')
         .replace(/on\w+=/gi, '')
         .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
         .trim();
   };

     // Auto-scan runs every 30 seconds for ALL in-progress lobbies (server-verified Raider.io sync)
     const syncDetectedRunsFromServer = useCallback(async (lobbyId: string) => {
        try {
           const res = await fetch("/api/lobbies/sync-runs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ lobbyId: String(lobbyId) }),
           });
           if (!res.ok) return;
           const data = await res.json();
           if (!data.lobby) return;
           const key = String(lobbyId);
           setLobbies((prev) => prev.map((l) => (String(l.id) === key ? data.lobby : l)));
           setTargetLobby((prev: any) => (prev && String(prev.id) === key ? data.lobby : prev));
        } catch {
           /* ignore transient sync errors */
        }
     }, []);

     useEffect(() => {
        const scanInterval = setInterval(() => {
           lobbies
              .filter((l) => l.status === "in_progress" && l.category !== "leveling")
              .forEach((lobby) => {
                 if (lobby.missionStartTime && Date.now() - lobby.missionStartTime < 24 * 60 * 60 * 1000) {
                    syncDetectedRunsFromServer(String(lobby.id));
                 }
              });
        }, 30000);
        return () => clearInterval(scanInterval);
     }, [lobbies, syncDetectedRunsFromServer]);

    // Auto-archive completed+paid lobbies after 30 min, auto-cleanup stale offers
     useEffect(() => {
        const cleanupInterval = setInterval(() => {
           const now = Date.now();
           const expirationTime = 30 * 60 * 1000;

           let changed = false;

           const filteredGold = goldOffers.filter(offer => {
              const creationTime = parseInt(offer.id);
              if (isNaN(creationTime)) return true;
              const age = now - creationTime;
              const isExpired = age > expirationTime;
              if (isExpired) {
                 console.log(`Gold offer ${offer.id} expired. Age: ${age}ms`);
                 changed = true;
              }
              return !isExpired;
           });

           if (changed) {
              setGoldOffers(filteredGold);
              saveGlobalData({ goldOffers: filteredGold });
           }
        }, 60 * 1000); // Check every minute

         return () => clearInterval(cleanupInterval);
      }, [goldOffers]);

   // Auto-open manage modal when lobby transitions to in_progress (run auto-starts)
   const autoOpenedRef = useRef<Set<string>>(new Set());
   const lobbyStatusSnapshotRef = useRef<Record<string, string>>({});
   const lobbyAutoOpenHydratedRef = useRef(false);
   const uiSessionRestoredRef = useRef(false);
   const splitInFlightRef = useRef(false);
   const profileSaveInFlightRef = useRef(false);
   const autoAcceptBusyRef = useRef(false);

   const AUTO_CANCELLED_KEY = "uplink_auto_cancelled_lobbies";

   const markAutoApplyCancelled = useCallback((lobbyId: string) => {
      if (typeof window === "undefined") return;
      try {
         const prev: string[] = JSON.parse(localStorage.getItem(AUTO_CANCELLED_KEY) || "[]");
         const ids = new Set(prev.map(String));
         ids.add(String(lobbyId));
         localStorage.setItem(AUTO_CANCELLED_KEY, JSON.stringify([...ids]));
      } catch {
         localStorage.setItem(AUTO_CANCELLED_KEY, JSON.stringify([String(lobbyId)]));
      }
   }, []);

   const isAutoApplyCancelled = useCallback((lobbyId: string) => {
      if (typeof window === "undefined") return false;
      try {
         const cancelled: string[] = JSON.parse(localStorage.getItem(AUTO_CANCELLED_KEY) || "[]");
         return cancelled.map(String).includes(String(lobbyId));
      } catch {
         return false;
      }
   }, []);

   const markAutoApplyBlocked = useCallback((lobbyId: string, parentId?: string) => {
      if (typeof window === "undefined") return;
      const lobby = lobbies.find((l) => String(l.id) === String(lobbyId));
      const rootIds = new Set<string>();
      if (lobby) rootIds.add(getOfferFamilyRootId(lobby, lobbies));
      if (parentId) {
         const parent = lobbies.find((l) => String(l.id) === String(parentId));
         if (parent) rootIds.add(getOfferFamilyRootId(parent, lobbies));
      }
      try {
         const idKey = "uplink_auto_blocked_lobbies";
         const prevIds: string[] = JSON.parse(localStorage.getItem(idKey) || "[]");
         const ids = new Set(prevIds.map(String));
         ids.add(String(lobbyId));
         if (parentId) ids.add(String(parentId));
         if (lobby) {
            getOfferThreadFamily(lobby, lobbies).forEach((l) => ids.add(String(l.id)));
         }
         localStorage.setItem(idKey, JSON.stringify([...ids]));

         const rootKey = "uplink_auto_blocked_roots";
         const prevRoots: string[] = JSON.parse(localStorage.getItem(rootKey) || "[]");
         const roots = new Set(prevRoots.map(String));
         rootIds.forEach((r) => roots.add(r));
         localStorage.setItem(rootKey, JSON.stringify([...roots]));
      } catch {
         localStorage.setItem("uplink_auto_blocked_lobbies", JSON.stringify([String(lobbyId)]));
      }
   }, [lobbies]);

   const isAutoApplyBlocked = useCallback(
      (lobby: any) => {
         if (userExitBlockedFromLobby(lobby, lobbies, currentUserId)) return true;
         if (typeof window === "undefined") return false;
         try {
            const rootId = getOfferFamilyRootId(lobby, lobbies);
            const blockedRoots: string[] = JSON.parse(
               localStorage.getItem("uplink_auto_blocked_roots") || "[]"
            );
            if (blockedRoots.map(String).includes(rootId)) return true;

            const blocked: string[] = JSON.parse(localStorage.getItem("uplink_auto_blocked_lobbies") || "[]");
            for (const bid of blocked) {
               const bl = lobbies.find((l) => String(l.id) === String(bid));
               if (bl && getOfferFamilyRootId(bl, lobbies) === rootId) return true;
            }
         } catch {
            return false;
         }
         return false;
      },
      [lobbies, currentUserId]
   );
   const hasFetchedRef = useRef(false);
   // Auto-open manage only when a lobby newly transitions to in_progress (not on refresh / poll)
   useEffect(() => {
      if (!lobbies.length) return;

      if (!lobbyAutoOpenHydratedRef.current) {
         lobbies.forEach((l) => {
            const id = String(l.id);
            lobbyStatusSnapshotRef.current[id] = l.status || "standby";
            if (l.status === "in_progress") autoOpenedRef.current.add(id);
         });
         lobbyAutoOpenHydratedRef.current = true;
         return;
      }

      lobbies.forEach((l) => {
         const id = String(l.id);
         const prev = lobbyStatusSnapshotRef.current[id] || "standby";
         const cur = l.status || "standby";
         lobbyStatusSnapshotRef.current[id] = cur;

         if (cur !== "in_progress" || prev === "in_progress") return;
         if (isOwnerLobbyGridRepost(l, currentUserId)) return;

         const isParticipant =
            String(l.ownerId) === String(currentUserId) ||
            (l.accepted || []).some((a: any) => memberIdentityKey(a) === String(currentUserId));
         if (isParticipant && !autoOpenedRef.current.has(id)) {
            autoOpenedRef.current.add(id);
            setTargetLobby(l);
            setIsManageModalOpen(true);
         }
      });
   }, [lobbies, currentUserId]);

   const dict: any = {
      en: {
         boostNetwork: "Boost Network", goldMarket: "Gold Market", activeGrid: "Active Grid", deploy: "Deploy", mission: "Mission", gold: "Gold",
         accessTerminal: "Access Terminal", protocolAlerts: "Signal feed", noNotifs: "No active frequency detected.",
         your: "YOUR", home: "H", me: "ME", prestige: "Prestige", perRun: "Per Run", totalPayout: "Total Payout", secured: "Secured",
         administer: "Administer", cancelReg: "Cancel Registration", connectChar: "Connect Character", lockedOps: "Locked Operatives",
         incomingTrans: "Incoming Transmissions", cmdControl: "Command Control", chat: "Chat", leave: "Leave Group", msgPlaceholder: "Type a message...",
         confirmPos: "Confirm Position", positionSecured: "Mission position secured.", awaitingConf: "Awaiting Confirmation",
         timeRem: "Time Remaining", reject: "Reject", accept: "Accept", delete: "Delete",
         incTransmission: "Incoming Transmission", missionDetails: "Mission Details", securedLabel: "Secured", awaitingLabel: "Awaiting",
         typeMessage: "Type a message...", commandControl: "Command Control center", missionLead: "Mission Lead", transmissions: "Active Transmissions",
         securedOps: "Secured Operatives", secureComms: "Secure Communication Channel", noMessages: "No messages yet. Lead the charge!",
         deployTitle: "Deploy", goldListing: "Gold Listing", networkOffer: "Network Offer", keyLevelReq: "Key Level Requirement",
         visualBg: "Visual Background", goldPerRun: "Gold Per Run", totalRuns: "Total Runs", status: "Status", minIlvl: "Min Item Level",
         minScore: "Min IO Rating", dispatchMission: "Dispatch Mission", totalGold: "Total Gold (M)", pricePerM: "Price / 1M",
         paymentMethod: "Payment Method", listMarket: "List on Market"
      }
   };

   const t = (key: string) => dict[lang][key] || key;

   const addToast = (msg: string, type: "success" | "error" | "info" = "info") => {
      const id = Date.now();
      setToasts(prev => [{ id, msg, type }, ...prev]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);

      // Trigger Native Notification if allowed
      if (Notification.permission === "granted") {
         new Notification("Uplink", { body: msg, icon: "" });
      }
   };

   const tryEnableAutoApply = useCallback(
      (enabled: boolean) => {
         syncAutoApplyEnabled(enabled);
      },
      [syncAutoApplyEnabled]
   );
   const tryEnableAutoAccept = useCallback(
      (enabled: boolean) => {
         if (enabled) {
            const end = Date.now() + AUTO_ACCEPT_DURATION_MS;
            setAutoAcceptEndTime(end);
            localStorage.setItem("uplink_auto_accept_end", end.toString());
         } else {
            setAutoAcceptEndTime(0);
            localStorage.setItem("uplink_auto_accept_end", "0");
         }
         setAutoAcceptEnabled(enabled);
      },
      []
   );
   useEffect(() => {
      const onNavbarToggle = (event: Event) => {
         const enabled = (event as CustomEvent<{ enabled?: boolean }>).detail?.enabled;
         if (typeof enabled !== "boolean") return;
         if (enabled) tryEnableAutoApply(true);
         else syncAutoApplyEnabled(false);
      };
      window.addEventListener("set-auto-apply-enabled", onNavbarToggle);
      return () => window.removeEventListener("set-auto-apply-enabled", onNavbarToggle);
   }, [tryEnableAutoApply, syncAutoApplyEnabled]);

   useEffect(() => {
      if (Notification.permission === "default") {
         Notification.requestPermission();
      }
   }, []);

   const playSound = (type: 'notify' | 'reward' | 'terminal' | 'error') => {
      const audios = {
         notify: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3',
         reward: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
         terminal: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
         error: 'https://assets.mixkit.co/active_storage/sfx/2360/2360-preview.mp3'
      };
      const audio = new Audio(audios[type]);
      audio.volume = type === 'reward' ? 0.5 : 0.3;
      audio.play().catch(() => { });
   };

   const [raiderLink, setRaiderLink] = useState("");
   const [userKeystone, setUserKeystone] = useState("");

   // Bot sync: refresh in-progress lobbies every 60 seconds
   useEffect(() => {
       const interval = setInterval(() => {
           lobbies.forEach((l: any) => {
               if (l.status === 'in_progress' && l.category !== 'leveling') {
                   syncDetectedRunsFromServer(String(l.id));
               }
           });
       }, 60000);
       return () => clearInterval(interval);
   }, [lobbies, syncDetectedRunsFromServer]);
   const [isSyncing, setIsSyncing] = useState(false);
   const [targetLobby, setTargetLobby] = useState<any>(null);

    useEffect(() => {
       if (typeof window === "undefined") return;
       if (isManageModalOpen && targetLobby?.id) {
          localStorage.setItem("uplink_manage_open", "true");
          localStorage.setItem("uplink_focus_lobby_id", String(targetLobby.id));
       } else {
          localStorage.setItem("uplink_manage_open", "false");
          localStorage.removeItem("uplink_focus_lobby_id");
       }
       localStorage.removeItem("uplink_target_lobby");
    }, [isManageModalOpen, targetLobby?.id]);

    // Restore manage modal position once after first lobby sync (refresh)
    useEffect(() => {
       if (!lobbies.length || uiSessionRestoredRef.current) return;
       uiSessionRestoredRef.current = true;

       const manageOpen = localStorage.getItem("uplink_manage_open") === "true";
       let focusId = localStorage.getItem("uplink_focus_lobby_id");
       if (!focusId) {
          try {
             const legacy = JSON.parse(localStorage.getItem("uplink_target_lobby") || "null");
             if (legacy?.id) focusId = String(legacy.id);
          } catch {
             focusId = null;
          }
       }

       if (!manageOpen || !focusId) return;

       const lobby = lobbies.find((l) => String(l.id) === focusId);
       if (lobby && userCanViewOfferThread(lobby, currentUserId, currentUserDiscordHandle)) {
          setTargetLobby(lobby);
          setIsManageModalOpen(true);
       } else {
          localStorage.setItem("uplink_manage_open", "false");
          localStorage.removeItem("uplink_focus_lobby_id");
       }
    }, [lobbies, currentUserId]);

    const [ratePickerData, setRatePickerData] = useState<{ lobbyId: string; missionTitle?: string; targets: { id: string; name: string; avatar: string; role: string }[] } | null>(null);
    const [ratingModalData, setRatingModalData] = useState<{ lobbyId: string; rateeId: string; rateeName: string } | null>(null);

   const isUserEligibleForLobby = (lobby: any) => {
      const uid = String(currentUserId);
      if ((lobby.accepted || []).some((a: any) => memberIdentityKey(a) === uid)) return false;
      if ((lobby.applicants || []).some((a: any) => memberIdentityKey(a) === uid)) return false;

      if (!myCharacters || myCharacters.length === 0) return false;
      // Region check
      if (lobby.serverRegion && !myCharacters.some((c: any) => (c.region || '').toLowerCase() === lobby.serverRegion.toLowerCase())) return false;
      return myCharacters.some(char => {
         const matchRole = (lobby.roles?.[char.role] || 0) > 0;
        const metIlvl = char.ilvl >= (lobby.minIlvl || 0);
        const hasRoleScores = char.roleScores && typeof char.roleScores === 'object';
        const roleScore = hasRoleScores ? (char.roleScores[char.role] || 0) : Number(String(char.score || 0).replace('+', ''));
        const metScore = roleScore >= (lobby.minScore || 0);
        const notBlacklisted = !(lobby.blacklistedClasses || []).includes(char.class);
        return matchRole && metIlvl && metScore && notBlacklisted;
     });
    };
    const getEligibilityReason = (lobby: any) => {
        const uid = String(currentUserId);
        if ((lobby.accepted || []).some((a: any) => memberIdentityKey(a) === uid)) {
          return "ALREADY IN THIS SQUAD";
        }
        if ((lobby.applicants || []).some((a: any) => memberIdentityKey(a) === uid)) {
          return "ALREADY APPLIED";
        }

        if (!myCharacters || myCharacters.length === 0) return "NO CHARACTERS SYNCED";

        const reasons: string[] = [];
        // Region check
        const hasCharForRegion = !lobby.serverRegion || myCharacters.some((c: any) => (c.region || '').toLowerCase() === lobby.serverRegion.toLowerCase());
        if (!hasCharForRegion) {
          reasons.push(`${lobby.serverRegion.toUpperCase()} CHARACTER MISSING`);
        }
        myCharacters.forEach(char => {
           const matchRole = (lobby.roles?.[char.role] || 0) > 0;
          const metIlvl = char.ilvl >= (lobby.minIlvl || 0);
          const hasRoleScores = char.roleScores && typeof char.roleScores === 'object';
          const roleScore = hasRoleScores ? (char.roleScores[char.role] || 0) : Number(String(char.score || 0).replace('+', ''));
          const metScore = roleScore >= (lobby.minScore || 0);
          const notBlacklisted = !(lobby.blockedRoles || []).some((b: any) => b.class === char.class && b.role === char.role);

          if (!matchRole) reasons.push(`${char.role.toUpperCase()} SLOTS FULL`);
          if (!metIlvl) reasons.push(`${char.class} ILVL ${char.ilvl} < ${lobby.minIlvl}`);
          if (!metScore) reasons.push(`${char.class} IO ${char.score} < ${lobby.minScore}`);
          if (!notBlacklisted) reasons.push(`${char.class} ${char.role.toUpperCase()} BLOCKED`);
       });

       return Array.from(new Set(reasons)).length > 0 ? Array.from(new Set(reasons)).join(" | ") : "NO QUALIFIED CHARACTER";
    };
   const [selectedCharId, setSelectedCharId] = useState<number | null>(null);

   const [bankCharacters, setBankCharacters] = useState<any[]>([]);
   const [bankName, setBankName] = useState("");
   const [bankRealm, setBankRealm] = useState("");
   const [bankRegion, setBankRegion] = useState("eu");
   const [isVerifyingBank, setIsVerifyingBank] = useState(false);
   const [expandedLobbyId, setExpandedLobbyId] = useState<string | null>(() => {
      if (typeof window === "undefined") return null;
      return sessionStorage.getItem("uplink_expanded_lobby") || null;
   });
   const scrollRestoredRef = useRef(false);

   const handleSyncBank = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!bankName || !bankRealm) return;
      setIsVerifyingBank(true);
      try {
         const res = await fetch(`https://raider.io/api/v1/characters/profile?region=${bankRegion}&realm=${bankRealm}&name=${bankName}`);
         if (res.ok) {
            const data = await res.json();
            setBankCharacters(prev => [{ id: Date.now(), name: data.name, realm: data.realm, region: data.region, class: data.class }, ...prev]);
            setBankName("");
            setBankRealm("");
            addToast("Bank character verified and synced.", "success");
         } else addToast("Character not found on terminal.", "error");
      } catch (err) { addToast("Connection lost with IO Server.", "error"); }
      setIsVerifyingBank(false);
   };


    // Default form data factory
    const getDefaultFormData = () => {
       const shuffled = [...DUNGEONS].sort(() => Math.random() - 0.5);
       const autoSelected: Record<string, number> = {};
       for (let i = 0; i < 4; i++) {
         autoSelected[shuffled[i].name] = 1;
       }
       return {
          dungeonImage: DUNGEONS[0].img, goldAmount: "50", runsCount: "4", keyLevel: "+10", notes: "",
          minIlvl: "266", minScore: "2500", hasKey: "I have the key", roles: { tank: 1, healer: 1, dps: 2 },
           blacklistedClasses: [] as string[],
           blockedRoles: [] as { class: string; role: string }[],
           selectedDungeons: autoSelected,
           category: 'dungeon',
           isTimed: true,
           startLevel: "1",
           endLevel: "80",
           goldPerRun: "12",
           boosterNote: "",
            serverRegion: typeof window !== 'undefined' ? (localStorage.getItem("uplink_region") || "US") : "US"
        };
    };

    const lobbyToFormData = (lobby: any) => ({
       dungeonImage: lobby.dungeonImage || DUNGEONS[0]?.img || "",
       goldAmount: String(lobby.goldAmount || lobby.totalGold || "50"),
       runsCount: String(lobby.runsCount || "1"),
       keyLevel: lobby.keyLevel || "+10",
       notes: lobby.notes || "",
       minIlvl: lobby.minIlvl || "266",
       minScore: lobby.minScore || "2500",
       hasKey: lobby.hasKey || "I have the key",
       roles: lobby.roles || { tank: 1, healer: 1, dps: 2 },
       blacklistedClasses: lobby.blacklistedClasses || [],
       blockedRoles: lobby.blockedRoles || [],
       selectedDungeons: lobby.selectedDungeons || {},
       category: lobby.category || 'dungeon',
       isTimed: lobby.isTimed ?? true,
       startLevel: lobby.startLevel || "1",
       endLevel: lobby.endLevel || "80",
       goldPerRun: String(lobby.goldPerRun || lobby.totalGold || "50"),
       boosterNote: lobby.boosterNote || "",
        serverRegion: lobby.serverRegion || "US"
    });

    const [formData, setFormData] = useState(() => getDefaultFormData());

   // Gold perRun sync — goldAmount is now per-run value
   useEffect(() => {
      const perRun = parseFloat(formData.goldAmount) || 0;
      if (formData.goldPerRun !== perRun.toString()) {
         setFormData(prev => ({ ...prev, goldPerRun: perRun.toString() }));
      }
   }, [formData.goldAmount]);

   const [goldFormData, setGoldFormData] = useState({
      amountM: "5", pricePerM: "40", method: "Vodafone Cash", notes: "Fast delivery"
   });

     const saveGlobalData = useCallback(async (updates: any) => {
        const hasProfileUpdate = Boolean(
          updates?.registeredUsers &&
          currentUserId &&
          updates.registeredUsers.some((u: any) => String(u.id) === String(currentUserId))
        );
        if (hasProfileUpdate) profileSaveInFlightRef.current = true;

        try {
           let profileSaved = false;

           if (hasProfileUpdate) {
              const self = updates.registeredUsers.find(
                 (u: any) => String(u.id) === String(currentUserId)
              );
              if (self) {
                 const res = await fetch("/api/users/me", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ profile: self }),
                 });
                 if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    console.error("Profile save failed:", err.error || res.status);
                    if (err.error) {
                       window.dispatchEvent(
                          new CustomEvent("show-toast", { detail: { msg: err.error, type: "error" } })
                       );
                    }
                    return false;
                 }
                 profileSaved = true;
              }
           }

           const { registeredUsers: _ru, ...rest } = updates || {};
           const restKeys = Object.keys(rest);
           if (restKeys.length === 0) {
              if (profileSaved) window.dispatchEvent(new CustomEvent("data-refresh"));
              return profileSaved;
           }

           const res = await fetch("/api/data", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify(rest),
           });
           if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              if (err.error) {
                 window.dispatchEvent(new CustomEvent("show-toast", { detail: { msg: err.error, type: "error" } }));
              }
              return false;
           }
           window.dispatchEvent(new CustomEvent("data-refresh"));
           return true;
        } catch (e) {
           console.error("saveGlobalData failed:", e);
           return false;
        } finally {
           if (hasProfileUpdate) {
              setTimeout(() => {
                 profileSaveInFlightRef.current = false;
              }, 1500);
           }
        }
     }, [currentUserId]);

   const buildApplicantPayload = useCallback(
      (char: any, extras: Record<string, unknown> = {}) => {
         const me = registeredUsers.find((u: any) => String(u.id) === String(currentUserId));
         const roleScore = char.roleScores?.[char.role] ?? char.score ?? 0;
         const note = sanitizeApplicantNote(extras.applicantNote);
         return {
            ...char,
            score: String(roleScore),
            applicantName: resolveProfileDisplayName(me, currentUserDisplay),
            applicantId: currentUserId,
            applicantAvatar: me ? resolveProfileImage(me) : session?.user?.image || "",
            applicantEffect: myEffect,
            raiderRegion: String(char.region || "eu").toLowerCase(),
            raiderRealm: char.realm,
            raiderName: char.name,
            ...extras,
            ...(note ? { applicantNote: note } : { applicantNote: undefined }),
         };
      },
      [registeredUsers, currentUserId, currentUserDisplay, myEffect, session?.user?.image]
   );

     const applyToLobby = useCallback(async (lobbyId: string, applicant: any) => {
        const lobbyKey = String(lobbyId);
        if (applyingLobbyIds.current.has(lobbyKey)) return false;
        applyingLobbyIds.current.add(lobbyKey);

        setLobbies((prev) =>
           prev.map((l) =>
              String(l.id) === lobbyKey
                 ? { ...l, applicants: [...(l.applicants || []), applicant] }
                 : l
           )
        );

        try {
           const res = await fetch("/api/lobbies/apply", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ lobbyId: lobbyKey, applicant }),
           });
           if (!res.ok) {
              setLobbies((prev) =>
                 prev.map((l) =>
                    String(l.id) === lobbyKey
                       ? {
                            ...l,
                            applicants: (l.applicants || []).filter(
                               (a: any) => String(a.applicantId) !== String(currentUserId)
                            ),
                         }
                       : l
                 )
              );
              const err = await res.json().catch(() => ({}));
              if (res.status === 429 && err.error) {
                 window.dispatchEvent(new CustomEvent("show-toast", { detail: { msg: err.error, type: "error" } }));
              }
              return false;
           }
           const data = await res.json();
           if (data.lobby) {
              setLobbies((prev) => prev.map((l) => (String(l.id) === lobbyKey ? data.lobby : l)));
              setTargetLobby((prev: any) => (prev && String(prev.id) === lobbyKey ? data.lobby : prev));
           }
           window.dispatchEvent(new CustomEvent("data-refresh"));
           return true;
        } catch {
           setLobbies((prev) =>
              prev.map((l) =>
                 String(l.id) === lobbyKey
                    ? {
                         ...l,
                         applicants: (l.applicants || []).filter(
                            (a: any) => String(a.applicantId) !== String(currentUserId)
                         ),
                      }
                    : l
              )
           );
           return false;
        } finally {
           applyingLobbyIds.current.delete(lobbyKey);
        }
     }, [currentUserId]);

     const updateApplicationInLobby = useCallback(async (lobbyId: string, applicant: any) => {
        const lobbyKey = String(lobbyId);
        const uid = String(currentUserId);

        setLobbies((prev) =>
           prev.map((l) => {
              if (String(l.id) !== lobbyKey) return l;
              const applicants = (l.applicants || []).map((a: any) =>
                 memberMatchesUser(a, uid) ? { ...a, ...applicant, applicantId: uid } : a
              );
              return { ...l, applicants };
           })
        );
        setTargetLobby((prev: any) => {
           if (!prev || String(prev.id) !== lobbyKey) return prev;
           const applicants = (prev.applicants || []).map((a: any) =>
              memberMatchesUser(a, uid) ? { ...a, ...applicant, applicantId: uid } : a
           );
           return { ...prev, applicants };
        });

        try {
           const res = await fetch("/api/lobbies/apply", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ lobbyId: lobbyKey, applicant }),
           });
           if (!res.ok) return false;
           const data = await res.json();
           if (data.lobby) {
              setLobbies((prev) => prev.map((l) => (String(l.id) === lobbyKey ? data.lobby : l)));
              setTargetLobby((prev: any) => (prev && String(prev.id) === lobbyKey ? data.lobby : prev));
           }
           window.dispatchEvent(new CustomEvent("data-refresh"));
           return true;
        } catch {
           return false;
        }
     }, [currentUserId]);

     const withdrawFromLobby = useCallback(async (lobbyId: string) => {
        const lobbyKey = String(lobbyId);
        const uid = String(currentUserId);
        setLobbies((prev) => {
           const next = withdrawApplicantFromOfferFamily(prev, lobbyKey, uid);
           setTargetLobby((tl: any) => {
              if (!tl) return tl;
              return next.find((l) => String(l.id) === String(tl.id)) ?? tl;
           });
           return next;
        });
        try {
           const res = await fetch(`/api/lobbies/apply?lobbyId=${encodeURIComponent(lobbyKey)}`, {
              method: "DELETE",
           });
           if (res.ok) {
              const data = await res.json();
              if (data.lobby) {
                 setLobbies((prev) => {
                    const next = withdrawApplicantFromOfferFamily(prev, lobbyKey, uid);
                    return next.map((l) => {
                       const serverMatch = String(l.id) === String(data.lobby.id);
                       return serverMatch ? data.lobby : l;
                    });
                 });
              }
           }
           window.dispatchEvent(new CustomEvent("data-refresh"));
           return res.ok;
        } catch {
           return false;
        }
     }, [currentUserId]);

     const lobbiesRef = useRef(lobbies);
     lobbiesRef.current = lobbies;
     const autoAppliedRef = useRef(autoAppliedLobbies);
     autoAppliedRef.current = autoAppliedLobbies;

     // Drop stale auto-apply locks only when user is fully disengaged from the offer
     useEffect(() => {
        if (!autoAppliedLobbies.length) return;
        const uid = String(currentUserId);
         const next = autoAppliedLobbies.filter((lobbyId) => {
           if (isAutoApplyCancelled(lobbyId)) return false;
           const lobby = lobbies.find((l) => String(l.id) === lobbyId);
           if (!lobby) return false;
           const inApplicants = (lobby.applicants || []).some(
              (a: any) => memberMatchesUser(a, uid)
           );
           const inAccepted = (lobby.accepted || []).some(
              (a: any) => memberMatchesUser(a, uid)
           );
           return inApplicants || inAccepted;
        });
        if (next.length !== autoAppliedLobbies.length) {
           setAutoAppliedLobbies(next);
           localStorage.setItem("uplink_auto_applied", JSON.stringify(next));
        }
     }, [lobbies, currentUserId, autoAppliedLobbies, isAutoApplyCancelled]);

     // Auto-Apply: scan on an interval so polling does not retrigger apply/cancel loops
     useEffect(() => {
        const user = registeredUsers.find(
           (u: any) => String(u.id) === String(currentUserId) || u.username === currentUserId
        );
        const sub = user?.subscription;
        const isSecretClub =
           currentUserId === "1497295886223544471" ||
           (sub?.tier === "secret_club" && (!sub.endDate || Date.now() <= sub.endDate));
        if (!autoApplyEnabled || !isSecretClub) return;
        if (myCharacters.length === 0 || !autoApplyCharId) return;
        const selectedChar = myCharacters.find((c) => String(c.id) === String(autoApplyCharId));
        if (!selectedChar) return;

        let cancelled = false;
        const run = async () => {
           const snapshot = lobbiesRef.current;
           const appliedSnapshot = autoAppliedRef.current;
           const openLobbies = snapshot.filter((l) => {
              if (!isLobbyListedInPublicFeed(l)) return false;
              if (String(l.ownerId) === String(currentUserId)) return false;
              const cat = l.category || "dungeon";
              if (cat === "raid") return false;
              return cat === autoApplyCategory;
           });

           for (const lobby of openLobbies) {
              if (cancelled) return;
              const lobbyKey = String(lobby.id);
              const uid = String(currentUserId);
              const alreadyPending = (lobby.applicants || []).some(
                 (a: any) => memberMatchesUser(a, uid)
              );
              const alreadyAccepted = (lobby.accepted || []).some(
                 (a: any) => memberMatchesUser(a, uid)
              );
              if (alreadyAccepted) continue;
              if (alreadyPending) continue;
              if (appliedSnapshot.includes(lobbyKey)) continue;
              if (applyingLobbyIds.current.has(lobbyKey)) continue;
              if (isAutoApplyCancelled(lobbyKey)) continue;
              if (isAutoApplyBlocked(lobby)) continue;

              const char = selectedChar;
              const matchRole = (lobby.roles?.[char.role] || 0) > 0;
              const metIlvl = Number(char.ilvl || 0) >= Number(lobby.minIlvl || 0);
              const hasRoleScores = char.roleScores && typeof char.roleScores === "object";
              const roleScore = hasRoleScores
                 ? Number(char.roleScores[char.role] || 0)
                 : Number(String(char.score || 0).replace("+", ""));
              const metScore = roleScore >= Number(lobby.minScore || 0);
              const notBlockedRole = !(lobby.blockedRoles || []).some(
                 (b: any) => b.class === char.class && b.role === char.role
              );
              const notBlacklisted = !(lobby.blacklistedClasses || []).includes(char.class);
              const meetsMinGold = autoApplyMinGold === 0 || Number(lobby.goldPerRun || 0) >= autoApplyMinGold;
              const charRegion = String(char.region || "EU").toLowerCase();
              const lobbyRegion = String(lobby.serverRegion || "EU").toLowerCase();
              const matchesRegion = charRegion === lobbyRegion;
              if (
                 !(
                    matchRole &&
                    metIlvl &&
                    metScore &&
                    notBlockedRole &&
                    notBlacklisted &&
                    meetsMinGold &&
                    matchesRegion
                 )
              ) {
                 continue;
              }

              const applicant = buildApplicantPayload(char, {
                 keystone: resolveDungeonSelection(autoApplyKey)?.name || autoApplyKey || "",
                 applicantKeyLevel: autoApplyKeyLevel,
                 applicantDropLevel: autoApplyDropLevel,
                 applicantNote: sanitizeApplicantNote(applyNote) || undefined,
              });

              const ok = await applyToLobby(lobbyKey, applicant);
              if (!ok || cancelled) continue;

              setAutoAppliedLobbies((prev) => {
                 if (prev.includes(lobbyKey)) return prev;
                 const next = [...prev, lobbyKey];
                 localStorage.setItem("uplink_auto_applied", JSON.stringify(next));
                 return next;
              });
              addToast(`Auto-Applied to ${lobby.title} with ${char.name}!`, "success");
           }
        };

        runAutoApplyRef.current = run;
        run();
        const interval = setInterval(run, 2500);
        return () => {
           cancelled = true;
           clearInterval(interval);
        };
     }, [
        autoApplyEnabled,
        registeredUsers,
        myCharacters,
        currentUserId,
        currentUserDisplay,
        session,
        autoApplyCategory,
        autoApplyKey,
        autoApplyKeyLevel,
        autoApplyDropLevel,
        autoApplyCharId,
        autoApplyMinGold,
        applyNote,
        myEffect,
        applyToLobby,
        buildApplicantPayload,
        isAutoApplyBlocked,
        isAutoApplyCancelled,
     ]);

     // Push note / role / key changes to pending applications (live for offer owner)
     useEffect(() => {
        const uid = String(currentUserId);
        if (!uid || uid === "guest") return;
        const char = myCharacters.find((c) => String(c.id) === String(autoApplyCharId));
        if (!char) return;

        const timer = setTimeout(() => {
           const pending = lobbiesRef.current.filter((l) =>
              (l.applicants || []).some((a: any) => memberMatchesUser(a, uid))
           );
           if (!pending.length) return;

           const note = sanitizeApplicantNote(applyNote) || undefined;
           const payload = buildApplicantPayload(char, {
              keystone: resolveDungeonSelection(autoApplyKey)?.name || autoApplyKey || "",
              applicantKeyLevel: autoApplyKeyLevel,
              applicantDropLevel: autoApplyDropLevel,
              applicantNote: note,
           });
           for (const lobby of pending) {
              const existing = (lobby.applicants || []).find((a: any) => memberMatchesUser(a, uid));
              if (!existing) continue;
              const same =
                 String(existing.id) === String(payload.id) &&
                 String(existing.role) === String(payload.role) &&
                 String(existing.class) === String(payload.class) &&
                 String(existing.score) === String(payload.score) &&
                 String(existing.ilvl) === String(payload.ilvl) &&
                 String(existing.keystone || "") === String(payload.keystone || "") &&
                 String(existing.applicantKeyLevel ?? "") === String(payload.applicantKeyLevel ?? "") &&
                 String(existing.applicantDropLevel ?? "") === String(payload.applicantDropLevel ?? "") &&
                 String(existing.applicantNote || "") === String(note || "");
              if (same) continue;
              void updateApplicationInLobby(String(lobby.id), payload);
           }
        }, 600);

        return () => clearTimeout(timer);
     }, [
        applyNote,
        autoApplyKey,
        autoApplyKeyLevel,
        autoApplyDropLevel,
        autoApplyCharId,
        myCharacters,
        currentUserId,
        buildApplicantPayload,
        updateApplicationInLobby,
     ]);

   const fetchGlobalData = async () => {
      try {
         const res = await fetch('/api/data', { credentials: 'include' });
         if (res.ok) {
            const data = await res.json();
            const now = Date.now();
            const activeNotifs = (data.notifications || []).filter((n: any) => (now - n.timestamp) < 600000); // 10 minutes session life

            if (data.lobbies) {
               let finalLobbies = data.lobbies;
               if (handleRef.current) {
                  const aaEnabled = localStorage.getItem("uplink_auto_accept") === "true";
                  const aaEnd = parseInt(localStorage.getItem("uplink_auto_accept_end") || "0") || 0;
                  const aaActive = aaEnabled && aaEnd > now;
                  const autoNotif = (activeNotifs || []).find((n: any) => {
                     if (!notificationMatchesUser(n, currentUserId, handleRef.current!, data.registeredUsers || [])) return false;
                     if (shownNotifIds.current.includes(n.id)) return false;
                     if (n.type !== "lobby_accept" && n.type !== "lobby_confirm") return false;
                     if (!aaActive) return false;
                     const lobby = finalLobbies.find((l: any) => String(l.id) === String(n.lobbyId));
                     if (!lobby || !isLevelingOffer(lobby)) return false;
                     return true;
                  });
                  if (autoNotif) {
                     const lobby = finalLobbies.find((l: any) => String(l.id) === String(autoNotif.lobbyId));
                     const uid = String(currentUserId);
                     const appData =
                        autoNotif.applicantData ||
                        (lobby?.accepted || []).find(
                           (a: any) => memberIdentityKey(a) === uid && a.status === "invited"
                        ) ||
                        (lobby?.applicants || []).find(
                           (a: any) =>
                              String(a.id) === String(autoNotif.applicantId) ||
                              memberIdentityKey(a) === uid
                        );
                     const alreadyConfirmed = (lobby?.accepted || []).some(
                        (a: any) => memberIdentityKey(a) === uid && a.status !== "invited"
                     );
                     if (appData && !alreadyConfirmed) {
                        finalLobbies = acceptApplicantAcrossLobbies(
                           finalLobbies,
                           autoNotif.lobbyId,
                           appData
                        );
                        saveGlobalData({
                           lobbies: finalLobbies,
                           notifications: activeNotifs.filter((n: any) => n.id !== autoNotif.id),
                        });
                     }
                     shownNotifIds.current.push(autoNotif.id);
                  }
                }
                // Clean up orphaned payment_pending lobbies from old kick logic
                if (finalLobbies) {
                  finalLobbies = finalLobbies.map((l: any) => {
                    if (l.status === 'payment_pending' && !l.paymentProof) {
                      return { ...l, status: 'cancelled' as const };
                    }
                    return l;
                  });
                }
                  finalLobbies = (finalLobbies || []).map(repairLobbyRoles);
                  setLobbies((prev) =>
                     mergeLobbiesFromServer(
                        finalLobbies,
                        prev.map(repairLobbyRoles),
                        currentUserId,
                        splitInFlightRef.current || autoAcceptBusyRef.current
                     ).map(repairLobbyRoles)
                  );
                 if (hasFetchedRef.current && finalLobbies?.length) {
                  const others = finalLobbies.filter((l: any) => String(l.ownerId) !== String(currentUserId));
                  const currentIds = new Set<string>(others.map((l: any) => String(l.id)));
                  const newIds = Array.from(currentIds).filter((id: string) => !knownLobbyIds.current.has(id));
                  if (newIds.length > 0) {
                    addToast('New offer available!', 'info');
                    if (localStorage.getItem("uplink_offer_sounds") !== "false") {
                      playSound('reward');
                    }
                    void runAutoApplyRef.current?.();
                  }
                  knownLobbyIds.current = new Set([...knownLobbyIds.current, ...currentIds]);
                } else if (finalLobbies) {
                  hasFetchedRef.current = true;
                  knownLobbyIds.current = new Set(
                     finalLobbies.filter((l: any) => String(l.ownerId) !== String(currentUserId)).map((l: any) => String(l.id))
                  );
                }
             }
            if (data.goldOffers) setGoldOffers(data.goldOffers);
            setNotifications(activeNotifs);
            if (data.registeredUsers) {
               setRegisteredUsers((prev) =>
                  mergeRegisteredUsersFromServer(
                     data.registeredUsers,
                     prev,
                     currentUserId,
                     profileSaveInFlightRef.current
                  )
               );
            }
            if (data.bannedUsers) setBannedUsers(data.bannedUsers);
            if (data.characters) setGlobalCharacters(data.characters.map((c: any) => ({
    ...c, roleScores: c.roleScores && c.roleScores.dps !== c.roleScores.healer ? c.roleScores
        : { dps: c.role === 'dps' ? (c.score || "0") : "0", healer: c.role === 'healer' ? (c.score || "0") : "0", tank: c.role === 'tank' ? (c.score || "0") : "0" }
})));
            if (data.directMessages) setDirectMessages(data.directMessages);
            if (data.friends) setFriends(data.friends);
             if (data.applications) setApplications(data.applications);
             if (data.tickets) {
                const activeTickets = data.tickets.filter((t: any) => !isTicketExpired(t));
                setTickets(activeTickets);
                if (selectedTicket && !activeTickets.some((t: any) => String(t.id) === String(selectedTicket.id))) {
                   setSelectedTicket(null);
                }
                if (isAdmin) {
                   for (const t of activeTickets) {
                      const tid = String(t.id);
                      const count = t.messages?.length || 0;
                      const isNew = !knownTicketIds.current.has(tid);
                      const prevCount = ticketMsgCount.current.get(tid) || 0;
                      if (hasFetchedTicketsRef.current) {
                         if (isNew && t.status === "open") {
                            const isOrder = String(t.subject || "").includes("Secret Club");
                            addToast(isOrder ? "New Secret Club order!" : `New ticket: ${t.subject}`, "info");
                            playSound("reward");
                         } else if (!isNew && count > prevCount) {
                            const last = t.messages?.[count - 1];
                            if (last && String(last.fromId) !== String(currentUserId)) {
                               const isOrder = String(t.subject || "").includes("Secret Club");
                               addToast(isOrder ? "New message on shop order" : "New ticket message", "info");
                               playSound("reward");
                            }
                         }
                      }
                      knownTicketIds.current.add(tid);
                      ticketMsgCount.current.set(tid, count);
                   }
                   if (!hasFetchedTicketsRef.current) hasFetchedTicketsRef.current = true;
                }
             }

             // Auto-popup: leveling auto-confirms silently; dungeon always shows 60s accept modal.
            if (handleRef.current) {
               const aaEnabled = localStorage.getItem("uplink_auto_accept") === "true";
               const aaEnd = parseInt(localStorage.getItem("uplink_auto_accept_end") || "0") || 0;
               const aaActive = aaEnabled && aaEnd > now;
               const popupLobbies = data.lobbies || lobbiesRef.current || [];
               const myNewNotifs = activeNotifs.filter((n: any) => {
                  if (!notificationMatchesUser(n, currentUserId, handleRef.current, data.registeredUsers || [])) return false;
                  if (shownNotifIds.current.includes(n.id)) return false;
                  if (n.type !== "lobby_accept" && n.type !== "lobby_confirm") return false;
                  if (!aaActive) return true;
                  const lobby = popupLobbies.find((l: any) => String(l.id) === String(n.lobbyId));
                  return !!(lobby && !isLevelingOffer(lobby));
               });

                 if (myNewNotifs.length > 0) {
                    const latest = myNewNotifs[myNewNotifs.length - 1];
                    setInviteToReview(latest);
                    shownNotifIds.current.push(latest.id);
                    playSound('reward');
                  }
            }
         }
      } catch (e) { } finally {
         setGlobalDataReady(true);
      }
   };

   useEffect(() => {
      fetchGlobalData();
      // Load local-only user data
      if (currentUserId !== "guest") {
         const savedChars = localStorage.getItem(`UL_CHARS_${currentUserId}`);
         const savedBank = localStorage.getItem(`UL_BANK_${currentUserId}`);
          if (savedChars) {
             const parsed = JSON.parse(savedChars);
             const seen = new Set();
              setMyCharacters(parsed.filter((c: any) => { const k = `${c.name}|${c.realm}`; if (seen.has(k)) return false; seen.add(k); return true; }).map((c: any) => ({
                 ...c, roleScores: c.roleScores && c.roleScores.dps !== c.roleScores.healer ? c.roleScores
                    : { dps: c.role === 'dps' ? (c.score || "0") : "0", healer: c.role === 'healer' ? (c.score || "0") : "0", tank: c.role === 'tank' ? (c.score || "0") : "0" }
              })));
          }
         if (savedBank) setBankCharacters(JSON.parse(savedBank));
      }

      window.addEventListener('data-refresh', fetchGlobalData);
      const interval = setInterval(() => {
         if (typeof document !== "undefined" && document.hidden) return;
         fetchGlobalData();
      }, 2000);
      return () => {
         window.removeEventListener('data-refresh', fetchGlobalData);
         clearInterval(interval);
      };
   }, [currentUserId]);

   // Faster lobby sync while Manage modal is open (live applications list)
   useEffect(() => {
      if (!isManageModalOpen) return;
      fetchGlobalData();
      const interval = setInterval(() => {
         if (typeof document !== "undefined" && document.hidden) return;
         fetchGlobalData();
      }, 2000);
      return () => clearInterval(interval);
   }, [isManageModalOpen, targetLobby?.id]);

   // Hydrate My Characters from server-linked Raider.io records (first login / new device)
   useEffect(() => {
      if (currentUserId === "guest") return;
      const serverMine = globalCharacters.filter((c) => String(c.userId) === String(currentUserId));
      if (!serverMine.length) return;
      setMyCharacters((prev) => mergeMyCharactersFromServer(prev, serverMine, getRemovedCharacterKeys(currentUserId)));
   }, [globalCharacters, currentUserId]);

   useEffect(() => { if (currentUserId !== "guest") localStorage.setItem(`UL_CHARS_${currentUserId}`, JSON.stringify(myCharacters)); }, [myCharacters, currentUserId]);
   useEffect(() => { if (currentUserId !== "guest") localStorage.setItem(`UL_BANK_${currentUserId}`, JSON.stringify(bankCharacters)); }, [bankCharacters, currentUserId]);

   useEffect(() => {
      if (expandedLobbyId) sessionStorage.setItem("uplink_expanded_lobby", expandedLobbyId);
      else sessionStorage.removeItem("uplink_expanded_lobby");
   }, [expandedLobbyId]);

   useEffect(() => {
      const saveScroll = () => sessionStorage.setItem("uplink_scroll_y", String(window.scrollY));
      window.addEventListener("scroll", saveScroll, { passive: true });
      return () => window.removeEventListener("scroll", saveScroll);
   }, []);

   useEffect(() => {
      if (scrollRestoredRef.current || status !== "authenticated" || isOnboardingModalOpen) return;
      const y = parseInt(sessionStorage.getItem("uplink_scroll_y") || "0", 10);
      if (!y) { scrollRestoredRef.current = true; return; }
      const delay = expandedLobbyId ? 150 : 80;
      const timer = setTimeout(() => {
         window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
         scrollRestoredRef.current = true;
      }, delay);
      return () => clearTimeout(timer);
   }, [lobbies.length, expandedLobbyId, status, isOnboardingModalOpen]);

   useEffect(() => {
      if (session?.user && currentUserDiscordHandle) {
         const userExists = registeredUsers.find(u => u.username === currentUserDiscordHandle);
         if (userExists && session.user?.image && userExists.avatar !== session.user.image) {
            const refreshedUsers = registeredUsers.map((u: any) =>
               u.username === currentUserDiscordHandle ? { ...u, avatar: session.user?.image } : u
            );
            setRegisteredUsers(refreshedUsers);
            saveGlobalData({ registeredUsers: refreshedUsers });
         }
      }
    }, [session, currentUserDiscordHandle, registeredUsers]);

    const getUserTier = useCallback((_userId?: string): "free" | "secret_club" => {
        return "secret_club";
     }, []);

     const activeBoostLobbyIds = useMemo(() => {
        const activeLobbies = lobbies.filter((l) => isLobbyListedInPublicFeed(l));
        const sorted = [...activeLobbies].sort((a, b) => {
           const tierA = getUserTier(a.ownerId);
           const tierB = getUserTier(b.ownerId);
           if (tierA === "secret_club" && tierB !== "secret_club") return -1;
           if (tierA !== "secret_club" && tierB === "secret_club") return 1;
           return 0;
        });
        return sorted.map((l) => String(l.id));
     }, [lobbies, getUserTier]);

     const getUserTierLabel = (userId?: string) => {
        const tier = getUserTier(userId);
        if (tier === "secret_club") return { label: "CLUB", color: "text-yellow-400 border-yellow-500/50 bg-yellow-500/20" };
        return null;
     };

      const isUserHidden = (userId?: string) => {
         if (!userId || String(userId) === String(currentUserId)) return false;
         const user = registeredUsers.find((u: any) => String(u.id) === String(userId));
         return getUserTier(userId) === "secret_club" && user?.hiddenIdentity === true;
      };

   const getFriendStatus = (userId2: string) => {
     const entry = friends.find((f: any) =>
       (f.requester === currentUserId && f.target === userId2) ||
       (f.requester === userId2 && f.target === currentUserId)
     );
     if (!entry) return "none";
     if (entry.status === "accepted") return "friends";
     if (entry.status === "pending" && entry.requester === currentUserId) return "pending_sent";
     if (entry.status === "pending" && entry.target === currentUserId) return "pending_received";
     return "none";
   };

   const getMyFriends = () => {
     return friends.filter((f: any) =>
       f.status === "accepted" && (f.requester === currentUserId || f.target === currentUserId)
     ).map((f: any) => f.requester === currentUserId ? f.target : f.requester);
   };

   const isUserBlocked = (userId2: string) => {
     const me = registeredUsers.find((u: any) => String(u.id) === String(currentUserId));
     return !!me?.blocked?.includes(String(userId2));
   };

   const handleToggleBlockUser = async (targetId: string) => {
     if (!currentUserId || String(targetId) === String(currentUserId)) return;
     const users = [...registeredUsers];
     const meIdx = users.findIndex((u: any) => String(u.id) === String(currentUserId));
     if (meIdx === -1) return;

     const blocked = Array.isArray(users[meIdx].blocked) ? [...users[meIdx].blocked.map((id: any) => String(id))] : [];
     const exists = blocked.includes(String(targetId));
     users[meIdx] = {
       ...users[meIdx],
       blocked: exists ? blocked.filter((id: string) => id !== String(targetId)) : [...blocked, String(targetId)],
     };

     setRegisteredUsers(users);
     saveGlobalData({ registeredUsers: users });
     addToast(exists ? "User unblocked." : "User blocked.", exists ? "info" : "error");
   };

   const handleSendFriendRequest = async (targetId: string) => {
     if (isUserBlocked(targetId)) {
        addToast("Unblock this user first to send a friend request.", "error");
        return;
     }
     const res = await fetch("/api/friends", {
       method: "POST", headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ action: "request", targetId })
     });
     if (res.ok) {
       const data = await res.json();
       setFriends(prev => [...prev, data.friend]);
       saveGlobalData({ friends: [...friends, data.friend] });
       addToast("Friend request sent!", "success");
     } else {
       const err = await res.json();
       addToast(err.error || "Failed to send request", "error");
     }
   };

   const handleAcceptFriend = async (reqId: string) => {
     const res = await fetch("/api/friends", {
       method: "POST", headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ action: "accept", targetId: reqId })
     });
     if (res.ok) {
       setFriends(prev => prev.map((f: any) => f.id === reqId ? { ...f, status: "accepted" } : f));
       saveGlobalData({ friends: friends.map((f: any) => f.id === reqId ? { ...f, status: "accepted" } : f) });
       addToast("Friend request accepted!", "success");
     } else {
       const err = await res.json();
       addToast(err.error || "Failed to accept", "error");
     }
   };

   const handleDeclineFriend = async (reqId: string) => {
     const res = await fetch("/api/friends", {
       method: "POST", headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ action: "decline", targetId: reqId })
     });
     if (res.ok) {
       setFriends(prev => prev.filter((f: any) => f.id !== reqId));
       saveGlobalData({ friends: friends.filter((f: any) => f.id !== reqId) });
     } else {
       const err = await res.json();
       addToast(err.error || "Failed to decline", "error");
     }
   };

   const handleRemoveFriend = async (userId2: string) => {
     const res = await fetch("/api/friends", {
       method: "POST", headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ action: "remove", targetId: userId2 })
     });
     if (res.ok) {
       setFriends(prev => prev.filter((f: any) => !(
         (f.requester === currentUserId && f.target === userId2) ||
         (f.requester === userId2 && f.target === currentUserId)
       )));
       saveGlobalData({ friends: friends.filter((f: any) => !(
         (f.requester === currentUserId && f.target === userId2) ||
         (f.requester === userId2 && f.target === currentUserId)
       )) });
       addToast("Friend removed", "info");
     } else {
       const err = await res.json();
       addToast(err.error || "Failed to remove", "error");
     }
   };

      // Silently persist expired subscriptions to free tier in db.json (no toast)
      useEffect(() => {
        if (!currentUserId) return;
        const user = registeredUsers.find((u: any) => String(u.id) === String(currentUserId) || u.username === currentUserDiscordHandle);
        if (user?.subscription?.endDate && user.subscription.tier !== "free" && Date.now() > user.subscription.endDate) {
          const updatedUsers = registeredUsers.map((u: any) =>
             String(u.id) === String(currentUserId) || u.username === currentUserDiscordHandle
                ? revokeSecretClubPerks({
                     ...u,
                     subscription: { ...u.subscription, tier: "free" as const },
                  })
                : u
          );
          setRegisteredUsers(updatedUsers);
          saveGlobalData({ registeredUsers: updatedUsers });
       }
    }, [currentUserId, registeredUsers]);

    const formatStat = (val: number) => {
      if (!val) return "0";
      if (val >= 1000) return (val / 1000).toFixed(1) + "k";
      return val.toFixed(0);
   };

   const renderDualColorName = (name: string) => {
      if (!name) return <span className="text-[#00ffff]">Unknown</span>;
      const parts = name.split(" ");
      if (parts.length > 1) return <><span className="text-[#00ffff]">{parts[0]}</span> <span className="text-[#ff007f]">{parts.slice(1).join(" ")}</span></>;
      const mid = Math.floor(name.length / 2);
      return <><span className="text-[#00ffff]">{name.slice(0, mid)}</span><span className="text-[#ff007f]">{name.slice(mid)}</span></>;
   };

   const pushVariants = {
      pink: { x: -100 },
      blue: { x: 100 },
      initial: { x: 0 }
   };



    const stableComps = useMemo(() => {
       const GalaxySmokeCanvas = () => {
          const canvasRef = useRef<HTMLCanvasElement>(null);

          useEffect(() => {
             const canvas = canvasRef.current;
             if (!canvas) return;
             const ctx = canvas.getContext('2d');
             if (!ctx) return;

             const W = 300, H = 300, CX = 150, CY = 150, R = 85;

             const stars = Array.from({ length: 30 }, () => ({
                x: Math.random() * W,
                y: Math.random() * H,
                r: Math.random() * 0.8,
                a: Math.random(),
                as: (Math.random() - 0.5) * 0.01
             }));

             class Puff {
                angle = 0; speed = 0; radR = 0; wobA = 0; wobS = 0; wobAmp = 0; size = 0; life = 0; lifeS = 0; rot = 0; rotS = 0; hue = 0; sat = 0; light = 0; total;
                constructor(i: number | undefined, total: number) {
                   this.total = total;
                   this.init(i);
                }
                init(i?: number) {
                   this.angle = (i !== undefined ? (i / this.total) : Math.random()) * Math.PI * 2;
                   this.speed = (0.0025 + Math.random() * 0.004) * (Math.random() < 0.5 ? 1 : -1);
                   this.radR = R + (Math.random() - 0.5) * 35;
                   this.wobA = Math.random() * Math.PI * 2;
                   this.wobS = 0.01 + Math.random() * 0.015;
                   this.wobAmp = 5 + Math.random() * 10;
                   this.size = 12 + Math.random() * 20;
                   this.life = i !== undefined ? Math.random() : 0;
                   this.lifeS = 0.0015 + Math.random() * 0.002;
                   this.rot = Math.random() * Math.PI * 2;
                   this.rotS = (Math.random() - 0.5) * 0.012;
                   this.hue = 270 + Math.random() * 25;
                   this.sat = 80 + Math.random() * 15;
                   this.light = 45 + Math.random() * 20;
                }
                get alpha() {
                   const t = this.life;
                   if (t < 0.15) return t / 0.15;
                   if (t > 0.72) return (1 - t) / 0.28;
                   return 1;
                }
                update() {
                   this.angle += this.speed;
                   this.wobA += this.wobS;
                   this.life += this.lifeS;
                   this.rot += this.rotS;
                   if (this.life >= 1) this.init();
                }
                draw(ctx: CanvasRenderingContext2D) {
                   const r = this.radR + Math.sin(this.wobA) * this.wobAmp;
                   const x = CX + Math.cos(this.angle) * r;
                   const y = CY + Math.sin(this.angle) * r;
                   const s = this.size;
                   const a = this.alpha * 0.72;
                   ctx.save();
                   ctx.translate(x, y);
                   ctx.rotate(this.rot);
                   const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s);
                   g.addColorStop(0, `hsla(${this.hue},${this.sat}%,${this.light + 22}%,${a})`);
                   g.addColorStop(0.2, `hsla(${this.hue},${this.sat}%,${this.light + 10}%,${a * 0.75})`);
                   g.addColorStop(0.5, `hsla(${this.hue},${this.sat}%,${this.light}%,${a * 0.4})`);
                   g.addColorStop(0.8, `hsla(${this.hue},${this.sat}%,${this.light - 10}%,${a * 0.12})`);
                   g.addColorStop(1, `hsla(${this.hue},${this.sat}%,${this.light - 15}%,0)`);
                   ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2);
                   ctx.fillStyle = g; ctx.fill();
                   ctx.restore();
                }
             }

             class Sparkle {
                angle = 0; speed = 0; r = 0; size = 0; life = 0; lifeS = 0; hue = 0;
                constructor() { this.reset(); }
                reset() {
                   this.angle = Math.random() * Math.PI * 2;
                   this.speed = 0.003 + Math.random() * 0.005;
                   this.r = R + (Math.random() - 0.5) * 25;
                   this.size = 0.5 + Math.random() * 1.2;
                   this.life = Math.random();
                   this.lifeS = 0.002 + Math.random() * 0.003;
                   this.hue = 260 + Math.random() * 40;
                }
                update() {
                   this.angle += this.speed;
                   this.life += this.lifeS;
                   if (this.life >= 1) this.reset();
                }
                get alpha() {
                   const t = this.life;
                   if (t < 0.2) return t / 0.2;
                   if (t > 0.7) return (1 - t) / 0.3;
                   return 1;
                }
                draw(ctx: CanvasRenderingContext2D) {
                   const x = CX + Math.cos(this.angle) * this.r;
                   const y = CY + Math.sin(this.angle) * this.r;
                   ctx.beginPath(); ctx.arc(x, y, this.size, 0, Math.PI * 2);
                   ctx.fillStyle = `hsla(${this.hue},90%,90%,${this.alpha})`;
                   ctx.fill();
                }
             }

             const N = 120;
             const puffs = Array.from({ length: N }, (_, i) => new Puff(i, N));
             const sparkles = Array.from({ length: 25 }, () => new Sparkle());

             let animationFrameId: number;
             const render = () => {
                ctx.clearRect(0, 0, W, H);
                stars.forEach(s => {
                   s.a += s.as;
                   if (s.a > 1 || s.a < 0) s.as *= -1;
                   ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                   ctx.fillStyle = `rgba(190,160,255,${s.a * 0.55})`; ctx.fill();
                });
                puffs.forEach(p => { p.update(); p.draw(ctx); });
                sparkles.forEach(s => { s.update(); s.draw(ctx); });
                animationFrameId = requestAnimationFrame(render);
             };
             render();
             return () => cancelAnimationFrame(animationFrameId);
          }, []);

          return <canvas ref={canvasRef} width={300} height={300} className="absolute inset-[-50%] w-[200%] h-[200%] z-0 pointer-events-none opacity-70" />;
       };

       const FireCanvas = () => {
          const canvasRef = useRef<HTMLCanvasElement>(null);

          useEffect(() => {
             const canvas = canvasRef.current;
             if (!canvas) return;
             const ctx = canvas.getContext('2d');
             if (!ctx) return;

             const W = 300, H = 300, CX = 150, CY = 150, R = 85;

             class Flame {
                angle = 0; speed = 0; radR = 0; wobA = 0; wobS = 0; wobAmp = 0; size = 0; life = 0; lifeS = 0; rot = 0; rotS = 0; hue = 0; sat = 0; light = 0; total;
                constructor(i: number | undefined, total: number) {
                   this.total = total;
                   this.init(i);
                }
                init(i?: number) {
                   this.angle = (i !== undefined ? (i / this.total) : Math.random()) * Math.PI * 2;
                   this.speed = (0.004 + Math.random() * 0.005) * (Math.random() < 0.5 ? 1 : -1);
                   this.radR = R + (Math.random() - 0.5) * 25;
                   this.wobA = Math.random() * Math.PI * 2;
                   this.wobS = 0.04 + Math.random() * 0.06;
                   this.wobAmp = 8 + Math.random() * 15;
                   this.size = 14 + Math.random() * 20;
                   this.life = i !== undefined ? Math.random() : 0;
                   this.lifeS = 0.003 + Math.random() * 0.004;
                   this.rot = Math.random() * Math.PI * 2;
                   this.rotS = (Math.random() - 0.5) * 0.03;
                   const t = Math.random();
                   if (t < 0.3) { this.hue = 50; this.sat = 100; this.light = 70; }
                   else if (t < 0.65) { this.hue = 25; this.sat = 100; this.light = 55; }
                   else { this.hue = 5; this.sat = 100; this.light = 45; }
                }
                get alpha() {
                   const t = this.life;
                   if (t < 0.15) return t / 0.15;
                   if (t > 0.7) return (1 - t) / 0.3;
                   return 1;
                }
                update() {
                   this.angle += this.speed;
                   this.wobA += this.wobS;
                   this.life += this.lifeS;
                   this.rot += this.rotS;
                   if (this.life >= 1) this.init();
                }
                draw(ctx: CanvasRenderingContext2D) {
                   const r = this.radR + Math.sin(this.wobA) * this.wobAmp;
                   const x = CX + Math.cos(this.angle) * r;
                   const y = CY + Math.sin(this.angle) * r;
                   const s = this.size;
                   const a = this.alpha * 0.8;
                   ctx.save();
                   ctx.translate(x, y);
                   ctx.rotate(this.rot);
                   const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s);
                   g.addColorStop(0, `hsla(${this.hue},${this.sat}%,${this.light + 20}%,${a})`);
                   g.addColorStop(0.3, `hsla(${this.hue},${this.sat}%,${this.light}%,${a * 0.7})`);
                   g.addColorStop(0.6, `hsla(${this.hue - 10},${this.sat}%,${this.light - 20}%,${a * 0.3})`);
                   g.addColorStop(1, `hsla(0,100%,20%,0)`);
                   ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2);
                   ctx.fillStyle = g; ctx.fill();
                   ctx.restore();
                }
             }

             class Ember {
                angle = 0; speed = 0; r = 0; size = 0; life = 0; lifeS = 0; hue = 0;
                constructor() { this.reset(); }
                reset() {
                   this.angle = Math.random() * Math.PI * 2;
                   this.speed = 0.008 + Math.random() * 0.012;
                   this.r = R + (Math.random() - 0.5) * 30;
                   this.size = 0.8 + Math.random() * 1.5;
                   this.life = Math.random();
                   this.lifeS = 0.004 + Math.random() * 0.006;
                   this.hue = 20 + Math.random() * 40;
                }
                update() {
                   this.angle += this.speed;
                   this.r += (Math.random() - 0.5) * 0.8;
                   this.life += this.lifeS;
                   if (this.life >= 1) this.reset();
                }
                get alpha() {
                   const t = this.life;
                   if (t < 0.2) return t / 0.2;
                   if (t > 0.7) return (1 - t) / 0.3;
                   return 1;
                }
                draw(ctx: CanvasRenderingContext2D) {
                   const x = CX + Math.cos(this.angle) * this.r;
                   const y = CY + Math.sin(this.angle) * this.r;
                   ctx.beginPath(); ctx.arc(x, y, this.size, 0, Math.PI * 2);
                   ctx.fillStyle = `hsla(${this.hue},100%,75%,${this.alpha})`;
                   ctx.fill();
                }
             }

             const N = 120;
             const flames = Array.from({ length: N }, (_, i) => new Flame(i, N));
             const embers = Array.from({ length: 40 }, () => new Ember());

             let animationFrameId: number;
             const render = () => {
                ctx.clearRect(0, 0, W, H);
                flames.forEach(f => { f.update(); f.draw(ctx); });
                embers.forEach(e => { e.update(); e.draw(ctx); });
                animationFrameId = requestAnimationFrame(render);
             };
             render();
             return () => cancelAnimationFrame(animationFrameId);
          }, []);

          return <canvas ref={canvasRef} width={300} height={300} className="absolute inset-[-50%] w-[200%] h-[200%] z-0 pointer-events-none opacity-70" />;
       };

       const ProfileSmokeRing = () => {
          const canvasRef = useRef<HTMLCanvasElement>(null);
          useEffect(() => {
             const canvas = canvasRef.current;
             if (!canvas) return;
             const ctx = canvas.getContext('2d');
             if (!ctx) return;
             const W = 300, H = 300, CX = W/2, CY = H/2, R = 100;
             let particles: any[] = [];
             const count = 80;
             for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
                particles.push({
                   baseAngle: angle, angleOffset: Math.random() * Math.PI * 2,
                   speed: 0.004 + Math.random() * 0.006,
                   radial: (Math.random() - 0.5) * 25,
                   radialAmp: 4 + Math.random() * 10, radialFreq: 0.5 + Math.random() * 1.5,
                   life: Math.random(), lifeSpeed: 0.003 + Math.random() * 0.005,
                   size: 1.2 + Math.random() * 3.5, noise: Math.random()
                });
             }
             let t = 0;
             const render = () => {
                ctx.clearRect(0, 0, W, H);
                for (const p of particles) {
                   p.angleOffset += p.speed;
                   const angle = p.baseAngle + p.angleOffset;
                   const wave = Math.sin(p.angleOffset * p.radialFreq) * p.radialAmp;
                   const r = R + p.radial + wave;
                   const x = CX + Math.cos(angle) * r;
                   const y = CY + Math.sin(angle) * r;
                   p.life += p.lifeSpeed;
                   if (p.life > 1) p.life = 0;
                   const alpha = Math.sin(p.life * Math.PI) * 0.6;
                   const size = p.size * (0.6 + 0.4 * Math.sin(p.life * Math.PI));
                   ctx.beginPath();
                   ctx.arc(x, y, size, 0, Math.PI*2);
                   ctx.fillStyle = `rgba(200,220,255,${alpha})`;
                   ctx.fill();
                }
                t++;
                requestAnimationFrame(render);
             };
             let animationFrameId = requestAnimationFrame(render);
             return () => cancelAnimationFrame(animationFrameId);
          }, []);
          return <canvas ref={canvasRef} width={300} height={300} className="absolute inset-[-50%] w-[200%] h-[200%] z-0 pointer-events-none opacity-80" />;
       };

       const FireRingProfile = () => {
          const canvasRef = useRef<HTMLCanvasElement>(null);
          useEffect(() => {
             const canvas = canvasRef.current;
             if (!canvas) return;
             const ctx = canvas.getContext('2d');
             if (!ctx) return;
             const W = 300, H = 300, CX = W/2, CY = H/2, R = 100;
             let t = 0;
             function noise(a: number, t: number, oct: number) {
                let v = 0, amp = 1, tot = 0;
                for (let o = 0; o < oct; o++) {
                   const f = Math.pow(2, o);
                   v += Math.sin(a*f*3+t*(0.5+o*0.3)+o*1.7)*amp;
                   v += Math.cos(a*f*5-t*(0.4+o*0.2)+o*2.3)*amp*0.5;
                   tot += amp*1.5; amp *= 0.55;
                }
                return v/tot;
             }
             const render = () => {
                ctx.clearRect(0, 0, W, H);
                const STEPS = 120, LAYERS = 14, flameH = 24;
                for (let li = 0; li < LAYERS; li++) {
                   const layerFrac = li / LAYERS;
                   for (let si = 0; si < STEPS; si++) {
                      const angle = (si/STEPS)*Math.PI*2;
                      const nextAngle = ((si+1)/STEPS)*Math.PI*2;
                      const flicker1 = noise(angle, t, 3);
                      const flicker2 = noise(nextAngle, t, 3);
                      const flameOffset1 = layerFrac * flameH * (0.5 + flicker1*0.7);
                      const flameOffset2 = layerFrac * flameH * (0.5 + flicker2*0.7);
                      const r1 = R + flameOffset1;
                      const r2 = R + flameOffset2;
                      const x1 = CX+Math.cos(angle)*r1, y1 = CY+Math.sin(angle)*r1;
                      const x2 = CX+Math.cos(nextAngle)*r2, y2 = CY+Math.sin(nextAngle)*r2;
                      const alpha = (1-layerFrac)*(1-layerFrac)*(0.5+Math.abs(flicker1)*0.5)*0.6;
                      const r = 255, g = Math.floor(80+layerFrac*120), b = Math.floor(layerFrac*40);
                      ctx.strokeStyle = `rgba(${r},${g},${b},${Math.min(alpha, 0.85)})`;
                      ctx.lineWidth = (1-layerFrac)*3+0.5;
                      ctx.beginPath();
                      ctx.moveTo(x1, y1);
                      ctx.lineTo(x2, y2);
                      ctx.stroke();
                   }
                }
                t += 0.05;
                requestAnimationFrame(render);
             };
             const animationFrameId = requestAnimationFrame(render);
             return () => cancelAnimationFrame(animationFrameId);
          }, []);
          return <canvas ref={canvasRef} width={300} height={300} className="absolute inset-[-50%] w-[200%] h-[200%] z-0 pointer-events-none opacity-80" />;
       };

       const SmokeRingCanvas = ({ color: initialColor, thick: initialThick }: { color: string; thick?: number }) => {
          const canvasRef = useRef<HTMLCanvasElement>(null);
          const palRef = useRef(initialColor);
          const thickRef = useRef(initialThick || 22);
          useEffect(() => {
             palRef.current = initialColor;
          }, [initialColor]);
          useEffect(() => {
             thickRef.current = initialThick || 22;
          }, [initialThick]);
          useEffect(() => {
             const canvas = canvasRef.current;
             if (!canvas) return;
             const ctx = canvas.getContext('2d');
             if (!ctx) return;
             const W = 360, H = 360, CX = W/2, CY = H/2, R = 120;
             function turb(a: number, t: number, freq: number, layer: number) {
                return (
                   Math.sin(a * 3  + t * 0.7 + layer)       * 0.4  +
                   Math.sin(a * 5  - t * 0.5 + layer * 1.3) * 0.25 +
                   Math.sin(a * 7  + t * 0.9 + layer * 0.7) * 0.15 +
                   Math.sin(a * 11 - t * 0.3 + layer * 2.1) * 0.1  +
                   Math.sin(a * 2  + t * 1.1 - layer * 0.5) * 0.1
                );
             }
             function palColor(alpha: number) {
                const pal = palRef.current;
                if (pal === 'purple') return [180, 120, 255];
                if (pal === 'red')    return [255, 50, 50];
                if (pal === 'orange') return [255, 140, 30];
                if (pal === 'galaxy') {
                   const shift = Math.sin(t * 0.3) * 40;
                   return [Math.min(255, 160 + shift), Math.max(80, 100 - shift), 255];
                }
                return [255, 255, 255];
             }
             let t = 0;
             function drawSmokeRing(ctx: CanvasRenderingContext2D) {
                const STEPS = 360, LAYERS = 14, halfL = LAYERS / 2;
                const thick = thickRef.current;
                for (let li = 0; li < LAYERS; li++) {
                   const layerFrac = li / LAYERS;
                   const bandAlpha = Math.sin(layerFrac * Math.PI);
                   const baseAlpha = bandAlpha * 0.13;
                   for (let si = 0; si < STEPS; si++) {
                      const angle = (si / STEPS) * Math.PI * 2;
                      const nextAngle = ((si + 1) / STEPS) * Math.PI * 2;
                      const tb = turb(angle, t, 0.9, li * 0.4) * thick * 0.7;
                      const tb2 = turb(nextAngle, t, 0.9, li * 0.4) * thick * 0.7;
                      const offset = (li - halfL) / halfL * thick;
                      const r1 = R + offset + tb;
                      const r2 = R + offset + tb2;
                      const x1 = CX + Math.cos(angle) * r1, y1 = CY + Math.sin(angle) * r1;
                      const x2 = CX + Math.cos(nextAngle) * r2, y2 = CY + Math.sin(nextAngle) * r2;
                      const vein = Math.max(0, Math.sin(angle * 13 - t * 2 + li) * 0.5 + 0.3 * Math.sin(angle * 7 + t));
                      const alpha = baseAlpha + vein * 0.09 * bandAlpha;
                      const col = palColor(alpha);
                      ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${Math.min(alpha * (palRef.current === 'galaxy' ? 0.7 : 0.55), 0.55)})`;
                      ctx.lineWidth = thick / LAYERS * 1.4;
                      ctx.beginPath();
                      ctx.moveTo(x1, y1);
                      ctx.lineTo(x2, y2);
                      ctx.stroke();
                   }
                }
             }
             function frame() {
                if (!ctx) return;
                ctx.clearRect(0, 0, W, H);
                ctx.save();
                ctx.beginPath();
                ctx.arc(CX, CY, R - thickRef.current - 4, 0, Math.PI * 2);
                ctx.fillStyle = 'transparent';
                ctx.fill();
                ctx.restore();
                drawSmokeRing(ctx);
                ctx.save();
                ctx.globalCompositeOperation = 'destination-out';
                ctx.beginPath();
                ctx.arc(CX, CY, R - thickRef.current - 2, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0,0,0,1)';
                ctx.fill();
                ctx.restore();
                t += 0.012 * 3;
                requestAnimationFrame(frame);
             }
             const animId = requestAnimationFrame(frame);
             return () => cancelAnimationFrame(animId);
          }, []);
          return <canvas ref={canvasRef} width={360} height={360} className="absolute inset-[-50%] w-[200%] h-[200%] z-0 pointer-events-none" />;
       };
       const SmokeRingGalaxy = () => <SmokeRingCanvas color="galaxy" />;
       const SmokeRingRed = () => <SmokeRingCanvas color="red" />;
       const SmokeRingOrange = () => <SmokeRingCanvas color="orange" />;

         const AvatarWithEffect = ({ src, effect = "none", className = "", fallbackName = "Operative", userId }: { src: string, effect?: string, className?: string, fallbackName?: string, userId?: string }) => {
              const profileUser = userId ? registeredUsersRef.current.find((u: any) => String(u.id) === String(userId)) : null;
              const profileGif = effectiveProfileGif(profileUser);
              const displayEffect = profileUser ? effectiveAvatarEffect(profileUser, effect) : effect;
             const safeSrc = profileGif || (src?.trim()
              ? src
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=0b1020&color=00ffff&size=256&bold=true`);

            return (
                <motion.div className={`relative flex-shrink-0 flex items-center justify-center transition-all ${className}`}>
                      {displayEffect !== 'none' && displayEffect !== 'electric_circle' && EFFECT_IMG[displayEffect] ? (
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
                               {displayEffect === 'electric_circle' && (
                                   <div className="absolute pointer-events-none rounded-full overflow-hidden" style={{ width: 'calc(100% + 24px)', height: 'calc(100% + 24px)', left: '-12px', top: '-12px', zIndex: 30 }}>
                                      <iframe src={`/effects/electric-circle.html?color=${electricColor}`} className="w-full h-full border-0 pointer-events-none" />
                                   </div>
                                )}
                            </>
                         )}
                 {deleteConfirmation?.isOpen && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                       <div className="bg-[#05050a] border border-[#ff007f]/30 p-8 rounded-3xl max-w-sm w-full text-center">
                          <h3 className="text-xl font-black text-white mb-4">DELETE BACKGROUND</h3>
                          <p className="text-gray-400 text-sm mb-8">Are you sure you want to delete this background? This action cannot be undone.</p>
                          <div className="flex gap-4">
                             <button onClick={() => setDeleteConfirmation(null)} className="w-1/3 shrink-0 py-3 bg-white/5 text-white font-black uppercase text-[10px] rounded-xl hover:bg-white/10">CANCEL</button>
                             <button onClick={() => {
                                const { index, userId } = deleteConfirmation;
                                const userIdx = registeredUsers.findIndex((u: any) => u.id === userId);
                                if (userIdx !== -1) {
                                   const updatedUsers = [...registeredUsers];
                                   updatedUsers[userIdx].userVfx.splice(index, 1);
                                   setRegisteredUsers(updatedUsers);
                                   saveGlobalData({ registeredUsers: updatedUsers });
                                }
                                setDeleteConfirmation(null);
                             }} className="w-1/3 shrink-0 py-3 bg-red-600 text-white font-black uppercase text-[10px] rounded-xl hover:bg-red-500">CONFIRM</button>
                          </div>
                       </div>
                    </div>
                 )}
              </motion.div>
           );
       };

         return { AvatarWithEffect };
      }, [deleteConfirmation, setDeleteConfirmation, EFFECTS, EFFECT_IMG, electricColor]);
     const { AvatarWithEffect } = stableComps;

   const OfferFeedAvatar = useCallback(
      (props: { src: string; effect?: string; className?: string; fallbackName?: string; userId?: string }) => (
         <OfferFeedAvatarBase {...props} registeredUsers={registeredUsers} />
      ),
      [registeredUsers]
   );

   const resolveUserVisual = (identifier?: string, userId?: string) => {
      const lookup = (identifier || "").toLowerCase().trim();
      const matched = registeredUsers.find((u: any) => {
         const byId = userId && String(u.id || "").toLowerCase() === String(userId).toLowerCase();
         const byName = (u.name || "").toLowerCase() === lookup;
         const byHandle = (u.username || "").toLowerCase() === lookup;
         return byId || byName || byHandle;
      });

      if (matched) {
         return {
            avatar: matched.customAvatar || matched.profileGif || matched.avatar || "",
            effect: effectiveAvatarEffect(matched, matched.effect || "none"),
         };
      }
      return { avatar: "", effect: "none" };
   };

   const resolveMemberVisual = (member: any) => {
      const directEffect = member?.applicantEffect || member?.effect || "none";
      const memberUser = registeredUsers.find(
         (u: any) => String(u.id) === String(member?.applicantId || member?.userId || "")
      );
      if (memberUser) {
         return {
            avatar: resolveProfileImage(memberUser),
            effect: effectiveAvatarEffect(memberUser, memberUser.effect || directEffect),
         };
      }

      const directAvatar = member?.applicantAvatar || member?.avatar || "";
      if (directAvatar) {
         return { avatar: directAvatar, effect: directEffect };
      }

      const lookup = [member?.discordName, member?.applicantName, member?.name, member?.applicantId]
         .filter(Boolean)
         .map((v: any) => String(v).toLowerCase().trim());

      const matched = registeredUsers.find((u: any) => {
         const id = String(u.id || "").toLowerCase();
         const uname = String(u.username || "").toLowerCase();
         const name = String(u.name || "").toLowerCase();
         return lookup.includes(id) || lookup.includes(uname) || lookup.includes(name);
      });

      return {
         avatar: matched ? resolveProfileImage(matched) : "",
         effect: matched ? effectiveAvatarEffect(matched, matched.effect || directEffect) : directEffect,
      };
   };

   const resolveChatIdentity = useCallback((userId?: string, stored?: { from?: string; fromAvatar?: string; fromHandle?: string }) => {
      const user = userId ? registeredUsers.find((u: any) => String(u.id) === String(userId)) : null;
      if (user) {
         return {
            name: resolveProfileDisplayName(user, stored?.from || "Operative"),
            avatar: resolveProfileImage(user, user.name || "U") || stored?.fromAvatar || "",
         };
      }

      const lookup = (stored?.fromHandle || stored?.from || "").toLowerCase().trim();
      if (lookup) {
         const matched = registeredUsers.find((u: any) =>
            String(u.id || "").toLowerCase() === lookup ||
            (u.name || "").toLowerCase() === lookup ||
            (u.discordDisplayName || "").toLowerCase() === lookup
         );
         if (matched) {
            return {
               name: resolveProfileDisplayName(matched, stored?.from || "Operative"),
               avatar: resolveProfileImage(matched, matched.name || "U") || stored?.fromAvatar || "",
            };
         }
      }
      return { name: stored?.from || "Unknown", avatar: stored?.fromAvatar || "" };
   }, [registeredUsers]);

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
      const label = l.category === "leveling"
         ? `Leveling ${l.startLevel || "1"}-${l.endLevel || "80"}`
         : `${l.runsCount || 1}x ${l.keyLevel || "+10"}`;
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

   const handleSaveOfferDraft = useCallback((name: string, formData: any) => {
      if (!currentUserId || currentUserId === "guest") {
         addToast("Sign in to save offer profiles.", "error");
         return;
      }
      const draft = {
         id: Date.now().toString(),
         name,
         savedAt: Date.now(),
         formData: JSON.parse(JSON.stringify(formData)),
      };
      setRegisteredUsers((prev: any) => {
         const updated = [...prev];
         const uIdx = updated.findIndex((u: any) => String(u.id) === String(currentUserId));
         if (uIdx === -1) return prev;
         updated[uIdx] = { ...updated[uIdx], offerDrafts: [...(updated[uIdx].offerDrafts || []), draft] };
         saveGlobalData({ registeredUsers: updated });
         return updated;
      });
      addToast(`Profile "${name}" saved.`, "success");
   }, [currentUserId, addToast, saveGlobalData]);

   const handleDeleteOfferDraft = useCallback((id: string) => {
      if (!currentUserId) return;
      setRegisteredUsers((prev: any) => {
         const updated = [...prev];
         const uIdx = updated.findIndex((u: any) => String(u.id) === String(currentUserId));
         if (uIdx === -1) return prev;
         updated[uIdx] = {
            ...updated[uIdx],
            offerDrafts: (updated[uIdx].offerDrafts || []).filter((d: any) => d.id !== id),
         };
         saveGlobalData({ registeredUsers: updated });
         return updated;
      });
      addToast("Draft deleted.", "info");
   }, [currentUserId, addToast, saveGlobalData]);

     const handleCreateLobby = async (e: React.FormEvent, data?: any) => {
        e.preventDefault();
        const fd = data || formData;
        if (editingLobby) {
           const gAmount = parseInt(fd.goldAmount) || 0;
           const rCount = parseInt(fd.runsCount) || 1;
           const selectedDungeonEntries = Object.entries(fd.selectedDungeons || {}).filter(([, count]: [string, any]) => count > 0);
           const dungeonTitle = selectedDungeonEntries.length > 0
              ? selectedDungeonEntries.map(([name, count]) => `${count}x ${name}`).join(', ')
              : `${rCount}x ${fd.keyLevel} Runs`;
           const updatedLobby = {
              ...editingLobby,
              category: fd.category || editingLobby.category,
              title: (fd.category === "leveling") ? `Power Leveling ${fd.startLevel}-${fd.endLevel}` : dungeonTitle,
              notes: fd.notes,
              boosterNote: fd.boosterNote,
              dungeonImage: fd.dungeonImage,
              selectedDungeons: fd.selectedDungeons,
              minIlvl: parseInt(fd.minIlvl) || 0,
              minScore: parseInt(fd.minScore) || 0,
              totalGold: fd.category === 'leveling' ? (parseInt(fd.goldAmount) || 0) : (gAmount * rCount),
              goldPerRun: fd.category === 'leveling' ? (parseInt(fd.goldPerRun) || 0) : gAmount,
              runsCount: fd.category === 'leveling' ? 1 : rCount,
              hasKey: fd.hasKey,
              keyLevel: fd.keyLevel,
              isTimed: fd.isTimed,
              roles: { ...fd.roles },
              squadTemplate: buildSquadTemplateFromRoles(fd.roles, fd.category || editingLobby.category),
              blacklistedClasses: fd.blacklistedClasses || [],
              blockedRoles: fd.blockedRoles || [],
               startLevel: fd.startLevel,
               endLevel: fd.endLevel,
               goldAmount: parseInt(fd.goldAmount) || 0,
               serverRegion: fd.serverRegion || "EU"
            };
            const editText = buildOfferEditChatText(editingLobby, updatedLobby);
            if (editText) {
               updatedLobby.messages = [
                  ...(editingLobby.messages || []),
                  {
                     id: Date.now(),
                     fromId: "bot",
                     from: "UPLINK",
                     fromHandle: "UPLINK",
                     fromAvatar: "",
                     fromEffect: "none",
                     text: editText,
                     image: null,
                     time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }
               ];
            }
            const updatedLobbies = lobbies.map(l => l.id === editingLobby.id ? updatedLobby : l);
           setLobbies(updatedLobbies);
           saveGlobalData({ lobbies: updatedLobbies });
           playSound('terminal');
           addToast("Mission updated successfully.", "success");
           setEditingLobby(null);
           setIsCreateModalOpen(false);
           return;
        }
       const existingActive = lobbies.find(l => l.ownerId === currentUserId && ['in_progress', 'unpaid', 'payment_pending'].includes(l.status));
        if (existingActive) {
           addToast("You already have an active operation. Please complete or finalize it first.", "error");
           setSubmitError("You already have an active operation. Complete or finalize it first.");
           return;
        }
        if (activeMainTab === "boosts") {         const gAmount = parseInt(fd.goldAmount) || 0;
           const rCount = parseInt(fd.runsCount) || 1;
           const selectedDungeonEntries = Object.entries(fd.selectedDungeons || {}).filter(([, count]: [string, any]) => count > 0);
           const dungeonTitle = selectedDungeonEntries.length > 0
              ? selectedDungeonEntries.map(([name, count]) => `${count}x ${name}`).join(', ')
              : `${rCount}x ${fd.keyLevel} Runs`;
           const newLobby = {
              id: Date.now().toString(),
              ownerId: currentUserId,
              ownerName: currentUserDisplay,
              ownerDiscordName: currentUserDisplay,
              ownerHandle: currentUserDiscordHandle,
              ownerImage: siteOwnerAvatar,
              ownerEffect: myEffect,
              ownerPrestige: 100,
              category: fd.category || (activeMainTab === 'boosts' ? 'dungeon' : 'leveling'),
              title: (fd.category === "leveling") ? `Power Leveling ${fd.startLevel}-${fd.endLevel}` : dungeonTitle,
              notes: fd.notes,
              boosterNote: fd.boosterNote,
              dungeonImage: fd.dungeonImage,
              selectedDungeons: fd.selectedDungeons,
              minIlvl: parseInt(fd.minIlvl) || 0,
              minScore: parseInt(fd.minScore) || 0,
              totalGold: fd.category === 'leveling' ? (parseInt(fd.goldAmount) || 0) : (gAmount * rCount),
              goldPerRun: fd.category === 'leveling' ? (parseInt(fd.goldPerRun) || 0) : gAmount,
              runsCount: fd.category === 'leveling' ? 1 : rCount,
              hasKey: fd.hasKey,
              keyLevel: fd.keyLevel,
              isTimed: fd.isTimed,
              roles: { ...fd.roles },
              squadTemplate: buildSquadTemplateFromRoles(fd.roles, fd.category),
              startLevel: fd.startLevel,
              endLevel: fd.endLevel,
              goldAmount: parseInt(fd.goldAmount) || 0,
              status: 'standby' as const,
              messages: [],
              applicants: [],
              invited: [],
              accepted: [],
               customBg: "",
                blacklistedClasses: fd.blacklistedClasses || [],
                blockedRoles: fd.blockedRoles || [],
                serverRegion: fd.serverRegion || "US"
             };
             const newLobbies = [newLobby, ...lobbies];
              setLobbies(newLobbies);
              const saved = await saveGlobalData({ lobbies: newLobbies });
              if (!saved) {
                  setLobbies(lobbies);
                  setIsCreateModalOpen(false);
                  return;
               }
              const updatedUsers = registeredUsers.map((u: any) => {
                 if (String(u.id) === String(currentUserId)) {
                    const s = u.stats || { total: 0, k5: 0, k10: 0, k15: 0, k20: 0 };
                    s.postCount = (s.postCount || 0) + 1;
                    return { ...u, stats: s };
                 }
                 return u;
              });
              setRegisteredUsers(updatedUsers);
              saveGlobalData({ registeredUsers: updatedUsers });
              playSound('terminal');
               addToast("Mission deployed to active grid.", "success");
               fetch("/api/discord/broadcast", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lobby: newLobby }) }).catch(() => {});
            } else if (activeMainTab === "leveling") {
             const newLobby = {
               id: Date.now().toString(),
               ownerId: currentUserId,
               ownerName: currentUserDisplay,
               ownerDiscordName: currentUserDisplay,
               ownerHandle: currentUserDiscordHandle,
               ownerImage: siteOwnerAvatar,
               ownerEffect: myEffect,
               ownerPrestige: 100,
               category: 'leveling',
               title: `Power Leveling ${fd.startLevel}-${fd.endLevel}`,
               notes: fd.notes,
               boosterNote: fd.boosterNote,
               dungeonImage: fd.dungeonImage,
               selectedDungeons: fd.selectedDungeons,
               minIlvl: parseInt(fd.minIlvl) || 0,
               minScore: parseInt(fd.minScore) || 0,
               totalGold: parseInt(fd.goldAmount) || 0,
               goldPerRun: parseInt(fd.goldPerRun) || 0,
               goldAmount: parseInt(fd.goldAmount) || 0,
               runsCount: 1,
               startLevel: fd.startLevel,
               endLevel: fd.endLevel,
               hasKey: fd.hasKey,
               keyLevel: fd.keyLevel,
               isTimed: fd.isTimed,
               roles: { ...fd.roles },
               squadTemplate: buildSquadTemplateFromRoles(fd.roles, "leveling"),
               status: 'standby' as const,
               messages: [],
                applicants: [], invited: [], accepted: [],
                blacklistedClasses: fd.blacklistedClasses || [],
                blockedRoles: fd.blockedRoles || [],
                serverRegion: fd.serverRegion || "US"
             };
             const newLobbies = [newLobby, ...lobbies];
             setLobbies(newLobbies);
             const saved = await saveGlobalData({ lobbies: newLobbies });
              if (!saved) {
                 setLobbies(lobbies);
                 setIsCreateModalOpen(false);
                 return;
              }
             const updatedUsers = registeredUsers.map((u: any) => {
                if (String(u.id) === String(currentUserId)) {
                   const s = u.stats || { total: 0, k5: 0, k10: 0, k15: 0, k20: 0 };
                   s.postCount = (s.postCount || 0) + 1;
                   return { ...u, stats: s };
                }
                return u;
             });
             setRegisteredUsers(updatedUsers);
             saveGlobalData({ registeredUsers: updatedUsers });
             playSound('terminal');
             addToast("Leveling squad deployed.", "success");
             fetch("/api/discord/broadcast", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lobby: newLobby }) }).catch(() => {});
         }
        setIsCreateModalOpen(false);
    };

    const handleCancelApply = async (lobbyId: string) => {
       await withdrawFromLobby(lobbyId);
       markAutoApplyCancelled(lobbyId);
       addToast("Application withdrawn.", "info");
    };

   const handleApply = async (e: React.FormEvent) => {
      e.preventDefault();
      const manualCharId = selectedCharId || autoApplyCharId;
      if (!targetLobby || !manualCharId) return;
      const char = myCharacters.find(c => String(c.id) === String(manualCharId));
      if (!char) return;

      const currentRoleScore = char.roleScores?.[char.role] ?? char.score;
      const isAdmin = hasAdminPower(currentUserId, currentUserDiscordHandle);

      if (!isAdmin) {
        if ((targetLobby.roles[char.role] || 0) <= 0) return addToast(`This run doesn't need a ${char.role.toUpperCase()} anymore.`, "error");
        if (char.ilvl < targetLobby.minIlvl) return addToast("Your iLvl is too low.", "error");
        if (Number(currentRoleScore) < targetLobby.minScore) return addToast("Your IO Rating for this role is too low.", "error");
        if ((targetLobby.blockedRoles || []).some((b: any) => b.class === char.class && b.role === char.role)) return addToast(`${char.class} ${char.role.toUpperCase()} is blocked for this mission.`, "error");
      }
      if ((targetLobby.applicants || []).some((a: any) => String(a.applicantId) === String(currentUserId) || String(a.id) === String(char.id))) {
         return addToast("Already applied!", "error");
      }

      const applicant = buildApplicantPayload(char, {
         keystone: resolveDungeonSelection(autoApplyKey)?.name || autoApplyKey || userKeystone || "",
         applicantKeyLevel: autoApplyKeyLevel,
         applicantDropLevel: autoApplyDropLevel,
         applicantNote: applyNote.trim() || undefined,
      });

      const ok = await applyToLobby(targetLobby.id, applicant);
      if (!ok) return addToast("Failed to send application. Try again.", "error");

      setIsApplyModalOpen(false);
      setIsAutoApplySettingsOpen(false);
      setSelectedCharId(null);
      addToast(`Transmission sent to ${targetLobby.ownerDiscordName}. Details: ${targetLobby.goldPerRun}K/Run.`, "success");
   };

     const handleAccept = async (applicant: any) => {
         if (!targetLobby) return;
        const visual = resolveMemberVisual(applicant);
        const acceptedApplicant = {
           ...applicant,
           applicantAvatar: applicant.applicantAvatar || visual.avatar || "",
           applicantEffect: applicant.applicantEffect || visual.effect || "none",
           raiderRegion: String(applicant.raiderRegion || applicant.region || "").toLowerCase(),
           raiderRealm: applicant.raiderRealm || applicant.realm,
           raiderName: applicant.raiderName || applicant.name
        };
        const ownerUser = registeredUsers.find((u: any) => String(u.id) === String(currentUserId));
        const isAuto =
           isSecretClubTier(ownerUser) && autoAcceptEnabled && Date.now() <= autoAcceptEndTime;
        const instantJoin = isAuto && isLevelingOffer(targetLobby);
        const notifId = Date.now();
        let updated = lobbies.map((l) => {
           if (l.id === targetLobby.id) {
              if (instantJoin) return confirmApplicantJoin(l, acceptedApplicant);
              return inviteApplicantToLobby(l, acceptedApplicant, notifId);
           }
           return l;
        });
        updated = withdrawUserFromAllLobbies(
           updated,
           memberIdentityKey(acceptedApplicant),
           targetLobby.id,
           targetLobby
        );
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
        setTargetLobby(updated.find(l => l.id === targetLobby.id));
        await saveGlobalData({
           lobbies: updated,
           ...(instantJoin ? {} : { notifications: newNotifications }),
        });
        if (!instantJoin && applicant.applicantId) {
           fetch("/api/discord/notify-invite", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                 lobbyId: targetLobby.id,
                 notifId,
                 applicantDiscordId: String(applicant.applicantId || applicant.userId),
              }),
           }).catch(() => {});
        } else if (instantJoin && applicant.applicantId) {
           fetch("/api/discord/notify-invite", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                 lobbyId: targetLobby.id,
                 applicantDiscordId: String(applicant.applicantId || applicant.userId),
                 mode: "confirmed",
              }),
           }).catch(() => {});
        }
        addToast(instantJoin ? `${applicant.name} auto-accepted!` : `${applicant.name} invited! 60s.`, "success");
     };

     // Auto-accept: batch-process ALL pending applicants across ALL user lobbies
      // Sync targetLobby with latest lobbies for real-time updates
     useEffect(() => {
        if (!isManageModalOpen || !targetLobby?.id) return;
        const current = lobbies.find((l) => String(l.id) === String(targetLobby.id));
        const isOwner = userIsOfferOwner(targetLobby, currentUserId, currentUserDiscordHandle);

        if (!current) {
           if (!isOwner) {
              const fallbackChild = lobbies.find(
                 (l) =>
                    l.resurrected &&
                    (l.accepted || []).some((a: any) => memberIdentityKey(a) === String(currentUserId))
              );
              if (fallbackChild) setTargetLobby(fallbackChild);
           } else {
              const family = getViewableOfferThreads(targetLobby, currentUserId, lobbies);
              const active = family.find(
                 (t) => !isEmbeddedFootArchive(t) && t.status !== "unpaid" && t.status !== "completed"
              );
              if (active) setTargetLobby(active);
              else setIsManageModalOpen(false);
           }
           return;
        }

        if (isEmbeddedFootArchive(current) && !isOwner) {
           if (!userParticipatedInThread(current, currentUserId)) {
              const child = lobbies.find(
                 (l) =>
                    String(l.parentId) === String(current.id) &&
                    l.resurrected &&
                    !isEmbeddedFootArchive(l)
              );
              if (child) {
                 setTargetLobby(child);
                 return;
              }
           }
        }

        if (current.status === "in_progress" && userParticipatedInThread(current, currentUserId)) {
           // never eject from an active in-progress mission
        } else if (!isOwner && current.status === "unpaid") {
           if (isEmbeddedFootArchive(current) && userParticipatedInThread(current, currentUserId)) {
              // leaver viewing unpaid foot ledger from ongoing
           } else if (isLevelingOffer(current) && userParticipatedInThread(current, currentUserId)) {
              // leveling unpaid — player views payment proof thread
           } else {
              const child = findResurrectedChildForParent(current.id, lobbies, currentUserId);
              const onChild =
                 child &&
                 (child.accepted || []).some((a: any) => memberIdentityKey(a) === String(currentUserId));
              if (onChild) {
                 setTargetLobby(child);
                 return;
              }
              if (!userParticipatedInThread(current, currentUserId)) {
                 setIsManageModalOpen(false);
                 return;
              }
           }
        }

        // Owner may stay on any thread they opened (unpaid ledger, standby repost, in-progress, etc.)

        const lobbySnapshot = (l: any) =>
           `${l.status || "standby"}|${applicantsLiveSnapshot(l.applicants || [])}|${(l.accepted || [])
              .map((a: any) => `${memberIdentityKey(a)}:${a.status || ""}`)
              .join(",")}`;
        if (lobbySnapshot(current) !== lobbySnapshot(targetLobby)) {
           setTargetLobby({ ...current });
        }
     }, [lobbies, targetLobby, currentUserId, isManageModalOpen]);

     // Auto-cleanup expired invites (accepted pending slots + legacy applicant invites)
     useEffect(() => {
         const interval = setInterval(() => {
            let changed = false;
            const expiredNotifIds = new Set<number>();
            const upd = lobbies.map((l) => {
               let next = purgeExpiredLobbyInvites(l);
               const expiredAccepted = (l.accepted || []).filter(
                  (a: any) => a.status === "invited" && a.inviteExpiresAt && Date.now() > a.inviteExpiresAt
               );
               expiredAccepted.forEach((a: any) => {
                  if (a.inviteNotifId) expiredNotifIds.add(a.inviteNotifId);
               });

               const legacyExpired = (l.applicants || []).filter(
                  (a: any) => a.invitedAt && a.inviteExpiresAt && Date.now() > a.inviteExpiresAt
               );
               legacyExpired.forEach((a: any) => {
                  if (a.inviteNotifId) expiredNotifIds.add(a.inviteNotifId);
               });

               if (legacyExpired.length) {
                  next = {
                     ...next,
                     applicants: (next.applicants || []).filter(
                        (a: any) => !(a.invitedAt && a.inviteExpiresAt && Date.now() > a.inviteExpiresAt)
                     ),
                  };
               }

               if (next !== l || legacyExpired.length || expiredAccepted.length) changed = true;
               return next;
            });
            if (!changed) return;
            const updNotifs =
               expiredNotifIds.size > 0
                  ? notifications.filter((n) => !expiredNotifIds.has(n.id))
                  : notifications;
            setLobbies(upd);
            if (expiredNotifIds.size > 0) setNotifications(updNotifs);
            saveGlobalData({
               lobbies: upd,
               ...(expiredNotifIds.size > 0 ? { notifications: updNotifs } : {}),
            });
         }, 2000);
         return () => clearInterval(interval);
     }, [lobbies, notifications]);

     const ownerAutoAcceptActive = useMemo(() => {
        const owner = registeredUsers.find((u: any) => String(u.id) === String(currentUserId));
        return (
           isSecretClubTier(owner) && autoAcceptEnabled && Date.now() <= autoAcceptEndTime
        );
     }, [registeredUsers, currentUserId, autoAcceptEnabled, autoAcceptEndTime]);

     // Auto-accept: instantly confirm pending applicants on owner's standby offers
     useEffect(() => {
        if (!ownerAutoAcceptActive) return;
        if (autoAcceptBusyRef.current) return;

        const seen = new Set<string>();
        const pending: { lobbyId: string; app: any }[] = [];
        for (const l of lobbies) {
           if (String(l.ownerId) !== String(currentUserId)) continue;
           if (l.status && l.status !== "standby") continue;

           for (const app of l.applicants || []) {
              if (app.invitedAt) continue;
              const key = `${l.id}:${memberIdentityKey(app)}`;
              if (!key || seen.has(key)) continue;
              const role = (app.role || "dps").toLowerCase();
              if (!(Number(l.roles?.[role]) > 0)) continue;
              seen.add(key);
              pending.push({ lobbyId: String(l.id), app });
           }
        }
        if (!pending.length) return;

        autoAcceptBusyRef.current = true;
        let next = [...lobbies];
        let newNotifications = [...notifications];
        for (const { lobbyId, app } of pending) {
           const lobby = next.find((l) => String(l.id) === lobbyId);
           if (!lobby) continue;
           const visual = resolveMemberVisual(app);
           const enriched = {
              ...app,
              applicantAvatar: app.applicantAvatar || visual.avatar || "",
              applicantEffect: app.applicantEffect || visual.effect || "none",
           };
           if (isLevelingOffer(lobby)) {
              next = acceptApplicantAcrossLobbies(next, lobbyId, enriched);
           } else {
              const notifId = Date.now() + Math.floor(Math.random() * 1000);
              next = next.map((l) =>
                 String(l.id) === lobbyId ? inviteApplicantToLobby(l, enriched, notifId) : l
              );
              next = withdrawUserFromAllLobbies(
                 next,
                 memberIdentityKey(enriched),
                 lobbyId,
                 lobby
              );
              newNotifications.push({
                 id: notifId,
                 toUser: resolveNotificationRecipient(app, registeredUsers),
                 fromUser: currentUserDisplay,
                 fromHandle: currentUserDiscordHandle,
                 fromAvatar: session?.user?.image,
                 message: `Invited to ${lobby.title}!`,
                 type: "lobby_accept",
                 lobbyId: lobby.id,
                 applicantId: app.id,
                 applicantName: app.applicantName || app.name,
                 applicantData: enriched,
                 inviteExpiresAt: Date.now() + 60000,
                 timestamp: Date.now(),
              });
           }
        }
        setLobbies(next);
        setNotifications(newNotifications);
        setTargetLobby((prev: any) => {
           if (!prev?.id) return prev;
           const updated = next.find((l) => String(l.id) === String(prev.id));
           return updated ? { ...updated } : prev;
        });
        saveGlobalData({ lobbies: next, notifications: newNotifications }).finally(() => {
           setTimeout(() => {
              autoAcceptBusyRef.current = false;
           }, 800);
        });
     }, [lobbies, ownerAutoAcceptActive, currentUserId, saveGlobalData]);

     // Sync auto-apply block list from server kick/leave history
     useEffect(() => {
        for (const l of lobbies) {
           if (userExitBlockedFromLobby(l, lobbies, currentUserId)) {
              markAutoApplyBlocked(String(l.id), l.parentId);
           }
        }
     }, [lobbies, currentUserId, markAutoApplyBlocked]);

     const handleReject = (applicantId: number) => {
      if (!targetLobby) return;
      const updated = lobbies.map(l => l.id === targetLobby.id ? { ...l, applicants: l.applicants.filter((a: any) => a.id !== applicantId) } : l);
      setLobbies(updated);
      setTargetLobby(updated.find(l => l.id === targetLobby.id));
      saveGlobalData({ lobbies: updated });
      addToast("Transmission terminated.", "info");
   };

    const dismissNotification = (notifId: number) => {
       const updated = notifications.filter(n => n.id !== notifId);
       setNotifications(updated);
       saveGlobalData({ notifications: updated });
    };

    const clearAllNotifications = () => {
       setNotifications([]);
       saveGlobalData({ notifications: [] });
       setIsNotifOpen(false);
       addToast("All transmissions cleared.", "info");
    };

    const handleConfirmLobby = async (notif: any) => {
      const lobby = lobbies.find((l) => String(l.id) === String(notif.lobbyId));
      if (
         lobby &&
         !isLevelingOffer(lobby) &&
         userIsActiveInOtherDungeonOffer(lobbies, currentUserId, notif.lobbyId)
      ) {
         addToast("You already have another pending or active dungeon offer.", "error");
         return;
      }
      const invitedMember =
         (lobby?.accepted || []).find(
            (a: any) =>
               memberIdentityKey(a) === String(currentUserId) && a.status === "invited"
         ) ||
         lobby?.applicants?.find(
            (a: any) =>
               String(a.id) === String(notif.applicantId) ||
               memberIdentityKey(a) === String(currentUserId)
         ) ||
         notif.applicantData;
      if (!invitedMember) return;

      const enriched = {
         ...invitedMember,
         ...(notif.applicantData || {}),
      };
      const updatedLobbies = acceptApplicantAcrossLobbies(
         lobbies,
         notif.lobbyId,
         enriched
      );
      const updatedNotifs = notifications.filter(n => n.id !== notif.id);
       setLobbies(updatedLobbies);
       setNotifications(updatedNotifs);
       await saveGlobalData({ lobbies: updatedLobbies, notifications: updatedNotifs });
      setIsNotifOpen(false);
      setInviteToReview(null);
      playSound('reward');
      addToast(t("positionSecured"), "success");
   };

   // Player auto-accept: instantly confirm leveling invites only (dungeon stays 60s pending).
   const playerAutoAcceptActive =
      autoAcceptEnabled && Date.now() <= autoAcceptEndTime && getUserTier(currentUserId) === "secret_club";
   const autoConfirmInFlightRef = useRef(false);
   useEffect(() => {
      if (!playerAutoAcceptActive || autoConfirmInFlightRef.current) return;
      const pending = notifications.filter(
         (n: any) => {
            if (!notificationMatchesUser(n, currentUserId, currentUserDiscordHandle, registeredUsers)) return false;
            if (shownNotifIds.current.includes(n.id)) return false;
            if (n.type !== "lobby_accept" && n.type !== "lobby_confirm") return false;
            const lobby = lobbies.find((l: any) => String(l.id) === String(n.lobbyId));
            if (!lobby || !isLevelingOffer(lobby)) return false;
            return true;
         }
      );
      if (!pending.length) return;

      autoConfirmInFlightRef.current = true;
      (async () => {
         try {
            const notif = pending[0];
            shownNotifIds.current.push(notif.id);
            await handleConfirmLobby(notif);
         } finally {
            autoConfirmInFlightRef.current = false;
         }
      })();
   }, [notifications, playerAutoAcceptActive, currentUserId, currentUserDiscordHandle, registeredUsers, lobbies]);

   const handleJoinVoice = async (lobbyId: string) => {
      if (!session?.user || currentUserId === "guest") {
         addToast("Sign in with Discord to use voice.", "error");
         return;
      }

      if (!lobbyId || String(lobbyId) === "undefined") {
         return;
      }

      const target = lobbies.find(l => String(l.id) === String(lobbyId));
      if (!target || !userCanAccessVoice(target, currentUserId, currentUserDiscordHandle)) {
         return;
      }

      if (voiceToken) {
         setVoiceToken(null);
         setVoiceServerUrl(null);
         localStorage.removeItem('uplink_voice_lobby');
         return;
      }

      const now = Date.now();
      if (voiceJoinInFlight.current || now < voiceJoinCooldownUntil.current) {
         return;
      }
      voiceJoinInFlight.current = true;
      voiceJoinCooldownUntil.current = now + 2500;
      
      setIsJoiningVoice(true);
      try {
          const resp = await fetch(`/api/livekit?room=${encodeURIComponent(String(lobbyId))}`, {
             credentials: "include",
          });
         const data = await resp.json().catch(() => ({}));
         if (data.token) {
             setVoiceToken(data.token);
             if (data.serverUrl) setVoiceServerUrl(String(data.serverUrl));
             localStorage.setItem('uplink_voice_lobby', String(lobbyId));
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
            // Locked voice — no toast spam; UI already shows lock state.
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

   // Auto-disconnect voice when lobby closes or mission ends
   useEffect(() => {
      if (voiceToken && targetLobby) {
           if (!isVoiceLobbyOpen(targetLobby)) {
             setVoiceToken(null);
             setVoiceServerUrl(null);
             localStorage.removeItem('uplink_voice_lobby');
             addToast("Voice link closed.", "info");
         }
      }
    }, [targetLobby?.status, targetLobby?.roles, voiceToken]);

    // Voice reconnect is manual only (Join Channel) — avoids stale toasts on page load.
    useEffect(() => {
      if (lobbies.length > 0 && !reconnectAttempted.current) {
        reconnectAttempted.current = true;
        const storedLobbyId = localStorage.getItem("uplink_voice_lobby");
        if (storedLobbyId && !lobbies.some((l) => String(l.id) === String(storedLobbyId) && l.status === "in_progress")) {
          localStorage.removeItem("uplink_voice_lobby");
          if (voiceToken) setVoiceToken(null);
        }
      }
    }, [lobbies, voiceToken]);

     const handleLeaveLobby = (lobbyId: string) => {
       const lobby = lobbies.find(l => l.id === lobbyId);
       if (lobby && lobby.status === 'standby') {
          const member = lobby.accepted?.find(
             (a: any) => memberIdentityKey(a) === String(currentUserId)
          );
          if (member) {
             handleCancelMember(member);
             setTargetLobby(null);
             setIsManageModalOpen(false);
             addToast("You left the group.", "info");
          } else {
             void withdrawFromLobby(lobbyId);
             markAutoApplyCancelled(lobbyId);
             setTargetLobby(null);
             setIsManageModalOpen(false);
             addToast("Application withdrawn.", "info");
          }
          return;
       }
       setLeaveModal(lobbyId);
       setCompletedRunsInput("0");
    };

   const handleKickMember = (lobbyId: string, member: any) => {
      const lobby = lobbies.find(l => l.id === lobbyId);
      if (lobby && lobby.status === 'standby') {
         handleCancelMember(member);
         return;
      }
      setKickModal({ lobbyId, member });
      setCompletedRunsInput("0");
   };

       const confirmLeaveOrKick = async (lobbyId: string, member: any, isKick: boolean, completed: number) => {
           const updatedUsers = [...registeredUsers];
          const lobby = lobbies.find(l => l.id === lobbyId);
          if (!lobby) return;
          // For LEAVE action (no member provided), find current user in the lobby
          if (!member && !isKick) {
             member = lobby.accepted?.find(
                (a: any) => memberIdentityKey(a) === String(currentUserId)
             );
          }
          if (!member) return;

          const historySnapshot =
             completed > 0
                ? {
                     ...member,
                     applicantId: memberIdentityKey(member),
                     leftAt: Date.now(),
                     runsAtExit: completed,
                     reason: isKick ? "kicked" : "left",
                  }
                : null;

          if (memberIdentityKey(member) === String(currentUserId)) {
             markAutoApplyBlocked(lobbyId, lobby.parentId);
          }

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

          const actorIdentity = resolveChatIdentity(isKick ? currentUserId : (member.applicantId || member.userId), {
             from: isKick ? currentUserDisplay : (member.applicantName || member.name || "Operative"),
             fromHandle: isKick ? currentUserDiscordHandle : (member.applicantDiscordHandle || member.discordName || member.applicantName || member.name),
             fromAvatar: isKick ? (session?.user?.image || "") : (member.applicantAvatar || member.avatar || "")
          });
          const leaveMsg = {
             id: Date.now() + 1,
             fromId: isKick ? currentUserId : (member.applicantId || member.userId),
             from: actorIdentity.name,
             fromHandle: isKick ? currentUserDiscordHandle : (member.applicantDiscordHandle || member.discordName || member.applicantName || member.name),
             fromAvatar: actorIdentity.avatar,
             fromEffect: isKick ? myEffect : (member.applicantEffect || member.effect || "none"),
             text: `${member.applicantName || member.name || "Operative"} ${isKick ? "was kicked from" : "left"} the offer after ${completed} run${completed === 1 ? "" : "s"}.`,
             image: null,
             time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          const splitResult = splitLobbyAfterMemberExit(
             lobbies,
             lobbyId,
             member,
             Math.max(0, completed),
             isKick,
             leaveMsg,
             historySnapshot || member
          );
          if (!splitResult) return;
          const updated = splitResult.lobbies.map(repairLobbyRoles);
          const leaverSelf = memberIdentityKey(member) === String(currentUserId) && !isKick;

         setLobbies(updated);
         setRegisteredUsers(updatedUsers);
         splitInFlightRef.current = true;
         try {
            const res = await fetch("/api/lobbies/split-exit", {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({
                  lobbyId,
                  member,
                  completed: Math.max(0, completed),
                  isKick,
                  leaveMsg,
                  historySnapshot,
               }),
            });
            if (res.ok) {
               const data = await res.json();
               if (Array.isArray(data.lobbies)) {
                  const repaired = data.lobbies.map(repairLobbyRoles);
                  setLobbies(repaired);
                  if (memberIdentityKey(member) === String(currentUserId)) {
                     const child = data.childLobby;
                     if (child?.id) markAutoApplyBlocked(String(child.id), lobbyId);
                  }
               }
            } else {
               await saveGlobalData({ lobbies: updated });
            }
         } catch {
            await saveGlobalData({ lobbies: updated });
         } finally {
            splitInFlightRef.current = false;
            window.dispatchEvent(new CustomEvent("data-refresh"));
         }
         if (memberIdentityKey(member) === String(currentUserId)) {
            saveGlobalData({ registeredUsers: updatedUsers });
         }
         setKickModal(null);
         setLeaveModal(null);

         if (leaverSelf) {
            setTargetLobby(null);
            setIsManageModalOpen(false);
         } else {
            const focusId = splitResult.childLobby?.id || splitResult.focusLobbyId;
            const focus = updated.find((l: any) => String(l.id) === String(focusId));
            const focusActive =
               focus &&
               (["standby", "in_progress"].includes(focus.status || "standby") ||
                  isEmbeddedFootArchive(focus));
            if (focusActive) {
               setTargetLobby(focus);
               setIsManageModalOpen(true);
            } else {
               setTargetLobby(null);
               setIsManageModalOpen(false);
            }
         }
         addToast(splitResult.childLobby ? (isKick ? `Operative kicked. Remaining runs reposted.` : `You left the group. Remaining runs reposted.`) : (isKick ? `Operative kicked.` : `You left the group.`), "info");
     };

   // Simple cancel: remove a member before mission starts, no runs/payment tracking
    const handleCancelMember = (member: any) => {
       if (!targetLobby || targetLobby.status !== 'standby') return;
       const notifId = member.inviteNotifId;
       const updated = lobbies.map((l) => {
          if (l.id !== targetLobby.id) return l;
          if (member.status === "invited") return repairLobbyRoles(cancelLobbyInvite(l, member));
          return repairLobbyRoles({
             ...l,
             accepted: acceptedExcludingMember(l.accepted || [], member),
          });
       });
      const updNotifs = notifId
         ? notifications.filter((n) => n.id !== notifId)
         : notifications;
      const updatedLobby = updated.find((l) => l.id === targetLobby.id);
      setLobbies(updated);
      setTargetLobby(updatedLobby);
      if (notifId) setNotifications(updNotifs);
      saveGlobalData({
         lobbies: updated,
         ...(notifId ? { notifications: updNotifs } : {}),
      });
      addToast(`${member.applicantName || member.name} removed.`, "info");
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
         time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      const updated = appendOfferFamilyMessage(lobbies, lobby, newMsg);
      const updatedTarget = updated.find((l) => l.id === lobbyId) || null;
      setLobbies(updated);
      if (updatedTarget) setTargetLobby(updatedTarget);
      saveGlobalData({ lobbies: updated });
      setChatMessage("");
      setChatImagePreview(null);
   };

   const deleteLobby = (id: string) => {
      const lobby = lobbies.find((l) => String(l.id) === String(id));
      if (lobby && !canOwnerCancelLobby(lobby)) {
         addToast("Cannot cancel — squad is full or mission already started.", "error");
         return;
      }
      const updated = lobbies.filter(l => l.id !== id);
      setLobbies(updated);
      saveGlobalData({ lobbies: updated });
      addToast("Order deleted.", "info");
   };

   const terminateLobby = useCallback((lobbyId: string) => {
      const lobbyKey = String(lobbyId);
      const updated = lobbies.filter((l) => String(l.id) !== lobbyKey);
      const updatedNotifs = notifications.filter((n: any) => String(n.lobbyId) !== lobbyKey);
      setLobbies(updated);
      setNotifications(updatedNotifs);
      if (targetLobby && String(targetLobby.id) === lobbyKey) {
         setTargetLobby(null);
         setIsManageModalOpen(false);
         setActiveMemberAction(null);
         setReportScamTarget(null);
         setChatMessage("");
         setChatImagePreview(null);
      }
      if (voiceToken && targetLobby && String(targetLobby.id) === lobbyKey) {
         setVoiceToken(null);
         localStorage.removeItem("uplink_voice_lobby");
      }
      if (String(editingLobby?.id) === lobbyKey) setEditingLobby(null);
      saveGlobalData({ lobbies: updated, notifications: updatedNotifs });
      addToast("Offer cancelled.", "info");
   }, [lobbies, notifications, targetLobby, voiceToken, editingLobby, saveGlobalData, addToast]);

   const deleteGoldOffer = (id: string) => {
      const updated = goldOffers.filter(g => g.id !== id);
      setGoldOffers(updated);
      saveGlobalData({ goldOffers: updated });
      addToast("Offer retracted.", "info");
   };

   const handleRequestGold = (gold: any) => {
      if (session?.user) {
         const newNotif = {
            id: Date.now(),
            toUser: gold.ownerDiscordName,
            fromUser: currentUserDisplay,
            fromHandle: currentUserDiscordHandle,
            fromAvatar: session?.user?.image,
            message: `${currentUserDisplay} is interested in your ${gold.amountM}M Gold offer!`,
            type: "gold_inquiry",
            timestamp: Date.now()
         };
         const newNotifications = [...notifications, newNotif];
         setNotifications(newNotifications);
         saveGlobalData({ notifications: newNotifications });
         addToast("Inquiry transmitted to seller.", "success");
      } else {
         signIn("discord");
      }
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
       if (targetLobby && String(targetLobby.id) === String(updatedLobby.id)) {
          setTargetLobby(updatedLobby);
       }
       saveGlobalData({ lobbies: updated });
       setEditingLobby(null);
       addToast("Operation parameters updated.", "success");
    };

   const handleUpdateGold = async (updatedGold: any) => {
      const updated = goldOffers.map(g => g.id === updatedGold.id ? updatedGold : g);
      setGoldOffers(updated);
      saveGlobalData({ goldOffers: updated });
      setEditingGold(null);
      addToast("Market listing refined.", "success");
   };

   const upsertSyncedRaiderCharacter = (data: any) => {
      const existingMyChar = myCharacters.find(
         (c) => c.name === data.name && c.realm === data.realm
      );
      const existingGlobalChar = globalCharacters.find(
         (c) => String(c.userId) === String(currentUserId) && c.name === data.name && c.realm === data.realm
      );
      const char = buildCharacterFromRaiderProfile(data, {
         userId: currentUserId,
         userName: currentUserDisplay,
         userAvatar: session?.user?.image || "",
         discordName: currentUserDiscordHandle,
         existingId: existingMyChar?.id || existingGlobalChar?.id,
      });
      const updatedMy = existingMyChar
         ? myCharacters.map((c) => (c.id === existingMyChar.id ? char : c))
         : [char, ...myCharacters];
      const updatedGlobal = existingGlobalChar
         ? globalCharacters.map((c) => (c.id === existingGlobalChar.id ? char : c))
         : [...globalCharacters, char];
      return {
         char,
         updatedMy,
         updatedGlobal,
         isNewToMy: !existingMyChar,
         isNewToGlobal: !existingGlobalChar,
      };
   };

   const handleSyncRaiderIo = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!raiderLink) return;
      setIsSyncing(true);
      const match = raiderLink.match(/characters\/([^\/]+)\/([^\/]+)\/([^\/?]+)/);
      if (match) {
         const [_, region, realm, name] = match;
         try {
            const res = await fetch(
               `https://raider.io/api/v1/characters/profile?region=${region}&realm=${realm}&name=${name}&fields=mythic_plus_scores_by_season:current,gear,mythic_plus_best_runs:all`
            );
            if (res.ok) {
               const data = await res.json();
               const crossUserDup = globalCharacters.some(
                  (c) => c.name === data.name && c.realm === data.realm && String(c.userId) !== String(currentUserId)
               );
               if (crossUserDup) {
                  addToast("CRITICAL: Character identity already registered by another operative.", "error");
                  setIsSyncing(false);
                  return;
               }
               const { updatedMy, updatedGlobal, isNewToMy } = upsertSyncedRaiderCharacter(data);
               clearRemovedCharacterKey(currentUserId, { name: data.name, realm: data.realm, region: data.region });
               setMyCharacters(updatedMy);
               setGlobalCharacters(updatedGlobal);
               localStorage.setItem(`UL_CHARS_${currentUserId}`, JSON.stringify(updatedMy));
               await saveGlobalData({ characters: updatedGlobal });
               setRaiderLink("");
               addToast(
                  isNewToMy ? "Character added to My Characters." : "Character data refreshed (role scores updated).",
                  "success"
               );
            } else addToast("Character not found on terminal.", "error");
         } catch {
            addToast("Connection lost with IO Server.", "error");
         }
      }
      setIsSyncing(false);
   };



   const handleApplyOperative = async () => {
      const sanitizedTag = sanitizeInput(onboardingData.battleTag);
      const sanitizedRaider = sanitizeInput(onboardingData.raiderLink);

      if (!sanitizedTag || !sanitizedRaider) {
         const msg = "Enter your Battle.net ID and Raider.io link.";
         setOnboardingError(msg);
         addToast(msg, "error");
         return;
      }

      setOnboardingError("");
      setIsSyncing(true);
      try {
         const verifyRes = await fetch("/api/onboarding/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ battleTag: sanitizedTag, raiderLink: sanitizedRaider }),
         });
         const verifyData = await verifyRes.json().catch(() => ({}));
         if (!verifyRes.ok) {
            const msg = verifyData.error || "Verification failed";
            setOnboardingError(msg);
            addToast(msg, "error");
            return;
         }

         const data = verifyData.profile;
         const crossUserDup = globalCharacters.some(
            (c) => c.name === data.name && c.realm === data.realm && String(c.userId) !== String(currentUserId)
         );
         if (crossUserDup) {
            const msg = "This Raider.io character is already linked to another account.";
            setOnboardingError(msg);
            addToast(msg, "error");
            return;
         }

         const { updatedMy, updatedGlobal } = upsertSyncedRaiderCharacter(data);
         clearRemovedCharacterKey(currentUserId, { name: data.name, realm: data.realm, region: data.region });
         setMyCharacters(updatedMy);
         setGlobalCharacters(updatedGlobal);
         localStorage.setItem(`UL_CHARS_${currentUserId}`, JSON.stringify(updatedMy));

         const alreadyRegistered = registeredUsers.some(
            (u) => String(u.id) === String(currentUserId) || u.username === currentUserDiscordHandle
         );

         if (alreadyRegistered) {
            const ok = await saveGlobalData({ characters: updatedGlobal });
            if (!ok) {
               const msg = "Could not save character. Try again.";
               setOnboardingError(msg);
               addToast(msg, "error");
               return;
            }
            localStorage.setItem("uplink_is_registered", "true");
            setIsOnboardingModalOpen(false);
            setOnboardingError("");
            addToast("Character added to My Characters.", "success");
            return;
         }

         const newUser = {
            id: currentUserId,
            name: currentUserDisplay,
            username: currentUserDiscordHandle,
            avatar: session?.user?.image || "",
            battleTag: sanitizedTag,
         };

         const updatedUsers = [...registeredUsers, newUser];
         setRegisteredUsers(updatedUsers);

         const ok = await saveGlobalData({
            registeredUsers: updatedUsers,
            characters: updatedGlobal,
         });
         if (!ok) {
            const msg = "Registration could not be saved. Try again.";
            setOnboardingError(msg);
            addToast(msg, "error");
            return;
         }

         localStorage.setItem("uplink_is_registered", "true");
         setIsOnboardingModalOpen(false);
         setOnboardingError("");
         setIsWelcomePlansOpen(true);
         addToast("Terminal Access Granted. Character added to My Characters.", "success");
      } catch {
         const msg = "Uplink to Raider.io failed. Try again.";
         setOnboardingError(msg);
         addToast(msg, "error");
      } finally {
         setIsSyncing(false);
      }
   };

     const updateAvatarEffect = async (effectId: string) => {
        if (getUserTier(currentUserId) !== "secret_club" && effectId !== "none") {
           addToast("Upgrade your subscription to unlock premium effects.", "error");
           return;
        }
        setMyEffect(effectId);
        localStorage.setItem(`UL_EFFECT_${currentUserId}`, effectId);

        const updatedGlobalChars = globalCharacters.map(c =>
           c.userId === currentUserId ? { ...c, effect: effectId } : c
        );
        let updatedUsers = registeredUsers;
        const userIdx = registeredUsers.findIndex((u: any) => String(u.id) === String(currentUserId));
        if (userIdx !== -1) {
           updatedUsers = [...registeredUsers];
           updatedUsers[userIdx] = { ...updatedUsers[userIdx], effect: effectId };
        }

        setGlobalCharacters(updatedGlobalChars);
        setRegisteredUsers(updatedUsers);

        const ok = await saveGlobalData({ characters: updatedGlobalChars, registeredUsers: updatedUsers });
        if (!ok) {
           addToast("Failed to save effect — try again.", "error");
           return;
        }
        addToast("Avatar decoration synchronized.", "success");
     };

    const handleBanUser = async (username: string) => {
       const updatedBanned = [...bannedUsers, username];
       const targetUser = registeredUsers.find(u => u.username === username);
       if (targetUser && (targetUser.username === "minhonovazen" || targetUser.id === "1497295886223544471")) {
          addToast("CRITICAL ERROR: Cannot sever admin uplink.", "error");
          return;
       }
       setBannedUsers(updatedBanned);
       await saveGlobalData({ bannedUsers: updatedBanned });
       addToast(`${username} has been suspended. Data preserved.`, "success");
   };

   const handleBanUserIp = async (user: { username?: string; lastKnownIp?: string }) => {
      const ip = String(user?.lastKnownIp || "").trim();
      if (!ip) {
         addToast("No IP recorded yet — user must visit the site first.", "error");
         return;
      }
      try {
         const res = await fetch("/api/admin/banned-ips", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ip, reason: `Banned with user ${user.username || "unknown"}` }),
         });
         const data = await res.json();
         if (!res.ok) {
            addToast(data.error || "Failed to ban IP", "error");
            return;
         }
         addToast(`IP ${ip} banned.`, "success");
      } catch {
         addToast("Failed to ban IP.", "error");
      }
   };

   const handleClearUserDatabase = async (userId: string, username: string) => {
      const targetUser = registeredUsers.find(u => u.id === userId);
      if (targetUser && (targetUser.username === "minhonovazen" || targetUser.id === "1497295886223544471")) {
         addToast("CRITICAL ERROR: Admin database is protected.", "error");
         return;
      }
      const uid = String(userId);
      const updatedUsers = registeredUsers.filter((u) => String(u.id) !== uid);
      const updatedChars = globalCharacters.filter((c) => String(c.userId) !== uid);
      const updatedApps = applications.filter((a) => String(a.userId) !== uid);
      const updatedLobbies = lobbies.map((l) => {
         const applicants = (l.applicants || []).filter((a: any) => !memberMatchesUser(a, uid));
         const accepted = (l.accepted || []).filter((a: any) => !memberMatchesUser(a, uid));
         if (applicants.length === (l.applicants || []).length && accepted.length === (l.accepted || []).length) {
            return l;
         }
         return { ...l, applicants, accepted };
      });
      const updatedNotifs = notifications.filter(
         (n) => String(n.fromId) !== uid && String(n.toUserId) !== uid && String(n.applicantId) !== uid
      );
      setRegisteredUsers(updatedUsers);
      setGlobalCharacters(updatedChars);
      setApplications(updatedApps);
      setLobbies(updatedLobbies);
      setNotifications(updatedNotifs);
      if (String(currentUserId) === uid) {
         setMyCharacters([]);
         setBankCharacters([]);
         localStorage.removeItem(`UL_CHARS_${uid}`);
         localStorage.removeItem(`UL_BANK_${uid}`);
         localStorage.setItem("uplink_is_registered", "false");
         setIsOnboardingModalOpen(true);
      }
      await saveGlobalData({
         registeredUsers: updatedUsers,
         characters: updatedChars,
         applications: updatedApps,
         lobbies: updatedLobbies,
         notifications: updatedNotifs,
      });
      addToast(`Player data cleared for ${username}. They can register via Raider.io again.`, "success");
   };

    const handleUnbanUser = async (username: string) => {
       const updatedBanned = bannedUsers.filter(u => u !== username);
       setBannedUsers(updatedBanned);
       await saveGlobalData({ bannedUsers: updatedBanned });
       addToast(`${username} unbanned. They can now access the site again.`, "success");
     };

     const handleDiscardProof = () => {
        const updated = { ...targetLobby, paymentProof: null };
        setTargetLobby(updated);
        handleUpdateLobby(updated);
     };

     const handlePasteProof = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            const blob = items[i].getAsFile();
            const reader = new FileReader();
            reader.onload = (ev) => {
              const proof = ev.target?.result;
              const proofMsg = {
                id: Date.now(),
                fromId: currentUserId,
                from: currentUserDisplay,
                fromHandle: currentUserDiscordHandle,
                fromAvatar: session?.user?.image || "",
                fromEffect: myEffect,
                text: "Payment proof uploaded",
                image: proof,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              };
              const updated = { ...targetLobby, paymentProof: proof, messages: [...(targetLobby.messages || []), proofMsg] };
              setTargetLobby(updated);
              const updatedLobbies = lobbies.map((l: any) =>
                String(l.id) === String(targetLobby.id) ? updated : l
              );
              setLobbies(updatedLobbies);
              saveGlobalData({ lobbies: updatedLobbies });
              addToast("Transmission intercepted and captured.", "success");
            };
            if (blob) reader.readAsDataURL(blob);
          }
        }
     };

      const handleConfirmPayout = () => {
         const updated = { ...targetLobby, payoutStatus: 'paid', status: 'completed' as const, completedAt: Date.now() };
         setTargetLobby(updated);
         const updatedUsers = [...registeredUsers];
         const kLevel = parseInt(targetLobby.keyLevel?.replace('+', '') || '0');
         const keyLabel = targetLobby.keyLevel || (kLevel > 0 ? `+${kLevel}` : '');
         const rangeLabel = targetLobby.startLevel && targetLobby.endLevel ? `${targetLobby.startLevel}-${targetLobby.endLevel}` : '';
         const allMemberIds = [targetLobby.ownerId, ...(targetLobby?.accepted || []).map((m: any) => m.applicantId || m.userId)];
         allMemberIds.forEach((memberId: string) => {
           const uIdx = updatedUsers.findIndex(u => String(u.id) === String(memberId));
           if (uIdx !== -1) {
             const stats = { ...(updatedUsers[uIdx].stats || { total: 0, k5: 0, k10: 0, k15: 0, k20: 0 }), levelingTotal: updatedUsers[uIdx].stats?.levelingTotal || 0, dungeonTotal: updatedUsers[uIdx].stats?.dungeonTotal || 0, perKeyLevel: { ...(updatedUsers[uIdx].stats?.perKeyLevel || {}) }, perLevelRange: { ...(updatedUsers[uIdx].stats?.perLevelRange || {}) } };
             stats.total += 1;
             if (kLevel >= 20) stats.k20 += 1;
             else if (kLevel >= 15) stats.k15 += 1;
             else if (kLevel >= 10) stats.k10 += 1;
             else if (kLevel >= 5) stats.k5 += 1;
             if (targetLobby.category === 'dungeon') {
                stats.dungeonTotal += 1;
                if (keyLabel) stats.perKeyLevel[keyLabel] = (stats.perKeyLevel[keyLabel] || 0) + 1;
             } else if (targetLobby.category === 'leveling') {
                stats.levelingTotal += 1;
                if (rangeLabel) stats.perLevelRange[rangeLabel] = (stats.perLevelRange[rangeLabel] || 0) + 1;
             }
             updatedUsers[uIdx] = { ...updatedUsers[uIdx], stats };
           }
         });
         setRegisteredUsers(updatedUsers);
        if (targetLobby.paymentProof) {
          const paymentMsg = { id: Date.now(), from: currentUserDisplay, fromHandle: currentUserDiscordHandle, fromAvatar: session?.user?.image || "", fromEffect: myEffect, text: "Payment confirmed ✓", image: targetLobby.paymentProof, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
          const updatedLobbies = lobbies.map((l: any) => {
            if (String(l.id) === String(targetLobby.id)) return { ...updated, messages: [...(l.messages || []), paymentMsg] };
            if ((l.parentId === targetLobby.id || l.id === targetLobby.id)) return { ...l, messages: [...(l.messages || []), paymentMsg] };
            return l;
          });
          setLobbies(updatedLobbies);
          saveGlobalData({ lobbies: updatedLobbies });
        } else {
          const childLobbies = lobbies.filter((l: any) => l.parentId === targetLobby.id);
          const updatedLobbies = lobbies.map((l: any) => {
            if (String(l.id) === String(targetLobby.id)) return updated;
            if (childLobbies.some((cl: any) => cl.id === l.id)) return { ...l, status: 'standby' as const };
            return l;
          });
          setLobbies(updatedLobbies);
          saveGlobalData({ lobbies: updatedLobbies });
        }
        saveGlobalData({ registeredUsers: updatedUsers });
        setIsPaymentModalOpen(false);
        if (hasPendingPayments) {
          setHasPendingPayments(false);
          localStorage.setItem("uplink_pending_payments", "false");
        }
        addToast("Payment Confirmed! Database updated.", "success");
        playSound('reward');
     };

     const handleSendTicketMessage = () => {
       if (!ticketMessage.trim()) return;
       const msg = { id: Date.now(), from: currentUserDisplay, fromId: currentUserId, text: ticketMessage, time: new Date().toLocaleString() };
       if (selectedTicket) {
          const updated = tickets.map(t => t.id === selectedTicket.id ? { ...t, messages: [...t.messages, msg], status: "open" } : t);
          setTickets(updated);
          setSelectedTicket({ ...selectedTicket, messages: [...selectedTicket.messages, msg] });
          saveGlobalData({ tickets: updated });
       } else {
          const newTicket = { id: Date.now(), userId: currentUserId, username: currentUserDisplay, userHandle: currentUserDiscordHandle, subject: ticketMessage.slice(0, 50), messages: [msg], status: "open", createdAt: Date.now(), expiresAt: Date.now() + TICKET_TTL_MS };
          const updated = [newTicket, ...tickets];
          setTickets(updated);
          setSelectedTicket(newTicket);
          saveGlobalData({ tickets: updated });
       }
       setTicketMessage("");
       addToast("Ticket sent!", "success");
    };

    const handleCloseTicket = (ticketId: number) => {
       const updated = tickets.map(t => t.id === ticketId ? { ...t, status: "closed" } : t);
       setTickets(updated);
       setSelectedTicket(null);
       saveGlobalData({ tickets: updated });
       addToast("Ticket closed.", "info");
    };

    const handleDeleteTicket = (ticketId: number | string) => {
       const updated = tickets.filter(t => String(t.id) !== String(ticketId));
       setTickets(updated);
       if (selectedTicket && String(selectedTicket.id) === String(ticketId)) {
          setSelectedTicket(null);
       }
       saveGlobalData({ tickets: updated });
       addToast("Ticket deleted.", "success");
    };

    const markAdminTicketsViewed = () => {
       if (!isAdmin || tickets.length === 0) return;
       const max = Math.max(0, ...tickets.map((t) => getTicketActivity(t)));
       setAdminTicketsLastSeen(max);
       localStorage.setItem("uplink_admin_tickets_seen", String(max));
    };

    const adminTicketUnread = useMemo(() => {
       if (!isAdmin) return 0;
       return tickets.filter((t) => {
          if (t.status !== "open") return false;
          return getTicketActivity(t) > adminTicketsLastSeen;
       }).length;
    }, [tickets, isAdmin, adminTicketsLastSeen]);

    const handleRenewSubscription = async (userId: string, months: number) => {
       try {
          const res = await fetch("/api/admin/subscription", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ userId, months }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
             addToast(data.error || "Failed to renew subscription", "error");
             return;
          }
          const updated = registeredUsers.map((u: any) => {
             if (String(u.id) !== String(userId)) return u;
             return {
                ...u,
                subscription: {
                  tier: "secret_club" as const,
                  startDate: u.subscription?.startDate || Date.now(),
                  endDate: data.endDate,
                },
             };
          });
          setRegisteredUsers(updated);
          await saveGlobalData({ registeredUsers: updated });
          addToast(`Subscription renewed +${months}mo (${data.daysLeft ?? "?"} days left)`, "success");
       } catch {
          addToast("Failed to renew subscription", "error");
       }
    };

    useEffect(() => {
       if (targetLobby && targetLobby.status === 'in_progress' && targetLobby.category !== 'leveling') {
          syncDetectedRunsFromServer(String(targetLobby.id));
          const interval = setInterval(() => {
             syncDetectedRunsFromServer(String(targetLobby.id));
          }, 30000);
          return () => clearInterval(interval);
       }
    }, [targetLobby?.id, targetLobby?.status, targetLobby?.missionStartTime, syncDetectedRunsFromServer]);

   const myNotifications = notifications.filter(n => {
      if (!n.toUser) return false;
      const target = n.toUser.toLowerCase();
      const myHandle = currentUserDiscordHandle?.toLowerCase();
      const myName = currentUserDisplay?.toLowerCase();
      return (myHandle && target === myHandle) || (myName && target === myName);
   });

   /** Completed missions + Raider.io detected runs for the logged-in player (profile → History). */
   const completedHistoryItems = useMemo(() => {
      if (currentUserId === "guest") return [];
      const uid = String(currentUserId);
      const selfUser = registeredUsers.find((u: any) => String(u.id) === uid);
      const items: any[] = [];
      for (const l of lobbies) {
         if (l.status === "failed") {
            const isOwner = String(l.ownerId) === uid;
            const wasMember = (l.history || []).some(
               (h: any) => memberIdentityKey(h) === uid && h.reason === "failed"
            );
            if (!isOwner && !wasMember) continue;
            items.push({
               kind: "failed_mission",
               sortKey: Number(l.failedAt) || Number(l.completedAt) || 0,
               id: `failed-${l.id}`,
               status: "failed",
               lobbyId: l.id,
               missionTitle: l.title,
               runsCount: l.runsCount,
               keyLevel: l.keyLevel,
               goldPerRun: l.goldPerRun,
               totalGold: (l.goldPerRun || 0) * (l.runsCount || 1),
               ownerId: l.ownerId,
               ownerImage: isOwner && selfUser ? (selfUser.profileGif || selfUser.avatar || l.ownerImage) : l.ownerImage,
               ownerEffect: isOwner && selfUser ? (selfUser.effect || l.ownerEffect) : l.ownerEffect,
               ownerName: isOwner && selfUser ? (selfUser.displayName || selfUser.name || l.ownerName) : (l.ownerName || l.ownerDiscordName),
               category: l.category,
               startLevel: l.startLevel,
               endLevel: l.endLevel,
               serverRegion: l.serverRegion || "US",
               customBg: l.customBg,
            });
            continue;
         }
         if (l.status !== "completed") continue;
         const isOwner = String(l.ownerId) === uid;
         const isMember = (l.accepted || []).some((a: any) => String(a.applicantId) === uid);
         if (!isOwner && !isMember) continue;

         const dr = l.detectedRuns || [];
         const myRuns = dr.filter((r: any) => String(r.playerId) === uid);

          myRuns.forEach((r: any) => {
             const ts = r.completedAt ? new Date(r.completedAt).getTime() : 0;
             items.push({
                kind: "run",
                sortKey: ts,
                id: r.runId || `${l.id}-${r.dungeon}-${r.completedAt}`,
                missionTitle: l.title,
                lobbyId: l.id,
                dungeon: r.dungeon,
                level: r.level,
                chestText: r.chestText,
                score: r.score,
                completedAt: r.completedAt,
                url: r.url,
                ownerId: l.ownerId,
                ownerImage: isOwner && selfUser ? (selfUser.profileGif || selfUser.avatar || l.ownerImage) : l.ownerImage,
                ownerName: isOwner && selfUser ? (selfUser.displayName || selfUser.name || l.ownerName) : (l.ownerName || l.ownerDiscordName),
                ownerEffect: isOwner && selfUser ? (selfUser.effect || l.ownerEffect) : l.ownerEffect,
                payoutStatus: l.payoutStatus,
                serverRegion: l.serverRegion || "US",
                customBg: l.customBg,
                runsCount: l.runsCount,
                keyLevel: l.keyLevel,
                goldPerRun: l.goldPerRun,
                totalGold: l.totalGold,
                category: l.category,
                startLevel: l.startLevel,
                endLevel: l.endLevel,
             });
          });

          if (myRuns.length === 0) {
             const maxTs = dr.reduce((m: number, r: any) => {
                const t = r.completedAt ? new Date(r.completedAt).getTime() : 0;
                return Math.max(m, t);
             }, 0);
             const sortKey = maxTs || Number(l.missionStartTime) || 0;
             items.push({
                kind: isOwner ? "mission_lead" : "mission_participant",
                sortKey,
                id: `${isOwner ? "lead" : "part"}-${l.id}`,
                missionTitle: l.title,
                lobbyId: l.id,
                detectedCount: dr.length,
                goldPerRun: l.goldPerRun,
                runsCount: l.runsCount,
                ownerId: l.ownerId,
                ownerImage: isOwner && selfUser ? (selfUser.profileGif || selfUser.avatar || l.ownerImage) : l.ownerImage,
                ownerName: isOwner && selfUser ? (selfUser.displayName || selfUser.name || l.ownerName) : (l.ownerName || l.ownerDiscordName),
                ownerEffect: isOwner && selfUser ? (selfUser.effect || l.ownerEffect) : l.ownerEffect,
                payoutStatus: l.payoutStatus,
                serverRegion: l.serverRegion || "US",
                customBg: l.customBg,
                keyLevel: l.keyLevel,
                totalGold: l.totalGold,
                category: l.category,
                startLevel: l.startLevel,
                endLevel: l.endLevel,
             });
          }
      }
      return items.sort((a, b) => b.sortKey - a.sortKey);
   }, [lobbies, currentUserId, registeredUsers]);

   /** Completed orders you lead or joined — still open Command Control / group chat. */
     const completedThreadsLobbies = useMemo(() => {
        if (currentUserId === "guest") return [];
        const uid = String(currentUserId);
        return lobbies.filter(
           (l) =>
              l.status === "completed" && l.payoutStatus === 'paid' &&
              (String(l.ownerId) === uid || (l.accepted || []).some((a: any) => String(a.applicantId) === uid))
        );
     }, [lobbies, currentUserId]);

   const openMissionThread = (lobbyId: string) => {
      const seed = lobbies.find((x) => String(x.id) === String(lobbyId));
      if (!seed) {
         addToast("Could not load that mission. Try refreshing.", "error");
         return;
      }

      const l = resolveOpenMissionThreadTarget(
         seed,
         currentUserId,
         lobbies,
         currentUserDiscordHandle
      );

      if (!l || !userCanViewOfferThread(l, currentUserId, currentUserDiscordHandle)) {
         addToast("You are no longer on this mission.", "error");
         return;
      }

      if (voiceToken) {
         const stored = localStorage.getItem("uplink_voice_lobby");
         if (!stored || String(stored) !== String(l.id)) {
            setVoiceToken(null);
            localStorage.removeItem("uplink_voice_lobby");
         }
      }

      setTargetLobby(l);
      setIsArmoryModalOpen(false);
      setIsManageModalOpen(true);
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
      }), [currentUserId, currentUserDisplay, currentUserDiscordHandle, isAdmin, session, myEffect, myVfxBg, registeredUsers, setRegisteredUsers, EFFECTS, EFFECT_IMG, theme, setTheme, addToast, saveGlobalData, playSound, t, getUserTier, getUserTierLabel, getVfxSettings, renderDualColorName, isUserHidden, resolveMemberVisual, resolveUserVisual, resolveChatIdentity, openRatePicker, DUNGEONS, WOW_CLASS_GROUPS, CLASS_ROLE_OPTIONS, AUTO_ACCEPT_DURATION_MS, AvatarWithEffect, electricColor, setElectricColor]);

     const handleLogout = async () => { try { await signOut({ redirect: false }); } catch {} window.location.href = "/"; };
     if (session?.user && currentUserDiscordHandle && bannedUsers.includes(currentUserDiscordHandle) && !isAdmin) {
       return (
          <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-b from-[#ff007f]/20 via-black to-black opacity-60" />
             <ShieldAlert className="text-[#ff007f] w-32 h-32 mb-8 animate-pulse relative z-10 drop-shadow-[0_0_40px_rgba(255,0,127,0.6)]" />
             <h1 className="text-5xl font-black tracking-tighter mb-4 uppercase relative z-10 bg-gradient-to-r from-[#ff007f] to-[#8a2be2] bg-clip-text text-transparent">ACCOUNT SUSPENDED</h1>
             <p className="text-lg text-gray-400 mb-2 uppercase tracking-widest text-center max-w-lg relative z-10 font-bold">Your uplink has been temporarily disabled.</p>
             <p className="text-sm text-gray-500 mb-8 text-center max-w-lg relative z-10">Please contact the support team to resolve this suspension.</p>
               <button onClick={() => handleLogout()} className="relative z-10 px-8 py-4 bg-white/5 text-white border border-white/20 rounded-xl font-black uppercase tracking-widest hover:bg-white/10 transition-all">Logout</button>
          </div>
       );
    }

    if (isLoading) {
       return (
          <div className="min-h-screen bg-[#030308] flex items-center justify-center overflow-hidden">
             <HeroBackground />
             <div className="relative z-10 flex flex-col items-center">
                <motion.div
                   animate={{ 
                      scale: [1, 1.1, 1],
                      opacity: [0.5, 1, 0.5]
                   }}
                   transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                   className="mb-8"
                >
                   <ProtocolMark variant={1} className="w-24 h-24 text-[#00ffff] drop-shadow-[0_0_30px_rgba(0,255,255,0.5)]" />
                </motion.div>
                <div className="h-1.5 w-64 bg-white/5 rounded-full overflow-hidden relative border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.8)]">
                   <div 
                      style={{ 
                         width: `${loadingProgress}%`,
                         background: 'linear-gradient(90deg, #00ffff 0%, #8a2be2 50%, #ff007f 100%)',
                         boxShadow: '0 0 20px rgba(0, 255, 255, 0.6)'
                      }}
                      className="absolute inset-y-0 left-0 transition-all duration-100 ease-out"
                   />
                </div>
                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.6em] text-white/20 animate-pulse">Initializing Terminal</p>
             </div>
          </div>
       );
     }

      const showOnboarding = false;

     const toastLayer = (
        <div className="fixed bottom-10 right-10 z-[250] flex flex-col gap-4 pointer-events-none">
           <AnimatePresence>
              {toasts.map((t) => (
                 <motion.div
                    key={t.id}
                    initial={{ opacity: 0, x: 50, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8, x: 20 }}
                    className={`pointer-events-auto px-8 py-5 rounded-2xl border-2 backdrop-blur-xl shadow-2xl flex items-center gap-4 min-w-[300px] max-w-md ${t.type === "error" ? "bg-red-500/10 border-red-500 text-red-500" : t.type === "success" ? "bg-green-500/10 border-green-500 text-green-500" : "bg-black/80 border-[#00ffff] text-[#00ffff]"}`}
                 >
                    {t.type === "error" ? <ShieldAlert className="w-6 h-6 shrink-0" /> : t.type === "success" ? <CheckCircle2 className="w-6 h-6 shrink-0" /> : <Bell className="w-6 h-6 shrink-0" />}
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Frequency Alert</p>
                       <p className="font-black text-sm">{t.msg}</p>
                    </div>
                 </motion.div>
              ))}
           </AnimatePresence>
        </div>
     );

     return (
        <PageContext.Provider value={pageContextValue}>
         <div className={`min-h-screen ${theme === 'light' ? 'bg-[#f8f9fc] text-[#1a1a2e]' : 'bg-[#06060c] text-gray-200'} selection:bg-[#ff007f]/30 font-[family-name:var(--font-outfit)] overflow-x-hidden transition-colors duration-700`}>
           {toastLayer}
           {status === 'authenticated' && showOnboarding && (
                 <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-[#030308]">
                    <HeroBackground />

                    <motion.div
                       variants={{
                          hidden: { opacity: 0, scale: 0.95, y: 30 },
                          visible: { 
                             opacity: 1, 
                             scale: 1, 
                             y: 0, 
                             transition: { 
                                type: "spring", 
                                damping: 25, 
                                stiffness: 120,
                                staggerChildren: 0.1
                             } 
                          }
                       }}
                       initial="hidden"
                       animate="visible"
                       onMouseMove={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          const y = e.clientY - rect.top;
                          e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
                          e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
                       }}
                       style={{ background: 'rgba(255, 255, 255, 0.03)' }}
                       className="w-full max-w-lg backdrop-blur-2xl border border-white/20 rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.3)] relative p-8 sm:p-12 group/modal"
                    >
                       {/* INTERACTIVE MOUSE GLOW */}
                       <div className="absolute inset-0 pointer-events-none opacity-0 group-hover/modal:opacity-100 transition-opacity duration-500">
                          <div 
                             className="absolute inset-0 bg-[radial-gradient(circle_600px_at_var(--mouse-x)_var(--mouse-y),rgba(99,102,241,0.15),rgba(168,85,247,0.1),transparent_80%)]"
                          ></div>
                       </div>

                       <div className="relative z-10">
                          <motion.div variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }} className="flex flex-col items-center text-center mb-12">
                             <ProtocolMark variant={1} className="w-20 h-20 text-white mb-6 drop-shadow-[0_0_25px_rgba(255,255,255,0.5)]" />
                             <h2 className="text-5xl font-black tracking-widest uppercase mb-1 bg-gradient-to-r from-[#00ffff] to-[#ff007f] bg-clip-text text-transparent">UPLINK</h2>
                             <span className="text-[9px] font-black uppercase tracking-[0.55em] text-amber-400/90 mb-2">Beta</span>
                          </motion.div>

                          <div className="space-y-6">
                             <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }} className="space-y-2">
                                <label className="text-[10px] font-black text-[#00ffff] uppercase tracking-[0.4em] ml-4 drop-shadow-[0_0_5px_rgba(0,255,255,0.5)]">Neural Signature</label>
                                <div className="bg-white/5 border-2 border-white/10 rounded-2xl p-2 group focus-within:bg-[#00ffff]/10 focus-within:border-[#00ffff] transition-all shadow-[0_0_30px_rgba(0,255,255,0.1)] relative overflow-hidden">
                                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00ffff]/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                   <div className="flex items-center gap-4 px-4 relative z-10">
                                      <img src="/classes/Battle.net.svg" className="w-9 h-9 drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]" alt="WoWLFG Battle.net" />
                                      <input
                                         type="text"
                                         placeholder="Username#1234"
                                         value={onboardingData.battleTag}
                                         onChange={(e) => {
                                            setOnboardingData({ ...onboardingData, battleTag: e.target.value });
                                            if (onboardingError) setOnboardingError("");
                                         }}
                                         className="w-full bg-transparent py-4 text-white outline-none font-black placeholder:text-white/10 uppercase"
                                      />
                                   </div>
                                </div>
                             </motion.div>

                             <motion.div variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } }} className="space-y-2">
                                <label className="text-[10px] font-black text-[#ff007f] uppercase tracking-[0.4em] ml-4 drop-shadow-[0_0_5px_rgba(255,0,127,0.5)]">Combat Registry</label>
                                <div className="bg-white/5 border-2 border-white/10 rounded-2xl p-2 group focus-within:bg-[#ff007f]/10 focus-within:border-[#ff007f] transition-all shadow-[0_0_30px_rgba(255,0,127,0.1)] relative overflow-hidden">
                                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ff007f]/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                   <div className="flex items-center gap-4 px-4 relative z-10">
                                      <img src="/classes/RAIDER IO.svg" className="w-9 h-9 drop-shadow-[0_0_8px_rgba(255,0,127,0.5)]" alt="WoWLFG Raider.io" />
                                      <input
                                         type="text"
                                         placeholder="https://raider.io/characters/..."
                                         value={onboardingData.raiderLink}
                                         onChange={(e) => {
                                            setOnboardingData({ ...onboardingData, raiderLink: e.target.value });
                                            if (onboardingError) setOnboardingError("");
                                         }}
                                         className="w-full bg-transparent py-4 text-white outline-none font-black placeholder:text-white/10 uppercase"
                                      />
                                   </div>
                                </div>
                             </motion.div>
                          </div>

                          {onboardingError ? (
                             <p className="mt-6 text-center text-sm font-bold text-red-400 px-4">{onboardingError}</p>
                          ) : null}

                          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="mt-12">
                             <button
                                onClick={handleApplyOperative}
                                disabled={isSyncing}
                                className="w-full group relative py-6 bg-gradient-to-r from-[#00ffff] to-[#ff007f] text-white font-black text-xs uppercase tracking-[0.4em] rounded-2xl shadow-[0_20px_40px_rgba(0,255,255,0.2)] hover:scale-[1.02] active:scale-95 transition-all overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
                             >
                                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                                <span className="relative z-10">{isSyncing ? "VERIFYING..." : "AUTHORIZE UPLINK"}</span>
                             </button>
                          </motion.div>
                       </div>
                    </motion.div>
                 </div>
               )}

              {(() => {
                 const innerAppContent = (
                   <>


                     <main className="relative">
                      {/* FULL PAGE ANIMATED BACKGROUND */}
                      {theme === 'dark' && (
                        <div className="fixed inset-0 z-0 pointer-events-none">
                           <HeroBackground />
                        </div>
                     )}
                      {/* HERO */}
                       <section className={`relative w-full pt-24 pb-20 md:pt-32 md:pb-28 flex flex-col items-center justify-center transition-colors duration-700 ${theme === 'light' ? 'bg-white' : ''} overflow-hidden z-[1] pointer-events-none`}>

                       {/* Light mode fallback background if needed */}
                      {theme === 'light' && (
                         <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[380px] bg-gradient-to-r from-[#ff007f]/15 via-[#00ffff]/10 to-[#8a2be2]/15 blur-[130px] rounded-[100%]" />
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,255,255,0.05)_0%,_transparent_60%)]" />
                         </div>
                      )}

                        <div className="relative z-10 flex flex-col items-center text-center px-4 w-full mx-auto mt-5 pointer-events-auto">
                          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col items-center">
                             <motion.button
                               whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                               onClick={() => { if (!session) { signIn("discord"); return; } setIsArmoryModalOpen(true); }}
                               onMouseEnter={() => setIsHomeHovered(true)}
                               onMouseLeave={() => setIsHomeHovered(false)}
                                className="group mb-6 rounded-[2rem] border border-white/10 bg-black/35 px-6 py-9 backdrop-blur-md transition-all hover:border-[#00ffff]/45 hover:shadow-[0_0_50px_rgba(0,255,255,0.14)] sm:px-10 sm:py-11 outline-none focus:outline-none focus-visible:outline-none"
                            >
                               <div className="flex flex-col items-center gap-1 sm:gap-2">
                                  <span className="font-[family-name:var(--font-space-grotesk)] text-[2.2rem] font-black leading-none tracking-tighter text-[#00ffff] drop-shadow-[0_0_22px_rgba(0,255,255,0.45)] sm:text-5xl md:text-6xl]">YOUR</span>
                                  <div className="flex items-center justify-center gap-1 font-[family-name:var(--font-space-grotesk)] text-[2.2rem] font-black leading-none tracking-tighter sm:gap-2 sm:text-5xl md:text-6xl">
                                     <span className="text-[#8a2be2] transition-colors group-hover:text-[#ff007f]">H</span>
                                     <span className="mx-1 flex items-center justify-center text-[#ff007f] transition-all group-hover:text-[#00ffff] sm:mx-2">
                                        {isHomeHovered ? <DoorOpen className="w-[0.9em] h-[0.9em]" /> : <DoorClosed className="w-[0.9em] h-[0.9em]" />}
                                     </span>
                                     <span className="text-[#8a2be2] transition-colors group-hover:text-[#ff007f]">ME</span>
                                  </div>
                               </div>
                               <p className={`mt-5 text-[10px] font-black uppercase tracking-[0.35em] ${theme === "light" ? "text-gray-500" : "text-gray-500"}`}>{session ? "Open profile" : "Sign in to continue"}</p>
                            </motion.button>
                             <h1 className={`text-sm md:text-base font-bold uppercase tracking-[0.16em] max-w-lg leading-relaxed ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'} mb-10`}>WoWLFG — Find your crew for keys, Mythic+ boosts &amp; leveling — fast, clear, no clutter.</h1>
                            <div className="flex flex-col sm:flex-row gap-6 items-center">
                               <motion.button
                                   onClick={() => { if (!session) { signIn("discord"); return; } if (isSuspended) return addToast("ACCOUNT SUSPENDED. CONTACT SUPPORT.", "error"); if (hasPendingPayments) return addToast("CLEAR YOUR PENDING PAYMENTS FIRST.", "error"); setSubmitError(""); setIsCreateModalOpen(true); }}
                                  className="group relative px-12 py-6 bg-gradient-to-r from-[#00ffff] via-[#8a2be2] to-[#ff007f] text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-sm transition-all shadow-[0_0_40px_rgba(0,255,255,0.25)] hover:shadow-[0_0_60px_rgba(255,0,127,0.4)] hover:scale-105 active:scale-95 flex items-center gap-4"
                               >
                                  <PlusCircle className="w-6 h-6 relative z-10 text-[#00ffff] group-hover:text-white transition-colors" />
                                  <span className="relative z-10 group-hover:text-black transition-colors font-black">CREATE YOUR OFFER</span>
                               </motion.button>
                               <div className="flex items-center gap-3">
                                  <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#00ffff]/60" />
                                  <div className="flex gap-2">
                                     <span className="h-2 w-2 rounded-full bg-[#00ffff] shadow-[0_0_10px_#00ffff]" />
                                     <span className="h-2 w-2 rounded-full bg-[#ff007f] shadow-[0_0_10px_#ff007f]" />
                                  </div>
                                   <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#ff007f]/60" />
                                </div>
                                 <button
                                    type="button"
                                    onClick={() => {
                                       if (isSuspended) return addToast("ACCOUNT SUSPENDED. CONTACT SUPPORT.", "error");
                                       if (hasPendingPayments) return addToast("CLEAR YOUR PENDING PAYMENTS FIRST.", "error");
                                       setIsBoostRequestModalOpen(true);
                                    }}
                                    className="group relative px-10 py-5 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 text-amber-400 rounded-[2rem] font-black uppercase tracking-[0.25em] text-xs transition-all shadow-[0_0_30px_rgba(251,191,36,0.15)] hover:shadow-[0_0_50px_rgba(251,191,36,0.3)] hover:scale-105 active:scale-95 flex items-center gap-4 border border-amber-500/30 hover:border-amber-500/50"
                                 >
                                    <Compass className="w-5 h-5 shrink-0 relative z-10 text-amber-400/70 group-hover:text-amber-300 transition-colors" />
                                    <span className="relative z-10 group-hover:text-white transition-colors">Feeling lost? Request a Boost</span>
                                 </button>
                             </div>
                            </motion.div>
                        </div>
                        {/* SEO paragraph — visible, keyword-rich */}
                        <div className="relative z-10 px-4 py-4 max-w-2xl mx-auto text-center pointer-events-auto">
                          <p className={`text-[9px] font-bold uppercase tracking-[0.18em] leading-relaxed ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`}>
                            WoWLFG — World of Warcraft Looking for Group. Browse Mythic+ offers, post boost requests, check Raider.io scores, and find your next dungeon group on UPLINK. Free for all players.
                          </p>
                        </div>
                     </section>
                     {/* Main feed — full width on mobile; desktop uses slight scale for density */}
                    <div className="px-2 sm:px-[5%] xl:px-12 py-4 -mt-8 sm:-mt-16 relative z-20">
                    <div className="w-full mx-auto origin-top scale-100 md:scale-[0.85] lg:scale-[0.7]">
                          <div className="max-w-[1650px] mx-auto flex flex-col lg:flex-row gap-6 pb-16 items-start">
                        {/* LEFT COLUMN: tabs + content */}
                           <div className="flex flex-col gap-2 min-w-0 flex-1">
<div className="flex flex-col gap-1.5">
                             <div className="flex justify-end gap-1.5">
                             <button
                               type="button"
                               onClick={(e) => {
                                  e.stopPropagation();
                                  const next = !offerSoundsEnabled;
                                  setOfferSoundsEnabled(next);
                                  localStorage.setItem("uplink_offer_sounds", next.toString());
                                  addToast(next ? "New offer alert sounds on." : "New offer alert sounds muted.", "info");
                               }}
                               className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[7px] font-black uppercase tracking-[0.14em] transition-all backdrop-blur-md cursor-pointer ${
                                  offerSoundsEnabled
                                     ? theme === 'light'
                                        ? 'border-[#00ffff]/30 bg-[#00ffff]/10 text-[#00ffff] hover:bg-[#00ffff]/20'
                                        : 'border-[#00ffff]/25 bg-[#00ffff]/10 text-[#00ffff] hover:bg-[#00ffff]/15'
                                     : theme === 'light'
                                       ? 'border-gray-200 bg-white/80 text-gray-400 hover:text-gray-600'
                                       : 'border-white/10 bg-black/40 text-white/45 hover:text-white/70'
                              }`}
                              title={offerSoundsEnabled ? "Mute new offer alert sounds" : "Enable new offer alert sounds"}
                           >
                              {offerSoundsEnabled ? <Volume2 className="w-3 h-3 shrink-0" /> : <VolumeX className="w-3 h-3 shrink-0" />}
                              <span className="whitespace-nowrap">New Offer Alert Sounds</span>
                              <span className={`rounded px-1 py-px text-[6px] tracking-widest ${offerSoundsEnabled ? 'bg-[#00ffff]/20 text-[#00ffff]' : 'bg-white/5 text-white/35'}`}>
                                 {offerSoundsEnabled ? 'ON' : 'OFF'}
                              </span>
                           </button>
                           </div>
<div className={`flex p-1.5 rounded-2xl border backdrop-blur-xl shadow-2xl ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-black/40 border-white/5'}`}>
<button onClick={() => setActiveMainTab("boosts")} className={`flex-1 py-3 px-4 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] outline-none cursor-pointer text-center transition-all ${activeMainTab === "boosts" ? "bg-[#ff007f] shadow-[0_0_30px_rgba(255,0,127,0.4)] text-white" : `${theme === 'light' ? 'text-gray-500 hover:text-gray-800' : 'text-white hover:text-white/80'}`}`}>
⚡ Offers
</button>
                             {isPrimary && (
<motion.button onClick={() => setActiveMainTab("admin")} className={`flex-1 py-3 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${activeMainTab === "admin" ? "bg-red-600 text-white shadow-[0_0_30px_rgba(220,38,38,0.4)]" : "text-red-500/50 hover:text-red-500"}`}>
                                   <ShieldAlert className="w-4 h-4" /> Admin
                               </motion.button>
                            )}
                          </div>
</div>

                              <div className={`${activeMainTab !== "admin" ? 'w-full' : ''}`}>
                           {activeMainTab === "boosts" && (
                              <div className="grid gap-2 overflow-visible mt-2">
                                 <div className="flex flex-col gap-4">
                                     {(() => {
                                        const activeLobbies = lobbies.filter((l) => isLobbyListedInPublicFeed(l));
                                        const sorted = [...activeLobbies].sort((a, b) => {
                                           const tierA = getUserTier(a.ownerId);
                                           const tierB = getUserTier(b.ownerId);
                                           if (tierA === "secret_club" && tierB !== "secret_club") return -1;
                                           if (tierA !== "secret_club" && tierB === "secret_club") return 1;
                                           return 0;
                                        });
                                        return sorted.map(lobby => (
                                           <div key={lobby.id} className="relative overflow-visible offer-card">
                                   <div className={`relative w-full rounded-[2.5rem] shadow-2xl group border overflow-visible ${expandedLobbyId === lobby.id ? (lobby.category === 'leveling' ? 'border-[#8a2be2]/50 shadow-[0_0_30px_rgba(138,43,226,0.15)]' : 'border-[#00ffff]/50 shadow-[0_0_30px_rgba(0,255,255,0.15)]') : 'border-white/10 hover:border-white/30'} bg-black/80`}>
                                           {/* FULL-WIDTH SEAMLESS DYNAMIC BACKGROUND */}
                                            {(() => {
                                                   const ownerUser = registeredUsers.find(u => u.id === lobby.ownerId);
                                                   const vfxOn = getVfxSettings(ownerUser).showOnBanner;
                                                   const activeVfx = ownerUser && getUserTier(lobby.ownerId) === "secret_club" && vfxOn ? ownerUser.activeVfx : null;
                                                   const bgUrl = (lobby.customBg || activeVfx)
                                                     ? resolveLobbyBannerBg(lobby, ownerUser, activeVfx)
                                                     : null;
                                                   return bgUrl ? (
                                                     <div className="absolute inset-0 z-0 overflow-hidden rounded-[2.5rem]">
                                                        <img src={bgUrl} className="w-full h-full object-cover" alt="" loading="lazy" decoding="async" />
                                                        <div className="absolute inset-0 bg-black/20"></div>
                                                     </div>
                                                   ) : (
                                                      <div className="absolute inset-0 z-0 bg-black/90 rounded-[2.5rem]"></div>
                                                   );
                                                })()}

                                           {/* CONTENT LAYER */}
                                                                                      <div className="relative z-10 flex flex-col xl:flex-row items-stretch w-full min-h-[132px] cursor-pointer" onClick={() => {
                                              setExpandedLobbyId(expandedLobbyId === lobby.id ? null : lobby.id);
                                           }}>
                                  {/* Secret Club bg button — pinned to header row, not full card */}
                                     {currentUserId === lobby.ownerId && getUserTier(currentUserId) === "secret_club" && (
                                        <div className="absolute z-50" style={{ left: '-2.5rem', top: '50%', transform: 'translateY(-50%)' }}>
                                           <button onClick={(e) => { e.stopPropagation(); setShowingBgPicker(showingBgPicker === lobby.id ? null : lobby.id); }} className="w-10 py-10 rounded-2xl bg-yellow-500/10 border-2 border-yellow-500/30 text-yellow-500 flex flex-col items-center justify-center gap-1 text-[9px] font-black uppercase tracking-widest hover:bg-yellow-500 hover:text-black hover:border-yellow-500 transition-all duration-300 shadow-[0_0_15px_rgba(255,215,0,0.1)] hover:shadow-[0_0_30px_rgba(255,215,0,0.3)] backdrop-blur-md group cursor-pointer" title="Choose background">
                                              <Target className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform drop-shadow-[0_0_6px_rgba(255,215,0,0.4)]" />
                                              <span>BG</span>
                                           </button>
                                         {showingBgPicker === lobby.id && (() => {
                                            const userImages = registeredUsers.find((u: any) => u.id === currentUserId)?.userVfx || [];
                                            return (
                                            <div className="absolute top-1/2 -translate-y-1/2 w-56 bg-[#0a0a16]/95 border border-yellow-500/40 rounded-2xl p-4 shadow-[0_0_30px_rgba(255,215,0,0.15)] z-40 max-h-80 overflow-y-auto backdrop-blur-xl" style={{ left: '-15.5rem' }} onClick={(e) => e.stopPropagation()}>
                                               <p className="text-[9px] font-black text-yellow-500 uppercase tracking-widest mb-3 flex items-center gap-2"><span>🎨</span> Lobby Backgrounds</p>
                                               {userImages.length === 0 && <p className="text-[10px] text-gray-600 p-4 text-center">No backgrounds yet.<br/>Add them in Lobby Store.</p>}
                                               {userImages.map((entry: any, i: number) => {
                                                  const src = resolveVfxSrc(entry);
                                                  const poster = resolveVfxBannerUrl(entry);
                                                  return (
                                                  <div key={i} onClick={() => { const updated = lobbies.map(l => l.id === lobby.id ? { ...l, customBg: src, customBgPoster: poster !== src ? poster : undefined } : l); setLobbies(updated); saveGlobalData({ lobbies: updated }); setShowingBgPicker(null); addToast("Background updated!", "success"); }} className={`cursor-pointer rounded-xl overflow-hidden mb-2 border-2 transition-all duration-200 ${lobby.customBg === src ? 'border-yellow-500 shadow-[0_0_10px_rgba(255,215,0,0.3)]' : 'border-transparent hover:border-white/20'}`}>
                                                     <img src={poster} className="w-full h-20 object-cover" alt="" />
                                                  </div>
                                                  );
                                               })}
                                               <button onClick={() => setShowingBgPicker(null)} className="w-full mt-2 py-2 bg-red-900/30 text-red-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">✕ Cancel</button>
                                            </div>
                                            );
                                         })()}
                                       </div>
                                    )}
   <div className="flex-shrink-0 pl-4 p-1.5 flex flex-col items-center justify-center gap-1">
                                                     <div className="cursor-pointer" onClick={() => {
                                                        const ownerUser = registeredUsers.find((u: any) => String(u.id) === String(lobby.ownerId));
                                                        if (ownerUser) openPlayerProfile(ownerUser.id);
                                                     }}>
                                                        <OfferFeedAvatar src={lobby.ownerImage} effect={lobby.ownerEffect} className="w-20 h-20" userId={lobby.ownerId} />
                                                     </div>
                                                     {(() => {
                                                        const ownerUser = registeredUsers.find((u: any) => String(u.id) === String(lobby.ownerId));
                                                        return ownerUser ? <RankBadge stats={ownerUser.stats} ratings={ownerUser.ratings} compact /> : null;
                                                     })()}
                                              </div>
                                               <div className="p-1.5 flex items-center justify-start">
                                                 <div className="flex flex-col items-center gap-1">
                                                    <span
                                                       className="flex items-center gap-1.5 text-yellow-500 font-black text-3xl leading-none cursor-default offer-gold-pulse"
                                                       style={{ ["--offer-glow-secondary" as string]: lobby.category === "leveling" ? "#8a2be2" : "#00ffff" }}
                                                    >
                                                        {lobby.totalGold}K
                                                        <Coins className="w-7 h-7" />
                                                    </span>
                                                     {lobby.category !== 'leveling' && (
                                                      <span className="text-base font-black uppercase text-white tracking-wider leading-none mt-0.5 px-2 py-0.5 rounded-lg bg-white/10 border border-white/20">
                                                         {(lobby.totalGold / (lobby.runsCount || 1)).toFixed(0)}K <span className="text-[#00ffff]">PER RUN</span>
                                                     </span>
                                                     )}
                                                 </div>
                                              </div>
                                                  <div className="w-1/4 shrink-0 p-1.5 flex flex-col justify-center min-w-0">
                                                      <h3 className={`text-3xl font-black uppercase tracking-tighter leading-none truncate flex items-center gap-2 ${lobby.category === 'leveling' ? 'text-[#00ffff]' : 'text-[#00ffff]'}`}>{lobby.category === 'leveling' ? `Leveling ${lobby.startLevel || "1"}-${lobby.endLevel || "80"}` : (() => { const totalRuns = (Object.values(lobby.selectedDungeons || {}) as number[]).reduce((a: number, b: number) => a + b, 0) || lobby.runsCount || 1; return `${totalRuns}x ${lobby.keyLevel || '+10'}`; })()}<span className="flex items-center gap-1"><img src={lobby.serverRegion === 'US' ? '/flags/us.svg' : '/flags/eu.svg'} alt="" className="w-4 h-4 rounded-sm object-cover inline-block" /><span className="text-[9px] font-black uppercase tracking-wider text-white/60">{lobby.serverRegion || 'EU'}</span></span></h3>
                                                  </div>

                                              {/* PARTY CARDS */}
                                               <div className="flex-1 flex items-center justify-start p-1.5">
                                                 <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                                   {(() => {
                                                      return getOccupantsBySlot(lobby).map(({ slot, occupant }, idx) => {
                                                         const roleType = slot.startsWith('dps') ? 'dps' : slot;
                                                           const visual = occupant ? resolveMemberVisual(occupant) : null;
                                                            const occupantUser = occupant ? registeredUsers.find((u: any) => String(u.id) === String(occupant.applicantId || occupant.userId)) : null;
                                                            const userForPreview = occupantUser ? { ...occupantUser, tierLabel: getUserTierLabel(occupantUser.id) } : null;
                                                            return <InteractivePartyCard key={idx} role={roleType} accepted={occupant} visual={visual} rankStats={occupantUser?.stats} rankRatings={occupantUser?.ratings} AvatarComponent={OfferFeedAvatar} hideIdentity={occupant ? isUserHidden(occupant.applicantId || occupant.userId) : false} onAvatarClick={(u) => openPlayerProfile(u)} userData={userForPreview} />;
                                                       });
                                                    })()}
                                                </div>
                                             </div>

                                              {/* ACTION BUTTONS */}
<div className="flex-1 flex justify-end items-stretch py-2 min-w-0 px-4" onClick={e => e.stopPropagation()}>
                                               <div className="flex flex-col gap-1 justify-center min-w-[90px]">
                                              {(currentUserId === lobby.ownerId || isAdmin) ? (
                                                 <div className="flex flex-col gap-2 w-full">
<motion.button onClick={() => { setTargetLobby(lobby); setIsManageModalOpen(true); }} className={`w-full py-2 text-[9px] font-black uppercase tracking-widest rounded-2xl transition-all text-center flex justify-center gap-2 items-center ${lobby.category === 'leveling' ? 'bg-[#8a2be2]/10 border border-[#8a2be2]/30 text-[#8a2be2] hover:bg-[#8a2be2] hover:text-white shadow-[0_0_15px_rgba(138,43,226,0.1)]' : 'bg-[#00ffff]/10 border border-[#00ffff]/30 text-[#00ffff] hover:bg-[#00ffff] hover:text-black shadow-[0_0_15px_rgba(0,255,255,0.1)]'}`}><Crosshair className="w-3.5 h-3.5" /> Manage</motion.button>
                                                      {canOwnerCancelLobby(lobby) && (
                                                         <motion.button onClick={() => deleteLobby(lobby.id)} className="w-full py-2 bg-red-900/20 border border-red-500/30 text-red-500 text-[9px] font-black uppercase tracking-widest rounded-2xl hover:bg-red-600 hover:text-white transition-all text-center flex justify-center gap-2 items-center"><X className="w-3.5 h-3.5" /> Cancel</motion.button>
                                                      )}
                                                   </div>
                                                 ) : lobby.accepted?.some((a: any) => a.applicantId === currentUserId) ? (
                                                   <motion.button onClick={() => { setTargetLobby(lobby); setIsManageModalOpen(true); }} className="w-full py-2 bg-[#8a2be2]/10 border border-[#8a2be2]/30 text-[#8a2be2] text-[9px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#8a2be2] hover:text-white transition-all shadow-[0_0_15px_rgba(138,43,226,0.1)] text-center flex justify-center gap-2 items-center"><Radio className="w-3.5 h-3.5" /> Channel</motion.button>
                                               ) : lobby.applicants?.some((a: any) => a.applicantId === currentUserId) ? (
                                                  <div className="flex flex-col gap-2 w-full" onClick={e => e.stopPropagation()}>
<motion.button
                                                         onClick={() => handleCancelApply(lobby.id)}
                                                         className="w-full py-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-[9px] font-black uppercase tracking-widest rounded-2xl hover:bg-yellow-500 hover:text-black transition-all text-center flex justify-center gap-2 items-center"
                                                      >
                                                         <X className="w-3.5 h-3.5" /> CANCEL
                                                     </motion.button>
                                                  </div>
                                                 ) : session ? (
                                                   <div className="flex flex-col gap-2 w-full relative" onClick={e => e.stopPropagation()}>
<motion.button
                                                             onClick={() => { if (isUserEligibleForLobby(lobby)) { setTargetLobby(lobby); setIsApplyModalOpen(true); setIsAutoApplySettingsOpen(true); } }}
                                                             onMouseEnter={() => !isUserEligibleForLobby(lobby) && setHoveredLockedId(lobby.id)}
                                                             onMouseLeave={() => setHoveredLockedId(null)}
                                                             className={`w-full py-2 bg-[#ff007f]/10 border border-[#ff007f]/30 text-[#ff007f] text-[9px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#ff007f] hover:text-white transition-all shadow-[0_0_15px_rgba(255,0,127,0.1)] text-center flex justify-center gap-2 items-center overflow-hidden relative ${!isUserEligibleForLobby(lobby) ? 'opacity-30 grayscale cursor-not-allowed' : ''}`}
                                                         >
                                                            <div className="absolute inset-0 bg-white/10 translate-y-full hover:translate-y-0 transition-transform duration-300"></div>
                                                            <Zap className={`w-4 h-4 relative z-10 ${isUserEligibleForLobby(lobby) ? 'animate-pulse' : ''}`} />
                                                            <span className="relative z-10">{isUserEligibleForLobby(lobby) ? 'APPLY' : 'LOCKED'}</span>
                                                         </motion.button>

                                                        {hoveredLockedId === lobby.id && !isUserEligibleForLobby(lobby) && (
                                                            <div className="absolute left-1/2 z-[9999] pointer-events-none w-max max-w-[min(420px,calc(100vw-2rem))]" style={{ top: 'calc(100% + 10px)', transform: 'translateX(-50%)' }}>
                                                                 <div className="bg-[#0a0a16]/98 text-white text-sm font-bold px-6 py-5 border-2 border-[#ff007f]/60 relative rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_30px_rgba(255,0,127,0.25)] backdrop-blur-xl text-left whitespace-normal">
                                                                 <div className="flex items-center gap-3 mb-3 pb-3 border-b border-[#ff007f]/20">
                                                                    <span className="text-lg leading-none">⛔</span>
                                                                    <span className="text-[13px] text-[#ff007f] font-black uppercase tracking-[0.14em]">Access Denied</span>
                                                                 </div>
                                                                 <div className="flex flex-col gap-2.5 text-[13px] leading-relaxed text-white/90">
                                                                   {(() => {
                                                                      const reason = getEligibilityReason(lobby);
                                                                      if (reason === "ALREADY IN THIS SQUAD") return <p className="text-white/80">You are already in this squad.</p>;
                                                                      if (reason === "ALREADY APPLIED") return <p className="text-white/80">You already applied to this offer.</p>;
                                                                      if (reason === "NO CHARACTERS SYNCED") return <p className="text-white/80">No characters detected. Sync your character via Raider.io first in the Armory.</p>;
                                                                      if (reason === "NO QUALIFIED CHARACTER") return <p className="text-white/80">None of your characters meet the requirements for this operation.</p>;
                                                                        return reason.split(" | ").map((r, i) => {
                                                                           const cleaned = r
                                                                             .replace(/^(\w+) ILVL (\d+) < (\d+)$/, '🔸 $1 — Your item level: $2 | Required: $3')
                                                                             .replace(/^(\w+) IO (\d+) < (\d+)$/, '🔸 $1 — Your Raider IO: $2 | Required: $3')
                                                                             .replace(/^(\w+) SLOTS FULL$/i, '🔸 $1 — No open slots available')
                                                                             .replace(/^(\w+) (\w+) BLOCKED$/i, '🔸 $1 $2 is blacklisted for this role')
                                                                             .replace(/^(\w+) CHARACTER MISSING$/i, '🔸 You have no characters on $1');
                                                                           return <p key={i} className="text-white/90">{cleaned}</p>;
                                                                      });
                                                                   })()}
                                                                </div>
                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-[8px] border-transparent border-b-[#0a0a16]" />
                                                             </div>
                                                        </div>
                                                    )}
                                                  </div>
                                              ) : (
                                                <div className="flex flex-col gap-2 w-full relative" onClick={e => e.stopPropagation()}>
                                                  <motion.button
                                                    onClick={() => signIn("discord")}
                                                    className="w-full py-2 bg-[#ff007f]/10 border border-[#ff007f]/30 text-[#ff007f] text-[9px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#ff007f] hover:text-white transition-all shadow-[0_0_15px_rgba(255,0,127,0.1)] text-center flex justify-center gap-2 items-center overflow-hidden relative"
                                                  >
                                                    <div className="absolute inset-0 bg-white/10 translate-y-full hover:translate-y-0 transition-transform duration-300"></div>
                                                    <span className="relative z-10">SIGN IN TO APPLY</span>
                                                  </motion.button>
                                                </div>
                                              )}
                                           </div>
                                           </div>
                                       </div>

                                        {/* EXPANDED DETAILS — instant toggle, no height animation */}
                                        {expandedLobbyId === lobby.id && (
                                            <div className="relative z-10 border-t border-white/10 bg-black/85 overflow-hidden cursor-default rounded-b-[2.5rem]">
<div className="p-6 pb-5 space-y-5">
                                                     {lobby.category === 'leveling' ? (
                                                       <>
                                                       <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                          <div className="flex items-center gap-3 p-3">
                                                             <ShieldCheck className="w-6 h-6 text-[#8a2be2]" />
                                                             <div>
                                                                <div className="text-[8px] font-black text-[#8a2be2] uppercase tracking-[0.2em]">Level Range</div>
                                                                <div className="text-xl font-black text-white">{lobby.startLevel || "1"} → {lobby.endLevel || "80"}</div>
                                                             </div>
                                                          </div>
                                                          <div className="flex items-center gap-3 p-3">
                                                             <Users className="w-6 h-6 text-[#00ffff]" />
                                                             <div>
                                                                 <div className="text-[8px] font-black text-[#00ffff] uppercase tracking-[0.2em]">Roles</div>
                                                                 <div className={`text-base font-black ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{Object.entries(lobby.roles || {}).filter(([, count]) => (count as number) > 0).map(([role, count]) => `${count as number} ${role === 'dps' ? 'DPS' : role === 'tank' ? 'Tank' : 'Heal'}`).join(" + ") || "Any"}</div>
                                                             </div>
                                                          </div>
                                                          <div className="flex items-center gap-3 p-3">
                                                             <Coins className="w-6 h-6 text-yellow-500" />
                                                             <div>
                                                                <div className="text-[8px] font-black text-yellow-500 uppercase tracking-[0.2em]">Total Gold</div>
                                                                <div className="text-xl font-black text-white">{lobby.totalGold}K</div>
                                                             </div>
                                                          </div>
                                                       </div>
                                                      {lobby.notes && (
                                                         <div>
                                                            <div className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Notes</div>
                                                            <p className="text-sm text-gray-300 font-bold leading-relaxed">{lobby.notes}</p>
                                                         </div>
                                                      )}
                                                      </>
                                                     ) : (
                                                       <>
<div className="flex flex-nowrap gap-3 w-full items-start">
                                                           <div className="flex-1 flex items-center gap-3 p-3">
                                                              <ShieldCheck className="w-6 h-6 text-[#00ffff]" />
                                                              <div>
                                                                 <div className="text-[8px] font-black text-[#00ffff] uppercase tracking-[0.2em]">Min iLvl</div>
                                                                 <div className="text-xl font-black text-white">{lobby.minIlvl}+</div>
                                                              </div>
                                                           </div>
                                                           <div className="flex-1 flex items-center gap-3 p-3">
                                                              <Trophy className="w-6 h-6 text-[#8a2be2]" />
                                                              <div>
                                                                 <div className="text-[8px] font-black text-[#8a2be2] uppercase tracking-[0.2em]">Min Score</div>
                                                                 <div className="text-xl font-black text-white">{lobby.minScore}</div>
                                                              </div>
                                                           </div>
                                                            <div className="flex-1 flex items-center gap-3 p-3">
                                                               <Users className="w-6 h-6 text-[#8a2be2]" />
                                                               <div>
                                                                  <div className="text-[8px] font-black text-[#8a2be2] uppercase tracking-[0.2em]">Active Squad</div>
                                                                  <div className="text-xl font-black text-white">{lobby.accepted?.length || 0} / {Object.values(lobby.roles || {}).reduce((a, b) => (a as number) + (b as number), 0)}</div>
                                                               </div>
                                                            </div>
                                                             <div className="flex-1 flex flex-col gap-2 p-3">
                                                                <div className="flex items-center gap-3">
                                                                   <Key className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                                                                   <div>
                                                                      <div className="text-[8px] font-black text-yellow-500 uppercase tracking-[0.2em]">Keys Needed</div>
                                                                      <div className="text-xl font-black text-white">{lobby.selectedDungeons ? Object.keys(lobby.selectedDungeons).length : 0}</div>
                                                                   </div>
                                                                </div>
                                                               {lobby.selectedDungeons && Object.keys(lobby.selectedDungeons).length > 0 && (
                                                                  <div className="space-y-1.5 mt-2 max-h-[120px] overflow-y-auto custom-scrollbar pr-1">
                                                                     {Object.entries(lobby.selectedDungeons).map(([name, count]) => {
                                                                        const dungeonInfo = DUNGEONS.find(d => d.name === name);
                                                                        const keyFound = (lobby.accepted || []).some((a: any) => a.keystone && (a.keystone === name || a.keystone === DUNGEON_SHORT_MAP[name]?.short));
                                                                        return (
                                                                           <div key={name} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border text-xs ${keyFound ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-white/5 bg-white/[0.02]'}`}>
                                                                              <img src={dungeonInfo?.img} alt={name} className="w-5 h-5 rounded object-cover border border-white/10 flex-shrink-0" />
                                                                              <span className="text-[9px] font-black truncate flex-1 text-white">{name}</span>
                                                                              <span className="text-[9px] font-black text-[#00ffff] flex-shrink-0">{count as number}x</span>
                                                                           </div>
                                                                        );
                                                                     })}
                                                                  </div>
                                                               )}
                                                            </div>
                                                        </div>
<div className="w-full bg-black/40 p-5 rounded-[2rem] border border-white/5">
                                                          <div className="text-[8px] font-black text-green-400 uppercase tracking-[0.4em] mb-4 flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5" /> Classes Accepted</div>
                                                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                                                             {Object.entries(WOW_CLASS_GROUPS).map(([group, classes]) => (
                                                                <div key={group} className="min-w-0">
                                                                   <div className={`text-xs font-black uppercase tracking-[0.25em] mb-2.5 ${CLASS_GROUP_LABEL_STYLE[group] || "text-white"}`}>{group}</div>
                                                                   <div className="flex flex-wrap gap-2.5">
                                                                       {classes.map((cls: string) => {
                                                                          const blockedRolesForClass = (lobby.blockedRoles || []).filter((b: any) => b.class === cls);
                                                                          const allRoles = CLASS_ROLE_OPTIONS[cls] || ['dps'];
                                                                          const allBlocked = blockedRolesForClass.length === allRoles.length;
                                                                          const someBlocked = blockedRolesForClass.length > 0 && !allBlocked;
                                                                          return (
                                                                             <div key={cls} className={`flex flex-col items-center p-2.5 rounded-xl border transition-colors ${allBlocked ? 'bg-red-500/10 border-red-500/20 opacity-20 grayscale' : someBlocked ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-green-500/10 border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.1)]'}`}>
                                                                                <img src={classThumbUrl(cls)} width={96} height={96} className="w-11 h-11 object-contain drop-shadow-md" alt={cls} decoding="async" />
                                                                               {someBlocked && <span className="text-[7px] text-yellow-500 font-black mt-1">{blockedRolesForClass.map((b: any) => b.role.substring(0, 1).toUpperCase()).join('')}</span>}
                                                                            </div>
                                                                         );
                                                                      })}
                                                                  </div>
                                                               </div>
                                                            ))}
                                                         </div>
                                                      </div>

                                                    {/* CURRENT ROSTER (DETAILED) - Shows ALL accepted players */}
<div className="pt-5 mt-1 border-t border-white/5 rounded-b-[2rem]">
                                                        <div className="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em] mb-4 text-center">Unit Composition (Accepted Operatives)</div>
                                                       <div className="flex justify-center gap-3 flex-wrap pb-1">
                                                           {(() => {
                                                               return getOccupantsBySlot(lobby).map(({ slot, occupant }, idx) => {
                                                                 const roleType = slot.startsWith('dps') ? 'dps' : slot;
                                                                   const visual = occupant ? resolveMemberVisual(occupant) : null;
                                                                    const occupantUser = occupant ? registeredUsers.find((u: any) => String(u.id) === String(occupant.applicantId || occupant.userId)) : null;
                                                                    const userForPreview2 = occupantUser ? { ...occupantUser, tierLabel: getUserTierLabel(occupantUser.id) } : null;
                                                                    return (
                                                                       <div key={idx} className="flex flex-col items-center gap-4">
                                                                          <InteractivePartyCard role={roleType} accepted={occupant} visual={visual} rankStats={occupantUser?.stats} rankRatings={occupantUser?.ratings} AvatarComponent={OfferFeedAvatar} hideIdentity={occupant ? isUserHidden(occupant.applicantId || occupant.userId) : false} onAvatarClick={(u) => openPlayerProfile(u)} userData={userForPreview2} />
                                                                         {occupant && (
                                                                           <div className="flex flex-col items-center">
                                                                              <span className="text-[10px] font-black text-white uppercase">{occupant.applicantName || occupant.name}</span>
                                                                              <span className="text-[8px] font-bold text-[#00ffff] opacity-60">IO: {occupant.score}</span>
                                                                              <span className="text-[8px] font-bold text-[#ff007f] opacity-60">{(occupant.class || '').toUpperCase()} • {(occupant.role || '').toUpperCase()}</span>
                                                                         </div>
                        )}

                                                                     </div>
                                                                 );
                                                             });
                                                          })()}
                                                       </div>
                                                       </div>
                                                       </>
                                                      )}
                                                    </div>
                                            </div>
                                        )}
                                     </div>
                                      </div>)); })()}
                                 </div>
                              </div>
                        )}


                          {activeMainTab === "admin" && isAdmin && (
                             <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                                <div className="flex flex-wrap gap-2 p-2 bg-black/30 rounded-2xl border border-white/5">
                                    {[
                                       { id: "admin-users", label: "Users" },
                                       { id: "admin-analytics", label: "Analytics" },
                                       { id: "admin-audit", label: "Audit Log" },
                                       { id: "admin-ip", label: "IP Bans" },
                                    ].map((tab) => (
                                      <a
                                         key={tab.id}
                                         href={`#${tab.id}`}
                                         className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/10 text-gray-400 hover:text-white hover:border-violet-500/40 transition-all"
                                      >
                                         {tab.label}
                                      </a>
                                   ))}
                                </div>
                                <div id="admin-users" className="p-8 bg-red-900/10 border border-red-900/30 rounded-[3rem] backdrop-blur-xl relative overflow-hidden scroll-mt-24">
                                    <motion.button onClick={async () => {
                                       if (confirm("CRITICAL ACTION: Wipe all members and token data? Characters linked via Raider.io will be preserved.")) {
                                          const preservedChars = globalCharacters.filter(c => c.userId === currentUserId);
                                          setRegisteredUsers([]);
                                          setApplications([]);
                                          setGlobalCharacters(preservedChars);
                                          await saveGlobalData({ registeredUsers: [], characters: preservedChars, applications: [] });
                                          addToast("DATABASE CLEARED. Your characters preserved.", "info");
                                       }
                                    }} className="absolute top-8 right-8 px-4 py-2 bg-red-600/20 border border-red-600/40 text-red-500 font-black uppercase text-[8px] tracking-widest rounded-lg hover:bg-red-600 hover:text-white transition-all z-20">
                                       Clear Database
                                    </motion.button>
                                   <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4 flex items-center gap-4">
                                      <ShieldAlert className="text-red-500 w-10 h-10" /> Global User Registry
                                   </h2>
                                   {/* SEARCH BAR */}
                                   <div className="mb-6">
                                      <input
                                         type="text"
                                         placeholder="Search by name or username..."
                                         value={adminSearchQuery}
                                         onChange={(e) => setAdminSearchQuery(e.target.value)}
                                         className="w-full bg-black/40 border border-white/10 rounded-xl px-6 py-4 text-white outline-none focus:border-[#00ffff]/50 transition-all font-bold text-sm"
                                      />
                                   </div>
                                   <div className="grid gap-4">
                                      {globalData.registeredUsers?.filter((user: any) => {
                                         if (!adminSearchQuery) return true;
                                         const q = adminSearchQuery.toLowerCase();
                                         return (user.name || '').toLowerCase().includes(q) || (user.username || '').toLowerCase().includes(q);
                                      }).map((user: any) => {
                                         const rawIp =
                                            user.lastKnownIp ||
                                            adminIpLookup[String(user.id)] ||
                                            adminIpLookup[user.username];
                                         const ipInfo = formatIpForAdmin(rawIp);
                                         return (
                                         <div key={user.id} className="flex items-center justify-between p-6 bg-black/40 rounded-2xl border border-white/5 hover:border-red-500/30 transition-all group">
                                            <div className="flex items-center gap-6">
                                                <AvatarWithEffect src={user.avatar} effect="none" className="w-16 h-16" />
                                               <div>
                                                   <h4 className="text-xl font-black text-white uppercase">{user.name}</h4>
                                                   <p className="text-[9px] font-mono mt-1">
                                                      <span className="text-gray-500">@{user.username || "—"}</span>
                                                   </p>
                                                   <p className={`text-[10px] font-mono mt-1 ${ipInfo.isLocal ? "text-gray-500" : "text-orange-300"}`}>
                                                      <span className="text-gray-600 uppercase text-[8px] font-black tracking-widest mr-1">IP</span>
                                                      <span className="font-black">{ipInfo.text}</span>
                                                   </p>
                                                </div>
                                            </div>
                                                <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2 text-xs">
                                                   {(() => {
                                                      const tier = getUserTier(user.id);
                                                       if (tier === "secret_club") return <span className="px-2 py-0.5 rounded-full text-yellow-400 border border-yellow-500/50 bg-yellow-500/20 font-black text-[8px] uppercase tracking-widest">CLUB</span>;
                                                           // Epic tier removed - fall through to FREE
                                                      return <span className="px-2 py-0.5 rounded-full text-gray-500 border border-white/10 bg-white/5 font-black text-[8px] uppercase tracking-widest">FREE</span>;
                                                   })()}
                                                </div>
                                                <div className="hidden group-hover:flex items-center gap-2">
                                                   {!(user.username === "minhonovazen" || user.id === "1497295886223544471") && (
                                                      <>
                                                         <button onClick={() => handleClearUserDatabase(user.id, user.username)} className="px-4 py-2 bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 hover:bg-yellow-500 hover:text-black rounded-lg text-xs font-black uppercase tracking-widest transition-all">Clear DB</button>
                                                         <button onClick={() => handleBanUser(user.username)} className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white rounded-lg text-xs font-black uppercase tracking-widest transition-all">Suspend</button>
                                                         {rawIp && (
                                                            <button onClick={() => handleBanUserIp({ ...user, lastKnownIp: rawIp })} className="px-4 py-2 bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500 hover:text-black rounded-lg text-xs font-black uppercase tracking-widest transition-all">Ban IP</button>
                                                         )}
                                                          {getUserTier(user.id) === "free" ? (
                                                             <div className="flex items-center gap-1">
                                                                {[1, 2, 3].map((m) => (
                                                                   <button key={m} onClick={() => handleRenewSubscription(user.id, m)} className="px-3 py-2 bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 hover:bg-yellow-500 hover:text-black rounded-lg text-[8px] font-black uppercase tracking-widest transition-all">{m}M</button>
                                                                ))}
                                                             </div>
                                                          ) : (
                                                            <div className="flex items-center gap-1">
                                                               {[1, 2, 3].map((m) => (
                                                                  <button key={m} onClick={() => handleRenewSubscription(user.id, m)} className="px-3 py-2 bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 hover:bg-yellow-500 hover:text-black rounded-lg text-[8px] font-black uppercase tracking-widest transition-all">+{m}M</button>
                                                               ))}
                                                            <button onClick={() => { const updated = registeredUsers.map((u: any) => u.id === user.id ? revokeSecretClubPerks({ ...u, subscription: { ...u.subscription, tier: "free", endDate: 0 } }) : u); setRegisteredUsers(updated); saveGlobalData({ registeredUsers: updated }); addToast(`${user.name} subscription removed.`, "info"); }} className="px-4 py-2 bg-gray-500/10 text-gray-400 border border-gray-500/30 hover:bg-gray-500 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">Remove</button>
                                                            </div>
                                                         )}
                                                      </>
                                                   )}
                                                </div>
                                             </div>
                                         </div>
                                      );})}
                                   </div>

                                   <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-8 mt-12 flex items-center gap-4">
                                      <ShieldAlert className="text-gray-500 w-10 h-10" /> Suspended Operatives
                                   </h2>
                                   <div className="grid gap-4">
                                      {bannedUsers.length === 0 ? (
                                         <p className="text-gray-600 text-sm italic p-8 bg-black/20 rounded-2xl border border-dashed border-white/5 text-center">No operatives currently suspended.</p>
                                      ) : (
                                         bannedUsers.map(username => (
                                            <div key={username} className="flex items-center justify-between p-6 bg-black/40 rounded-2xl border border-white/5 hover:border-[#00ffff]/30 transition-all group">
                                               <div className="flex items-center gap-6">
                                                  <div className="w-16 h-16 bg-red-900/20 rounded-2xl border border-red-500/30 flex items-center justify-center">
                                                     <ShieldX className="text-red-500 w-8 h-8" />
                                                  </div>
                                                  <div>
                                                     <h4 className="text-xl font-black text-white uppercase">{username}</h4>
                                                     <p className="text-red-500/70 text-xs font-black tracking-widest uppercase">Suspended</p>
                                                  </div>
                                               </div>
                                               <button onClick={() => handleUnbanUser(username)} className="px-6 py-3 bg-[#00ffff]/10 text-[#00ffff] border border-[#00ffff]/30 hover:bg-[#00ffff] hover:text-black rounded-lg text-xs font-black uppercase tracking-widest transition-all">Remove Suspension</button>
                                            </div>
                                         ))
                                      )}
                                   </div>

                                    <AdminAnalyticsPanel />
                                    <AdminAuditPanel />
                                   <div id="admin-ip" className="scroll-mt-24">
                                      <AdminIpBanPanel />
                                   </div>
                                   <AdminModerationPanel />
                                </div>
                             </motion.div>
                          )}
                         </div>
                              </div>
                             {session && (
                                <OngoingMissionsPanel
                                   lobbies={lobbies}
                                   currentUserId={currentUserId}
                                   registeredUsers={registeredUsers}
                                   completedThreadsCount={completedThreadsLobbies.length}
                                   theme={theme}
                                   roleIconUrl={roleIconUrl}
                                   getVfxSettings={getVfxSettings}
                                   onOpenMission={openMissionThread}
                                   alignWithOfferBanners={activeMainTab === "boosts"}
                                   alignOfferIds={activeBoostLobbyIds}
                                />
                             )}
                     </div>
                     </div>
                     </div>
                  </main>

                {/* MODALS */}
               <AnimatePresence>
                   {false && isApplyModalOpen && targetLobby && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
                         <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-5xl max-h-[96vh] overflow-y-auto bg-[#0a0a16] border-2 border-[#00ffff]/40 rounded-[2rem] p-6 md:p-8 shadow-2xl relative">
                            {myVfxBg && <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none z-0" style={{ backgroundImage: `url(${myVfxBg})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.08 }} />}
                            <motion.button onClick={() => setIsApplyModalOpen(false)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="absolute top-6 right-6 p-3 bg-red-500/15 hover:bg-red-500/30 border border-red-500/30 rounded-full z-50 transition-all"><X className="text-red-400 w-4 h-4" /></motion.button>
                            
                            <h2 className="relative z-10 text-2xl md:text-3xl font-black uppercase tracking-widest flex items-center gap-4 mb-2 text-[#00ffff]">
                              Auto-Apply Control
                           </h2>
                           <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-8">Manual target: <span className="text-[#ff007f]">{targetLobby.title}</span></p>

                            {/* OPTIONAL KEYSTONE SECTION */}
                            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 mb-6">
                               <h3 className="text-[10px] font-black text-[#00ffff] mb-3 uppercase tracking-widest">Provide Keystone (Optional)</h3>
                               <div className="grid grid-cols-2 gap-3">
                                  <div>
                                     <select value={userKeystone.split(' ')[0] || ''} onChange={e => setUserKeystone(e.target.value + ' ' + (userKeystone.split(' ')[1] || '+10'))} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-black text-xs outline-none focus:border-[#00ffff]/50 transition-all">
                                        <option value="">Select dungeon</option>
                                        {DUNGEONS.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                                     </select>
                                  </div>
                                  <div>
                                     <select value={userKeystone.split(' ')[1] || '+10'} onChange={e => setUserKeystone((userKeystone.split(' ')[0] || '') + ' ' + e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-black text-xs outline-none focus:border-[#00ffff]/50 transition-all">
                                        {Array.from({ length: 30 }, (_, i) => `+${i + 2}`).map(l => <option key={l} value={l}>{l}</option>)}
                                     </select>
                                  </div>
                               </div>
                            </div>

                           {(() => {
                              const selectedManualChar = myCharacters.find(c => String(c.id) === String(selectedCharId));
                              const selectedBlocked = selectedManualChar ? (
                                 !selectedManualChar.role ||
                                 !targetLobby.roles?.[selectedManualChar.role] ||
                                 (selectedManualChar.ilvl || 0) < (targetLobby.minIlvl || 0) ||
                                 Number(selectedManualChar.score || 0) < (targetLobby.minScore || 0)
                              ) : true;
                              const switchManualCharRole = (char: any) => {
                                 const roles = CLASS_ROLE_OPTIONS[char.class] || ['dps'];
                                 const idx = roles.indexOf(char.role);
                                 const newRole = roles[(idx + 1) % roles.length];
                                 const updated = myCharacters.map(c => c.id === char.id ? { ...c, role: newRole } : c);
                                 setMyCharacters(updated);
                                 const updatedGlobal = globalCharacters.map(c => c.id === char.id ? { ...c, role: newRole } : c);
                                 setGlobalCharacters(updatedGlobal);
                                 saveGlobalData({ characters: updatedGlobal });
                              };
                              const tier = getUserTier(currentUserId);
                               const canUseAutoApply = tier === "secret_club";
                              const canUseSecret = tier === "secret_club";

                              return (
                                 <div className="space-y-4">
                                    <div>
                                       <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block">Select Character (click role icon to switch)</label>
                                       {myCharacters.length === 0 ? (
                                          <div className="p-4 bg-white/5 rounded-xl text-center">
                                             <p className="text-[10px] font-black text-gray-500 uppercase">No characters linked. Sync via Raider.io first.</p>
                                          </div>
                                       ) : (
                                          <div className="relative">
                                             <button type="button" onClick={() => { setShowKeyDropdown(false); setShowCharacterDropdown(!showCharacterDropdown); }} className={`w-full bg-black/50 border rounded-2xl px-4 py-3 text-white font-black text-sm outline-none transition-all flex items-center gap-3 ${selectedManualChar && !selectedBlocked ? 'border-[#00ffff]/40 hover:border-[#00ffff]/70' : 'border-white/10 hover:border-white/20'}`}>
                                                {selectedManualChar ? (
                                                   <>
                                                      <ClassRoleIcons className={selectedManualChar.class} role={selectedManualChar.role} size={48} overlap={14} />
                                                      <div className="flex-1 min-w-0 text-left">
                                                         <p className="truncate text-white">{selectedManualChar.name}</p>
                                                         <p className="mt-1 text-[8px] text-[#00ffff] uppercase tracking-widest">{selectedManualChar.region}-{selectedManualChar.realm}</p>
                                                      </div>
                                                      <div className="hidden sm:flex items-center gap-4 text-center">
                                                         <div>
                                                            <p className="text-[7px] text-gray-500 uppercase font-black">iLvl</p>
                                                            <p className="text-xs font-black text-white">{selectedManualChar.ilvl}</p>
                                                         </div>
                                                         <div>
                                                            <p className="text-[7px] text-gray-500 uppercase font-black">IO</p>
                                                            <p className="text-xs font-black text-[#8a2be2]">{selectedManualChar.roleScores?.[selectedManualChar.role] ?? selectedManualChar.score}</p>
                                                         </div>
                                                      </div>
                                                   </>
                                                ) : (
                                                   <>
                                                      <div className="w-12 h-12 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center"><Users className="w-5 h-5 text-gray-500" /></div>
                                                      <span className="flex-1 text-left text-gray-500 uppercase tracking-widest text-[10px]">Choose an operative</span>
                                                   </>
                                                )}
                                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showCharacterDropdown ? 'rotate-180' : ''}`} />
                                             </button>
                                             {showCharacterDropdown && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-[#0a0a16] border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl max-h-[340px] overflow-y-auto custom-scrollbar">
                                                   {myCharacters.map(char => {
                                                      const matchRole = char.role && targetLobby.roles?.[char.role] > 0;
                                                      const metIlvl = (char.ilvl || 0) >= (targetLobby.minIlvl || 0);
                                                      const metScore = Number(char.score || 0) >= (targetLobby.minScore || 0);
                                                      const blocked = !matchRole || !metIlvl || !metScore;
                                                      const isSelected = String(selectedCharId) === String(char.id);
                                                      return (
                                                         <div key={char.id} onClick={() => { if (!blocked) { setSelectedCharId(char.id); setShowCharacterDropdown(false); } }} className={`p-3 transition-all flex items-center justify-between ${blocked ? 'opacity-35 grayscale cursor-not-allowed' : 'cursor-pointer'} ${isSelected ? 'bg-[#00ffff]/10 text-[#00ffff]' : 'text-white hover:bg-white/5'}`}>
                                                            <div className="flex items-center gap-3 min-w-0">
                                                               <ClassRoleIcons className={char.class} role={char.role} size={48} overlap={14} onRoleClick={(e) => { e.stopPropagation(); switchManualCharRole(char); }} />
                                                               <div className="min-w-0">
                                                                  <p className="font-black text-sm leading-none truncate">{char.name || 'Unknown'}</p>
                                                                  <div className="mt-1 flex gap-1.5 flex-wrap">
                                                                     {!metIlvl && <span className="bg-red-500/20 text-red-500 text-[7px] px-1.5 py-0.5 rounded font-black uppercase">iLvl Low</span>}
                                                                     {!metScore && <span className="bg-red-500/20 text-red-500 text-[7px] px-1.5 py-0.5 rounded font-black uppercase">Score Low</span>}
                                                                     {!matchRole && <span className="bg-red-500/20 text-red-500 text-[7px] px-1.5 py-0.5 rounded font-black uppercase">Role Full</span>}
                                                                     {!blocked && <span className="bg-[#00ffff]/20 text-[#00ffff] text-[7px] px-1.5 py-0.5 rounded font-black uppercase">Qualified</span>}
                                                                  </div>
                                                               </div>
                                                            </div>
                                                            <div className="flex items-center gap-3 shrink-0">
                                                               <div className="text-center">
                                                                  <p className="text-[7px] text-gray-500 uppercase font-black">IO</p>
                                                                  <p className="text-xs font-black text-[#8a2be2]">{char.roleScores?.[char.role] ?? char.score}</p>
                                                               </div>
                                                               <div className={`w-3 h-3 rounded-full ${isSelected ? 'bg-[#00ffff] shadow-[0_0_10px_rgba(0,255,255,0.5)]' : 'bg-white/20'}`} />
                                                            </div>
                                                         </div>
                                                      );
                                                   })}
                                                </div>
                                             )}
                                          </div>
                                       )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                       <button type="button" onClick={() => {
                                          if (!canUseSecret) return addToast("Secret Club feature. Upgrade to unlock.", "error");
                                          const newVal = !hiddenIdentity;
                                          setHiddenIdentity(newVal);
                                          localStorage.setItem("uplink_hidden_identity", newVal.toString());
                                       }} className={`rounded-xl border px-4 py-3 text-left transition-all ${canUseSecret ? hiddenIdentity ? 'border-[#ff007f]/50 bg-[#ff007f]/10 text-white' : 'border-white/10 bg-white/[0.03] text-gray-400 hover:text-white' : 'border-white/5 bg-white/[0.02] text-gray-600 grayscale cursor-not-allowed'}`}>
                                          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest">{canUseSecret ? <Eye className="w-4 h-4" /> : <Lock className="w-4 h-4" />} Secret Club</div>
                                          <p className="mt-1 text-[7px] font-black uppercase tracking-widest text-gray-500">{canUseSecret ? (hiddenIdentity ? 'Hidden identity on' : 'Hidden identity off') : 'Secret Club only'}</p>
                                       </button>
                                       <button type="button" onClick={() => {
                                          if (!canUseSecret) return addToast("Auto-Accept is a Secret Club feature.", "error");
                                          tryEnableAutoAccept(!autoAcceptEnabled);
                                       }} className={`rounded-xl border px-4 py-3 text-left transition-all ${canUseSecret ? autoAcceptEnabled ? 'border-[#00ffff]/50 bg-[#00ffff]/10 text-white' : 'border-white/10 bg-white/[0.03] text-gray-400 hover:text-white' : 'border-white/5 bg-white/[0.02] text-gray-600 grayscale cursor-not-allowed'}`}>
                                          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest">{canUseSecret ? <Zap className="w-4 h-4" /> : <Lock className="w-4 h-4" />} Auto Accept</div>
                                          <p className="mt-1 text-[7px] font-black uppercase tracking-widest text-gray-500">{canUseSecret ? (autoAcceptEnabled ? '10 minute session on' : '10 minute session off') : 'Secret Club only'}</p>
                                       </button>
                                       <button type="button" onClick={() => {
                                           if (!canUseAutoApply) return addToast("Auto-Apply is a Secret Club feature. Subscribe to unlock.", "error");
                                          tryEnableAutoApply(!autoApplyEnabled);
                                       }} className={`rounded-xl border px-4 py-3 text-left transition-all ${canUseAutoApply ? autoApplyEnabled ? 'border-green-500/50 bg-green-500/10 text-white' : 'border-white/10 bg-white/[0.03] text-gray-400 hover:text-white' : 'border-white/5 bg-white/[0.02] text-gray-600 grayscale cursor-not-allowed'}`}>
                                          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest">{canUseAutoApply ? <Radio className="w-4 h-4" /> : <Lock className="w-4 h-4" />} Auto Apply</div>
                                           <p className="mt-1 text-[7px] font-black uppercase tracking-widest text-gray-500">{canUseAutoApply ? (autoApplyEnabled ? 'Scanning on' : 'Scanning off') : 'Secret Club only'}</p>
                                       </button>
                                    </div>
                                 </div>
                              );
                           })()}
                           <button onClick={handleApply} disabled={!selectedCharId} className="w-full mt-6 py-4 bg-[#00ffff]/10 text-[#00ffff] border border-[#00ffff]/30 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#00ffff] hover:text-black disabled:opacity-50 disabled:hover:bg-[#00ffff]/10 disabled:hover:text-[#00ffff] transition-all">Initiate Transmission</button>
                        </motion.div>
                     </motion.div>
                  )}
               </AnimatePresence>

                <ManageModal
                  isOpen={isManageModalOpen}
                  onClose={() => { setIsManageModalOpen(false); setTargetLobby(null); }}
                  targetLobby={targetLobby}
                  setTargetLobby={setTargetLobby}
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
                    ownerAutoAcceptActive={ownerAutoAcceptActive}
                    setPreviewUser={openPlayerProfile}
                    getFriendStatus={getFriendStatus}
                    isUserBlocked={isUserBlocked}
                     onEdit={() => {
                        setEditingLobby(targetLobby);
                       setIsManageModalOpen(false);
                       setSubmitError("");
                       setIsCreateModalOpen(true);
                    }}
                    onTerminateLobby={terminateLobby}
                 />


                <CreateOfferModal
                  isOpen={isCreateModalOpen}
                   onClose={() => { setSubmitError(""); setIsCreateModalOpen(false); setEditingLobby(null); }}
                  initialFormData={editingLobby ? lobbyToFormData(editingLobby) : getDefaultFormData()}
                  onSubmit={(e, data: any) => handleCreateLobby(e, data)}
                  submitError={submitError}
                  myVfxBg={myVfxBg}
                  dungeons={DUNGEONS}
                  classGroups={WOW_CLASS_GROUPS}
                  classRoleOptions={CLASS_ROLE_OPTIONS}
                  offerDrafts={myOfferDrafts}
                  onSaveOfferDraft={handleSaveOfferDraft}
                  onDeleteOfferDraft={handleDeleteOfferDraft}
                  onDraftLoaded={(name) => addToast(`Loaded draft "${name}".`, "success")}
                />

                <BoostRequestModal
                  isOpen={isBoostRequestModalOpen}
                  onClose={() => setIsBoostRequestModalOpen(false)}
                  currentUserId={currentUserId}
                  userName={currentUserDisplay}
                />

                <AnimatePresence>
                   {isArmoryModalOpen && <ArmoryModal
                  isOpen={isArmoryModalOpen}
                  onClose={() => setIsArmoryModalOpen(false)}
                  activeArmoryTab={activeArmoryTab}
                  setActiveArmoryTab={setActiveArmoryTab}
                  isGifModalOpen={isGifModalOpen}
                  setIsGifModalOpen={setIsGifModalOpen}
                  gifInputUrl={gifInputUrl}
                  setGifInputUrl={setGifInputUrl}
                  deleteConfirmation={deleteConfirmation}
                  setDeleteConfirmation={setDeleteConfirmation}
                  myCharacters={myCharacters}
                  setMyCharacters={setMyCharacters}
                  globalCharacters={globalCharacters}
                  setGlobalCharacters={setGlobalCharacters}
                  raiderLink={raiderLink}
                  setRaiderLink={setRaiderLink}
                  handleSyncRaiderIo={handleSyncRaiderIo}
                  isSyncing={isSyncing}
                  lobbies={lobbies}
                  setLobbies={setLobbies}
                  completedHistoryItems={completedHistoryItems}
                  openMissionThread={openMissionThread}
                  updateAvatarEffect={updateAvatarEffect}
                  bankRegion={bankRegion}
                  setBankRegion={setBankRegion}
                  bankRealm={bankRealm}
                  setBankRealm={setBankRealm}
                  bankName={bankName}
                  setBankName={setBankName}
                  handleSyncBank={handleSyncBank}
                  isVerifyingBank={isVerifyingBank}
                  bankCharacters={bankCharacters}
                  setBankCharacters={setBankCharacters}
                  autoAcceptEnabled={autoAcceptEnabled}
                  setAutoAcceptEnabled={setAutoAcceptEnabled}
                  autoAcceptEndTime={autoAcceptEndTime}
                  setAutoAcceptEndTime={setAutoAcceptEndTime}
                  hiddenIdentity={hiddenIdentity}
                  setHiddenIdentity={setHiddenIdentity}
                     signOut={handleLogout}
                 />}
                </AnimatePresence>
                <AnimatePresence>
                    {inviteToReview && (() => {
                      const inviteLobby = inviteToReview.lobbyId
                        ? lobbies.find((x) => String(x.id) === String(inviteToReview.lobbyId))
                        : null;
                      const ownerUser = registeredUsers.find(
                        (u: any) =>
                          u.username === inviteToReview.fromHandle ||
                          String(u.id) === String(inviteLobby?.ownerId)
                      );
                      const ownerVisual = resolveUserVisual(
                        inviteToReview.fromHandle || inviteToReview.fromUser,
                        ownerUser?.id || inviteLobby?.ownerId
                      );
                      const ownerName = resolveProfileDisplayName(
                        ownerUser || { name: inviteToReview.fromUser },
                        inviteToReview.fromUser || "Mission Lead"
                      );
                      const runs = inviteLobby ? lobbyRunCount(inviteLobby) : 0;
                      return (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/95 backdrop-blur-xl">
                         <motion.div initial={{ scale: 0.92, y: 24 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-md sm:max-w-lg bg-[#07070f]/95 text-white border border-[#00ffff]/30 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-[0_0_80px_rgba(0,255,255,0.15)] relative overflow-hidden">

                             <div className="absolute inset-0 bg-gradient-to-br from-[#00ffff]/8 via-transparent to-[#ff007f]/10 pointer-events-none" />
                             <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#00ffff]/10 blur-3xl rounded-full pointer-events-none" />

                             <div className="flex items-center justify-between mb-5 relative z-10">
                                <InviteTimer
                                   variant="player"
                                   expiresAt={(inviteToReview.inviteExpiresAt || inviteToReview.timestamp + 60000)}
                                />
                                <span className="bg-[#ff007f]/15 text-[#ff007f] px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border border-[#ff007f]/35">Squad Invite</span>
                             </div>

                             <div className="flex flex-col items-center text-center relative z-10 mb-6">
                                <div className="relative mb-4">
                                   <div className="absolute inset-0 rounded-full bg-[#00ffff]/20 blur-xl scale-110" />
                                   <AvatarWithEffect
                                      src={ownerVisual.avatar || inviteToReview.fromAvatar || ""}
                                      effect={ownerVisual.effect || "none"}
                                      fallbackName={ownerName}
                                      className="w-20 h-20 sm:w-24 sm:h-24 relative z-10"
                                      userId={ownerUser?.id || inviteLobby?.ownerId}
                                   />
                                </div>
                                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight mb-1">{renderDualColorName(ownerName)}</h2>
                                <p className="text-[#00ffff]/70 font-black uppercase tracking-[0.35em] text-[7px]">Mission Invitation</p>
                             </div>

                             {inviteLobby && (
                                   <div className="p-4 sm:p-5 bg-black/50 rounded-[1.5rem] border border-white/10 mb-5 relative z-10 backdrop-blur-sm">
                                      <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
                                         <div>
                                            <p className="text-[7px] uppercase text-gray-500 font-black mb-1 tracking-widest">Total</p>
                                            <p className="text-xl sm:text-2xl font-black text-yellow-400">{inviteLobby.totalGold || "?"}<span className="text-xs text-yellow-500/60">K</span></p>
                                         </div>
                                         <div className="border-x border-white/10">
                                            <p className="text-[7px] uppercase text-gray-500 font-black mb-1 tracking-widest">Per Run</p>
                                            <p className="text-xl sm:text-2xl font-black text-[#00ffff]">{inviteLobby.goldPerRun || "?"}<span className="text-xs text-[#00ffff]/60">K</span></p>
                                         </div>
                                         <div>
                                            <p className="text-[7px] uppercase text-gray-500 font-black mb-1 tracking-widest">Runs</p>
                                            <p className="text-xl sm:text-2xl font-black text-violet-400">{runs}</p>
                                         </div>
                                      </div>
                                   </div>
                             )}

                            <div className="flex flex-col sm:flex-row gap-3 relative z-10">
                                <motion.button onClick={() => {
                                   syncAutoApplyEnabled(false);
                                   handleConfirmLobby(inviteToReview);
                                   setInviteToReview(null);
                               }} className="flex-[2] py-4 bg-gradient-to-r from-[#00ffff] to-[#00d4ff] text-black font-black uppercase tracking-[0.12em] text-sm rounded-2xl transition-all hover:shadow-[0_0_30px_rgba(0,255,255,0.4)] text-center">
                                  Accept Mission
                               </motion.button>
                                <motion.button onClick={async () => {
                                   const declinedLobbyId = inviteToReview.lobbyId;
                                   const uid = String(currentUserId);
                                   const updatedNotifs = notifications.filter((x) => x.id !== inviteToReview.id);
                                   const updatedLobbies = lobbies.map((l) => {
                                      if (String(l.id) !== String(declinedLobbyId)) return l;
                                      const invitedMember = (l.accepted || []).find(
                                         (a: any) =>
                                            memberIdentityKey(a) === uid && a.status === "invited"
                                      );
                                      if (invitedMember) {
                                         return repairLobbyRoles(cancelLobbyInvite(l, invitedMember));
                                      }
                                      return {
                                         ...l,
                                         applicants: (l.applicants || []).filter(
                                            (a: any) => memberIdentityKey(a) !== uid
                                         ),
                                      };
                                   });
                                   setNotifications(updatedNotifs);
                                   setLobbies(updatedLobbies);
                                   if (targetLobby && String(targetLobby.id) === String(declinedLobbyId)) {
                                      setTargetLobby(updatedLobbies.find((l) => String(l.id) === String(declinedLobbyId)) || null);
                                   }
                                   await saveGlobalData({ notifications: updatedNotifs, lobbies: updatedLobbies });
                                   setInviteToReview(null);
                                   playSound('terminal');
                                   window.dispatchEvent(new Event("data-refresh"));
                               }} className="flex-1 py-4 bg-white/5 text-red-400 font-black uppercase tracking-[0.12em] text-sm rounded-2xl border border-red-500/30 transition-all hover:bg-red-500 hover:text-white text-center">
                                  Decline
                               </motion.button>
                            </div>
                         </motion.div>
                      </motion.div>
                      );
                    })()}
                </AnimatePresence>
                {deleteConfirmation?.isOpen && (
                              <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                                 <div className="bg-[#05050a] border border-[#ff007f]/30 p-8 rounded-3xl max-w-sm w-full text-center">
                                    <h3 className="text-xl font-black text-white mb-4">DELETE BACKGROUND</h3>
                                    <p className="text-gray-400 text-sm mb-8">Are you sure you want to delete this background? This action cannot be undone.</p>
                                    <div className="flex gap-4">
                                       <button onClick={() => setDeleteConfirmation(null)} className="w-1/3 shrink-0 py-3 bg-white/5 text-white font-black uppercase text-[10px] rounded-xl hover:bg-white/10">CANCEL</button>
                                       <button onClick={() => {
                                          const { index, userId } = deleteConfirmation;
                                          const userIdx = registeredUsersRef.current.findIndex((u: any) => u.id === userId);
                                          if (userIdx !== -1) {
                                             const updatedUsers = [...registeredUsersRef.current];
                                             updatedUsers[userIdx].userVfx.splice(index, 1);
                                             setRegisteredUsers(updatedUsers);
                                             saveGlobalData({ registeredUsers: updatedUsers });
                                          }
                                          setDeleteConfirmation(null);
                                       }} className="w-1/3 shrink-0 py-3 bg-red-600 text-white font-black uppercase text-[10px] rounded-xl hover:bg-red-500">CONFIRM</button>
                                    </div>
                                 </div>
                              </div>
                )}


                <PaymentModal
                  isOpen={isPaymentModalOpen}
                  onClose={() => setIsPaymentModalOpen(false)}
                  lobby={targetLobby}
                  onLobbyChange={setTargetLobby}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  onPasteProof={handlePasteProof}
                  onDiscardProof={handleDiscardProof}
                  onConfirmPayout={handleConfirmPayout}
                />

                {/* RATE SQUAD PICKER */}
                <AnimatePresence>
                {ratePickerData && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[#0a0a16] border border-yellow-500/30 rounded-[2rem] p-6 max-w-sm w-full shadow-[0_0_40px_rgba(234,179,8,0.12)]">
                         <h3 className="text-sm font-black uppercase tracking-widest text-yellow-400 text-center mb-1">Rate Squad</h3>
                         {ratePickerData.missionTitle && <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 text-center mb-4">{ratePickerData.missionTitle}</p>}
                         <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 text-center mb-3">Choose who to review</p>
                         <div className="flex flex-col gap-2 mb-4">
                            {ratePickerData.targets.map((t) => (
                               <button
                                  key={t.id}
                                  onClick={() => {
                                     setRatingModalData({ lobbyId: ratePickerData.lobbyId, rateeId: t.id, rateeName: t.name });
                                     setRatePickerData(null);
                                  }}
                                  className={`w-full px-4 py-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                                     t.role === "COMMANDER"
                                        ? "bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20 hover:border-yellow-500/50"
                                        : "bg-white/5 border-white/10 hover:bg-yellow-500/10 hover:border-yellow-500/30"
                                  }`}
                               >
                                  {t.avatar ? <img src={t.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-white/10" /> : <div className="w-9 h-9 rounded-full bg-white/10" />}
                                  <div className="min-w-0 flex-1">
                                     <div className="text-xs font-black text-white truncate">{t.name}</div>
                                     <div className={`text-[8px] font-black uppercase tracking-widest ${t.role === "COMMANDER" ? "text-yellow-400" : "text-[#00ffff]"}`}>
                                        {t.role === "COMMANDER" ? "★ Commander" : "Operative"}
                                     </div>
                                  </div>
                               </button>
                            ))}
                         </div>
                         <button onClick={() => setRatePickerData(null)} className="w-full py-2 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all rounded-xl bg-white/5 hover:bg-white/10">Skip</button>
                      </motion.div>
                   </motion.div>
                )}
                </AnimatePresence>

                {/* RATING MODAL — hover stars, half-star support */}
                <AnimatePresence>
                {ratingModalData && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[#0a0a16] border border-yellow-500/40 rounded-[2rem] p-6 max-w-sm w-full shadow-[0_0_40px_rgba(234,179,8,0.15)]">
                         <h3 className="text-sm font-black uppercase tracking-widest text-white text-center mb-1">Rate {ratingModalData.rateeName}</h3>
                         <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 text-center mb-5">How was your experience?</p>
                         <HoverStarRating onSubmit={(score) => submitSquadRating(ratingModalData.rateeId, score)} />
                         <button onClick={() => setRatingModalData(null)} className="w-full mt-4 py-2 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all rounded-xl bg-white/5 hover:bg-white/10">Skip</button>
                      </motion.div>
                   </motion.div>
                )}
                </AnimatePresence>

                <EditingGoldModal
                  data={editingGold}
                  setData={setEditingGold}
                  theme={theme}
                  onSave={handleUpdateGold}
                />

                 {/* AUTO-APPLY SETTINGS MODAL */}
                  <AutoApplySettingsModal
                    isOpen={isAutoApplySettingsOpen}
                    onClose={() => { setIsAutoApplySettingsOpen(false); setIsApplyModalOpen(false); }}
                    myVfxBg={myVfxBg}
                    isApplyModalOpen={isApplyModalOpen}
                    targetLobby={targetLobby}
                    autoApplyCategory={autoApplyCategory}
                    setAutoApplyCategory={setAutoApplyCategory}
                    showKeyDropdown={showKeyDropdown}
                    setShowKeyDropdown={setShowKeyDropdown}
                    autoApplyKey={autoApplyKey}
                    setAutoApplyKey={setAutoApplyKey}
                    DUNGEONS={DUNGEONS}
                    resolveDungeonSelection={resolveDungeonSelection}
                    autoApplyKeyLevel={autoApplyKeyLevel}
                    setAutoApplyKeyLevel={setAutoApplyKeyLevel}
                    autoApplyDropLevel={autoApplyDropLevel}
                    setAutoApplyDropLevel={setAutoApplyDropLevel}
                    applyNote={applyNote}
                    setApplyNote={setApplyNote}
                    autoApplyMinGold={autoApplyMinGold}
                    setAutoApplyMinGold={setAutoApplyMinGold}
                    myCharacters={myCharacters}
                    CLASS_ROLE_OPTIONS={CLASS_ROLE_OPTIONS}
                    setMyCharacters={setMyCharacters}
                    globalCharacters={globalCharacters}
                    setGlobalCharacters={setGlobalCharacters}
                    saveGlobalData={saveGlobalData}
                    showCharacterDropdown={showCharacterDropdown}
                    setShowCharacterDropdown={setShowCharacterDropdown}
                    handleApply={handleApply}
                    autoApplyCharId={autoApplyCharId}
                    setAutoApplyCharId={setAutoApplyCharId}
                    autoAcceptEnabled={autoAcceptEnabled}
                    setAutoAcceptEnabled={setAutoAcceptEnabled}
                    autoAcceptEndTime={autoAcceptEndTime}
                    setAutoAcceptEndTime={setAutoAcceptEndTime}
                    AUTO_ACCEPT_DURATION_MS={AUTO_ACCEPT_DURATION_MS}
                    addToast={addToast}
                    getUserTier={getUserTier}
                    currentUserId={currentUserId}
                    hiddenIdentity={hiddenIdentity}
                    setHiddenIdentity={setHiddenIdentity}
                    registeredUsers={registeredUsers}
                    setRegisteredUsers={setRegisteredUsers}
                    autoFeaturesLocked={false}
                    onToggleAutoAccept={tryEnableAutoAccept}
                  />

                <TicketModal
                  isOpen={isTicketModalOpen}
                  onClose={() => { setIsTicketModalOpen(false); markAdminTicketsViewed(); }}
                  tickets={tickets}
                  selectedTicket={selectedTicket}
                  setSelectedTicket={setSelectedTicket}
                  ticketMessage={ticketMessage}
                  setTicketMessage={setTicketMessage}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  onSendMessage={handleSendTicketMessage}
                  onCloseTicket={handleCloseTicket}
                  onDeleteTicket={handleDeleteTicket}
                />


                <OnboardingModal
                  isOpen={isOnboardingModalOpen}
                  data={onboardingData}
                  setData={setOnboardingData}
                  onSubmit={handleApplyOperative}
                />

                <WelcomePlansModal
                  isOpen={isWelcomePlansOpen}
                  onClose={() => setIsWelcomePlansOpen(false)}
                  addToast={addToast}
                  onClaimed={() => window.dispatchEvent(new CustomEvent("data-refresh"))}
                />

                <style dangerouslySetInnerHTML={{
                  __html: `
          @keyframes wobble {
            0%, 100% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
            33% { border-radius: 70% 30% 50% 50% / 30% 60% 40% 70%; }
            66% { border-radius: 50% 60% 30% 70% / 60% 30% 70% 40%; }
          }
          @keyframes glitch-1 {
            0% { transform: translate(0); }
            20% { transform: translate(-3px, 3px); }
            40% { transform: translate(-3px, -3px); }
            60% { transform: translate(3px, 3px); }
            80% { transform: translate(3px, -3px); }
            100% { transform: translate(0); }
          }
          @keyframes glitch-2 {
            0% { transform: translate(0); }
            20% { transform: translate(3px, -3px); }
            40% { transform: translate(3px, 3px); }
            60% { transform: translate(-3px, -3px); }
            80% { transform: translate(-3px, 3px); }
            100% { transform: translate(0); }
          }
          .animate-glitch-1 { animation: glitch-1 0.2s infinite; }
          .animate-glitch-2 { animation: glitch-2 0.2s infinite; }
          @keyframes move-stripes {
            from { background-position: 0 0; }
            to { background-position: 40px 0; }
          }
        `}} />

               </>
                  );
                   const serverUrl =
                     voiceServerUrl ||
                     process.env.NEXT_PUBLIC_LIVEKIT_URL ||
                     "wss://uplink-sist6urm.livekit.cloud";
                   return (
                     <LiveKitRoom
                       audio={!!voiceToken}
                       video={false}
                       token={voiceToken ?? undefined}
                       serverUrl={serverUrl}
                       connect={!!voiceToken}
                       onError={(err) => {
                          console.error("LiveKit error:", err);
                          setVoiceToken(null);
                          setVoiceServerUrl(null);
                          localStorage.removeItem("uplink_voice_lobby");
                          addToast("Voice connection failed. Try again.", "error");
                       }}
                       onDisconnected={() => {
                         setVoiceToken(null);
                         setVoiceServerUrl(null);
                         localStorage.removeItem('uplink_voice_lobby');
                       }}
                     >
                         {innerAppContent}
                       {voiceToken ? <RoomAudioRenderer /> : null}
                       <AnimatePresence>
                         {voiceToken && !isManageModalOpen && (
                           <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className="fixed bottom-6 right-6 z-[9999] bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl flex items-center gap-3 px-4 py-2"
                          >
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="w-2.5 h-2.5 rounded-full bg-[#00ffff] animate-pulse shadow-[0_0_6px_#00ffff]" />
                              <span className="text-[7px] font-black uppercase tracking-[0.2em] text-white">VOICE</span>
                            </div>
                            <div className="w-px h-5 bg-white/10" />
                            <VoiceRoomContent roomName={targetLobby?.title || ''} onDisconnect={() => setVoiceToken(null)} inline users={registeredUsers} currentUserId={currentUserId} currentUserAvatar={session?.user?.image || ''} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </LiveKitRoom>
                  );
                })()}
           {!showOnboarding && !isManageModalOpen && !isArmoryModalOpen && !isCreateModalOpen && !isTicketModalOpen && (
              <>
              <HomeFloatingActions
                  onOpenSupport={() => { setLoungeWidgetOpen(false); setSupportWidgetOpen(true); }}
                  onOpenClubLounge={() => { setSupportWidgetOpen(false); setLoungeWidgetOpen(true); }}
                  supportUnread={isAdmin ? adminTicketUnread : 0}
                  supportOpen={supportWidgetOpen}
                  loungeOpen={loungeWidgetOpen}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
               />
              <SupportChatWidget
                 tickets={tickets}
                 selectedTicket={selectedTicket}
                 setSelectedTicket={setSelectedTicket}
                 ticketMessage={ticketMessage}
                 setTicketMessage={setTicketMessage}
                 currentUserId={currentUserId}
                 currentUserDisplay={currentUserDisplay}
                 onSendMessage={handleSendTicketMessage}
                 onOpenFullSupport={() => setIsTicketModalOpen(true)}
                 hideFab
                 open={supportWidgetOpen}
                 onOpenChange={setSupportWidgetOpen}
                 isAdmin={isAdmin}
                 adminUnreadCount={adminTicketUnread}
              />
              <ClubLoungeChatWidget
                 currentUserId={currentUserId}
                 canChat
                 hideFab
                 open={loungeWidgetOpen}
                 onOpenChange={setLoungeWidgetOpen}
              />
              </>
           )}
         </div>
      </PageContext.Provider>
      );
   }
