const fs = require('fs');
const content = fs.readFileSync('src/app/page.tsx', 'utf8');

try {
  // We can't easily parse TSX with raw Node, but we can try to find unmatched braces/parens.
  let stack = [];
  let lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    for (let j = 0; j < line.length; j++) {
      let char = line[j];
      if (char === '{' || char === '(' || char === '[') {
        stack.push({ char, line: i + 1, col: j + 1 });
      } else if (char === '}' || char === ')' || char === ']') {
        if (stack.length === 0) {
          console.log(`Unmatched closing ${char} at line ${i + 1}, col ${j + 1}`);
          return;
        }
        let last = stack.pop();
        if ((char === '}' && last.char !== '{') ||
            (char === ')' && last.char !== '(') ||
            (char === ']' && last.char !== '[')) {
          console.log(`Mismatched ${char} at line ${i + 1}, col ${j + 1} (expected closing for ${last.char} from line ${last.line})`);
          return;
        }
      }
    }
  }
  if (stack.length > 0) {
    let last = stack.pop();
    console.log(`Unclosed ${last.char} from line ${last.line}, col ${last.col}`);
  } else {
    console.log("Braces and parentheses seem balanced (basic check).");
  }
} catch (e) {
  console.log("Error reading file:", e);
}
