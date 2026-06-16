import { NextResponse } from "next/server";
import { getAppSession } from "@/lib/authEnv";
import { getKV, setKV, initTables } from "@/lib/db";
import { rateLimitByUser } from "@/lib/rateLimit";
import { isUserBanned, bannedResponse } from "@/lib/banCheck";
import { rejectIfIpBannedUnlessAdmin } from "@/lib/ipBan";
import {
  COMMUNITY_CHAT_REACTION_EMOJIS,
  type CommunityChatMessage,
  type CommunityChatReplyRef,
  replySnippet,
} from "@/lib/communityChat";
import {
  enrichReviewWithProfile,
  resolveProfileDisplayName,
  resolveProfileImage,
} from "@/lib/profileImage";

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

  return { session, userId, handle, profile, users };
}

function enrichMessages(messages: CommunityChatMessage[], users: any[]) {
  return messages.map((m) => enrichReviewWithProfile(m, findUser(users, m.userId)));
}

function parseReplyTo(body: any, messages: CommunityChatMessage[]): CommunityChatReplyRef | undefined {
  const raw = body?.replyTo;
  if (!raw || typeof raw !== "object") return undefined;
  const id = Number(raw.id);
  if (!id) return undefined;
  const parent = messages.find((m) => m.id === id);
  if (!parent) return undefined;
  return {
    id: parent.id,
    userId: String(parent.userId),
    userName: String(parent.userName || raw.userName || "Member"),
    text: replySnippet(parent.text || raw.text || ""),
  };
}

export async function GET(req: Request) {
  const auth = await requireChatUser(req);
  if ("error" in auth && auth.error) return auth.error;

  const messages: CommunityChatMessage[] = (await getKV(KV_KEY)) || [];
  const enriched = enrichMessages(messages.slice(-100), auth.users || []);

  return NextResponse.json({ messages: enriched });
}

export async function POST(req: Request) {
  const auth = await requireChatUser(req);
  if ("error" in auth && auth.error) return auth.error;

  const { userId, session, profile } = auth;
  const body = await req.json().catch(() => ({}));
  const messages: CommunityChatMessage[] = (await getKV(KV_KEY)) || [];

  if (body?.action === "react") {
    const rl = await rateLimitByUser(userId!, "club_lounge_react", 60, 60_000);
    if (!rl.ok) return NextResponse.json({ error: "Slow down." }, { status: 429 });

    const messageId = Number(body.messageId);
    const emoji = String(body.emoji || "");
    if (!messageId || !emoji) {
      return NextResponse.json({ error: "Missing messageId or emoji" }, { status: 400 });
    }
    if (!COMMUNITY_CHAT_REACTION_EMOJIS.includes(emoji as (typeof COMMUNITY_CHAT_REACTION_EMOJIS)[number])) {
      return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });
    }

    const idx = messages.findIndex((m) => m.id === messageId);
    if (idx === -1) return NextResponse.json({ error: "Message not found" }, { status: 404 });

    const msg = messages[idx];
    const reactions = { ...(msg.reactions || {}) };
    const uid = String(userId);
    if (reactions[uid] === emoji) delete reactions[uid];
    else reactions[uid] = emoji;

    messages[idx] = { ...msg, reactions };
    await setKV(KV_KEY, messages);
    return NextResponse.json({
      success: true,
      message: enrichReviewWithProfile(messages[idx], profile),
    });
  }

  const rl = await rateLimitByUser(userId!, "club_lounge", 30, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Slow down — too many messages." }, { status: 429 });

  const text = String(body?.text || "").trim().slice(0, MAX_TEXT);
  const image = String(body?.image || "").trim().slice(0, 2048);
  if (!text && !image) return NextResponse.json({ error: "Message required" }, { status: 400 });

  const replyTo = parseReplyTo(body, messages);

  const entry = enrichReviewWithProfile(
    {
      id: Date.now(),
      userId: userId!,
      userName: resolveProfileDisplayName(profile, session!.user?.name || "Member"),
      userImage: profile
        ? resolveProfileImage(profile)
        : (session!.user as { image?: string }).image || "",
      text,
      ...(image ? { image } : {}),
      ...(replyTo ? { replyTo } : {}),
      createdAt: Date.now(),
      reactions: {},
    },
    profile
  );

  const next = [...messages, entry].slice(-MAX_MESSAGES);
  await setKV(KV_KEY, next);

  return NextResponse.json({ success: true, message: entry });
}
