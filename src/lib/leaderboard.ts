export type LeaderboardRole = "all" | "dps" | "healer" | "tank";
export type LeaderboardPeriod = "daily" | "weekly" | "monthly" | "season";
export type LeaderboardMetric = "performance" | "runs" | "class_leaders";
export type LeaderboardClassFilter = "all" | string;

export const WOW_CLASSES = [
  "Warrior",
  "Paladin",
  "Hunter",
  "Rogue",
  "Priest",
  "Death Knight",
  "Shaman",
  "Mage",
  "Warlock",
  "Monk",
  "Druid",
  "Demon Hunter",
  "Evoker",
] as const;

export const CLASS_ROLE_OPTIONS: Record<string, string[]> = {
  Evoker: ["dps", "healer"],
  "Demon Hunter": ["dps", "tank"],
  Druid: ["dps", "healer", "tank"],
  Monk: ["dps", "healer", "tank"],
  Paladin: ["dps", "healer", "tank"],
  Priest: ["dps", "healer"],
  Shaman: ["dps", "healer"],
  Warrior: ["dps", "tank"],
  "Death Knight": ["dps", "tank"],
  Hunter: ["dps"],
  Rogue: ["dps"],
  Mage: ["dps"],
  Warlock: ["dps"],
};

export type LeaderboardEntry = {
  userId: string;
  runCount: number;
  topChar: any;
  user: any | null;
  role: string;
  roleScore: number;
};

export type ClassChampionEntry = {
  className: string;
  role: string;
  userId: string | null;
  runCount: number;
  topChar: any | null;
  user: any | null;
  roleScore: number;
};

type RunRecord = { userId: string; role: string; className: string; completedAt: number };

function resolveRole(userId: string, lobby: any, characters: any[]): string {
  const member = (lobby.accepted || []).find(
    (a: any) => String(a.applicantId || a.userId) === String(userId)
  );
  if (member?.role) return String(member.role).toLowerCase();
  const char = characters.find((c: any) => String(c.userId) === String(userId));
  return (char?.role || "dps").toLowerCase();
}

function resolveClass(userId: string, lobby: any, characters: any[]): string {
  const member = (lobby.accepted || []).find(
    (a: any) => String(a.applicantId || a.userId) === String(userId)
  );
  if (member?.class) return String(member.class);
  const mine = characters.filter((c: any) => String(c.userId) === String(userId));
  if (!mine.length) return "Unknown";
  return mine.reduce((a, b) => (Number(b.score) > Number(a.score) ? b : a)).class || "Unknown";
}

export function collectRunRecords(lobbies: any[], characters: any[]): RunRecord[] {
  const records: RunRecord[] = [];
  for (const lobby of lobbies) {
    for (const run of lobby.detectedRuns || []) {
      const memberId = run.memberId;
      if (!memberId) continue;
      const ts = run.completed_at ? new Date(run.completed_at).getTime() : 0;
      if (!ts) continue;
      records.push({
        userId: String(memberId),
        role: resolveRole(memberId, lobby, characters),
        className: resolveClass(memberId, lobby, characters),
        completedAt: ts,
      });
    }
  }
  return records;
}

export function getPeriodStart(period: LeaderboardPeriod, seasonStartMs: number): number {
  const now = new Date();
  if (period === "daily") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  }
  if (period === "weekly") {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const day = d.getDay();
    const daysFromMonday = day === 0 ? 6 : day - 1;
    d.setDate(d.getDate() - daysFromMonday);
    return d.getTime();
  }
  if (period === "monthly") {
    return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  }
  return seasonStartMs;
}

function getRoleScore(char: any, role: string): number {
  if (!char) return 0;
  if (role === "healer") return Number(char.hpsValue || char.stats?.healer || 0);
  if (role === "tank") return Number(char.tankValue || char.stats?.tank || 0);
  return Number(char.dpsValue || char.stats?.dps || char.score || 0);
}

function pickTopChar(
  userId: string,
  characters: any[],
  classFilter: LeaderboardClassFilter,
  roleFilter: LeaderboardRole = "all"
): any {
  const mine = characters.filter((c: any) => String(c.userId) === String(userId));
  if (!mine.length) return { name: "Operative", role: "dps", score: 0 };
  if (classFilter !== "all" && roleFilter !== "all") {
    const match = mine.find(
      (c) => c.class === classFilter && (c.role || "dps").toLowerCase() === roleFilter
    );
    if (match) return match;
  }
  if (classFilter !== "all") {
    const match = mine.find((c) => c.class === classFilter);
    if (match) return match;
  }
  return mine.reduce((a, b) => (Number(b.score) > Number(a.score) ? b : a));
}

