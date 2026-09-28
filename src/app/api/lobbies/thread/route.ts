import { NextResponse } from "next/server";
import { requireSession, isAdminUser } from "@/lib/authz";
import { initTables } from "@/lib/db";
import { loadOfferThread } from "@/lib/offerThread";

/**
 * One offer thread, and only what it needs. See `@/lib/offerThread` for why
 * this exists; the page shell loads the exact same payload server-side so the
 * thread renders without a loading screen, and this route keeps serving it for
 * refreshes and the 15s poll.
 */
export const dynamic = "force-dynamic";

/** A thread body is per-account private: it carries chat and applicant lists. */
const NO_STORE = {
  "Cache-Control": "private, no-store, max-age=0",
  Vary: "Cookie",
} as const;

export async function GET(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
  }

  try {
    await initTables();
    const url = new URL(req.url);
    const id = url.searchParams.get("id") || "";

    const admin = await isAdminUser(auth.user.id, auth.user.username);
    const result = await loadOfferThread(id, auth.user, admin);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status, headers: NO_STORE }
      );
    }
    return NextResponse.json(result.data, { headers: NO_STORE });
  } catch (error) {
    console.error("[thread] failed to read thread:", error);
    return NextResponse.json({ error: "Failed to load mission" }, { status: 500 });
  }
}
