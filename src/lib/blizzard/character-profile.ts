import { getBlizzardToken } from "./auth";
import { guessIconName } from "@/lib/wow/spellIcons";

const REGION_HOSTS: Record<string, string> = {
  US: "https://us.api.blizzard.com",
  EU: "https://eu.api.blizzard.com",
  KR: "https://kr.api.blizzard.com",
  TW: "https://tw.api.blizzard.com",
};

function sanitizeRealm(realm: string): string {
  return realm.toLowerCase().replace(/\s+/g, "-").replace(/['']/g, "");
}

function sanitizeName(name: string): string {
  return name.toLowerCase().replace(/'/g, "");
}

const itemNameCache = new Map<number, string>();
const treeNodeCache = new Map<number, Map<number, { spellId?: number; icon?: string; row?: number; col?: number }>>();

async function fetchItemName(itemId: number, env?: { BATTLENET_CLIENT_ID?: string; BATTLENET_CLIENT_SECRET?: string }): Promise<string | null> {
  if (itemNameCache.has(itemId)) return itemNameCache.get(itemId)!;
  const token = await getBlizzardToken(env);
  if (!token) return null;
  try {
    const res = await fetch(
      `https://us.api.blizzard.com/data/wow/item/${itemId}?namespace=static-us&locale=en_US`,
      { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const name: string | undefined = data.name;
    if (name) itemNameCache.set(itemId, name);
    return name || null;
  } catch {
    return null;
  }
}

export interface CharacterProfile {
  talents: {
    nodeId: number;
    name: string;
    selected: boolean;
    spellId?: number;
    iconName?: string;
    row?: number;
    col?: number;
    treeName?: string;
    treeKind?: string;
  }[];
  gear: {
    slot: string;
    name: string;
    itemId: number;
    enchant?: string;
  }[];
  gems: string[];
  stats: {
    strength?: number;
    agility?: number;
    intellect?: number;
    haste?: number;
    criticalStrike?: number;
    mastery?: number;
    versatility?: number;
  };
  mythicPlusRating?: number;
}

const GEAR_SLOT_MAP: Record<string, string> = {
  HEAD: "Head",
  NECK: "Neck",
  SHOULDER: "Shoulders",
  BACK: "Back",
  CHEST: "Chest",
  WRIST: "Wrist",
  HANDS: "Hands",
  WAIST: "Waist",
  LEGS: "Legs",
  FEET: "Feet",
  FINGER_1: "Ring 1",
  FINGER_2: "Ring 2",
  TRINKET_1: "Trinket 1",
  TRINKET_2: "Trinket 2",
  MAIN_HAND: "Weapon",
  OFF_HAND: "Off-Hand",
  TABARD: "Tabard",
  SHIRT: "Shirt",
};

export async function fetchCharacterProfile(
  name: string,
  realm: string,
  region: string,
  env?: { BATTLENET_CLIENT_ID?: string; BATTLENET_CLIENT_SECRET?: string },
  classId?: string
): Promise<CharacterProfile | null> {
  const token = await getBlizzardToken(env);
  if (!token) return null;

  const host = REGION_HOSTS[region.toUpperCase()] || REGION_HOSTS.US;
  const realmSlug = sanitizeRealm(realm);
  const nameLower = sanitizeName(name);
  const ns = `profile-${region.toLowerCase()}`;

  try {
    const [equipRes, specRes, mythicRes] = await Promise.all([
      fetch(
        `${host}/profile/wow/character/${realmSlug}/${nameLower}/equipment?namespace=${ns}&locale=en_US`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(8000) }
      ).catch(() => new Response(null, { status: 404 })),
      fetch(
        `${host}/profile/wow/character/${realmSlug}/${nameLower}/specializations?namespace=${ns}&locale=en_US`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(8000) }
      ).catch(() => new Response(null, { status: 404 })),
      fetch(
        `${host}/profile/wow/character/${realmSlug}/${nameLower}/mythic-keystone-profile?namespace=${ns}&locale=en_US`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(8000) }
      ).catch(() => new Response(null, { status: 404 })),
    ]);

    const profile: CharacterProfile = { talents: [], gear: [], gems: [], stats: {} };

    // Parse equipment
    if (equipRes.ok) {
      const equipData = await equipRes.json();
      const items = equipData.equipped_items || [];

      // Batch resolve item names for items missing names
      const unknownItems = items.filter((i: any) => !i.item?.name || i.item?.name === "Unknown");
      const unknownIds = [...new Set(unknownItems.map((i: any) => i.item?.id).filter(Boolean))];
      const freshIds = unknownIds.filter((id: number) => !itemNameCache.has(id));
      if (freshIds.length > 0) {
        await Promise.all(freshIds.map((id: number) => fetchItemName(id, env)));
      }

      for (const item of items) {
        const slot = GEAR_SLOT_MAP[item.slot?.type?.toUpperCase()] || item.slot?.type || "Unknown";
        const itemName = item.item?.name || itemNameCache.get(item.item?.id) || `${slot} Item`;
        profile.gear.push({
          slot,
          name: itemName,
          itemId: item.item?.id || 0,
          enchant: item.enchantments?.[0]?.display_string || item.enchant?.display_string || undefined,
        });

        // Extract gems
        for (const gem of item.gems || []) {
          if (gem.name && !profile.gems.includes(gem.name)) {
            profile.gems.push(gem.name);
          }
        }
      }
    }

    // Parse talents from /specializations endpoint (Midnight+)
    if (specRes.ok) {
      const specData = await specRes.json();
      const specializations = specData.specializations || [];
      const activeSpecName = specData.active_specialization?.name || "";

      // Find active spec or first one
      let activeSpec = specializations.find((s: any) => s.specialization?.name === activeSpecName);
      if (!activeSpec) activeSpec = specializations[0];
      if (!activeSpec) return profile;

      // Get the active loadout (first active, or first one)
      const loadout = activeSpec.loadouts?.find((l: any) => l.is_active) || activeSpec.loadouts?.[0];
      if (!loadout) return profile;

      const allTalentEntries: { id: number; rank: number; name: string; spellId?: number; iconName?: string; row?: number; col?: number; treeName: string; treeKind: string }[] = [];

      async function fetchTreeNodeMap(treeId: number): Promise<Map<number, { spellId?: number; icon?: string; row?: number; col?: number }>> {
        if (treeNodeCache.has(treeId)) return treeNodeCache.get(treeId)!;
        const nodeMap = new Map<number, { spellId?: number; icon?: string; row?: number; col?: number }>();
        try {
          const res = await fetch(`https://us.api.blizzard.com/data/wow/talent-tree/${treeId}?namespace=static-us&locale=en_US`, {
            headers: { Authorization: `Bearer ${token}` },
            next: { revalidate: 86400 },
          });
          if (res.ok) {
            const treeData: any = await res.json();
            const rawNodes: any[] = treeData.nodes || [];
            for (const n of rawNodes) {
              const talentData = n.tooltip?.talent || n.tooltip?.spell_tooltip?.spell || n.talent_node_key?.talent || n.talent;
              const spellId = talentData?.spell_id || talentData?.id;
              const iconName = talentData?.icon || "";
              if (spellId || iconName || n.display_row != null || n.display_col != null) {
                nodeMap.set(n.id, {
                  spellId,
                  icon: iconName,
                  row: n.display_row ?? n.row,
                  col: n.display_col ?? n.col,
                });
              }
            }
          }
        } catch {
          // ignore
        }
        treeNodeCache.set(treeId, nodeMap);
        return nodeMap;
      }

      // Pre-fetch tree definitions for position/icon resolution
      const treeDefs: { id: number; name: string; kind: string }[] = [];
      const classTree = loadout.selected_class_talent_tree;
      const specTree = loadout.selected_spec_talent_tree;
      const heroTree = loadout.selected_hero_talent_tree;
      if (classTree?.id) treeDefs.push({ id: classTree.id, name: classTree.name || "Class Talents", kind: "class" });
      if (specTree?.id) treeDefs.push({ id: specTree.id, name: specTree.name || (activeSpec.specialization?.name || "Spec Talents"), kind: "spec" });
      if (heroTree?.id) treeDefs.push({ id: heroTree.id, name: heroTree.name || "Hero Talents", kind: "hero" });

      const treeNodeMaps = new Map<string, Map<number, { spellId?: number; icon?: string; row?: number; col?: number }>>();
      await Promise.all(treeDefs.map(async (td) => {
        const nodeMap = await fetchTreeNodeMap(td.id, td.kind);
        if (nodeMap.size > 0) treeNodeMaps.set(td.kind, nodeMap);
      }));

      function getTalentInfo(t: any): { name?: string; id?: number; icon?: string } | null {
        const direct = t.tooltip?.talent || t.tooltip?.spell_tooltip?.spell;
        if (direct) return { name: direct.name, id: direct.id, icon: direct.icon };
        if (t.choices && t.choices.length > 0) {
          const choice = t.choices[t.selected_choice_index ?? 0] ?? t.choices[0];
          const choiceInfo = choice.tooltip?.talent || choice.tooltip?.spell_tooltip?.spell;
          if (choiceInfo) return { name: choiceInfo.name, id: choiceInfo.id, icon: choiceInfo.icon };
          return { name: choice.name, id: choice.id };
        }
        return null;
      }

      function resolveIcon(spellName: string, spellId?: number): string | undefined {
        const guessed = guessIconName(spellName, classId, spellId);
        return guessed || undefined;
      }

      async function processTalentList(talents: any[], treeName: string, treeKind: string) {
        const nodeMap = treeNodeMaps.get(treeKind);
        for (const t of talents) {
          let info = getTalentInfo(t);
          const name = info?.name;

          // Resolve from tree definition if available (preferred: has spellId + icon + position)
          const treeNode = nodeMap?.get(t.id);
          if (treeNode) {
            const spellId = treeNode.spellId || info?.id;
            const iconName = treeNode.icon || info?.icon || (name ? resolveIcon(name, spellId) : undefined);
            allTalentEntries.push({
              id: t.id, rank: t.rank || 1,
              name: name || `Talent ${t.id}`,
              spellId, iconName,
              row: treeNode.row, col: treeNode.col,
              treeName, treeKind,
            });
          } else {
            // No tree definition → use sequential fallback
            const iconName = info?.icon || (info?.name ? resolveIcon(info.name, info?.id) : undefined);
            allTalentEntries.push({
              id: t.id, rank: t.rank || 1,
              name: info?.name || `Talent ${t.id}`,
              spellId: info?.id, iconName,
              row: undefined, col: undefined,
              treeName, treeKind,
            });
          }
        }
      }

      const classTreeName = classTree?.name || "Class Talents";
      await processTalentList(loadout.selected_class_talents || [], classTreeName, "class");

      const specTreeName = specTree?.name || (activeSpec.specialization?.name || "Spec Talents");
      await processTalentList(loadout.selected_spec_talents || [], specTreeName, "spec");

      const heroTreeName = heroTree?.name || "Hero Talents";
      await processTalentList(loadout.selected_hero_talents || [], heroTreeName, "hero");

      const byTree = new Map<string, typeof allTalentEntries>();
      for (const entry of allTalentEntries) {
        if (!byTree.has(entry.treeName)) byTree.set(entry.treeName, []);
        byTree.get(entry.treeName)!.push(entry);
      }

      for (const [treeName, entries] of byTree) {
        const hasPositions = entries.some(e => e.row != null && e.col != null);

        if (hasPositions) {
          for (const entry of entries) {
            profile.talents.push({
              nodeId: entry.id,
              name: entry.name,
              spellId: entry.spellId || entry.id,
              iconName: entry.iconName,
              selected: entry.rank > 0,
              row: entry.row!,
              col: entry.col!,
              treeName,
              treeKind: entry.treeKind,
            });
          }
        } else {
          let curRow = 1, curCol = 1;
          for (const entry of entries) {
            profile.talents.push({
              nodeId: entry.id,
              name: entry.name,
              spellId: entry.spellId || entry.id,
              iconName: entry.iconName,
              selected: entry.rank > 0,
              row: curRow,
              col: curCol,
              treeName,
              treeKind: entry.treeKind,
            });
            curCol = curCol === 1 ? 2 : 1;
            if (curCol === 1) curRow++;
          }
        }
      }
    }

    // Parse M+ rating
    if (mythicRes?.ok) {
      const mythicData = await mythicRes.json();
      // Try seasons array (current season first), fall back to top-level current_mythic_rating
      const seasons = mythicData.seasons || mythicData.mything_keystone_seasons || [];
      const currentSeason = seasons[0];
      if (currentSeason?.best_runs || currentSeason?.mythic_rating) {
        const rating = currentSeason.mythic_rating?.rating;
        if (rating != null && rating > 0) profile.mythicPlusRating = Math.round(rating);
      }
      if (!profile.mythicPlusRating && mythicData.current_mythic_rating?.rating) {
        profile.mythicPlusRating = Math.round(mythicData.current_mythic_rating.rating);
      }
    }

    return profile;
  } catch {
    return null;
  }
}

export async function fetchCharacterStats(
  name: string,
  realm: string,
  region: string
): Promise<CharacterProfile["stats"] | null> {
  const token = await getBlizzardToken();
  if (!token) return null;

  const host = REGION_HOSTS[region.toUpperCase()] || REGION_HOSTS.US;
  const realmSlug = sanitizeRealm(realm);
  const nameLower = sanitizeName(name);
  const ns = `profile-${region.toLowerCase()}`;

  try {
    const res = await fetch(
      `${host}/profile/wow/character/${realmSlug}/${nameLower}/statistics?namespace=${ns}&locale=en_US`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;

    const data = await res.json();
    const baseStats = data.base || data;
    return {
      strength: baseStats.strength,
      agility: baseStats.agility,
      intellect: baseStats.intellect,
      haste: baseStats.haste,
      criticalStrike: data.critical_strike || baseStats.critical_strike,
      mastery: data.mastery || baseStats.mastery,
      versatility: data.versatility || baseStats.versatility,
    };
  } catch {
    return null;
  }
}
