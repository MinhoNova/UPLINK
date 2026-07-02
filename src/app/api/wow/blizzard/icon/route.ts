import { NextRequest, NextResponse } from "next/server";
import { fetchBlizzardIcon } from "@/lib/blizzard/icon";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");
  const type = searchParams.get("type") as "item" | "spell";

  if (!name || !type) {
    return NextResponse.json({ available: false, reason: "missing params" });
  }

  const iconUrl = await fetchBlizzardIcon(name, type);

  if (!iconUrl) {
    return NextResponse.json({ available: false });
  }

  return NextResponse.json({ available: true, url: iconUrl });
}
