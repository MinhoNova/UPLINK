import { getDb } from "@/db";
import { posts, comments } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getKV } from "@/lib/db";
import { canViewPost } from "@/lib/postVisibility";

type Verdict = { allowed: true } | { allowed: false; status: 404 | 403 };

const DENY_404: Verdict = { allowed: false, status: 404 };
const DENY_403: Verdict = { allowed: false, status: 403 };

async function viewerCanSee(viewerId: string, postIds: number[]): Promise<Set<number>> {
  const visible = new Set<number>();
  if (postIds.length === 0) return visible;
  const db = await getDb();
  const rows = await db
    .select()
    .from(posts)
    .where(inArray(posts.id, postIds));
  if (rows.length === 0) return visible;
  const friends = ((await getKV("friends").catch(() => null)) || []) as any[];
  for (const p of rows as any[]) {
    if (canViewPost(viewerId, p, friends)) visible.add(Number(p.id));
  }
  return visible;
}

/**
 * A comment or a reaction inherits the visibility of the post it hangs off.
 * Without this check the feed hides a friends-only post but its comment thread
 * stays readable by post id, and anyone can still interact with it.
 */
export async function assertPostVisible(viewerId: string, postId: unknown): Promise<Verdict> {
  const id = Number(postId);
  if (!Number.isFinite(id)) return DENY_404;
  const visible = await viewerCanSee(String(viewerId || ""), [id]);
  return visible.has(id) ? { allowed: true } : DENY_403;
}

/**
 * Same rule for a batch of comment ids: returns the subset the viewer may see,
 * and reports whether any id belonged to a post that exists but is hidden, so
 * the caller can tell "not yours" from "not there".
 */
export async function visibleCommentIds(
  viewerId: string,
  commentIds: unknown[]
): Promise<{ allowed: Set<number>; forbidden: boolean }> {
  const ids = commentIds.map(Number).filter((n) => Number.isFinite(n));
  if (ids.length === 0) return { allowed: new Set(), forbidden: false };
  const db = await getDb();
  const rows = await db
    .select({ id: comments.id, postId: comments.postId })
    .from(comments)
    .where(inArray(comments.id, ids));
  const postIds = [...new Set(rows.map((r) => Number(r.postId)))];
  const visiblePosts = await viewerCanSee(String(viewerId || ""), postIds);
  const allowed = new Set<number>();
  let forbidden = false;
  for (const r of rows) {
    if (visiblePosts.has(Number(r.postId))) allowed.add(Number(r.id));
    else forbidden = true;
  }
  return { allowed, forbidden };
}

export async function postExists(postId: unknown): Promise<boolean> {
  const id = Number(postId);
  if (!Number.isFinite(id)) return false;
  const db = await getDb();
  const rows = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, id)).limit(1);
  return rows.length > 0;
}
