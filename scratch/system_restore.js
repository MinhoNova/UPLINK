const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Identify the start of HomePage
const homePageMarker = 'export default function HomePage()';
const homePageIdx = content.indexOf(homePageMarker);
if (homePageIdx === -1) {
    console.log("Could not find HomePage");
    process.exit(1);
}

// 2. Identify the start of the return statement within HomePage
const returnMarker = 'return (';
const returnIdx = content.indexOf(returnMarker, homePageIdx);
if (returnIdx === -1) {
    console.log("Could not find return statement");
    process.exit(1);
}

// 3. Keep everything from the start of the file up to the return statement
const cleanHead = content.substring(0, returnIdx);

// 4. Append a clean, simple return block
const cleanReturn = \`return (
      <div className="bg-[#05050a] min-h-screen text-white flex flex-col items-center justify-center p-20 relative overflow-hidden">
         {/* Background FX */}
         <div className="absolute inset-0 z-0 opacity-20">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#ff007f]/30 blur-[150px] rounded-full animate-pulse" />
         </div>
         
         <div className="relative z-10 text-center">
            <h1 className="text-[12vw] font-black text-white uppercase tracking-tighter italic leading-none mb-10 drop-shadow-[0_0_50px_rgba(255,0,127,0.5)]">
               UPLINK<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff007f] to-[#7000ff]">STABLE</span>
            </h1>
            
            <p className="text-gray-500 font-black tracking-[0.5em] uppercase text-xl mb-20">System Integrity: 100%</p>
            
            <div className="flex flex-col items-center gap-10">
               {status === "loading" ? (
                  <div className="w-20 h-20 border-4 border-[#ff007f] border-t-transparent rounded-full animate-spin" />
               ) : session ? (
                  <div className="flex flex-col items-center gap-8">
                     <div className="flex items-center gap-6 p-6 bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10">
                        <img src={session.user?.image || ""} className="w-16 h-16 rounded-full border-2 border-[#ff007f]" />
                        <div className="text-left">
                           <p className="text-white font-black uppercase text-xl">{session.user?.name}</p>
                           <p className="text-[#ff007f] font-black uppercase text-xs tracking-widest">Operative Status: Authorized</p>
                        </div>
                     </div>
                     <button onClick={() => signOut()} className="px-20 py-8 bg-white text-black font-black uppercase text-2xl rounded-3xl hover:bg-[#ff007f] hover:text-white transition-all shadow-2xl">Re-Initiate Transmission</button>
                  </div>
               ) : (
                  <button onClick={() => signIn("discord")} className="px-32 py-10 bg-white text-black font-black uppercase text-3xl rounded-[3rem] hover:bg-[#ff007f] hover:text-white transition-all shadow-[0_0_100px_rgba(255,255,255,0.2)]">
                     Login via Discord
                  </button>
               )}
            </div>
         </div>
      </div>
   );
}
\`;

fs.writeFileSync('src/app/page.tsx', cleanHead + cleanReturn);
console.log("SYSTEM RESTORE COMPLETE.");
