const fs = require('fs');
const path = 'c:\\Users\\omars\\Downloads\\ChillZoneLFG\\src\\app\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix the missing </div> in the header section
const headerTarget = '                             </div>\n                          </div>\n\n                          {/* ACTION BUTTONS - ACCESSIBLE AT TOP */}';

// I'll search for the Name/Status block and add the closure
const nameStatusEnd = 'STATUS: <span className="text-white/80">{targetLobby.status?.toUpperCase() || \'STANDBY\'}</span></p>\n                            </div>';
const nameStatusFixed = 'STATUS: <span className="text-white/80">{targetLobby.status?.toUpperCase() || \'STANDBY\'}</span></p>\n                            </div>\n                         </div>';

if (content.includes(nameStatusEnd) && !content.includes(nameStatusFixed)) {
    content = content.replace(nameStatusEnd, nameStatusFixed);
    console.log('Fixed Header nesting');
} else {
    // Try another way if exact string differs
     content = content.replace(
        'STATUS: <span className="text-white/80">{targetLobby.status?.toUpperCase() || \'STANDBY\'}</span></p>\n                             </div>',
        'STATUS: <span className="text-white/80">{targetLobby.status?.toUpperCase() || \'STANDBY\'}</span></p>\n                             </div>\n                          </div>'
    );
}

// Also add the missing AnimatePresence closure just in case
if (content.includes('</motion.div>\n            </motion.div>\n          )}')) {
    content = content.replace('</motion.div>\n            </motion.div>\n          )}', '</motion.div>\n            </motion.div>\n          )}\n        </AnimatePresence>');
    console.log('Added AnimatePresence closure');
}

fs.writeFileSync(path, content);
console.log('Synchronizing Neural Links...');
