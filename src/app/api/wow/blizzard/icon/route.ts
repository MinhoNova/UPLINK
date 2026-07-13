import { NextRequest, NextResponse } from "next/server";
import { fetchBlizzardIcon, fetchSpellIconById, fetchItemIconById } from "@/lib/blizzard/icon";
import { guessIconName } from "@/lib/wow/spellIcons";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");
  const type = searchParams.get("type") as "item" | "spell" | null;
  const id = searchParams.get("id");
  const classId = searchParams.get("classId");

  if (type === "item" && id) {
    const itemId = parseInt(id, 10);
    if (!isNaN(itemId)) {
      const iconUrl = await fetchItemIconById(itemId);
      if (iconUrl) {
        return NextResponse.json({ available: true, url: iconUrl });
      }
      if (name) {
        const nameIcon = await fetchBlizzardIcon(name, type);
        if (nameIcon) {
          return NextResponse.json({ available: true, url: nameIcon });
        }
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
      if (name) {
        const nameIcon = await fetchBlizzardIcon(name, type);
        if (nameIcon) {
          return NextResponse.json({ available: true, url: nameIcon });
        }
      }
      // Fall back to icon name guessing (Midnight spell IDs have no media)
      if (name) {
        const guessed = guessIconName(name, classId || undefined, spellId);
        if (guessed) {
          return NextResponse.json({ available: true, url: `https://render.worldofwarcraft.com/icons/56/${guessed}.jpg`, guessed: true });
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
