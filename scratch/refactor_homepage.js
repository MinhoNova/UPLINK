const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Find the start of the return block
const returnIdx = content.indexOf('return (');
const head = content.substring(0, returnIdx);

// 2. Extract the blocks (carefully)
// I'll use markers or find unique strings.

const onboardingStartMarker = 'bg-[#06060c] flex items-center justify-center p-6 overflow-hidden';
const onboardingStartIdx = content.indexOf('<div className="fixed inset-0 z-[9999]', content.indexOf(onboardingStartMarker) - 100);
const onboardingEndIdx = content.indexOf(') : (', onboardingStartIdx);
const onboardingContent = content.substring(onboardingStartIdx, onboardingEndIdx).trim();

const mainContentStartIdx = content.indexOf('<>', onboardingEndIdx);
const mainContentEndIdx = content.lastIndexOf('</>');
const mainContent = content.substring(mainContentStartIdx, mainContentEndIdx + 3).trim();

const loginStartIdx = content.indexOf('<div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 relative overflow-hidden">', mainContentEndIdx);
const loginEndIdx = content.lastIndexOf('</motion.div>') + 13; // Plus closing div of login
const loginContent = content.substring(loginStartIdx, loginEndIdx).trim();

// 3. Reconstruct HomePage with early returns
const newHomePage = \`
   if (!session) {
      return (
         \${loginContent}
      );
   }

   if (isOnboardingModalOpen) {
      return (
         \${onboardingContent}
      );
   }

   return (
      <div className={\\\`min-h-screen relative \\\${theme === 'light' ? 'text-[#1a1a2e]' : 'text-gray-200'} selection:bg-[#ff007f]/30 font-[family-name:var(--font-outfit)] overflow-x-hidden bg-black\\\`}>
         <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 60, repeat: Infinity }} className="w-full h-full">
               <img src="/vibrant_galaxy_v2_1778225408385.png" className="w-full h-full object-cover opacity-60" />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80"></div>
         </div>
         <div className="relative z-10">
            \${mainContent}
         </div>
      </div>
   );
}
\`;

fs.writeFileSync('src/app/page.tsx', head + newHomePage);
console.log("HomePage refactored for stability.");
