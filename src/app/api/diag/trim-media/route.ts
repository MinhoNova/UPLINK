import { NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import { getKV, setKV } from "@/lib/db";
import { MAX_INLINE_IMAGE_BYTES } from "@/lib/inlineImage";

/**
 * Trim inline media that is already stored, which the paste-time downscale
 * cannot reach.
 *
 * Images pasted before that fix are still sitting in the `lobbies` blob as base64
 * data URLs, and every authenticated read has to parse the lot. That is what
 * keeps producing Error 1102 (worker out of memory) on pages that are otherwise
 * healthy, so this removes the stored copies rather than waiting for them to age
 * out on their own.
 *
 * What it does NOT do is resize them: the original pixels are gone, they were
 * only ever kept as a data URL. An image past the cap is dropped, and the
 * message that carried it is kept, because losing a chat message is far worse
 * than losing its picture.
 *
 * Admin only, and it reports exactly what it removed.
 */
export const dynamic = "force-dynamic";

const CHARS_PER_BYTE = 1.37; // base64 expands by 4/3
const CHAT_MEDIA_FIELDS = ["image", "avatar", "customAvatar", "profileGif", "activeVfx"] as const;
const LOBBY_MEDIA_FIELDS = ["image", "paymentProof"] as const;

const isOversized = (v: unknown, limit: number) => typeof v === "string" && v.startsWith("data:") && v.length > limit;

export async function POST(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: auth.status });
  }
  if (auth.user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const limit = Math.floor(MAX_INLINE_IMAGE_BYTES * CHARS_PER_BYTE);
    const lobbies = ((await getKV("lobbies")) as any[]) || [];
    const users = ((await getKV("registeredUsers")) as any[]) || [];

    let messagesTrimmed = 0;
    let fieldsTrimmed = 0;
    let avatarsTrimmed = 0;

    const nextLobbies = lobbies.map((lobby: any) => {
      let next = lobby;
      if (Array.isArray(next?.messages)) {
        let changed = false;
        const messages = next.messages.map((m: any) => {
          if (!m || typeof m !== "object") return m;
          let out = m;
          for (const field of CHAT_MEDIA_FIELDS) {
            if (!isOversized(out[field], limit)) continue;
            const { [field]: _drop, ...rest } = out;
            out = rest;
            messagesTrimmed++;
            changed = true;
          }
          return out;
        });
        if (changed) next = { ...next, messages };
      }
      for (const field of LOBBY_MEDIA_FIELDS) {
        if (!isOversized(next?.[field], limit)) continue;
        const { [field]: _drop, ...rest } = next;
        next = rest;
        fieldsTrimmed++;
      }
      return next;
    });

    const nextUsers = users.map((u: any) => {
      if (!u || typeof u !== "object") return u;
      let out = u;
      for (const field of CHAT_MEDIA_FIELDS) {
        if (!isOversized(out[field], limit)) continue;
        const { [field]: _drop, ...rest } = out;
        out = rest;
        avatarsTrimmed++;
      }
      return out;
    });

    const removed = messagesTrimmed + fieldsTrimmed + avatarsTrimmed;
    if (removed > 0) {
      if (fieldsTrimmed > 0 || messagesTrimmed > 0) await setKV("lobbies", nextLobbies);
      if (avatarsTrimmed > 0) await setKV("registeredUsers", nextUsers);
    }

    return NextResponse.json(
      { ok: true, removed, messagesTrimmed, fieldsTrimmed, avatarsTrimmed, limitBytes: MAX_INLINE_IMAGE_BYTES },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } }
    );
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
