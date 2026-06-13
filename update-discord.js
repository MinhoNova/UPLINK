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

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  
  const guild = client.guilds.cache.first();
  if (!guild) {
    console.error("The bot is not in any servers!");
    process.exit(1);
  }

  console.log(`Updating server: ${guild.name}`);

  try {
    // 1. Rename Server and set Icon
    console.log("Setting server name and icon...");
    await guild.setName("UPLINK NETWORK");
    await guild.setIcon("https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?w=500&h=500&fit=crop");

    // 2. Delete the Gold Market category and channels
    console.log("Removing RMT / Gold channels...");
    const channels = await guild.channels.fetch();
    for (const [id, channel] of channels) {
      if (channel && channel.name.toLowerCase().includes('gold')) {
        await channel.delete('Removing RMT channels');
        console.log(`Deleted: ${channel.name}`);
      }
    }

    console.log("Update Complete! ✨");
    process.exit(0);

  } catch (error) {
    console.error("Error updating server:", error);
    process.exit(1);
  }
});

client.login(TOKEN);
