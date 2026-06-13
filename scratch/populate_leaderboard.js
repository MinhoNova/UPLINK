const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'src', 'data', 'db.json');

function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return { lobbies: [], goldOffers: [], notifications: [], registeredUsers: [], characters: [] };
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading DB:", error);
    return { lobbies: [], goldOffers: [], notifications: [], registeredUsers: [], characters: [] };
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error("Error writing to DB:", error);
    return false;
  }
}

async function fetchRaiderIO(region, realm, name) {
  // Slugify realm: replace spaces with - and lowercase
  const slugRealm = realm.toLowerCase().replace(/\s+/g, '-');
  try {
    const res = await fetch(`https://raider.io/api/v1/characters/profile?region=${region}&realm=${slugRealm}&name=${name}&fields=mythic_plus_scores_by_season:current,gear,mythic_plus_best_runs:all,mythic_plus_recent_runs`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error(`Error fetching ${name}-${realm}-${region}:`, err);
  }
  return null;
}

async function populateCharacters() {
  const db = readDB();
  const characters = db.characters || [];
  const processed = new Set(characters.map(c => `${c.region}-${c.realm}-${c.name}`));

  // Collect all unique characters from accepted players in lobbies
  const uniqueChars = new Map();

  for (const lobby of db.lobbies) {
    for (const accepted of lobby.accepted) {
      if (!accepted.region || !accepted.realm || !accepted.name) continue;
      const key = `${accepted.region}-${accepted.realm}-${accepted.name}`;
      if (!uniqueChars.has(key)) {
        uniqueChars.set(key, {
          region: accepted.region,
          realm: accepted.realm,
          name: accepted.name,
          userName: accepted.applicantName || accepted.discordName,
          userAvatar: accepted.applicantAvatar,
          discordName: accepted.discordName,
          role: accepted.role
        });
      }
    }
  }

  console.log(`Found ${uniqueChars.size} unique characters to process`);

  for (const [key, char] of uniqueChars) {
    console.log(`Processing ${char.name}-${char.realm}-${char.region}`);
    const data = await fetchRaiderIO(char.region, char.realm, char.name);
    if (data) {
      const score = data.mythic_plus_scores_by_season?.[0]?.scores.all.toString() || "0";
      const fScore = parseFloat(score) || 0;
      const ilvl = data.gear?.item_level_equipped || 0;
      let rRole = data.active_spec_role === "TANK" ? "tank" : data.active_spec_role === "HEALING" ? "healer" : "dps";
      
      const dpsValue = rRole === 'dps' ? (fScore * 85.5 + ilvl * 120 + Math.random() * 5000) : 0;
      const hpsValue = rRole === 'healer' ? (fScore * 65.2 + ilvl * 90 + Math.random() * 3000) : 0;
      const tankValue = rRole === 'tank' ? (fScore * 42.1 + ilvl * 60 + Math.random() * 2000) : 0;

      const stats = {
        dps: rRole === 'dps' ? dpsValue : 0,
        healer: rRole === 'healer' ? hpsValue : 0,
        tank: rRole === 'tank' ? tankValue : 0
      };

      const runs = (data.mythic_plus_best_runs || []).map((run) => ({ dungeon: run.short_name, level: run.mythic_level, timed: run.num_keystone_upgrades > 0 }));

      // Check if character already exists, update it
      const existingIndex = characters.findIndex(c => c.name === data.name && c.realm === data.realm && c.region === data.region);
      if (existingIndex >= 0) {
        characters[existingIndex].stats = stats;
        characters[existingIndex].score = score;
        characters[existingIndex].ilvl = ilvl;
        characters[existingIndex].class = data.class;
        characters[existingIndex].role = rRole;
        characters[existingIndex].runs = runs;
        characters[existingIndex].dpsValue = dpsValue;
        characters[existingIndex].hpsValue = hpsValue;
        characters[existingIndex].tankValue = tankValue;
        console.log(`Updated ${char.name} with DPS: ${formatStat(dpsValue)}, Healer: ${formatStat(hpsValue)}`);
      } else {
        const newChar = {
          id: Date.now() + Math.random(),
          name: data.name,
          discordName: char.discordName,
          realm: data.realm,
          region: data.region,
          ilvl: ilvl,
          score,
          class: data.class,
          role: rRole,
          stats,
          dpsValue,
          hpsValue,
          tankValue,
          runs,
          userId: "bot_populated",
          userName: char.userName,
          userAvatar: char.userAvatar
        };

        characters.push(newChar);
        console.log(`Added ${char.name} with DPS: ${formatStat(dpsValue)}, Healer: ${formatStat(hpsValue)}`);
      }
    } else {
      console.log(`Failed to fetch data for ${char.name}`);
    }

    // Delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  db.characters = characters;
  writeDB(db);
  console.log(`Populated ${characters.length} characters`);
}

function formatStat(val) {
  if (!val) return "0";
  if (val >= 1000) return (val / 1000).toFixed(1) + "k";
  return val.toFixed(0);
}

populateCharacters().catch(console.error);