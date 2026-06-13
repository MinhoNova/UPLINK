const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// Find the return start
const returnStart = content.indexOf('return (');
const sessionStart = content.indexOf('{session ? (', returnStart);
const onboardingStart = content.indexOf('isOnboardingModalOpen ? (', sessionStart);

// I'll just rewrite the return block entirely using a template.
// I'll find the parts of the file I want to preserve.

const head = content.substring(0, returnStart);

// I need:
// 1. Onboarding content
// 2. Main content
// 3. Login content

const onboardingStartIdx = content.indexOf('<div className="fixed inset-0 z-[9999] bg-[#06060c]', onboardingStart);
const onboardingEndIdx = content.indexOf(') : (', onboardingStartIdx);
const onboardingContent = content.substring(onboardingStartIdx, onboardingEndIdx).trim();

const mainStartIdx = content.indexOf('<>', onboardingEndIdx);
const mainEndIdx = content.lastIndexOf('</>');
const mainContent = content.substring(mainStartIdx, mainEndIdx + 3).trim();

const loginStartIdx = content.indexOf('<div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 relative overflow-hidden">', mainEndIdx);
const loginEndIdx = content.indexOf('</motion.div>', loginStartIdx) + 13; // Plus closing div of login
const loginContentBlock = content.substring(loginStartIdx, loginEndIdx).trim();
// Login content might need one more closing div if it was wrapped.
// Actually, I'll just use the view_file from before.

const newReturn = `
   return (
      <div className={\`min-h-screen relative \${theme === 'light' ? 'text-[#1a1a2e]' : 'text-gray-200'} selection:bg-[#ff007f]/30 font-[family-name:var(--font-outfit)] overflow-x-hidden bg-black\`}>
         <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 60, repeat: Infinity }} className="w-full h-full">
               <img src="/vibrant_galaxy_v2_1778225408385.png" className="w-full h-full object-cover opacity-60" />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80"></div>
         </div>
         <div className="relative z-10">
            {session ? (
               isOnboardingModalOpen ? (
                  \${onboardingContent}
               ) : (
                  \${mainContent}
               )
            ) : (
               <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 relative overflow-hidden">
                  \${loginContentBlock}
               </div>
            )}
         </div>
      </div>
   );
}
`;

fs.writeFileSync('src/app/page.tsx', head + newReturn);
console.log("File reconstructed.");
