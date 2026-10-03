#!/usr/bin/env node
const token = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;
if (!token) throw new Error('DISCORD_BOT_TOKEN missing');
if (!clientId) throw new Error('DISCORD_CLIENT_ID missing');
const defs = [
  {name:'offers',description:'Browse open Aion 2 offers',options:[{type:3,name:'category',description:'Filter by category',required:false,choices:[{name:'Leveling',value:'leveling'},{name:'Dungeons',value:'dungeons'},{name:'Raids',value:'raids'},{name:'Professions',value:'professions'}]}]},
  {name:'apply',description:'Apply to an offer and pick the character you are bringing',options:[{type:3,name:'offer',description:'The offer id, e.g. from /offers',required:true}]},
  {name:'mycharacters',description:'Show the characters linked to your UPLINK account',options:[]}
];
async function main() {
  const url = guildId ? 'https://discord.com/api/v10/applications/'+clientId+'/guilds/'+guildId+'/commands' : 'https://discord.com/api/v10/applications/'+clientId+'/commands';
  const res = await fetch(url,{method:'PUT',headers:{Authorization:'Bot '+token,'Content-Type':'application/json'},body:JSON.stringify(defs)});
  if(!res.ok){const t=await res.text();throw new Error(res.status+': '+t);}
  console.log('ok');
}
main().catch(e=>{console.error(e.message||e);process.exit(1);});
