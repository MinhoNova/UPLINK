import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getKV, setKV, initTables } from "@/lib/db";
import { rateLimitByUser } from "@/lib/rateLimit";
import { requireSession } from "@/lib/authz";
import {
  enrichReviewWithProfile,
  resolveProfileDisplayName,
  resolveProfileImage,
} from "@/lib/profileImage";

export type SiteReview = {
  id: string;
  userId: string;
  userName: string;
  userImage: string;
  rating: number;
  text: string;
  createdAt: number;
};

function findUser(users: any[], userId: string) {
  return users.find((u) => String(u.id) === String(userId));
}

export async function GET() {
  await initTables();
  const reviews: SiteReview[] = (await getKV("siteReviews")) || [];
  const registeredUsers: any[] = (await getKV("registeredUsers")) || [];
  const sorted = [...reviews]
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((r) => enrichReviewWithProfile(r, findUser(registeredUsers, r.userId)));
  const avg =
    sorted.length > 0
      ? Math.round((sorted.reduce((s, r) => s + r.rating, 0) / sorted.length) * 10) / 10
      : 0;
  return NextResponse.json({ reviews: sorted, average: avg, count: sorted.length });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id || "";
  const rl = await rateLimitByUser(userId, "site_review", 3, 86_400_000);
  if (!rl.ok) return NextResponse.json({ error: "You can only submit 3 reviews per day" }, { status: 429 });

  const body = await req.json();
  const rating = Number(body.rating);
  const text = String(body.text || "").trim();

  if (!rating || rating < 0.5 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 0.5 and 5" }, { status: 400 });
  }
  if (!text || text.length < 10) {
    return NextResponse.json({ error: "Review must be at least 10 characters" }, { status: 400 });
  }
  if (text.length > 500) {
    return NextResponse.json({ error: "Review too long" }, { status: 400 });
  }

  await initTables();
  const reviews: SiteReview[] = (await getKV("siteReviews")) || [];
  const registeredUsers: any[] = (await getKV("registeredUsers")) || [];
  const profile = findUser(registeredUsers, userId);

  const existingIdx = reviews.findIndex((r) => r.userId === userId);
  const entry: SiteReview = enrichReviewWithProfile(
    {
      id: existingIdx >= 0 ? reviews[existingIdx].id : `rev_${Date.now()}`,
      userId,
      userName: resolveProfileDisplayName(profile, session.user.name || "Member"),
      userImage: profile
        ? resolveProfileImage(profile)
        : session.user.image || "",
      rating,
      text,
      createdAt: Date.now(),
    },
    profile
  );

  if (existingIdx >= 0) reviews[existingIdx] = entry;
  else reviews.push(entry);

  await setKV("siteReviews", reviews);
  return NextResponse.json({ success: true, review: entry });
}

export async function DELETE(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { reviewId } = await req.json();
  if (!reviewId) return NextResponse.json({ error: "reviewId required" }, { status: 400 });

  await initTables();
  const reviews: SiteReview[] = (await getKV("siteReviews")) || [];
  const target = reviews.find((r) => r.id === reviewId);
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = target.userId === auth.user.id;
  const isAdmin = auth.user.role === "admin";
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await setKV(
    "siteReviews",
    reviews.filter((r) => r.id !== reviewId)
  );
  return NextResponse.json({ success: true });
}
