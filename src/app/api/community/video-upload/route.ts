import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import { storeCommunityMediaFile } from "@/lib/userMediaStorage";
import { checkUploadQuota, incrementUploadQuota } from "@/lib/imageSecurity";
import { rateLimitByUser } from "@/lib/rateLimit";
import { rateLimitResponse } from "@/lib/rateLimitHttp";

const MAX_VIDEO_BYTES = 15 * 1024 * 1024;

/** Container signatures we accept, mapped to the extension we store under. */
const VIDEO_SIGNATURES: { ext: string; mime: string; test: (b: Buffer) => boolean }[] = [
  // WebM first: Matroska and WebM share the EBML magic, so distinguish on the
  // DocType string that follows. WebM plays in every browser; MKV mostly does not.
  {
    ext: "webm",
    mime: "video/webm",
    test: (b) =>
      b.length > 8 && b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3 &&
      b.subarray(0, 64).toString("latin1").includes("webm"),
  },
  {
    ext: "mkv",
    mime: "video/x-matroska",
    test: (b) => b.length > 4 && b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3,
  },
  // ISO base media file format (mp4, mov, m4v): bytes 4..8 are "ftyp".
  {
    ext: "mp4",
    mime: "video/mp4",
    test: (b) => b.length > 12 && b.subarray(4, 8).toString("latin1") === "ftyp",
  },
];

function sniffVideo(buffer: Buffer) {
  for (const sig of VIDEO_SIGNATURES) {
    try {
      if (sig.test(buffer)) return sig;
    } catch {
      /* try the next signature */
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  // Pass `req`: without it the cross-origin check is skipped entirely.
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  // Rate of uploads, checked before the body is touched. The quota below bounds
  // how much one account can store, but nothing bounded how often it could spend
  // a request buffering 15MB and re-sniffing the result; the per-IP middleware
  // bucket is shared behind a carrier NAT, so it is not a per-account ceiling
  // either. Sized for a person posting a handful of clips in an evening.
  const rl = await rateLimitByUser(String((auth.user as any).id), "video-upload", 20, 60 * 60_000);
  if (!rl.ok) return rateLimitResponse(rl);

  // Reject on the declared length BEFORE reading the body. `req.formData()`
  // buffers the entire upload into worker memory, so the size check that came
  // after it only ran once the file was already resident — an authenticated
  // account could post a body of any size and drive the worker into the
  // out-of-memory crash (Error 1102) that has taken this site down before.
  // The declared length is a claim, so it is used to refuse early; the exact
  // per-file check below still runs on the real file.
  const declared = Number(req.headers.get("content-length") || "0");
  if (declared > MAX_VIDEO_BYTES + 1024 * 1024) {
    return NextResponse.json({ error: "Video too large (max 15MB)" }, { status: 413 });
  }

  const formData = await req.formData();
  const file = formData.get("video") as File | null;
  if (!file || !file.size) return NextResponse.json({ error: "No video file" }, { status: 400 });

  if (file.size > MAX_VIDEO_BYTES) return NextResponse.json({ error: "Video too large (max 15MB)" }, { status: 413 });

  const uid = String((auth.user as any).id);
  const quota = await checkUploadQuota(uid);
  if (!quota.ok) return NextResponse.json({ error: quota.error }, { status: 429 });

  const buffer = Buffer.from(await file.arrayBuffer());

  // Identify by content, not by the filename extension or the client-supplied
  // Content-Type. Both are attacker-controlled, and the stored blob is served
  // back under the MIME type we choose here.
  const sig = sniffVideo(buffer);
  if (!sig) {
    return NextResponse.json(
      { error: "Unsupported video format. Upload an MP4 or WebM file." },
      { status: 415 }
    );
  }

  await incrementUploadQuota(uid);
  const url = await storeCommunityMediaFile(uid, buffer, sig.ext, sig.mime);
  return NextResponse.json({ url });
}
