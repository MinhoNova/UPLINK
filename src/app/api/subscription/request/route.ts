import { NextResponse } from "next/server";
import { getAppSession } from "@/lib/authEnv";
import { getKV, setKV, initTables } from "@/lib/db";
import { TICKET_TTL_MS } from "@/lib/tickets";

const PRICES: Record<number, string> = {
  1: "$9.99",
  2: "$17.99",
  3: "$24.99",
};

export async function POST(req: Request) {
  const session = await getAppSession(req);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id || "";
  const body = await req.json();
  const months = Number(body.months);
  const days = Number(body.days) || months * 30;

  if (![1, 2, 3].includes(months)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  await initTables();
  const tickets: any[] = (await getKV("tickets")) || [];
  const ticketId = `shop_${Date.now()}_${userId.slice(-4)}`;
  const price = PRICES[months] || "Contact support";

  const now = Date.now();
  tickets.push({
    id: ticketId,
    userId,
    subject: `Secret Club — ${months} Month${months > 1 ? "s" : ""} (${price})`,
    status: "open",
    createdAt: now,
    expiresAt: now + TICKET_TTL_MS,
    messages: [
      {
        id: now,
        from: session.user.name || "User",
        fromId: userId,
        text: `I would like to purchase Secret Club membership for ${months} month(s) (${days} days) at ${price}. Please send payment instructions.`,
        time: new Date().toLocaleString(),
      },
    ],
  });

  await setKV("tickets", tickets);
  return NextResponse.json({ success: true, ticketId });
}
