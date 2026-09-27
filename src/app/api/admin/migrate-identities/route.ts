import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { getKV, initTables } from "@/lib/db";
import { backfillOnce } from "@/lib/identitySync";
import { findDuplicateUsernames } from "@/lib/playerIdentity";

/**
 * One-time repair for rows written before players were addressed by Discord id.
 *
 * Re-keys direct messages, read/delivered receipts and notifications onto the
 * stable snowflake, and reports any accounts that still share a handle (the
 * signature of a player who renamed and was re-registered as somebody new).
 * Safe to run more than once — nothing is written unless it actually differs,
 * and it also sets the marker that stops the automatic poll path from repeating
 * the work.
 *
 * POST only, deliberately: it mutates production data, so it must not be
 * reachable from a link prefetch.
 */
export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await initTables();
  const users = ((await getKV("registeredUsers")) as any[]) || [];
  const before = {
    users: users.length,
    messages: (((await getKV("directMessages")) as any[]) || []).length,
    notifications: (((await getKV("notifications")) as any[]) || []).length,
  };

  const rekeyed = await backfillOnce();
  const after = ((await getKV("registeredUsers")) as any[]) || [];
  const duplicates = findDuplicateUsernames(after).map((d) => ({
    username: d.username,
    userIds: d.ids,
  }));

  return NextResponse.json({
    success: true,
    before,
    rekeyed,
    duplicates,
  });
}
