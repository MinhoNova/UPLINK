const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// Find the toast system start
const startIdx = content.indexOf('{/* TOAST SYSTEM */}');
if (startIdx === -1) {
    console.log("Could not find toast system");
    process.exit(1);
}

// Keep everything BEFORE the first toast system
const beforeToasts = content.substring(0, startIdx);

const correctEnding = `
               {/* TOAST SYSTEM */}
               <div className="fixed bottom-10 right-10 z-[100] flex flex-col gap-4 pointer-events-none">
                  <AnimatePresence>
                     {toasts.map(t => (
                        <motion.div key={t.id} initial={{ opacity: 0, x: 50, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.8, x: 20 }} className={\`pointer-events-auto px-8 py-5 rounded-2xl border-2 backdrop-blur-xl shadow-2xl flex items-center gap-4 min-w-[300px] \${t.type === 'error' ? 'bg-red-500/10 border-red-500 text-red-500' : t.type === 'success' ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-black/80 border-[#00ffff] text-[#00ffff]'}\`}>
                           {t.type === 'error' ? <ShieldAlert className="w-6 h-6" /> : t.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
                           <div><p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Frequency Alert</p><p className="font-black text-sm">{t.msg}</p></div>
                        </motion.div>
                     ))}
                  </AnimatePresence>
               </div>
            </>
         )
      ) : (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=1600')] bg-cover opacity-10 grayscale" />
               <div className="absolute inset-0 bg-gradient-to-b from-[#ff007f]/20 via-transparent to-black" />
               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 text-center max-w-2xl">
                  <h1 className="text-8xl font-black text-white uppercase tracking-tighter mb-4 italic">UPLINK</h1>
                  <p className="text-[#ff007f] font-black tracking-[0.5em] mb-12 uppercase text-xs">Secure Gaming Network</p>
                  <div className="p-12 bg-white/5 backdrop-blur-2xl rounded-[3rem] border border-white/10 shadow-2xl">
                     <p className="text-gray-400 mb-12 font-medium leading-relaxed text-lg">This site is for registered members only. Please sign in to access the system.</p>
                     <motion.button onClick={() => signIn("discord")} className="w-full py-8 bg-white text-black font-black uppercase text-2xl rounded-[2rem] flex items-center justify-center gap-4 hover:bg-[#ff007f] hover:text-white transition-all shadow-xl group">
                        <ShieldCheck className="w-8 h-8" /> Sign in with Discord
                     </motion.button>
                  </div>
                  {deleteConfirmation?.isOpen && (
                     <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-[#05050a] border border-[#ff007f]/30 p-8 rounded-3xl max-w-sm w-full text-center">
                           <h3 className="text-xl font-black text-white mb-4">DELETE BACKGROUND</h3>
                           <p className="text-gray-400 text-sm mb-8">Are you sure you want to delete this background? This action cannot be undone.</p>
                           <div className="flex gap-4">
                              <button onClick={() => setDeleteConfirmation(null)} className="flex-1 py-3 bg-white/5 text-white font-black uppercase text-[10px] rounded-xl hover:bg-white/10">CANCEL</button>
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
                              }} className="flex-1 py-3 bg-red-600 text-white font-black uppercase text-[10px] rounded-xl hover:bg-red-500">CONFIRM</button>
                           </div>
                        </div>
                     </div>
                  )}
               </motion.div>
            </div>
         )}
       </div>
    </div>
 );
}
`;

fs.writeFileSync('src/app/page.tsx', beforeToasts + correctEnding);
console.log("File repaired successfully.");
