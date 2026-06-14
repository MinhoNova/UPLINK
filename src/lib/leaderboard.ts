export type LeaderboardRole = "all" | "dps" | "healer" | "tank";
export type LeaderboardPeriod = "daily" | "weekly" | "monthly" | "season";
export type LeaderboardMetric = "performance" | "runs";
export type LeaderboardClassFilter = "all" | string;

export type LeaderboardEntry = {
  userId: string;
  runCount: number;
  topChar: any;
  user: any | null;
  role: string;
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

function pickTopChar(userId: string, characters: any[], classFilter: LeaderboardClassFilter): any {
  const mine = characters.filter((c: any) => String(c.userId) === String(userId));
  if (!mine.length) return { name: "Operative", role: "dps", score: 0 };
  if (classFilter !== "all") {
    const match = mine.find((c) => c.class === classFilter);
    if (match) return match;
  }
  return mine.reduce((a, b) => (Number(b.score) > Number(a.score) ? b : a));
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
    const topChar = pickTopChar(userId, characters, classFilter);
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
