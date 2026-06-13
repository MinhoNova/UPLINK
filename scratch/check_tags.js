const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// Improved regex to handle fragments and self-closing tags
const tagRegex = /<([a-zA-Z0-9.]+)(\s[\s\S]*?)?>|<\/([a-zA-Z0-9.]+)>|<>|<\/>/g;
let stack = [];
let match;
while ((match = tagRegex.exec(content)) !== null) {
    let [full, openTag, attrs, closeTag] = match;
    
    if (full === '<>') {
        stack.push({ name: 'Fragment', pos: match.index });
    } else if (full === '</>') {
        let last = stack.pop();
        if (!last || last.name !== 'Fragment') {
            console.log("Mismatched Fragment end at pos " + match.index + ". Stack: " + (last ? last.name : 'empty'));
        }
    } else if (closeTag) {
        let last = stack.pop();
        if (!last || last.name !== closeTag) {
            console.log("Mismatched tag end </" + closeTag + "> at pos " + match.index + ". Expected " + (last ? last.name : 'nothing'));
        }
    } else if (openTag) {
        if (attrs && attrs.trim().endsWith('/')) {
            // Self-closing
        } else {
            stack.push({ name: openTag, pos: match.index });
        }
    }
}

console.log("Final stack depth: " + stack.length);
if (stack.length > 0) {
    console.log("Unclosed tags:");
    stack.forEach(t => {
        // Find line number
        let line = content.substring(0, t.pos).split('\n').length;
        console.log("- " + t.name + " at line " + line);
    });
}
