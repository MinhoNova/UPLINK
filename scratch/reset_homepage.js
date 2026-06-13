const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

const returnIdx = content.indexOf('return (');
const head = content.substring(0, returnIdx);

const cleanReturn = \`return (
      <div className={\\\`min-h-screen relative \\\${theme === 'light' ? 'text-[#1a1a2e]' : 'text-gray-200'} selection:bg-[#ff007f]/30 font-[family-name:var(--font-outfit)] overflow-x-hidden bg-black\\\`}>
         <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 60, repeat: Infinity }} className="w-full h-full">
               <img src="/vibrant_galaxy_v2_1778225408385.png" className="w-full h-full object-cover opacity-60" />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80"></div>
         </div>
         <div className="relative z-10">
            {session ? (
               isOnboardingModalOpen ? (
                  <div className="fixed inset-0 z-[9999] bg-[#06060c] flex items-center justify-center p-6 overflow-hidden">
                     <div className="text-white text-9xl font-black">ONBOARDING</div>
                  </div>
               ) : (
                  <div className="p-20">
                     <div className="text-white text-9xl font-black italic tracking-tighter">UPLINK ACTIVE</div>
                     <button onClick={() => signOut()} className="mt-10 px-10 py-5 bg-white text-black font-black uppercase rounded-2xl">Sign Out</button>
                  </div>
               )
            ) : (
               <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 relative overflow-hidden">
                  <div className="text-white text-9xl font-black italic tracking-tighter mb-10">UPLINK</div>
                  <button onClick={() => signIn("discord")} className="px-20 py-10 bg-white text-black font-black uppercase text-3xl rounded-[3rem]">Login</button>
               </div>
            )}
         </div>
      </div>
   );
}
\`;

fs.writeFileSync('src/app/page.tsx', head + cleanReturn);
console.log("HomePage reset to clean skeleton.");
