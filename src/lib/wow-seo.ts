import type { WoWSpec, SpecData } from "./wowData";
import { CLASS_NAMES, getSpecsByRole, getSpecsByClass, getClassColor } from "./wowData";

const ROLE_LABELS: Record<string, string> = { tank: "Tank", healer: "Healer", dps: "DPS" };

function shortName(spec: WoWSpec): string {
  return spec.name.replace(/ .+/, "");
}

export function generateKeywords(spec: WoWSpec, data?: SpecData): string[] {
  const ar = spec.name;
  const cn = spec.classId.replace(/-/g, " ");
  const sn = shortName(spec);
  const rl = ROLE_LABELS[spec.role];
  const bis = data ? data.bis.slice(0, 5).map((i) => i.name).join(", ") : "";
  const topPlayers = data ? data.builds.slice(0, 3).map((b) => b.player).join(", ") : "";

  const kws: string[] = [
    // Base
    `${sn} talents`, `${spec.name} talents`, `${spec.name} build`,
    `${cn} ${rl} build`, `best ${sn} talents`, `${sn} mythic+`,
    `${sn} guide`, `${sn} bis gear`, `${sn} stat priority`,
    `${sn} enchants gems`, `${sn} rotation`, `${sn} wow`,
    // Role
    `best ${cn} ${rl}`, `${cn} ${rl} talents`, `${cn} ${rl} mythic+`,
    `${cn} ${rl} guide`, `top ${cn} ${rl} builds`,
    // Class
    `${cn} talents`, `${cn} mythic+`, `${cn} guide`,
    `wow ${cn} talents`, `${cn} class guide`,
    // Long-tail
    `how to play ${sn}`, `${sn} beginner guide`,
    `${sn} tips`, `${sn} best in slot`,
    `best in slot ${sn}`, `${sn} gear guide`,
    `${sn} dungeon build`, `${sn} raid build`,
    `${sn} midnight`, `${sn} season 2`, `${sn} s2`,
    `${sn} ptr build`, `${sn} ptr talents`,
    // Cross-links
    `wow ${sn} talents`, `world of warcraft ${sn} guide`,
    `${sn} icy veins`, `${sn} wowhead`,
    // Data-driven if available
    ...(bis ? [`${sn} ${bis.split(",")[0]?.trim()}`, `${sn} gear list`] : []),
    ...(topPlayers ? [`${sn} ${topPlayers.split(",")[0]?.trim()} build`] : []),

    // Regional
    `${sn} talents german`, `${sn} talents french`,
    `talenti ${sn}`, `talents ${cn}`,
  ].filter(Boolean);

  // Deduplicate while preserving order
  const seen = new Set<string>();
  return kws.filter((k) => {
    const lower = k.toLowerCase();
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  });
}

function generateSpecDescription(spec: WoWSpec, data?: SpecData, ptr?: boolean): string {
  const rl = ROLE_LABELS[spec.role];
  const cn = spec.classId.replace(/-/g, " ");
  const cnFull = CLASS_NAMES[spec.classId] || cn;
  const sn = shortName(spec);
  const bisList = data ? data.bis.slice(0, 5).map((i) => i.name).join(", ") : "";
  const stats = data ? data.statPriority.join(", ") : "";
  const topPlayer = data && data.builds.length > 0 ? data.builds[0].player : "";
  const season = ptr ? "Midnight PTR Season 2" : "Midnight Season 2";

  let desc = `Looking for the best ${spec.name} talents and build for Mythic+ and Raid in World of Warcraft ${season}? This ${sn} `;
  desc += `${rl.toLowerCase()} guide covers everything you need: `;
  if (stats) desc += `stat priority (${stats}), `;
  desc += `best-in-slot gear, enchants, gems, and talent tree builds `;
  if (topPlayer) desc += `from top ${cn} ${rl.toLowerCase()} player ${topPlayer} `;
  desc += `and other ${cnFull} ${rl.toLowerCase()} leaders. `;
  desc += `Whether you main ${sn} or are trying this ${cn} ${rl.toLowerCase()} specialization for the first time, our ${sn} `;
  desc += `Mythic+ build and Raid build will help you optimize your ${cn} ${rl.toLowerCase()} performance. `;
  if (data && data.bis.length > 0) {
    desc += `Top ${sn} gear includes ${bisList}. `;
  }
  if (ptr) {
    desc += `This is a PTR Season 2 preview — data is projected and may change before live patch. `;
  }
  desc += `Compare your ${sn} talents and ${rl.toLowerCase()} build against the competition and climb the leaderboard.`;
  return desc;
}

