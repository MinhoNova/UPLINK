"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Trash2, Coins, ShieldAlert, Users, LogOut, CheckCircle2, MessageSquare, Radio, Phone, Zap, ShieldCheck, CircleDollarSign, Star, Lock, ArrowDown } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { usePage } from "@/contexts/PageContext";
import LongPressButton from "@/components/LongPressButton";
import OfferThreadSelect from "@/components/OfferThreadSelect";
import { classThumbUrl, classIconClass, roleIconClass, roleIconUrl } from "@/lib/classThumb";
import { resolveProfileDisplayName, resolveProfileImage, profileImgClass } from "@/lib/profileImage";
import { sanitizeApplicantNote } from "@/lib/applicantNote";
import MemberKeyBadge from "@/components/MemberKeyBadge";
import { canOwnerCancelLobby, cancelLobbyInvite, canVoteMissionComplete, finalizeLevelingMissionComplete, finalizeMissionFailed, getCompletedRunsCount, getEffectiveOfferStatus, getMissionCompleteVotesNeeded, getMissionFailVotesNeeded, getOccupantsBySlot, getOfferFamilyMessages, getViewableOfferThreads, isEmbeddedFootArchive, isVoiceLobbyOpen, memberIdentityKey, ownerMissionCompleteInstant, splitLobbyAfterFootComplete, squadRolesFilled, userCanAccessVoice, userCanViewOfferThread, voiceLobbyLockLabel } from "@/lib/lobbyLifecycle";

interface ManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetLobby: any;
  setTargetLobby: (l: any) => void;
  lobbies: any[];
  setLobbies: (l: any[] | ((prev: any[]) => any[])) => void;
  activeMemberAction: any;
  setActiveMemberAction: (a: any) => void;
  confirmLeaveOrKick: (lobbyId: string, member: any, isKick: boolean, runs: number) => void;
  handleUpdateLobby: (l: any) => void;
  handleAccept: (app: any) => void;
  handleReject: (appId: number) => void;
  handleSendMessage: (lobbyId: string) => void;
  handleLeaveLobby: (lobbyId: string) => void;
  setIsPaymentModalOpen: (v: boolean) => void;
  reportScamTarget: any;
  setReportScamTarget: (v: any) => void;
  holdProgress: number;
  setHoldProgress: (v: number) => void;
  voiceToken: string | null;
  setVoiceToken: (v: string | null) => void;
  handleJoinVoice: (lobbyId: string) => void;
  isJoiningVoice: boolean;
  chatMessage: string;
  setChatMessage: (v: string) => void;
  chatImagePreview: string | null;
  setChatImagePreview: (v: string | null) => void;
  notifications: any[];
  setNotifications: (v: any[] | ((prev: any[]) => any[])) => void;
  VoiceRoomContent: any;
  InteractivePartyCard: any;
  openMissionThread: (lobbyId: string) => void;
  onTerminateLobby: (lobbyId: string) => void;
  bannedUsers: string[];
  setBannedUsers: (v: string[] | ((prev: string[]) => string[])) => void;
  currentUserDiscordHandle: string;
  deleteConfirmation: any;
  setDeleteConfirmation: (v: any) => void;
  InviteTimer: any;
  ownerAutoAcceptActive?: boolean;
  onEdit?: () => void;
  setPreviewUser: (u: any) => void;
  getFriendStatus: (userId2: string) => string;
  isUserBlocked: (userId2: string) => boolean;
}

