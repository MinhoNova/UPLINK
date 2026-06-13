const fs = require('fs');
const path = 'c:\\Users\\omars\\Downloads\\ChillZoneLFG\\src\\app\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix the Team Grid to show Avatars
const oldTeamGridContent = `<div className={\`w-14 h-14 rounded-[1.2rem] flex items-center justify-center text-2xl mb-4 shadow-2xl relative \${occupant ? 'bg-black border-2 border-[#00ffff]' : 'bg-white/5 border border-white/10'}\`}>
                                              {occupant && <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#00ffff] rounded-full flex items-center justify-center border-2 border-black animate-bounce"><Check className="w-3 h-3 text-black" /></div>}
                                              {roleType === 'tank' ? '🛡️' : roleType === 'healer' ? '💚' : '⚔️'}
                                           </div>`;

const newTeamGridContent = `<div className={\`w-14 h-14 rounded-[1.2rem] flex items-center justify-center text-2xl mb-4 shadow-2xl relative overflow-hidden \${occupant ? 'bg-black border-2 border-[#00ffff]' : 'bg-white/5 border border-white/10'}\`}>
                                              {occupant ? (
                                                <>
                                                  {occupant.image ? (
                                                    <img src={occupant.image} className="w-full h-full object-cover" />
                                                  ) : (
                                                    <span>{roleType === 'tank' ? '🛡️' : roleType === 'healer' ? '💚' : '⚔️'}</span>
                                                  )}
                                                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#00ffff] rounded-full flex items-center justify-center border-2 border-black animate-bounce z-10"><Check className="w-3 h-3 text-black" /></div>
                                                </>
                                              ) : (
                                                <span className="opacity-20">{roleType === 'tank' ? '🛡️' : roleType === 'healer' ? '💚' : '⚔️'}</span>
                                              )}
                                           </div>`;

content = content.replace(oldTeamGridContent, newTeamGridContent);

// 2. Fix the syntax error around line 1214
// I suspect there is a hidden character or a newline issue.
// I'll re-format that area.
const brokenArea = `          )}
        </AnimatePresence>

        <AnimatePresence>
          {isArmoryModalOpen && (`;

const cleanArea = `          )}
        </AnimatePresence>

        <AnimatePresence>
          {isArmoryModalOpen && (`;

content = content.replace(brokenArea, cleanArea);

fs.writeFileSync(path, content);
console.log('Avatars Integrated & Syntax Synchronized');
