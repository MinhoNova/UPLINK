const fs = require('fs');
const path = 'c:\\Users\\omars\\Downloads\\ChillZoneLFG\\src\\app\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add States
if (!content.includes('isPaymentModalOpen')) {
    content = content.replace('const [isManageModalOpen, setIsManageModalOpen] = useState(false);', 'const [isManageModalOpen, setIsManageModalOpen] = useState(false);\n  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);');
}

// 2. Rename Abort to Cancel & Add Payment Button in Header
content = content.replace('Abort</button>', 'Cancel</button>'); // Double check text
content = content.replace('Abort Ops</button>', 'Cancel Ops</button>');

const paymentButton = `{targetLobby.status === 'completed' && (
                                     <button onClick={() => setIsPaymentModalOpen(true)} className="px-6 py-3.5 bg-[#ffd700]/10 border border-[#ffd700]/40 text-[#ffd700] rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-[#ffd700] hover:text-black transition-all">
                                        <CircleDollarSign className="w-4 h-4" /> PAYMENT PROOF
                                     </button>
                                  )}`;

if (!content.includes('setIsPaymentModalOpen(true)')) {
    content = content.replace('{targetLobby.status === \'in_progress\' && (', paymentButton + '\n                                  {targetLobby.status === \'in_progress\' && (');
}


// 3. Restructure Grid (Columns)
// Change Left Column to lg:col-span-5 and Right to lg:col-span-7
content = content.replace('<div className="lg:col-span-8 flex flex-col gap-10 min-h-0">', '<div className="lg:col-span-5 flex flex-col gap-8 min-h-0">');
content = content.replace('<div className="lg:col-span-4 flex flex-col gap-8 min-h-0">', '<div className="lg:col-span-7 flex flex-col gap-8 min-h-0">');

// 4. Remove Payment Proof Section from sidebar
const paymentSectionRegex = /\{(?:\s*)?\/\* PAYMENT PROOF SECTION \*\/ \*\/\s+<div className=\{\`p-8 rounded-\[3rem\] border-2 flex flex-col gap-4 transition-all[\s\S]+?<\/div>(?:\s+)?(?:\s+)?\)\}(?:\s+)?\}/;
// Wait, regex for payment section is hard. I'll just look for the start and end of that DIV.
const pStart = '/* PAYMENT PROOF SECTION */';
const pEnd = '/* SECURE CHAT */';
const si = content.indexOf(pStart);
const ei = content.indexOf(pEnd);
if (si !== -1 && ei !== -1) {
    content = content.substring(0, si) + content.substring(ei);
}

// 5. Update Team Grid to be more compact (2x2)
content = content.replace('grid-cols-2 md:grid-cols-4 gap-4', 'grid-cols-2 gap-3');
content = content.replace('min-h-[220px]', 'min-h-[160px]');

// 6. Add Payment Modal at the end of the file or after Manage Modal
const paymentModal = `
        {/* PAYMENT PROOF MODAL */}
        <AnimatePresence>
           {isPaymentModalOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl">
                 <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-2xl bg-[#05050a] border-2 border-[#ffd700]/30 rounded-[3rem] p-10 shadow-[0_0_100px_rgba(255,215,0,0.1)] relative">
                    <button onClick={() => setIsPaymentModalOpen(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white"><X/></button>
                    <div className="flex items-center gap-4 mb-8">
                       <div className="p-3 bg-[#ffd700]/10 rounded-2xl text-[#ffd700]"><CircleDollarSign className="w-8 h-8" /></div>
                       <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Payment Verification</h2>
                    </div>

                    <div className="bg-black/40 rounded-[2rem] border border-white/5 p-8 flex flex-col items-center justify-center min-h-[300px]">
                       {targetLobby.paymentProof ? (
                          <div className="w-full space-y-6">
                             <div className="rounded-[2rem] overflow-hidden border-4 border-white/5 aspect-video bg-black flex items-center justify-center shadow-2xl">
                                <img src={targetLobby.paymentProof} className="w-full h-full object-contain" />
                             </div>
                             {currentUserId === targetLobby.ownerId && (
                                <button onClick={() => { const updated = {...targetLobby, paymentProof: null}; setTargetLobby(updated); handleUpdateLobby(updated); }} className="w-full py-4 bg-red-500/10 text-red-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all">Discard Image</button>
                             )}
                          </div>
                       ) : (
                          <div className="w-full text-center space-y-6">
                             <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-dashed border-white/20 opacity-30"><PlusCircle className="w-10 h-10" /></div>
                             <p className="text-sm font-bold text-gray-500 uppercase tracking-widest leading-relaxed">Paste screenshot or drop image here to establish proof of transmission.</p>
                             {currentUserId === targetLobby.ownerId && (
                                <div className="space-y-3">
                                   <input 
                                      type="text" 
                                      placeholder="CTRL+V to Paste Screenshot..." 
                                      onPaste={(e) => {
                                         const items = e.clipboardData?.items;
                                         if (!items) return;
                                         for (let i = 0; i < items.length; i++) {
                                            if (items[i].type.indexOf("image") !== -1) {
                                               const blob = items[i].getAsFile();
                                               const reader = new FileReader();
                                               reader.onload = (ev) => {
                                                  const updated = {...targetLobby, paymentProof: ev.target?.result};
                                                  setTargetLobby(updated);
                                                  handleUpdateLobby(updated);
                                                  addToast("Transmission intercepted and captured.", "success");
                                               };
                                               if (blob) reader.readAsDataURL(blob);
                                            }
                                         }
                                      }}
                                      className="w-full bg-black border-2 border-white/10 rounded-2xl px-6 py-5 text-xs text-white outline-none focus:border-[#ffd700] font-black uppercase text-center transition-all shadow-inner" 
                                   />
                                   <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em]">Handshake Protocol Active</p>
                                </div>
                             )}
                          </div>
                       )}
                    </div>

                    {targetLobby.paymentProof && currentUserId === targetLobby.ownerId && targetLobby.payoutStatus !== 'paid' && (
                       <button 
                          onClick={() => {
                            // Run the confirmation logic
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
                            setIsPaymentModalOpen(false);
                            addToast("Payment Confirmed! Database updated.", "success");
                            playSound('reward');
                          }}
                          className="w-full py-5 bg-[#ffd700] text-black rounded-2xl font-black uppercase text-xs tracking-widest mt-8 shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                       >
                          Finalize Payout & Verify
                       </button>
                    )}
                 </motion.div>
              </motion.div>
           )}
        </AnimatePresence>
`;

content = content.replace('        {/* EDIT GOLD MODAL */}', paymentModal + '\n        {/* EDIT GOLD MODAL */}');

fs.writeFileSync(path, content);
console.log('UI Restructuring Complete');
