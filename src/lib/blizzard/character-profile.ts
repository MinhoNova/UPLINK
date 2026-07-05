import { getBlizzardToken } from "./auth";

const REGION_HOSTS: Record<string, string> = {
  US: "https://us.api.blizzard.com",
  EU: "https://eu.api.blizzard.com",
};

function sanitizeRealm(realm: string): string {
  return realm.toLowerCase().replace(/\s+/g, "-").replace(/['']/g, "");
}

function sanitizeName(name: string): string {
  return name.toLowerCase().replace(/'/g, "");
}

const itemNameCache = new Map<number, string>();

async function fetchItemName(itemId: number): Promise<string | null> {
  if (itemNameCache.has(itemId)) return itemNameCache.get(itemId)!;
  const token = await getBlizzardToken();
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
  region: string
): Promise<CharacterProfile | null> {
  const token = await getBlizzardToken();
  if (!token) return null;

  const host = REGION_HOSTS[region.toUpperCase()] || REGION_HOSTS.US;
  const realmSlug = sanitizeRealm(realm);
  const nameLower = sanitizeName(name);
  const ns = `profile-${region.toLowerCase()}`;

  try {
    const [equipRes, talentsRes] = await Promise.all([
      fetch(
        `${host}/profile/wow/character/${realmSlug}/${nameLower}/equipment?namespace=${ns}&locale=en_US`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(8000) }
      ),
      fetch(
        `${host}/profile/wow/character/${realmSlug}/${nameLower}/talents?namespace=${ns}&locale=en_US`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(8000) }
      ),
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
        await Promise.all(freshIds.map((id: number) => fetchItemName(id)));
      }

      for (const item of items) {
        const slot = GEAR_SLOT_MAP[item.slot?.type?.toUpperCase()] || item.slot?.type || "Unknown";
        const itemName = item.item?.name || itemNameCache.get(item.item?.id) || `${slot} Item`;
        profile.gear.push({
          slot,
          name: itemName,
          itemId: item.item?.id || 0,
          enchant: item.enchant?.display_string || undefined,
        });

        // Extract gems
        for (const gem of item.gems || []) {
          if (gem.name && !profile.gems.includes(gem.name)) {
            profile.gems.push(gem.name);
          }
        }
      }
    }

    // Parse talents
    if (talentsRes.ok) {
      const talentsData = await talentsRes.json();
      const seenNodeIds = new Set<number>();

      const extractNodes = (treeObj: any, treeName: string) => {
        if (!treeObj) return;
        const nodes = treeObj.nodes || [];
        const selectedIds = new Set(treeObj.selected_node_ids || []);
        for (const node of nodes) {
          const nodeId = node.node_id || node.id || 0;
          if (!nodeId || seenNodeIds.has(nodeId)) continue;
          seenNodeIds.add(nodeId);
          const rank = node.rank || (selectedIds.has(nodeId) ? 1 : 0);
          profile.talents.push({
            nodeId,
            name: node.talent?.name || node.name || "Unknown",
            spellId: node.talent?.id,
            selected: rank > 0,
            row: node.display_row || node.position?.row,
            col: node.display_col || node.position?.col,
            treeName,
          });
        }
      };

      if (talentsData.talent_tree) extractNodes(talentsData.talent_tree, talentsData.talent_tree.name || "Class Talents");
      if (talentsData.hero_talents) {
        for (const ht of (Array.isArray(talentsData.hero_talents) ? talentsData.hero_talents : [talentsData.hero_talents])) {
          extractNodes(ht, ht.name || "Hero Talents");
        }
      }

      // Assign computed row/col for nodes missing position data
      const talentsByTree = new Map<string, typeof profile.talents>();
      for (const t of profile.talents) {
        const key = t.treeName || "Class Talents";
        if (!talentsByTree.has(key)) talentsByTree.set(key, []);
        talentsByTree.get(key)!.push(t);
      }
      for (const [, talents] of talentsByTree) {
        let curRow = 1, curCol = 1;
        for (const t of talents) {
          if (t.row === undefined || t.col === undefined) {
            t.row = curRow;
            t.col = curCol;
            curCol = curCol === 1 ? 2 : 1;
            if (curCol === 1) curRow++;
          }
        }
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
