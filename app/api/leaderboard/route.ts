import { NextResponse } from "next/server";
import { getDexDb, isDexDbConfigured } from "@/lib/dex-db";
import { leaderboard } from "@/lib/matcher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/leaderboard → top traders by total matched volume (USDC notional)
export async function GET() {
  if (!isDexDbConfigured()) return NextResponse.json({ leaders: [] });
  try {
    const db = await getDexDb();
    const rows = await leaderboard(db, 50);
    return NextResponse.json({
      leaders: rows.map((r) => ({ trader: r._id, volume: r.volume, trades: r.trades })),
    });
  } catch {
    return NextResponse.json({ leaders: [] });
  }
}
