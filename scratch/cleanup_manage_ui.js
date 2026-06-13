const fs = require('fs');
const path = 'c:\\Users\\omars\\Downloads\\ChillZoneLFG\\src\\app\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

const startMarker = '{/* ACTION BUTTONS - ACCESSIBLE AT TOP */}';
const endMarker = '<div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10 min-h-0">';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const head = content.substring(0, startIndex);
    const tail = content.substring(endIndex);
    
    const middle = `${startMarker}
                         <div className="flex gap-4 w-full md:w-auto">
                            {currentUserId === targetLobby.ownerId && (
                               <>
                                  {(!targetLobby.status || targetLobby.status === 'standby') && (
                                     <button onClick={() => { const updated = {...targetLobby, status: 'in_progress'}; setTargetLobby(updated); handleUpdateLobby(updated); addToast("Mission Started!", "success"); playSound('terminal'); }} className="px-8 py-3.5 bg-green-500 text-black rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-[0_0_30px_rgba(34,197,94,0.3)] flex items-center gap-2 hover:scale-105 active:scale-95 transition-all">
                                        <Play className="w-4 h-4 fill-current" /> EXECUTE MISSION
                                     </button>
                                  )}
                                  {targetLobby.status === 'in_progress' && (
                                     <button onClick={() => { const updated = {...targetLobby, status: 'completed', payoutStatus: 'pending'}; setTargetLobby(updated); handleUpdateLobby(updated); addToast("Mission marked as COMPLETED! Awaiting Payout Proof.", "success"); playSound('terminal'); }} className="px-8 py-3.5 bg-yellow-500 text-black rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-[0_0_30px_rgba(234,179,8,0.3)] flex items-center gap-2 hover:scale-105 active:scale-95 transition-all">
                                        <CheckCircle2 className="w-4 h-4" /> MARK COMPLETED
                                     </button>
                                  )}
                                  {targetLobby.status === 'completed' && targetLobby.paymentProof && targetLobby.payoutStatus !== 'paid' && (
                                     <button onClick={() => { 
                                        const updated = {...targetLobby, payoutStatus: 'paid'}; 
                                        setTargetLobby(updated);
                                        const updatedUsers = [...registeredUsers];
                                        targetLobby.accepted.forEach((member) => {
                                           const uIdx = updatedUsers.findIndex(u => u.id === member.applicantId || u.username === member.applicantId);
                                           if (uIdx !== -1) {
                                              const stats = updatedUsers[uIdx].stats || { total: 0, k5: 0, k10: 0, k15: 0, k20: 0 };
                                              stats.total += 1;
                                              const kLevel = parseInt(targetLobby.keyLevel?.replace('+', '') || '0');
                                              if (kLevel >= 20) stats.k20 += 1;
                                              else if (kLevel >= 15) stats.k15 += 1;
                                              else if (kLevel >= 10) stats.k10 += 1;
                                              else if (kLevel >= 5) stats.k5 += 1;
                                              updatedUsers[uIdx].stats = stats;
                                           }
                                        });
                                        setRegisteredUsers(updatedUsers);
                                        handleUpdateLobby(updated);
                                        saveGlobalData({ registeredUsers: updatedUsers });
                                        addToast("Payment Confirmed! Player stats updated.", "success");
                                        playSound('reward');
                                     }} className="px-8 py-3.5 bg-green-500 text-black rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-[0_0_30px_rgba(34,197,94,0.3)] flex items-center gap-2 hover:scale-105 active:scale-95 transition-all">
                                        <Coins className="w-4 h-4" /> CONFIRM PAYOUT
                                     </button>
                                  )}
                                  <button onClick={() => { if(confirm("Terminate Mission?")) { deleteLobby(targetLobby.id); setIsManageModalOpen(false); } }} className="px-4 py-3.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl font-black uppercase text-[9px] hover:bg-red-500 hover:text-white transition-all">Abort Ops</button>
                               </>
                            )}
                            <button onClick={() => setIsManageModalOpen(false)} className="p-3.5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-gray-500"><X /></button>
                         </div>
                      </div>
\n`;

    fs.writeFileSync(path, head + middle + tail);
    console.log('Manage UI cleaned and updated successfully');
}
