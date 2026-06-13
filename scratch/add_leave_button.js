const fs = require('fs');
const path = 'c:\\Users\\omars\\Downloads\\ChillZoneLFG\\src\\app\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = '{(currentUserId === targetLobby.ownerId || isAdmin) && !isMe && (\n                                                        <button onClick={() => { const updatedAcc = targetLobby.accepted.filter((x: any) => x.applicantId !== occupant.applicantId && x.id !== occupant.id); const updatedLobby = { ...targetLobby, roles: { ...targetLobby.roles, [occupant.role]: targetLobby.roles[occupant.role] + 1 }, accepted: updatedAcc }; const updatedLobbies = lobbies.map(l => l.id === targetLobby.id ? updatedLobby : l); setLobbies(updatedLobbies); setTargetLobby(updatedLobby); saveGlobalData({ lobbies: updatedLobbies }); addToast(`Operative kicked.`, "error"); }} className="w-full py-2.5 text-red-500 font-black uppercase text-[8px] tracking-[0.2em] hover:text-white transition-all">Remove</button>\n                                                     )}';

const replacement = target + '\n                                                     {isMe && currentUserId !== targetLobby.ownerId && (\n                                                        <button onClick={() => { \n                                                           const updatedAcc = targetLobby.accepted.filter((x: any) => x.applicantId !== currentUserId); \n                                                           const updatedLobby = { ...targetLobby, roles: { ...targetLobby.roles, [occupant.role]: targetLobby.roles[occupant.role] + 1 }, accepted: updatedAcc }; \n                                                           const updatedLobbies = lobbies.map(l => l.id === targetLobby.id ? updatedLobby : l); \n                                                           setLobbies(updatedLobbies); \n                                                           setIsManageModalOpen(false); \n                                                           saveGlobalData({ lobbies: updatedLobbies }); \n                                                           addToast(`You have left the mission.`, "info"); \n                                                        }} className="w-full py-2.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 hover:bg-yellow-500 hover:text-black rounded-xl font-black uppercase text-[8px] transition-all tracking-widest">Leave Mission</button>\n                                                     )}';

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content);
    console.log('Leave Mission button added successfully');
} else {
    console.log('Target not found');
    // Try a more flexible match
    const regex = /\{\(currentUserId === targetLobby\.ownerId \|\| isAdmin\) && !isMe && \([\s\S]+?Remove<\/button>\s+\)\}/;
    if (regex.test(content)) {
        content = content.replace(regex, (match) => match + '\n                                                     {isMe && currentUserId !== targetLobby.ownerId && (\n                                                        <button onClick={() => { \n                                                           const updatedAcc = targetLobby.accepted.filter((x: any) => x.applicantId !== currentUserId); \n                                                           const updatedLobby = { ...targetLobby, roles: { ...targetLobby.roles, [occupant.role]: targetLobby.roles[occupant.role] + 1 }, accepted: updatedAcc }; \n                                                           const updatedLobbies = lobbies.map(l => l.id === targetLobby.id ? updatedLobby : l); \n                                                           setLobbies(updatedLobbies); \n                                                           setIsManageModalOpen(false); \n                                                           saveGlobalData({ lobbies: updatedLobbies }); \n                                                           addToast(`You have left the mission.`, "info"); \n                                                        }} className="w-full py-2.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 hover:bg-yellow-500 hover:text-black rounded-xl font-black uppercase text-[8px] transition-all tracking-widest">Leave Mission</button>\n                                                     )}');
        fs.writeFileSync(path, content);
        console.log('Leave Mission button added via regex');
    } else {
        console.log('Still not found');
    }
}
