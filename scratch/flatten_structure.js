const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Fix the start of the return block at 1688
const returnLine = '<div className={`min-h-screen relative ${theme === \\\'light\\\' ? \\\'text-[#1a1a2e]\\\' : \\\'text-gray-200\\\'} selection:bg-[#ff007f]/30 font-[family-name:var(--font-outfit)] overflow-x-hidden bg-black`}> <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden"><motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 60, repeat: Infinity }} className="w-full h-full"><img src="/vibrant_galaxy_v2_1778225408385.png" className="w-full h-full object-cover opacity-60" /></motion.div><div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80"></div></div>';
const newReturnStart = returnLine + '\\n         {session ? (\\n            <div className="relative z-10">';

content = content.replace(returnLine + ' <div className="relative z-10">\\n         {session ? (', newReturnStart);
// Wait, the original was all on one line.
content = content.replace(/<div className={\\\`min-h-screen[\\s\\S]*?<div className="relative z-10">\\s*{session \? \(/, newReturnStart);

// 2. Fix the transition to the else block at 4268
// We need to close the relative z-10 div before the else
const elseTransition = ') : (';
const newElseTransition = '            </div>\\n         ) : (';
// Find the right one (it's the one after line 4000)
const elseIdx = content.lastIndexOf(elseTransition);
content = content.substring(0, elseIdx) + newElseTransition + content.substring(elseIdx + 5);

// 3. Fix the end
// Since we moved one </div> earlier, we only need ONE </div> at the end for the root div.
// Wait! 4305 is )}. 4306 is </div>. 4307 is </div>.
// If we moved one to 4268, then 4306 is correct. We don't need 4307.
content = content.replace(/\\s*<\\/div>\\s*<\\/div>\\s*\\);\\s*}/, '\\n         )}\\n      </div>\\n   );\\n}');

fs.writeFileSync('src/app/page.tsx', content);
console.log("Structure flattened.");
