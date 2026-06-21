// Veilex dark-pool order matcher (price-time priority) on MongoDB.
// Supports limit (GTC, rests) and market (IOC, never rests) orders.
import { ObjectId, type Db } from "mongodb";

export type Side = "buy" | "sell";
export type OrderType = "limit" | "market";

export interface OrderInput {
  pair: string; // e.g. "SOL/USDC"
  side: Side;
  type: OrderType;
  price: number; // ignored for market orders
  size: number; // base amount
  trader: string;
}

export interface OrderDoc extends Omit<OrderInput, "type"> {
  _id?: ObjectId;
  type: OrderType;
  remaining: number;
  filled: number;
  avgPrice: number;
  status: "open" | "filled" | "cancelled";
  createdAt: string;
}

export interface FillDoc {
  pair: string;
  price: number;
  size: number;
  side: Side; // taker side
  taker: string;
  maker: string;
  createdAt: string;
}

const ORDERS = "orders";
const FILLS = "fills";

export async function submitOrder(db: Db, input: OrderInput): Promise<{ order: OrderDoc; fills: FillDoc[] }> {
  const orders = db.collection<OrderDoc>(ORDERS);
  const fills = db.collection<FillDoc>(FILLS);
  const isMarket = input.type === "market";

  const trader = input.trader.toLowerCase();
  const taker: OrderDoc = {
    pair: input.pair,
    side: input.side,
    type: input.type,
    price: isMarket ? 0 : input.price,
    size: input.size,
    remaining: input.size,
    filled: 0,
    avgPrice: 0,
    trader,
    status: "open",
    createdAt: new Date().toISOString(),
  };
  const ins = await orders.insertOne(taker);
  taker._id = ins.insertedId;

  const oppSide: Side = input.side === "buy" ? "sell" : "buy";
  // Market crosses any price; limit respects the limit.
  const priceFilter = isMarket
    ? {}
    : input.side === "buy"
      ? { price: { $lte: input.price } }
      : { price: { $gte: input.price } };
  const sort: Record<string, 1 | -1> = input.side === "buy" ? { price: 1, createdAt: 1 } : { price: -1, createdAt: 1 };

  const made: FillDoc[] = [];
  let notional = 0;
  let guard = 0;
  while (taker.remaining > 0 && guard++ < 1000) {
    const maker = await orders.findOne(
      { pair: input.pair, side: oppSide, type: "limit", status: "open", remaining: { $gt: 0 }, ...priceFilter },
      { sort },
    );
    if (!maker || !maker._id) break;

    const qty = Math.min(taker.remaining, maker.remaining);
    const updated = await orders.findOneAndUpdate(
      { _id: maker._id, remaining: maker.remaining },
      { $inc: { remaining: -qty, filled: qty }, $set: { status: maker.remaining - qty <= 0 ? "filled" : "open" } },
      { returnDocument: "after" },
    );
    if (!updated) continue; // lost race, retry

    taker.remaining -= qty;
    taker.filled += qty;
    notional += qty * maker.price;

    const fill: FillDoc = {
      pair: input.pair,
      price: maker.price,
      size: qty,
      side: input.side,
      taker: trader,
      maker: maker.trader,
      createdAt: new Date().toISOString(),
    };
    await fills.insertOne(fill);
    made.push(fill);
  }

  taker.avgPrice = taker.filled > 0 ? notional / taker.filled : 0;
  // Limit leftovers rest; market leftovers are cancelled (IOC).
  taker.status = taker.remaining <= 0 ? "filled" : isMarket ? "cancelled" : "open";
  await orders.updateOne(
    { _id: taker._id },
    { $set: { remaining: taker.remaining, filled: taker.filled, avgPrice: taker.avgPrice, status: taker.status } },
  );

  return { order: taker, fills: made };
}

export async function getBook(db: Db, pair: string, depth = 14) {
  const open = await db
    .collection<OrderDoc>(ORDERS)
    .find({ pair, type: "limit", status: "open", remaining: { $gt: 0 } })
    .toArray();

  const level = (side: Side) => {
    const map = new Map<number, number>();
    for (const o of open) if (o.side === side) map.set(o.price, (map.get(o.price) ?? 0) + o.remaining);
    return [...map.entries()].map(([price, size]) => ({ price, size }));
  };
  const bids = level("buy").sort((a, b) => b.price - a.price).slice(0, depth);
  const asks = level("sell").sort((a, b) => a.price - b.price).slice(0, depth);
  return { pair, bids, asks };
}

export async function recentFills(db: Db, pair: string, limit = 30) {
  return db.collection<FillDoc>(FILLS).find({ pair }).sort({ createdAt: -1 }).limit(limit).toArray();
}

export async function ordersByTrader(db: Db, trader: string, pair?: string) {
  const q: Record<string, unknown> = { trader: trader.toLowerCase() };
  if (pair) q.pair = pair;
  return db.collection<OrderDoc>(ORDERS).find(q).sort({ createdAt: -1 }).limit(100).toArray();
}

export async function cancelOrder(db: Db, id: string, trader: string) {
  return db
    .collection<OrderDoc>(ORDERS)
    .findOneAndUpdate(
      { _id: new ObjectId(id), trader: trader.toLowerCase(), status: "open" },
      { $set: { status: "cancelled" } },
      { returnDocument: "after" },
    );
}

/** All fills involving a trader (as taker or maker), newest first, across pairs. */
export async function fillsByTrader(db: Db, trader: string, limit = 100) {
  const t = trader.toLowerCase();
  return db
    .collection<FillDoc>(FILLS)
    .find({ $or: [{ taker: t }, { maker: t }] })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

/** Volume leaderboard — total traded notional per address (both sides of each fill). */
export async function leaderboard(db: Db, limit = 50) {
  return db
    .collection<FillDoc>(FILLS)
    .aggregate([
      { $project: { vol: { $multiply: ["$size", "$price"] }, parties: ["$taker", "$maker"] } },
      { $unwind: "$parties" },
      { $group: { _id: "$parties", volume: { $sum: "$vol" }, trades: { $sum: 1 } } },
      { $sort: { volume: -1 } },
      { $limit: limit },
    ])
    .toArray();
}
