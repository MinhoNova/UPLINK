const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\omars\\Downloads\\ChillZoneLFG\\src\\app\\page.tsx', 'utf8');
const lines = content.split('\n');
for (let i = 1145; i < 1160; i++) {
    console.log(`${i + 1}: [${lines[i]}] ByteLength: ${Buffer.byteLength(lines[i])}`);
}
