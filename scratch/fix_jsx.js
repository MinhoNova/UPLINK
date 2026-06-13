const fs = require('fs');
const path = 'c:\\Users\\omars\\Downloads\\ChillZoneLFG\\src\\app\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

// The problematic block around line 950
const target = `                               </div>\n                            </div>\n                         </div>\n \n                      <div className={\`flex flex-col border-2 \${theme === 'light' ? 'bg-gray-50 border-black/5' : 'bg-black border-white/10'} rounded-[2rem] overflow-hidden shadow-2xl min-h-0\`}>`;
const replacement = `                               </div>\n                            </div>\n                         </div>\n                      <div className={\`flex flex-col border-2 \${theme === 'light' ? 'bg-gray-50 border-black/5' : 'bg-black border-white/10'} rounded-[2rem] overflow-hidden shadow-2xl min-h-0\`}>`;

if (content.indexOf(target) === -1) {
    console.log("Literal target not found, trying with CRLF");
    const targetCRLF = target.replace(/\n/g, '\r\n');
    const replacementCRLF = replacement.replace(/\n/g, '\r\n');
    if (content.indexOf(targetCRLF) === -1) {
        console.log("CRLF version also not found. Printing context around line 950...");
        const lines = content.split(/\r?\n/);
        console.log(lines.slice(945, 960).join('\n'));
    } else {
        content = content.replace(targetCRLF, replacementCRLF);
        fs.writeFileSync(path, content, 'utf8');
        console.log("Fixed with CRLF replacement.");
    }
} else {
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Fixed with LF replacement.");
}
