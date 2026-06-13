const fs = require('fs');
const path = 'c:\\Users\\omars\\Downloads\\ChillZoneLFG\\src\\app\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

// The goal is to ensure every modal is:
// <AnimatePresence> {isOpen && (...) } </AnimatePresence>

// Modals to fix: 
// 1. isManageModalOpen (around 894)
// 2. isCreateModalOpen (around 1157)
// 3. isArmoryModalOpen (around 1214)

// I'll rewrite the whole block from 894 to 1214.
const start894 = '<AnimatePresence>\n         {isManageModalOpen && targetLobby && (';
const manageStartIdx = content.indexOf('{isManageModalOpen && targetLobby && (');

// Find the end of targetLobby block by matching tags
// Or just find the next modal start.
const createStartIdx = content.indexOf('{isCreateModalOpen && (');
const armoryStartIdx = content.indexOf('{isArmoryModalOpen && (');

if (manageStartIdx !== -1 && createStartIdx !== -1 && armoryStartIdx !== -1) {
    // 1. Manage Modal end cleanup
    // We want to make sure it ends with:
    //    )}
    // </AnimatePresence>

    // 2. Create Modal start cleanup
    // <AnimatePresence>
    //    {isCreateModalOpen && (
    
    // I'll use a more surgical approach to just insert the missing tags.
    
    // Fix isCreateModalOpen missing AnimatePresence
    if (!content.includes('<AnimatePresence>\n         {isCreateModalOpen && (')) {
        content = content.replace('{isCreateModalOpen && (', '<AnimatePresence>\n         {isCreateModalOpen && (');
    }
    
    // Fix isCreateModalOpen missing closure
    if (content.includes('</motion.div>\n            </motion.div>\n          )}\n        </AnimatePresence>')) {
        // already has closure? 
    }
}

// I'll just rewrite the whole section from 1150 to 1220 to be safe.
const sectionStart = content.indexOf('</motion.div>\n            </motion.div>\n          )}');
const sectionEnd = content.indexOf('{isArmoryModalOpen && (');

if (sectionStart !== -1 && sectionEnd !== -1) {
    const replacement = `</motion.div>
                 </motion.div>
               )}
            </AnimatePresence>
    
            <AnimatePresence>
               {isCreateModalOpen && (
    `;
    // We need to find the start of isCreateModalOpen block to replace it.
}

// SCRATCH THAT. I'll just use a very safe replace for the specific lines.
content = content.replace(
    '</AnimatePresence>\n         {isCreateModalOpen && (',
    '</AnimatePresence>\n\n        <AnimatePresence>\n          {isCreateModalOpen && ('
);

fs.writeFileSync(path, content);
console.log('Synchronizing Modals...');
