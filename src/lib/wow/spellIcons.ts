// Hardcoded overrides for spellId -> iconName
// These are known correct icon names that don't follow naming conventions
const SPELL_ICON_MAP: Record<number, string> = {
  20572: "spell_deathknight_bloodboil",
  47541: "spell_deathknight_deathcoil",
  48792: "spell_deathknight_iceboundfortitude",
  49020: "spell_deathknight_obliterate",
  49143: "spell_deathknight_froststrike",
  49998: "spell_deathknight_deathstrike",
  50842: "spell_deathknight_pestilence",
  55233: "spell_deathknight_vampiricblood",
  61999: "spell_deathknight_raisedead",
  43265: "spell_deathknight_deathanddecay",
  45524: "spell_deathknight_chains",
  49206: "spell_deathknight_summonghoul",
  56222: "spell_deathknight_armyofdead",
  85948: "spell_deathknight_butcher",
  115989: "spell_deathknight_unholypresence",
  152280: "spell_deathknight_defile",
  196770: "ability_deathknight_remorselesswinters",
  220143: "spell_deathknight_deathsiphon",
};

// Hardcoded overrides for spell name -> iconName
const NAME_ICON_MAP: Record<string, string> = {
  "blood boil": "spell_deathknight_bloodboil",
  "death coil": "spell_deathknight_deathcoil",
  "icebound fortitude": "spell_deathknight_iceboundfortitude",
  "obliterate": "spell_deathknight_obliterate",
  "frost strike": "spell_deathknight_froststrike",
  "death strike": "spell_deathknight_deathstrike",
  "death and decay": "spell_deathknight_deathanddecay",
  "chains of ice": "spell_deathknight_chains",
  "raise dead": "spell_deathknight_raisedead",
  "vampiric blood": "spell_deathknight_vampiricblood",
  "army of the dead": "spell_deathknight_armyofdead",
  "defile": "spell_deathknight_defile",
  "remorseless winter": "ability_deathknight_remorselesswinters",
  "death siphon": "spell_deathknight_deathsiphon",
  "rune strike": "ability_deathknight_runestrike",
};

function nameToSnake(name: string): string {
  return name.toLowerCase().replace(/['':]/g, "").replace(/[^a-z0-9 ]/g, " ").trim().replace(/\s+/g, "_");
}

const CLASS_ICON_PATTERNS: Record<string, string[]> = {
  "death-knight": ["spell_deathknight", "spell_frost", "spell_shadow", "ability_deathknight"],
  "demon-hunter": ["ability_demonhunter", "spell_demonhunter"],
  "druid": ["ability_druid", "spell_druid", "spell_nature"],
  "evoker": ["ability_evoker"],
  "hunter": ["ability_hunter", "spell_hunter", "ability_marksmanship"],
  "mage": ["spell_fire", "spell_frost", "spell_arcane", "spell_magic"],
  "monk": ["ability_monk", "spell_monk"],
  "paladin": ["spell_paladin", "ability_paladin", "spell_holy"],
  "priest": ["spell_holy", "spell_shadow", "ability_priest"],
  "rogue": ["ability_rogue", "spell_shadow", "ability_backstab"],
  "shaman": ["spell_nature", "spell_fire", "spell_frost", "spell_lightning"],
  "warlock": ["spell_shadow", "spell_fire", "ability_warlock"],
  "warrior": ["ability_warrior", "spell_warrior", "spell_nature"],
};

const GENERIC_PREFIXES = ["ability", "spell", "inv", "passive", "racial"];

export function guessIconName(spellName: string, classId?: string, spellId?: number): string | null {
  if (spellId && SPELL_ICON_MAP[spellId]) return SPELL_ICON_MAP[spellId];

  const nameKey = spellName.toLowerCase().trim();
  if (NAME_ICON_MAP[nameKey]) return NAME_ICON_MAP[nameKey];

  const snake = nameToSnake(spellName);
  const patterns = CLASS_ICON_PATTERNS[classId || ""] || [];
  for (const prefix of patterns) {
    return `${prefix}_${snake}`;
  }
  for (const prefix of GENERIC_PREFIXES) {
    return `${prefix}_${snake}`;
  }
  return null;
}
