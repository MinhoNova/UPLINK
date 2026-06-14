"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Trash2, Coins, LogOut, Clock, MessageSquare, Trophy, History, Zap, Lock, CheckCircle2, ShieldCheck, Eye } from "lucide-react";
import { usePage } from "@/contexts/PageContext";
import ClassRoleIcons from "@/components/ClassRoleIcons";
import AutoAcceptTimer, { AUTO_ACCEPT_DURATION_MS } from "@/components/AutoAcceptTimer";
import RankBadge from "@/components/RankBadge";
import { getSubscriptionDaysLeft } from "@/lib/userProfile";
import { isAnimatedImageUrl } from "@/lib/profileImage";
import { resolveVfxBannerUrl, resolveVfxSrc } from "@/lib/vfxAssets";
import { extractGifPosterBlob, importLobbyVfxFromUrl, importProfileGifFromUrl, uploadLobbyVfxBlob } from "@/lib/clientImagePoster";

interface ArmoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeArmoryTab: string;
  setActiveArmoryTab: (tab: string) => void;
  isGifModalOpen: boolean;
  setIsGifModalOpen: (v: boolean) => void;
  gifInputUrl: string;
  setGifInputUrl: (v: string) => void;
  deleteConfirmation: any;
  setDeleteConfirmation: (v: any) => void;
  myCharacters: any[];
  setMyCharacters: (v: any[] | ((prev: any[]) => any[])) => void;
  globalCharacters: any[];
  setGlobalCharacters: (v: any[] | ((prev: any[]) => any[])) => void;
  raiderLink: string;
  setRaiderLink: (v: string) => void;
  handleSyncRaiderIo: (e: any) => void;
  isSyncing: boolean;
  lobbies: any[];
  setLobbies: (v: any[] | ((prev: any[]) => any[])) => void;
  completedHistoryItems: any[];
  openMissionThread: (lobbyId: string) => void;
  updateAvatarEffect: (k: string) => void;
  bankRegion: string;
  setBankRegion: (v: string) => void;
  bankRealm: string;
  setBankRealm: (v: string) => void;
  bankName: string;
  setBankName: (v: string) => void;
  handleSyncBank: (e: any) => void;
  isVerifyingBank: boolean;
  bankCharacters: any[];
  setBankCharacters: (v: any[] | ((prev: any[]) => any[])) => void;
  autoAcceptEnabled: boolean;
  setAutoAcceptEnabled: (v: boolean) => void;
  autoAcceptEndTime: number;
  setAutoAcceptEndTime: (v: number) => void;
  hiddenIdentity: boolean;
  setHiddenIdentity: (v: boolean) => void;
  signOut: () => void;
}

