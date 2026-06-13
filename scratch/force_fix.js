const fs = require('fs');
const path = 'c:\\Users\\omars\\Downloads\\ChillZoneLFG\\src\\app\\page.tsx';
const content = fs.readFileSync(path, 'utf8');

// Use a regex to find the end of the ManageModal block and clean it up
const regex = /<div className={`p-8 border-t border-white\/10 flex gap-4 bg-black\/60`}>[\s\S]*?Send<\/button>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/motion.div>\s*<\/motion.div>/;

const replacement = `<div className={\`p-8 border-t border-white/10 flex gap-4 bg-black/60\`}>
                            <input type="text" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(targetLobby.id)} placeholder="Transmit message to squadron..." className="flex-1 bg-black/80 border-2 border-white/10 rounded-2xl px-6 py-5 text-base font-bold outline-none focus:border-[#00ffff] transition-all shadow-inner text-white"/>
                            <button onClick={() => handleSendMessage(targetLobby.id)} className="p-5 bg-[#00ffff] text-black rounded-2xl hover:scale-105 hover:shadow-[0_0_20px_#00ffff]/40 transition-all font-black uppercase text-sm px-8">Send</button>
                         </div>
                      </div>
                   </div>
                </motion.div>
             </motion.div>`;

if (content.match(regex)) {
    const newContent = content.replace(regex, replacement);
    fs.writeFileSync(path, newContent, 'utf8');
    console.log("Replaced block with clean version using Regex.");
} else {
    console.log("Regex did not match. Trying simpler replacement.");
    // Try to find the closing sequence manually
    const searchStr = `</button>\r\n                         </div>\r\n                      </div>\r\n                   </div>\r\n                </motion.div>\r\n             </motion.div>`
    // ... or just replace the end lines by index
    const lines = content.split(/\r?\n/);
    lines[979] = '                         </div>';
    lines[980] = '                      </div>';
    lines[981] = '                   </div>';
    lines[982] = '                </motion.div>';
    lines[983] = '             </motion.div>';
    fs.writeFileSync(path, lines.join('\n'), 'utf8');
    console.log("Forced update at indices 979-983.");
}
