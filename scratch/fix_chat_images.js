const fs = require('fs');
const path = 'c:\\Users\\omars\\Downloads\\ChillZoneLFG\\src\\app\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Update States
const stateTarget = 'const [chatMessage, setChatMessage] = useState("");';
const stateReplacement = stateTarget + '\n  const [chatImagePreview, setChatImagePreview] = useState<string | null>(null);';

if (content.includes(stateTarget) && !content.includes('chatImagePreview')) {
    content = content.replace(stateTarget, stateReplacement);
}

// Update handleSendMessage
const functionTarget = /const handleSendMessage = \(lobbyId: string\) => \{[\s\S]+?setChatMessage\(""\);\s+\};/;
const functionReplacement = `const handleSendMessage = (lobbyId: string) => {
    if (!chatMessage.trim() && !chatImagePreview) return;
    let updatedTarget: any = null;
    const updated = lobbies.map(l => {
      if (l.id === lobbyId) {
        const msgs = l.messages || [];
        const newMsg = { 
           id: Date.now(), 
           from: currentUserDisplay, 
           text: chatMessage, 
           image: chatImagePreview,
           time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
        };
        updatedTarget = { ...l, messages: [...msgs, newMsg] };
        return updatedTarget;
      }
      return l;
    });
    setLobbies(updated);
    if (updatedTarget) setTargetLobby(updatedTarget);
    saveGlobalData({ lobbies: updated });
    setChatMessage("");
    setChatImagePreview(null);
  };`;

if (functionTarget.test(content)) {
    content = content.replace(functionTarget, functionReplacement);
    console.log('handleSendMessage updated successfully');
} else {
    console.log('handleSendMessage target not found');
}

fs.writeFileSync(path, content);
console.log('Done');
