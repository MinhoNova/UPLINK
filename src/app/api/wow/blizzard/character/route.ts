import { NextRequest, NextResponse } from "next/server";
import { fetchCharacterRender } from "@/lib/blizzard/character";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");
  const realm = searchParams.get("realm");
  const region = searchParams.get("region") || "us";

  if (!name || !realm) {
    return NextResponse.json({ available: false, reason: "missing params" });
  }

  const render = await fetchCharacterRender(name, realm, region);

  if (!render) {
    return NextResponse.json({ available: false, reason: "not found" });
  }

  return NextResponse.json({
    available: true,
    render,
    name,
    realm,
    region,
  });
}
