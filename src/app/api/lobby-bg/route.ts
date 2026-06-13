import { NextResponse } from "next/server";
import { getKV, setKV, initTables } from "@/lib/db";
import { requireAdmin } from "@/lib/authz";
import { rejectIfIpBanned } from "@/lib/ipBan";

export async function POST(request: Request) {
  const ipBlock = await rejectIfIpBanned(request);
  if (ipBlock) return ipBlock;

  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { action, url } = await request.json();
    await initTables();

    if (action === "setActive") {
      await setKV("activeLobbyBg", url);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const ipBlock = await rejectIfIpBanned(request);
  if (ipBlock) return ipBlock;

  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { url } = await request.json();
    await initTables();
    const lobbyBackgrounds = (await getKV("lobbyBackgrounds")) || [];
    const updated = lobbyBackgrounds.filter((bg: string) => bg !== url);
    await setKV("lobbyBackgrounds", updated);

    const active = await getKV("activeLobbyBg");
    if (active === url) {
      await setKV("activeLobbyBg", "");
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
