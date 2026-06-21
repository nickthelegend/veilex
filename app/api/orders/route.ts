import { NextResponse } from "next/server";
import { getDexDb, isDexDbConfigured } from "@/lib/dex-db";
import { submitOrder, getBook, recentFills, ordersByTrader, fillsByTrader, type Side, type OrderType } from "@/lib/matcher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/orders?pair=SOL/USDC            → { bids, asks }
// GET /api/orders?pair=SOL/USDC&view=fills → recent fills
// GET /api/orders?trader=0x..&pair=SOL/USDC → trader's orders
export async function GET(req: Request) {
  if (!isDexDbConfigured()) return NextResponse.json({ error: "MONGODB_URI not set" }, { status: 503 });
  const { searchParams } = new URL(req.url);
  const rawPair = searchParams.get("pair");
  const pair = rawPair || "SOL/USDC";
  const trader = searchParams.get("trader");
  const view = searchParams.get("view");

  const db = await getDexDb();
  if (trader && view === "fills") return NextResponse.json({ fills: await fillsByTrader(db, trader) });
  if (trader) return NextResponse.json({ orders: await ordersByTrader(db, trader, rawPair || undefined) });
  if (view === "fills") return NextResponse.json({ fills: await recentFills(db, pair) });
  return NextResponse.json(await getBook(db, pair));
}

// POST /api/orders  { pair, side, type, price, size, trader }
export async function POST(req: Request) {
  if (!isDexDbConfigured()) return NextResponse.json({ error: "MONGODB_URI not set" }, { status: 503 });
  let body: { pair?: string; side?: Side; type?: OrderType; price?: number; size?: number; trader?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const { pair, side, type = "limit", price, size, trader } = body;
  const isMarket = type === "market";
  if (
    !pair ||
    (side !== "buy" && side !== "sell") ||
    (!isMarket && !(Number(price) > 0)) ||
    !(Number(size) > 0) ||
    !trader
  ) {
    return NextResponse.json({ error: "invalid order" }, { status: 400 });
  }

  const db = await getDexDb();
  const result = await submitOrder(db, {
    pair,
    side,
    type,
    price: Number(price) || 0,
    size: Number(size),
    trader,
  });
  return NextResponse.json(result, { status: 201 });
}
