import { NextRequest, NextResponse } from "next/server";
import { getAppSession } from "@/lib/authEnv";
import { requireOptionalSession } from "@/lib/authz";
import { getDb } from "@/db";
import { posts, reactions, reports } from "@/db/schema";
import { eq, and, inArray, gte } from "drizzle-orm";
import { normalizeCommunityImage } from "@/lib/imageProcess";
import { getKV, initTables } from "@/lib/db";
import { storeCommunityMediaFile } from "@/lib/userMediaStorage";
import { resolvePublicAuthorFields } from "@/lib/profileImage";

const MAX_DAILY_POSTS = 10;
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

async function validateAndNormalizeImage(buffer: Buffer, preferGif = false) {
  return normalizeCommunityImage(buffer, preferGif);
}

function mediaContentType(ext: string) {
  if (ext === "gif") return "image/gif";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  if (ext === "avif") return "image/avif";
  return "image/jpeg";
}

async function saveCommunityImage(userId: string, buffer: Buffer, preferGif: boolean) {
  const normalized = await validateAndNormalizeImage(buffer, preferGif);
  return storeCommunityMediaFile(userId, normalized.buffer, normalized.ext, mediaContentType(normalized.ext));
}

export async function GET(req: NextRequest) {
  const db = await getDb();
  const auth = await requireOptionalSession(req);
  const viewerId = auth.ok && auth.user ? auth.user.id : "guest";

  const { searchParams } = new URL(req.url);
  const tag = searchParams.get("tag");
  const userId = searchParams.get("userId");

  let rows = await db.select().from(posts).limit(100);

  rows = [...rows].sort((a: any, b: any) => {
    const aPin = a.pinnedAt ?? 0;
    const bPin = b.pinnedAt ?? 0;
    if (aPin && !bPin) return -1;
    if (!aPin && bPin) return 1;
    if (aPin && bPin && aPin !== bPin) return bPin - aPin;
    return (b.createdAt ?? 0) - (a.createdAt ?? 0);
  });
  rows = rows.slice(0, 50);

  if (tag) {
    rows = rows.filter((p: any) => {
      const tags = JSON.parse(p.tags || "[]");
      return tags.includes(tag);
    });
  }

  if (userId) {
    rows = rows.filter((p: any) => p.userId === userId);
  }

  await initTables();

  const postIds = rows.map((p: any) => p.id);
  const allReactions = postIds.length > 0
    ? await db.select().from(reactions).where(inArray(reactions.postId, postIds))
    : [];

  const reactionMap: Record<number, { type: string; count: number; userReacted: boolean }[]> = {};
  for (const r of allReactions as any[]) {
    if (!reactionMap[r.postId]) reactionMap[r.postId] = [];
    const existing = reactionMap[r.postId].find((x) => x.type === r.type);
    if (existing) {
      existing.count++;
      if (auth.ok && auth.user && r.userId === auth.user.id) existing.userReacted = true;
    } else {
      reactionMap[r.postId].push({ type: r.type, count: 1, userReacted: auth.ok && auth.user ? r.userId === auth.user.id : false });
    }
  }

  await initTables();
  const registeredUsers = ((await getKV("registeredUsers")) || []) as any[];

  const result = rows.map((p: any) => {
    const author = registeredUsers.find((u: any) => String(u.id) === String(p.userId));
    const authorFields = resolvePublicAuthorFields(author, { name: p.userName, image: p.userImage });
    return {
      ...p,
      userName: authorFields.userName,
      userImage: authorFields.userImage,
      hiddenIdentity: authorFields.hiddenIdentity,
      reactions: reactionMap[p.id] || [],
      tags: JSON.parse(p.tags || "[]"),
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const db = await getDb();
  const session = await getAppSession(req);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentType = req.headers.get("content-type") || "";
  let content: string, tagsRaw: string, imageUrl: string | null;
  let file: File | null = null;

  if (contentType.includes("application/json")) {
    const json = await req.json();
    content = json.content || "";
    tagsRaw = typeof json.tags === "string" ? json.tags : JSON.stringify(json.tags ?? []);
    imageUrl = json.imageUrl || null;
  } else {
    const formData = await req.formData();
    content = formData.get("content") as string;
    tagsRaw = formData.get("tags") as string;
    imageUrl = formData.get("imageUrl") as string | null;
    file = formData.get("image") as File | null;
  }

  if (!content?.trim() && !imageUrl && !file?.size) return NextResponse.json({ error: "Content or image required" }, { status: 400 });

  const tags = tagsRaw ? JSON.parse(tagsRaw) : [];
  let imagePath: string | null = null;
  const currentUserId = (session.user as any).id;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const todayPosts = await db.select().from(posts).where(and(
    eq(posts.userId, currentUserId),
    gte(posts.createdAt, startOfDay.getTime())
  ));
  if (todayPosts.length >= MAX_DAILY_POSTS) {
    return NextResponse.json({ error: "Daily post limit reached" }, { status: 429 });
  }

  // Handle file upload
  if (file && file.size > 0) {
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "File too large" }, { status: 413 });
    }
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      imagePath = await saveCommunityImage(currentUserId, buffer, /\.gif$/i.test(file.name));
    } catch (e) {
      console.error("Community image upload failed:", e);
      return NextResponse.json({ error: "Invalid or unsupported image" }, { status: 400 });
    }
  }

  // Handle URL image (download + compress)
  if (!imagePath && imageUrl) {
    // Internal media URL (video/image already stored) — use directly
    if (imageUrl.startsWith("/api/user/media")) {
      imagePath = imageUrl;
    } else {
      try {
        const resp = await fetch(imageUrl, {
          headers: { "User-Agent": "UPLINK/1.0" },
        });
        if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
        const buffer = Buffer.from(await resp.arrayBuffer());
        const remoteType = resp.headers.get("content-type") || "";
        if (!remoteType.startsWith("image/")) throw new Error("URL is not an image");
        if (buffer.byteLength > MAX_UPLOAD_BYTES) throw new Error("Remote file too large");
        imagePath = await saveCommunityImage(currentUserId, buffer, /\.gif(?:$|\?)/i.test(imageUrl));
      } catch (e) {
        console.error("Failed to download image from URL:", e);
        return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
      }
    }
  }

  try {
    await initTables();
    const registeredUsers = ((await getKV("registeredUsers")) || []) as any[];
    const me = registeredUsers.find((u: any) => String(u.id) === String(currentUserId));
    const authorFields = resolvePublicAuthorFields(me, {
      name: session.user.name || "Unknown",
      image: session.user.image || "",
    });

    const result = await db.insert(posts).values({
      userId: (session.user as any).id,
      userName: authorFields.userName,
      userImage: authorFields.userImage,
      content: content.trim(),
      image: imagePath,
      tags: JSON.stringify(tags),
      visibility: "public",
      createdAt: Date.now(),
    }).returning();

    return NextResponse.json(result[0] ?? { success: true });
  } catch (e) {
    console.error("Failed to create community post:", e);
    return NextResponse.json({ error: "Failed to save post" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const db = await getDb();
  const session = await getAppSession(req);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { postId } = await req.json();
  if (!postId) return NextResponse.json({ error: "Missing postId" }, { status: 400 });

  const post = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (post.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (post[0].userId !== (session.user as any).id && (session.user as any).id !== "1497295886223544471") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.delete(reactions).where(eq(reactions.postId, postId));
  await db.delete(reports).where(eq(reports.postId, postId));
  await db.delete(posts).where(eq(posts.id, postId));

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const db = await getDb();
  const session = await getAppSession(req);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentType = req.headers.get("content-type") || "";
  const currentUserId = (session.user as { id?: string }).id || "";
  const isAdmin = currentUserId === "1497295886223544471";

  let postId: number;
  let content: string | undefined;
  let removeImage = false;
  let file: File | null = null;

  if (contentType.includes("application/json")) {
    const json = await req.json();
    postId = Number(json.postId);
    if (json.content !== undefined) content = String(json.content);
    if (json.removeImage) removeImage = true;
  } else {
    const formData = await req.formData();
    postId = Number(formData.get("postId"));
    const rawContent = formData.get("content");
    if (rawContent !== null) content = String(rawContent);
    if (formData.get("removeImage") === "true") removeImage = true;
    file = formData.get("image") as File | null;
  }

  if (!postId) return NextResponse.json({ error: "Missing postId" }, { status: 400 });

  const existing = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (existing.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const post = existing[0] as any;
  if (post.userId !== currentUserId && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updates: Record<string, unknown> = {};
  if (content !== undefined) updates.content = content.trim();

  if (removeImage) updates.image = null;

  if (file && file.size > 0) {
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "File too large" }, { status: 413 });
    }
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      updates.image = await saveCommunityImage(currentUserId, buffer, /\.gif$/i.test(file.name));
    } catch (e) {
      console.error("Community image update failed:", e);
      return NextResponse.json({ error: "Invalid or unsupported image" }, { status: 400 });
    }
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const result = await db.update(posts).set(updates).where(eq(posts.id, postId)).returning();
  return NextResponse.json(result[0] ?? { success: true });
}
