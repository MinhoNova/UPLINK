"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X, Settings, ChevronDown, Key, Coins, Lock, Zap, TrendingUp, Shield, Eye, MessageSquare } from "lucide-react";
import { usePage } from "@/contexts/PageContext";
import ClassRoleIcons from "@/components/ClassRoleIcons";
import { sanitizeApplicantNote } from "@/lib/applicantNote";
import AutoAcceptTimer from "@/components/AutoAcceptTimer";
import SecretClubCard from "@/components/SecretClubCard";

interface AutoApplySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  myVfxBg: string;
  isApplyModalOpen: boolean;
  targetLobby: any;
  autoApplyCategory: string;
  setAutoApplyCategory: (v: string) => void;
  showKeyDropdown: boolean;
  setShowKeyDropdown: (v: boolean) => void;
  autoApplyKey: string | null;
  setAutoApplyKey: (v: string | null) => void;
  DUNGEONS: any[];
  resolveDungeonSelection: (key?: string | null) => any;
  autoApplyKeyLevel: number;
  setAutoApplyKeyLevel: (v: number) => void;
  autoApplyDropLevel: number;
  setAutoApplyDropLevel: (v: number) => void;
  applyNote: string;
  setApplyNote: (v: string) => void;
  autoApplyMinGold: number;
  setAutoApplyMinGold: (v: number) => void;
  myCharacters: any[];
  CLASS_ROLE_OPTIONS: any;
  setMyCharacters: (v: any) => void;
  globalCharacters: any[];
  setGlobalCharacters: (v: any) => void;
  saveGlobalData: (v: any) => void;
  showCharacterDropdown: boolean;
  setShowCharacterDropdown: (v: boolean) => void;
  handleApply: (e: any) => void;
  autoApplyCharId: string | null;
  setAutoApplyCharId: (v: string | null) => void;
  autoAcceptEnabled: boolean;
  setAutoAcceptEnabled: (v: boolean) => void;
  autoAcceptEndTime: number;
  setAutoAcceptEndTime: (v: number) => void;
  AUTO_ACCEPT_DURATION_MS: number;
  addToast: (msg: string, type?: "success" | "error" | "info") => void;
  getUserTier: (id: string) => string;
  currentUserId: string;
  hiddenIdentity: boolean;
  setHiddenIdentity: (v: boolean) => void;
  registeredUsers: any[];
  setRegisteredUsers: (v: any) => void;
  autoFeaturesLocked?: boolean;
  onToggleAutoAccept?: (enabled: boolean) => void;
}

