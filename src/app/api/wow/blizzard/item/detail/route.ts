import { NextRequest, NextResponse } from "next/server";
import { fetchItemDetail } from "@/lib/blizzard/item-detail";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "missing item id" }, { status: 400 });
  }

  const itemId = parseInt(id, 10);
  if (isNaN(itemId)) {
    return NextResponse.json({ error: "invalid item id" }, { status: 400 });
  }

  const detail = await fetchItemDetail(itemId);
  if (!detail) {
    return NextResponse.json({ error: "failed to fetch item detail" }, { status: 500 });
  }

  return NextResponse.json(detail);
}
