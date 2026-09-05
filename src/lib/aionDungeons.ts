export interface AionDungeon {
  id: string;
  dungeon: string;
  boss: string;
  region: "US" | "EU" | "NA";
  tagline: string;
  category: string;
  video?: string;
  glow: string;
}

export const AION_DUNGEONS: AionDungeon[] = [
  {
    id: "sanctum-ludra",
    dungeon: "Sanctum Ludra",
    boss: "Spiritmaster Elementalist",
    region: "US",
    tagline: "Fracture raid — gate of the Daevanion spirit horde.",
    category: "Dungeons",
    video: "/ludra_sm.mp4",
    glow: "rgba(56,189,248,0.40)",
  },
  {
    id: "dark-poeta",
    dungeon: "Dark Poeta",
    boss: "Vanquisheg",
    region: "EU",
    tagline: "Twisted ether grove — soothe the corrupted ancient tree.",
    category: "Dungeons",
    glow: "rgba(74,222,128,0.32)",
  },
  {
    id: "beshmundir-temple",
    dungeon: "Beshmundir Temple",
    boss: "Brigade General Vasharti",
    region: "EU",
    tagline: "Balaur siege aegis — breach the shadowed halls.",
    category: "Dungeons",
    glow: "rgba(251,191,36,0.34)",
  },
  {
    id: "dredgion",
    dungeon: "Dredgion",
    boss: "Executioner Bahyaki",
    region: "NA",
    tagline: "Anti-aircraft ironclad — seize the enemy war platform.",
    category: "Dungeons",
    glow: "rgba(239,68,68,0.34)",
  },
  {
    id: "crucible-spire",
    dungeon: "Crucible Spire",
    boss: "Grand Commander",
    region: "NA",
    tagline: "Endless coliseum — survive 20 waves of elite Daevas.",
    category: "Boosts",
    glow: "rgba(217,70,239,0.36)",
  },
  {
    id: "esoterrace",
    dungeon: "Esoterrace",
    boss: "Spirited Tahabata",
    region: "US",
    tagline: "Ecosystem research center — purge the infected terraces.",
    category: "Dungeons",
    glow: "rgba(163,230,53,0.30)",
  },
  {
    id: "iron-wall",
    dungeon: "Iron Wall",
    boss: "Dragon Swallowing Kaisinel",
    region: "US",
    tagline: "Balaur fortress siege — allied armies at the gates.",
    category: "Dungeons",
    glow: "rgba(148,163,184,0.35)",
  },
];