export function generateMetaDescription(spec: WoWSpec, data?: SpecData, ptr?: boolean): string {
  const rl = ROLE_LABELS[spec.role];
  const cn = spec.classId.replace(/-/g, " ");
  const sn = shortName(spec);
  const stats = data ? data.statPriority.slice(0, 3).join(", ") : "";
  const season = ptr ? "PTR Season 2" : "Season 2";
  const ptrTag = ptr ? " (projected)" : "";

  let desc = `${spec.name} ${rl.toLowerCase()} guide for Mythic+ and Raid — ${season}. ${sn} talents, best-in-slot gear`;
  if (stats) desc += `, stat priority (${stats})${ptrTag}`;
  desc += `, enchants, gems, and talent tree builds from top ${cn} players. Whether you're looking for the best ${sn} Mythic+ talents or a ${cn} ${rl.toLowerCase()} raid build, this guide has the latest ${season} data.`;
  return desc.slice(0, 320);
}

export function generateMetaTitle(spec: WoWSpec, ptr?: boolean): string {
  const rl = ROLE_LABELS[spec.role];
  const cn = spec.classId.replace(/-/g, " ");
  const ptrSuffix = ptr ? " (PTR S2 Preview)" : "";
  return `${spec.name} Talents & ${rl} Build — BIS Gear, Enchants${ptrSuffix} | UPLINK`;
}

export function generateFAQItems(spec: WoWSpec, data?: SpecData): Array<{ question: string; answer: string }> {
  const sn = shortName(spec);
  const cn = spec.classId.replace(/-/g, " ");
  const cnFull = CLASS_NAMES[spec.classId] || cn;
  const rl = ROLE_LABELS[spec.role];
  const rlLower = rl.toLowerCase();
  const stats = data ? data.statPriority.join(", ") : "";
  const bisList = data ? data.bis.slice(0, 5).map((i) => i.name).join(", ") : "";
  const gems = data ? data.gems.join(", ") : "";
  const enchants = data ? data.enchants.slice(0, 3).map((e) => `${e.name} (${e.slot})`).join(", ") : "";
  const topPlayer = data && data.builds.length > 0 ? data.builds[0].player : "";
  const talentString = data && data.builds.length > 0 ? data.builds[0].talentString : "";

  return [
    {
      question: `What are the best talents for ${spec.name} in Mythic+?`,
      answer: `The best Mythic+ talents for ${spec.name} in Midnight Season 2 focus on maximizing ${sn}'s strengths in dungeon content. ` +
        (talentString ? `Top ${cnFull} ${rlLower} players like ${topPlayer} use the talent string: ${talentString}. ` : "") +
        `The ${sn} talent tree prioritizes talents that improve burst damage, survivability, and utility for ${rlLower} in Mythic+ dungeons. Check the Mythic+ tab for the full talent tree visualization and node-by-node breakdown.`,
    },
    {
      question: `What is the ${spec.name} stat priority for ${rlLower === "dps" ? "damage" : rlLower} in Midnight Season 2?`,
      answer: `The ${spec.name} stat priority for ${rlLower} is: ${stats || "varies by build and content type"}. ` +
        `For ${sn}, the primary stat is ${sn === "Guardian" || sn === "Vengeance" || sn === "Protection" || sn === "Brewmaster" || sn === "Blood" ? "Agility" : sn === "Holy" || sn === "Discipline" || sn === "Restoration" || sn === "Mistweaver" || sn === "Preservation" ? "Intellect" : sn === "Vengeance" ? "Agility" : "Intellect"} depending on the ${cnFull} ${rlLower} specialization. ` +
        `Secondary stat weights change based on your current gear and talent build — sim your character for exact stat weights.`,
    },
    {
      question: `What is the best-in-slot gear for ${spec.name}?`,
      answer: `Best-in-slot gear for ${spec.name} in Midnight Season 2 includes: ${bisList || "varies per patch and dungeon pool"}. ` +
        `The ${sn} BIS list is compiled from equipment used by top ${cnFull} ${rlLower} players on the Mythic+ leaderboard. Each gear slot shows the most popular item with usage percentage, plus an alternative option. ` +
        `Tier set bonuses are prioritized — check the BIS section for which ${cn} tier pieces to equip.`,
    },
    {
      question: `What enchants and gems should ${spec.name} use?`,
      answer: `For ${spec.name} in Midnight Season 2, recommended enchants are: ${enchants || "check the enchants section on this page"}. ` +
        `Recommended gems: ${gems || "check the gems section on this page"}. ` +
        `Enchant and gem choices depend on your ${sn} stat priority — socket with the stats that sim highest for your ${cn} ${rlLower} build. Weapon enchants and chest enchants are especially impactful for ${sn} ${rlLower} performance.`,
    },
    {
      question: `How do I play ${spec.name} effectively?`,
      answer: `To play ${spec.name} effectively in Mythic+ and Raid, focus on these key aspects: ` +
        `1) Use the correct ${sn} talent build for the content you're running. ` +
        `2) Follow the stat priority: ${stats || "optimize for your build"}. ` +
        `3) Equip the recommended BIS gear and enchant everything. ` +
        `4) Practice your ${sn} rotation on a training dummy or in Mythic+ runs. ` +
        `5) Study top ${cnFull} ${rlLower} players like ${topPlayer || "leaderboard players"} for cooldown usage and positioning tips.`,
    },
    {
      question: `What is the best race for ${spec.name}?`,
      answer: `The best race for ${spec.name} depends on content type and personal preference. For min-maxing in Mythic+, racial abilities that provide offensive cooldowns or movement speed are preferred. ` +
        `For ${cnFull}, popular race choices include those that benefit ${rlLower} performance. Check the leaderboard to see which races top ${sn} players are using in the current season.`,
    },
    {
      question: `Is ${spec.name} good in Mythic+ for Midnight Season 2?`,
      answer: `${spec.name} is ${getMetaRank(spec.role)} in the current ${rlLower} meta for Mythic+ in Midnight Season 2. ` +
        `${sn}'s ${rlLower} performance depends on dungeon pool, seasonal affixes, and tier set bonuses. ` +
        `Check the Meta Classes page for the latest tier list ranking all ${rlLower} specs and see where ${spec.name} sits in the current patch.`,
    },
    {
      question: `What consumables should ${spec.name} use for Mythic+?`,
      answer: `For ${spec.name} Mythic+ in Midnight Season 2, use the best ${rlLower} potions, flasks, and food appropriate for your level. ` +
        `Always use a flask matching your ${sn} stat priority, the best weapon oil/temp enchant available, and stat-specific food. ` +
        `Combat potions should be used on cooldown during key moments. Check the enchants and gems section for specific consumable recommendations.`,
    },
    {
      question: `What trinkets are best for ${spec.name}?`,
      answer: `Best trinkets for ${spec.name} depend on your ${cn} ${rlLower}'s stat priority and content type. ` +
        `For Mythic+, on-use and proc trinkets that complement your ${sn} burst windows are preferred. ` +
        `${bisList.includes("Trinket") || data?.bis.some(b => b.slot?.toLowerCase().includes("trinket")) ? "The BIS gear section includes trinket recommendations for " + sn : "Check the BIS section for trinket recommendations tailored to " + sn} ${rlLower}.`,
    },
    {
      question: `${spec.name} vs other ${cnFull} specs — which should I play?`,
      answer: `Each ${cnFull} specialization offers a different playstyle. ${spec.name} is a ${rlLower} specialization. ` +
        getSpecsByClass(spec.classId).filter((s) => s.id !== spec.id).map((s) => `The ${s.name} specialization is a ${ROLE_LABELS[s.role]?.toLowerCase()} alternative within the ${cnFull} class. `).join("") +
        `Choose ${sn} if you enjoy the ${rlLower} playstyle. Check each spec's page for detailed talent builds and BIS gear.`,
    },
  ];
}

