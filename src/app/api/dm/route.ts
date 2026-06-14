import { NextResponse } from "next/server";
import { getAppSession } from "@/lib/authEnv";
import { getKV, setKV, initTables } from "@/lib/db";
import { logAudit } from "@/lib/auditLog";
import { isUserBanned, bannedResponse } from "@/lib/banCheck";
import { enforceDmAntiSpam } from "@/lib/chatModeration";
import { rateLimitByUser } from "@/lib/rateLimit";
import { rejectIfIpBannedUnlessAdmin } from "@/lib/ipBan";
import { getClientIp } from "@/lib/requestIp";

const MAX_TEXT_LENGTH = 2000;
const MAX_MESSAGES_PER_HOUR = 120;

type DmMessage = {
  from: string;
  to: string;
  text: string;
  timestamp: number;
  edited?: boolean;
};

function getHandle(session: { user?: unknown }) {
  return (session.user as { username?: string })?.username || "";
}

function findOwnMessage(messages: DmMessage[], timestamp: number, from: string) {
  return messages.find((m) => m.timestamp === timestamp && m.from === from);
}

export async function POST(req: Request) {
  const session = await getAppSession(req);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id || "";
  const currentHandle = getHandle(session);
  if (!currentHandle) return NextResponse.json({ error: "Invalid session" }, { status: 400 });

  const ipBlock = await rejectIfIpBannedUnlessAdmin(req, userId, currentHandle);
  if (ipBlock) return ipBlock;

  const clientIp = getClientIp(req);

  if (await isUserBanned(currentHandle, userId)) {
    return bannedResponse();
  }

  const body = await req.json();
  const action = body?.action as string;

  await initTables();
  const directMessages: DmMessage[] = (await getKV("directMessages")) || [];
  const registeredUsers: { username?: string }[] = (await getKV("registeredUsers")) || [];

  if (action === "send") {
    const to = String(body?.to || "").trim();
    const text = String(body?.text || "").trim();
    if (!to || !text) return NextResponse.json({ error: "Missing to or text" }, { status: 400 });
    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json({ error: "Message too long" }, { status: 400 });
    }
    if (!registeredUsers.some((u) => u.username === to)) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
    }

    const spam = await enforceDmAntiSpam(userId, currentHandle, clientIp);
    if (!spam.ok) {
      return NextResponse.json(
        {
          error: spam.error,
          retryAfterMs: "retryAfterMs" in spam ? spam.retryAfterMs : undefined,
          suspended: "suspended" in spam ? spam.suspended : undefined,
        },
        { status: spam.status }
      );
    }

    const hourly = await rateLimitByUser(userId, "dm_hourly", 60, 60 * 60_000);
    if (!hourly.ok) {
      return NextResponse.json(
        { error: "Hourly message limit reached. Try again later.", retryAfterMs: hourly.retryAfterMs },
        { status: 429 }
      );
    }

    const hourAgo = Date.now() - 60 * 60 * 1000;
    const recentCount = directMessages.filter(
      (m) => m.from === currentHandle && m.timestamp >= hourAgo
    ).length;
    if (recentCount >= MAX_MESSAGES_PER_HOUR) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const message: DmMessage = { from: currentHandle, to, text, timestamp: Date.now() };
    directMessages.push(message);
    await setKV("directMessages", directMessages);
    return NextResponse.json({ success: true, message });
  }

  if (action === "edit") {
    const timestamp = Number(body?.timestamp);
    const text = String(body?.text || "").trim();
    if (!timestamp || !text) return NextResponse.json({ error: "Missing timestamp or text" }, { status: 400 });
    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json({ error: "Message too long" }, { status: 400 });
    }

    const idx = directMessages.findIndex(
      (m) => m.timestamp === timestamp && m.from === currentHandle
    );
    if (idx === -1) return NextResponse.json({ error: "Message not found" }, { status: 404 });

    directMessages[idx] = { ...directMessages[idx], text, edited: true };
    await setKV("directMessages", directMessages);
    return NextResponse.json({ success: true, message: directMessages[idx] });
  }

  if (action === "delete") {
    const timestamp = Number(body?.timestamp);
    if (!timestamp) return NextResponse.json({ error: "Missing timestamp" }, { status: 400 });

    const msg = findOwnMessage(directMessages, timestamp, currentHandle);
    if (!msg) return NextResponse.json({ error: "Message not found" }, { status: 404 });

    const next = directMessages.filter((m) => !(m.timestamp === timestamp && m.from === currentHandle));
    await setKV("directMessages", next);
    await logAudit({
      action: "dm.delete",
      userId: (session.user as { id?: string }).id || "",
      handle: currentHandle,
      meta: { timestamp },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
