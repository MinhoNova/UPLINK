import { getCurrentMythicPlusSeason, MYTHIC_SEASON_FALLBACK } from "@/lib/mythicSeason";

export async function GET() {
  try {
    const season = await getCurrentMythicPlusSeason();
    return Response.json(season);
  } catch {
    return Response.json(MYTHIC_SEASON_FALLBACK);
  }
}
