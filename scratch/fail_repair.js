const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// Remove ALL occurrences of the deleteConfirmation modal block to clean it up first
const deleteBlockRegex = /\\{deleteConfirmation\\?\\.isOpen && \\([\\s\\S]*?\\)\\}/g;
content = content.replace(deleteBlockRegex, '');

// Find the end of the main session block
const sessionExpressionStart = content.indexOf('{session ? (');
const sessionExpressionEnd = content.indexOf(') : (', sessionExpressionStart); // This might be wrong if nested

// Let's use a stack-based approach to find the end of the session expression
function findClosingBrace(str, startIdx) {
    let stack = 0;
    for (let i = startIdx; i < str.length; i++) {
        if (str[i] === '{') stack++;
        if (str[i] === '}') {
            stack--;
            if (stack === 0) return i;
        }
    }
    return -1;
}

const endIdx = findClosingBrace(content, sessionExpressionStart);

// Keep everything before the session expression
const head = content.substring(0, sessionExpressionStart);

const correctStructure = \`{session ? (
            isOnboardingModalOpen ? (
               <div className="fixed inset-0 z-[9999] bg-[#06060c] flex items-center justify-center p-6 overflow-hidden">
                  {/* ... (Onboarding Content) ... */}
                  <div className="text-white">ONBOARDING ACTIVE</div>
               </div>
            ) : (
               <>
                  {/* ... (Main Content) ... */}
                  <div className="text-white">MAIN CONTENT ACTIVE</div>
               </>
            )
         ) : (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 relative overflow-hidden">
               {/* ... (Login Content) ... */}
               <div className="text-white">LOGIN ACTIVE</div>
            </div>
         )}\`;

// Wait, this is too destructive.
// I'll just fix the tags at 4265 and 4305.

// Actually, I'll just use a very specific replace_file_content.
console.log("Script failed to generate a safe fix. Aborting.");
process.exit(1);
