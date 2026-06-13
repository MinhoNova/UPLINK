const fs = require('fs');
const path = 'c:\\Users\\omars\\Downloads\\ChillZoneLFG\\src\\app\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update Execute Mission button to record start time
content = content.replace(
    'const updated = {...targetLobby, status: \'in_progress\'};',
    'const updated = {...targetLobby, status: \'in_progress\', missionStartTime: Date.now(), detectedRuns: []};'
);

// 2. Add the Tracking Effect inside the component
const trackingEffect = `
  // MISSION RUN TRACKING SYSTEM
  useEffect(() => {
    const activeLobbies = lobbies.filter(l => l.status === 'in_progress' && l.missionStartTime);
    if (activeLobbies.length === 0) return;

    const interval = setInterval(async () => {
      let changed = false;
      const updatedLobbies = await Promise.all(lobbies.map(async (l) => {
        if (l.status !== 'in_progress' || !l.missionStartTime) return l;
        
        // Scan each accepted member
        const detected = [...(l.detectedRuns || [])];
        for (const member of (l.accepted || [])) {
          if (!member.name || !member.realm) continue;
          try {
            const res = await fetch(\`https://raider.io/api/v1/characters/profile?region=\${member.region || 'eu'}&realm=\${member.realm}&name=\${member.name}&fields=mythic_plus_recent_runs\`);
            if (res.ok) {
              const data = await res.json();
              const recent = data.mythic_plus_recent_runs || [];
              recent.forEach((run: any) => {
                const runTime = new Date(run.completed_at).getTime();
                if (runTime > l.missionStartTime && !detected.some(d => d.url === run.url)) {
                  detected.push({
                    player: member.name,
                    dungeon: run.dungeon,
                    level: run.mythic_level,
                    upgrades: run.num_keystone_upgrades,
                    score: run.score,
                    url: run.url,
                    timestamp: runTime
                  });
                  changed = true;
                }
              });
            }
          } catch (e) {}
        }
        return { ...l, detectedRuns: detected };
      }));

      if (changed) {
        setLobbies(updatedLobbies);
        saveGlobalData({ lobbies: updatedLobbies });
        // Update target lobby if open
        if (targetLobby) {
           const match = updatedLobbies.find(ul => ul.id === targetLobby.id);
           if (match) setTargetLobby(match);
        }
      }
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, [lobbies, targetLobby]);
`;

if (!content.includes('MISSION RUN TRACKING SYSTEM')) {
    content = content.replace('useEffect(() => { fetchGlobalData();', trackingEffect + '\n  useEffect(() => { fetchGlobalData();');
}

// 3. Add Display for Intercepted Runs in Manage Modal
// I'll put it below the Team Grid.
const intelPanel = `<div className="flex flex-col gap-4 mt-4">
                                  <h3 className="text-[10px] font-black text-[#00ffff] uppercase tracking-[0.4em] flex items-center gap-3 animate-pulse"><Radio className="w-4 h-4" /> Mission Intelligence (Live Intercept)</h3>
                                  <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-2">
                                     {(!targetLobby.detectedRuns || targetLobby.detectedRuns.length === 0) ? (
                                        <div className="p-4 border border-dashed border-white/5 rounded-2xl text-[8px] font-black uppercase text-gray-700 tracking-widest text-center">Scanning for frequency matches...</div>
                                     ) : (
                                        targetLobby.detectedRuns.map((run: any, idx: number) => (
                                           <div key={idx} className="bg-[#00ffff]/5 border border-[#00ffff]/20 p-3 rounded-xl flex items-center justify-between group hover:bg-[#00ffff]/10 transition-all border-l-4 border-l-[#00ffff]">
                                              <div>
                                                 <p className="text-[10px] font-black text-white uppercase">{run.dungeon} +{run.level}</p>
                                                 <p className="text-[8px] text-[#00ffff] font-black uppercase tracking-widest">{run.player} secured objective</p>
                                              </div>
                                              <div className="flex items-center gap-3">
                                                 <span className={\`text-[9px] font-black px-2 py-1 rounded \${run.upgrades > 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}\`}>
                                                    {run.upgrades > 0 ? \`+\${run.upgrades} TIMED\` : 'NOT TIMED'}
                                                 </span>
                                              </div>
                                           </div>
                                        ))
                                     )}
                                  </div>
                               </div>`;

content = content.replace('</div>\n                            </div>\n\n                            {/* APPLICANTS', '</div>\n\n' + intelPanel + '\n\n                            {/* APPLICANTS');


fs.writeFileSync(path, content);
console.log('Real-time Tracking Logic Integrated');
