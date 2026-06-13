const fs = require('fs');
const path = 'c:\\Users\\omars\\Downloads\\ChillZoneLFG\\src\\app\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Ensure 2 DPS default
content = content.replace(/roles: \{ tank: 1, healer: 1, dps: 3 \}/g, 'roles: { tank: 1, healer: 1, dps: 2 }');

// Ensure Manage Modal slots for 2 DPS
content = content.replace('grid-cols-2 md:grid-cols-5 gap-4', 'grid-cols-2 md:grid-cols-4 gap-4');
content = content.replace("['tank', 'healer', 'dps-1', 'dps-2', 'dps-3']", "['tank', 'healer', 'dps-1', 'dps-2']");

// Ensure filtering for main grid
if (!content.includes('lobbies.filter(l => !l.status || l.status === "standby").map')) {
    content = content.replace('activeMainTab === "boosts" && lobbies.map(lobby => (', 'activeMainTab === "boosts" && lobbies.filter(l => !l.status || l.status === "standby").map(lobby => (');
}

// Final check on Manage Buttons (Stat Injection & Confirmation)
const finalButtons = `{currentUserId === targetLobby.ownerId && (
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
                            )}`;

// Locate the current buttons area and swap
const buttonsStart = '{currentUserId === targetLobby.ownerId && (';
const buttonsEnd = '                             )}';
const firstIndex = content.indexOf(buttonsStart);
if (firstIndex !== -1) {
    const lastIndex = content.indexOf(buttonsEnd, firstIndex);
    if (lastIndex !== -1) {
        content = content.substring(0, firstIndex) + finalButtons + content.substring(lastIndex + buttonsEnd.length);
        console.log('Buttons swapped successfully');
    }
}

fs.writeFileSync(path, content);
console.log('Super Fix Executed');
