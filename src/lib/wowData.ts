export interface WoWSpec {
  id: string;
  name: string;
  classId: string;
  role: "dps" | "healer" | "tank";
  icon: string;
}

export interface WoWClass {
  id: string;
  name: string;
  color: string;
  hex: string;
  specs: string[];
}

export const CLASS_COLORS: Record<string, string> = {
  "death-knight": "#C41F3B",
  "demon-hunter": "#A330C9",
  druid: "#FF7D0A",
  evoker: "#33937F",
  hunter: "#ABD473",
  mage: "#40C7EB",
  monk: "#00FF96",
  paladin: "#F58CBA",
  priest: "#FFFFFF",
  rogue: "#FFF569",
  shaman: "#0070DE",
  warlock: "#8787ED",
  warrior: "#C79C6E",
};

export const SPECS: WoWSpec[] = [
  { id: "affliction-warlock", name: "Affliction Warlock", classId: "warlock", role: "dps", icon: "/wow/specs/affliction-warlock.webp" },
  { id: "arcane-mage", name: "Arcane Mage", classId: "mage", role: "dps", icon: "/wow/specs/arcane-mage.webp" },
  { id: "arms-warrior", name: "Arms Warrior", classId: "warrior", role: "dps", icon: "/wow/specs/arms-warrior.webp" },
  { id: "assassination-rogue", name: "Assassination Rogue", classId: "rogue", role: "dps", icon: "/wow/specs/assassination-rogue.webp" },
  { id: "augmentation-evoker", name: "Augmentation Evoker", classId: "evoker", role: "dps", icon: "/wow/specs/augmentation-evoker.webp" },
  { id: "balance-druid", name: "Balance Druid", classId: "druid", role: "dps", icon: "/wow/specs/balance-druid.webp" },
  { id: "beast-mastery-hunter", name: "Beast Mastery Hunter", classId: "hunter", role: "dps", icon: "/wow/specs/beast-mastery-hunter.webp" },
  { id: "blood-death-knight", name: "Blood Death Knight", classId: "death-knight", role: "tank", icon: "/wow/specs/blood-death-knight.webp" },
  { id: "brewmaster-monk", name: "Brewmaster Monk", classId: "monk", role: "tank", icon: "/wow/specs/brewmaster-monk.webp" },
  { id: "demonology-warlock", name: "Demonology Warlock", classId: "warlock", role: "dps", icon: "/wow/specs/demonology-warlock.webp" },
  { id: "destruction-warlock", name: "Destruction Warlock", classId: "warlock", role: "dps", icon: "/wow/specs/destruction-warlock.webp" },
  { id: "devastation-evoker", name: "Devastation Evoker", classId: "evoker", role: "dps", icon: "/wow/specs/devastation-evoker.webp" },
  { id: "devourer-demon-hunter", name: "Devourer Demon Hunter", classId: "demon-hunter", role: "tank", icon: "/wow/specs/devourer-demon-hunter.webp" },
  { id: "discipline-priest", name: "Discipline Priest", classId: "priest", role: "healer", icon: "/wow/specs/discipline-priest.webp" },
  { id: "elemental-shaman", name: "Elemental Shaman", classId: "shaman", role: "dps", icon: "/wow/specs/elemental-shaman.webp" },
  { id: "enhancement-shaman", name: "Enhancement Shaman", classId: "shaman", role: "dps", icon: "/wow/specs/enhancement-shaman.webp" },
  { id: "feral-druid", name: "Feral Druid", classId: "druid", role: "dps", icon: "/wow/specs/feral-druid.webp" },
  { id: "fire-mage", name: "Fire Mage", classId: "mage", role: "dps", icon: "/wow/specs/fire-mage.webp" },
  { id: "frost-death-knight", name: "Frost Death Knight", classId: "death-knight", role: "dps", icon: "/wow/specs/frost-death-knight.webp" },
  { id: "frost-mage", name: "Frost Mage", classId: "mage", role: "dps", icon: "/wow/specs/frost-mage.webp" },
  { id: "fury-warrior", name: "Fury Warrior", classId: "warrior", role: "dps", icon: "/wow/specs/fury-warrior.webp" },
  { id: "guardian-druid", name: "Guardian Druid", classId: "druid", role: "tank", icon: "/wow/specs/guardian-druid.webp" },
  { id: "havoc-demon-hunter", name: "Havoc Demon Hunter", classId: "demon-hunter", role: "dps", icon: "/wow/specs/havoc-demon-hunter.webp" },
  { id: "holy-paladin", name: "Holy Paladin", classId: "paladin", role: "healer", icon: "/wow/specs/holy-paladin.webp" },
  { id: "holy-priest", name: "Holy Priest", classId: "priest", role: "healer", icon: "/wow/specs/holy-priest.webp" },
  { id: "marksmanship-hunter", name: "Marksmanship Hunter", classId: "hunter", role: "dps", icon: "/wow/specs/marksmanship-hunter.webp" },
  { id: "mistweaver-monk", name: "Mistweaver Monk", classId: "monk", role: "healer", icon: "/wow/specs/mistweaver-monk.webp" },
  { id: "outlaw-rogue", name: "Outlaw Rogue", classId: "rogue", role: "dps", icon: "/wow/specs/outlaw-rogue.webp" },
  { id: "preservation-evoker", name: "Preservation Evoker", classId: "evoker", role: "healer", icon: "/wow/specs/preservation-evoker.webp" },
  { id: "protection-paladin", name: "Protection Paladin", classId: "paladin", role: "tank", icon: "/wow/specs/protection-paladin.webp" },
  { id: "protection-warrior", name: "Protection Warrior", classId: "warrior", role: "tank", icon: "/wow/specs/protection-warrior.webp" },
  { id: "restoration-druid", name: "Restoration Druid", classId: "druid", role: "healer", icon: "/wow/specs/restoration-druid.webp" },
  { id: "restoration-shaman", name: "Restoration Shaman", classId: "shaman", role: "healer", icon: "/wow/specs/restoration-shaman.webp" },
  { id: "retribution-paladin", name: "Retribution Paladin", classId: "paladin", role: "dps", icon: "/wow/specs/retribution-paladin.webp" },
  { id: "shadow-priest", name: "Shadow Priest", classId: "priest", role: "dps", icon: "/wow/specs/shadow-priest.webp" },
  { id: "subtlety-rogue", name: "Subtlety Rogue", classId: "rogue", role: "dps", icon: "/wow/specs/subtlety-rogue.webp" },
  { id: "survival-hunter", name: "Survival Hunter", classId: "hunter", role: "dps", icon: "/wow/specs/survival-hunter.webp" },
  { id: "unholy-death-knight", name: "Unholy Death Knight", classId: "death-knight", role: "dps", icon: "/wow/specs/unholy-death-knight.webp" },
  { id: "vengeance-demon-hunter", name: "Vengeance Demon Hunter", classId: "demon-hunter", role: "dps", icon: "/wow/specs/vengeance-demon-hunter.webp" },
  { id: "windwalker-monk", name: "Windwalker Monk", classId: "monk", role: "dps", icon: "/wow/specs/windwalker-monk.webp" },
];

