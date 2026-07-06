import type { AggregatedSpecData, AggregatedCharacter } from "./types";
import { fetchCharacterProfile } from "./character-profile";

interface TopPlayer {
  name: string;
  realm: string;
  region: string;
  specId: string;
  classId: string;
  score: number;
  race?: string;
}

function pct(part: number, total: number): string {
  if (total === 0) return "0%";
  return Math.round((part / total) * 100) + "%";
}

export async function aggregateBySpec(
  playersBySpec: Map<string, TopPlayer[]>
): Promise<Record<string, AggregatedSpecData>> {
  const result: Record<string, AggregatedSpecData> = {};

  const allFetches: { specId: string; player: TopPlayer }[] = [];
  for (const [specId, players] of playersBySpec) {
    for (const player of players) {
      allFetches.push({ specId, player });
    }
  }

  // Fetch all profiles in parallel
  const profileResults = await Promise.allSettled(
    allFetches.map(({ player }) =>
      fetchCharacterProfile(player.name, player.realm, player.region)
    )
  );

  // Group profiles by spec
  const profilesBySpec = new Map<string, { player: TopPlayer; talents: { nodeId: number; name: string; selected: boolean; spellId?: number; row?: number; col?: number; treeName?: string }[]; gear: { slot: string; name: string; itemId: number; enchant?: string }[]; gems: string[] }[]>();

  let idx = 0;
  for (const { specId, player } of allFetches) {
    const profResult = profileResults[idx++];
    if (profResult.status !== "fulfilled" || !profResult.value) continue;
    if (!profilesBySpec.has(specId)) profilesBySpec.set(specId, []);
    profilesBySpec.get(specId)!.push({ player, ...profResult.value });
  }

  // Aggregate each spec
  for (const [specId, profiles] of profilesBySpec) {
    const total = profiles.length;
    if (total === 0) continue;

    // Aggregate gear by slot — track name → { count, itemId }
    const gearBySlot = new Map<string, Map<string, { count: number; itemId: number }>>();
    for (const p of profiles) {
      for (const item of p.gear) {
        if (!gearBySlot.has(item.slot)) gearBySlot.set(item.slot, new Map());
        const slotMap = gearBySlot.get(item.slot)!;
        const existing = slotMap.get(item.name) || { count: 0, itemId: item.itemId };
        slotMap.set(item.name, { count: existing.count + 1, itemId: existing.itemId || item.itemId });
      }
    }

    const bis = Array.from(gearBySlot.entries())
      .filter(([slot]) => !["Tabard", "Shirt"].includes(slot))
      .map(([slot, items]) => ({
        slot,
        names: Array.from(items.entries())
          .sort((a, b) => b[1].count - a[1].count)
          .reverse()
          .map(([name, data]) => ({ name, count: data.count, pct: pct(data.count, total), itemId: data.itemId })),
      }))
      .sort((a, b) => {
        const order = ["Head", "Neck", "Shoulders", "Back", "Chest", "Wrist", "Hands", "Waist", "Legs", "Feet", "Ring 1", "Ring 2", "Trinket 1", "Trinket 2", "Weapon", "Off-Hand"];
        return order.indexOf(a.slot) - order.indexOf(b.slot);
      });

    // Aggregate gems
    const gemCounts = new Map<string, number>();
    for (const p of profiles) {
      for (const gem of p.gems) {
        gemCounts.set(gem, (gemCounts.get(gem) || 0) + 1);
      }
    }
    const gems = Array.from(gemCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count, pct: pct(count, total) }));

    // Aggregate enchants by slot
    const enchantsBySlot = new Map<string, Map<string, number>>();
    for (const p of profiles) {
      for (const item of p.gear) {
        if (!item.enchant) continue;
        if (!enchantsBySlot.has(item.slot)) enchantsBySlot.set(item.slot, new Map());
        const slotMap = enchantsBySlot.get(item.slot)!;
        slotMap.set(item.enchant, (slotMap.get(item.enchant) || 0) + 1);
      }
    }
    const enchants = Array.from(enchantsBySlot.entries()).map(([slot, items]) => ({
      slot,
      names: Array.from(items.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count, pct: pct(count, total) })),
    }));

    // Aggregate stat priority from first 5 primaries if available
    const statPriority = deriveStatPriority(profiles.map((p) => ({
      name: p.player.name,
      score: p.player.score,
    })));

    // Top players list
    const topPlayers: AggregatedCharacter[] = profiles.map((p) => ({
      name: p.player.name,
      realm: p.player.realm,
      region: p.player.region,
      specId,
      classId: p.player.classId,
      score: p.player.score,
      race: p.player.race,
      gear: p.gear.map((g) => ({ slot: g.slot, name: g.name, itemId: g.itemId })),
      gems: p.gems,
      enchants: p.gear.filter((g) => g.enchant).map((g) => ({ slot: g.slot, name: g.enchant! })),
      statPriority,
    }));

    result[specId] = {
      totalPlayers: total,
      bis,
      enchants,
      gems,
      statPriority,
      topPlayers,
      lastUpdated: Date.now(),
    };
  }

  return result;
}

function deriveStatPriority(characters: { name: string; score: number }[]): string[] {
  // If we can't get actual stats from Blizzard API (separate call needed),
  // return a reasonable default. The stats endpoint is optional.
  return ["Intellect", "Haste", "Mastery", "Critical Strike", "Versatility"];
}
