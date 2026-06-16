import { NextResponse } from "next/server";
import { getAppSession } from "@/lib/authEnv";
import { getKV, setKV, initTables } from "@/lib/db";
import { rateLimitByUser } from "@/lib/rateLimit";
import { isUserBanned, bannedResponse } from "@/lib/banCheck";
import { rejectIfIpBannedUnlessAdmin } from "@/lib/ipBan";
import { getClientIp } from "@/lib/requestIp";
import {
  enrichReviewWithProfile,
  resolveProfileDisplayName,
  resolveProfileImage,
} from "@/lib/profileImage";

export type LoungeMessage = {
  id: number;
  userId: string;
  userName: string;
  userImage: string;
  text: string;
  createdAt: number;
};

const KV_KEY = "clubLoungeChat";
const MAX_MESSAGES = 200;
const MAX_TEXT = 500;

function findUser(users: any[], userId: string) {
  return users.find((u) => String(u.id) === String(userId));
}

async function requireChatUser(req: Request) {
  const session = await getAppSession(req);
  if (!session?.user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const userId = (session.user as { id?: string }).id || "";
  const handle = (session.user as { username?: string }).username || "";

  const ipBlock = await rejectIfIpBannedUnlessAdmin(req, userId, handle);
  if (ipBlock) return { error: ipBlock };

  if (await isUserBanned(handle, userId)) {
    return { error: bannedResponse() };
  }

  await initTables();
  const users: any[] = (await getKV("registeredUsers")) || [];
  const profile = findUser(users, userId);

  return { session, userId, handle, profile };
}

export async function GET(req: Request) {
  const auth = await requireChatUser(req);
  if ("error" in auth && auth.error) return auth.error;

  const messages: LoungeMessage[] = (await getKV(KV_KEY)) || [];
  const users: any[] = (await getKV("registeredUsers")) || [];
  const enriched = messages
    .slice(-100)
    .map((m) => enrichReviewWithProfile(m, findUser(users, m.userId)));

  return NextResponse.json({ messages: enriched });
}

export async function POST(req: Request) {
  const auth = await requireChatUser(req);
  if ("error" in auth && auth.error) return auth.error;

  const { userId, session, profile } = auth;
  const rl = await rateLimitByUser(userId!, "club_lounge", 30, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Slow down — too many messages." }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const text = String(body?.text || "").trim().slice(0, MAX_TEXT);
  if (!text) return NextResponse.json({ error: "Message required" }, { status: 400 });

  const messages: LoungeMessage[] = (await getKV(KV_KEY)) || [];
  const entry = enrichReviewWithProfile(
    {
      id: Date.now(),
      userId: userId!,
      userName: resolveProfileDisplayName(profile, session!.user?.name || "Member"),
      userImage: profile
        ? resolveProfileImage(profile)
        : (session!.user as { image?: string }).image || "",
      text,
      createdAt: Date.now(),
    },
    profile
  );

  const next = [...messages, entry].slice(-MAX_MESSAGES);
  await setKV(KV_KEY, next);

  return NextResponse.json({ success: true, message: entry });
}
