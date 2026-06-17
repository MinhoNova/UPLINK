import { NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import { getKV, setKV, initTables } from "@/lib/db";

export async function GET(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await initTables();
  const requests: any[] = (await getKV("boostRequests")) || [];
  return NextResponse.json({ requests });
}

export async function POST(req: Request) {
  const auth = await requireSession(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const { action, ...payload } = body;

  await initTables();
  const requests: any[] = (await getKV("boostRequests")) || [];

  if (action === "create") {
    const { type, faction, dungeonName, keyLevel, startLevel, endLevel, budget, budgetCurrency, notes } = payload;
    if (!type || !["leveling", "dungeon"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    if (!budget || budget <= 0) {
      return NextResponse.json({ error: "Invalid budget" }, { status: 400 });
    }
    const newRequest = {
      id: `br_${Date.now()}`,
      userId: String(auth.user.id),
      userName: auth.user.name || auth.user.username || "Operative",
      type,
      faction: type === "leveling" ? (faction === "horde" || faction === "alliance" ? faction : null) : null,
      startLevel: type === "leveling" ? (Number(startLevel) || 1) : null,
      endLevel: type === "leveling" ? (Number(endLevel) || 70) : null,
      dungeonName: type === "dungeon" ? (dungeonName || "") : null,
      keyLevel: type === "dungeon" ? (Number(keyLevel) || 0) : null,
      budget: Number(budget),
      budgetCurrency: budgetCurrency === "usd" ? "usd" : "gold",
      notes: notes || "",
      status: "open",
      bids: [],
      acceptedBidId: null,
      createdAt: Date.now(),
    };
    requests.unshift(newRequest);
    await setKV("boostRequests", requests);
    return NextResponse.json({ success: true, request: newRequest });
  }

  if (action === "bid") {
    const { requestId, amount, message } = payload;
    if (!requestId || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid bid" }, { status: 400 });
    }
    const idx = requests.findIndex((r) => r.id === requestId);
    if (idx === -1) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    const req2 = requests[idx];
    if (req2.status !== "open") return NextResponse.json({ error: "Request is closed" }, { status: 403 });
    if (String(req2.userId) === String(auth.user.id)) {
      return NextResponse.json({ error: "Cannot bid on your own request" }, { status: 403 });
    }
    const bid = {
      id: `bid_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: String(auth.user.id),
      userName: auth.user.name || auth.user.username || "Operative",
      amount: Number(amount),
      message: message || "",
      createdAt: Date.now(),
    };
    req2.bids.push(bid);
    requests[idx] = req2;
    await setKV("boostRequests", requests);
    return NextResponse.json({ success: true, bid });
  }

  if (action === "accept") {
    const { requestId, bidId } = payload;
    if (!requestId || !bidId) {
      return NextResponse.json({ error: "Missing requestId or bidId" }, { status: 400 });
    }
    const idx = requests.findIndex((r) => r.id === requestId);
    if (idx === -1) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    const req2 = requests[idx];
    if (String(req2.userId) !== String(auth.user.id)) {
      return NextResponse.json({ error: "Only the requester can accept bids" }, { status: 403 });
    }
    if (req2.status !== "open") return NextResponse.json({ error: "Request is already closed" }, { status: 403 });
    const bid = req2.bids.find((b: any) => b.id === bidId);
    if (!bid) return NextResponse.json({ error: "Bid not found" }, { status: 404 });
    req2.status = "accepted";
    req2.acceptedBidId = bidId;
    requests[idx] = req2;
    await setKV("boostRequests", requests);
    return NextResponse.json({ success: true, request: req2 });
  }

  if (action === "cancel") {
    const { requestId } = payload;
    if (!requestId) return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
    const idx = requests.findIndex((r) => r.id === requestId);
    if (idx === -1) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    const req2 = requests[idx];
    if (String(req2.userId) !== String(auth.user.id)) {
      return NextResponse.json({ error: "Only the requester can cancel" }, { status: 403 });
    }
    req2.status = "closed";
    requests[idx] = req2;
    await setKV("boostRequests", requests);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
