const fs = require('fs');
const path = 'c:\\Users\\omars\\Downloads\\ChillZoneLFG\\src\\app\\page.tsx';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split(/\r?\n/);

// We suspect lines 979, 980, 981 (1-indexed) have trailing junk
// In 0-index: 978, 979, 980
for (let i = 975; i < 985; i++) {
    if (lines[i]) {
        lines[i] = lines[i].trimEnd();
    }
}

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log("Trimmed trailing whitespace/junk from lines 976-985.");
