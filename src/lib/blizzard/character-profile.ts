import { getBlizzardToken } from "./auth";

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
  env?: { BATTLENET_CLIENT_ID?: string; BATTLENET_CLIENT_SECRET?: string }
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

      const allTalentEntries: { id: number; rank: number; name: string; spellId?: number; iconName?: string; treeName: string; treeKind: string }[] = [];

      function getName(t: any, fallbackId: number): string {
        return t.tooltip?.talent?.name || t.tooltip?.spell_tooltip?.spell?.name || `Talent ${fallbackId}`;
      }

      function getSpellId(t: any): number | undefined {
        return t.tooltip?.talent?.id || t.tooltip?.spell_tooltip?.spell?.id || undefined;
      }

      function getIconName(t: any): string | undefined {
        return t.tooltip?.talent?.icon || undefined;
      }

      const classTreeName = loadout.selected_class_talent_tree?.name || "Class Talents";
      for (const t of loadout.selected_class_talents || []) {
        allTalentEntries.push({ id: t.id, rank: t.rank || 1, name: getName(t, t.id), spellId: getSpellId(t), iconName: getIconName(t), treeName: classTreeName, treeKind: "class" });
      }

      const specTreeName = loadout.selected_spec_talent_tree?.name || (activeSpec.specialization?.name || "Spec Talents");
      for (const t of loadout.selected_spec_talents || []) {
        allTalentEntries.push({ id: t.id, rank: t.rank || 1, name: getName(t, t.id), spellId: getSpellId(t), iconName: getIconName(t), treeName: specTreeName, treeKind: "spec" });
      }

      const heroTreeName = loadout.selected_hero_talent_tree?.name || "Hero Talents";
      for (const t of loadout.selected_hero_talents || []) {
        allTalentEntries.push({ id: t.id, rank: t.rank || 1, name: getName(t, t.id), spellId: getSpellId(t), iconName: getIconName(t), treeName: heroTreeName, treeKind: "hero" });
      }

      // Group by tree for row/col assignment
      const byTree = new Map<string, typeof allTalentEntries>();
      for (const entry of allTalentEntries) {
        if (!byTree.has(entry.treeName)) byTree.set(entry.treeName, []);
        byTree.get(entry.treeName)!.push(entry);
      }

      for (const [treeName, entries] of byTree) {
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
          });
          curCol = curCol === 1 ? 2 : 1;
          if (curCol === 1) curRow++;
        }
      }
    }

    // Parse M+ rating
    if (mythicRes?.ok) {
      const mythicData = await mythicRes.json();
      const seasons = mythicData.seasons || mythicData.mything_keystone_seasons || [];
      const currentSeason = seasons[0];
      if (currentSeason?.best_runs || currentSeason?.mythic_rating) {
        profile.mythicPlusRating = currentSeason.mythic_rating?.rating || 0;
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
