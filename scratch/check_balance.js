const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\omars\\Downloads\\ChillZoneLFG\\src\\app\\page.tsx', 'utf8');
const block = content.substring(content.indexOf('isManageModalOpen && targetLobby && ('), content.indexOf('{isCreateModalOpen && ('));

let divCount = 0;
let motionDivCount = 0;

const divs = block.match(/<div/g) || [];
const closeDivs = block.match(/<\/div/g) || [];
const mdivs = block.match(/<motion\.div/g) || [];
const closeMdivs = block.match(/<\/motion\.div/g) || [];

console.log(`DIVs: ${divs.length} Open, ${closeDivs.length} Close`);
console.log(`MotionDIVs: ${mdivs.length} Open, ${closeMdivs.length} Close`);
