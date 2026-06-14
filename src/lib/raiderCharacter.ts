/** Raider.io no longer always returns top-level `level`; infer from gear/M+ when missing. */
export function resolveRaiderCharacterLevel(data: any): number {
  const direct = Number(data?.level || 0);
  if (direct > 0) return direct;

  const ilvl = Number(data?.gear?.item_level_equipped || 0);
  if (ilvl >= 240) return 90;
  if (ilvl >= 200) return 85;
  if (ilvl >= 100) return 80;

  const scores = data?.mythic_plus_scores_by_season;
  if (Array.isArray(scores) && scores.some((s) => Number(s?.scores?.all || 0) > 0)) {
    return 90;
  }

  if (Array.isArray(data?.mythic_plus_best_runs) && data.mythic_plus_best_runs.length > 0) {
    return 90;
  }

  return 0;
}

/** Build a UPLINK character record from a Raider.io profile API response. */
export function buildCharacterFromRaiderProfile(
  data: any,
  meta: {
    userId: string;
    userName: string;
    userAvatar?: string;
    discordName?: string;
    existingId?: string | number;
  }
) {
  const scoresAll = data.mythic_plus_scores_by_season?.[0]?.scores;
  const rRole =
    data.active_spec_role === "TANK"
      ? "tank"
      : data.active_spec_role === "HEALER" || data.active_spec_role === "HEALING"
        ? "healer"
        : "dps";
  const score = scoresAll?.[rRole]?.toString() || scoresAll?.all?.toString() || "0";
  const runs = (data.mythic_plus_best_runs || []).map((run: any) => ({
    dungeon: run.short_name,
    level: run.mythic_level,
    timed: run.num_keystone_upgrades > 0,
  }));
  const stats = { dps: 0, tank: 0, healer: 0 };
  const fScore = parseFloat(scoresAll?.all?.toString() || "0") || 0;
  const dpsValue = rRole === "dps" ? fScore * 59.2 : 0;
  const hpsValue = rRole === "healer" ? fScore * 35.5 : 0;
  const tankValue = rRole === "tank" ? fScore * 28.4 : 0;
  if (rRole === "dps") stats.dps = dpsValue;
  else if (rRole === "healer") stats.healer = hpsValue;
  else if (rRole === "tank") stats.tank = tankValue;
  const roleScores = {
    dps: scoresAll?.dps?.toString() || "0",
    healer: scoresAll?.healer?.toString() || "0",
    tank: scoresAll?.tank?.toString() || "0",
  };

  return {
    id: meta.existingId ?? Date.now(),
    name: data.name,
    discordName: meta.discordName || "",
    realm: data.realm,
    region: data.region,
    ilvl: data.gear?.item_level_equipped || 0,
    score,
    class: data.class,
    role: rRole,
    roleScores,
    stats,
    dpsValue,
    hpsValue,
    tankValue,
    runs,
    userId: meta.userId,
    userName: meta.userName,
    userAvatar: meta.userAvatar || "",
  };
}

export function normalizeCharacterRoleScores(char: any) {
  if (char.roleScores && char.roleScores.dps !== char.roleScores.healer) return char;
  return {
    ...char,
    roleScores: {
      dps: char.role === "dps" ? char.score || "0" : "0",
      healer: char.role === "healer" ? char.score || "0" : "0",
      tank: char.role === "tank" ? char.score || "0" : "0",
    },
  };
}

/** Merge server-linked characters into My Characters (local) without dropping local-only prefs. */
export function mergeMyCharactersFromServer(local: any[], serverForUser: any[]): any[] {
  if (!serverForUser.length) return local;
  const byKey = new Map(
    local.map((c) => [`${String(c.name).toLowerCase()}|${String(c.realm).toLowerCase()}|${String(c.region || "").toLowerCase()}`, c])
  );
  let changed = false;
  for (const sc of serverForUser) {
    const k = `${String(sc.name).toLowerCase()}|${String(sc.realm).toLowerCase()}|${String(sc.region || "").toLowerCase()}`;
    if (!byKey.has(k)) {
      byKey.set(k, normalizeCharacterRoleScores(sc));
      changed = true;
    }
  }
  if (!changed && local.length) return local;
  if (!local.length) return serverForUser.map(normalizeCharacterRoleScores);
  return Array.from(byKey.values());
}
