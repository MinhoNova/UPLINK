const fs = require('fs');
const c = fs.readFileSync('src/app/page.tsx', 'utf8');
const lines = c.split('\n');
const newLines = lines.slice(0, 1681);
newLines.push('   return ( <div className="bg-black min-h-screen flex items-center justify-center text-white text-9xl font-black italic">UPLINK RESET</div> );');
newLines.push('}');
fs.writeFileSync('src/app/page.tsx', newLines.join('\n'));
console.log("Cleanup done.");
