import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import { storeCommunityMediaFile } from "@/lib/userMediaStorage";

const MAX_VIDEO_BYTES = 15 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const formData = await req.formData();
  const file = formData.get("video") as File | null;
  if (!file || !file.size) return NextResponse.json({ error: "No video file" }, { status: 400 });

  if (file.size > MAX_VIDEO_BYTES) return NextResponse.json({ error: "Video too large (max 15MB)" }, { status: 413 });

  const ext = file.name.match(/\.(\w+)$/)?.[1]?.toLowerCase() || "mp4";
  const buffer = Buffer.from(await file.arrayBuffer());

  const url = await storeCommunityMediaFile((auth.user as any).id, buffer, ext, file.type || "video/mp4");
  return NextResponse.json({ url });
}