const ArmoryModal = ({
  isOpen,
  onClose,
  activeArmoryTab,
  setActiveArmoryTab,
  isGifModalOpen,
  setIsGifModalOpen,
  gifInputUrl,
  setGifInputUrl,
  deleteConfirmation,
  setDeleteConfirmation,
  myCharacters,
  setMyCharacters,
  globalCharacters,
  setGlobalCharacters,
  raiderLink,
  setRaiderLink,
  handleSyncRaiderIo,
  isSyncing,
  lobbies,
  setLobbies,
  completedHistoryItems,
  openMissionThread,
  updateAvatarEffect,
  bankRegion,
  setBankRegion,
  bankRealm,
  setBankRealm,
  bankName,
  setBankName,
  handleSyncBank,
  isVerifyingBank,
  bankCharacters,
  setBankCharacters,
  autoAcceptEnabled,
  setAutoAcceptEnabled,
  autoAcceptEndTime,
  setAutoAcceptEndTime,
  hiddenIdentity,
  setHiddenIdentity,
  signOut,
}: ArmoryModalProps) => {
  const {
    currentUserId,
    currentUserDisplay,
    currentUserDiscordHandle,
    session,
    myEffect,
    registeredUsers,
    setRegisteredUsers,
    EFFECTS,
    EFFECT_IMG,
    addToast,
    saveGlobalData,
    getUserTier,
    getUserTierLabel,
    getVfxSettings,
    renderDualColorName,
    AvatarWithEffect,
    electricColor,
    setElectricColor,
  } = usePage();

  const appendLobbyVfxEntry = async (entry: { src: string; poster?: string }) => {
    const userIdx = registeredUsers.findIndex((u: any) => String(u.id) === String(currentUserId));
    let updatedUsers = [...registeredUsers];
    if (userIdx === -1) {
      updatedUsers = [...registeredUsers, {
        id: currentUserId,
        name: currentUserDisplay || session?.user?.name || "Operative",
        username: currentUserDiscordHandle || session?.user?.name || "",
        avatar: session?.user?.image || "",
        userVfx: [entry],
      }];
    } else {
      updatedUsers[userIdx] = {
        ...updatedUsers[userIdx],
        userVfx: [...(updatedUsers[userIdx].userVfx || []), entry],
      };
    }
    setRegisteredUsers(updatedUsers);
    const ok = await saveGlobalData({ registeredUsers: updatedUsers });
    if (!ok) throw new Error("Failed to save — try again.");
  };

  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingBattleTag, setIsEditingBattleTag] = useState(false);
  const profileName = registeredUsers.find((u: any) => u.id === currentUserId)?.name || currentUserDisplay;

  return (
    <AnimatePresence>
                   {isOpen && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
                        <div className="w-full max-w-7xl h-[85vh] flex flex-col md:flex-row bg-[#080812] border-2 border-[#00ffff]/40 rounded-[2.5rem] overflow-hidden shadow-2xl">
                           <div className="w-full md:w-80 bg-black border-r border-white/5 p-8 flex flex-col">
                               <div className="flex flex-col gap-4">
                                 <motion.button onClick={() => setActiveArmoryTab("armory")} className={`py-4 px-6 rounded-xl text-left font-black transition-all border-2 ${activeArmoryTab === 'armory' ? 'bg-[#00ffff]/10 border-[#00ffff] text-[#00ffff]' : 'border-transparent text-gray-500'}`}>My Characters</motion.button>
                                 <motion.button onClick={() => setActiveArmoryTab("customization")} className={`py-4 px-6 rounded-xl text-left font-black transition-all border-2 ${activeArmoryTab === 'customization' ? 'bg-[#ffd700]/10 border-[#ffd700] text-[#ffd700]' : 'border-transparent text-gray-500'}`}>Effects Store</motion.button>
                                   <motion.button onClick={() => { if (getUserTier(currentUserId) !== "secret_club") return addToast("Lobby Store is a Secret Club feature. Subscribe to unlock.", "error"); setActiveArmoryTab("lobby"); }} className={`py-4 px-6 rounded-xl text-left font-black transition-all border-2 ${activeArmoryTab === 'lobby' ? 'bg-[#ff007f]/10 border-[#ff007f] text-[#ff007f]' : 'border-transparent text-gray-500'} ${getUserTier(currentUserId) !== "secret_club" ? 'opacity-40 grayscale' : ''}`}>Lobby Store</motion.button>

                                    <motion.button onClick={() => setActiveArmoryTab("history")} className={`py-4 px-6 rounded-xl text-left font-black transition-all border-2 ${activeArmoryTab === "history" ? "bg-[#ff007f]/10 border-[#ff007f] text-[#ff007f]" : "border-transparent text-gray-500 hover:text-gray-300"}`}>History                            </motion.button>
                               <motion.button onClick={() => setActiveArmoryTab("bank")} className={`py-4 px-6 rounded-xl text-left font-black transition-all border-2 ${activeArmoryTab === 'bank' ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500' : 'border-transparent text-gray-500'}`}>Gold Bank Vault</motion.button>
                              </div>
                              <div className="mt-auto flex flex-col gap-4">
                                  {(() => {
                                    const me = registeredUsers.find((u: any) => u.id === currentUserId);
                                    const daysLeft = getSubscriptionDaysLeft(me);
                                    const tier = getUserTier(currentUserId);
                                    if (tier !== "secret_club" || daysLeft === null) return null;
                                    return (
                                      <div className="p-4 rounded-2xl border border-yellow-500/30 bg-yellow-500/5">
                                        <p className="text-[8px] font-black text-yellow-500/70 uppercase tracking-widest mb-1">Secret Club</p>
                                        <p className="text-lg font-black text-yellow-400">
                                          {daysLeft > 0 ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left` : "Expired"}
                                        </p>
                                        {me?.subscription?.endDate && daysLeft > 0 && (
                                          <p className="text-[8px] text-gray-500 mt-1">
                                            Until {new Date(me.subscription.endDate).toLocaleDateString()}
                                          </p>
                                        )}
                                      </div>
                                    );
                                  })()}
                                  <motion.button onClick={() => signOut()} className="w-full py-5 bg-red-500/10 border-2 border-red-500/30 text-red-500 font-black rounded-2xl uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10"><LogOut className="w-4 h-4" /> Log Out</motion.button>
                                 <motion.button onClick={() => onClose()} className="w-full py-5 border-2 border-white/5 bg-white/5 text-gray-500 font-black rounded-2xl uppercase text-[10px] tracking-widest hover:text-white transition-all">Close Access</motion.button>
                              </div>
                           </div>
                            <div className="flex-1 p-10 overflow-y-auto relative">
                               {isGifModalOpen && (
                                  <div className="absolute inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-sm rounded-[2.5rem]" onClick={() => setIsGifModalOpen(false)}>
                                     <div className="bg-[#05050a] border border-yellow-500/30 p-8 rounded-3xl max-w-md w-full mx-4 text-center" onClick={e => e.stopPropagation()}>
                                        <h3 className="text-xl font-black text-yellow-500 mb-4 uppercase tracking-widest">Profile Picture</h3>
                                        <p className="text-gray-400 text-sm mb-6">Upload an image or paste a GIF URL (Secret Club only)</p>
                                        <div className="flex gap-3 mb-6">
                                           <label className="flex-1 py-3 px-4 bg-white/5 border border-dashed border-yellow-500/40 rounded-2xl cursor-pointer hover:bg-yellow-500/10 transition-all flex flex-col items-center gap-2">
                                              <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                              <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest">Upload Image</span>
                                               <input type="file" accept="image/*" className="hidden" onChange={e => {
                                                  const file = e.target.files?.[0];
                                                  if (!file) return;
                                                  if (file.size > 4 * 1024 * 1024) { addToast("File too large. Max 4MB.", "error"); return; }
                                                  const reader = new FileReader();
                                                  reader.onload = (ev) => { setGifInputUrl(ev.target?.result as string || ""); };
                                                  reader.readAsDataURL(file);
                                               }} />
                                           </label>
                                           <div className="flex-1 relative">
                                              <input type="text" value={gifInputUrl.startsWith('data:') ? '' : gifInputUrl} onChange={e => setGifInputUrl(e.target.value)} placeholder="https://media.giphy.com/..." className="w-full bg-black/50 border border-yellow-500/30 rounded-2xl px-4 py-5 outline-none focus:border-yellow-500 font-bold text-sm h-full" />
                                              <span className="absolute -top-2 left-3 bg-[#05050a] px-1 text-[8px] font-black text-gray-500 uppercase tracking-widest">Or URL</span>
                                           </div>
                                        </div>
                                        {gifInputUrl && (
                                            <div className="flex justify-center mb-6">
                                               <AvatarWithEffect src={gifInputUrl} effect={myEffect} className="w-16 h-16" />
                                            </div>
                                         )}

                                        <div className="flex gap-4">
                                           <button onClick={() => setIsGifModalOpen(false)} className="flex-1 py-3 bg-white/5 text-white font-black uppercase text-[10px] rounded-xl hover:bg-white/10 transition-all">CLOSE</button>
                                           <button onClick={async () => {
                                              const input = gifInputUrl?.trim();
                                              if (!input) { setIsGifModalOpen(false); return; }

                                              let finalUrl = input;
                                              let thumbUrl: string | undefined;
                                              if (input.startsWith('data:')) {
                                                 // Uploaded file: store as a real file on the server instead of base64 in the DB
                                                 try {
                                                    const blob = await (await fetch(input)).blob();
                                                    const fd = new FormData();
                                                    fd.append('file', blob, 'profile.gif');
                                                    fd.append('field', 'profileGif');
                                                    const poster = await extractGifPosterBlob(blob);
                                                    if (poster) fd.append('poster', poster, 'poster.webp');
                                                    const res = await fetch('/api/user/upload', { method: 'POST', body: fd });
                                                    const data = await res.json();
                                                    if (!res.ok || !data.url) { addToast(data.error || "Upload failed.", "error"); return; }
                                                    finalUrl = data.url;
                                                    thumbUrl = data.thumbUrl;
                                                 } catch {
                                                    addToast("Upload failed.", "error");
                                                    return;
                                                 }
                                              } else if (isAnimatedImageUrl(input)) {
                                                 try {
                                                    const imported = await importProfileGifFromUrl(input);
                                                    finalUrl = imported.url;
                                                    thumbUrl = imported.thumbUrl;
                                                 } catch (err) {
                                                    addToast(
                                                       err instanceof Error ? err.message : "Could not load GIF URL.",
                                                       "error"
                                                    );
                                                    return;
                                                 }
                                              } else {
                                                 addToast("URL must be a GIF — use a direct .gif link or upload a file.", "error");
                                                 return;
                                              }

                                              const userIdx = registeredUsers.findIndex((u: any) => String(u.id) === String(currentUserId));
                                              if (userIdx !== -1) {
                                                 const updatedUsers = [...registeredUsers];
                                                 updatedUsers[userIdx] = {
                                                    ...updatedUsers[userIdx],
                                                    profileGif: finalUrl,
                                                    profileGifThumb: thumbUrl ?? null,
                                                 };
                                                 setRegisteredUsers(updatedUsers);
                                                 const ok = await saveGlobalData({ registeredUsers: updatedUsers });
                                                 if (!ok) {
                                                    addToast("Failed to save GIF — try again.", "error");
                                                    return;
                                                 }
                                                 window.dispatchEvent(new CustomEvent("data-refresh"));
                                              }
                                              setIsGifModalOpen(false);
                                              addToast("Profile updated!", "success");
                                           }} className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase text-[10px] rounded-xl transition-all">UPDATE</button>
                                        </div>
                                     </div>
                                  </div>
                               )}
                               {activeArmoryTab === "armory" && (
                                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                      {/* Battle.net Tag + Raider.io */}
                                      <div className="grid grid-cols-2 gap-6 mb-8">
                                          {/* BattleTag */}
                                          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                                             <div className="flex items-center gap-2 mb-3">
                                                <img src="/classes/Battle.net.svg" className="w-7 h-7" alt="" />
                                                 <h4 className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#1E90F4' }}>BATTLENET</h4>
                                             </div>
                                             {isEditingBattleTag ? (
                                                <div className="flex gap-2 items-center">
                                                   <input id="battletag-input" type="text" defaultValue={(() => { const u = registeredUsers.find(uu => uu.id === currentUserId); return u?.battleTag || ''; })()} placeholder="USERNAME#1234" autoFocus className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-3 text-white outline-none focus:border-[#1E90F4]/50 transition-all font-black uppercase tracking-wider text-[11px] placeholder:text-gray-700" />
                                                   <button onClick={() => {
                                                      const input = document.getElementById('battletag-input') as HTMLInputElement;
                                                      const val = input?.value?.trim();
                                                      if (!val) return addToast("Enter a BattleTag first.", "error");
                                                      if (!/^.{3,12}#\d{4,}$/.test(val)) return addToast("Format: NAME#1234", "error");
                                                      const updated = registeredUsers.map((u: any) => u.id === currentUserId ? { ...u, battleTag: val } : u);
                                                      setRegisteredUsers(updated);
                                                      saveGlobalData({ registeredUsers: updated });
                                                      addToast("BattleTag saved!", "success");
                                                      setIsEditingBattleTag(false);
                                                   }} style={{ backgroundColor: '#1E90F4', color: 'white', border: 'none' }} className="px-4 py-3 font-black rounded-xl text-[9px] tracking-widest uppercase hover:brightness-110 transition-all shadow-lg cursor-pointer">SAVE</button>
                                                   <button onClick={() => setIsEditingBattleTag(false)} className="px-3 py-3 bg-white/5 text-gray-400 font-black text-[9px] uppercase rounded-xl hover:bg-white/10 transition-all tracking-widest">CANCEL</button>
                                                </div>
                                             ) : (
                                                <div className="flex items-center gap-2">
                                                   <p className="flex-1 text-sm font-black text-white/80 uppercase tracking-wider">{(() => { const u = registeredUsers.find(uu => uu.id === currentUserId); return u?.battleTag || 'No BattleTag set'; })()}</p>
                                                   <button onClick={() => setIsEditingBattleTag(true)} className="p-1.5 rounded-lg hover:bg-white/10 transition-all text-gray-500 hover:text-[#1E90F4]">
                                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                   </button>
                                                </div>
                                             )}
                                          </div>
                                         {/* Raider.io */}
                                         <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                                            <div className="flex items-center gap-2 mb-4">
                                               <img src="/classes/RAIDER IO.svg" className="w-7 h-7" alt="" />
                                               <h4 className="text-[10px] font-black uppercase tracking-widest text-yellow-500">RAIDER.IO</h4>
                                            </div>
                                            <form onSubmit={handleSyncRaiderIo} className="flex gap-3 items-center">
                                               <input required value={raiderLink} onChange={e => setRaiderLink(e.target.value)} placeholder="Link character..." className="flex-1 bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-yellow-500/50 transition-all font-black tracking-wider placeholder:text-gray-700" />
                                               <motion.button type="submit" disabled={isSyncing} className="px-8 py-4 bg-yellow-500 text-black font-black rounded-xl text-xs tracking-widest uppercase hover:bg-yellow-400 transition-all">LINK</motion.button>
                                            </form>
                                         </div>
                                      </div>
                                     <div className="grid grid-cols-1 gap-3">
                                        {myCharacters.map(char => (
                                           <div key={char.id} className="bg-[#05050a] border border-[#00ffff]/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
                                                  <div className="flex items-center gap-3">
                                                   <ClassRoleIcons
                                                      className={char.class}
                                                      role={char.role}
                                                      size={96}
                                                      overlap={30}
                                                      roleLabel="Switch"
                                                      onRoleClick={() => {
                                                              const classRoles: Record<string, string[]> = { 'Evoker': ['dps','healer'], 'Demon Hunter': ['dps','tank'], 'Druid': ['dps','healer','tank'], 'Monk': ['dps','healer','tank'], 'Paladin': ['dps','healer','tank'], 'Priest': ['dps','healer'], 'Shaman': ['dps','healer'], 'Warrior': ['dps','tank'], 'Death Knight': ['dps','tank'], 'Hunter': ['dps'], 'Rogue': ['dps'], 'Mage': ['dps'], 'Warlock': ['dps'] };
                                                              const roles = classRoles[char.class] || ['dps'];
                                                              const idx = roles.indexOf(char.role);
                                                              const newRole = roles[(idx + 1) % roles.length];
                                                              const updated = myCharacters.map(c => c.id === char.id ? { ...c, role: newRole } : c);
                                                              setMyCharacters(updated);
                                                              const updatedGlobal = globalCharacters.map(c => c.id === char.id ? { ...c, role: newRole } : c);
                                                              setGlobalCharacters(updatedGlobal);
                                                              saveGlobalData({ characters: updatedGlobal });
                                                      }}
                                                   />
                                                  <div className="flex flex-col justify-center">
                                                    <p className="font-black text-2xl text-white leading-none">{char.name}</p>
                                                    <p className="text-[10px] text-[#00ffff] font-black uppercase tracking-widest bg-[#00ffff]/10 px-2 py-0.5 rounded-sm mt-1 inline-block w-fit">{char.region}-{char.realm} • {char.class}</p>
                                                 </div>
                                               </div>
                                              <div className="flex items-center gap-4">
                                                <div className="text-center bg-black p-4 rounded-xl border border-white/10">
                                                   <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">iLvl</p>
                                                   <p className="text-xl font-black text-white">{char.ilvl}</p>
                                                </div>
                                                <div className="text-center bg-black p-4 rounded-xl border border-white/10">
                                                   <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">IO</p>
                                                   <p className="text-xl font-black text-[#8a2be2]">{char.roleScores?.[char.role] ?? char.score}</p>
                                                 </div>
                                                 <motion.button onClick={() => setMyCharacters(prev => prev.filter(c => c.id !== char.id))} className="p-4 bg-red-500/10 text-red-500 border border-red-500/30 rounded-xl hover:bg-red-500 hover:text-white transition-all text-center">
                                                    <Trash2 className="w-5 h-5" />
                                                </motion.button>
                                             </div>
                                          </div>
                                       ))}
                                    </div>
                                    {/* Settings removed from this tab */}
                                 </motion.div>
                              )}
                                {activeArmoryTab === "customization" && (
                                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
                                      <div className="text-center mb-10">
                                          <h3 className="text-4xl font-black text-[#ffd700] uppercase tracking-widest mb-2">EDIT PROFILE</h3>
                                         <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em]">Customize your operative identity</p>
                                      </div>
                                      {/* Avatar + Name Section */}
                                      <div className="w-full max-w-4xl flex gap-6 mb-8">
                                         {/* Edit Name */}
                                         <div className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-3">
                                            <AvatarWithEffect src={session?.user?.image || ''} effect={myEffect} className="w-16 h-16" userId={currentUserId} />
                                            {isEditingName ? (
                                               <div className="w-full flex flex-col gap-2">
                                                  <input id="display-name-input" type="text" defaultValue={profileName} className="w-full bg-black/50 border border-[#ffd700]/50 rounded-xl px-4 py-3 text-white text-center outline-none focus:border-[#ffd700] transition-all font-black uppercase tracking-wider" autoFocus />
                                                  <div className="flex gap-2">
                                                     <button onClick={async () => {
                                                        if (getUserTier(currentUserId) !== "secret_club") {
                                                           return addToast("Secret Club required to customize display name.", "error");
                                                        }
                                                        const input = document.getElementById('display-name-input') as HTMLInputElement;
                                                        const val = input?.value?.trim();
                                                        if (!val) return addToast("Enter a name first.", "error");
                                                        const userIdx = registeredUsers.findIndex((u: any) => String(u.id) === String(currentUserId));
                                                        if (userIdx !== -1) {
                                                           const updatedUsers = [...registeredUsers];
                                                           updatedUsers[userIdx] = {
                                                              ...updatedUsers[userIdx],
                                                              name: val,
                                                              displayName: val,
                                                              discordDisplayName: val,
                                                           };
                                                           setRegisteredUsers(updatedUsers);
                                                           await saveGlobalData({ registeredUsers: updatedUsers });
                                                           addToast("Name updated!", "success");
                                                           setIsEditingName(false);
                                                        }
                                                     }} className="flex-1 px-4 py-2 bg-[#ffd700] text-black font-black text-[9px] uppercase rounded-xl hover:bg-yellow-400 transition-all tracking-widest">SAVE</button>
                                                     <button onClick={() => setIsEditingName(false)} className="px-4 py-2 bg-white/5 text-gray-400 font-black text-[9px] uppercase rounded-xl hover:bg-white/10 transition-all tracking-widest">CANCEL</button>
                                                  </div>
                                               </div>
                                            ) : (
                                               <div className="flex items-center gap-2">
                                                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">{profileName}</h3>
                                                  <button onClick={() => {
                                                     if (getUserTier(currentUserId) !== "secret_club") {
                                                        return addToast("Secret Club required to customize display name.", "error");
                                                     }
                                                     setIsEditingName(true);
                                                  }} className="p-1.5 rounded-lg hover:bg-white/10 transition-all text-gray-500 hover:text-[#ffd700]">
                                                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                  </button>
                                               </div>
                                            )}
                                         </div>
                                         {/* Profile Picture */}
                                         <div className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-3">
                                            <h4 className="text-sm font-black text-[#ffd700] uppercase tracking-widest">Profile Picture</h4>
                                            {(() => {
                                               const myTier = getUserTier(currentUserId);
                                               const canUseGif = myTier === "secret_club";
                                               const hasGif = !!registeredUsers.find((u: any) => u.id === currentUserId)?.profileGif;
                                               return (
                                                  <div className="flex gap-3 relative">
                                                     {!canUseGif && (
                                                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 rounded-xl" title={myTier === "free" ? "Upgrade to Secret Club to customize profile picture" : "Secret Club only"}>
                                                           <Lock className="w-5 h-5 text-yellow-500" />
                                                        </div>
                                                     )}
                                                     <button onClick={() => { if (!canUseGif) { addToast(myTier === "free" ? "Upgrade to Secret Club to customize profile picture." : "Secret Club only feature.", "error"); return; } setGifInputUrl(""); setIsGifModalOpen(true); }} className={`px-4 py-2 font-black text-[9px] uppercase rounded-xl transition-all ${canUseGif ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-[0_0_15px_rgba(255,215,0,0.2)]' : 'bg-white/5 text-gray-500 border border-white/10 cursor-not-allowed'}`}>{hasGif ? 'EDIT GIF' : 'ADD GIF'}</button>
                                                     {hasGif && (
                                                        <button onClick={async () => {
                                                           if (!canUseGif) return;
                                                           const userIdx = registeredUsers.findIndex((u: any) => String(u.id) === String(currentUserId));
                                                           if (userIdx !== -1) {
                                                              const updatedUsers = [...registeredUsers];
                                                              updatedUsers[userIdx] = {
                                                                 ...updatedUsers[userIdx],
                                                                 profileGif: null,
                                                                 profileGifThumb: null,
                                                              };
                                                              setRegisteredUsers(updatedUsers);
                                                              const ok = await saveGlobalData({ registeredUsers: updatedUsers });
                                                              if (!ok) {
                                                                 addToast("Failed to remove GIF — try again.", "error");
                                                                 return;
                                                              }
                                                              addToast("Profile GIF removed.", "info");
                                                           }
                                                        }} className="px-4 py-2 bg-red-600/90 hover:bg-red-500 text-white font-black text-[9px] uppercase rounded-xl transition-all">REMOVE</button>
                                                     )}
                                                  </div>
                                               );
                                            })()}
                                         </div>
                                      </div>

                                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl p-6 bg-black/30 rounded-[3rem] border border-white/5 mb-16">
                                          {Object.keys(EFFECTS).map(k => {
                                            const myTier = getUserTier(currentUserId);
                                            const isLocked = k !== "none" && myTier === "free";
                                            return (
                                            <motion.button key={k} onClick={() => { if (isLocked) { addToast("Upgrade your subscription to unlock premium effects.", "error"); return; } void updateAvatarEffect(k); }} className={`p-6 rounded-2xl border-2 transition-all group relative overflow-hidden flex flex-col items-center justify-center ${isLocked ? 'opacity-40 cursor-not-allowed' : ''} ${myEffect === k && !isLocked ? 'bg-[#ffd700]/10 border-[#ffd700] shadow-[0_0_20px_#ffd700]' : 'border-white/5 bg-black hover:border-white/20'}`}>
                                              {(myEffect === k && !isLocked) && <div className="absolute top-2 right-2 z-20"><CheckCircle2 className="w-4 h-4 text-[#ffd700]" /></div>}
                                              {isLocked && <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 rounded-2xl"><Lock className="w-8 h-8 text-yellow-500/60" /></div>}
                                               <div className="mb-4 relative z-10 flex flex-col items-center gap-2">
                                                  <AvatarWithEffect src={session?.user?.image || ""} effect={k} className="w-16 h-16" userId={currentUserId} />
                                                  {EFFECT_IMG[k] && <img src={EFFECT_IMG[k]} className="w-12 h-12 object-contain opacity-70" />}
                                               </div>
                                               <span className="font-black uppercase text-[10px] tracking-widest text-center relative z-10">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                                           </motion.button>
                                            );
                                         })}
                                       </div>
                                      {myEffect === 'electric_circle' && (
                                        <div className="flex flex-col items-center gap-3 mb-16">
                                          <p className="text-gray-400 text-[10px] tracking-widest font-bold uppercase">Color</p>
                                          <div className="flex gap-3">
                                            {[
                                              { dot:'#9040ee' }, { dot:'#ff2020' }, { dot:'#00ddaa' }, { dot:'#ffaa00' },
                                              { dot:'#20ee20' }, { dot:'#ff1050' }, { dot:'#2080ff' }, { dot:'#bbbbee' },
                                            ].map((c, i) => (
                                              <button key={i} onClick={() => { setElectricColor(i); try { localStorage.setItem('UL_ELECTRIC_COLOR', String(i)); } catch {} }}
                                                className={`w-6 h-6 rounded-full transition-all ${electricColor === i ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100 hover:scale-110'}`}
                                                style={{ background: c.dot, boxShadow: `0 0 8px ${c.dot}` }}
                                              />
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                       {/* Settings removed from this tab */}
                                    </motion.div>
                                 )}
                                 {activeArmoryTab === "lobby" && (
                                   getUserTier(currentUserId) !== "secret_club" ? (
                                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full">
                                         <div className="flex flex-col items-center gap-4 text-center">
                                            <Lock className="w-16 h-16 text-yellow-500/40" />
                                            <p className="text-lg font-black text-yellow-500 uppercase tracking-widest">Secret Club Feature</p>
                                            <p className="text-sm text-gray-500 max-w-md">Subscribe to unlock the Lobby Store and customize your banners.</p>
                                         </div>
                                      </motion.div>
                                   ) : (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
                                     <div className="text-center mb-8 w-full max-w-4xl flex flex-col items-center">
                                        <div className="relative p-8 bg-black/40 rounded-[2rem] border border-[#ff007f]/30 w-full shadow-[0_0_30px_rgba(255,0,127,0.1)]">
                                           <h3 className="text-3xl font-black text-[#ff007f] uppercase tracking-widest mb-1">Lobby Store</h3>
                                           <p className="text-gray-500 font-bold uppercase text-[9px] tracking-[0.2em] mb-6">Choose where each background appears</p>

                                           {/* Clickable Mini Previews */}
                                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                              {[
                                                 { id: 'showOnBanner', label: 'Banner', icon: 'Zap', tier: 'free' },
                                                 { id: 'showOnOngoing', label: 'Ongoing', icon: 'Clock', tier: 'secret_club' },
                                                 { id: 'showOnModal', label: 'Thread', icon: 'MessageSquare', tier: 'secret_club' }
                                              ].map(setting => {
                                                 const userIdx = registeredUsers.findIndex((u: any) => u.id === currentUserId);
                                                 const settings = userIdx !== -1 ? getVfxSettings(registeredUsers[userIdx]) : { showOnBanner: true, showOnOngoing: true, showOnModal: true };
                                                 const isActive = settings[setting.id as keyof typeof settings];
                                                 const isLocked = setting.tier === 'secret_club' && getUserTier(currentUserId) !== 'secret_club';
                                                 return (
                                                 <div key={setting.id} onClick={() => {
                                                    if (isLocked) return addToast("Secret Club feature. Upgrade to unlock.", "error");
                                                    if (userIdx !== -1) {
                                                       const updatedUsers = [...registeredUsers];
                                                       updatedUsers[userIdx].vfxSettings = { ...settings, [setting.id]: !isActive };
                                                       setRegisteredUsers(updatedUsers);
                                                       saveGlobalData({ registeredUsers: updatedUsers });
                                                    }
                                                 }} className={`group cursor-pointer bg-gradient-to-b ${isActive ? 'from-yellow-500/10 via-transparent to-transparent border-yellow-500/40' : 'from-white/[0.02] to-transparent border-white/5'} border rounded-2xl overflow-hidden min-h-[180px] flex flex-col hover:border-yellow-500/30 transition-all duration-300 relative ${isLocked ? 'opacity-30 pointer-events-none' : ''}`}>
                                                    {/* Header */}
                                                    <div className="flex items-center justify-between px-3 py-2 bg-black/40 border-b border-white/5">
                                                       <div className="flex items-center gap-1.5">
                                                          <div className={`w-4 h-4 rounded-lg flex items-center justify-center ${setting.id === 'showOnOngoing' ? 'bg-[#ff007f]/20' : 'bg-[#00ffff]/20'}`}>
                                                             {setting.id === 'showOnOngoing' ? <Clock className="w-2 h-2 text-[#ff007f]" /> : setting.id === 'showOnModal' ? <MessageSquare className="w-2 h-2 text-[#00ffff]" /> : <Zap className="w-2 h-2 text-[#00ffff]" />}
                                                          </div>
                                                          <span className="text-[7px] font-black text-white uppercase tracking-widest">{setting.label}</span>
                                                       </div>
                                                       {isLocked ? <span className="text-[6px] text-yellow-600 font-black">🔒 Club</span> : <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]' : 'bg-gray-600'}`}></div>}
                                                    </div>
                                                    {/* Preview Content */}
                                                    <div className="flex-1 relative overflow-hidden p-3">
                                                       {/* Show actual background image if set */}
                                                       {isActive && registeredUsers.find((u: any) => u.id === currentUserId)?.activeVfx && setting.id === 'showOnBanner' && (
                                                          <div className="absolute inset-0">
                                                             <img src={registeredUsers.find((u: any) => u.id === currentUserId)?.activeVfx} className="w-full h-full object-cover" />
                                                             <div className="absolute inset-0 bg-black/60"></div>
                                                          </div>
                                                       )}
                                                       <div className="relative z-10 h-full flex flex-col">
                                                          {setting.id === 'showOnBanner' && (
                                                             <>
                                                             <div className="flex items-center gap-1 mb-2">
                                                                <div className="w-5 h-5 rounded-full bg-white/10 border border-white/20 shrink-0"></div>
                                                                <div className="h-1.5 w-12 bg-white/20 rounded"></div>
                                                                <div className="ml-auto flex gap-0.5">
                                                                   {['🛡️', '🌿', '⚔️', '⚔️'].map((e, i) => (
                                                                      <div key={i} className="w-4 h-4 rounded bg-white/5 border border-white/10 flex items-center justify-center text-[4px]">{e}</div>
                                                                   ))}
                                                                </div>
                                                             </div>
                                                             <div className="flex items-center justify-between mt-auto">
                                                                <div className="flex items-center gap-1">
                                                                   <div className="h-1 w-8 bg-yellow-500/40 rounded"></div>
                                                                   <span className="text-[5px] text-gray-500">K</span>
                                                                </div>
                                                                <div className="w-8 h-4 rounded bg-[#ff007f]/30 text-[5px] text-white font-black flex items-center justify-center">Apply</div>
                                                             </div>
                                                             </>
                                                          )}
                                                          {setting.id === 'showOnOngoing' && (
                                                             <div className="flex flex-col gap-1.5">
                                                                <div className="h-1 w-14 bg-[#ff007f]/40 rounded"></div>
                                                                <div className="flex items-center gap-1 justify-between mt-1">
                                                                   <div>
                                                                      <div className="h-1 w-6 bg-yellow-500/40 rounded"></div>
                                                                   </div>
                                                                   <div className="flex -space-x-0.5">
                                                                      {[1,2,3,4].map(i => <div key={i} className="w-2 h-2 rounded bg-white/10 border border-white/5"></div>)}
                                                                   </div>
                                                                </div>
                                                             </div>
                                                          )}
                                                          {setting.id === 'showOnModal' && (
                                                             <div className="flex flex-col gap-1.5 h-full">
                                                                <div className="flex items-start gap-1.5">
                                                                   <div className="w-3 h-3 rounded-full bg-white/10 shrink-0 mt-0.5"></div>
                                                                   <div className="h-1 w-10 bg-white/20 rounded mt-1.5"></div>
                                                                </div>
                                                                <div className="flex justify-end mt-auto">
                                                                   <div className="w-12 h-3 rounded bg-[#ff007f]/30 flex items-center px-1">
                                                                      <div className="h-0.5 w-6 bg-white/30 rounded"></div>
                                                                   </div>
                                                                </div>
                                                                <div className="flex items-start gap-1.5">
                                                                   <div className="h-1 w-8 bg-white/10 rounded mt-2"></div>
                                                                   <div className="w-3 h-3 rounded-full bg-white/10 shrink-0"></div>
                                                                </div>
                                                             </div>
                                                          )}
                                                       </div>
                                                    </div>
                                                 </div>
                                                );
                                              })}
                                           </div>
                                            </div>
                                            </div>
                                     <div className="w-full max-w-2xl flex flex-wrap gap-3 mb-10 items-center justify-center">
                                        <input
                                           id="new-gif-url"
                                          type="text"
                                          placeholder="Paste GIF URL here..."
                                          className="flex-1 min-w-[200px] bg-black/50 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-[#ff007f] font-bold text-sm"
                                       />
                                       <label className="cursor-pointer bg-white/10 hover:bg-white/15 border border-white/20 text-white font-black px-6 py-4 rounded-2xl text-sm uppercase tracking-widest">
                                          Upload File
                                          <input
                                             type="file"
                                             accept="image/gif,image/webp,image/png,image/jpeg"
                                             className="hidden"
                                             onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                e.target.value = "";
                                                if (!file) return;
                                                const tier = getUserTier(currentUserId);
                                                const currentCount = (registeredUsers.find((u: any) => String(u.id) === String(currentUserId))?.userVfx?.length || 0);
                                                if (tier === "free" && currentCount >= 1) return addToast("Free users can only have 1 lobby image. Join Secret Club for unlimited.", "error");
                                                addToast("Uploading lobby background…", "info");
                                                try {
                                                   const isGif = file.type.includes("gif") || file.name.toLowerCase().endsWith(".gif");
                                                   const data = await uploadLobbyVfxBlob(file, isGif ? "lobby.gif" : file.name || "lobby.webp");
                                                   await appendLobbyVfxEntry(data.entry);
                                                   addToast("Lobby background added.", "success");
                                                } catch (err: any) {
                                                   addToast(err?.message || "Upload failed.", "error");
                                                }
                                             }}
                                          />
                                       </label>
                                       <button
                                          type="button"
                                          onClick={async () => {
                                             const input = document.getElementById('new-gif-url') as HTMLInputElement;
                                             const url = input.value?.trim();
                                             if (!url) return;
                                             const tier = getUserTier(currentUserId);
                                             const currentCount = (registeredUsers.find((u: any) => String(u.id) === String(currentUserId))?.userVfx?.length || 0);
                                             if (tier === "free" && currentCount >= 1) return addToast("Free users can only have 1 lobby image. Join Secret Club for unlimited.", "error");

                                             addToast("Fetching & saving GIF…", "info");
                                             try {
                                                const data = await importLobbyVfxFromUrl(url);
                                                await appendLobbyVfxEntry(data.entry);
                                                input.value = "";
                                                addToast("Lobby background saved.", "success");
                                             } catch (err: any) {
                                                addToast(err?.message || "Could not import URL — try Upload File.", "error");
                                             }
                                          }}
                                          className="bg-[#ff007f] hover:bg-[#ff007f]/80 text-white font-black px-10 py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(255,0,127,0.5)] z-[100] relative uppercase tracking-widest border border-white/20 cursor-pointer text-sm"
                                        >ADD EFFECT</button>
                                     </div>

                                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-4xl">
                                        {registeredUsers.find((u: any) => u.id === currentUserId)?.userVfx?.map((entry: any, i: number) => {
                                           const src = resolveVfxSrc(entry);
                                           const preview = resolveVfxBannerUrl(entry);
                                           return (
                                           <div key={i} className="relative group border-2 border-white/10 rounded-2xl aspect-video overflow-hidden transition-all hover:border-[#ff007f]">
                                             <img src={preview} className="w-full h-full object-cover" alt="" loading="lazy" />
                                             {/* ACTIVE INDICATOR */}
                                              {(() => {
                                                 const isProfileActive = registeredUsers.find((u: any) => u.id === currentUserId)?.activeVfx === src;
                                                 const isLobbyActive = lobbies.some(l => String(l.ownerId) === String(currentUserId) && l.customBg === src);
                                                 return (isProfileActive || isLobbyActive) ? (
                                                 <div className="absolute top-3 left-3 bg-[#00ffff] text-black font-black text-[9px] px-2 py-1 rounded-lg uppercase">Active</div>
                                                 ) : null;
                                              })()}
                                             {/* HOVER ACTIONS - ALIGNED TO BOTTOM */}
                                             <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4 gap-3">
                                                <button
                                                   onClick={() => {
                                                      const userIdx = registeredUsers.findIndex((u: any) => String(u.id) === String(currentUserId));
                                                      if (userIdx !== -1) {
                                                         const updatedUsers = [...registeredUsers];
                                                         updatedUsers[userIdx].activeVfx = src;
                                                         const updatedLobbies = lobbies.map((l) =>
                                                            String(l.ownerId) === String(currentUserId)
                                                               ? { ...l, ownerActiveVfx: src }
                                                               : l
                                                         );
                                                         setRegisteredUsers(updatedUsers);
                                                         setLobbies(updatedLobbies);
                                                         saveGlobalData({ registeredUsers: updatedUsers, lobbies: updatedLobbies });
                                                      }
                                                   }}
                                                   className="py-2 px-4 bg-green-600/90 hover:bg-green-500 text-white font-black text-[10px] uppercase rounded-xl transition-all"
                                                >
                                                   ACTIVATE
                                                </button>
                                                <button
                                                   onClick={() => setDeleteConfirmation({ isOpen: true, index: i, userId: currentUserId })}
                                                   className="py-2 px-4 bg-red-600/90 hover:bg-red-500 text-white font-black text-[10px] uppercase rounded-xl transition-all"
                                                >
                                                   DELETE
                                                </button>
                                             </div>
                                          </div>
                                          );
                                        })}                        </div>
                                   </motion.div>
                                )
                              )}
                                
                                {activeArmoryTab === "history" && (
                                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full min-h-0">
                                    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#ff007f]/[0.12] via-[#05050a] to-[#00ffff]/[0.08] px-8 py-8 mb-8 shadow-[0_0_40px_rgba(255,0,127,0.08)]">
                                       <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#ff007f]/20 blur-3xl" />
                                       <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-[#00ffff]/15 blur-3xl" />
                                       <div className="relative flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                          <div className="flex items-center gap-5">
                                             <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#ff007f]/40 bg-black/50 shadow-[0_0_24px_rgba(255,0,127,0.25)]">
                                                <History className="h-7 w-7 text-[#ff007f]" strokeWidth={2.25} />
                                             </div>
                                             <div>
                                                <h3 className="font-[family-name:var(--font-space-grotesk)] text-4xl font-black uppercase tracking-tighter text-[#ff007f] md:text-5xl">
                                                   History
                                                </h3>
                                                <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Completed runs · Failed missions · Closed contracts</p>
                                             </div>
                                          </div>
                                       </div>
                                    </div>
                                     <div className="w-full shrink-0 overflow-y-auto pr-3 custom-scrollbar space-y-2.5 max-h-[calc(85vh-220px)]">
                                        {completedHistoryItems.length === 0 ? (
                                           <div className="flex flex-col items-center justify-center py-24 text-center border border-white/5 rounded-[2rem] bg-white/[0.02] w-full">
                                              <Trophy className="w-14 h-14 text-gray-600 mb-4 opacity-40" />
                                              <p className="text-sm font-black text-gray-500 uppercase tracking-widest mb-2">No completed missions yet</p>
                                              <p className="text-xs text-gray-600 max-w-md leading-relaxed">
                                                 When a mission is marked <span className="text-[#ffd700] font-black">COMPLETED</span>, it appears here. Dungeon clears synced from Raider.io after <span className="text-[#00ffff] font-black">EXECUTE MISSION</span> show as individual runs.
                                              </p>
                                           </div>
                                       ) : (
                                           completedHistoryItems.map((item: any) => {
                                              const ownerUser = registeredUsers.find((u: any) => String(u.id) === String(item.ownerId));
                                              const isLeveling = item.category === "leveling";
                                              const title = isLeveling
                                                 ? `Leveling ${item.startLevel || "1"}-${item.endLevel || "80"}`
                                                 : `${item.runsCount || 1}x ${item.keyLevel || "+10"}`;
                                              const perRun = item.goldPerRun || Math.round((item.totalGold || 0) / (item.runsCount || 1)) || 0;
                                              return (
                                                 <div
                                                    key={item.id}
                                                    className={`relative w-full rounded-2xl shadow-lg border bg-gradient-to-r from-[#0a0a12] via-[#12121a] to-[#0a0a12] overflow-hidden ${item.status === "failed" ? "border-red-500/30 hover:border-red-500/60" : isLeveling ? "border-white/10 hover:border-[#8a2be2]/50" : "border-white/10 hover:border-[#00ffff]/50"} transition-all`}
                                                 >
                                                    <div className="absolute inset-0 z-0 rounded-2xl bg-black/90" />
                                                    <div className="relative z-10 flex items-center w-full min-h-[56px] px-3 py-2 gap-3">
                                                       <div className="flex-shrink-0 flex items-center gap-2">
                                                          <AvatarWithEffect src={item.ownerImage} effect={item.ownerEffect} className="w-12 h-12" userId={item.ownerId} />
                                                          {ownerUser ? <RankBadge stats={ownerUser.stats} ratings={ownerUser.ratings} compact /> : null}
                                                       </div>
                                                       <div className="flex flex-col items-center justify-center shrink-0">
                                                          <div className="flex items-center gap-1 text-yellow-500 font-black text-base leading-none">
                                                             {item.totalGold || perRun * (item.runsCount || 1)}K
                                                             <Coins className="w-4 h-4" />
                                                          </div>
                                                          {!isLeveling && (
                                                             <span className="mt-0.5 text-[9px] font-black uppercase text-white tracking-wider px-1.5 py-0.5 rounded-md bg-white/10 border border-white/20">
                                                                {perRun}K <span className="text-[#00ffff]">PER RUN</span>
                                                             </span>
                                                          )}
                                                       </div>
                                                       <div className="flex-1 flex flex-col justify-center min-w-0">
                                                          <h3 className={`text-sm font-black uppercase tracking-tighter truncate flex items-center gap-2 ${isLeveling ? "text-[#8a2be2]" : "text-[#00ffff]"}`}>
                                                             {title}
                                                             <span className="flex items-center gap-1">
                                                                <img src={item.serverRegion === "US" ? "/flags/us.svg" : "/flags/eu.svg"} alt="" className="w-3.5 h-3.5 rounded-sm object-cover" />
                                                                <span className="text-[8px] font-black uppercase tracking-wider text-white/60">{item.serverRegion || "US"}</span>
                                                             </span>
                                                          </h3>
                                                          <span className={`mt-1 inline-flex w-fit px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest ${item.status === "failed" ? "bg-red-600/20 text-red-400 border border-red-500/50" : item.payoutStatus === "paid" ? "bg-green-500/10 text-green-400 border border-green-500/30" : "bg-red-500/10 text-red-400 border border-red-500/30"}`}>
                                                             {item.status === "failed" ? "MISSION FAILED" : item.payoutStatus === "paid" ? "PAID" : "UNPAID"}
                                                          </span>
                                                       </div>
                                                       <div className="flex items-center justify-end shrink-0">
                                                          <button
                                                             onClick={() => openMissionThread(item.lobbyId)}
                                                             className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all text-center flex justify-center gap-1.5 items-center ${isLeveling ? "bg-[#8a2be2]/10 border border-[#8a2be2]/30 text-[#8a2be2] hover:bg-[#8a2be2] hover:text-white" : "bg-[#00ffff]/10 border border-[#00ffff]/30 text-[#00ffff] hover:bg-[#00ffff] hover:text-black"}`}
                                                          >
                                                             <Eye className="w-3.5 h-3.5" /> VIEW
                                                          </button>
                                                       </div>
                                                    </div>
                                                 </div>
                                              );
                                           })
                                       )}
                                       </div>
                                       </motion.div>
                                       )}
                                       {activeArmoryTab === "bank" && (
                                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                     <h3 className="text-3xl font-black text-yellow-500 mb-6 uppercase tracking-widest flex items-center gap-3"><Coins className="w-8 h-8" /> Gold Bank Vault</h3>
                                     <form onSubmit={handleSyncBank} className="flex gap-4 mb-10 bg-black/40 p-6 rounded-3xl border border-white/5">
                                        <select value={bankRegion} onChange={e => setBankRegion(e.target.value)} className="bg-black border-2 border-yellow-500/30 rounded-xl px-4 py-4 text-white outline-none w-32 font-black uppercase">
                                           <option value="eu">EU</option>
                                           <option value="us">US</option>
                                           <option value="kr">KR</option>
                                           <option value="tw">TW</option>
                                        </select>
                                        <input required value={bankRealm} onChange={e => setBankRealm(e.target.value)} placeholder="Realm (e.g. tarren-mill)" className="w-1/3 shrink-0 bg-black border-2 border-yellow-500/30 rounded-xl px-6 py-4 text-white outline-none focus:border-yellow-500 font-bold" />
                                        <input required value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Character Name" className="w-1/3 shrink-0 bg-black border-2 border-yellow-500/30 rounded-xl px-6 py-4 text-white outline-none focus:border-yellow-500 font-bold" />
                                        <motion.button type="submit" disabled={isVerifyingBank} className="px-8 py-4 bg-yellow-500 text-black font-black rounded-xl hover:bg-yellow-400 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(255,215,0,0.3)]">VERIFY</motion.button>
                                     </form>
                                     <div className="grid grid-cols-1 gap-5 max-h-[350px] overflow-y-auto pr-4 custom-scrollbar">
                                        {bankCharacters.map((char: any) => (
                                           <div key={char.id} className="bg-[#05050a] border border-yellow-500/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
                                              <div className="flex items-center gap-5">
                                                 <div className="w-16 h-16 rounded-full border-2 border-yellow-500 flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(255,215,0,0.2)] bg-black">👑</div>
                                                 <div>
                                                    <p className="font-black text-2xl text-yellow-500 mb-1 leading-none">{char.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md inline-block">{char.region}-{char.realm} • {char.class || "Unknown Class"}</p>
                                                 </div>
                                              </div>
                                              <motion.button onClick={() => setBankCharacters((prev: any[]) => prev.filter((c: any) => c.id !== char.id))} className="p-4 bg-red-500/10 text-red-500 border border-red-500/30 rounded-xl hover:bg-red-500 hover:text-white transition-all text-center">
                                                 <Trash2 className="w-5 h-5" />
                                              </motion.button>
                                           </div>
                                        ))}
                                     </div>
                                     {/* Settings removed from this tab */}
                                  </motion.div>
                               )}
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

                         </motion.div>)}
                    </AnimatePresence>
  );
};

export default ArmoryModal;

