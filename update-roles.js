const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
  ],
});

const TOKEN = process.env.DISCORD_BOT_TOKEN;
if (!TOKEN) {
  console.error('DISCORD_BOT_TOKEN is not set in environment variables.');
  process.exit(1);
}

const roleMap = {
  'Verified Operative': '💠 Verified Operative',
  'Elite Booster': '🔥 Elite Booster',
  'Mission Lead': '👑 Mission Lead'
};

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  
  const guild = client.guilds.cache.first();
  if (!guild) {
    console.error("The bot is not in any servers!");
    process.exit(1);
  }

  console.log(`Updating roles in server: ${guild.name}`);

  try {
    const roles = await guild.roles.fetch();
    for (const [id, role] of roles) {
      if (roleMap[role.name]) {
        const newName = roleMap[role.name];
        await role.setName(newName);
        console.log(`Renamed role: ${role.name} -> ${newName}`);
      }
    }

    console.log("Roles beautified successfully! ✨");
    process.exit(0);

  } catch (error) {
    console.error("Error updating roles:", error);
    process.exit(1);
  }
});

client.login(TOKEN);
