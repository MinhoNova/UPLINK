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

const channelMap = {
  'welcome-briefing': '👋・welcome',
  'uplink-announcements': '📢・announcements',
  'lfg-retail-wow': '⚔️・mythic-plus',
  '🎮・retail-wow': '⚔️・mythic-plus',
  'retail-wow': '⚔️・mythic-plus',
  'leveling-squads': '🚀・leveling-squads',
  'Lobby Alpha': '🔊 Lobby Alpha',
  'Lobby Bravo': '🔊 Lobby Bravo'
};

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  
  const guild = client.guilds.cache.first();
  if (!guild) {
    console.error("The bot is not in any servers!");
    process.exit(1);
  }

  console.log(`Updating channels in server: ${guild.name}`);

  try {
    const channels = await guild.channels.fetch();
    for (const [id, channel] of channels) {
      if (channel && channelMap[channel.name]) {
        const newName = channelMap[channel.name];
        await channel.setName(newName);
        console.log(`Renamed: ${channel.name} -> ${newName}`);
      }
    }

    console.log("Channel names beautified successfully! ✨");
    process.exit(0);

  } catch (error) {
    console.error("Error updating channels:", error);
    process.exit(1);
  }
});

client.login(TOKEN);
