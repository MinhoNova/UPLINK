const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Remove the '(' from the session ternary start
content = content.replace('{session ? (', '{session ?');

// 2. Remove the matching ')' before the else
// Looking for ') : (' after the main content block
const elseIdx = content.indexOf(') : (', 4000);
if (elseIdx !== -1) {
    console.log("Found else at " + elseIdx);
    content = content.substring(0, elseIdx) + ' : (' + content.substring(elseIdx + 5);
} else {
    console.log("Could not find else block to simplify");
}

// 3. Remove the matching ')' at the very end
// It should be ')}' near the end of the file
const lastBraceIdx = content.lastIndexOf(')}');
if (lastBraceIdx !== -1) {
    console.log("Found closing expression at " + lastBraceIdx);
    content = content.substring(0, lastBraceIdx) + '}' + content.substring(lastBraceIdx + 2);
}

fs.writeFileSync('src/app/page.tsx', content);
console.log("Ternary simplified.");
