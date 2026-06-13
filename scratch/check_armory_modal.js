const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\omars\\Downloads\\ChillZoneLFG\\src\\app\\page.tsx', 'utf8');
const start = content.indexOf('{isArmoryModalOpen && (');
const end = content.indexOf('{session && (');
const block = content.substring(start, end);

const divs = block.match(/<div/g) || [];
const closeDivs = block.match(/<\/div/g) || [];
const mdivs = block.match(/<motion\.div/g) || [];
const closeMdivs = block.match(/<\/motion\.div/g) || [];

console.log(`ARMORY MODAL - DIVs: ${divs.length} Open, ${closeDivs.length} Close`);
console.log(`ARMORY MODAL - MotionDIVs: ${mdivs.length} Open, ${closeMdivs.length} Close`);
