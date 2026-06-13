const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\omars\\Downloads\\ChillZoneLFG\\src\\app\\page.tsx', 'utf8');
const lines = content.split('\n');

let inBlock = false;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('isManageModalOpen && targetLobby && (')) inBlock = true;
    if (inBlock) {
        const line = lines[i];
        const openDivs = line.match(/<div|<motion\.div/g) || [];
        const closeDivs = line.match(/<\/div|<\/motion\.div/g) || [];
        
        openDivs.forEach(t => console.log(`${i + 1}: OPEN ${t}`));
        closeDivs.forEach(t => console.log(`${i + 1}: CLOSE ${t}`));
    }
    if (inBlock && lines[i].includes('{isCreateModalOpen && (')) inBlock = false;
}
