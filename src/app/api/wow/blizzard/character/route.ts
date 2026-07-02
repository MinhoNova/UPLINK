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

  const variants = ["main", "inset"];

  for (const variant of variants) {
    const url = `${CDN_BASE}/${region}/character/${realmSlug}/${nameLower}-${variant}.jpg`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(url, { method: "GET", signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": res.headers.get("Content-Type") || "image/jpeg",
            "Cache-Control": "public, max-age=86400",
          },
        });
      }
    } catch {}
  }

  return NextResponse.json({ available: false, reason: "cdn miss" }, { status: 404 });
}
