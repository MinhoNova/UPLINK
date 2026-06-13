const fs = require('fs');
const path = 'c:\\Users\\omars\\Downloads\\ChillZoneLFG\\src\\app\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update Grid Filters (Hide completed from main list)
content = content.replace(
    'activeMainTab === "boosts" && lobbies.map(lobby => (',
    'activeMainTab === "boosts" && lobbies.filter(l => !l.status || l.status === "standby").map(lobby => ('
);

// 2. Update Sidebar Filters (Ongoing = Not Completed)
content = content.replace(
    'lobbies.filter(l => l.ownerId === currentUserId).map(l => (',
    'lobbies.filter(l => l.ownerId === currentUserId && l.status !== "completed").map(l => ('
);

// Match joined missions filter more accurately
content = content.replace(
    /lobbies\.filter\(l => l\.ownerId !== currentUserId && l\.accepted\?\.some\(\(a:any\) => a\.applicantId === currentUserId\)\)\.map\(l => \(/g,
    'lobbies.filter(l => l.ownerId !== currentUserId && l.status !== "completed" && l.accepted?.some((a:any) => a.applicantId === currentUserId)).map(l => ('
);

// 3. Update User Registration to include empty stats
if (content.includes('effect: "cyanGlow" }') && !content.includes('stats:')) {
    content = content.replace(
        'effect: "cyanGlow" }',
        'effect: "cyanGlow", stats: { total: 0, k5: 0, k10: 0, k15: 0, k20: 0 } }'
    );
}

// 4. Update Manage Modal Buttons logic
const modalButtonsRegex = /\{currentUserId === targetLobby\.ownerId && \(\s+<>\s+\{\(!targetLobby\.status \|\| targetLobby\.status === 'standby'\) && \([\s\S]+?Abort<\/button>\s+<>\s+\)\}/;
const newButtons = `{currentUserId === targetLobby.ownerId && (
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
                                  <button onClick={() => { if(confirm("Terminate Mission?")) { deleteLobby(targetLobby.id); setIsManageModalOpen(false); } }} className="px-4 py-3.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl font-black uppercase text-[9px] hover:bg-red-500 hover:text-white transition-all">Abort</button>
                               </>
                            )}`;

if (modalButtonsRegex.test(content)) {
    content = content.replace(modalButtonsRegex, newButtons);
    console.log('Manage buttons updated');
} else {
    console.log('Manage buttons regex failed');
}

// 5. Add History Tab to Armory
if (!content.includes('setActiveArmoryTab("history")')) {
    content = content.replace(
        '<button onClick={() => setActiveArmoryTab("bank")}',
        '<button onClick={() => setActiveArmoryTab("history")} className={`px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeArmoryTab === "history" ? "bg-[#ff007f] text-white shadow-lg" : "hover:bg-white/5 text-gray-400"}`}>History</button>\n                            <button onClick={() => setActiveArmoryTab("bank")}'
    );
}

// 6. Implement History View
const historyView = `
                    {activeArmoryTab === "history" && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h3 className="text-3xl font-black text-[#ff007f] mb-10 uppercase tracking-widest text-center md:text-left">Mission Archive</h3>
                        <div className="grid grid-cols-1 gap-6 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                           {lobbies.filter(l => l.status === 'completed' && (l.ownerId === currentUserId || l.accepted?.some((a:any) => a.applicantId === currentUserId))).length === 0 ? (
                              <div className="py-20 text-center opacity-20 flex flex-col items-center">
                                 <Clock className="w-16 h-16 mb-4" />
                                 <p className="font-black uppercase tracking-[0.5em]">No records in archive</p>
                              </div>
                           ) : (
                              lobbies.filter(l => l.status === 'completed' && (l.ownerId === currentUserId || l.accepted?.some((a:any) => a.applicantId === currentUserId))).map(l => (
                                 <div key={l.id} className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-[#ff007f]/40 transition-all shadow-xl">
                                    <div className="flex items-center gap-6 flex-1 min-w-0">
                                       <div className="w-16 h-16 rounded-2xl bg-black border border-white/10 flex items-center justify-center text-3xl opacity-50 flex-shrink-0">📜</div>
                                       <div className="min-w-0">
                                          <p className="font-black text-xl text-white uppercase truncate">{l.title}</p>
                                          <div className="flex flex-wrap gap-4 mt-2">
                                             <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">COMMISSION: {l.goldPerRun}K</span>
                                             <span className={\`text-[9px] font-black uppercase tracking-widest \${l.payoutStatus === 'paid' ? 'text-green-500' : 'text-yellow-500'}\`}>PAYOUT: {l.payoutStatus || 'PENDING'}</span>
                                          </div>
                                       </div>
                                    </div>
                                    <div className="flex gap-3 mt-4 md:mt-0">
                                       <button onClick={() => { setTargetLobby(l); setIsManageModalOpen(true); }} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Terminal Access</button>
                                       {l.ownerId === currentUserId && (
                                          <button onClick={() => deleteLobby(l.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-4 h-4"/></button>
                                       )}
                                    </div>
                                 </div>
                              ))
                           )}
                        </div>
                      </motion.div>
                    )}`;

if (!content.includes('activeArmoryTab === "history"')) {
    content = content.replace('{activeArmoryTab === "bank" && (', historyView + '\n                    {activeArmoryTab === "bank" && (');
}

// 7. Display Stats in applicant list
content = content.replace(
    /<span>\{app\.class\}<\/span>/g,
    `<span>{app.class}</span>\n                                                       <span className="w-1 h-1 rounded-full bg-white/20"></span>\n                                                       <span className="text-yellow-500 font-bold">{registeredUsers.find(u => u.username === app.applicantId || u.id === app.applicantId)?.stats?.total || 0} COMPLETED OPS</span>`
);

fs.writeFileSync(path, content);
console.log('Advanced Lifecycle & 2-DPS Fix Complete');
