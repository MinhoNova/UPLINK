const fs = require('fs');
const path = 'c:\\Users\\omars\\Downloads\\ChillZoneLFG\\src\\app\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

const startMarker = '<AnimatePresence>\r\n          {isManageModalOpen && targetLobby && (';
const endMarker = '<AnimatePresence>\r\n          {isCreateModalOpen && (';

// Use a regex or index finding to replace everything between these markers
// We'll replace from line 820 down to the next AnimatePresence
const lines = content.split(/\r?\n/);
let startIndex = -1;
let endIndex = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('isManageModalOpen && targetLobby && (')) {
        startIndex = i - 1; // The <AnimatePresence> before it
    }
    if (startIndex !== -1 && i > startIndex && lines[i].includes('isCreateModalOpen && (')) {
        endIndex = i - 1; // The <AnimatePresence> before it
        break;
    }
}

if (startIndex !== -1 && endIndex !== -1) {
    const newLines = [
        ...lines.slice(0, startIndex),
        '        <AnimatePresence>',
        '          {isManageModalOpen && targetLobby && (',
        '            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">',
        '               <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className={`w-full max-w-[1400px] h-[85vh] ${theme === \'light\' ? \'bg-white\' : \'bg-[#080812]\'} border-2 border-[#ff007f]/50 rounded-[3rem] p-12 shadow-3xl relative overflow-hidden flex flex-col`}>',
        '                  <button onClick={() => setIsManageModalOpen(false)} className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-white z-50"><X/></button>',
        '                  <div className="mb-8">',
        '                     <h2 className={`text-4xl font-black uppercase ${theme === \'light\' ? \'text-black\' : \'text-[#ff007f]\'} mb-2 tracking-tighter`}>{t("commandControl")}</h2>',
        '                     <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">{t("missionLead")}: {targetLobby.ownerDiscordName} • ID: {targetLobby.id}</p>',
        '                  </div>',
        '                  <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-10 min-h-0">',
        '                     <div className="lg:col-span-2 flex flex-col gap-8 min-h-0">',
        '                        <div className="flex-1 flex flex-col min-h-0">',
        '                           <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-3"><Users className="w-5 h-5 text-[#ff007f]" /> {t("transmissions")} ({targetLobby.applicants?.length || 0})</h3>',
        '                           <div className="flex-1 overflow-y-auto space-y-3 pr-3 custom-scrollbar">',
        '                              {targetLobby.applicants?.map((app: any) => (',
        '                                 <div key={app.id} className={`${theme === \'light\' ? \'bg-gray-100 border-black/5\' : \'bg-white/5 border-white/10\'} border p-4 rounded-2xl flex items-center justify-between group hover:border-[#ff007f]/50 transition-all`}>',
        '                                    <div className="flex items-center gap-4">',
        '                                       <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-2xl shadow-inner">{app.role===\'tank\'?\'🛡️\':app.role===\'healer\'?\'💚\':\'⚔️\'}</div>',
        '                                       <div><p className="font-black text-lg leading-tight">{renderDualColorName(app.applicantName || app.name)}</p><p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{app.score} IO • {app.ilvl} iLvl • {app.role}</p></div>',
        '                                    </div>',
        '                                    <div className="flex gap-2">',
        '                                       <button onClick={() => handleAccept(app)} className="w-10 h-10 bg-green-500/20 text-green-500 border border-green-500/40 rounded-xl flex items-center justify-center hover:bg-green-500 hover:text-white transition-all shadow-lg"><Check className="w-5 h-5"/></button>',
        '                                       <button onClick={() => handleReject(app.id)} className="w-10 h-10 bg-red-500/20 text-red-500 border border-red-500/40 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-lg"><X className="w-5 h-5"/></button>',
        '                                    </div>',
        '                                 </div>',
        '                              ))}',
        '                           </div>',
        '                        </div>',
        '                        <div className="flex-1 flex flex-col min-h-0">',
        '                           <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-3">',
        '                              <CheckCircle2 className="w-5 h-5 text-[#00ffff]" /> {t("securedOps")}',
        '                           </h3>',
        '                           <div className={`flex-1 overflow-y-auto p-4 ${theme === \'light\' ? \'bg-gray-50 border-black/5\' : \'bg-black/50 border-white/5\'} rounded-[2rem] border shadow-inner custom-scrollbar`}>',
        '                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">',
        '                                 {[\'tank\', \'healer\', \'dps-1\', \'dps-2\', \'dps-3\'].map((slot, idx) => {',
        '                                    const roleType = slot.startsWith(\'dps\') ? \'dps\' : slot;',
        '                                    const dpsIndex = slot.startsWith(\'dps\') ? parseInt(slot.split(\'-\')[1]) - 1 : 0;',
        '                                    const dpsOccupants = (targetLobby.accepted || []).filter((a: any) => a.role === \'dps\');',
        '                                    const occupant = roleType === \'dps\' ? dpsOccupants[dpsIndex] : (targetLobby.accepted || []).find((a: any) => a.role === roleType);',
        '                                    const isMe = occupant?.applicantId === currentUserId;',
        '                                    return (',
        '                                       <div key={slot} className={`relative flex flex-col items-center p-4 rounded-3xl border-2 transition-all min-h-[200px] justify-center text-center ${occupant ? \'bg-[#00ffff]/10 border-[#00ffff]/40 shadow-2xl\' : \'bg-white/5 border-white/10 border-dashed opacity-30 scale-95\'}`}>',
        '                                          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl mb-4 shadow-2xl ${occupant ? \'bg-black border-2 border-[#00ffff]\' : \'bg-transparent border border-white/10 opacity-30\'}`}>',
        '                                             {roleType === \'tank\' ? \'🛡️\' : roleType === \'healer\' ? \'💚\' : \'⚔️\'}',
        '                                          </div>',
        '                                          {occupant ? (',
        '                                             <div className="flex flex-col items-center w-full h-full">',
        '                                                <div className="mb-4">',
        '                                                   <p className="font-black text-lg text-white uppercase tracking-tighter truncate w-full mb-1 leading-none">{occupant.applicantName || occupant.name} {isMe && "(YOU)"}</p>',
        '                                                   <p className="text-[10px] font-black text-[#00ffff] uppercase opacity-80">{occupant.score} IO • {occupant.class}</p>',
        '                                                </div>',
        '                                                <div className="mt-auto w-full space-y-2">',
        '                                                   <button onClick={() => { const cmd = `/inv \${occupant.name}-\${occupant.realm?.replace(/\\s+/g, \'\')}`; navigator.clipboard.writeText(cmd); addToast(`Command copied: \${cmd}`, "success"); }} className="w-full py-3 bg-black/60 border border-white/10 rounded-2xl text-[10px] text-[#00ffff] font-black uppercase hover:bg-[#00ffff] hover:text-black transition-all shadow-md">Copy /inv</button>',
        '                                                   {(currentUserId === targetLobby.ownerId || isAdmin) && !isMe && (',
        '                                                      <button onClick={() => { const updatedAcc = targetLobby.accepted.filter((x: any) => x.applicantId !== occupant.applicantId && x.id !== occupant.id); const updatedLobby = { ...targetLobby, roles: { ...targetLobby.roles, [occupant.role]: targetLobby.roles[occupant.role] + 1 }, accepted: updatedAcc }; const updatedLobbies = lobbies.map(l => l.id === targetLobby.id ? updatedLobby : l); setLobbies(updatedLobbies); setTargetLobby(updatedLobby); saveGlobalData({ lobbies: updatedLobbies }); addToast(`Operative \${occupant.applicantName} has been kicked.`, "error"); }} className="w-full py-2 bg-red-500/20 text-red-500 border border-red-500/40 hover:bg-red-500 hover:text-white rounded-xl font-black uppercase text-[9px] transition-all tracking-widest">KICK OPERATIVE</button>',
        '                                                   )}',
        '                                                   {isMe && currentUserId !== targetLobby.ownerId && (',
        '                                                      <button onClick={() => { const updatedAcc = targetLobby.accepted.filter((x: any) => x.applicantId !== currentUserId); const updatedLobby = { ...targetLobby, roles: { ...targetLobby.roles, [occupant.role]: targetLobby.roles[occupant.role] + 1 }, accepted: updatedAcc }; const updatedLobbies = lobbies.map(l => l.id === targetLobby.id ? updatedLobby : l); setLobbies(updatedLobbies); setIsManageModalOpen(false); saveGlobalData({ lobbies: updatedLobbies }); addToast(`You have left the mission.`, "info"); }} className="w-full py-2 bg-yellow-500/20 text-yellow-500 border border-yellow-500/40 hover:bg-yellow-500 hover:text-white rounded-xl font-black uppercase text-[9px] transition-all tracking-widest">LEAVE MISSION</button>',
        '                                                   )}',
        '                                                </div>',
        '                                             </div>',
        '                                          ) : (',
        '                                             <p className="text-[11px] font-black uppercase text-gray-700 tracking-[0.2em]">{roleType} VACANT</p>',
        '                                          )}',
        '                                       </div>',
        '                                    );',
        '                                 })}',
        '                                 {currentUserId === targetLobby.ownerId && (',
        '                                    <div className="lg:col-span-5 pt-6 border-t border-white/5 mt-4">',
        '                                       <button onClick={() => { if(confirm("Are you sure you want to terminate this mission?")) { deleteLobby(targetLobby.id); setIsManageModalOpen(false); } }} className="w-full py-4 bg-red-600/10 text-red-600 border border-red-600/30 rounded-3xl font-black uppercase text-xs tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all shadow-2xl">DESTRUCT MISSION & TERMINATE FREQUENCY</button>',
        '                                    </div>',
        '                                 )}',
        '                              </div>',
        '                           </div>',
        '                        </div>',
        '                     </div>',
        '                     <div className={`flex flex-col border-2 ${theme === \'light\' ? \'bg-gray-50 border-black/5\' : \'bg-black border-white/10\'} rounded-[2rem] overflow-hidden shadow-2xl min-h-0`}>',
        '                        <div className="p-5 border-b border-white/5 bg-[#ff007f]/5 flex items-center gap-3">',
        '                           <div className="w-2 h-2 rounded-full bg-[#00ffff] animate-pulse"></div>',
        '                           <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">{t("secureComms")}</h4>',
        '                        </div>',
        '                        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-black/40">',
        '                           {(targetLobby.messages || []).map((msg: any) => (',
        '                              <div key={msg.id} className={`flex flex-col ${msg.from.toLowerCase() === currentUserDisplay.toLowerCase() ? \'items-end\' : \'items-start\'}`}>',
        '                                 <div className={`max-w-[85%] px-6 py-4 rounded-3xl ${msg.from.toLowerCase() === currentUserDisplay.toLowerCase() ? \'bg-gradient-to-r from-[#ff007f] to-[#8a2be2] text-white rounded-tr-none\' : \'bg-white/10 text-gray-200 rounded-tl-none shadow-xl border border-white/5\'}`}>',
        '                                    <p className="font-black text-[10px] uppercase tracking-widest opacity-60 mb-2 flex items-center gap-2">{msg.from} <span className="w-1 h-1 rounded-full bg-white/30"></span> {msg.time}</p>',
        '                                    <p className="text-[15px] font-bold leading-relaxed">{msg.text}</p>',
        '                                 </div>',
        '                              </div>',
        '                           ))}',
        '                           {(!targetLobby.messages || targetLobby.messages.length === 0) && (',
        '                              <div className="h-full flex items-center justify-center text-center p-10"><p className="text-[12px] font-black uppercase text-gray-600 tracking-[0.3em]">{t("noMessages")}</p></div>',
        '                           )}',
        '                        </div>',
        '                        <div className="p-8 border-t border-white/10 flex gap-4 bg-black/60">',
        '                           <input type="text" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} onKeyDown={(e) => e.key === \'Enter\' && handleSendMessage(targetLobby.id)} placeholder="Transmit message to squadron..." className="flex-1 bg-black/80 border-2 border-white/10 rounded-2xl px-6 py-5 text-base font-bold outline-none focus:border-[#00ffff] transition-all shadow-inner text-white"/>',
        '                           <button onClick={() => handleSendMessage(targetLobby.id)} className="p-5 bg-[#00ffff] text-black rounded-2xl hover:scale-105 hover:shadow-[0_0_20px_#00ffff]/40 transition-all font-black uppercase text-sm px-8">Send</button>',
        '                        </div>',
        '                     </div>',
        '                  </div>',
        '               </motion.div>',
        '            </motion.div>',
        '          )}',
        '        </AnimatePresence>',
        ...lines.slice(endIndex)
    ];
    fs.writeFileSync(path, newLines.join('\n'), 'utf8');
    console.log("Successfully overhauled ManageModal range.");
} else {
    console.log("Could not find markers.", startIndex, endIndex);
}
