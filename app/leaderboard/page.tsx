"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Trophy, Medal } from "lucide-react";
import { getLeaderboard } from "@/lib/dex-api";
import { fmtUsd } from "@/lib/markets";

type Leader = { trader: string; volume: number; trades: number };
const short = (a: string) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");

export default function LeaderboardPage() {
  const { address } = useAccount();
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = () =>
      getLeaderboard()
        .then((d) => alive && setLeaders(d.leaders || []))
        .catch(() => {})
        .finally(() => alive && setLoading(false));
    load();
    const t = setInterval(load, 10000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const medal = (i: number) => (i === 0 ? "#facc15" : i === 1 ? "#cbd5e1" : i === 2 ? "#d97706" : null);

  return (
    <div className="mx-auto w-full max-w-4xl py-8">
      <div className="mb-6 flex items-center gap-3">
        <Trophy className="text-primary" size={26} />
        <div>
          <h1 className="text-2xl font-black text-foreground">Leaderboard</h1>
          <p className="text-sm text-foreground/50">Top traders by matched volume on the Veilex dark pool.</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#080b12]">
        <div className="grid grid-cols-[60px_1fr_1fr_120px] gap-2 border-b border-white/5 px-4 py-3 text-[11px] uppercase tracking-wide text-white/40">
          <span>Rank</span>
          <span>Trader</span>
          <span className="text-right">Volume</span>
          <span className="text-right">Trades</span>
        </div>

        {loading ? (
          <p className="py-12 text-center text-white/30">Loading…</p>
        ) : leaders.length === 0 ? (
          <p className="py-12 text-center text-white/30">No trades yet — be the first on the board.</p>
        ) : (
          leaders.map((l, i) => {
            const mine = address && l.trader.toLowerCase() === address.toLowerCase();
            const m = medal(i);
            return (
              <div
                key={l.trader}
                className="grid grid-cols-[60px_1fr_1fr_120px] items-center gap-2 border-b border-white/5 px-4 py-3 font-mono text-sm"
                style={{ background: mine ? "rgba(166,242,74,0.06)" : undefined }}
              >
                <span className="flex items-center gap-1">
                  {m ? <Medal size={16} style={{ color: m }} /> : <span className="text-white/40">#{i + 1}</span>}
                </span>
                <span className="text-white/85">
                  {short(l.trader)}
                  {mine && <span className="ml-2 rounded bg-primary/20 px-1.5 py-0.5 text-[10px] text-primary">YOU</span>}
                </span>
                <span className="text-right text-primary">{fmtUsd(l.volume)}</span>
                <span className="text-right text-white/60">{l.trades.toLocaleString()}</span>
              </div>
            );
          })
        )}
      </div>
      <p className="mt-4 text-center text-[11px] text-white/30">
        Volume is total matched notional (both sides of each fill). Updates every 10s.
      </p>
    </div>
  );
}