function pickCharForClassRole(userId: string, characters: any[], className: string, role: string): any {
  const mine = characters.filter((c: any) => String(c.userId) === String(userId));
  const match = mine.find(
    (c) => c.class === className && (c.role || "dps").toLowerCase() === role
  );
  if (match) return match;
  const classMatch = mine.find((c) => c.class === className);
  if (classMatch) return classMatch;
  return mine[0] || { name: "Operative", class: className, role, score: 0 };
}

function bucketKey(className: string, role: string): string {
  return `${className}|${role}`;
}

function aggregateRunBuckets(records: RunRecord[]): Map<string, Map<string, number>> {
  const buckets = new Map<string, Map<string, number>>();
  for (const r of records) {
    if (!r.className || r.className === "Unknown") continue;
    const key = bucketKey(r.className, r.role);
    if (!buckets.has(key)) buckets.set(key, new Map());
    const userCounts = buckets.get(key)!;
    userCounts.set(r.userId, (userCounts.get(r.userId) || 0) + 1);
  }
  return buckets;
}

function pickBucketWinner(userCounts: Map<string, number>): { userId: string; runCount: number } | null {
  let bestUserId = "";
  let bestCount = 0;
  for (const [uid, count] of userCounts) {
    if (count > bestCount) {
      bestCount = count;
      bestUserId = uid;
    }
  }
  return bestCount > 0 ? { userId: bestUserId, runCount: bestCount } : null;
}

function buildClassChampionSlots(
  buckets: Map<string, { userId: string; runCount: number; char?: any } | null>,
  characters: any[],
  users: any[],
  roleFilter: LeaderboardRole
): ClassChampionEntry[] {
  const userMap = new Map(users.map((u: any) => [String(u.id), u]));
  const champions: ClassChampionEntry[] = [];

  for (const className of WOW_CLASSES) {
    for (const role of CLASS_ROLE_OPTIONS[className] || ["dps"]) {
      if (roleFilter !== "all" && role !== roleFilter) continue;
      const winner = buckets.get(bucketKey(className, role)) || null;
      if (winner) {
        const topChar = winner.char || pickCharForClassRole(winner.userId, characters, className, role);
        champions.push({
          className,
          role,
          userId: winner.userId,
          runCount: winner.runCount,
          topChar,
          user: userMap.get(winner.userId) || null,
          roleScore: getRoleScore(topChar, role),
        });
      } else {
        champions.push({
          className,
          role,
          userId: null,
          runCount: 0,
          topChar: null,
          user: null,
          roleScore: 0,
        });
      }
    }
  }

  return champions;
}

export function buildRunLeaderboard(
  lobbies: any[],
  characters: any[],
  users: any[],
  roleFilter: LeaderboardRole,
  period: LeaderboardPeriod,
  seasonStartMs: number,
  classFilter: LeaderboardClassFilter = "all"
): LeaderboardEntry[] {
  const periodStart = getPeriodStart(period, seasonStartMs);
  const records = collectRunRecords(lobbies, characters).filter(
    (r) =>
      r.completedAt >= periodStart &&
      (roleFilter === "all" || r.role === roleFilter) &&
      (classFilter === "all" || r.className === classFilter)
  );

  const counts = new Map<string, number>();
  const rolesSeen = new Map<string, string>();
  for (const r of records) {
    counts.set(r.userId, (counts.get(r.userId) || 0) + 1);
    if (!rolesSeen.has(r.userId)) rolesSeen.set(r.userId, r.role);
  }

  const userMap = new Map(users.map((u: any) => [String(u.id), u]));

  const entries: LeaderboardEntry[] = [];
  for (const [userId, runCount] of counts) {
    const role = rolesSeen.get(userId) || "dps";
    const topChar = pickTopChar(userId, characters, classFilter, roleFilter);
    entries.push({
      userId,
      runCount,
      topChar,
      user: userMap.get(userId) || null,
      role,
      roleScore: getRoleScore(topChar, role),
    });
  }

  return entries.sort((a, b) => b.runCount - a.runCount || b.roleScore - a.roleScore).slice(0, 100);
}

