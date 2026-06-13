const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'src', 'data', 'db.json');

function patch() {
  const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  
  data.characters = data.characters.map((char) => {
    const fScore = parseFloat(char.score) || 0;
    let role = char.role || 'dps';
    
    const dpsValue = role === 'dps' ? (fScore * 59.2) : 0;
    const hpsValue = role === 'healer' ? (fScore * 35.5) : 0;
    const tankValue = role === 'tank' ? (fScore * 28.4) : 0;
    
    const effectOptions = ['none', 'cyanGlow', 'fireGlow', 'purplePulse', 'goldSparkle', 'cyberStorm', 'rainbowSpin', 'toxicGhost', 'bloodMoon', 'voidVortex', 'neonSnake', 'diamondAura', 'galaxyDrift', 'emeraldFlow', 'solarFlare', 'frostByte', 'stormPortal', 'infernoAura', 'glitchMatrix'];
    const randomEffect = effectOptions[Math.floor(Math.random() * effectOptions.length)];

    const stats = {
      dps: dpsValue,
      healer: hpsValue,
      tank: tankValue
    };
    
    return {
      ...char,
      stats,
      dpsValue,
      hpsValue,
      tankValue,
      effect: randomEffect
    };
  });
  
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  console.log('Patched characters with STRICT Score-based multipliers (Max 190k)');
}

patch();
