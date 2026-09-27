import { NextResponse } from "next/server";
import { getAppSession } from "@/lib/authEnv";
import { getKV, setKV, initTables, updateKVAtomic } from "@/lib/db";
import { logAudit } from "@/lib/auditLog";
import { isUserBanned, bannedResponse } from "@/lib/banCheck";
import { enforceDmAntiSpam } from "@/lib/chatModeration";
import { rateLimitByUser } from "@/lib/rateLimit";
import { rejectIfIpBannedUnlessAdmin } from "@/lib/ipBan";
import { getClientIp } from "@/lib/requestIp";
import { touchUserLastIp } from "@/lib/userLastIp";
import {
  DM_REACTION_EMOJIS,
  isFromUser,
  isToUser,
  recipientBlockedSender,
  withDmIdentities,
  withReceiptIdentities,
  type DmMessage,
  type ReceiptMap,
} from "@/lib/dmHelpers";
import { findUserById, refFor, resolveUserId, usernameOf } from "@/lib/playerIdentity";
import { sanitizePlainText, sanitizeImageUrl } from "@/lib/sanitizer";

const MAX_TEXT_LENGTH = 2000;
const MAX_MESSAGES_PER_HOUR = 120;

export async function POST(req: Request) {
  const session = await getAppSession(req);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = String((session.user as { id?: string }).id || "");
  const currentHandle = String((session.user as { username?: string }).username || "");
  if (!userId) return NextResponse.json({ error: "Invalid session" }, { status: 400 });

  const ipBlock = await rejectIfIpBannedUnlessAdmin(req, userId, currentHandle);
  if (ipBlock) return ipBlock;

  const clientIp = getClientIp(req);
  touchUserLastIp(userId, clientIp).catch(() => {});

  if (await isUserBanned(currentHandle, userId)) {
    return bannedResponse();
  }

  const body: any = await req.json();
  const action = body?.action as string;

  await initTables();
  const registeredUsers = ((await getKV("registeredUsers")) as any[]) || [];
  // The account row is authoritative for the handle; the session cookie can be
  // a login behind, so every identity comparison below uses the stored handle.
  const myHandle = usernameOf(findUserById(registeredUsers, userId)) || currentHandle;
  const me = refFor(userId, myHandle);
  const directMessages = withDmIdentities(await getKV("directMessages"), registeredUsers);

  /** Recipient: a stable id, or a handle kept for older clients. */
  const resolveRecipient = (ref: unknown) => {
    const value = String(ref ?? "").trim();
    if (!value) return null;
    const id = resolveUserId(registeredUsers, value);
    if (!id) return null;
    return findUserById(registeredUsers, id) || { id, username: value, name: value };
  };

  if (action === "send") {
    const recipient = resolveRecipient(body?.toId ?? body?.to);
    const rawText = String(body?.text || "").trim();
    const rawImage = body?.image ? String(body.image).trim() : "";
    const text = sanitizePlainText(rawText, MAX_TEXT_LENGTH);
    const image = sanitizeImageUrl(rawImage);
    if (!recipient) return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
    if (!text && !image) return NextResponse.json({ error: "Missing message content" }, { status: 400 });
    if (rawText.length > MAX_TEXT_LENGTH) {
      return NextResponse.json({ error: "Message too long" }, { status: 400 });
    }
    if (String(recipient.id) === userId) {
      return NextResponse.json({ error: "You cannot message yourself" }, { status: 400 });
    }

    if (recipientBlockedSender(registeredUsers, userId, String(recipient.id))) {
      return NextResponse.json({ error: "This player has blocked you." }, { status: 403 });
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
      (m) => isFromUser(m, me) && m.timestamp >= hourAgo
    ).length;
    if (recentCount >= MAX_MESSAGES_PER_HOUR) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const message: DmMessage = {
      fromId: userId,
      toId: String(recipient.id),
      from: myHandle,
      to: usernameOf(recipient),
      text,
      timestamp: Date.now(),
      ...(image ? { image } : {}),
    };
    directMessages.push(message);
    // Appended inside the atomic helper: two people sending at the same moment
    // would otherwise race, and the slower write would drop the other's message.
    const appended = await updateKVAtomic<DmMessage[]>("directMessages", (raw) => {
      const current = withDmIdentities(raw, registeredUsers);
      current.push(message);
      return current;
    });
    if (!appended.ok) {
      return NextResponse.json({ error: "Could not send — try again." }, { status: 503 });
    }
    return NextResponse.json({ success: true, message });
  }

  if (action === "edit") {
    const timestamp = Number(body?.timestamp);
    const rawText = String(body?.text || "").trim();
    const text = sanitizePlainText(rawText, MAX_TEXT_LENGTH);
    if (!timestamp || !text) return NextResponse.json({ error: "Missing timestamp or text" }, { status: 400 });
    if (rawText.length > MAX_TEXT_LENGTH) {
      return NextResponse.json({ error: "Message too long" }, { status: 400 });
    }

    const edited = await updateKVAtomic<DmMessage[]>("directMessages", (raw) => {
      const current = withDmIdentities(raw, registeredUsers);
      const idx = current.findIndex((m) => m.timestamp === timestamp && isFromUser(m, me));
      if (idx === -1) return null;
      current[idx] = { ...current[idx], text, edited: true };
      return current;
    });
    if (!edited.ok) return NextResponse.json({ error: "Message not found" }, { status: 404 });

    const saved = edited.value.find((m) => m.timestamp === timestamp && isFromUser(m, me));
    return NextResponse.json({ success: true, message: saved });
  }

  if (action === "delete") {
    const timestamp = Number(body?.timestamp);
    if (!timestamp) return NextResponse.json({ error: "Missing timestamp" }, { status: 400 });

    const removed = await updateKVAtomic<DmMessage[]>("directMessages", (raw) => {
      const current = withDmIdentities(raw, registeredUsers);
      if (!current.some((m) => m.timestamp === timestamp && isFromUser(m, me))) return null;
      return current.filter((m) => !(m.timestamp === timestamp && isFromUser(m, me)));
    });
    if (!removed.ok) return NextResponse.json({ error: "Message not found" }, { status: 404 });

    await logAudit({
      action: "dm.delete",
      userId,
      handle: currentHandle,
      meta: { timestamp },
    });
    return NextResponse.json({ success: true });
  }

  /** Receipts are keyed by id: `readMessages[readerId][senderId] = [msgIds]`. */
  const applyReceipts = async (kind: "read" | "delivered") => {
    const peer = resolveRecipient(body?.fromId ?? body?.fromUsername);
    if (!peer) return NextResponse.json({ error: "Unknown sender" }, { status: 400 });
    const peerId = String(peer.id);

    const incoming = directMessages.filter((m) => isFromUser(m, refFor(peerId, usernameOf(peer))) && isToUser(m, me));
    const ids = incoming.map((m) => String(m.timestamp));

    // Each bucket is written on its own so two players marking receipts at the
    // same moment cannot roll each other's thread back to an older id list.
    const write = (key: "readMessages" | "deliveredMessages") =>
      updateKVAtomic<ReceiptMap>(key, (raw) => {
        const map = withReceiptIdentities(raw, registeredUsers);
        map[userId] ||= {};
        if (kind === "read") {
          map[userId][peerId] = ids;
        } else {
          const existing = new Set((map[userId][peerId] || []).map(String));
          for (const id of ids) existing.add(id);
          map[userId][peerId] = [...existing];
        }
        return map as ReceiptMap;
      });

    const [readOutcome, deliveredOutcome] = await Promise.all([write("readMessages"), write("deliveredMessages")]);
    if (!readOutcome.ok || !deliveredOutcome.ok) {
      return NextResponse.json({ error: "Could not save — try again." }, { status: 503 });
    }

    const readMessages = readOutcome.value;
    const deliveredMessages = deliveredOutcome.value;

    return NextResponse.json({
      success: true,
      ...(kind === "read"
        ? { readMessages: { [userId]: readMessages[userId] }, deliveredMessages: { [userId]: deliveredMessages[userId] } }
        : { deliveredMessages: { [userId]: deliveredMessages[userId] } }),
    });
  };

  if (action === "markRead") return applyReceipts("read");
  if (action === "markDelivered") return applyReceipts("delivered");

  if (action === "react") {
    const timestamp = Number(body?.timestamp);
    const emoji = String(body?.emoji || "");
    if (!timestamp || !emoji) return NextResponse.json({ error: "Missing timestamp or emoji" }, { status: 400 });
    if (!DM_REACTION_EMOJIS.includes(emoji as (typeof DM_REACTION_EMOJIS)[number])) {
      return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });
    }

    const reacted = await updateKVAtomic<DmMessage[]>("directMessages", (raw) => {
      const current = withDmIdentities(raw, registeredUsers);
      const idx = current.findIndex(
        (m) => m.timestamp === timestamp && (isFromUser(m, me) || isToUser(m, me))
      );
      if (idx === -1) return null;
      const reactions = { ...(current[idx].reactions || {}) };
      if (reactions[userId] === emoji) {
        delete reactions[userId];
      } else {
        reactions[userId] = emoji;
      }
      current[idx] = { ...current[idx], reactions };
      return current;
    });
    if (!reacted.ok) return NextResponse.json({ error: "Message not found" }, { status: 404 });

    const savedMsg = reacted.value.find(
      (m) => m.timestamp === timestamp && (isFromUser(m, me) || isToUser(m, me))
    );
    return NextResponse.json({ success: true, message: savedMsg });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