const AutoApplySettingsModal = ({
  isOpen,
  onClose,
  myVfxBg,
  isApplyModalOpen,
  targetLobby,
  autoApplyCategory,
  setAutoApplyCategory,
  showKeyDropdown,
  setShowKeyDropdown,
  autoApplyKey,
  setAutoApplyKey,
  DUNGEONS,
  resolveDungeonSelection,
  autoApplyKeyLevel,
  setAutoApplyKeyLevel,
  autoApplyDropLevel,
  setAutoApplyDropLevel,
  applyNote,
  setApplyNote,
  autoApplyMinGold,
  setAutoApplyMinGold,
  myCharacters,
  CLASS_ROLE_OPTIONS,
  setMyCharacters,
  globalCharacters,
  setGlobalCharacters,
  saveGlobalData,
  showCharacterDropdown,
  setShowCharacterDropdown,
  handleApply,
  autoApplyCharId,
  setAutoApplyCharId,
  autoAcceptEnabled,
  setAutoAcceptEnabled,
  autoAcceptEndTime,
  setAutoAcceptEndTime,
  AUTO_ACCEPT_DURATION_MS,
  addToast,
  getUserTier,
  currentUserId,
  hiddenIdentity,
  setHiddenIdentity,
  registeredUsers,
  setRegisteredUsers,
  autoFeaturesLocked = false,
  onToggleAutoAccept,
}: AutoApplySettingsModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-6xl max-h-[92vh] overflow-y-auto bg-[#0a0a16]/45 border-2 border-[#00ffff]/40 rounded-[2rem] p-5 md:p-7 shadow-2xl relative backdrop-blur-[6px]">
               {myVfxBg && <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none z-0" style={{ backgroundImage: `url(${myVfxBg})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.28 }} />}
                  <motion.button onClick={() => { onClose(); }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="absolute top-6 right-6 p-3 bg-red-500/15 hover:bg-red-500/30 border border-red-500/30 rounded-full z-50 transition-all"><X className="text-red-400 w-4 h-4" /></motion.button>
                                <div className="relative z-10 mb-6 flex items-start gap-4 pr-12">
                                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#00ffff]/30 bg-[#00ffff]/10 shadow-[0_0_20px_rgba(0,255,255,0.16)]">
                                     <Settings className="h-6 w-6 text-[#00ffff]" />
                                  </div>
                                   <div className="flex-1">
                                      <div className="flex items-start gap-6">
                                          <div>
                                             <h2 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-[#00ffff]">Auto-Apply Control</h2>
                                             <p className="mt-1 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                                                {isApplyModalOpen && targetLobby
                                                   ? "Manual deployment to selected offer"
                                                   : "Key, character, role and Secret Club automation"}
                                             </p>
                                          </div>
                                         <div className="flex gap-2 shrink-0 mt-1">
                                         {[
                                            { value: 'dungeon', label: 'Dungeons', color: '#00ffff', icon: 'Zap' },
                                            { value: 'leveling', label: 'Leveling', color: '#8a2be2', icon: 'TrendingUp' },
                                         ].map(cat => {
                                            const Icon = cat.icon === 'Zap' ? Zap : cat.icon === 'TrendingUp' ? TrendingUp : Shield;
                                            const isActive = autoApplyCategory === cat.value;
                                            return (
                                               <motion.button key={cat.value} onClick={() => setAutoApplyCategory(cat.value)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className={`relative overflow-hidden text-[10px] font-black uppercase tracking-widest rounded-xl px-4 py-2.5 transition-all flex items-center gap-2 ${isActive ? 'text-white shadow-lg' : 'text-gray-400 hover:text-white border border-[#00d4ff]/10 bg-black/40'}`}
                                                  style={isActive ? { background: `linear-gradient(135deg, ${cat.color}33, ${cat.color}15)`, borderColor: cat.color, borderWidth: '1px', boxShadow: `0 0 20px ${cat.color}22` } : {}}
                                               >
                                                  <Icon className="w-3.5 h-3.5" style={{ color: isActive ? cat.color : undefined }} />
                                                  {cat.label}
                                               </motion.button>
                                            );
                                         })}
                                      </div>
                                       </div>
                                   </div>
                               </div>
                             <h2 className="hidden">
                                ⚙️ Auto-Apply Settings
                             </h2>
                             <p className="hidden">Configure your automated deployment rules</p>
                               <div className="grid grid-cols-1 gap-5">
                              <div className="space-y-5">

                             {/* KEY SELECTOR — CUSTOM DROPDOWN WITH IMAGE + NAME */}
                             <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block">Your Key (Optional — select a dungeon or choose No Key)</label>
                                <div className="relative">
                                   <button onClick={() => { setShowCharacterDropdown(false); setShowKeyDropdown(!showKeyDropdown); }} className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3 text-white font-black text-sm outline-none focus:border-[#00ffff]/50 transition-all flex items-center gap-3 hover:border-[#00ffff]/30">
                                      {autoApplyKey ? (
                                         <img src={resolveDungeonSelection(autoApplyKey)?.img} alt={resolveDungeonSelection(autoApplyKey)?.name || "Selected dungeon"} className="w-12 h-12 rounded-xl object-cover border border-[#00ffff]/30" />
                                      ) : (
                                         <>
                                         <div className="w-12 h-12 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center"><Key className="w-5 h-5 text-gray-500" /></div>
                                         <div className="hidden">
                                         <div className="w-8 h-8 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center"><span className="text-sm text-gray-500 font-black">Ø</span></div>
                                         </div>
                                         </>
                                      )}
                                       <span className="flex-1 text-left">{autoApplyKey ? resolveDungeonSelection(autoApplyKey)?.name : 'No Key'}</span>
                                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showKeyDropdown ? 'rotate-180' : ''}`} />
                                   </button>
                                   {showKeyDropdown && (
                                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#0a0a16] border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl max-h-[360px] overflow-y-auto custom-scrollbar">
                                         <button onClick={() => { setAutoApplyKey(null); setShowKeyDropdown(false); }} className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-black transition-all hover:bg-white/5 ${!autoApplyKey ? 'bg-[#00ffff]/10 text-[#00ffff]' : 'text-gray-400'}`}>
                                            <div className="w-8 h-8 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center"><Key className="w-4 h-4 text-gray-500" /></div>
                                            <div className="hidden">
                                            <div className="w-8 h-8 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center"><span className="text-sm text-gray-500 font-black">Ø</span></div>
                                            </div>
                                            No Key
                                         </button>
                                         {DUNGEONS.map(d => (
                                            <button key={d.short} onClick={() => { setAutoApplyKey(d.name); setShowKeyDropdown(false); }} className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-black transition-all hover:bg-white/5 ${resolveDungeonSelection(autoApplyKey)?.name === d.name ? 'bg-[#00ffff]/10 text-[#00ffff]' : 'text-white'}`}>
                                               <img src={d.img} alt={d.name} className="w-8 h-8 rounded-lg object-cover border border-white/10" />
                                               {d.name}
                                            </button>
                                         ))}
                                      </div>
                                   )}
                                </div>
                             </div>

                               {/* KEY LEVEL, DROP LEVEL & MIN GOLD - SQUARE ROW */}
                               <div className="flex items-stretch gap-2">
                                   <div className="flex-1 flex flex-col items-center bg-gradient-to-br from-white/[0.04] to-transparent rounded-xl p-2 min-w-0">
                                        <label className="text-[7px] font-black text-[#00d4ff] uppercase tracking-widest mb-1">Key Level</label>
                                       <div className="flex items-center justify-between w-full gap-1">
                                          <button onClick={() => setAutoApplyKeyLevel(Math.max(2, autoApplyKeyLevel - 1))} className="w-7 h-7 flex items-center justify-center bg-[#ff007f] hover:bg-[#ff3399] rounded-lg transition-all text-white font-black text-sm leading-none hover:scale-110 active:scale-90 shadow-[0_0_8px_rgba(255,0,127,0.3)]">−</button>
                                          <span className="text-[#00d4ff] font-black text-sm text-center tabular-nums">{autoApplyKeyLevel}</span>
                                          <button onClick={() => setAutoApplyKeyLevel(Math.min(30, autoApplyKeyLevel + 1))} className="w-7 h-7 flex items-center justify-center bg-[#00ffff] hover:bg-[#66eeff] rounded-lg transition-all text-black font-black text-sm leading-none hover:scale-110 active:scale-90 shadow-[0_0_8px_rgba(0,255,255,0.3)] border border-[#00ffff]/60">+</button>
                                       </div>
                                   </div>
                                   <div className="flex-1 flex flex-col items-center bg-gradient-to-br from-white/[0.04] to-transparent rounded-xl p-2 min-w-0">
                                        <label className="text-[7px] font-black text-[#00d4ff] uppercase tracking-widest mb-1">Can Drop To</label>
                                       <div className="flex items-center justify-between w-full gap-1">
                                          <button onClick={() => setAutoApplyDropLevel(Math.max(2, autoApplyDropLevel - 1))} className="w-7 h-7 flex items-center justify-center bg-[#ff007f] hover:bg-[#ff3399] rounded-lg transition-all text-white font-black text-sm leading-none hover:scale-110 active:scale-90 shadow-[0_0_8px_rgba(255,0,127,0.3)]">−</button>
                                          <span className="text-[#00d4ff] font-black text-sm text-center tabular-nums">{autoApplyDropLevel}</span>
                                          <button onClick={() => setAutoApplyDropLevel(Math.min(30, autoApplyDropLevel + 1))} className="w-7 h-7 flex items-center justify-center bg-[#00ffff] hover:bg-[#66eeff] rounded-lg transition-all text-black font-black text-sm leading-none hover:scale-110 active:scale-90 shadow-[0_0_8px_rgba(0,255,255,0.3)] border border-[#00ffff]/60">+</button>
                                       </div>
                                   </div>
                                   <div className="flex-1 flex flex-col items-center bg-gradient-to-br from-white/[0.04] to-transparent rounded-xl p-2 min-w-0">
                                       <div className="flex items-center gap-1 mb-1">
                                          <Coins className="w-3 h-3 text-yellow-500" />
                                          <label className="text-[7px] font-black text-[#00d4ff] uppercase tracking-widest">Min Gold</label>
                                       </div>
                                       <div className="flex items-center justify-between w-full gap-1">
                                          <button onClick={() => setAutoApplyMinGold(Math.max(0, autoApplyMinGold - 1))} className="w-7 h-7 flex items-center justify-center bg-[#ff007f] hover:bg-[#ff3399] rounded-lg transition-all text-white font-black text-sm leading-none hover:scale-110 active:scale-90 shadow-[0_0_8px_rgba(255,0,127,0.3)]">−</button>
                                          <span className="text-yellow-500 font-black text-sm text-center tabular-nums">{autoApplyMinGold}</span>
                                          <button onClick={() => setAutoApplyMinGold(autoApplyMinGold + 1)} className="w-7 h-7 flex items-center justify-center bg-[#00ffff] hover:bg-[#66eeff] rounded-lg transition-all text-black font-black text-sm leading-none hover:scale-110 active:scale-90 shadow-[0_0_8px_rgba(0,255,255,0.3)] border border-[#00ffff]/60">+</button>
                                       </div>
                                   </div>
                               </div>

                              {/* CHARACTER + NOTE side by side */}
                              {(() => {
                                 const selectedAutoChar = myCharacters.find(c => String(c.id) === String(autoApplyCharId)) || myCharacters[0];
                                 const ioScore = selectedAutoChar?.roleScores?.[selectedAutoChar.role] ?? selectedAutoChar?.score ?? 0;
                                 const switchCharRole = (char: any) => {
                                    const roles = CLASS_ROLE_OPTIONS[char.class] || ['dps'];
                                    const idx = roles.indexOf(char.role);
                                    const newRole = roles[(idx + 1) % roles.length];
                                    const updated = myCharacters.map(c => c.id === char.id ? { ...c, role: newRole } : c);
                                    setMyCharacters(updated);
                                    const updatedGlobal = globalCharacters.map(c => c.id === char.id ? { ...c, role: newRole } : c);
                                    setGlobalCharacters(updatedGlobal);
                                    saveGlobalData({ characters: updatedGlobal });
                                 };

                                 return (
                                    <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-3 items-stretch">
                                       <div className="flex flex-col">
                                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                             <MessageSquare className="w-3.5 h-3.5 text-[#8a2be2]" />
                                             Application Note
                                          </label>
                                          <textarea
                                             value={applyNote}
                                             onChange={(e) => setApplyNote(sanitizeApplicantNote(e.target.value))}
                                             placeholder="Optional note for the offer owner..."
                                             rows={2}
                                             className="min-h-[52px] w-full bg-black/50 border border-white/10 rounded-2xl px-3 py-2 text-white text-sm font-medium outline-none focus:border-[#8a2be2]/50 transition-all resize-none placeholder:text-gray-600"
                                          />
                                          <p className="mt-1 text-right text-[8px] font-black uppercase tracking-widest text-gray-600">{applyNote.length}/200</p>
                                       </div>

                                       <div className="flex flex-col">
                                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Select Character</label>
                                          {myCharacters.length === 0 ? (
                                             <div className="p-3 bg-white/5 rounded-xl text-center flex items-center justify-center min-h-[52px]">
                                                <p className="text-[10px] font-black text-gray-500 uppercase">No characters linked. Sync via Raider.io first.</p>
                                             </div>
                                          ) : (
                                             <div className="relative flex flex-col">
                                                <div className="flex gap-2 items-center">
                                                   <button type="button" onClick={() => { setShowKeyDropdown(false); setShowCharacterDropdown(!showCharacterDropdown); }} className="flex-1 bg-black/50 border border-white/10 rounded-2xl px-3 py-2 text-white font-black text-sm outline-none focus:border-[#00ffff]/50 transition-all flex items-center gap-3 hover:border-[#00ffff]/30 min-h-[52px]">
                                                      <ClassRoleIcons className={selectedAutoChar.class} role={selectedAutoChar.role} size={38} overlap={12} />
                                                      <div className="min-w-0 flex-1 text-left">
                                                         <p className="text-sm font-black truncate leading-tight">{selectedAutoChar.name}</p>
                                                         <p className="text-[8px] text-[#00ffff] font-black uppercase tracking-widest truncate mt-0.5">{selectedAutoChar.region}-{selectedAutoChar.realm}</p>
                                                      </div>
                                                      <div className="flex items-center gap-2.5 shrink-0">
                                                         <div className="text-center">
                                                            <p className="text-[7px] text-gray-500 uppercase font-black">IO</p>
                                                            <p className="text-xs font-black text-orange-400 tabular-nums">{ioScore}</p>
                                                         </div>
                                                         <div className="text-center">
                                                            <p className="text-[7px] text-gray-500 uppercase font-black">iLvl</p>
                                                            <p className="text-xs font-black text-[#a335ee] tabular-nums">{selectedAutoChar.ilvl}</p>
                                                         </div>
                                                         <div className="w-3 h-3 rounded-full bg-[#00ffff] shadow-[0_0_10px_rgba(0,255,255,0.5)] shrink-0" />
                                                      </div>
                                                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${showCharacterDropdown ? 'rotate-180' : ''}`} />
                                                   </button>
                                                   {isApplyModalOpen && (
                                                      <motion.button
                                                         whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(0,255,255,0.3)" }}
                                                         whileTap={{ scale: 0.98 }}
                                                         onClick={(e: any) => handleApply(e)}
                                                         className="px-5 h-[52px] bg-[#00ffff]/10 text-[#00ffff] border border-[#00ffff]/30 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#00ffff] hover:text-black transition-all shrink-0"
                                                      >
                                                         APPLY
                                                      </motion.button>
                                                   )}
                                                </div>
                                                {showCharacterDropdown && (
                                                   <div className="absolute top-full left-0 right-0 mt-1 bg-[#0a0a16] border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl max-h-[240px] overflow-y-auto custom-scrollbar">
                                                      {myCharacters.map(char => {
                                                         const isSelected = String(autoApplyCharId) === String(char.id);
                                                         return (
                                                            <div key={char.id} onClick={() => { setAutoApplyCharId(char.id); setShowCharacterDropdown(false); }} className={`p-3 transition-all flex items-center justify-between cursor-pointer ${isSelected ? 'bg-[#00ffff]/10 text-[#00ffff]' : 'text-white hover:bg-white/5'}`}>
                                                               <div className="flex items-center gap-3 min-w-0">
                                                                  <ClassRoleIcons
                                                                     className={char.class}
                                                                     role={char.role}
                                                                     size={46}
                                                                     overlap={14}
                                                                     onRoleClick={(e) => { e.stopPropagation(); switchCharRole(char); }}
                                                                  />
                                                                  <div className="min-w-0">
                                                                     <p className="font-black text-sm leading-none truncate">{char.name}</p>
                                                                     <p className="text-[8px] text-[#00ffff] font-black uppercase tracking-widest mt-1 truncate">{char.region}-{char.realm}</p>
                                                                  </div>
                                                               </div>
                                                               <div className="flex items-center gap-3 shrink-0">
                                                                  <div className="text-center">
                                                                     <p className="text-[7px] text-gray-500 uppercase font-black">iLvl</p>
                                                                     <p className="text-xs font-black text-[#a335ee]">{char.ilvl}</p>
                                                                  </div>
                                                                  <div className="text-center">
                                                                     <p className="text-[7px] text-gray-500 uppercase font-black">IO</p>
                                                                     <p className="text-xs font-black text-orange-400">{char.roleScores?.[char.role] ?? char.score}</p>
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
                                    </div>
                                 );
                              })()}

                               </div>
                                  <div className="grid grid-cols-2 gap-5">

                                  {(() => {
                                     const canUseSecret = getUserTier(currentUserId) === "secret_club";
                                     const aaOn = canUseSecret && autoAcceptEnabled;
                                      return (
                                          <div className={`rounded-2xl p-5 transition-all duration-500 flex flex-col backdrop-blur-[6px] border ${
                                             !canUseSecret
                                                ? 'bg-black/10 border-white/5 opacity-50 grayscale'
                                                : aaOn
                                                   ? 'bg-[#00ffff]/[0.03] border-[#00ffff]/25 shadow-[0_0_25px_rgba(0,255,255,0.06)]'
                                                   : 'bg-black/10 border-white/8 opacity-70'
                                          }`}>
                                             <div className="flex items-center gap-4 mb-4">
                                                     <motion.button
                                                       disabled={!canUseSecret || autoFeaturesLocked}
                                                       onClick={() => {
                                                          if (!canUseSecret) return addToast("Secret Club feature. Upgrade to unlock.", "error");
                                                          if (autoFeaturesLocked) return addToast("Leave your current offer before enabling Auto-Accept.", "error");
                                                          if (onToggleAutoAccept) {
                                                             onToggleAutoAccept(!autoAcceptEnabled);
                                                             if (!autoAcceptEnabled) addToast("Auto-Accept activated for 10 minutes!", "success");
                                                             return;
                                                          }
                                                          if (autoAcceptEnabled) {
                                                             setAutoAcceptEnabled(false);
                                                             setAutoAcceptEndTime(0);
                                                             localStorage.setItem("uplink_auto_accept_end", "0");
                                                          } else {
                                                             const end = Date.now() + AUTO_ACCEPT_DURATION_MS;
                                                             setAutoAcceptEndTime(end);
                                                             setAutoAcceptEnabled(true);
                                                             localStorage.setItem("uplink_auto_accept_end", end.toString());
                                                             addToast("Auto-Accept activated for 10 minutes!", "success");
                                                          }
                                                       }}
                                                       whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.85 }}
                                                       className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-500 ${
                                                          !canUseSecret || autoFeaturesLocked
                                                             ? 'cursor-not-allowed opacity-30 bg-black/15'
                                                             : aaOn
                                                                ? 'bg-black/15 border border-[#00ffff]/30'
                                                                : 'bg-black/10 border border-white/10 opacity-60'
                                                       }`}>
                                                       {!canUseSecret ? <Lock className="h-5 w-5 text-gray-500" /> : <Zap className="h-5 w-5 transition-colors duration-500" style={{ color: aaOn ? '#00ffff' : 'rgba(255,255,255,0.35)' }} />}
                                                    </motion.button>
                                                    <div>
                                                       <h3 className={`text-xs font-black uppercase tracking-widest transition-colors duration-500 ${aaOn ? 'text-[#00ffff]' : canUseSecret ? 'text-white/35' : 'text-white/25'}`}>Auto-Accept</h3>
                                                       <p className={`mt-1 text-[9px] font-black uppercase tracking-widest transition-colors duration-500 ${aaOn ? 'text-gray-400' : canUseSecret ? 'text-white/25' : 'text-white/20'}`}>{canUseSecret ? '10 minute session, renewable' : 'Secret Club only'}</p>
                                                    </div>
                                                 </div>
                                                 <div className={`flex flex-1 rounded-2xl p-5 min-h-[17.5rem] transition-all duration-500 border ${
                                                    !canUseSecret
                                                       ? 'bg-black/10 border-white/5'
                                                       : aaOn
                                                          ? 'bg-white/[0.02] border-[#00ffff]/15 shadow-[0_0_25px_rgba(0,212,255,0.06)]'
                                                          : 'bg-black/10 border-white/6 opacity-55'
                                                 }`}>
                                                    <div className="flex h-full w-full items-center gap-8">
                                                       <div className="flex-1 min-w-0 space-y-3">
                                                      <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest">
                                                         <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all duration-500 ${aaOn ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/30'}`}>{aaOn ? '✓' : '○'}</div>
                                                         <span className={`transition-colors duration-500 ${aaOn ? 'text-green-400' : 'text-white/35'}`}>Auto-invite applicants</span>
                                                      </div>
                                                      <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest">
                                                         <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all duration-500 ${aaOn ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/30'}`}>{aaOn ? '✓' : '○'}</div>
                                                         <span className={`transition-colors duration-500 ${aaOn ? 'text-green-400' : 'text-white/35'}`}>10 minute session, renewable</span>
                                                      </div>
                                                       </div>
                                                 <div className="shrink-0 flex flex-col items-center gap-2">
                                                    <div className={`text-[7px] font-black uppercase tracking-widest transition-colors duration-500 ${aaOn ? 'text-[#00ffff]' : 'text-white/25'}`}>{aaOn ? 'TIMER' : 'INACTIVE'}</div>
                                                 <div className={`rounded-xl overflow-hidden transition-all duration-500 border ${aaOn ? 'bg-black/15 border-[#00ffff]/12' : 'bg-black/15 border-white/5 opacity-50'}`}>
                                                    {autoAcceptEnabled && canUseSecret ? (
                                                       <div className="p-3 space-y-2">
                                                          <AutoAcceptTimer endTime={autoAcceptEndTime} showBar onExpire={() => { setAutoAcceptEnabled(false); setAutoAcceptEndTime(0); addToast("Auto-Accept session expired.", "info"); }} />
                                                          <button onClick={() => { const end = Date.now() + AUTO_ACCEPT_DURATION_MS; setAutoAcceptEndTime(end); localStorage.setItem("uplink_auto_accept_end", end.toString()); addToast("Auto-Accept renewed for another 10 minutes!", "success"); }} className="w-full rounded-xl bg-[#00ffff] py-2 text-[9px] font-black uppercase tracking-widest text-black shadow-[0_0_20px_rgba(0,255,255,0.35)] transition-all hover:shadow-[0_0_40px_rgba(0,255,255,0.6)] hover:brightness-110 flex items-center justify-center gap-2"><Zap className="w-3 h-3" /> Renew</button>
                                                       </div>
                                                    ) : canUseSecret ? (
                                                       <div className="flex items-center justify-center w-32 h-10 px-3">
                                                          <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/10">
                                                             <div className="absolute inset-0 rounded-full bg-white/15" />
                                                          </div>
                                                       </div>
                                                    ) : (
                                                       <div className="flex items-center justify-center w-16 h-20">
                                                          <Lock className="w-6 h-6 text-gray-500" />
                                                       </div>
                                                     )}
                                                 </div>
                                              </div>
                                           </div>
                                         </div>
                                      </div>
                                      );
                                   })()}

                                  {(() => {
                                    const canUseSecret = getUserTier(currentUserId) === "secret_club";
                                    const hiOn = canUseSecret && hiddenIdentity;
                                    return (
                                         <div className={`rounded-2xl p-5 transition-all duration-500 flex flex-col backdrop-blur-[6px] border ${
                                            !canUseSecret
                                               ? 'bg-black/10 border-white/5 opacity-50 grayscale'
                                               : hiOn
                                                  ? 'bg-[#ff007f]/[0.03] border-[#ff007f]/20 shadow-[0_0_25px_rgba(255,0,127,0.05)]'
                                                  : 'bg-black/10 border-white/8 opacity-70'
                                         }`}>
                                           <div className="flex items-center gap-4 mb-4">
                                              <motion.button
                                                 disabled={!canUseSecret}
                                                 onClick={() => {
                                                    if (!canUseSecret) return addToast("Secret Club feature. Upgrade to unlock.", "error");
                                                    const newVal = !hiddenIdentity;
                                                    setHiddenIdentity(newVal);
                                                    localStorage.setItem("uplink_hidden_identity", newVal.toString());
                                                    const userIdx = registeredUsers.findIndex((u: any) => String(u.id) === String(currentUserId));
                                                    if (userIdx !== -1) {
                                                       const updatedUsers = [...registeredUsers];
                                                       updatedUsers[userIdx] = { ...updatedUsers[userIdx], hiddenIdentity: newVal };
                                                       setRegisteredUsers(updatedUsers);
                                                       saveGlobalData({ registeredUsers: updatedUsers });
                                                    }
                                                    addToast(newVal ? "Identity hidden." : "Identity visible.", "success");
                                                 }}
                                                 whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.85 }}
                                                 className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-500 shrink-0 ${
                                                    !canUseSecret
                                                       ? 'cursor-not-allowed opacity-30 bg-black/15'
                                                       : hiOn
                                                          ? 'bg-black/15 border border-[#ff007f]/30'
                                                          : 'bg-black/10 border border-white/10 opacity-60'
                                                 }`}
                                              >
                                                 {canUseSecret ? <Eye className={`h-5 w-5 transition-colors duration-500 ${hiOn ? 'text-[#ff007f]' : 'text-white/35'}`} /> : <Lock className="h-5 w-5 text-gray-500" />}
                                              </motion.button>
                                              <div>
                                                 <div className="flex items-center gap-2">
                                                    <h3 className={`text-xs font-black uppercase tracking-widest transition-colors duration-500 ${hiOn ? 'text-white' : canUseSecret ? 'text-white/35' : 'text-white/25'}`}>Hidden Identity</h3>
                                                    {hiOn && <span className="px-2 py-0.5 rounded-md bg-[#ff007f]/20 text-[8px] font-black uppercase tracking-widest text-[#ff007f]">Hidden</span>}
                                                 </div>
                                                 <p className={`mt-1 text-[9px] font-black uppercase tracking-widest transition-colors duration-500 ${hiOn ? 'text-gray-500' : canUseSecret ? 'text-white/25' : 'text-white/20'}`}>{canUseSecret ? 'HIDE YOUR INFO FROM OTHER PLAYERS' : 'Secret Club only'}</p>
                                              </div>
                                           </div>
                                          {canUseSecret && (
                                              <div className={`rounded-2xl p-5 transition-all duration-500 border ${
                                                 hiOn
                                                    ? 'bg-white/[0.02] border-[#ff007f]/12 shadow-[0_0_25px_rgba(255,0,127,0.05)]'
                                                    : 'bg-black/10 border-white/6 opacity-55'
                                              }`}>
                                                 <div className="flex items-center gap-8">
                                                    <div className="flex-1 min-w-0 space-y-4">
                                                          <div className="space-y-3">
                                                          <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest">
                                                             <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all duration-500 ${hiOn ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/30'}`}>{hiOn ? '✓' : '○'}</div>
                                                              <span className={`transition-colors duration-500 ${hiOn ? 'text-green-400' : 'text-white/35'}`}>Username hidden in party card</span>
                                                          </div>
                                                          <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest">
                                                             <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all duration-500 ${hiOn ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/30'}`}>{hiOn ? '✓' : '○'}</div>
                                                             <span className={`whitespace-nowrap transition-colors duration-500 ${hiOn ? 'text-green-400' : 'text-white/35'}`}>Avatar replaced by Secret Card</span>
                                                          </div>
                                                          <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest">
                                                             <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all duration-500 ${hiOn ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/30'}`}>{hiOn ? '✓' : '○'}</div>
                                                             <span className={`whitespace-nowrap transition-colors duration-500 ${hiOn ? 'text-green-400' : 'text-white/35'}`}>Hidden from all players viewing you</span>
                                                          </div>
                                                       </div>
                                                   </div>
                                                      <div className="shrink-0 flex flex-col items-center gap-2">
                                                         <div className={`text-[7px] font-black uppercase tracking-widest transition-colors duration-500 ${hiOn ? 'text-gray-500' : 'text-white/25'}`}>{hiOn ? 'PREVIEW (HIDDEN)' : 'PREVIEW'}</div>
                                                         <div className={`rounded-xl overflow-hidden transition-all duration-500 border ${hiOn ? 'bg-black/15 border-[#ff007f]/12' : 'bg-black/15 border-white/5 opacity-45 grayscale'}`}>
                                                           <SecretClubCard variant="inline" />
                                                        </div>
                                                     </div>
                                                </div>
                                             </div>
                                          )}
                                       </div>
                                    );
                                 })()}

                               {/* DIVIDER */}
                             <div className="hidden">

                                {/* AUTO-ACCEPT (SECRET CLUB) — BLUE/PINK THEME */}
                                {false && getUserTier(currentUserId) === "secret_club" && (
                                   <>
                                   <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                         <div className="p-2 bg-gradient-to-br from-[#00d4ff]/20 to-[#ff007f]/20 rounded-xl border border-[#00d4ff]/30">
                                            <span className="text-[10px]">⚡</span>
                                         </div>
                                         <label className="text-[10px] font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] to-[#ff007f] uppercase tracking-widest">Auto-Accept (Secret Club)</label>
                                      </div>
                                      <button
                                         onClick={() => {
                                            if (autoAcceptEnabled) {
                                               setAutoAcceptEnabled(false);
                                               setAutoAcceptEndTime(0);
                                               localStorage.setItem("uplink_auto_accept_end", "0");
                                            } else {
                                               setAutoAcceptEnabled(true);
                                               const end = Date.now() + 10 * 60 * 1000;
                                               setAutoAcceptEndTime(end);
                                               localStorage.setItem("uplink_auto_accept_end", end.toString());
                                               addToast("Auto-Accept activated for 10 minutes!", "success");
                                            }
                                         }}
                                         className={`px-4 py-2 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all ${
                                            autoAcceptEnabled
                                               ? 'bg-gradient-to-r from-[#00d4ff] to-[#ff007f] text-white shadow-[0_0_20px_rgba(255,0,127,0.3)]'
                                               : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'
                                         }`}
                                      >
                                         {autoAcceptEnabled ? 'ACTIVE' : 'OFF'}
                                      </button>
                                   </div>
                                   {autoAcceptEnabled && (
                                      <div className="bg-gradient-to-br from-[#00d4ff]/5 to-[#ff007f]/5 border border-[#00d4ff]/20 rounded-xl p-4 space-y-3">
                                         <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Session Remaining</span>
                                            <AutoAcceptTimer endTime={autoAcceptEndTime} onExpire={() => { setAutoAcceptEnabled(false); setAutoAcceptEndTime(0); addToast("Auto-Accept session expired.", "info"); }} />
                                         </div>
                                         <div className="w-full bg-black/50 rounded-full h-3 overflow-hidden border border-[#00d4ff]/10">
                                            <div className="h-full bg-gradient-to-r from-[#00d4ff] via-[#a855f7] to-[#ff007f] rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,212,255,0.3)]" style={{ width: `${Math.max(0, Math.min(100, ((autoAcceptEndTime - Date.now()) / (10 * 60 * 1000)) * 100))}%` }} />
                                         </div>
                                         <button
                                            onClick={() => {
                                               const end = Date.now() + 10 * 60 * 1000;
                                               setAutoAcceptEndTime(end);
                                               localStorage.setItem("uplink_auto_accept_end", end.toString());
                                               addToast("Auto-Accept renewed for another 10 minutes!", "success");
                                            }}
                                            className="w-full py-2 bg-gradient-to-r from-[#00d4ff]/20 to-[#ff007f]/20 text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] to-[#ff007f] border border-[#00d4ff]/30 rounded-xl font-black uppercase text-[8px] tracking-widest hover:from-[#00d4ff] hover:to-[#ff007f] hover:text-white transition-all"
                                         >
                                            RENEW (10 MIN)
                                         </button>
                                      </div>
                                   )}
                                   </>
                                )}

                                {/* SECRET CLUB HIDE FEATURE */}
                                <div className={`rounded-xl p-4 border-2 transition-all ${getUserTier(currentUserId) === "secret_club" ? 'border-[#00d4ff]/30 bg-gradient-to-br from-[#00d4ff]/5 to-[#ff007f]/5' : 'border-white/5 bg-white/5 opacity-40 grayscale cursor-not-allowed'}`}>
                                   <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-3">
                                         <div className="p-2 bg-black/50 rounded-xl border border-white/10">
                                            <span className="text-[10px]">👁️</span>
                                         </div>
                                         <div>
                                            <label className="text-[10px] font-black text-white uppercase tracking-widest">Hidden Identity</label>
                                            <p className="text-[7px] text-gray-500 uppercase tracking-widest mt-0.5">{getUserTier(currentUserId) === "secret_club" ? 'Hide yourself behind the Secret Club card' : 'Secret Club only'}</p>
                                         </div>
                                      </div>
                                      <button
                                         disabled={getUserTier(currentUserId) !== "secret_club"}
                                         onClick={() => setHiddenIdentity(!hiddenIdentity)}
                                         className={`px-4 py-2 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all ${hiddenIdentity ? 'bg-[#00d4ff] text-black shadow-[0_0_15px_rgba(0,212,255,0.4)]' : 'bg-white/5 text-gray-400 border border-white/10'}`}
                                      >
                                         {hiddenIdentity ? 'HIDDEN' : 'VISIBLE'}
                                      </button>
                                   </div>

                                   {/* SECRET CLUB CARD PREVIEW */}
                                   <div className={`w-full rounded-xl overflow-hidden border-2 transition-all duration-500 ${hiddenIdentity ? 'border-[#00d4ff]/50 shadow-[0_0_30px_rgba(0,212,255,0.2)]' : 'border-white/10'}`}>
                                      <div className={`p-4 flex items-center gap-4 transition-all duration-500 ${hiddenIdentity ? 'bg-gradient-to-r from-[#0a0a16] via-[#00d4ff]/5 to-[#ff007f]/5' : 'bg-black/80'}`}>
                                         <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border-2 transition-all duration-500 ${hiddenIdentity ? 'border-[#00d4ff] bg-[#00d4ff]/20 shadow-[0_0_20px_rgba(0,212,255,0.3)]' : 'border-white/10 bg-white/5'}`}>
                                            {hiddenIdentity ? '🃏' : '❓'}
                                         </div>
                                 <div className="flex-1 min-w-0">
                                            <p className={`font-black text-lg transition-all duration-500 ${hiddenIdentity ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] to-[#ff007f]' : 'text-gray-600'}`}>
                                               {hiddenIdentity ? 'Secret Club Agent' : '••••••••'}
                                            </p>
                                            <div className="flex gap-2 mt-1.5">
                                               <span className={`text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded transition-all duration-500 ${hiddenIdentity ? 'bg-[#00d4ff]/20 text-[#00d4ff]' : 'bg-white/5 text-gray-600'}`}>Hidden</span>
                                               <span className={`text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded transition-all duration-500 ${hiddenIdentity ? 'bg-[#ff007f]/20 text-[#ff007f]' : 'bg-white/5 text-gray-600'}`}>Encrypted</span>
                                            </div>
                                         </div>
                                         <div className={`w-3 h-3 rounded-full transition-all duration-500 ${hiddenIdentity ? 'bg-[#00d4ff] shadow-[0_0_15px_rgba(0,212,255,0.6)] animate-pulse' : 'bg-gray-700'}`} />
                                      </div>
                                   </div>
                                 </div>
                                 {isApplyModalOpen && targetLobby && (
                                    <div className="mt-4 rounded-2xl border border-[#ff007f]/25 bg-[#ff007f]/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#ff007f]">
                                       Manual apply mode is using this same control module
                                    </div>
                                 )}

                                </div>
                             </div>

                             </div>
                           </motion.div>
                        </motion.div>
                     )}
                  </AnimatePresence>
  );
};

export default AutoApplySettingsModal;
