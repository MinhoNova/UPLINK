import type { AggregatedSpecData, AggregatedCharacter, PlayerListing } from "./types";
import { fetchCharacterProfile, fetchCharacterStats } from "./character-profile";

interface TopPlayer {
  name: string;
  realm: string;
  region: string;
  specId: string;
  classId: string;
  score: number;
  race?: string;
  itemLevel?: number;
}

function pct(part: number, total: number): string {
  if (total === 0) return "0%";
  return Math.round((part / total) * 100) + "%";
}

export async function aggregateBySpec(
  playersBySpec: Map<string, TopPlayer[]>,
  profileLimit = 10,
  env?: { BATTLENET_CLIENT_ID?: string; BATTLENET_CLIENT_SECRET?: string }
): Promise<Record<string, AggregatedSpecData>> {
  const result: Record<string, AggregatedSpecData> = {};

  // Only fetch Blizzard profiles for the top N per spec (to avoid overload)
  const allFetches: { specId: string; player: TopPlayer }[] = [];
  for (const [specId, players] of playersBySpec) {
    const limited = players.slice(0, profileLimit);
    for (const player of limited) {
      allFetches.push({ specId, player });
    }
  }

  // Fetch profiles in batches of 20 to avoid overwhelming Blizzard API
  const BATCH_SIZE = 20;
  const profileResults: PromiseSettledResult<any>[] = [];
  for (let i = 0; i < allFetches.length; i += BATCH_SIZE) {
    const batch = allFetches.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async ({ player }) => {
        const profile = await fetchCharacterProfile(player.name, player.realm, player.region, env, player.classId);
        if (profile) return profile;
        // Retry once on failure
        return fetchCharacterProfile(player.name, player.realm, player.region, env, player.classId);
      })
    );
    profileResults.push(...results);
  }

  // Also fetch stats for successful profiles (batch)
  const statsResults: (PromiseSettledResult<any> | null)[] = allFetches.map(() => null);
  const statsBatch = allFetches.filter((_, i) => profileResults[i]?.status === "fulfilled" && profileResults[i]?.value);
  if (statsBatch.length > 0) {
    for (let i = 0; i < statsBatch.length; i += BATCH_SIZE) {
      const batch = statsBatch.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(({ player }) => fetchCharacterStats(player.name, player.realm, player.region))
      );
      for (let j = 0; j < results.length; j++) {
        const origIdx = allFetches.indexOf(statsBatch[i + j]);
        if (origIdx >= 0) statsResults[origIdx] = results[j];
      }
    }
  }

  const profilesBySpec = new Map<string, { player: TopPlayer; mythicPlusRating?: number; talentLoadout?: string; talents: { nodeId: number; name: string; selected: boolean; spellId?: number; iconName?: string; row?: number; col?: number; treeName?: string; treeKind?: string }[]; gear: { slot: string; name: string; itemId: number; enchant?: string; itemLevel?: number }[]; gems: string[]; stats: {} }[]>();

  let idx = 0;
  for (const { specId, player } of allFetches) {
    const profResult = profileResults[idx];
    const statsResult = statsResults[idx];
    idx++;
    if (profResult.status !== "fulfilled" || !profResult.value) continue;
    const profileData = profResult.value;
    if (statsResult?.status === "fulfilled" && statsResult.value) {
      profileData.stats = statsResult.value;
    }
    if (!profilesBySpec.has(specId)) profilesBySpec.set(specId, []);
    profilesBySpec.get(specId)!.push({ player, ...profileData });
  }

  // Build player listings from ALL top players (Raider.IO data, no Blizzard profile needed)
  const playerLists = new Map<string, PlayerListing[]>();
  for (const [specId, players] of playersBySpec) {
    playerLists.set(specId, players.map((p) => ({
      name: p.name,
      realm: p.realm,
      region: p.region,
      score: p.score,
      specId,
      classId: p.classId,
      race: p.race,
      itemLevel: p.itemLevel,
    })));
  }

  // Override player scores with real M+ rating from Blizzard profiles
  for (const [specId, profiles] of profilesBySpec) {
    const listingMap = playerLists.get(specId);
    if (listingMap) {
      for (const p of profiles) {
        if (!p.mythicPlusRating) continue;
        const match = listingMap.find((l) => l.name === p.player.name && l.realm === p.player.realm && l.region === p.player.region);
        if (match) match.score = p.mythicPlusRating;
      }
    }
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

    let bis = Array.from(gearBySlot.entries())
      .filter(([slot]) => !["Tabard", "Shirt"].includes(slot))
      .map(([slot, items]) => ({
        slot,
        names: Array.from(items.entries())
          .sort((a, b) => b[1].count - a[1].count)
          .map(([name, data]) => ({ name, count: data.count, pct: pct(data.count, total), itemId: data.itemId })),
      }))
      .sort((a, b) => {
        const order = ["Head", "Neck", "Shoulders", "Back", "Chest", "Wrist", "Hands", "Waist", "Legs", "Feet", "Ring 1", "Ring 2", "Trinket 1", "Trinket 2", "Weapon", "Off-Hand"];
        return order.indexOf(a.slot) - order.indexOf(b.slot);
      });

    // Merge Ring 1+2 → Rings, Trinket 1+2 → Trinkets
    const merged: typeof bis = [];
    const ringMap = new Map<number, { name: string; count: number; itemId: number }>();
    const trinketMap = new Map<number, { name: string; count: number; itemId: number }>();
    for (const entry of bis) {
      if (entry.slot === "Ring 1" || entry.slot === "Ring 2") {
        for (const item of entry.names) {
          const key = item.itemId || (item.name.length + item.count);
          const existing = ringMap.get(key) || { name: item.name, count: 0, itemId: item.itemId || 0 };
          existing.count += item.count;
          ringMap.set(key, existing);
        }
      } else if (entry.slot === "Trinket 1" || entry.slot === "Trinket 2") {
        for (const item of entry.names) {
          const key = item.itemId || (item.name.length + item.count);
          const existing = trinketMap.get(key) || { name: item.name, count: 0, itemId: item.itemId || 0 };
          existing.count += item.count;
          trinketMap.set(key, existing);
        }
      } else {
        merged.push(entry);
      }
    }
    if (ringMap.size > 0) {
      const sorted = Array.from(ringMap.values()).sort((a, b) => b.count - a.count);
      merged.push({ slot: "Rings", names: sorted.map(i => ({ name: i.name, count: i.count, pct: pct(i.count, total), itemId: i.itemId })) });
    }
    if (trinketMap.size > 0) {
      const sorted = Array.from(trinketMap.values()).sort((a, b) => b.count - a.count);
      merged.push({ slot: "Trinkets", names: sorted.map(i => ({ name: i.name, count: i.count, pct: pct(i.count, total), itemId: i.itemId })) });
    }
    bis = merged.sort((a, b) => {
      const order = ["Head", "Neck", "Shoulders", "Back", "Chest", "Wrist", "Hands", "Waist", "Legs", "Feet", "Rings", "Trinkets", "Weapon", "Off-Hand"];
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

    // Aggregate stat priority from real character stats
    const statPriority = deriveStatPriority(profiles);

    // Top players list
    const topPlayers: AggregatedCharacter[] = profiles.map((p) => ({
      name: p.player.name,
      realm: p.player.realm,
      region: p.player.region,
      specId,
      classId: p.player.classId,
      score: p.mythicPlusRating || p.player.score,
      race: p.player.race,
      talents: p.talents,
      talentLoadout: p.talentLoadout,
      gear: p.gear.map((g) => ({ slot: g.slot, name: g.name, itemId: g.itemId, itemLevel: g.itemLevel })),
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
      players: playerLists.get(specId) || [],
      lastUpdated: Date.now(),
    };
  }

  return result;
}

function deriveStatPriority(profiles: any[]): string[] {
  const statOrder = ["strength", "agility", "intellect", "haste", "criticalStrike", "mastery", "versatility"];
  const statValues: Record<string, number[]> = {};
  for (const key of statOrder) statValues[key] = [];

  for (const p of profiles) {
    if (!p.stats) continue;
    for (const key of statOrder) {
      const val = p.stats[key];
      if (val != null) statValues[key].push(val);
    }
  }

  const primaryMap: Record<string, string> = { "death-knight": "strength", "demon-hunter": "agility", "druid": "intellect", "evoker": "intellect", "hunter": "agility", "mage": "intellect", "monk": "intellect", "paladin": "strength", "priest": "intellect", "rogue": "agility", "shaman": "intellect", "warlock": "intellect", "warrior": "strength" };
  const classId = profiles[0]?.player?.classId;
  const primary = primaryMap[classId || ""] || "intellect";
  const labelMap: Record<string, string> = { strength: "Strength", agility: "Agility", intellect: "Intellect", haste: "Haste", criticalStrike: "Critical Strike", mastery: "Mastery", versatility: "Versatility" };

  const avgs: { key: string; avg: number; label: string }[] = [];
  for (const [key, vals] of Object.entries(statValues)) {
    if (vals.length === 0) continue;
    if (key === primary) {
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      avgs.push({ key, avg, label: labelMap[key] || key.charAt(0).toUpperCase() + key.slice(1) });
      continue;
    }
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const label = labelMap[key] || (key === "criticalStrike" ? "Critical Strike" : key.charAt(0).toUpperCase() + key.slice(1));
    avgs.push({ key, avg, label });
  }

  if (avgs.length === 0) return ["Intellect", "Haste", "Mastery", "Critical Strike", "Versatility"];

  avgs.sort((a, b) => b.avg - a.avg);
  return avgs.map(a => a.label);
}
