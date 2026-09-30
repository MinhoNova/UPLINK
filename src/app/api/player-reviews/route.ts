import { NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import { getKV, initTables, updateKVAtomic } from "@/lib/db";
import {
  type PlayerReview,
  sanitizePlayerReviewText,
  sanitizePlayerRating,
  playerCanReviewLobby,
  lobbyParticipantIds,
  lobbyParticipantName,
  lobbyParticipantImage,
  averagePlayerRating,
  reviewCooldownError,
} from "@/lib/playerReviews";

export const dynamic = "force-dynamic";

async function loadReviews(): Promise<PlayerReview[]> {
  await initTables();
  const reviews = (await getKV("playerReviews")) || [];
  return Array.isArray(reviews) ? reviews : [];
}

export async function GET(req: Request) {
  // Reviews name their author and their subject and carry free text. They used
  // to be readable with no session at all, by anyone who knew a Discord id —
  // and ids are public, in the profiles and in the public roster. Reading what
  // people say about each other is not part of the public feed.
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const targetId = searchParams.get("targetId");
  const lobbyId = searchParams.get("lobbyId");

  const reviews = await loadReviews();
  const filtered = targetId
    ? reviews.filter((r) => String(r.targetId) === String(targetId))
    : lobbyId
      ? reviews.filter((r) => String(r.lobbyId) === String(lobbyId))
      : [];

  const sorted = [...filtered].sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  return NextResponse.json({
    reviews: sorted,
    average: averagePlayerRating(sorted),
    count: sorted.length,
  });
}

export async function POST(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const userId = String((auth.user as { id?: string }).id || "");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const lobbyId = String(body?.lobbyId || "");
  const targetId = String(body?.targetId || "");
  const rating = sanitizePlayerRating(body?.rating);
  const comment = sanitizePlayerReviewText(body?.comment);
  if (!lobbyId || !targetId) {
    return NextResponse.json({ error: "lobbyId and targetId required" }, { status: 400 });
  }
  if (String(targetId) === userId) {
    return NextResponse.json({ error: "You cannot review yourself" }, { status: 400 });
  }

  await initTables();
  const lobbies = (await getKV("lobbies")) || [];
  const lobby = lobbies.find((l: any) => String(l.id) === String(lobbyId));
  if (!lobby) return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  if (!playerCanReviewLobby(lobby, userId)) {
    return NextResponse.json(
      { error: "Reviews unlock after an offer completes or fails — participants only" },
      { status: 403 }
    );
  }
  if (!lobbyParticipantIds(lobby).includes(targetId)) {
    return NextResponse.json({ error: "You can only review a player from this offer's squad" }, { status: 403 });
  }

  const users = (await getKV("registeredUsers")) || [];
  const me = users.find((u: any) => String(u.id) === userId);
  const meName = String(me?.displayName || me?.name || me?.username || me?.discordDisplayName || "Operative");
  const meImage = String(me?.profileGif || me?.customAvatar || me?.avatar || me?.image || "");

  const targetName = lobbyParticipantName(lobby, targetId);
  const targetImage = lobbyParticipantImage(lobby, targetId);

  const lobbyTitle = String(
    lobby?.title || `${lobby?.serviceName || ""}${lobby?.runsCount ? ` ${lobby.runsCount}x` : ""}`.trim() || "Offer"
  );

  // The whole read-modify-write happens inside the atomic helper: two players
  // finishing offers at the same moment must not overwrite each other's review,
  // and the cooldown has to be judged against the list as it is at write time.
  const outcome = await updateKVAtomic<PlayerReview[]>("playerReviews", (raw) => {
    const reviews = Array.isArray(raw) ? raw : [];
    const blocked = reviewCooldownError(reviews, targetId, lobbyId);
    if (blocked) return null;

    const existingIdx = reviews.findIndex(
      (r) => String(r.reviewerId) === userId && String(r.targetId) === targetId && String(r.lobbyId) === lobbyId
    );

    const entry: PlayerReview = {
      id: existingIdx >= 0 ? reviews[existingIdx].id : `prv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      lobbyId,
      lobbyTitle,
      reviewerId: userId,
      reviewerName: meName,
      reviewerImage: meImage,
      targetId,
      targetName,
      rating,
      comment,
      createdAt: existingIdx >= 0 ? reviews[existingIdx].createdAt : Date.now(),
    };

    const next = existingIdx >= 0 ? [...reviews] : [...reviews];
    if (existingIdx >= 0) next[existingIdx] = entry;
    else next.push(entry);
    return next;
  });

  if (!outcome.ok) {
    const blocked =
      reviewCooldownError(await loadReviews(), targetId, lobbyId) ||
      "Could not save your review — try again.";
    return NextResponse.json({ error: blocked }, { status: 429 });
  }

  const saved = outcome.value.find(
    (r) =>
      String(r.reviewerId) === userId &&
      String(r.targetId) === targetId &&
      String(r.lobbyId) === lobbyId
  );

  return NextResponse.json({ success: true, review: saved });
}

export async function DELETE(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const userId = String((auth.user as { id?: string }).id || "");
  const isAdmin = (auth.user as any)?.role === "admin";

  const body: any = await req.json().catch(() => ({}));
  const id = String(body?.id || "");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const reviews = await loadReviews();
  const target = reviews.find((r) => r.id === id);
  if (!target) return NextResponse.json({ error: "Review not found" }, { status: 404 });
  if (!isAdmin && String(target.reviewerId) !== userId) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  const outcome = await updateKVAtomic<PlayerReview[]>("playerReviews", (raw) => {
    const list = Array.isArray(raw) ? raw : [];
    // Re-check ownership inside the write so a review deleted and re-added
    // between the read and here is not removed by a stale decision.
    const live = list.find((r) => r.id === id);
    if (!live) return null;
    if (!isAdmin && String(live.reviewerId) !== userId) return null;
    return list.filter((r) => r.id !== id);
  });
  if (!outcome.ok) return NextResponse.json({ error: "Review not found" }, { status: 404 });

  return NextResponse.json({ success: true });
}