const ManageModal = ({
  isOpen,
  onClose,
  targetLobby,
  setTargetLobby,
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
  VoiceRoomContent,
  InteractivePartyCard,
  openMissionThread,
  onTerminateLobby,
  bannedUsers,
  setBannedUsers,
  currentUserDiscordHandle,
  deleteConfirmation,
  setDeleteConfirmation,
  InviteTimer,
  ownerAutoAcceptActive = false,
  onEdit,
  setPreviewUser,
  getFriendStatus,
  isUserBlocked,
}: ManageModalProps) => {
  const {
    currentUserId,
    currentUserDisplay,
    session,
    registeredUsers,
    setRegisteredUsers,
    addToast,
    saveGlobalData,
    playSound,
    t,
    getUserTier,
    getUserTierLabel,
    getVfxSettings,
    renderDualColorName,
    resolveMemberVisual,
    resolveChatIdentity,
    openRatePicker,
    theme,
    AvatarWithEffect,
    isAdmin,
    DUNGEONS,
  } = usePage();

  const sortApplicants = (apps: any[]) =>
    [...apps].sort((a, b) => {
      const aClub = getUserTier(a.applicantId || a.userId) === "secret_club" ? 0 : 1;
      const bClub = getUserTier(b.applicantId || b.userId) === "secret_club" ? 0 : 1;
      return aClub - bClub;
    });

  const meUser = registeredUsers.find((u: any) => String(u.id) === String(currentUserId));
  const currentUserAvatar = resolveProfileImage(meUser || { avatar: session?.user?.image }, session?.user?.name || "U");
  const users = registeredUsers;
  const holdTimerRef = useRef<any>(null);
   const [isCompletedRunsPickerOpen, setIsCompletedRunsPickerOpen] = useState(false);
   const [isLeavePickerOpen, setIsLeavePickerOpen] = useState(false);
   const [runsPage, setRunsPage] = useState(1);
   const RUNS_PER_PAGE = 4;
   const totalRuns = Math.max(1, parseInt(targetLobby?.runsCount || "1") || 1);
   const maxExitRuns = Math.max(0, totalRuns - 1);

   const viewableThreads = useMemo(
      () => (targetLobby ? getViewableOfferThreads(targetLobby, currentUserId, lobbies) : []),
      [targetLobby, currentUserId, lobbies]
   );
   const isFootArchive = isEmbeddedFootArchive(targetLobby);
   const effectiveStatus = getEffectiveOfferStatus(targetLobby);

   const familyMessages = useMemo(
      () => (targetLobby ? getOfferFamilyMessages(targetLobby, lobbies) : []),
      [targetLobby, lobbies]
   );

   const threadSelectValue = useMemo(() => {
      if (!targetLobby?.id) return "";
      const currentId = String(targetLobby.id);
      if (viewableThreads.some((thread) => String(thread.id) === currentId)) return currentId;
      return viewableThreads[0] ? String(viewableThreads[0].id) : currentId;
   }, [targetLobby?.id, viewableThreads]);

   useEffect(() => {
      setRunsPage(1);
   }, [targetLobby?.id, targetLobby?.detectedRuns?.length]);
    const completeDungeonMission = (completedRuns: number) => {
        if (!canVoteMissionComplete(targetLobby, currentUserId)) {
           addToast("Only squad members or the offer owner can vote.", "error");
           return;
        }
        const existingVotes = targetLobby.votes || [];
        const alreadyVoted = existingVotes.some((v: any) => String(v.userId) === String(currentUserId));
        if (alreadyVoted) { addToast("You already voted!", "info"); setIsCompletedRunsPickerOpen(false); return; }
        const newVotes = [...existingVotes, { userId: currentUserId, completedRuns, timestamp: Date.now() }];
        const votesNeeded = getMissionCompleteVotesNeeded(targetLobby);
        const chatIdentity = resolveChatIdentity(currentUserId, {
           from: currentUserDisplay || 'Unknown',
           fromHandle: currentUserDisplay || 'Unknown',
           fromAvatar: session?.user?.image || '',
        });
        const voteMsg = {
           id: Date.now(),
           fromId: currentUserId,
           from: chatIdentity.name,
           fromHandle: currentUserDisplay || 'Unknown',
           fromAvatar: chatIdentity.avatar,
           fromEffect: 'none',
           text: `voted completed ${completedRuns} run${completedRuns > 1 ? 's' : ''}. (${newVotes.length}/${votesNeeded})`,
           image: null,
           time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const ownerInstant = ownerMissionCompleteInstant(targetLobby, currentUserId);
        if (ownerInstant || newVotes.length >= votesNeeded) {
           const splitResult = splitLobbyAfterFootComplete(
              lobbies,
              targetLobby.id,
              completedRuns,
              voteMsg,
              newVotes
           );
           if (splitResult) {
              setLobbies(splitResult.lobbies);
              const nextTarget = splitResult.lobbies.find((l: any) => String(l.id) === String(splitResult.focusLobbyId));
              if (nextTarget) setTargetLobby(nextTarget);
              saveGlobalData({ lobbies: splitResult.lobbies });
           }
           setIsCompletedRunsPickerOpen(false);
           addToast(`${completedRuns} run${completedRuns > 1 ? 's' : ''} COMPLETED!`, "success");
           playSound('terminal');
        } else {
           const updated = { ...targetLobby, votes: newVotes, messages: [...(targetLobby.messages || []), voteMsg] };
           setTargetLobby(updated);
           handleUpdateLobby(updated);
           setIsCompletedRunsPickerOpen(false);
           addToast(`Vote recorded (${newVotes.length}/${votesNeeded})`, "info");
           playSound('terminal');
        }
     };

     const completeLevelingMission = () => {
        if (!canVoteMissionComplete(targetLobby, currentUserId)) {
           addToast("Only the player or offer owner can vote.", "error");
           return;
        }
        const existingVotes = targetLobby.votes || [];
        const alreadyVoted = existingVotes.some((v: any) => String(v.userId) === String(currentUserId));
        if (alreadyVoted) { addToast("You already voted!", "info"); return; }
        const newVotes = [...existingVotes, { userId: currentUserId, completedRuns: 1, timestamp: Date.now() }];
        const votesNeeded = getMissionCompleteVotesNeeded(targetLobby);
        const chatIdentity = resolveChatIdentity(currentUserId, {
           from: currentUserDisplay || 'Unknown',
           fromHandle: currentUserDisplay || 'Unknown',
           fromAvatar: session?.user?.image || '',
        });
        const voteMsg = {
           id: Date.now(),
           fromId: currentUserId,
           from: chatIdentity.name,
           fromHandle: currentUserDisplay || 'Unknown',
           fromAvatar: chatIdentity.avatar,
           fromEffect: 'none',
           text: `voted MISSION COMPLETE. (${newVotes.length}/${votesNeeded})`,
           image: null,
           time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const ownerInstant = ownerMissionCompleteInstant(targetLobby, currentUserId);
        if (ownerInstant || newVotes.length >= votesNeeded) {
           const updated = finalizeLevelingMissionComplete(targetLobby, voteMsg, newVotes);
           const updatedLobbies = lobbies.map((l) => (String(l.id) === String(targetLobby.id) ? updated : l));
           setLobbies(updatedLobbies);
           setTargetLobby(updated);
           handleUpdateLobby(updated);
           saveGlobalData({ lobbies: updatedLobbies });
           addToast("Mission COMPLETED! Awaiting payment proof.", "success");
           playSound('terminal');
        } else {
           const updated = { ...targetLobby, votes: newVotes, messages: [...(targetLobby.messages || []), voteMsg] };
           setTargetLobby(updated);
           handleUpdateLobby(updated);
           addToast(`Vote recorded (${newVotes.length}/${votesNeeded})`, "info");
           playSound('terminal');
        }
     };

     const failVotesNeeded = getMissionFailVotesNeeded(targetLobby);

     const voteMissionFailed = () => {
        if (!targetLobby) return;
        const isOwner = String(targetLobby.ownerId) === String(currentUserId);
        const isMember = (targetLobby.accepted || []).some((a: any) => String(a.applicantId) === String(currentUserId));
        if (!isOwner && !isMember && !isAdmin) { addToast("Only squad members can vote.", "error"); return; }
        const existingVotes = targetLobby.failVotes || [];
        if (existingVotes.some((v: any) => String(v.userId) === String(currentUserId))) { addToast("You already voted!", "info"); return; }
        const newVotes = [...existingVotes, { userId: currentUserId, timestamp: Date.now() }];
        const chatIdentity = resolveChatIdentity(currentUserId, {
           from: currentUserDisplay || 'Unknown',
           fromHandle: currentUserDisplay || 'Unknown',
           fromAvatar: session?.user?.image || '',
        });
        const failMsg = {
           id: Date.now(),
           fromId: currentUserId,
           from: chatIdentity.name,
           fromHandle: currentUserDisplay || 'Unknown',
           fromAvatar: chatIdentity.avatar,
           fromEffect: 'none',
           text: `voted MISSION FAILED. (${newVotes.length}/${failVotesNeeded})`,
           image: null,
           time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        if (newVotes.length >= failVotesNeeded) {
           const declaredMsg = {
              id: Date.now() + 1,
              fromId: 'bot',
              from: 'UPLINK',
              fromHandle: 'UPLINK',
              fromAvatar: '',
              fromEffect: 'none',
              text: `MISSION FAILED — vote passed (${newVotes.length}/${failVotesNeeded}). Squad disbanded. Thread archived to history.`,
              image: null,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
           };
           const upd = finalizeMissionFailed(
              targetLobby,
              newVotes,
              [...(targetLobby.messages || []), failMsg, declaredMsg]
           );
           const updatedLobbies = lobbies.map((l) => (String(l.id) === String(targetLobby.id) ? upd : l));
           setLobbies(updatedLobbies);
           saveGlobalData({ lobbies: updatedLobbies });
           setTargetLobby(null);
           setVoiceToken(null);
           if (typeof localStorage !== "undefined") localStorage.removeItem("uplink_voice_lobby");
           onClose();
           addToast("Mission FAILED. Squad removed — thread moved to history.", "error");
           playSound('terminal');
        } else {
           const upd = { ...targetLobby, failVotes: newVotes, messages: [...(targetLobby.messages || []), failMsg] };
           setTargetLobby(upd);
           handleUpdateLobby(upd);
           addToast(`Fail vote recorded (${newVotes.length}/${failVotesNeeded})`, "info");
           playSound('terminal');
        }
     };
               return (
                <AnimatePresence>
                  {isOpen && targetLobby && (
                     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
                         <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-[98vw] h-[96vh] bg-[#05050a] border-2 border-[#ff007f]/40 rounded-[3.5rem] p-1 shadow-[0_0_100px_rgba(255,0,127,0.15)] relative overflow-hidden flex flex-col">

                             {/* KICK/LEAVE OVERLAY - inside thread, covers content */}
                             {activeMemberAction && (
                                 <div className="absolute z-[100] mt-2 bg-[#05050a] border border-[#ff007f]/50 rounded-xl p-2 shadow-2xl flex flex-col gap-1 w-40">
                                     <span className="text-[8px] font-black text-gray-500 uppercase px-2">Completed Runs</span>
                                     {Array.from({ length: maxExitRuns + 1 }, (_, i) => i).map(num => (
                                         <button 
                                             key={num} 
                                             onClick={() => {
                                                 confirmLeaveOrKick(activeMemberAction.lobbyId, activeMemberAction.member, activeMemberAction.isKick, num);
                                                 setActiveMemberAction(null);
                                             }}
                                             className="text-left px-3 py-2 text-xs font-black text-white hover:bg-[#ff007f]/20 rounded-lg transition-all"
                                         >
                                             {num} Run{num !== 1 ? 's' : ''}
                                         </button>
                                     ))}
                                 </div>
                             )}                            {/* MODAL BACKGROUND FX */}
                           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#ff007f]/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                           <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#00ffff]/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

                           {/* DYNAMIC ACTIVE BACKGROUND */}
                            {(() => {
                               const ownerUser = registeredUsers.find((u) => String(u.id) === String(targetLobby.ownerId));
                               const activeVfx = ownerUser?.activeVfx;
                               const bgUrl = targetLobby.customBg || (
                                  getUserTier(targetLobby.ownerId) === "secret_club" &&
                                  getVfxSettings(ownerUser).showOnModal &&
                                  activeVfx
                                     ? activeVfx
                                     : null
                               );
                               return bgUrl ? (
                                 <div className="absolute inset-0 z-0 opacity-10">
                                    <img src={bgUrl} key={bgUrl} className="w-full h-full object-cover" alt="" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#05050a] via-[#05050a]/80 to-transparent"></div>
                                 </div>
                               ) : null;
                            })()}
                            <div className="flex flex-col p-8 md:p-12 relative z-10 min-h-0">
                              {/* HEADER & TOP ACTIONS */}
                              <div className="flex flex-col gap-4 mb-10 border-b border-white/5 pb-10 shrink-0">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                   <div className="flex items-center gap-5">
                                     {(() => {
                                       const owner = (users as any[]).find((u: any) => String(u.id) === String(targetLobby.ownerId));
                                       const ownerName = owner?.displayName || owner?.name || targetLobby.ownerDiscordName || "Commander";
                                       const ownerAvatar = owner?.avatar || session?.user?.image || "";
                                       const ownerEffect = owner?.effect || "none";
                                       return (
                                         <>
                                           <AvatarWithEffect src={ownerAvatar} effect={ownerEffect} fallbackName={ownerName} className="w-16 h-16" userId={targetLobby.ownerId} />
                                           <div>
                                             <div className="flex items-center gap-3 flex-wrap">
                                               <h2 className="text-4xl font-black uppercase tracking-tighter text-white">Commander</h2>
                                               {viewableThreads.length > 1 && (
                                                  <OfferThreadSelect
                                                     threads={viewableThreads}
                                                     value={threadSelectValue}
                                                     onChange={(nextId) => {
                                                        const next = lobbies.find((l) => String(l.id) === nextId);
                                                        if (next && userCanViewOfferThread(next, currentUserId)) {
                                                           setTargetLobby(next);
                                                        }
                                                     }}
                                                  />
                                               )}
                                               <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_10px_currentcolor] animate-pulse ${effectiveStatus === 'completed' ? 'text-green-500 bg-green-500' : effectiveStatus === 'unpaid' ? 'text-yellow-500 bg-yellow-500' : effectiveStatus === 'failed' ? 'text-red-500 bg-red-500' : effectiveStatus === 'in_progress' ? 'text-green-500 bg-green-500' : 'text-[#ff007f] bg-[#ff007f]'}`}></div>
                                             </div>
                                             <div className="flex items-center gap-3 mt-1">
                                               <p className="text-sm font-black text-white/80 truncate max-w-[200px]">{ownerName}</p>
                                               <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{effectiveStatus.toUpperCase()}</span>
                                             </div>
                                           </div>
                                         </>
                                       );
                                     })()}
                                    </div>

                                   {/* ACTION BUTTONS - ACCESSIBLE AT TOP */}
                                   <div className="flex flex-wrap items-center justify-end gap-3 w-full md:w-auto">
                                     {(currentUserId === targetLobby.ownerId || isAdmin) ? (
                                        <>
                                             {(!targetLobby.status || targetLobby.status === 'standby') && (
                                                 <motion.button onClick={() => onEdit?.()} className={`h-11 px-5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 ${targetLobby.category === 'leveling' ? 'bg-[#8a2be2]/10 text-[#8a2be2] border border-[#8a2be2]/30 hover:bg-[#8a2be2] hover:text-white' : 'bg-[#00ffff]/10 text-[#00ffff] border border-[#00ffff]/30 hover:bg-[#00ffff] hover:text-black'}`}>
                                                    <Zap className="w-4 h-4" /> EDIT
                                                 </motion.button>
                                             )}

                                             {canOwnerCancelLobby(targetLobby) && (
                                                <motion.button onClick={() => {
                                                   if (!canOwnerCancelLobby(targetLobby)) {
                                                      addToast("Cannot cancel — squad is full or mission already started.", "error");
                                                      return;
                                                   }
                                                   onTerminateLobby(targetLobby.id);
                                                }} className="h-11 px-5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2">
                                                  <X className="w-4 h-4" /> CANCEL
                                                </motion.button>
                                             )}
                                        </>
                                      ) : null}
                                              {(currentUserId === targetLobby.ownerId || isAdmin) && (
                                               <>
                                                  {(isFootArchive || effectiveStatus === 'unpaid' || effectiveStatus === 'completed' || effectiveStatus === 'payment_pending') && (
                                                    <motion.button onClick={() => setIsPaymentModalOpen(true)} className="h-11 px-5 bg-[#ffd700]/10 border border-[#ffd700]/40 text-[#ffd700] rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-[#ffd700] hover:text-black transition-all">
                                                       <CircleDollarSign className="w-4 h-4" /> PAYMENT PROOF
                                                    </motion.button>
                                                  )}
                                                  {effectiveStatus === 'payment_pending' && (
                                                    <motion.button onClick={() => { const upd = { ...targetLobby, status: 'cancelled' as const, payoutStatus: undefined }; setTargetLobby(upd); handleUpdateLobby(upd); addToast("Payment entry discarded.", "info"); }} className="h-11 px-5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2">
                                                       <X className="w-4 h-4" /> DISCARD
                                                    </motion.button>
                                                  )}
                                               </>
                                              )}
                                            {effectiveStatus === 'in_progress' && squadRolesFilled(targetLobby.roles) && !isFootArchive && (
                                               <>
                                                  {targetLobby.category === 'leveling' ? (
                                                    canVoteMissionComplete(targetLobby, currentUserId) ? (
                                                      <motion.button onClick={completeLevelingMission} className="h-11 px-7 bg-yellow-500/15 text-yellow-400 border border-yellow-500/40 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-[0_0_25px_rgba(234,179,8,0.2)] flex items-center gap-2 hover:bg-yellow-500 hover:text-black active:scale-95 transition-all">
                                                         <CheckCircle2 className="w-4 h-4" /> MISSION COMPLETE
                                                      </motion.button>
                                                    ) : null
                                                   ) : (
                                                      <div className="relative">
                                                         <motion.button onClick={() => setIsCompletedRunsPickerOpen(prev => !prev)} className="h-11 px-7 bg-yellow-500/15 text-yellow-400 border border-yellow-500/40 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-[0_0_25px_rgba(234,179,8,0.2)] flex items-center gap-2 hover:bg-yellow-500 hover:text-black active:scale-95 transition-all">
                                                            <CheckCircle2 className="w-4 h-4" /> MISSION COMPLETE
                                                         </motion.button>
                                                         {isCompletedRunsPickerOpen && (
                                                            <>
                                                               <div className="fixed inset-0 z-40" onClick={() => setIsCompletedRunsPickerOpen(false)} />
                                                               <motion.div
                                                                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                                                  className="absolute z-50 top-full mt-2 right-0 w-[180px] overflow-hidden rounded-2xl border border-yellow-500/40 bg-[#07070d] shadow-[0_0_60px_rgba(234,179,8,0.25)]"
                                                               >
                                                                  <div className="flex flex-col">
                                                                     {Array.from({ length: totalRuns }, (_, i) => i + 1).map((num) => (
                                                                        <button
                                                                           key={num}
                                                                           onClick={() => completeDungeonMission(num)}
                                                                           className="w-full px-5 py-3 text-left font-black text-sm text-yellow-400 hover:bg-yellow-500 hover:text-black transition-all border-b border-white/5 last:border-b-0"
                                                                        >
                                                                           {num} Run{num > 1 ? 's' : ''}
                                                                        </button>
                                                                     ))}
                                                                  </div>
                                                               </motion.div>
                                                            </>
                                                         )}
                                                     </div>
                                                   )}
                                                   <motion.button onClick={voteMissionFailed} className="h-11 px-5 bg-red-700/20 text-red-400 border border-red-500/40 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 hover:text-white active:scale-95 transition-all flex items-center gap-2">
                                                      <X className="w-4 h-4" /> MISSION FAILED
                                                   </motion.button>
                                               </>
                                            )}

                                           {effectiveStatus === 'unpaid' && targetLobby.paymentProof && targetLobby.payoutStatus !== 'paid' && (currentUserId === targetLobby.ownerId || isAdmin) && (
                                              <motion.button onClick={() => {
                                                 const updated = { ...targetLobby, payoutStatus: 'paid', status: 'completed', completedAt: Date.now() };
                                                 setTargetLobby(updated);
                                                 const updatedLobbies = lobbies.map(l => l.id === targetLobby.id ? updated : l);
                                                 setLobbies(updatedLobbies);
                                                 saveGlobalData({ lobbies: updatedLobbies });

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
                                                handleUpdateLobby(updated);
                                                saveGlobalData({ registeredUsers: updatedUsers });
                                                addToast("Payment Confirmed! Player stats updated.", "success");
                                                playSound('reward');
                                             }} className="h-11 px-7 bg-green-500 text-black rounded-xl font-black uppercase text-[10px] tracking-widest shadow-[0_0_25px_rgba(34,197,94,0.3)] flex items-center gap-2 hover:scale-105 active:scale-95 transition-all">
                                                <Coins className="w-4 h-4" /> CONFIRM PAYOUT
                                              </motion.button>
                                            )}


                                              {targetLobby.accepted?.some((a: any) => a.applicantId === currentUserId) && currentUserId !== targetLobby.ownerId && !isFootArchive && !['unpaid', 'completed', 'cancelled', 'payment_pending', 'failed'].includes(targetLobby.status) && (
                                                  <div className="relative">
                                                      <motion.button onClick={() => setIsLeavePickerOpen(prev => !prev)} className="h-11 px-5 bg-white/[0.03] text-red-400 border border-red-500/30 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2">
                                                        <LogOut className="w-4 h-4" /> LEAVE
                                                     </motion.button>
                                                     {isLeavePickerOpen && (
                                                        <>
                                                           <div className="fixed inset-0 z-40" onClick={() => setIsLeavePickerOpen(false)} />
                                                           <motion.div
                                                              initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                                              animate={{ opacity: 1, y: 0, scale: 1 }}
                                                              exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                                              className="absolute z-50 top-full mt-2 right-0 w-[180px] overflow-hidden rounded-2xl border border-red-500/40 bg-[#07070d] shadow-[0_0_60px_rgba(255,0,0,0.25)]"
                                                           >
                                                              <div className="flex flex-col">
                                                                 {Array.from({ length: maxExitRuns + 1 }, (_, i) => i).map((num) => (
                                                                    <button
                                                                       key={num}
                                                                       onClick={() => {
                                                                          const leaveMember = targetLobby.accepted?.find((a: any) => memberIdentityKey(a) === String(currentUserId));
                                                                          if (leaveMember) { confirmLeaveOrKick(targetLobby.id, leaveMember, false, num); }
                                                                          setIsLeavePickerOpen(false);
                                                                       }}
                                                                       className="w-full px-5 py-3 text-left font-black text-sm text-red-400 hover:bg-red-500 hover:text-black transition-all border-b border-white/5 last:border-b-0"
                                                                    >
                                                                       {num} Run{num !== 1 ? 's' : ''}
                                                                    </button>
                                                                 ))}
                                                              </div>
                                                           </motion.div>
                                                        </>
                                                     )}
                                                  </div>
                                               )}
                                              {(targetLobby.status === 'in_progress' || targetLobby.status === 'unpaid' || targetLobby.status === 'payment_pending' || targetLobby.status === 'completed' || targetLobby.status === 'failed') && currentUserId !== targetLobby.ownerId && !isFootArchive && (
                                                <motion.button onClick={() => setReportScamTarget(targetLobby)} className="h-11 px-5 bg-red-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-[0_0_25px_rgba(220,38,38,0.35)] flex items-center gap-2 hover:bg-red-500 active:scale-95 transition-all">
                                                   <ShieldAlert className="w-4 h-4" /> REPORT SCAM
                                                </motion.button>
                                             )}
                                             {(targetLobby.status === 'failed' || (targetLobby.status === 'completed' && targetLobby.payoutStatus === 'paid')) && (
                                                <motion.button onClick={() => openRatePicker(targetLobby)} className="h-11 px-5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/40 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-yellow-500 hover:text-black active:scale-95 transition-all flex items-center gap-2">
                                                   <Star className="w-4 h-4" /> RATE SQUAD
                                                </motion.button>
                                             )}
                                    <motion.button onClick={() => onClose()} className="h-11 w-11 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition-all text-gray-500 hover:text-white shrink-0"><X className="w-5 h-5" /></motion.button>
                                 </div>
                                </div>
                              </div>

                                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                                   {/* LEFT COLUMN: OPERATIVES & LOGS */}
                                   <div className="lg:col-span-6 flex flex-col gap-4 min-h-0">

                                      {/* SECURED OPERATIVES GRID - Shows ALL accepted players + remaining empty slots */}
                                     <div className="bg-black/40 rounded-[2.5rem] border border-white/5 p-5 shadow-inner overflow-hidden flex flex-col">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                                           {(() => {
                                              return getOccupantsBySlot(targetLobby).map(({ slot, occupant }, idx) => {
                                                 const roleType = slot.startsWith('dps') ? 'dps' : slot;

                                                 if (occupant) {
                                                    const isPendingInvite = occupant.status === "invited";
                                                    return (
                                                       <div key={`slot-${idx}`} className={`relative p-2 rounded-[1.2rem] border transition-all h-full min-h-[220px] flex flex-col ${isPendingInvite ? "bg-gradient-to-b from-yellow-500/10 to-transparent border-yellow-500/35 shadow-[0_0_20px_rgba(234,179,8,0.12)]" : "bg-gradient-to-b from-[#00ffff]/10 to-transparent border-[#00ffff]/35 shadow-[0_0_20px_rgba(0,255,255,0.08)]"}`}>
                                                          <div className="flex flex-1 items-center justify-center pt-2 min-h-0">
                                                             {(() => {
                                                                const occupantUser = registeredUsers.find((u: any) => String(u.id) === String(occupant.applicantId || occupant.userId));
                                                                const userForPreview = occupantUser ? { ...occupantUser, tierLabel: getUserTierLabel(occupantUser.id) } : null;
                                                                const blockedStatus = userForPreview ? isUserBlocked(userForPreview.id) : false;
                                                                return (
                                                                   <div className="relative flex flex-col items-center gap-1.5">
                                                                      <InteractivePartyCard role={roleType} accepted={occupant} visual={resolveMemberVisual(occupant)} AvatarComponent={AvatarWithEffect} hideIdentity={false} onAvatarClick={(u: any) => setPreviewUser(u)} userData={userForPreview} />
                                                                      <MemberKeyBadge member={occupant} />
                                                                       {userForPreview && blockedStatus && (
                                                                         <span className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 bg-yellow-500/20 text-yellow-400 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full border border-yellow-500/30">Blocked</span>
                                                                      )}
                                                                   </div>
                                                                );
                                                             })()}
                                                          </div>
                                                         <div className="mt-auto flex flex-col gap-1.5 w-full pb-2 px-2 shrink-0">
                                                            {isPendingInvite && !ownerAutoAcceptActive && (currentUserId === targetLobby.ownerId || isAdmin) && occupant.inviteExpiresAt && (
                                                               <InviteTimer fullWidth expiresAt={occupant.inviteExpiresAt} onCancel={() => {
                                                                  const upd = lobbies.map((l) =>
                                                                     l.id === targetLobby.id ? cancelLobbyInvite(l, occupant) : l
                                                                  );
                                                                  const notifId = occupant.inviteNotifId;
                                                                  const updNotifs = notifId ? notifications.filter((n) => n.id !== notifId) : notifications;
                                                                  setLobbies(upd);
                                                                  setTargetLobby(upd.find((l) => l.id === targetLobby.id));
                                                                  setNotifications(updNotifs);
                                                                  saveGlobalData({ lobbies: upd, notifications: updNotifs });
                                                                  addToast("Invite cancelled.", "info");
                                                               }} />
                                                            )}
                                                            {!isPendingInvite && targetLobby.status !== 'standby' && (
                                                               <>
                                                                   <motion.button onClick={() => { const bt = registeredUsers.find((u: any) => String(u.id) === String(occupant.applicantId || occupant.userId))?.battleTag || occupant.battlenet || 'Unknown#1234'; navigator.clipboard.writeText(bt); addToast("BNet Copied", "success"); }} className="w-full py-2 bg-[#1E90F4]/10 border border-[#1E90F4]/30 rounded-lg text-[9px] text-white font-black uppercase tracking-widest hover:bg-[#1E90F4] transition-all flex items-center justify-center gap-1.5"><img src="/classes/Battle.net.svg" className="w-4 h-4" /> Copy B.net</motion.button>
                                                                   <motion.button onClick={() => { const p = occupant.paymentCharacter || occupant.name; const r = occupant.realm || ''; navigator.clipboard.writeText(r ? `${p}-${r}` : p); addToast("Payment copied", "success"); }} className="w-full py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-[9px] text-yellow-500 font-black uppercase tracking-widest hover:bg-yellow-500 hover:text-black transition-all flex items-center justify-center gap-1.5"><Coins className="w-4 h-4" /> Copy Payment</motion.button>
                                                                   <motion.button onClick={() => { const cmd = `/inv ${occupant.name}-${occupant.realm?.replace(/\s+/g, '')}`; navigator.clipboard.writeText(cmd); addToast(`Copied: ${cmd}`, "success"); }} className="w-full py-2 bg-white/5 border border-[#00ffff]/30 rounded-lg text-[9px] text-[#00ffff] font-black uppercase tracking-widest hover:bg-[#00ffff] hover:text-black transition-all flex items-center justify-center gap-1.5"><img src="/classes/RAIDER IO.svg" className="w-4 h-4" /> Copy /inv</motion.button>
                                                              </>
                                                           )}
                                                                {!isPendingInvite && !occupant.leftAt && !occupant.runsAtExit && !isFootArchive && targetLobby.status !== 'unpaid' && targetLobby.status !== 'completed' && targetLobby.status !== 'cancelled' && targetLobby.status !== 'payment_pending' && (currentUserId === targetLobby.ownerId || isAdmin) && (
                                                                      <motion.button onClick={() => setActiveMemberAction({ lobbyId: targetLobby.id, member: occupant, isKick: true })} className="w-full py-2 bg-red-500/20 text-red-500 rounded-lg font-black uppercase text-[9px] tracking-widest border border-red-500/30 hover:bg-red-500 hover:text-white transition-all">KICK</motion.button>
                                                                )}
                                                        </div>
                                                       </div>
                                                    );
                                                 }

                                                 return (
                                                    <div key={`slot-${idx}`} className="relative p-2 rounded-[1.2rem] border transition-all h-full min-h-[220px] flex flex-col justify-between bg-white/[0.02] border-white/10">
                                                       <div className="flex items-center justify-center pt-2">
                                                          <InteractivePartyCard role={roleType} accepted={null} visual={null} AvatarComponent={AvatarWithEffect} />
                                                       </div>
                                                       <div className="mt-2 flex flex-col gap-1.5 w-full pb-2 px-2"></div>
                                                    </div>
                                                 );
                                              });
                                           })()}
                                        </div>
                                     </div>

                                        {/* DUAL MODE: APPLICANTS or COMPLETED RUNS */}
                                         {(!targetLobby.status || targetLobby.status === 'standby') && (
                                            <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-2 flex items-center gap-2 ${targetLobby.category === 'leveling' ? 'text-[#8a2be2]' : 'text-[#00ffff]'}`}>
                                               <Users className="w-3.5 h-3.5" />
                                               Applications ({targetLobby.applicants?.length || 0})
                                            </h3>
                                         )}
                                         <div className="flex flex-col max-h-[200px] bg-white/[0.02] border border-white/5 rounded-[2rem] p-3">
                                          {(!targetLobby.status || targetLobby.status === 'standby') ? (
                                             <>
                                                <div className="overflow-y-auto space-y-2 pr-1 custom-scrollbar flex-1">
                                                   {targetLobby.applicants?.length > 0 ? (
                                                      sortApplicants(
                                                         targetLobby.applicants.filter((app: any) => {
                                                            const key = memberIdentityKey(app);
                                                            return !(targetLobby.accepted || []).some(
                                                               (a: any) => memberIdentityKey(a) === key
                                                            );
                                                         })
                                                      ).map((app: any) => {
                                                         const profileUser = registeredUsers.find(
                                                            (u: any) => String(u.id) === String(app.applicantId || app.userId)
                                                         );
                                                         const displayName = resolveProfileDisplayName(
                                                            profileUser || { name: app.applicantName || app.name },
                                                            app.applicantName || app.name || "Applicant"
                                                         );
                                                         const profileImg = resolveProfileImage(profileUser || { name: displayName }, displayName);
                                                         const ioScore = app.roleScores?.[app.role] ?? app.score ?? 0;
                                                         const note = sanitizeApplicantNote(app.applicantNote || app.note || "");
                                                         return (
                                                         <div key={app.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-2 py-1 group hover:border-[#00ffff]/30 transition-all">
                                                            <div className="flex items-center gap-1.5 min-h-[40px]">
                                                               <div className="flex flex-col items-center shrink-0 w-[42px]">
                                                                  <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-[#00ffff]/25 bg-black/40">
                                                                     <img
                                                                        src={profileImg}
                                                                        alt=""
                                                                        className={profileImgClass(profileImg)}
                                                                     />
                                                                  </div>
                                                                  <p className="mt-0.5 text-[6px] font-black text-white truncate max-w-[68px] leading-tight text-center">{renderDualColorName(displayName)}</p>
                                                               </div>

                                                               <div className="flex items-center shrink-0" style={{ width: 54 }}>
                                                                  <img
                                                                     src={classThumbUrl(app.class)}
                                                                     alt={app.class || "Class"}
                                                                     width={96}
                                                                     height={96}
                                                                     className={`w-9 h-9 object-contain drop-shadow-md ${classIconClass()}`}
                                                                  />
                                                                  <img
                                                                     src={roleIconUrl(app.role)}
                                                                     alt={app.role || "Role"}
                                                                     width={96}
                                                                     height={96}
                                                                     className={`w-9 h-9 object-contain drop-shadow-md -ml-3 ${roleIconClass(app.role, "lg")}`}
                                                                  />
                                                               </div>

                                                               <div className="flex items-center gap-2 shrink-0">
                                                                  <div className="text-center min-w-[34px]">
                                                                     <p className="text-[7px] text-gray-400 uppercase font-black leading-none">IO</p>
                                                                     <p className="text-sm font-black text-orange-400 tabular-nums leading-tight">{ioScore}</p>
                                                                  </div>
                                                                  <div className="text-center min-w-[28px]">
                                                                     <p className="text-[7px] text-gray-400 uppercase font-black leading-none">iLvl</p>
                                                                     <p className="text-sm font-black text-[#c084fc] tabular-nums leading-tight">{app.ilvl || "—"}</p>
                                                                  </div>
                                                               </div>

                                                               <div className={`flex-1 min-w-0 rounded-lg border px-2 py-1 flex items-center ${note ? 'border-[#8a2be2]/30 bg-[#8a2be2]/10' : 'border-dashed border-white/8 bg-white/[0.02]'}`}>
                                                                  <p className={`text-[11px] leading-snug line-clamp-2 break-words font-semibold w-full ${note ? 'text-gray-100' : 'text-gray-600'}`}>
                                                                     {note || "—"}
                                                                  </p>
                                                               </div>

                                                               <div className="flex items-center shrink-0 ml-1">
                                                                  {ownerAutoAcceptActive ? (
                                                                     <span className="px-2 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest text-[#00ffff] border border-[#00ffff]/30 bg-[#00ffff]/10 whitespace-nowrap">Auto</span>
                                                                  ) : app.invitedAt && !(targetLobby.accepted || []).some((a: any) => memberIdentityKey(a) === memberIdentityKey(app)) ? (
                                                                     <InviteTimer expiresAt={app.inviteExpiresAt} onCancel={() => {
                                                                        const upd = lobbies.map(l => l.id === targetLobby.id ? { ...l, applicants: (l.applicants || []).map((a: any) => String(a.id) === String(app.id) ? { ...a, invitedAt: undefined, inviteExpiresAt: undefined, inviteNotifId: undefined } : a) } : l);
                                                                        const notifId = app.inviteNotifId;
                                                                        const updNotifs = notifId ? notifications.filter(n => n.id !== notifId) : notifications;
                                                                        setLobbies(upd); setTargetLobby(upd.find(l => l.id === targetLobby.id)); setNotifications(updNotifs);
                                                                        saveGlobalData({ lobbies: upd, notifications: updNotifs });
                                                                        addToast("Invite cancelled.", "info");
                                                                     }} />
                                                                  ) : (
                                                                     <motion.button
                                                                        onClick={() => handleAccept(app)}
                                                                        whileHover={{ scale: 1.04 }}
                                                                        whileTap={{ scale: 0.97 }}
                                                                        className="px-3 py-1.5 bg-green-500 text-black font-black rounded-lg hover:bg-green-400 transition-all text-[8px] uppercase tracking-wide whitespace-nowrap"
                                                                     >
                                                                        Invite
                                                                     </motion.button>
                                                                  )}
                                                               </div>
                                                            </div>
                                                         </div>
                                                      ); })
                                                   ) : (
                                                      <div className="h-full flex flex-col items-center justify-center opacity-20 py-10">
                                                         <Users className="w-12 h-12 mb-2" />
                                                         <p className="text-[9px] font-black uppercase tracking-widest">No Signal Detected</p>
                                                      </div>
                                                   )}
                                                </div>
                                             </>
                                          ) : (
                                             <>
                                                {(() => {
                                                   const allRuns = targetLobby.detectedRuns || [];
                                                   const totalRunPages = Math.max(1, Math.ceil(allRuns.length / RUNS_PER_PAGE));
                                                   const safePage = Math.min(runsPage, totalRunPages);
                                                   const pageRuns = allRuns.slice((safePage - 1) * RUNS_PER_PAGE, safePage * RUNS_PER_PAGE);
                                                   const resolveRunMemberVisual = (run: any) => {
                                                      const memberId = run.memberId;
                                                      const memberUser = memberId ? registeredUsers.find((u: any) => String(u.id) === String(memberId)) : null;
                                                      if (memberUser && getUserTier(memberId) === 'secret_club') {
                                                         return {
                                                            avatar: memberUser.customAvatar || memberUser.profileGif || memberUser.avatar || run.memberAvatar || '',
                                                            effect: memberUser.effect || run.memberEffect || 'none',
                                                         };
                                                      }
                                                      if (memberUser) {
                                                         return {
                                                            avatar: memberUser.avatar || run.memberAvatar || '',
                                                            effect: memberUser.effect || run.memberEffect || 'none',
                                                         };
                                                      }
                                                      return { avatar: run.memberAvatar || '', effect: run.memberEffect || 'none' };
                                                   };
                                                   return (
                                                      <>
                                                <div className="flex items-center justify-between mb-3">
                                                   <h3 className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 text-green-400">
                                                      <Zap className="w-4 h-4" />
                                                      Completed Runs ({allRuns.length})
                                                   </h3>
                                                   {totalRunPages > 1 && (
                                                      <div className="flex items-center gap-1.5">
                                                         {Array.from({ length: totalRunPages }, (_, i) => i + 1).map((pageNum) => (
                                                            <button
                                                               key={pageNum}
                                                               onClick={() => setRunsPage(pageNum)}
                                                               className={`min-w-[26px] h-[26px] rounded-lg text-[9px] font-black transition-all ${safePage === pageNum ? 'bg-green-500 text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                                                            >
                                                               {pageNum}
                                                            </button>
                                                         ))}
                                                      </div>
                                                   )}
                                                </div>
                                                <div className="space-y-2 flex-1">
                                                   {allRuns.length > 0 ? (
                                                      pageRuns.map((run: any, i: number) => {
                                                         const memberVisual = resolveRunMemberVisual(run);
                                                         return (
                                                         <div key={`${run.url || run.dungeon}-${run.mythic_level}-${i}`} className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] hover:border-green-500/40 transition-all group">
                                                            <div className="absolute inset-0 z-0 opacity-20">
                                                               {run.dungeonImg && <img src={run.dungeonImg} className="w-full h-full object-cover" alt="" />}
                                                               <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-transparent"></div>
                                                            </div>
                                                            <div className="relative z-10 px-3 py-2 flex items-center gap-3">
                                                               <AvatarWithEffect src={memberVisual.avatar} effect={memberVisual.effect} fallbackName={run.memberName || "Operative"} className="w-10 h-10 shrink-0" userId={run.memberId} />
                                                               <div className="w-9 h-9 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-black/60 flex items-center justify-center">
                                                                  {run.dungeonImg ? <img src={run.dungeonImg} className="w-full h-full object-cover" alt="" /> : <Zap className="w-4 h-4 text-gray-600" />}
                                                               </div>
                                                               <div className="min-w-0 flex-1">
                                                                  <div className="flex items-center gap-2 mb-0.5">
                                                                     <span className="text-xs font-black text-white uppercase truncate">{run.dungeonFull || run.dungeon}</span>
                                                                     <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-[#00ffff]/10 text-[#00ffff] border border-[#00ffff]/30 font-black">+{run.mythic_level}</span>
                                                                  </div>
                                                                  <div className="flex items-center gap-2 text-[7px] font-black uppercase tracking-widest">
                                                                     <span className={`flex items-center gap-1 ${(run.num_keystone_upgrades || 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                                        {(run.num_keystone_upgrades || 0) > 0 ? 'TIMED' : 'UNTIMED'}
                                                                     </span>
                                                                     {run.clear_time_ms && (
                                                                        <span className="text-gray-400">{Math.floor(run.clear_time_ms / 60000)}m {Math.floor((run.clear_time_ms % 60000) / 1000)}s</span>
                                                                     )}
                                                                     {run.completed_at && (
                                                                        <span className="text-gray-500">{new Date(run.completed_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                                     )}
                                                                  </div>
                                                               </div>
                                                            </div>
                                                         </div>
                                                      );})
                                                   ) : (
                                                      <div className="h-full flex flex-col items-center justify-center opacity-30 py-6">
                                                         <Zap className="w-10 h-10 mb-2" />
                                                         <p className="text-[9px] font-black uppercase tracking-widest mb-2">Awaiting Run Data</p>
                                                          <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest">Auto-syncing from Raider.io...</p>
                                                       </div>
                                                   )}
                                                </div>
                                                      </>
                                                   );
                                                })()}
                                             </>
                                          )}
                                        </div>
                                  </div>
                                  {/* RIGHT COLUMN: COMS & PAYMENT PROOF */}
                                   <div className="lg:col-span-6 flex flex-col gap-6 min-h-0">

                                     {/* VOICE CHANNEL SECTION */}
                                     {(() => {
                                        const voiceOpen = isVoiceLobbyOpen(targetLobby);
                                        const canJoinVoice = userCanAccessVoice(targetLobby, currentUserId);
                                        const lockLabel = voiceLobbyLockLabel(targetLobby);
                                        return (
                                     <div className={`flex flex-col rounded-[2.5rem] p-6 mb-4 border transition-all ${voiceOpen && canJoinVoice ? 'bg-white/[0.02] border-white/5' : 'bg-black/40 border-white/[0.03] opacity-80'}`}>
                                         <div className="flex items-center justify-between gap-4">
                                            <h3 className={`text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3 ${voiceOpen && canJoinVoice ? 'text-[#00ffff]' : 'text-gray-600'}`}>
                                               {voiceOpen && canJoinVoice ? (
                                                  <Radio className={`w-5 h-5 ${voiceToken ? 'animate-pulse text-[#00ffff]' : 'text-[#00ffff]/70'}`} />
                                               ) : (
                                                  <Lock className="w-5 h-5 text-gray-600" />
                                               )}
                                               Voice Link
                                            </h3>
                                            {voiceToken ? (
                                                <VoiceRoomContent roomName={targetLobby.title} onDisconnect={() => setVoiceToken(null)} inline users={registeredUsers} currentUserId={currentUserId} currentUserAvatar={session?.user?.image || ''} />
                                            ) : voiceOpen && canJoinVoice ? (
                                                  <motion.button 
                                                     whileHover={{ scale: 1.05 }}
                                                     whileTap={{ scale: 0.95 }}
                                                     onClick={() => handleJoinVoice(targetLobby.id)}
                                                     disabled={isJoiningVoice}
                                                     className={`px-6 py-2.5 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center gap-2 ${isJoiningVoice ? 'bg-white/5 text-gray-500' : 'bg-[#00ffff] text-black shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:shadow-[0_0_30px_rgba(0,255,255,0.5)]'}`}
                                                  >
                                                     {isJoiningVoice ? <Zap className="w-3 h-3 animate-spin" /> : <Phone className="w-3 h-3" />}
                                                     {isJoiningVoice ? 'Establishing...' : 'Join Channel'}
                                                  </motion.button>
                                            ) : (
                                                  <div
                                                     title={lockLabel}
                                                     className="px-6 py-2.5 rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center gap-2 bg-white/[0.03] text-gray-600 border border-white/10 cursor-not-allowed select-none"
                                                  >
                                                     <Lock className="w-3 h-3" />
                                                     {lockLabel}
                                                  </div>
                                            )}
                                         </div>
                                         {!voiceOpen && (
                                            <p className="mt-3 text-[8px] font-bold uppercase tracking-widest text-gray-600">
                                               Voice unlocks when the squad is full and the mission is in progress.
                                            </p>
                                         )}
                                     </div>
                                        );
                                     })()}

                                     {/* SECURE CHAT */}
                                      <div className="flex flex-col bg-black/60 border-2 border-white/5 rounded-[3.5rem] overflow-hidden shadow-2xl relative" style={{ height: '620px' }}>
                                         <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar" style={{ minHeight: 0 }}>
                                            {familyMessages.length === 0 ? (
                                               <div className="h-full flex flex-col items-center justify-center opacity-10">
                                                  <MessageSquare className="w-12 h-12 mb-4" />
                                                  <p className="text-[9px] font-black uppercase tracking-[0.5em]">No Intercepts</p>
                                               </div>
                                            ) : (
                                               familyMessages.map((msg: any) => {
                                                 const isMe = String(msg.fromId) === String(currentUserId) || msg.from.toLowerCase() === currentUserDisplay.toLowerCase();
                                                 const chatIdentity = resolveChatIdentity(msg.fromId, msg);
                                                 const chatAvatar = chatIdentity.avatar?.trim()
                                                    ? chatIdentity.avatar
                                                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(chatIdentity.name || "Operative")}&background=0b1020&color=00ffff&size=256&bold=true`;
                                                 return (
                                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                       <div className={`flex items-end gap-3 max-w-[95%] ${isMe ? 'flex-row-reverse' : ''}`}>
                                                          <div className="w-12 h-12 mb-1 shrink-0 rounded-full overflow-hidden border-2 border-white/10 bg-black">
                                                             <img src={chatAvatar} alt={chatIdentity.name || "Operative"} className="w-full h-full object-cover rounded-full" />
                                                          </div>
                                                          <div className={`group relative max-w-[90%] px-5 py-4 rounded-[1.5rem] ${isMe ? 'bg-[#ff007f] text-white rounded-tr-none' : 'bg-white/10 text-gray-200 rounded-tl-none border border-white/5 shadow-xl'}`}>
                                                             <p className={`text-[12px] font-black uppercase tracking-widest opacity-90 mb-2`}>{renderDualColorName(chatIdentity.name)}</p>
                                                             {msg.image && (
                                                                <div className="mb-4 rounded-xl overflow-hidden border border-white/10 max-w-full">
                                                                   <img src={msg.image} alt="transferred data" className="max-w-[300px] w-full h-auto cursor-pointer hover:scale-105 transition-transform" onClick={() => window.open(msg.image, '_blank')} />
                                                                </div>
                                                             )}
                                                             {msg.text && <p className="text-[16px] font-bold leading-relaxed">{msg.text}</p>}
                                                             <span className="absolute bottom-2 right-4 text-[9px] font-black text-white">{msg.time}</span>
                                                          </div>
                                                       </div>
                                                    </div>
                                                 );
                                              })
                                           )}
                                         </div>

                                         <div className="p-6 bg-black/80 border-t border-white/5 flex flex-col gap-4 shrink-0">
                                           {/* IMAGE PREVIEW */}
                                           {chatImagePreview && (
                                              <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#00ffff] shadow-[0_0_15px_rgba(0,255,255,0.3)]">
                                                 <img src={chatImagePreview} className="w-full h-full object-cover" />
                                                 <motion.button onClick={() => setChatImagePreview(null)} className="absolute top-1 right-1 p-1 bg-black/80 rounded-full text-white hover:text-red-500 transition-all"><X className="w-3 h-3" /></motion.button>
                                              </div>
                                           )}

                                           <div className="flex gap-3">
                                              <input
                                                 type="text"
                                                 value={chatMessage}
                                                 onChange={(e) => setChatMessage(e.target.value)}
                                                 onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(targetLobby.id)}
                                                 onPaste={(e) => {
                                                    const items = e.clipboardData?.items;
                                                    if (!items) return;
                                                    for (let i = 0; i < items.length; i++) {
                                                       if (items[i].type.indexOf("image") !== -1) {
                                                          const blob = items[i].getAsFile();
                                                          const reader = new FileReader();
                                                          reader.onload = (event) => setChatImagePreview(event.target?.result as string);
                                                          if (blob) reader.readAsDataURL(blob);
                                                       }
                                                    }
                                                 }}
                                                 placeholder="Transmit signal..."
                                                 className="flex-1 bg-white/5 border-2 border-white/10 rounded-2xl px-5 py-4 text-xs font-bold outline-none focus:border-[#00ffff]/60 transition-all text-white"
                                              />
                                              <motion.button onClick={() => handleSendMessage(targetLobby.id)} className="px-6 bg-[#00ffff] text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all">Send</motion.button>
                                           </div>
                                        </div>
                                     </div>
                                 </div>
                              </div>
                           </div>
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
                                 {/* SCAM REPORT - Hold to Confirm Modal (Inside thread) */}
                                 {reportScamTarget && (
                                    <div className="absolute inset-0 z-[999] flex items-center justify-center bg-black/85 backdrop-blur-sm rounded-[3.5rem]" style={{ pointerEvents: 'auto' }} onClick={() => { setReportScamTarget(null); }}>
                                       <div className="bg-[#05050a] border-2 border-[#ff007f]/50 p-8 rounded-3xl max-w-sm w-full shadow-2xl text-center" style={{ pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
                                          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
                                             <ShieldAlert className="w-8 h-8 text-red-500" />
                                          </div>
                                          <h3 className="text-xl font-black text-white mb-2 uppercase tracking-wider">CONFIRM SCAM REPORT</h3>
                                          <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mb-2">WARNING: SUSPENSION PROTOCOL</p>
                                          <p className="text-gray-200 text-[11px] font-black uppercase tracking-tight leading-relaxed mb-6">
                                             Reporting this offer will <span className="text-white underline decoration-red-500 decoration-2">immediately suspend</span> both the poster's account and your account pending a manual review by support.
                                          </p>
                                          
                                          <div
                                             onMouseDown={() => {
                                                setHoldProgress(0);
                                                const startTime = Date.now();
                                                const duration = 5000;
                                                if (holdTimerRef.current) clearInterval(holdTimerRef.current);
                                                holdTimerRef.current = setInterval(() => {
                                                   const elapsed = Date.now() - startTime;
                                                   const pct = Math.min(100, (elapsed / duration) * 100);
                                                   setHoldProgress(pct);
                                                   if (pct >= 100) {
                                                      clearInterval(holdTimerRef.current);
                                                      holdTimerRef.current = null;
                                                      const ownerHandle = reportScamTarget.ownerHandle || reportScamTarget.ownerDiscordName;
                                                      const isAdminOwner = ownerHandle === "minhonovazen" || String(reportScamTarget.ownerId) === "1497295886223544471";
                                                      if (isAdminOwner) {
                                                         if (currentUserDiscordHandle) {
                                                            const updatedBanned = [...bannedUsers, currentUserDiscordHandle];
                                                            setBannedUsers(updatedBanned);
                                                            saveGlobalData({ bannedUsers: updatedBanned });
                                                         }
                                                         addToast("Report submitted. Reporter suspended.", "success");
                                                      } else {
                                                         if (ownerHandle && ownerHandle !== currentUserDiscordHandle) {
                                                            const updatedBanned = [...bannedUsers, ownerHandle];
                                                            setBannedUsers(updatedBanned);
                                                            saveGlobalData({ bannedUsers: updatedBanned });
                                                         }
                                                         const newNotifications = [...notifications, { id: Date.now(), toUser: ownerHandle, message: "Your offer was reported as a scam. Your account is suspended pending review.", type: "system_alert" }];
                                                         setNotifications(newNotifications);
                                                         saveGlobalData({ notifications: newNotifications });
                                                         addToast("Report submitted. Owner suspended.", "success");
                                                      }
                                                      setReportScamTarget(null);
                                                      setHoldProgress(0);
                                                   }
                                                }, 30);
                                             }}
                                             onMouseUp={() => {
                                                if (holdTimerRef.current) { clearInterval(holdTimerRef.current); holdTimerRef.current = null; }
                                                setHoldProgress(0);
                                             }}
                                             onMouseLeave={() => {
                                                if (holdTimerRef.current) { clearInterval(holdTimerRef.current); holdTimerRef.current = null; }
                                                setHoldProgress(0);
                                             }}
                                             className={`relative w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all cursor-pointer overflow-hidden select-none border ${holdProgress > 0 ? 'bg-black text-white border-red-500' : 'bg-red-600/10 text-red-500 hover:bg-red-600/20 hover:text-white border-red-500/30'}`}
                                             style={{
                                                transform: holdProgress > 0 ? `translate(${(Math.random() - 0.5) * (holdProgress / 15)}px, ${(Math.random() - 0.5) * (holdProgress / 15)}px)` : 'none'
                                             }}
                                          >
                                             {/* The Filling Progress Bar - FORCE VISIBLE */}
                                             <div 
                                                style={{ 
                                                   position: 'absolute',
                                                   top: 0,
                                                   left: 0,
                                                   bottom: 0,
                                                   width: `${holdProgress}%`, 
                                                   background: 'linear-gradient(90deg, #7f1d1d, #ef4444)',
                                                   zIndex: 1,
                                                   transition: 'width 30ms linear'
                                                }} 
                                             />

                                             <span className="relative z-10 flex items-center justify-center gap-2 font-black transition-all" style={{
                                                letterSpacing: `${0.2 + (holdProgress / 100) * 0.4}em`,
                                                filter: holdProgress > 70 ? 'drop-shadow(0 0 12px #fff)' : 'none',
                                                zIndex: 2
                                             }}>
                                                <ShieldAlert className={`w-4 h-4 ${holdProgress > 80 ? 'animate-bounce' : ''}`} />
                                                {holdProgress > 90 ? 'RELEASING SIGNAL...' : holdProgress > 0 ? 'CALIBRATING...' : 'HOLD TO CONFIRM'}
                                             </span>
                                          </div>
                                          <div className="flex gap-4 mt-4">
                                             <button onClick={() => setReportScamTarget(null)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase text-xs rounded-xl transition-all tracking-widest border border-white/10">CANCEL</button>
                                          </div>
                                       </div>
                                    </div>
                                 )}
                                 </motion.div>
                          </motion.div>
                       )}
                </AnimatePresence>
              );
};

export default ManageModal;
