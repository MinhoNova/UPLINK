import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { getKV, setKV, initTables } from "@/lib/db";

export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await initTables();
  const users: Record<string, any>[] = (await getKV("registeredUsers")) || [];
  let reset = 0;

  const next = users.map((u) => {
    const copy = { ...u };
    let changed = false;
    for (const field of ["displayName", "customAvatar", "nameColor", "profileGif", "profileGifThumb"] as const) {
      if (Object.prototype.hasOwnProperty.call(copy, field)) {
        delete copy[field];
        changed = true;
      }
    }
    if (changed) reset++;
    return changed ? copy : u;
  });

  await setKV("registeredUsers", next);

  return NextResponse.json({ success: true, reset, users: next.length });
}