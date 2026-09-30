import { NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import { getKV, initTables, updateKVAtomic } from "@/lib/db";
import { validateLobbies } from "@/lib/secureDataWrite";
import { addUserBan } from "@/lib/banCheck";
import { logAudit } from "@/lib/auditLog";
import { checkAndRecordOfferCreate, offerCreateLimitError } from "@/lib/offerDailyLimit";
import { getPosterStanding } from "@/lib/posterApproval";

export async function PATCH(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body: any = await req.json();
  const lobbyId = body?.lobbyId;
  const customBg = body?.customBg;
  if (!lobbyId || typeof customBg !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await initTables();
  const isAdmin = auth.user.role === "admin";
  const uid = String(auth.user.id);

  let abortReason: string | null = null;
  const res = await updateKVAtomic<any[]>("lobbies", (lobbies) => {
    const existing = Array.isArray(lobbies) ? lobbies : [];
    const idx = existing.findIndex((l: { id?: string }) => String(l.id) === String(lobbyId));
    if (idx === -1) {
      abortReason = "Lobby not found";
      return undefined;
    }
    const lobby = existing[idx] as { ownerId?: string };
    if (String(lobby.ownerId) !== uid && !isAdmin) {
      abortReason = "Forbidden";
      return undefined;
    }
    const updated = existing.map((l, i) => (i === idx ? { ...l, customBg } : l));
    return updated;
  });

  if (!res.ok) {
    const status = abortReason === "Lobby not found" ? 404 : 403;
    return NextResponse.json({ error: abortReason || "Could not update — try again." }, { status });
  }

  return NextResponse.json({ success: true });
}

export async function PUT(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body: any = await req.json();
  if (!Array.isArray(body?.lobbies)) {
    return NextResponse.json({ error: "Invalid lobbies" }, { status: 400 });
  }

  // Server-side merge: the client normally sends the full array it last saw.
  // Blindly replacing the store with that snapshot can silently erase lobbies
  // created by other users between the client's read and this write. Instead,
  // reconcile the incoming snapshot against the current store atomically:
  //   - keep any lobby the client did NOT send (concurrent additions)
  //   - upsert the lobbies the client DID send
  await initTables();
  const isAdmin = auth.user.role === "admin";
  const uid = String(auth.user.id);

  // Count the offers this write is introducing before touching the store, so the
  // posting gate and the anti-spam quota are charged for real creations and not
  // for the client re-sending a snapshot it already saw.
  const currentLobbies: any[] = (await getKV("lobbies")) || [];
  const currentIds = new Set(currentLobbies.map((l: any) => String(l?.id)));
  const creations = (body.lobbies as any[]).filter(
    (l) => l && l.id != null && !currentIds.has(String(l.id)) && String(l.ownerId) === uid
  );

  if (creations.length > 0) {
    const registeredUsers: any[] = (await getKV("registeredUsers")) || [];
    const me = registeredUsers.find((u) => String(u.id) === uid);
    const standing = await getPosterStanding(
      me,
      auth.user.role,
      currentLobbies.filter((l: any) => String(l?.ownerId) === uid).length
    );
    if (!standing.allowed) {
      return NextResponse.json(
        { error: "Posting is by approval only.", needsApproval: true, standing: standing.reason },
        { status: 403 }
      );
    }
    for (let i = 0; i < creations.length; i++) {
      const check = await checkAndRecordOfferCreate(uid, isAdmin);
      if (!check.ok) {
        return NextResponse.json({ error: offerCreateLimitError() }, { status: 429 });
      }
    }
  }

  let abortReason: string | null = null;
  let fraudAttempt: { userId: string; lobbyId: string } | null = null;
  const res = await updateKVAtomic<any[]>("lobbies", (current) => {
    const storeLobbies = Array.isArray(current) ? current : [];
    const mergedById = new Map<string, any>();
    for (const l of storeLobbies) {
      if (l && l.id != null) mergedById.set(String(l.id), l);
    }
    for (const l of body.lobbies) {
      if (l && l.id != null) mergedById.set(String(l.id), l);
    }
    // A signed-in user must not be able to rewrite a lobby they are not part
    // of — the merge above takes the client's copy of any id it names. Run the
    // same validator `POST /api/data` uses, so owner/participant scope, the
    // applicant self-scope and the payment-fraud guard all still apply.
    const check = validateLobbies(storeLobbies, [...mergedById.values()], uid, isAdmin);
    if (!check.ok) {
      abortReason = check.error;
      if (check.fraudAttempt) fraudAttempt = check.fraudAttempt;
      return undefined;
    }
    return check.value as any[];
  });

  const fraud = fraudAttempt as { userId: string; lobbyId: string } | null;
  if (fraud) {
    await addUserBan({
      id: auth.user.id,
      handle: auth.user.username,
      reason: "payment_fraud: attempted to mark a mission paid without another confirmed player",
    }).catch(() => {});
    await logAudit({
      action: "system.paymentFraud",
      userId: auth.user.id,
      handle: auth.user.username,
      meta: { lobbyId: fraud.lobbyId, reason: "permanent ban" },
    }).catch(() => {});
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: abortReason || "Could not save lobbies — please retry", ...(fraud ? { suspended: true } : {}) },
      { status: fraud || abortReason ? 403 : 409 }
    );
  }

  return NextResponse.json({ success: true });
}
