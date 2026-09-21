import { NextResponse } from "next/server";
import { getAppSession } from "@/lib/authEnv";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const result: Record<string, any> = {
    ok: true,
    time: new Date().toISOString(),
    d1: false,
    session: false,
    userCount: 0,
    lobbyCount: 0,
  };

  // Test 1: Check D1
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    let env: any;
    try {
      ({ env } = getCloudflareContext());
    } catch {
      ({ env } = await getCloudflareContext({ async: true }));
    }
    const d1 = env?.DB as D1Database | undefined;
    if (d1) {
      result.d1 = true;
      const { results } = await d1.prepare("SELECT COUNT(*) as c FROM kv_store").all();
      result.kvRows = results?.[0]?.c || 0;
      const users = await d1.prepare("SELECT value FROM kv_store WHERE key = 'registeredUsers'").first<{ value: string }>();
      if (users?.value) {
        try {
          const parsed = JSON.parse(users.value);
          result.userCount = Array.isArray(parsed) ? parsed.length : 0;
        } catch { result.userCount = -1; }
      }
      const lobbies = await d1.prepare("SELECT value FROM kv_store WHERE key = 'lobbies'").first<{ value: string }>();
      if (lobbies?.value) {
        try {
          const parsed = JSON.parse(lobbies.value);
          result.lobbyCount = Array.isArray(parsed) ? parsed.length : 0;
        } catch { result.lobbyCount = -1; }
      }
    } else {
      result.d1 = false;
    }
  } catch (e: any) {
    result.d1_error = e.message;
  }

  // Test 2: Check Session
  try {
    const session = await getAppSession(req).catch(() => null);
    if (session?.user) {
      result.session = true;
      result.userId = (session.user as any).id || "missing";
      result.username = (session.user as any).username || "missing";
    } else {
      result.session = false;
      result.session_reason = "no user in session";
    }
  } catch (e: any) {
    result.session = false;
    result.session_error = e.message;
  }

  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
