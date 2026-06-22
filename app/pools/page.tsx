"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { Droplets, Plus, ExternalLink } from "lucide-react";
import { MARKETS, MARKET_FEED_IDS, LIVE_POOLS, isLivePool, fmtUsd, fmtPrice } from "@/lib/markets";
import { useMarketData } from "@/hooks/useMarketData";
import { useLivePoolTVL } from "@/hooks/useLivePoolTVL";
import { hskAddressUrl } from "@/lib/evm";

function seed(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (h % 1000) / 1000;
}

export default function PoolsPage() {
  const data = useMarketData(MARKET_FEED_IDS, 6000);
  const liveTvl = useLivePoolTVL();

  const pools = useMemo(
    () =>
      MARKETS.map((m) => {
        const f = seed(m.symbol);
        const live = isLivePool(m.symbol);
        const onchainTvl = liveTvl[m.symbol];
        const tvl = live ? (onchainTvl ?? 0) : 250_000 + f * 4_200_000;
        const vol = (live ? tvl : tvl) * (0.08 + f * 0.55);
        const apr = 3 + f * 46;
        return { ...m, live, price: data[m.feedId.toLowerCase()]?.price ?? 0, tvl, vol, apr };
      }).sort((a, b) => Number(b.live) - Number(a.live) || b.tvl - a.tvl),
    [data, liveTvl],
  );

  const liveCount = pools.filter((p) => p.live).length;

  const addLiquidity = (pair: string, live: boolean) =>
    toast.message(`Add liquidity — ${pair}`, {
      description: live
        ? "Router UI lands next — pool is live on-chain; you can LP via VeilexRouter."
        : "This market isn't seeded on-chain yet (indicative). Live markets: SOL, WETH, WBTC.",
    });

  return (
    <div className="mx-auto w-full max-w-5xl py-8">
      <div className="mb-6 flex items-center gap-3">
        <Droplets className="text-primary" size={26} />
        <div>
          <h1 className="text-2xl font-black text-foreground">Liquidity Pools</h1>
          <p className="text-sm text-foreground/50">
            <span className="text-primary">{liveCount} pools live on-chain</span> (real reserves) · the rest are indicative until seeded. 0.25% fee to LPs.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#080b12]">
        <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr_0.8fr_120px] gap-2 border-b border-white/5 px-4 py-3 text-[11px] uppercase tracking-wide text-white/40">
          <span>Pool</span>
          <span className="text-right">Price</span>
          <span className="text-right">TVL</span>
          <span className="text-right">24h Vol</span>
          <span className="text-right">APR</span>
          <span></span>
        </div>
        {pools.map((p) => (
          <div key={p.symbol} className="grid grid-cols-[1.6fr_1fr_1fr_1fr_0.8fr_120px] items-center gap-2 border-b border-white/5 px-4 py-3 text-sm">
            <span className="flex items-center gap-2 font-semibold text-foreground">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[10px] text-primary">{p.symbol.slice(0, 2)}</span>
              {p.symbol} <span className="text-white/30">/ {p.quote}</span>
              {p.live ? (
                <a
                  href={hskAddressUrl(LIVE_POOLS[p.symbol].pool)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 inline-flex items-center gap-1 rounded bg-[#0ecb81]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#0ecb81] hover:bg-[#0ecb81]/25"
                  title="View pool on HSK explorer"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0ecb81]" /> Live <ExternalLink size={9} />
                </a>
              ) : (
                <span className="ml-1 rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white/35">Indicative</span>
              )}
            </span>
            <span className="text-right font-mono text-white/80">{p.price ? fmtPrice(p.price) : "—"}</span>
            <span className="text-right font-mono text-white/80">{p.live && p.tvl === 0 ? "…" : fmtUsd(p.tvl)}</span>
            <span className="text-right font-mono text-white/60">{fmtUsd(p.vol)}</span>
            <span className="text-right font-mono text-primary">{p.apr.toFixed(1)}%</span>
            <span className="text-right">
              <button onClick={() => addLiquidity(p.pair, p.live)} className="inline-flex items-center gap-1 rounded-md bg-primary/15 px-2.5 py-1 text-[11px] font-bold text-primary hover:bg-primary/25">
                <Plus size={12} /> Add
              </button>
            </span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-[11px] text-white/30">
        Live pools show <strong className="text-white/50">real on-chain reserves</strong> (TVL read from the contract). Indicative rows use placeholder stats; prices are live Pyth throughout.
      </p>
    </div>
  );
}
