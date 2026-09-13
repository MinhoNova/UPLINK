import { NextResponse } from "next/server";
import { getKV, getKVPairs, initTables, setKV } from "@/lib/db";
import { requireSession } from "@/lib/authz";
import { isAdminUser } from "@/lib/secureDataWrite";

/* Public: current site-wide animated background URL (empty = default scenic art). */
export async function GET() {
  try {
    const kv = await getKVPairs();
    return NextResponse.json({ vfx: String(kv.heroVfx ?? "") });
  } catch {
    return NextResponse.json({ vfx: "" });
  }
}

function isSafeStorageUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith("//")) return false;
  if (/^(https?:)?\/\//i.test(url)) return false;
  if (url.startsWith("/api/user/media?key=")) return true;
  /* Local-dev fallback files live under /user-avatars/ */
  if (url.startsWith("/user-avatars/")) return true;
  return false;
}

/* Admin-only write. The URL must be one of the admin's own uploaded Lobby Store
   backgrounds so arbitrary remote URLs can never be injected. Empty clears back
   to the default pinned artwork. */
export async function PUT(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (!isAdminUser(auth.user.id, auth.user.username)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const vfx = String((body as { vfx?: unknown }).vfx ?? "").trim();
  if (!vfx) {
    await setKV("heroVfx", "");
    return NextResponse.json({ ok: true, vfx: "" });
  }

  if (!isSafeStorageUrl(vfx)) {
    return NextResponse.json({ error: "Invalid background URL" }, { status: 400 });
  }

  await initTables();
  const users = (await getKV("registeredUsers")) || [];
  const owner = users.find((u: { id?: string }) => String(u.id) === String(auth.user.id));
  const owned = (Array.isArray(owner?.userVfx) ? owner.userVfx : []).some((e: unknown) => {
    const src =
      typeof e === "string" ? e : (e as { src?: unknown } | null)?.src;
    return String(src ?? "") === vfx;
  });
  if (!owned) {
    return NextResponse.json({ error: "Background not in your Lobby Store" }, { status: 403 });
  }

  await setKV("heroVfx", vfx);
  return NextResponse.json({ ok: true, vfx });
}