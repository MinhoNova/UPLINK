import { NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import { getKV, setKV, deleteKV, initTables } from "@/lib/db";
import { isAdminUser, sanitizeUrlField, validateRegisteredUsers } from "@/lib/secureDataWrite";
import { DEFAULT_PROFILE_BANNER } from "@/lib/profileImage";

const SITE_DEFAULT_KEY = "siteDefaultBanner";

function isDefaultPosition(banner: unknown, prevDefault: unknown): boolean {
  if (typeof banner !== "string" || !banner.trim()) return true;
  if (prevDefault && banner === prevDefault) return true;
  return banner === DEFAULT_PROFILE_BANNER;
}

export async function POST(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!isAdminUser(auth.user.id, auth.user.username)) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const incoming = typeof body?.banner === "string" ? body.banner.trim() : "";
  const banner = sanitizeUrlField(incoming) || null;
  if (incoming && !banner) {
    return NextResponse.json({ error: "Invalid banner URL" }, { status: 400 });
  }

  await initTables();
  const users: Record<string, unknown>[] = (await getKV("registeredUsers")) || [];
  const prevDefault = (await getKV(SITE_DEFAULT_KEY)) as unknown;

  const updated = users.map((u) => {
    if (!isDefaultPosition(u.banner, prevDefault)) return u;
    if (banner) return { ...u, banner, bannerDisabled: false };
    const reset = { ...u } as Record<string, unknown>;
    delete reset.banner;
    delete reset.bannerDisabled;
    return reset;
  });

  const validation = validateRegisteredUsers(users, updated, auth.user.id, true);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 403 });
  }

  if (banner) await setKV(SITE_DEFAULT_KEY, banner);
  else await deleteKV(SITE_DEFAULT_KEY);
  await setKV("registeredUsers", validation.value as Record<string, unknown>[]);

  return NextResponse.json({ success: true, banner });
}