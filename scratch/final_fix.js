const fs = require('fs');
const path = 'c:\\Users\\omars\\Downloads\\ChillZoneLFG\\src\\app\\page.tsx';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split(/\r?\n/);

// Correct the indices (verified with view_file)
lines[980] = '                         </div>';
lines[981] = '                      </div>';
lines[982] = '                   </div>';
lines[983] = '                </motion.div>';
lines[984] = '             </motion.div>';
lines[985] = '          )}';
lines[986] = '        </AnimatePresence>';

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log("Fixed unclosed brace and restored tag balance.");
