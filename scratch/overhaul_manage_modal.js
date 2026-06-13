const fs = require('fs');
const path = 'c:\\Users\\omars\\Downloads\\ChillZoneLFG\\src\\app\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

const modalStart = '{isManageModalOpen && targetLobby && (';
const modalEnd = '        {isCreateModalOpen && ('; // Start of next modal

const startIndex = content.indexOf(modalStart);
const endIndex = content.indexOf(modalEnd);

if (startIndex !== -1 && endIndex !== -1) {
    const head = content.substring(0, startIndex);
    const tail = content.substring(endIndex);
    
    const newModal = `{isManageModalOpen && targetLobby && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className=\"w-full max-w-[1500px] h-[90vh] bg-[#05050a] border-2 border-[#ff007f]/40 rounded-[3.5rem] p-1 shadow-[0_0_100px_rgba(255,0,127,0.15)] relative overflow-hidden flex flex-col\">
                   
                   {/* MODAL BACKGROUND FX */}
                   <div className=\"absolute top-0 right-0 w-[500px] h-[500px] bg-[#ff007f]/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none\"></div>
                   <div className=\"absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#00ffff]/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none\"></div>

                   <div className=\"flex-1 flex flex-col p-8 md:p-12 relative z-10 min-h-0\">
                      {/* HEADER & TOP ACTIONS */}
                      <div className=\"flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 border-b border-white/5 pb-10\">
                         <div>
                            <div className=\"flex items-center gap-4 mb-2\">
                               <div className={\`w-3 h-3 rounded-full shadow-[0_0_10px_currentcolor] animate-pulse \${targetLobby.status === 'completed' ? 'text-green-500 bg-green-500' : targetLobby.status === 'in_progress' ? 'text-yellow-500 bg-yellow-500' : 'text-[#ff007f] bg-[#ff007f]'}\`}></div>
                               <h2 className=\"text-4xl font-black uppercase tracking-tighter text-white\">{t(\"commandControl\")}</h2>
                            </div>
                            <div className=\"flex items-center gap-6\">
                               <p className=\"text-gray-500 font-black uppercase tracking-[0.2em] text-[9px]\">{t(\"missionLead\")}: <span className=\"text-[#ff007f]\">{targetLobby.ownerDiscordName}</span></p>
                               <span className=\"w-1.5 h-1.5 rounded-full bg-white/10\"></span>
                               <p className=\"text-gray-500 font-black uppercase tracking-[0.2em] text-[9px]\">STATUS: <span className=\"text-white/80\">{targetLobby.status?.toUpperCase() || 'STANDBY'}</span></p>
                            </div>
                         </div>

                         {/* ACTION BUTTONS - ACCESSIBLE AT TOP */}
                         <div className=\"flex gap-4 w-full md:w-auto\">
                            {currentUserId === targetLobby.ownerId && (
                               <>
                                  {(!targetLobby.status || targetLobby.status === 'standby') && (
                                     <button onClick={() => { const updated = {...targetLobby, status: 'in_progress'}; setTargetLobby(updated); handleUpdateLobby(updated); addToast(\"Mission Started!\", \"success\"); playSound('terminal'); }} className=\"px-8 py-3.5 bg-green-500 text-black rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-[0_0_30px_rgba(34,197,94,0.3)] flex items-center gap-2 hover:scale-105 active:scale-95 transition-all\">
                                        <Play className=\"w-4 h-4 fill-current\" /> EXECUTE MISSION
                                     </button>
                                  )}
                                  {targetLobby.status === 'in_progress' && (
                                     <button onClick={() => { const updated = {...targetLobby, status: 'completed'}; setTargetLobby(updated); handleUpdateLobby(updated); addToast(\"Mission marked as COMPLETED!\", \"success\"); playSound('terminal'); }} className=\"px-8 py-3.5 bg-[#00ffff] text-black rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-[0_0_30px_rgba(0,255,255,0.3)] flex items-center gap-2 hover:scale-105 active:scale-95 transition-all\">
                                        <CheckCircle2 className=\"w-4 h-4\" /> MARK COMPLETE
                                     </button>
                                  )}
                                  <button onClick={() => { if(confirm(\"Terminate Mission?\")) { deleteLobby(targetLobby.id); setIsManageModalOpen(false); } }} className=\"px-4 py-3.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl font-black uppercase text-[9px] hover:bg-red-500 hover:text-white transition-all\">Abort</button>
                               </>
                            )}
                            <button onClick={() => setIsManageModalOpen(false)} className=\"p-3.5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-gray-500\"><X /></button>
                         </div>
                      </div>

                      <div className=\"flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10 min-h-0\">
                         {/* LEFT COLUMN: OPERATIVES & LOGS */}
                         <div className=\"lg:col-span-8 flex flex-col gap-10 min-h-0\">
                            
                            {/* SECURED OPERATIVES GRID - COMPACT & FIXED AREA */}
                            <div className=\"bg-black/40 rounded-[2.5rem] border border-white/5 p-8 shadow-inner overflow-hidden flex flex-col\">
                               <h3 className=\"text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-8 flex items-center gap-3\"><Target className=\"w-4 h-4 text-[#00ffff]\" /> Tactical Unit Deployment</h3>
                               <div className=\"grid grid-cols-2 md:grid-cols-5 gap-4\">
                                  {['tank', 'healer', 'dps-1', 'dps-2', 'dps-3'].map((slot, idx) => {
                                     const roleType = slot.startsWith('dps') ? 'dps' : slot;
                                     const dpsIndex = slot.startsWith('dps') ? parseInt(slot.split('-')[1]) - 1 : 0;
                                     const dpsOccupants = (targetLobby.accepted || []).filter((a: any) => a.role === 'dps');
                                     const occupant = roleType === 'dps' ? dpsOccupants[dpsIndex] : (targetLobby.accepted || []).find((a: any) => a.role === roleType);
                                     const isMe = occupant?.applicantId === currentUserId;
                                     
                                     return (
                                        <div key={slot} className={\`relative group p-4 rounded-[2rem] border-2 transition-all flex flex-col items-center justify-center text-center min-h-[220px] \${occupant ? 'bg-gradient-to-b from-[#00ffff]/10 to-transparent border-[#00ffff]/40 shadow-xl' : 'bg-black/20 border-dashed border-white/5 opacity-30'}\`}>
                                           <div className={\`w-14 h-14 rounded-[1.2rem] flex items-center justify-center text-2xl mb-4 shadow-2xl relative \${occupant ? 'bg-black border-2 border-[#00ffff]' : 'bg-white/5 border border-white/10'}\`}>
                                              {occupant && <div className=\"absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#00ffff] rounded-full flex items-center justify-center border-2 border-black animate-bounce\"><Check className=\"w-3 h-3 text-black\" /></div>}
                                              {roleType === 'tank' ? '🛡️' : roleType === 'healer' ? '💚' : '⚔️'}
                                           </div>
                                           {occupant ? (
                                              <div className=\"w-full\">
                                                 <p className=\"font-black text-sm text-white uppercase tracking-tighter truncate leading-tight mb-1\">{occupant.applicantName || occupant.name}</p>
                                                 <p className=\"text-[8px] font-black text-[#00ffff] uppercase tracking-widest opacity-60 mb-3\">{occupant.score} IO</p>
                                                 
                                                 <div className=\"space-y-1.5 opacity-0 group-hover:opacity-100 transition-opacity\">
                                                    <button onClick={() => { const cmd = \`/inv \${occupant.name}-\${occupant.realm?.replace(/\\s+/g, '')}\`; navigator.clipboard.writeText(cmd); addToast(\`Copied: \${cmd}\`, \"success\"); }} className=\"w-full py-2 bg-black/80 rounded-xl text-[8px] text-[#00ffff] font-black uppercase tracking-widest border border-[#00ffff]/20 hover:bg-[#00ffff] hover:text-black transition-all\">/inv</button>
                                                    {isMe && currentUserId !== targetLobby.ownerId && (
                                                       <button onClick={() => { 
                                                          const updatedAcc = targetLobby.accepted.filter((x: any) => x.applicantId !== currentUserId); 
                                                          const updatedLobby = { ...targetLobby, roles: { ...targetLobby.roles, [occupant.role]: targetLobby.roles[occupant.role] + 1 }, accepted: updatedAcc }; 
                                                          const updatedLobbies = lobbies.map(l => l.id === targetLobby.id ? updatedLobby : l); 
                                                          setLobbies(updatedLobbies); 
                                                          setIsManageModalOpen(false); 
                                                          saveGlobalData({ lobbies: updatedLobbies }); 
                                                          addToast(\"Left mission.\", \"info\"); 
                                                       }} className=\"w-full py-1.5 bg-yellow-500/10 text-yellow-500 rounded-lg font-black uppercase text-[7px] tracking-widest\">Leave</button>
                                                    )}
                                                 </div>
                                              </div>
                                           ) : (
                                              <p className=\"text-[8px] font-black uppercase text-gray-700 tracking-[0.2em]\">{roleType} SLOT</p>
                                           )}
                                        </div>
                                     );
                                  })}
                               </div>
                            </div>

                            {/* APPLICANTS (ONLY FOR LEADER) - REDUCED HEIGHT */}
                            {currentUserId === targetLobby.ownerId && (
                               <div className=\"flex flex-col min-h-0 max-h-[40%] bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8\">
                                  <h3 className=\"text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-3\"><Users className=\"w-4 h-4 text-[#ff007f]\" /> Incoming Transmissions ({targetLobby.applicants?.length || 0})</h3>
                                  <div className=\"flex-1 overflow-y-auto space-y-3 pr-3 custom-scrollbar\">
                                     {targetLobby.applicants?.length === 0 ? (
                                        <div className=\"py-10 flex flex-col items-center justify-center opacity-10\">
                                           <Radio className=\"w-8 h-8 mb-2\" />
                                           <p className=\"text-[9px] font-black uppercase tracking-widest text-center leading-loose\">Antenna online...<br/>Scanning for signals</p>
                                        </div>
                                     ) : (
                                        targetLobby.applicants?.map((app: any) => (
                                           <div key={app.id} className=\"bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between group hover:border-[#ff007f]/40 transition-all\">
                                              <div className=\"flex items-center gap-4\">
                                                 <div className={\`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-xl \${app.role === 'tank' ? 'bg-blue-500/10' : app.role === 'healer' ? 'bg-green-500/10' : 'bg-red-500/10'}\`}>{app.role==='tank'?'🛡️':app.role==='healer'?'💚':'⚔️'}</div>
                                                 <div>
                                                    <p className=\"font-black text-lg text-white leading-tight mb-0.5\">{renderDualColorName(app.applicantName || app.name)}</p>
                                                    <p className=\"text-[9px] font-black text-gray-500 uppercase tracking-widest\">{app.score} IO • {app.ilvl} iLvl • {app.class}</p>
                                                 </div>
                                              </div>
                                              <div className=\"flex gap-2\">
                                                 <button onClick={() => handleAccept(app)} className=\"px-5 py-2.5 bg-green-500 text-black font-black rounded-xl hover:scale-105 transition-all text-[9px] uppercase\">Enlist</button>
                                                 <button onClick={() => handleReject(app.id)} className=\"px-5 py-2.5 bg-white/5 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all text-[9px] font-black uppercase\">Deny</button>
                                              </div>
                                           </div>
                                        ))
                                     )}
                                  </div>
                               </div>
                            )}
                         </div>

                         {/* RIGHT COLUMN: COMS & PAYMENT PROOF */}
                         <div className=\"lg:col-span-4 flex flex-col gap-8 min-h-0\">
                            
                            {/* PAYMENT PROOF SECTION */}
                            <div className={\`p-8 rounded-[3rem] border-2 flex flex-col gap-4 transition-all \${targetLobby.status === 'completed' ? 'border-green-500/50 bg-green-500/5 animate-pulse' : 'border-white/5 bg-black/40'}\`}>
                               <div className=\"flex items-center gap-3 mb-2\">
                                  <div className={\`p-2 rounded-lg \${targetLobby.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}\`}><CircleDollarSign className=\"w-5 h-5\" /></div>
                                  <h4 className=\"text-[10px] font-black uppercase tracking-widest text-white/60\">Payment Proof Transaction</h4>
                               </div>

                               {targetLobby.paymentProof ? (
                                  <div className=\"flex flex-col gap-4\">
                                     <div className=\"rounded-2xl overflow-hidden border-2 border-white/5 aspect-video bg-black flex items-center justify-center\">
                                        <img src={targetLobby.paymentProof} className=\"w-full h-full object-cover\" />
                                     </div>
                                     <p className=\"text-[9px] font-black text-green-500 uppercase tracking-[0.2em] text-center\">✅ Verified Transmission</p>
                                     {currentUserId === targetLobby.ownerId && (
                                       <button onClick={() => { const updated = {...targetLobby, paymentProof: null}; setTargetLobby(updated); handleUpdateLobby(updated); }} className=\"text-[8px] font-black text-red-500/50 uppercase tracking-widest hover:text-red-500 transition-all\">Remove Image</button>
                                     )}
                                  </div>
                               ) : (
                                  <div className=\"flex flex-col gap-4\">
                                     <p className=\"text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed\">Required upon mission completion to verify operative compensation.</p>
                                     {currentUserId === targetLobby.ownerId ? (
                                        <div className=\"flex flex-col gap-2\">
                                           <input 
                                              type=\"text\" 
                                              placeholder=\"Paste image link here...\" 
                                              onKeyDown={(e) => {
                                                 if (e.key === 'Enter') {
                                                    const val = (e.target as HTMLInputElement).value;
                                                    if (val) {
                                                       const updated = {...targetLobby, paymentProof: val};
                                                       setTargetLobby(updated);
                                                       handleUpdateLobby(updated);
                                                       addToast(\"Payment Proof Uploaded!\", \"success\");
                                                    }
                                                 }
                                              }}
                                              className=\"w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-[10px] text-white outline-none focus:border-[#00ffff] font-black uppercase transition-all\" 
                                           />
                                           <p className=\"text-[7px] text-gray-600 font-black uppercase tracking-widest text-center\">Press Enter to Dispatch</p>
                                        </div>
                                     ) : (
                                        <div className=\"py-6 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center opacity-30\">
                                           <Clock className=\"w-6 h-6 mb-2 text-gray-500\" />
                                           <p className=\"text-[8px] font-black uppercase tracking-widest\">Awaiting Payout Proof</p>
                                        </div>
                                     )}
                                  </div>
                                )}
                            </div>

                            {/* SECURE CHAT */}
                            <div className=\"flex-1 flex flex-col bg-black/60 border-2 border-white/5 rounded-[3.5rem] overflow-hidden shadow-2xl relative min-h-0\">
                               <div className=\"p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-white/[0.02] to-transparent\">
                                  <div className=\"flex items-center gap-4\">
                                     <div className=\"w-2.5 h-2.5 rounded-full bg-[#00ffff] shadow-[0_0_10px_#00ffff] animate-pulse\"></div>
                                     <h4 className=\"text-[10px] font-black uppercase tracking-[0.3em] text-white/40\">Secure Frequency</h4>
                                  </div>
                                  <ShieldCheck className=\"w-4 h-4 text-[#00ffff]/40\" />
                               </div>
                               
                               <div className=\"flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar\">
                                  {(!targetLobby.messages || targetLobby.messages.length === 0) ? (
                                     <div className=\"h-full flex flex-col items-center justify-center opacity-10\">
                                        <MessageSquare className=\"w-12 h-12 mb-4\" />
                                        <p className=\"text-[9px] font-black uppercase tracking-[0.5em]\">No Intercepts</p>
                                     </div>
                                  ) : (
                                     targetLobby.messages.map((msg: any) => {
                                        const isMe = msg.from.toLowerCase() === currentUserDisplay.toLowerCase();
                                        return (
                                           <div key={msg.id} className={\`flex flex-col \${isMe ? 'items-end' : 'items-start'}\`}>
                                              <div className={\`group relative max-w-[90%] px-5 py-4 rounded-[1.8rem] \${isMe ? 'bg-[#ff007f] text-white rounded-tr-none' : 'bg-white/10 text-gray-200 rounded-tl-none border border-white/5 shadow-xl'}\`}>
                                                 <p className={\`text-[8px] font-black uppercase tracking-widest opacity-60 mb-2\`}>{msg.from}</p>
                                                 <p className=\"text-[13px] font-bold leading-relaxed\">{msg.text}</p>
                                                 <span className=\"absolute bottom-1.5 right-4 text-[7px] font-black opacity-30 italic\">{msg.time}</span>
                                              </div>
                                           </div>
                                        );
                                     })
                                  )}
                               </div>

                               <div className=\"p-8 bg-black/80 border-t border-white/5 flex gap-3\">
                                  <input 
                                     type=\"text\" 
                                     value={chatMessage} 
                                     onChange={(e) => setChatMessage(e.target.value)} 
                                     onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(targetLobby.id)} 
                                     placeholder=\"Transmit signal...\" 
                                     className=\"flex-1 bg-white/5 border-2 border-white/10 rounded-2xl px-5 py-4 text-xs font-bold outline-none focus:border-[#00ffff]/60 transition-all text-white\"
                                  />
                                  <button onClick={() => handleSendMessage(targetLobby.id)} className=\"px-6 bg-[#00ffff] text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all\">Send</button>
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                </motion.div>
            </motion.div>
          )}`;
    
    fs.writeFileSync(path, head + newModal + '\n' + tail);
    console.log('Manage Modal completely overhauled successfully');
} else {
    console.log('Indices not found:', startIndex, endIndex);
}