/** Raider.io run counts on synced characters — any key level, used when mission sync is empty. */
export function buildRaiderRunsLeaderboard(
  characters: any[],
  users: any[],
  roleFilter: LeaderboardRole,
  classFilter: LeaderboardClassFilter = "all"
): LeaderboardEntry[] {
  const userMap = new Map(users.map((u: any) => [String(u.id), u]));
  const counts = new Map<string, number>();
  const charByUser = new Map<string, any>();

  for (const c of characters) {
    const role = (c.role || "dps").toLowerCase();
    if (roleFilter !== "all" && role !== roleFilter) continue;
    if (classFilter !== "all" && c.class !== classFilter) continue;
    const runCount = Array.isArray(c.runs) ? c.runs.length : 0;
    if (runCount <= 0) continue;
    const uid = String(c.userId);
    counts.set(uid, (counts.get(uid) || 0) + runCount);
    const existing = charByUser.get(uid);
    if (!existing || runCount > (Array.isArray(existing.runs) ? existing.runs.length : 0)) {
      charByUser.set(uid, c);
    }
  }

  return [...counts.entries()]
    .map(([userId, runCount]) => {
      const topChar = charByUser.get(userId) || { name: "Operative", role: "dps", score: 0 };
      const role = (topChar.role || "dps").toLowerCase();
      return {
        userId,
        runCount,
        topChar,
        user: userMap.get(userId) || null,
        role,
        roleScore: getRoleScore(topChar, role),
      };
    })
    .sort((a, b) => b.runCount - a.runCount || b.roleScore - a.roleScore)
    .slice(0, 100);
}

/** Score-based board (Raider.io) filtered by role — used when no synced runs yet. */
export function buildScoreLeaderboard(
  characters: any[],
  users: any[],
  roleFilter: LeaderboardRole
): LeaderboardEntry[] {
  const userMap = new Map(users.map((u: any) => [String(u.id), u]));
  const byUser = new Map<string, any>();

  for (const c of characters) {
    const role = (c.role || "dps").toLowerCase();
    if (roleFilter !== "all" && role !== roleFilter) continue;
    const score = Number(c.score);
    if (score <= 0) continue;
    const uid = String(c.userId);
    const existing = byUser.get(uid);
    if (!existing || score > Number(existing.score)) byUser.set(uid, c);
  }

  return [...byUser.entries()]
    .map(([userId, topChar]) => {
      const role = (topChar.role || "dps").toLowerCase();
      return {
        userId,
        runCount: 0,
        topChar,
        user: userMap.get(userId) || null,
        role,
        roleScore: getRoleScore(topChar, role),
      };
    })
    .sort((a, b) => b.roleScore - a.roleScore)
    .slice(0, 100);
}

/** Top run-count player per class + role slot (mission sync). */
export function buildClassRunChampions(
  lobbies: any[],
  characters: any[],
  users: any[],
  roleFilter: LeaderboardRole,
  period: LeaderboardPeriod,
  seasonStartMs: number
): ClassChampionEntry[] {
  const periodStart = getPeriodStart(period, seasonStartMs);
  const records = collectRunRecords(lobbies, characters).filter((r) => r.completedAt >= periodStart);
  const rawBuckets = aggregateRunBuckets(records);
  const buckets = new Map<string, { userId: string; runCount: number } | null>();

  for (const className of WOW_CLASSES) {
    for (const role of CLASS_ROLE_OPTIONS[className] || ["dps"]) {
      const winner = pickBucketWinner(rawBuckets.get(bucketKey(className, role)) || new Map());
      buckets.set(bucketKey(className, role), winner);
    }
  }

  return buildClassChampionSlots(buckets, characters, users, roleFilter);
}

/** Top run-count player per class + role slot (Raider.io fallback). */
export function buildRaiderClassRunChampions(
  characters: any[],
  users: any[],
  roleFilter: LeaderboardRole
): ClassChampionEntry[] {
  const buckets = new Map<string, { userId: string; runCount: number; char: any } | null>();

  for (const className of WOW_CLASSES) {
    for (const role of CLASS_ROLE_OPTIONS[className] || ["dps"]) {
      buckets.set(bucketKey(className, role), null);
    }
  }

  for (const c of characters) {
    const className = c.class;
    const role = (c.role || "dps").toLowerCase();
    if (!className) continue;
    if (roleFilter !== "all" && role !== roleFilter) continue;
    const runCount = Array.isArray(c.runs) ? c.runs.length : 0;
    if (runCount <= 0) continue;
    const key = bucketKey(className, role);
    const existing = buckets.get(key);
    if (!existing || runCount > existing.runCount) {
      buckets.set(key, { userId: String(c.userId), runCount, char: c });
    }
  }

  return buildClassChampionSlots(buckets, characters, users, roleFilter);
}
