import { NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import { getKV, initTables } from "@/lib/db";
import { getPosterStanding, submitPosterRequest, listPosterRequests } from "@/lib/posterApproval";
import { getOfferCreateUsage } from "@/lib/offerDailyLimit";

/** GET: this account's posting standing, its live request, and today's quota. */
export async function GET(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await initTables();
  const uid = String(auth.user.id);
  const [registeredUsers, lobbies, usage] = await Promise.all([
    getKV("registeredUsers") as Promise<any[]>,
    getKV("lobbies") as Promise<any[]>,
    getOfferCreateUsage(uid),
  ]);

  const users = registeredUsers || [];
  const me = users.find((u) => String(u.id) === uid) || null;
  const owned = (lobbies || []).filter((l: any) => String(l?.ownerId) === uid).length;
  const standing = await getPosterStanding(me, auth.user.role, owned);
  const requests = await listPosterRequests();
  const mine = requests.find((r) => String(r.userId) === uid) || null;

  return NextResponse.json(
    { standing, request: mine, usage, ownedOffers: owned },
    { headers: { "cache-control": "private, no-store" } }
  );
}

/** POST: ask an admin for permission to publish offers. */
export async function POST(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await initTables();
  const uid = String(auth.user.id);
  const registeredUsers: any[] = (await getKV("registeredUsers")) || [];
  const me = registeredUsers.find((u) => String(u.id) === uid) || null;
  const lobbies: any[] = (await getKV("lobbies")) || [];
  const owned = lobbies.filter((l: any) => String(l?.ownerId) === uid).length;

  const standing = await getPosterStanding(me, auth.user.role, owned);
  if (standing.allowed) {
    return NextResponse.json({ success: true, standing });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const res = await submitPosterRequest({
    userId: uid,
    handle: auth.user.username,
    discordName: String(body.discordName || "").trim().slice(0, 80) || undefined,
    note: String(body.note || "").trim().slice(0, 500),
  });

  if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.status });
  return NextResponse.json({ success: true, status: res.status });
}
