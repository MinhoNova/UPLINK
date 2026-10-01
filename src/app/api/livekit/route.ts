import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/authz';
import { isUserBanned, bannedResponse } from '@/lib/banCheck';
import { rejectIfIpBannedUnlessAdmin } from '@/lib/ipBan';
import { getKVPairs, initTables } from '@/lib/db';
import { validateVoiceAccess } from '@/lib/lobbyLifecycle';
import { enforceVoiceJoinRateLimit } from '@/lib/voiceJoinRateLimit';

export async function GET(req: NextRequest) {
  const auth = await requireSession(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const ipBlock = await rejectIfIpBannedUnlessAdmin(req, auth.user.id, auth.user.username);
  if (ipBlock) return ipBlock;

  if (await isUserBanned(auth.user.username, auth.user.id)) {
    return bannedResponse();
  }

  const room = req.nextUrl.searchParams.get('room');
  if (!room) {
    return NextResponse.json({ error: 'Missing room' }, { status: 400 });
  }

  // Before the blob read, not after it. `getKVPairs` below parses the whole
  // `kv_store` — every lobby, message, offer and user — and the middleware
  // allows 400 requests a minute on this path, so a caller being throttled for
  // joining voice too fast was still paying for a full parse on every attempt
  // before being told no. The join limiter exists to bound token minting; it
  // does not need the room contents to decide that.
  const voiceRl = await enforceVoiceJoinRateLimit(auth.user.id);
  if (!voiceRl.ok) {
    return NextResponse.json(
      { error: voiceRl.error, code: voiceRl.code, retryAfterMs: voiceRl.retryAfterMs },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(voiceRl.retryAfterMs / 1000)) } }
    );
  }

  await initTables();
  const data = await getKVPairs();
  const lobby = (data.lobbies || []).find((l: { id?: string }) => String(l.id) === String(room));
  const voiceCheck = validateVoiceAccess(lobby, auth.user.id);
  if (!voiceCheck.ok) {
    return NextResponse.json(
      { error: voiceCheck.error, code: voiceCheck.code },
      { status: voiceCheck.code === 'NOT_FOUND' ? 404 : 403 }
    );
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!apiKey || !apiSecret || !wsUrl) {
    return NextResponse.json(
      {
        error:
          'Voice is not configured. Add LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and NEXT_PUBLIC_LIVEKIT_URL to .env.local (get keys from cloud.livekit.io).',
      },
      { status: 503 }
    );
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: auth.user.id,
    name: auth.user.username,
  });

  at.addGrant({
    roomJoin: true,
    room,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return NextResponse.json({ token: await at.toJwt(), serverUrl: wsUrl });
}
