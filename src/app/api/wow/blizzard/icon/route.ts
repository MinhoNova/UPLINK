import { NextRequest, NextResponse } from "next/server";
import { fetchBlizzardIcon, fetchSpellIconById, fetchItemIconById } from "@/lib/blizzard/icon";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");
  const type = searchParams.get("type") as "item" | "spell" | null;
  const id = searchParams.get("id");

  if (type === "item" && id) {
    const itemId = parseInt(id, 10);
    if (!isNaN(itemId)) {
      const iconUrl = await fetchItemIconById(itemId);
      if (iconUrl) {
        return NextResponse.json({ available: true, url: iconUrl });
      }
      return NextResponse.json({ available: false });
    }
  }

  if (type === "spell" && id) {
    const spellId = parseInt(id, 10);
    if (!isNaN(spellId)) {
      const iconUrl = await fetchSpellIconById(spellId);
      if (iconUrl) {
        return NextResponse.json({ available: true, url: iconUrl });
      }
      // Fall back to name search if ID lookup fails
      if (name) {
        const nameIcon = await fetchBlizzardIcon(name, type);
        if (nameIcon) {
          return NextResponse.json({ available: true, url: nameIcon });
        }
      }
      return NextResponse.json({ available: false });
    }
  }

  if (!name || !type) {
    return NextResponse.json({ available: false, reason: "missing params" });
  }

  const iconUrl = await fetchBlizzardIcon(name, type);

  if (!iconUrl) {
    return NextResponse.json({ available: false });
  }

  return NextResponse.json({ available: true, url: iconUrl });
}
