const fs = require('fs');
const path = 'c:\\Users\\omars\\Downloads\\ChillZoneLFG\\src\\app\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

// The corrupted line 1024
const corrupted = 'Close Access</b                  <div className="flex-1 p-10 overflow-y-auto relative">';
const fixed = 'Close Access</button>\n                    </div>\n                 </div>\n                 <div className="flex-1 p-10 overflow-y-auto relative">';

// We use a more flexible match if the exact number of spaces is weird
content = content.replace(/Close Access<\/b\s+<div className="flex-1 p-10 overflow-y-auto relative">/, fixed);

fs.writeFileSync(path, content);
console.log('File patched successfully');