export function getClassColor(classId: string): string {
  return CLASS_COLORS[classId] || "#888888";
}

export function getSpecsByRole(role: string): WoWSpec[] {
  return SPECS.filter((s) => s.role === role);
}

export function getSpecsByClass(classId: string): WoWSpec[] {
  return SPECS.filter((s) => s.classId === classId);
}

/* ───── BIS Gear, Enchants, Gems, Talents ───── */

export interface BISItem {
  slot: string;
  name: string;
}

export interface EnchantItem {
  slot: string;
  name: string;
}

export interface GemItem {
  slot: string;
  name: string;
}

export interface TalentBuild {
  player: string;
  class: string;
  region: string;
  score: number;
  talents: string[];
}

export interface SpecData {
  bis: BISItem[];
  enchants: EnchantItem[];
  gems: string[];
  talents: TalentBuild[];
  statPriority: string[];
}

const SPEC_DATA: Record<string, SpecData> = {
  "devastation-evoker": {
    bis: [
      { slot: "Head", name: "Crown of Elders" },
      { slot: "Neck", name: "Amulet of the Deep" },
      { slot: "Shoulders", name: "Mantle of the Tempest" },
      { slot: "Back", name: "Drape of Cascading Flame" },
      { slot: "Chest", name: "Vest of the Firestorm" },
      { slot: "Wrist", name: "Bracers of Surging Power" },
      { slot: "Hands", name: "Handlers of the Ember" },
      { slot: "Waist", name: "Belt of the Inferno" },
      { slot: "Legs", name: "Leggings of the Blazing" },
      { slot: "Feet", name: "Treads of the Magma" },
      { slot: "Ring 1", name: "Signet of Blazing Power" },
      { slot: "Ring 2", name: "Band of the Earthen" },
      { slot: "Trinket 1", name: "Crystalline Salvation" },
      { slot: "Trinket 2", name: "Spoiled Rotten" },
      { slot: "Weapon", name: "Razortail Staff" },
      { slot: "Off-Hand", name: "Codex of the Flame" },
    ],
    enchants: [
      { slot: "Weapon", name: "Authority of the Depths" },
      { slot: "Chest", name: "Crystalline Radiance" },
      { slot: "Cloak", name: "Chant of Winged Grace" },
      { slot: "Legs", name: "Spellthread of the Storm" },
      { slot: "Boots", name: "Defender's March" },
      { slot: "Rings", name: "Radiant Haste" },
      { slot: "Gems x3", name: "Culminating Sapphire" },
    ],
    gems: ["Culminating Sapphire ×2", "Crystalline Pearl"],
    talents: [
      { player: "Zaelia", class: "Evoker", region: "EU", score: 3512, talents: ["Font of Magic", "Eternal Span", "Scintillating Strike", "Charged Blast", "Tip the Scales", "Dragonrage", "Firestorm", "Polarize", "Shifting Sands", "Engulfing Blaze", "Time Sink", "Prolong Life"] },
      { player: "Skylarker", class: "Evoker", region: "US", score: 3478, talents: ["Font of Magic", "Eternal Span", "Scintillating Strike", "Charged Blast", "Tip the Scales", "Dragonrage", "Firestorm", "Polarize", "Shifting Sands", "Engulfing Blaze", "Spatial Paradox", "Prolong Life"] },
      { player: "Void", class: "Evoker", region: "KR", score: 3410, talents: ["Font of Magic", "Eternal Span", "Scintillating Strike", "Charged Blast", "Tip the Scales", "Dragonrage", "Firestorm", "Regenerate", "Polarize", "Engulfing Blaze", "Time Sink", "Spatial Paradox"] },
    ],
    statPriority: ["Intellect", "Haste > 30%", "Mastery", "Critical Strike", "Versatility"],
  },
  "discipline-priest": {
    bis: [
      { slot: "Head", name: "Cowl of the Redeemed" },
      { slot: "Neck", name: "Choker of Forgiveness" },
      { slot: "Shoulders", name: "Shoulderguards of Atonement" },
      { slot: "Back", name: "Cloak of Penitence" },
      { slot: "Chest", name: "Vestments of the Light" },
      { slot: "Wrist", name: "Bindings of Absolution" },
      { slot: "Hands", name: "Gloves of the Healer" },
      { slot: "Waist", name: "Cord of the Ascended" },
      { slot: "Legs", name: "Leggings of Salvation" },
      { slot: "Feet", name: "Sandals of the Pilgrim" },
      { slot: "Ring 1", name: "Solace of the Divine" },
      { slot: "Ring 2", name: "Loop of Enduring Hope" },
      { slot: "Trinket 1", name: "Rekindled Ember" },
      { slot: "Trinket 2", name: "Soul of the Martyr" },
      { slot: "Weapon", name: "Scepter of the Light" },
      { slot: "Off-Hand", name: "Tome of Redemption" },
    ],
    enchants: [
      { slot: "Weapon", name: "Authority of the Depths" },
      { slot: "Chest", name: "Crystalline Radiance" },
      { slot: "Cloak", name: "Chant of Winged Grace" },
      { slot: "Legs", name: "Spellthread of the Storm" },
      { slot: "Boots", name: "Defender's March" },
      { slot: "Rings", name: "Radiant Haste" },
      { slot: "Gems x3", name: "Culminating Sapphire" },
    ],
    gems: ["Culminating Sapphire ×2", "Crystalline Pearl"],
    talents: [
      { player: "Nerft", class: "Priest", region: "EU", score: 3740, talents: ["Atonement", "Rapture", "Evangelism", "Penance", "Power Word: Solace", "Schism", "Mindbender", "Halo", "Shadow Covenant", "Twist of Fate", "Contrition", "Purge the Wicked"] },
      { player: "Revived", class: "Priest", region: "US", score: 3698, talents: ["Atonement", "Rapture", "Evangelism", "Penance", "Power Word: Solace", "Schism", "Mindbender", "Halo", "Shield of Faith", "Twist of Fate", "Contrition", "Purge the Wicked"] },
      { player: "Soni", class: "Priest", region: "EU", score: 3655, talents: ["Atonement", "Rapture", "Evangelism", "Penance", "Power Word: Solace", "Schism", "Mindbender", "Halo", "Shadow Covenant", "Twist of Fate", "Contrition", "Lenience"] },
    ],
    statPriority: ["Intellect", "Haste > 25%", "Critical Strike", "Mastery", "Versatility"],
  },
  "arms-warrior": {
    bis: [
      { slot: "Head", name: "Helm of the Warlord" },
      { slot: "Neck", name: "Pendant of Victory" },
      { slot: "Shoulders", name: "Pauldrons of the Colossus" },
      { slot: "Back", name: "Cloak of the Unyielding" },
      { slot: "Chest", name: "Brestplate of the Champion" },
      { slot: "Wrist", name: "Vambraces of the Skirmisher" },
      { slot: "Hands", name: "Gauntlets of the Blade" },
      { slot: "Waist", name: "Belt of the Juggernaut" },
      { slot: "Legs", name: "Legplates of the Conqueror" },
      { slot: "Feet", name: "Greaves of the Vanguard" },
      { slot: "Ring 1", name: "Signet of the Colossus" },
      { slot: "Ring 2", name: "Band of the Warbringer" },
      { slot: "Trinket 1", name: "Desperate Invocation" },
      { slot: "Trinket 2", name: "Embrace of the Earth" },
      { slot: "Weapon", name: "Decapitator (2H Axe)" },
      { slot: "Off-Hand", name: "—" },
    ],
    enchants: [
      { slot: "Weapon", name: "Authority of the Depths" },
      { slot: "Chest", name: "Crystalline Radiance" },
      { slot: "Cloak", name: "Chant of Winged Grace" },
      { slot: "Legs", name: "Fanged Sporoderm" },
      { slot: "Boots", name: "Defender's March" },
      { slot: "Rings", name: "Radiant Haste" },
      { slot: "Gems x3", name: "Squall of Storms" },
    ],
    gems: ["Squall of Storms ×2", "Crystalline Pearl"],
    talents: [
      { player: "Xaryu", class: "Warrior", region: "US", score: 3800, talents: ["Warbreaker", "Cleave", "Skullsplitter", "Colossus Smash", "Mortal Strike", "Sudden Death", "Anger Management", "In for the Kill", "Storm of Swords", "Titan's Grip", "Defensive Stance", "Banner of Aggression"] },
      { player: "Jazgg", class: "Warrior", region: "EU", score: 3750, talents: ["Warbreaker", "Cleave", "Skullsplitter", "Colossus Smash", "Mortal Strike", "Sudden Death", "Anger Management", "In for the Kill", "Storm of Swords", "Titan's Grip", "Impenetrable Wall", "Banner of Aggression"] },
      { player: "Savix", class: "Warrior", region: "US", score: 3712, talents: ["Warbreaker", "Cleave", "Skullsplitter", "Colossus Smash", "Mortal Strike", "Sudden Death", "Anger Management", "In for the Kill", "Storm of Swords", "Test of Might", "Defensive Stance", "Strength of Arms"] },
    ],
    statPriority: ["Strength", "Haste > 20%", "Critical Strike", "Mastery", "Versatility"],
  },
  "blood-death-knight": {
    bis: [
      { slot: "Head", name: "Helm of the Darkfallen" },
      { slot: "Neck", name: "Amulet of the Damned" },
      { slot: "Shoulders", name: "Pauldrons of the Lich" },
      { slot: "Back", name: "Drape of the Frostwyrm" },
      { slot: "Chest", name: "Boneplate Vest" },
      { slot: "Wrist", name: "Bindings of the Grave" },
      { slot: "Hands", name: "Gauntlets of the Scourge" },
      { slot: "Waist", name: "Girdle of the Frozen" },
      { slot: "Legs", name: "Greaves of the Plague" },
      { slot: "Feet", name: "Treads of the Lich" },
      { slot: "Ring 1", name: "Seal of the Damned" },
      { slot: "Ring 2", name: "Loop of the Unholy" },
      { slot: "Trinket 1", name: "Rage of the Frozen" },
      { slot: "Trinket 2", name: "Soul of the Damned" },
      { slot: "Weapon", name: "Soulsever (2H Sword)" },
      { slot: "Off-Hand", name: "—" },
    ],
    enchants: [
      { slot: "Weapon", name: "Rune of the Stoneskin Gargoyle" },
      { slot: "Chest", name: "Crystalline Radiance" },
      { slot: "Cloak", name: "Chant of Winged Grace" },
      { slot: "Legs", name: "Fanged Sporoderm" },
      { slot: "Boots", name: "Defender's March" },
      { slot: "Rings", name: "Radiant Haste" },
      { slot: "Gems x3", name: "Squall of Storms" },
    ],
    gems: ["Squall of Storms ×2", "Crystalline Pearl"],
    talents: [
      { player: "Darkmech", class: "DK", region: "EU", score: 3825, talents: ["Heart Strike", "Marrowrend", "Death Strike", "Blood Boil", "Dancing Rune Weapon", "Vampiric Blood", "Icy Touch", "Anti-Magic Shell", "Consumption", "Bone Shield", "Crimson Scourge", "Relish in Blood"] },
      { player: "Taylen", class: "DK", region: "US", score: 3780, talents: ["Heart Strike", "Marrowrend", "Death Strike", "Blood Boil", "Dancing Rune Weapon", "Vampiric Blood", "Icy Touch", "Anti-Magic Shell", "Consumption", "Bone Shield", "Blood Tap", "Drain Blood"] },
    ],
    statPriority: ["Strength", "Haste > 20%", "Versatility", "Mastery", "Critical Strike"],
  },
};

export function getSpecData(specId: string): SpecData | undefined {
  return SPEC_DATA[specId];
}

export function getAllSpecData(): Record<string, SpecData> {
  return SPEC_DATA;
}
