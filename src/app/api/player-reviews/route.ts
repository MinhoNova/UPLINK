import { NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import { getKV, setKV, initTables } from "@/lib/db";
import { rateLimitByUser } from "@/lib/rateLimit";
import {
  type PlayerReview,
  sanitizePlayerReviewText,
  sanitizePlayerRating,
  playerCanReviewLobby,
  lobbyParticipantIds,
  lobbyParticipantName,
  lobbyParticipantImage,
  averagePlayerRating,
} from "@/lib/playerReviews";

export const dynamic = "force-dynamic";

async function loadReviews(): Promise<PlayerReview[]> {
  await initTables();
  const reviews = (await getKV("playerReviews")) || [];
  return Array.isArray(reviews) ? reviews : [];
}

export async function GET(req: Request) {
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

  const rl = await rateLimitByUser(userId, "player_review", 25, 86_400_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many reviews — try again tomorrow" }, { status: 429 });

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

  const reviews = await loadReviews();
  const existingIdx = reviews.findIndex(
    (r) => String(r.reviewerId) === userId && String(r.targetId) === targetId && String(r.lobbyId) === lobbyId
  );

  const entry: PlayerReview = {
    id: existingIdx >= 0 ? reviews[existingIdx].id : `prv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    lobbyId,
    lobbyTitle: String(lobby?.title || `${lobby?.serviceName || ""}${lobby?.runsCount ? ` ${lobby.runsCount}x` : ""}`.trim() || "Offer"),
    reviewerId: userId,
    reviewerName: meName,
    reviewerImage: meImage,
    targetId,
    targetName,
    rating,
    comment,
    createdAt: existingIdx >= 0 ? reviews[existingIdx].createdAt : Date.now(),
  };

  const next = existingIdx >= 0 ? [...reviews] : reviews;
  if (existingIdx >= 0) next[existingIdx] = entry;
  else next.push(entry);
  await setKV("playerReviews", next);

  return NextResponse.json({ success: true, review: entry });
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

  await setKV(
    "playerReviews",
    reviews.filter((r) => r.id !== id)
  );
  return NextResponse.json({ success: true });
}