/** Current Mythic+ season from Raider.io static data (auto-resets season filters). */

export type MythicSeasonInfo = {
  slug: string;
  name: string;
  startMs: number;
  expansionId: number;
};

const FALLBACK: MythicSeasonInfo = {
  slug: "season-mn-1",
  name: "MN Season 1",
  startMs: new Date("2026-03-24T15:00:00Z").getTime(),
  expansionId: 11,
};

export async function getCurrentMythicPlusSeason(): Promise<MythicSeasonInfo> {
  const now = Date.now();
  for (const expansionId of [11, 10]) {
    try {
      const res = await fetch(
        `https://raider.io/api/v1/mythic-plus/static-data?expansion_id=${expansionId}`,
        { next: { revalidate: 3600 } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      for (const season of data.seasons || []) {
        if (!season.is_main_season) continue;
        const startMs = new Date(season.starts?.us || season.starts?.eu).getTime();
        const endMs = season.ends?.us ? new Date(season.ends.us).getTime() : Number.MAX_SAFE_INTEGER;
        if (now >= startMs && now < endMs) {
          return { slug: season.slug, name: season.name, startMs, expansionId };
        }
      }
    } catch {
      /* try next expansion */
    }
  }
  return FALLBACK;
}
