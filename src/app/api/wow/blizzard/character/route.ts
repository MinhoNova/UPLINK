import { NextRequest, NextResponse } from "next/server";

const CDN_BASE = "https://render.worldofwarcraft.com";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");
  const realm = searchParams.get("realm");
  const region = (searchParams.get("region") || "us").toLowerCase();

  if (!name || !realm) {
    return NextResponse.json({ available: false, reason: "missing params" });
  }

  const realmSlug = realm.toLowerCase().replace(/\s+/g, "-").replace(/['']/g, "");
  const nameLower = name.toLowerCase().replace(/'/g, "");

  const patterns = [
    { key: "main", url: `${CDN_BASE}/${region}/character/${realmSlug}/${nameLower}-main.jpg` },
    { key: "inset", url: `${CDN_BASE}/${region}/character/${realmSlug}/${nameLower}-inset.jpg` },
  ];

  for (const { key, url } of patterns) {
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (res.ok || res.status === 200) {
        return NextResponse.json({ available: true, url, variant: key });
      }
    } catch {}
  }

  return NextResponse.json({ available: false, reason: "cdn miss", patterns: patterns.map(p => p.url) });
}
