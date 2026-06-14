const { Client, GatewayIntentBits, ChannelType, PermissionsBitField } = require('discord.js');

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
    console.error("The bot is not in any servers! Please invite it first.");
    process.exit(1);
  }

  console.log(`Setting up community in: ${guild.name}`);

  try {
    // 1. Create Roles
    console.log("Creating roles...");
    const verifiedRole = await guild.roles.create({ name: 'Verified Operative', color: '#00ffff', permissions: [] });
    const boosterRole = await guild.roles.create({ name: 'Elite Booster', color: '#ff007f', permissions: [] });
    const leadRole = await guild.roles.create({ name: 'Mission Lead', color: '#8a2be2', permissions: [PermissionsBitField.Flags.Administrator] });

    // 2. Create Categories & Channels
    console.log("Creating categories and channels...");

    // COMMAND CENTER
    const cmdCategory = await guild.channels.create({
      name: '📡 COMMAND CENTER',
      type: ChannelType.GuildCategory,
    });

    await guild.channels.create({
      name: 'welcome-briefing',
      type: ChannelType.GuildText,
      parent: cmdCategory.id,
      topic: 'Welcome to the Uplink Community',
    });

    await guild.channels.create({
      name: 'uplink-announcements',
      type: ChannelType.GuildText,
      parent: cmdCategory.id,
    });

    // ACTIVE MISSIONS (LFG)
    const lfgCategory = await guild.channels.create({
      name: '⚔️ ACTIVE MISSIONS (LFG)',
      type: ChannelType.GuildCategory,
    });

    await guild.channels.create({
      name: 'lfg-mythic-plus',
      type: ChannelType.GuildText,
      parent: lfgCategory.id,
      topic: 'Mythic+ offers — posted automatically by UPLINK',
    });

    await guild.channels.create({
      name: 'leveling-squads',
      type: ChannelType.GuildText,
      parent: lfgCategory.id,
    });

    // GOLD MARKET
    const goldCategory = await guild.channels.create({
      name: '💰 GOLD MARKET',
      type: ChannelType.GuildCategory,
    });

    await guild.channels.create({
      name: 'wtb-wts-gold',
      type: ChannelType.GuildText,
      parent: goldCategory.id,
    });

    // SECURE COMMS (Voice)
    const voiceCategory = await guild.channels.create({
      name: '🎧 SECURE COMMS',
      type: ChannelType.GuildCategory,
    });

    await guild.channels.create({
      name: 'Lobby Alpha',
      type: ChannelType.GuildVoice,
      parent: voiceCategory.id,
    });

    await guild.channels.create({
      name: 'Lobby Bravo',
      type: ChannelType.GuildVoice,
      parent: voiceCategory.id,
    });

    console.log("Community Setup Complete! ✨");
    process.exit(0);

  } catch (error) {
    console.error("Error setting up server:", error);
    process.exit(1);
  }
});

client.login(TOKEN);
