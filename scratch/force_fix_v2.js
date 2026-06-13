const fs = require('fs');
const path = 'c:\\Users\\omars\\Downloads\\ChillZoneLFG\\src\\app\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

const modalStart = '{isManageModalOpen && targetLobby && (';
const modalEndSegment = '</motion.div>\n             </motion.div>\n           )}';

const startIndex = content.indexOf(modalStart);
// Look for the AnimatePresence closure or the next modal start to find the end
const nextModal = '{isCreateModalOpen && (';
const nextIndex = content.indexOf(nextModal, startIndex);

if (startIndex !== -1 && nextIndex !== -1) {
    // We want to replace everything from startIndex up to just before nextIndex
    // But we need to make sure we close the tags correctly.
    
    // I'll just find the exact block closure
    const closure = ')}';
    let closureIndex = content.lastIndexOf(closure, nextIndex);
    
    // This is risky. I'll use a better approach: 
    // I'll replace the block between 1148 and 1155.
    
    const badSegmentStart = '<<<<<<<<'; // I'll search for specific content
}

// SIMPLER FIX: Just use replace on the problematic lines
const target = `                            </div>
                         </div>
                      </div>
                   </div>
                </motion.div>
            </motion.div>
          )}`;

const fixed = `                            </div>
                         </div>
                      </div>
                   </div>
                </motion.div>
            </motion.div>
          )}
        </AnimatePresence>`;

if (content.includes('</motion.div>\n            </motion.div>\n          )}')) {
    content = content.replace('</motion.div>\n            </motion.div>\n          )}', '</motion.div>\n            </motion.div>\n          )}\n        </AnimatePresence>');
    console.log('Added missing AnimatePresence closure');
}

fs.writeFileSync(path, content);
console.log('Done');