function getMetaRank(role: string): string {
  if (role === "tank") return "a solid tank choice";
  if (role === "healer") return "a viable healer option";
  return "a competitive DPS specialization";
}

export function generateIntroContent(spec: WoWSpec, data?: SpecData, ptr?: boolean): { heading: string; body: string; bullets?: string[] } {
  const rl = ROLE_LABELS[spec.role];
  const rlLower = rl.toLowerCase();
  const cn = spec.classId.replace(/-/g, " ");
  const sn = shortName(spec);
  const bisList = data ? data.bis.slice(0, 4).map((i) => i.name).join(", ") : "";
  const stats = data ? data.statPriority.join(", ") : "";
  const topPlayer = data && data.builds.length > 0 ? data.builds[0].player : "";
  const season = ptr ? "Midnight PTR Season 2" : "Midnight Season 2";

  const body = `Welcome to the complete ${sn} ${rlLower} guide for World of Warcraft ${season}. ` +
    `This page covers the best ${spec.name} talents for both Mythic+ and Raid, based on data from top ${cn} ${rlLower} players on the leaderboard. ` +
    `Whether you're optimizing your ${sn} ${rlLower} build for high Mythic+ keys or looking for a ${cn} ${rlLower} raid setup, ` +
    `you'll find the latest ${sn} gear recommendations, stat priority, enchants, gems, and talent tree visualizations here.` +
    (data ? ` ${sn} stat priority is ${stats}. ` : " ") +
    (data ? `Key BIS items include ${bisList}. ` : " ") +
    (topPlayer ? `Learn from top ${cn} ${rlLower} player ${topPlayer} and others. ` : " ") +
    (ptr ? `Note: PTR Season 2 data is projected and subject to change before the live patch on December 16, 2026.` : "");

  return {
    heading: `${spec.name} ${rl} Guide — ${season}`,
    body,
    bullets: data ? [
      `Stat Priority: ${stats || "varies by build"}`,
      `Role: ${rl}`,
      `Class: ${cn}`,
      `Season: ${season}`,
    ] : undefined,
  };
}

export function getRelatedSpecs(spec: WoWSpec): { sameRole: WoWSpec[]; sameClass: WoWSpec[] } {
  return {
    sameRole: getSpecsByRole(spec.role).filter((s) => s.id !== spec.id),
    sameClass: getSpecsByClass(spec.classId).filter((s) => s.id !== spec.id),
  };
}
