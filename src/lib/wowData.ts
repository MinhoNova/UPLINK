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
