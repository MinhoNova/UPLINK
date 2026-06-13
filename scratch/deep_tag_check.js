const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\omars\\Downloads\\ChillZoneLFG\\src\\app\\page.tsx', 'utf8');

let stack = [];
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const openTags = line.match(/<div|<motion\.div/g) || [];
    const closeTags = line.match(/<\/div|<\/motion\.div/g) || [];
    
    openTags.forEach(t => stack.push({ tag: t, line: i + 1 }));
    closeTags.forEach(t => {
        if (stack.length > 0) {
            stack.pop();
        } else {
            console.log(`Extra closing tag ${t} at line ${i + 1}`);
        }
    });
}

console.log(`Remaining tags in stack: ${stack.length}`);
if (stack.length > 0) {
    stack.forEach(s => console.log(`Unclosed ${s.tag} started at line ${s.line}`));
}
