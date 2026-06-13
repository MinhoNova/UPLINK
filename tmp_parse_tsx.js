const ts = require('typescript');
const fs = require('fs');
const text = fs.readFileSync('src/components/modals/ManageModal.tsx', 'utf8');
const sf = ts.createSourceFile('ManageModal.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
console.log('diagnostics:', sf.parseDiagnostics.length);
sf.parseDiagnostics.forEach(d => {
  const { line, character } = sf.getLineAndCharacterOfPosition(d.start);
  console.log(`${line+1}:${character+1} ${d.messageText}`);
});
