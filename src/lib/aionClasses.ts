import { Swords, Sword, Shield, Wand2, Flashlight, Sparkles, Flame, Ghost, Zap } from "lucide-react";

export interface AionClass {
  id: string;
  name: string;
  role: string;
  tagline: string;
  talent: string;
  icon: any;
  color: string;
  glow: string;
  video?: string;
}

export const AION_CLASSES_LIST: AionClass[] = [
  {
    id: "ranger",
    name: "Ranger",
    role: "Ranged DPS",
    tagline: "Master of the bow — silent and deadly from afar.",
    talent: "Arrow Storm: rains destruction on your foes.",
    icon: Zap,
    color: "#34d399",
    glow: "rgba(52,211,153,0.4)",
    video: "/Ranger%20small.mp4",
  },
  {
    id: "assassin",
    name: "Assassin",
    role: "Melee DPS / Burst",
    tagline: "Daggers in the dark — vanish and strike.",
    talent: "Shadow Step: instant gap-closer with massive burst.",
    icon: Swords,
    color: "#a855f7",
    glow: "rgba(168,85,247,0.4)",
  },
  {
    id: "gladiator",
    name: "Gladiator",
    role: "Tank / Physical",
    tagline: "Unbreakable front line of the Legion.",
    talent: "Rage Absorption: turns incoming damage into power.",
    icon: Sword,
    color: "#f87171",
    glow: "rgba(248,113,113,0.4)",
  },
  {
    id: "templar",
    name: "Templar",
    role: "Tank / Divine",
    tagline: "Holy guardian wielding sword and shield.",
    talent: "Divine Shield: grants invulnerability to allies.",
    icon: Shield,
    color: "#38bdf8",
    glow: "rgba(56,189,248,0.4)",
  },
  {
    id: "cleric",
    name: "Cleric",
    role: "Healer",
    tagline: "Wielder of holy healing and protective magic.",
    talent: "Healing Wind: mends the wounds of the whole party.",
    icon: Sparkles,
    color: "#fbbf24",
    glow: "rgba(251,191,36,0.4)",
  },
  {
    id: "chanter",
    name: "Chanter",
    role: "Support / Buffer",
    tagline: "Chants that empower allies and weaken enemies.",
    talent: "Mantra of Might: boosts party attack power.",
    icon: Flame,
    color: "#fb923c",
    glow: "rgba(251,146,60,0.4)",
  },
  {
    id: "sorcerer",
    name: "Sorcerer",
    role: "Magic DPS",
    tagline: "Commands the elements — fire, ice and lightning.",
    talent: "Meteor Strike: calls down destruction from the sky.",
    icon: Ghost,
    color: "#c084fc",
    glow: "rgba(192,132,252,0.4)",
  },
  {
    id: "spiritmaster",
    name: "Spiritmaster",
    role: "Summoner / DoT",
    tagline: "Summons spirits and curses foes over time.",
    talent: "Spirit Harmony: empowers your summoned familiar.",
    icon: Wand2,
    color: "#22d3ee",
    glow: "rgba(34,211,238,0.4)",
  },
  {
    id: "gunner",
    name: "Gunner",
    role: "Ranged DPS",
    tagline: "Twin pistols and heavy artillery from range.",
    talent: "Bullet Hail: unleashes a barrage of enchanted rounds.",
    icon: Flashlight,
    color: "#f472b6",
    glow: "rgba(244,114,182,0.4)",
  },
  {
    id: "songweaver",
    name: "Songweaver",
    role: "Magic DPS / Support",
    tagline: "Weaves the melody of battle into magic.",
    talent: "Melody of Wrath: songs that burn your enemies.",
    icon: Sparkles,
    color: "#e879f9",
    glow: "rgba(232,121,249,0.4)",
  },
];