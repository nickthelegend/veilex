"use client";

import MarketSelector from "./MarketSelector";
import { fmtPrice, fmtUsd, type Market } from "@/lib/markets";
import type { MarketDatum } from "@/hooks/useMarketData";

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wide text-white/35">{label}</span>
      <span className="font-mono text-[13px]" style={{ color: color || "rgba(255,255,255,0.9)" }}>{value}</span>
    </div>
  );
}

export default function MarketHeader({
  market,
  data,
  onSelect,
  volume24h,
}: {
  market: Market;
  data: Record<string, MarketDatum>;
  onSelect: (s: string) => void;
  volume24h: number;
}) {
  const d = data[market.feedId.toLowerCase()];
  const price = d?.price ?? 0;
  const ch = d?.change24h ?? 0;

  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-2 border-b border-white/5 bg-[#080b12] px-4 py-2.5">
      <MarketSelector selected={market} data={data} onSelect={onSelect} />
      <Stat label="Mark" value={fmtPrice(price)} />
      <Stat label="Index" value={fmtPrice(price)} />
      <Stat label="24h Change" value={`${ch >= 0 ? "+" : ""}${ch.toFixed(2)}%`} color={ch >= 0 ? "#0ecb81" : "#f6465d"} />
      <Stat label="24h Volume" value={fmtUsd(volume24h)} />
      <Stat label="Oracle" value="Pyth" color="#a6f24a" />
      <Stat label="Taker Fee" value="0.25%" />
    </div>
  );
}
