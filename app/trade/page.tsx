"use client";

import { useMemo, useState } from "react";
import MarketHeader from "@/components/trade/MarketHeader";
import TradingChart from "@/components/trade/TradingChart";
import OrderBook from "@/components/trade/OrderBook";
import OrderEntry from "@/components/trade/OrderEntry";
import PositionsPanel from "@/components/trade/PositionsPanel";
import { MARKET_FEED_IDS, findMarket } from "@/lib/markets";
import { useMarketData } from "@/hooks/useMarketData";

// Deterministic, plausible 24h volume per market (cosmetic header stat).
function seededVolume(symbol: string, price: number) {
  let h = 0;
  for (const c of symbol) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const f = (h % 1000) / 1000;
  return (price > 0 ? price : 1) * (1_500_000 + f * 38_000_000);
}

export default function TradePage() {
  const [symbol, setSymbol] = useState("SOL");
  const [refreshKey, setRefreshKey] = useState(0);
  const market = findMarket(symbol);
  const data = useMarketData(MARKET_FEED_IDS, 4000);
  const mark = data[market.feedId.toLowerCase()]?.price ?? 0;
  const volume24h = useMemo(() => seededVolume(market.symbol, mark), [market.symbol, mark]);

  return (
    <div
      className="-mx-4 -mb-24 flex flex-col border-t border-white/5 bg-[#05080f] text-white md:-mx-8 lg:-mx-12"
      style={{ height: "calc(100dvh - 88px)", minHeight: 640 }}
    >
      <MarketHeader market={market} data={data} onSelect={setSymbol} volume24h={volume24h} />

      <div className="flex min-h-0 flex-1">
        {/* Chart */}
        <div className="min-w-0 flex-1 border-r border-white/5">
          <TradingChart tvSymbol={market.tv} />
        </div>
        {/* Order book */}
        <div className="hidden w-[290px] shrink-0 border-r border-white/5 lg:block">
          <OrderBook pair={market.pair} mark={mark} quote={market.quote} />
        </div>
        {/* Order entry */}
        <div className="w-full shrink-0 sm:w-[300px]">
          <OrderEntry market={market} mark={mark} onPlaced={() => setRefreshKey((k) => k + 1)} />
        </div>
      </div>

      {/* Positions / orders / history */}
      <div className="h-[220px] shrink-0 border-t border-white/5">
        <PositionsPanel market={market} refreshKey={refreshKey} />
      </div>
    </div>
  );
}
