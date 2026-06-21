"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { Droplets, Plus } from "lucide-react";
import { MARKETS, MARKET_FEED_IDS, fmtUsd, fmtPrice } from "@/lib/markets";
import { useMarketData } from "@/hooks/useMarketData";

function seed(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (h % 1000) / 1000;
}

export default function PoolsPage() {
  const data = useMarketData(MARKET_FEED_IDS, 6000);

  const pools = useMemo(
    () =>
      MARKETS.map((m) => {
        const f = seed(m.symbol);
        const tvl = 250_000 + f * 4_200_000;
        const vol = tvl * (0.08 + f * 0.55);
        const apr = 3 + f * 46;
        return { ...m, price: data[m.feedId.toLowerCase()]?.price ?? 0, tvl, vol, apr };
      }).sort((a, b) => b.tvl - a.tvl),
    [data],
  );

  const totalTvl = pools.reduce((s, p) => s + p.tvl, 0);

  const addLiquidity = (pair: string) =>
    toast.message(`Add liquidity — ${pair}`, {
      description: "Liquidity provision activates once VeilexRouter is deployed on HashKey Chain.",
    });

  return (
    <div className="mx-auto w-full max-w-5xl py-8">
      <div className="mb-6 flex items-center gap-3">
        <Droplets className="text-primary" size={26} />
        <div>
          <h1 className="text-2xl font-black text-foreground">Liquidity Pools</h1>
          <p className="text-sm text-foreground/50">
            Provide liquidity to Veilex AMM pools. Total TVL <span className="text-primary">{fmtUsd(totalTvl)}</span> · 0.25% fee to LPs.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#080b12]">
        <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr_0.8fr_120px] gap-2 border-b border-white/5 px-4 py-3 text-[11px] uppercase tracking-wide text-white/40">
          <span>Pool</span>
          <span className="text-right">Price</span>
          <span className="text-right">TVL</span>
          <span className="text-right">24h Vol</span>
          <span className="text-right">APR</span>
          <span></span>
        </div>
        {pools.map((p) => (
          <div key={p.symbol} className="grid grid-cols-[1.4fr_1fr_1fr_1fr_0.8fr_120px] items-center gap-2 border-b border-white/5 px-4 py-3 text-sm">
            <span className="flex items-center gap-2 font-semibold text-foreground">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[10px] text-primary">{p.symbol.slice(0, 2)}</span>
              {p.symbol} <span className="text-white/30">/ {p.quote}</span>
            </span>
            <span className="text-right font-mono text-white/80">{p.price ? fmtPrice(p.price) : "—"}</span>
            <span className="text-right font-mono text-white/80">{fmtUsd(p.tvl)}</span>
            <span className="text-right font-mono text-white/60">{fmtUsd(p.vol)}</span>
            <span className="text-right font-mono text-primary">{p.apr.toFixed(1)}%</span>
            <span className="text-right">
              <button onClick={() => addLiquidity(p.pair)} className="inline-flex items-center gap-1 rounded-md bg-primary/15 px-2.5 py-1 text-[11px] font-bold text-primary hover:bg-primary/25">
                <Plus size={12} /> Add
              </button>
            </span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-[11px] text-white/30">
        Prices are live from Pyth. Pool stats are illustrative until pools are seeded on HashKey Chain.
      </p>
    </div>
  );
}
