export interface WoWSpec {
  id: string;
  name: string;
  classId: string;
  role: "dps" | "healer" | "tank";
  icon: string;
  seo: string[];
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
  { id: "affliction-warlock", name: "Affliction Warlock", classId: "warlock", role: "dps", icon: "/wow/specs/affliction-warlock.webp", seo: ["affliction warlock talents", "warlock affliction build", "affliction lock mythic+", "warlock dps talents"] },
  { id: "arcane-mage", name: "Arcane Mage", classId: "mage", role: "dps", icon: "/wow/specs/arcane-mage.webp", seo: ["arcane mage talents", "arcane mage build", "mage arcane mythic+", "arcane mage tww"] },
  { id: "arms-warrior", name: "Arms Warrior", classId: "warrior", role: "dps", icon: "/wow/specs/arms-warrior.webp", seo: ["arms warrior talents", "warrior arms build", "arms warrior mythic+", "warrior dps talents"] },
  { id: "assassination-rogue", name: "Assassination Rogue", classId: "rogue", role: "dps", icon: "/wow/specs/assassination-rogue.webp", seo: ["assassination rogue talents", "rogue assassination build", "sin rogue mythic+"] },
  { id: "augmentation-evoker", name: "Augmentation Evoker", classId: "evoker", role: "dps", icon: "/wow/specs/augmentation-evoker.webp", seo: ["augmentation evoker talents", "aug evoker build", "evoker support talents"] },
  { id: "balance-druid", name: "Balance Druid", classId: "druid", role: "dps", icon: "/wow/specs/balance-druid.webp", seo: ["balance druid talents", "boomkin talents", "druid balance build"] },
  { id: "beast-mastery-hunter", name: "Beast Mastery Hunter", classId: "hunter", role: "dps", icon: "/wow/specs/beast-mastery-hunter.webp", seo: ["beast mastery hunter talents", "bm hunter talents", "hunter bm build"] },
  { id: "blood-death-knight", name: "Blood Death Knight", classId: "death-knight", role: "tank", icon: "/wow/specs/blood-death-knight.webp", seo: ["blood dk talents", "blood death knight build", "dk tank talents", "blood dk mythic+"] },
  { id: "brewmaster-monk", name: "Brewmaster Monk", classId: "monk", role: "tank", icon: "/wow/specs/brewmaster-monk.webp", seo: ["brewmaster monk talents", "br monk talents", "monk tank build"] },
  { id: "demonology-warlock", name: "Demonology Warlock", classId: "warlock", role: "dps", icon: "/wow/specs/demonology-warlock.webp", seo: ["demonology warlock talents", "demo lock talents", "warlock demonology build"] },
  { id: "destruction-warlock", name: "Destruction Warlock", classId: "warlock", role: "dps", icon: "/wow/specs/destruction-warlock.webp", seo: ["destruction warlock talents", "destro lock talents", "warlock destruction build"] },
  { id: "devastation-evoker", name: "Devastation Evoker", classId: "evoker", role: "dps", icon: "/wow/specs/devastation-evoker.webp", seo: ["devastation evoker talents", "devoker talents", "evoker dps build"] },
  { id: "devourer-demon-hunter", name: "Devourer Demon Hunter", classId: "demon-hunter", role: "tank", icon: "/wow/specs/devourer-demon-hunter.webp", seo: ["demon hunter tank talents", "dh tank talents", "vengeance dh build", "dh tank mythic+"] },
  { id: "discipline-priest", name: "Discipline Priest", classId: "priest", role: "healer", icon: "/wow/specs/discipline-priest.webp", seo: ["discipline priest talents", "disc priest build", "priest healer talents", "disc priest mythic+"] },
  { id: "elemental-shaman", name: "Elemental Shaman", classId: "shaman", role: "dps", icon: "/wow/specs/elemental-shaman.webp", seo: ["elemental shaman talents", "ele shaman build", "shaman elemental dps"] },
  { id: "enhancement-shaman", name: "Enhancement Shaman", classId: "shaman", role: "dps", icon: "/wow/specs/enhancement-shaman.webp", seo: ["enhancement shaman talents", "enh shaman build", "shaman enhancement dps"] },
  { id: "feral-druid", name: "Feral Druid", classId: "druid", role: "dps", icon: "/wow/specs/feral-druid.webp", seo: ["feral druid talents", "feral dps build", "druid feral talents"] },
  { id: "fire-mage", name: "Fire Mage", classId: "mage", role: "dps", icon: "/wow/specs/fire-mage.webp", seo: ["fire mage talents", "fire mage build", "mage fire mythic+"] },
  { id: "frost-death-knight", name: "Frost Death Knight", classId: "death-knight", role: "dps", icon: "/wow/specs/frost-death-knight.webp", seo: ["frost dk talents", "frost death knight build", "dk frost dps"] },
  { id: "frost-mage", name: "Frost Mage", classId: "mage", role: "dps", icon: "/wow/specs/frost-mage.webp", seo: ["frost mage talents", "frost mage build", "mage frost talents"] },
  { id: "fury-warrior", name: "Fury Warrior", classId: "warrior", role: "dps", icon: "/wow/specs/fury-warrior.webp", seo: ["fury warrior talents", "warrior fury build", "fury warrior mythic+"] },
  { id: "guardian-druid", name: "Guardian Druid", classId: "druid", role: "tank", icon: "/wow/specs/guardian-druid.webp", seo: ["guardian druid talents", "bear tank talents", "druid guardian build"] },
  { id: "havoc-demon-hunter", name: "Havoc Demon Hunter", classId: "demon-hunter", role: "dps", icon: "/wow/specs/havoc-demon-hunter.webp", seo: ["havoc demon hunter talents", "dh havoc build", "demon hunter dps talents"] },
  { id: "holy-paladin", name: "Holy Paladin", classId: "paladin", role: "healer", icon: "/wow/specs/holy-paladin.webp", seo: ["holy paladin talents", "hpal talents", "paladin healer build"] },
  { id: "holy-priest", name: "Holy Priest", classId: "priest", role: "healer", icon: "/wow/specs/holy-priest.webp", seo: ["holy priest talents", "priest holy build", "holy priest mythic+"] },
  { id: "marksmanship-hunter", name: "Marksmanship Hunter", classId: "hunter", role: "dps", icon: "/wow/specs/marksmanship-hunter.webp", seo: ["marksmanship hunter talents", "mm hunter talents", "hunter marksman build"] },
  { id: "mistweaver-monk", name: "Mistweaver Monk", classId: "monk", role: "healer", icon: "/wow/specs/mistweaver-monk.webp", seo: ["mistweaver monk talents", "mw monk talents", "monk healer build"] },
  { id: "outlaw-rogue", name: "Outlaw Rogue", classId: "rogue", role: "dps", icon: "/wow/specs/outlaw-rogue.webp", seo: ["outlaw rogue talents", "rogue outlaw build", "outlaw rogue mythic+"] },
  { id: "preservation-evoker", name: "Preservation Evoker", classId: "evoker", role: "healer", icon: "/wow/specs/preservation-evoker.webp", seo: ["preservation evoker talents", "prevoker talents", "evoker healer build"] },
  { id: "protection-paladin", name: "Protection Paladin", classId: "paladin", role: "tank", icon: "/wow/specs/protection-paladin.webp", seo: ["protection paladin talents", "prot pally talents", "paladin tank build"] },
  { id: "protection-warrior", name: "Protection Warrior", classId: "warrior", role: "tank", icon: "/wow/specs/protection-warrior.webp", seo: ["protection warrior talents", "prot war talents", "warrior tank build"] },
  { id: "restoration-druid", name: "Restoration Druid", classId: "druid", role: "healer", icon: "/wow/specs/restoration-druid.webp", seo: ["restoration druid talents", "resto druid build", "druid healer talents"] },
  { id: "restoration-shaman", name: "Restoration Shaman", classId: "shaman", role: "healer", icon: "/wow/specs/restoration-shaman.webp", seo: ["restoration shaman talents", "rsham build", "shaman healer talents"] },
  { id: "retribution-paladin", name: "Retribution Paladin", classId: "paladin", role: "dps", icon: "/wow/specs/retribution-paladin.webp", seo: ["retribution paladin talents", "ret pally talents", "paladin ret dps"] },
  { id: "shadow-priest", name: "Shadow Priest", classId: "priest", role: "dps", icon: "/wow/specs/shadow-priest.webp", seo: ["shadow priest talents", "spriest build", "priest shadow dps"] },
  { id: "subtlety-rogue", name: "Subtlety Rogue", classId: "rogue", role: "dps", icon: "/wow/specs/subtlety-rogue.webp", seo: ["subtlety rogue talents", "sub rogue talents", "rogue subtlety build"] },
  { id: "survival-hunter", name: "Survival Hunter", classId: "hunter", role: "dps", icon: "/wow/specs/survival-hunter.webp", seo: ["survival hunter talents", "surv hunter talents", "hunter survival build"] },
  { id: "unholy-death-knight", name: "Unholy Death Knight", classId: "death-knight", role: "dps", icon: "/wow/specs/unholy-death-knight.webp", seo: ["unholy dk talents", "unholy death knight build", "dk unholy dps"] },
  { id: "vengeance-demon-hunter", name: "Vengeance Demon Hunter", classId: "demon-hunter", role: "dps", icon: "/wow/specs/vengeance-demon-hunter.webp", seo: ["vengeance demon hunter talents", "vengeance dh build", "dh tank talents", "vengeance dh mythic+"] },
  { id: "windwalker-monk", name: "Windwalker Monk", classId: "monk", role: "dps", icon: "/wow/specs/windwalker-monk.webp", seo: ["windwalker monk talents", "ww monk talents", "monk windwalker build"] },
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

export interface TalentNode {
  name: string;
  row: number;
  col: number;
  selected: boolean;
}

export interface TalentTree {
  name: string;
  nodes: TalentNode[];
}

export interface PlayerBuild {
  player: string;
  class: string;
  region: string;
  score: number;
  type: "raid" | "mythic+";
  talentString: string;
  trees: TalentTree[];
}

export interface SpecData {
  bis: BISItem[];
  enchants: EnchantItem[];
  gems: string[];
  builds: PlayerBuild[];
  statPriority: string[];
}

/* ────────── DATA ────────── */

const SPEC_DATA: Record<string, SpecData> = {
  "vengeance-demon-hunter": {
    bis: [
      { slot: "Head", name: "Helm of the Unbroken" },
      { slot: "Neck", name: "Pendant of the Demon" },
      { slot: "Shoulders", name: "Pauldrons of the Dark" },
      { slot: "Back", name: "Cloak of the Illidari" },
      { slot: "Chest", name: "Vest of Immolation" },
      { slot: "Wrist", name: "Bracers of Unending Fury" },
      { slot: "Hands", name: "Grips of the Slayer" },
      { slot: "Waist", name: "Belt of the Betrayer" },
      { slot: "Legs", name: "Legguards of the Demon" },
      { slot: "Feet", name: "Treads of the Fallen" },
      { slot: "Ring 1", name: "Signet of the Unbroken" },
      { slot: "Ring 2", name: "Loop of the Fel" },
      { slot: "Trinket 1", name: "Darkmoon Deck: Symbiosis" },
      { slot: "Trinket 2", name: "Embrace of the Earth" },
      { slot: "Weapon", name: "Fel-Sever (1H Axe)" },
      { slot: "Off-Hand", name: "Fel-Sever (1H Axe)" },
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
    statPriority: ["Strength", "Haste", "Versatility", "Mastery", "Critical Strike"],
    builds: [
      {
        player: "Yoda", class: "DH", region: "EU", score: 3870, type: "mythic+",
        talentString: "BgCAAAAAAAAAAAAAAAAAAAAAAAgkIRSiERJRikIRIJRSikIJJBAAAAA",
        trees: [
          { name: "Class Talents", nodes: [
            { name: "Felblade", row: 1, col: 1, selected: true },
            { name: "Demonic Wards", row: 1, col: 2, selected: false },
            { name: "Burning Alive", row: 2, col: 1, selected: true },
            { name: "Charred Flesh", row: 2, col: 2, selected: true },
            { name: "Sigil of Flame", row: 3, col: 1, selected: true },
            { name: "Disrupting Fury", row: 3, col: 2, selected: false },
            { name: "Fracture", row: 4, col: 1, selected: true },
            { name: "Infernal Armor", row: 4, col: 2, selected: true },
            { name: "Fel Devastation", row: 5, col: 1, selected: true },
            { name: "Master of the Glaive", row: 5, col: 2, selected: true },
            { name: "Quickened Sigils", row: 6, col: 1, selected: true },
            { name: "Demonic", row: 6, col: 2, selected: false },
            { name: "Soul Rending", row: 7, col: 1, selected: true },
            { name: "Darkglare Boon", row: 7, col: 2, selected: true },
            { name: "The Hunt", row: 8, col: 1, selected: true },
          ]},
          { name: "Spec Talents", nodes: [
            { name: "Shear", row: 1, col: 1, selected: true },
            { name: "Soul Cleave", row: 1, col: 2, selected: true },
            { name: "Demonic Wards", row: 2, col: 1, selected: true },
            { name: "Deception", row: 2, col: 2, selected: false },
            { name: "Frailty", row: 3, col: 1, selected: true },
            { name: "Void Reaver", row: 3, col: 2, selected: true },
            { name: "Fel Flame Fortification", row: 4, col: 1, selected: true },
            { name: "Bulk Extraction", row: 4, col: 2, selected: false },
            { name: "Spirit Bomb", row: 5, col: 1, selected: true },
            { name: "Stoke the Flames", row: 5, col: 2, selected: true },
            { name: "Charred Warblades", row: 6, col: 1, selected: true },
            { name: "Soulmonger", row: 6, col: 2, selected: false },
            { name: "Vulnerability", row: 7, col: 1, selected: true },
            { name: "Burning Wound", row: 7, col: 2, selected: true },
            { name: "Fel Barrage", row: 8, col: 1, selected: false },
            { name: "Ruinous Bulwark", row: 9, col: 1, selected: true },
            { name: "Soul Furnace", row: 9, col: 2, selected: false },
            { name: "Down in Flames", row: 10, col: 1, selected: true },
          ]},
        ],
      },
      {
        player: "Trill", class: "DH", region: "US", score: 3850, type: "mythic+",
        talentString: "BgCAAAAAAAAAAAAAAAAAAAAAAAgkIRSiERJRikIRIJRSikIJJBAAAAA",
        trees: [
          { name: "Class Talents", nodes: [
            { name: "Felblade", row: 1, col: 1, selected: true },
            { name: "Demonic Wards", row: 1, col: 2, selected: false },
            { name: "Burning Alive", row: 2, col: 1, selected: true },
            { name: "Charred Flesh", row: 2, col: 2, selected: false },
            { name: "Sigil of Flame", row: 3, col: 1, selected: true },
            { name: "Disrupting Fury", row: 3, col: 2, selected: true },
            { name: "Fracture", row: 4, col: 1, selected: true },
            { name: "Infernal Armor", row: 4, col: 2, selected: true },
            { name: "Fel Devastation", row: 5, col: 1, selected: true },
            { name: "Master of the Glaive", row: 5, col: 2, selected: false },
            { name: "Quickened Sigils", row: 6, col: 1, selected: true },
            { name: "Demonic", row: 6, col: 2, selected: true },
            { name: "Soul Rending", row: 7, col: 1, selected: true },
            { name: "Darkglare Boon", row: 7, col: 2, selected: true },
            { name: "The Hunt", row: 8, col: 1, selected: true },
          ]},
          { name: "Spec Talents", nodes: [
            { name: "Shear", row: 1, col: 1, selected: true },
            { name: "Soul Cleave", row: 1, col: 2, selected: true },
            { name: "Demonic Wards", row: 2, col: 1, selected: true },
            { name: "Deception", row: 2, col: 2, selected: false },
            { name: "Frailty", row: 3, col: 1, selected: true },
            { name: "Void Reaver", row: 3, col: 2, selected: false },
            { name: "Fel Flame Fortification", row: 4, col: 1, selected: true },
            { name: "Bulk Extraction", row: 4, col: 2, selected: true },
            { name: "Spirit Bomb", row: 5, col: 1, selected: true },
            { name: "Stoke the Flames", row: 5, col: 2, selected: false },
            { name: "Charred Warblades", row: 6, col: 1, selected: true },
            { name: "Soulmonger", row: 6, col: 2, selected: true },
            { name: "Vulnerability", row: 7, col: 1, selected: true },
            { name: "Burning Wound", row: 7, col: 2, selected: false },
            { name: "Fel Barrage", row: 8, col: 1, selected: true },
            { name: "Ruinous Bulwark", row: 9, col: 1, selected: true },
            { name: "Soul Furnace", row: 9, col: 2, selected: false },
            { name: "Down in Flames", row: 10, col: 1, selected: true },
          ]},
        ],
      },
      {
        player: "Jeath", class: "DH", region: "EU", score: 3780, type: "raid",
        talentString: "BgCAAAAAAAAAAAAAAAAAAAAAAAgkIRSiERJRikIRIJRSikIJRSCAAAAA",
        trees: [
          { name: "Class Talents", nodes: [
            { name: "Felblade", row: 1, col: 1, selected: true },
            { name: "Demonic Wards", row: 1, col: 2, selected: false },
            { name: "Burning Alive", row: 2, col: 1, selected: true },
            { name: "Charred Flesh", row: 2, col: 2, selected: true },
            { name: "Sigil of Flame", row: 3, col: 1, selected: true },
            { name: "Disrupting Fury", row: 3, col: 2, selected: false },
            { name: "Fracture", row: 4, col: 1, selected: true },
            { name: "Infernal Armor", row: 4, col: 2, selected: true },
            { name: "Fel Devastation", row: 5, col: 1, selected: true },
            { name: "Master of the Glaive", row: 5, col: 2, selected: true },
            { name: "Quickened Sigils", row: 6, col: 1, selected: false },
            { name: "Demonic", row: 6, col: 2, selected: true },
            { name: "Soul Rending", row: 7, col: 1, selected: true },
            { name: "Darkglare Boon", row: 7, col: 2, selected: true },
            { name: "The Hunt", row: 8, col: 1, selected: true },
          ]},
          { name: "Spec Talents", nodes: [
            { name: "Shear", row: 1, col: 1, selected: true },
            { name: "Soul Cleave", row: 1, col: 2, selected: true },
            { name: "Demonic Wards", row: 2, col: 1, selected: true },
            { name: "Deception", row: 2, col: 2, selected: false },
            { name: "Frailty", row: 3, col: 1, selected: true },
            { name: "Void Reaver", row: 3, col: 2, selected: false },
            { name: "Fel Flame Fortification", row: 4, col: 1, selected: true },
            { name: "Bulk Extraction", row: 4, col: 2, selected: false },
            { name: "Spirit Bomb", row: 5, col: 1, selected: true },
            { name: "Stoke the Flames", row: 5, col: 2, selected: true },
            { name: "Charred Warblades", row: 6, col: 1, selected: true },
            { name: "Soulmonger", row: 6, col: 2, selected: false },
            { name: "Vulnerability", row: 7, col: 1, selected: true },
            { name: "Burning Wound", row: 7, col: 2, selected: true },
            { name: "Fel Barrage", row: 8, col: 1, selected: false },
            { name: "Ruinous Bulwark", row: 9, col: 1, selected: true },
            { name: "Soul Furnace", row: 9, col: 2, selected: false },
            { name: "Down in Flames", row: 10, col: 1, selected: true },
          ]},
        ],
      },
    ],
  },
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
    statPriority: ["Intellect", "Haste > 30%", "Mastery", "Critical Strike", "Versatility"],
    builds: [
      {
        player: "Zaelia", class: "Evoker", region: "EU", score: 3512, type: "mythic+",
        talentString: "BgCAAAAAAAAAAAAAAAAAAAAAAAgkIRSiERJRikIRIJRSCAAAAA",
        trees: [
          { name: "Class Talents", nodes: [
            { name: "Font of Magic", row: 1, col: 1, selected: true },
            { name: "Eternal Span", row: 1, col: 2, selected: true },
            { name: "Scintillating Strike", row: 2, col: 1, selected: true },
            { name: "Charged Blast", row: 2, col: 2, selected: true },
            { name: "Tip the Scales", row: 3, col: 1, selected: true },
            { name: "Dragonrage", row: 3, col: 2, selected: true },
            { name: "Firestorm", row: 4, col: 1, selected: true },
            { name: "Polarize", row: 4, col: 2, selected: true },
            { name: "Shifting Sands", row: 5, col: 1, selected: true },
            { name: "Engulfing Blaze", row: 5, col: 2, selected: true },
            { name: "Time Sink", row: 6, col: 1, selected: true },
            { name: "Prolong Life", row: 6, col: 2, selected: true },
          ]},
          { name: "Spec Talents", nodes: [
            { name: "Living Flame", row: 1, col: 1, selected: true },
            { name: "Fire Breath", row: 1, col: 2, selected: true },
            { name: "Snapfire", row: 2, col: 1, selected: true },
            { name: "Burnout", row: 2, col: 2, selected: true },
            { name: "Engulf", row: 3, col: 1, selected: true },
            { name: "Pyre", row: 3, col: 2, selected: true },
            { name: "Imminent Destruction", row: 4, col: 1, selected: true },
            { name: "Event Horizon", row: 4, col: 2, selected: false },
            { name: "Dragon's Fury", row: 5, col: 1, selected: true },
            { name: "Blast Furnace", row: 5, col: 2, selected: true },
            { name: "Feed the Flames", row: 6, col: 1, selected: true },
            { name: "Lush Vitality", row: 6, col: 2, selected: false },
            { name: "Causal Theory", row: 7, col: 1, selected: true },
            { name: "Power Nexus", row: 7, col: 2, selected: true },
            { name: "Everburning Flame", row: 8, col: 1, selected: true },
          ]},
        ],
      },
      {
        player: "Void", class: "Evoker", region: "KR", score: 3410, type: "raid",
        talentString: "BgCAAAAAAAAAAAAAAAAAAAAAAAgkIRSiERJRikIJRSCAAAAA",
        trees: [
          { name: "Class Talents", nodes: [
            { name: "Font of Magic", row: 1, col: 1, selected: true },
            { name: "Eternal Span", row: 1, col: 2, selected: true },
            { name: "Scintillating Strike", row: 2, col: 1, selected: true },
            { name: "Charged Blast", row: 2, col: 2, selected: true },
            { name: "Tip the Scales", row: 3, col: 1, selected: true },
            { name: "Dragonrage", row: 3, col: 2, selected: true },
            { name: "Firestorm", row: 4, col: 1, selected: true },
            { name: "Regenerate", row: 4, col: 2, selected: true },
            { name: "Polarize", row: 5, col: 1, selected: true },
            { name: "Engulfing Blaze", row: 5, col: 2, selected: true },
            { name: "Time Sink", row: 6, col: 1, selected: true },
            { name: "Spatial Paradox", row: 6, col: 2, selected: true },
          ]},
          { name: "Spec Talents", nodes: [
            { name: "Living Flame", row: 1, col: 1, selected: true },
            { name: "Fire Breath", row: 1, col: 2, selected: true },
            { name: "Snapfire", row: 2, col: 1, selected: true },
            { name: "Burnout", row: 2, col: 2, selected: true },
            { name: "Engulf", row: 3, col: 1, selected: true },
            { name: "Pyre", row: 3, col: 2, selected: true },
            { name: "Imminent Destruction", row: 4, col: 1, selected: true },
            { name: "Event Horizon", row: 4, col: 2, selected: false },
            { name: "Dragon's Fury", row: 5, col: 1, selected: true },
            { name: "Blast Furnace", row: 5, col: 2, selected: false },
            { name: "Feed the Flames", row: 6, col: 1, selected: true },
            { name: "Lush Vitality", row: 6, col: 2, selected: true },
            { name: "Causal Theory", row: 7, col: 1, selected: true },
            { name: "Power Nexus", row: 7, col: 2, selected: false },
            { name: "Everburning Flame", row: 8, col: 1, selected: true },
          ]},
        ],
      },
    ],
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
    statPriority: ["Intellect", "Haste > 25%", "Critical Strike", "Mastery", "Versatility"],
    builds: [
      {
        player: "Nerft", class: "Priest", region: "EU", score: 3740, type: "mythic+",
        talentString: "BgCAAAAAAAAAAAAAAAAAAAAAAAgkIRSiERJRikIRIJRSCAAAAA",
        trees: [
          { name: "Class Talents", nodes: [
            { name: "Atonement", row: 1, col: 1, selected: true },
            { name: "Rapture", row: 1, col: 2, selected: true },
            { name: "Evangelism", row: 2, col: 1, selected: true },
            { name: "Penance", row: 2, col: 2, selected: true },
            { name: "Power Word: Solace", row: 3, col: 1, selected: true },
            { name: "Schism", row: 3, col: 2, selected: true },
            { name: "Mindbender", row: 4, col: 1, selected: true },
            { name: "Halo", row: 4, col: 2, selected: true },
            { name: "Shadow Covenant", row: 5, col: 1, selected: true },
            { name: "Twist of Fate", row: 5, col: 2, selected: true },
            { name: "Contrition", row: 6, col: 1, selected: true },
            { name: "Purge the Wicked", row: 6, col: 2, selected: true },
          ]},
          { name: "Spec Talents", nodes: [
            { name: "Smite", row: 1, col: 1, selected: true },
            { name: "Shield of Faith", row: 1, col: 2, selected: false },
            { name: "Pain Transference", row: 2, col: 1, selected: true },
            { name: "Borrowed Time", row: 2, col: 2, selected: true },
            { name: "Wrath Unleashed", row: 3, col: 1, selected: true },
            { name: "Crystalline Reflection", row: 3, col: 2, selected: false },
            { name: "Shadowfiend", row: 4, col: 1, selected: true },
            { name: "Sins of the Many", row: 4, col: 2, selected: true },
            { name: "Lenience", row: 5, col: 1, selected: false },
            { name: "Indemnity", row: 5, col: 2, selected: true },
            { name: "Pain of Death", row: 6, col: 1, selected: true },
            { name: "Brilliance", row: 6, col: 2, selected: false },
          ]},
        ],
      },
      {
        player: "Revived", class: "Priest", region: "US", score: 3698, type: "raid",
        talentString: "BgCAAAAAAAAAAAAAAAAAAAAAAAgkIRSiERJRikIRIJRSCAAAAA",
        trees: [
          { name: "Class Talents", nodes: [
            { name: "Atonement", row: 1, col: 1, selected: true },
            { name: "Rapture", row: 1, col: 2, selected: true },
            { name: "Evangelism", row: 2, col: 1, selected: true },
            { name: "Penance", row: 2, col: 2, selected: true },
            { name: "Power Word: Solace", row: 3, col: 1, selected: true },
            { name: "Schism", row: 3, col: 2, selected: true },
            { name: "Mindbender", row: 4, col: 1, selected: true },
            { name: "Halo", row: 4, col: 2, selected: true },
            { name: "Shield of Faith", row: 5, col: 1, selected: true },
            { name: "Twist of Fate", row: 5, col: 2, selected: true },
            { name: "Contrition", row: 6, col: 1, selected: true },
            { name: "Purge the Wicked", row: 6, col: 2, selected: true },
          ]},
          { name: "Spec Talents", nodes: [
            { name: "Smite", row: 1, col: 1, selected: true },
            { name: "Shield of Faith", row: 1, col: 2, selected: true },
            { name: "Pain Transference", row: 2, col: 1, selected: true },
            { name: "Borrowed Time", row: 2, col: 2, selected: false },
            { name: "Wrath Unleashed", row: 3, col: 1, selected: true },
            { name: "Crystalline Reflection", row: 3, col: 2, selected: true },
            { name: "Shadowfiend", row: 4, col: 1, selected: true },
            { name: "Sins of the Many", row: 4, col: 2, selected: true },
            { name: "Lenience", row: 5, col: 1, selected: true },
            { name: "Indemnity", row: 5, col: 2, selected: false },
            { name: "Pain of Death", row: 6, col: 1, selected: true },
            { name: "Brilliance", row: 6, col: 2, selected: false },
          ]},
        ],
      },
    ],
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
    statPriority: ["Strength", "Haste > 20%", "Critical Strike", "Mastery", "Versatility"],
    builds: [
      {
        player: "Xaryu", class: "Warrior", region: "US", score: 3800, type: "mythic+",
        talentString: "BgCAAAAAAAAAAAAAAAAAAAAAAAgkIRSiERJRikIRIJRSCAAAAA",
        trees: [
          { name: "Class Talents", nodes: [
            { name: "Warbreaker", row: 1, col: 1, selected: true },
            { name: "Cleave", row: 1, col: 2, selected: true },
            { name: "Skullsplitter", row: 2, col: 1, selected: true },
            { name: "Colossus Smash", row: 2, col: 2, selected: true },
            { name: "Mortal Strike", row: 3, col: 1, selected: true },
            { name: "Sudden Death", row: 3, col: 2, selected: true },
            { name: "Anger Management", row: 4, col: 1, selected: true },
            { name: "In for the Kill", row: 4, col: 2, selected: true },
            { name: "Storm of Swords", row: 5, col: 1, selected: true },
            { name: "Titan's Grip", row: 5, col: 2, selected: true },
            { name: "Defensive Stance", row: 6, col: 1, selected: true },
            { name: "Banner of Aggression", row: 6, col: 2, selected: true },
          ]},
          { name: "Spec Talents", nodes: [
            { name: "Overpower", row: 1, col: 1, selected: true },
            { name: "Sweeping Strikes", row: 1, col: 2, selected: true },
            { name: "Focused Fury", row: 2, col: 1, selected: true },
            { name: "Bone Cleaver", row: 2, col: 2, selected: false },
            { name: "Deep Wounds", row: 3, col: 1, selected: true },
            { name: "Rend", row: 3, col: 2, selected: true },
            { name: "Crackling Thunder", row: 4, col: 1, selected: true },
            { name: "Storm Bolt", row: 4, col: 2, selected: false },
            { name: "Bladestorm", row: 5, col: 1, selected: true },
            { name: "Unhinged", row: 5, col: 2, selected: true },
            { name: "Sharpen Blade", row: 6, col: 1, selected: true },
            { name: "Deadly Calm", row: 6, col: 2, selected: false },
            { name: "Test of Might", row: 7, col: 1, selected: true },
            { name: "War Machine", row: 7, col: 2, selected: false },
            { name: "Avatar", row: 8, col: 1, selected: true },
          ]},
        ],
      },
      {
        player: "Jazgg", class: "Warrior", region: "EU", score: 3750, type: "raid",
        talentString: "BgCAAAAAAAAAAAAAAAAAAAAAAAgkIRSiERJRikIRIJRSCAAAAA",
        trees: [
          { name: "Class Talents", nodes: [
            { name: "Warbreaker", row: 1, col: 1, selected: true },
            { name: "Cleave", row: 1, col: 2, selected: true },
            { name: "Skullsplitter", row: 2, col: 1, selected: true },
            { name: "Colossus Smash", row: 2, col: 2, selected: true },
            { name: "Mortal Strike", row: 3, col: 1, selected: true },
            { name: "Sudden Death", row: 3, col: 2, selected: true },
            { name: "Anger Management", row: 4, col: 1, selected: true },
            { name: "In for the Kill", row: 4, col: 2, selected: true },
            { name: "Storm of Swords", row: 5, col: 1, selected: true },
            { name: "Titan's Grip", row: 5, col: 2, selected: true },
            { name: "Impenetrable Wall", row: 6, col: 1, selected: true },
            { name: "Banner of Aggression", row: 6, col: 2, selected: true },
          ]},
          { name: "Spec Talents", nodes: [
            { name: "Overpower", row: 1, col: 1, selected: true },
            { name: "Sweeping Strikes", row: 1, col: 2, selected: false },
            { name: "Focused Fury", row: 2, col: 1, selected: true },
            { name: "Bone Cleaver", row: 2, col: 2, selected: true },
            { name: "Deep Wounds", row: 3, col: 1, selected: true },
            { name: "Rend", row: 3, col: 2, selected: true },
            { name: "Crackling Thunder", row: 4, col: 1, selected: true },
            { name: "Storm Bolt", row: 4, col: 2, selected: true },
            { name: "Bladestorm", row: 5, col: 1, selected: true },
            { name: "Unhinged", row: 5, col: 2, selected: false },
            { name: "Sharpen Blade", row: 6, col: 1, selected: true },
            { name: "Deadly Calm", row: 6, col: 2, selected: true },
            { name: "Test of Might", row: 7, col: 1, selected: true },
            { name: "War Machine", row: 7, col: 2, selected: false },
            { name: "Avatar", row: 8, col: 1, selected: true },
          ]},
        ],
      },
    ],
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
    statPriority: ["Strength", "Haste > 20%", "Versatility", "Mastery", "Critical Strike"],
    builds: [
      {
        player: "Darkmech", class: "DK", region: "EU", score: 3825, type: "mythic+",
        talentString: "BgCAAAAAAAAAAAAAAAAAAAAAAAgkIRSiERJRikIRIJRSCAAAAA",
        trees: [
          { name: "Class Talents", nodes: [
            { name: "Heart Strike", row: 1, col: 1, selected: true },
            { name: "Marrowrend", row: 1, col: 2, selected: true },
            { name: "Death Strike", row: 2, col: 1, selected: true },
            { name: "Blood Boil", row: 2, col: 2, selected: true },
            { name: "Dancing Rune Weapon", row: 3, col: 1, selected: true },
            { name: "Vampiric Blood", row: 3, col: 2, selected: true },
            { name: "Icy Touch", row: 4, col: 1, selected: true },
            { name: "Anti-Magic Shell", row: 4, col: 2, selected: true },
            { name: "Consumption", row: 5, col: 1, selected: true },
            { name: "Bone Shield", row: 5, col: 2, selected: true },
            { name: "Crimson Scourge", row: 6, col: 1, selected: true },
            { name: "Relish in Blood", row: 6, col: 2, selected: true },
          ]},
          { name: "Spec Talents", nodes: [
            { name: "Blade Strike", row: 1, col: 1, selected: true },
            { name: "Blood Tap", row: 1, col: 2, selected: false },
            { name: "Tombstone", row: 2, col: 1, selected: true },
            { name: "Sanguine Grounds", row: 2, col: 2, selected: true },
            { name: "Rapid Decomposition", row: 3, col: 1, selected: true },
            { name: "Hemostasis", row: 3, col: 2, selected: true },
            { name: "Bone Storm", row: 4, col: 1, selected: true },
            { name: "Unending Thirst", row: 4, col: 2, selected: false },
            { name: "Bloodworms", row: 5, col: 1, selected: true },
            { name: "Vicious Strikes", row: 5, col: 2, selected: true },
            { name: "Drain Blood", row: 6, col: 1, selected: false },
            { name: "Scent of Blood", row: 6, col: 2, selected: true },
            { name: "Red Thirst", row: 7, col: 1, selected: true },
            { name: "Bloodshot", row: 7, col: 2, selected: false },
            { name: "Gorefiend's Grasp", row: 8, col: 1, selected: true },
          ]},
        ],
      },
      {
        player: "Taylen", class: "DK", region: "US", score: 3780, type: "raid",
        talentString: "BgCAAAAAAAAAAAAAAAAAAAAAAAgkIRSiERJRikIRIJRSCAAAAA",
        trees: [
          { name: "Class Talents", nodes: [
            { name: "Heart Strike", row: 1, col: 1, selected: true },
            { name: "Marrowrend", row: 1, col: 2, selected: true },
            { name: "Death Strike", row: 2, col: 1, selected: true },
            { name: "Blood Boil", row: 2, col: 2, selected: true },
            { name: "Dancing Rune Weapon", row: 3, col: 1, selected: true },
            { name: "Vampiric Blood", row: 3, col: 2, selected: true },
            { name: "Icy Touch", row: 4, col: 1, selected: true },
            { name: "Anti-Magic Shell", row: 4, col: 2, selected: true },
            { name: "Consumption", row: 5, col: 1, selected: true },
            { name: "Bone Shield", row: 5, col: 2, selected: true },
            { name: "Crimson Scourge", row: 6, col: 1, selected: true },
            { name: "Blood Tap", row: 6, col: 2, selected: true },
          ]},
          { name: "Spec Talents", nodes: [
            { name: "Blade Strike", row: 1, col: 1, selected: true },
            { name: "Blood Tap", row: 1, col: 2, selected: true },
            { name: "Tombstone", row: 2, col: 1, selected: true },
            { name: "Sanguine Grounds", row: 2, col: 2, selected: false },
            { name: "Rapid Decomposition", row: 3, col: 1, selected: true },
            { name: "Hemostasis", row: 3, col: 2, selected: true },
            { name: "Bone Storm", row: 4, col: 1, selected: true },
            { name: "Unending Thirst", row: 4, col: 2, selected: true },
            { name: "Bloodworms", row: 5, col: 1, selected: false },
            { name: "Vicious Strikes", row: 5, col: 2, selected: true },
            { name: "Drain Blood", row: 6, col: 1, selected: true },
            { name: "Scent of Blood", row: 6, col: 2, selected: false },
            { name: "Red Thirst", row: 7, col: 1, selected: true },
            { name: "Bloodshot", row: 7, col: 2, selected: false },
            { name: "Gorefiend's Grasp", row: 8, col: 1, selected: true },
          ]},
        ],
      },
    ],
  },
};

export function getSpecData(specId: string): SpecData | undefined {
  return SPEC_DATA[specId];
}

export function getAllSpecData(): Record<string, SpecData> {
  return SPEC_DATA;
}
