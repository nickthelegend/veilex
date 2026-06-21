"use client";

import { useState } from "react";
import { Search, ChevronDown, Star } from "lucide-react";
import { MARKETS, fmtPrice, type Market } from "@/lib/markets";
import type { MarketDatum } from "@/hooks/useMarketData";

export default function MarketSelector({
  selected,
  data,
  onSelect,
}: {
  selected: Market;
  data: Record<string, MarketDatum>;
  onSelect: (symbol: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const list = MARKETS.filter((m) => `${m.symbol} ${m.pair}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-white/5">
        <span className="text-[19px] font-bold text-white">{selected.symbol}</span>
        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/60">/{selected.quote}</span>
        <ChevronDown size={16} className="text-white/50" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-50 mt-2 w-[540px] rounded-xl border border-white/10 bg-[#0b0f17] p-3 shadow-2xl">
            <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2.5">
              <Search size={15} className="text-white/40" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Markets" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30" />
            </div>
            <div className="mt-3 grid grid-cols-[1.6fr_1fr_1fr_1fr] px-2 text-[10px] uppercase tracking-wide text-white/35">
              <span>Market</span>
              <span className="text-right">Price</span>
              <span className="text-right">24h Change</span>
              <span className="text-right">Feed</span>
            </div>
            <div className="mt-1 max-h-[360px] overflow-y-auto">
              {list.map((m) => {
                const d = data[m.feedId.toLowerCase()];
                const ch = d?.change24h ?? 0;
                const live = !!d;
                return (
                  <button
                    key={m.symbol}
                    onClick={() => {
                      onSelect(m.symbol);
                      setOpen(false);
                    }}
                    className="grid w-full grid-cols-[1.6fr_1fr_1fr_1fr] items-center rounded-lg px-2 py-2.5 text-left hover:bg-white/5"
                  >
                    <span className="flex items-center gap-2">
                      <Star size={12} className="text-white/20" />
                      <span className="font-semibold text-white">{m.symbol}</span>
                      <span className="text-white/30">/{m.quote}</span>
                    </span>
                    <span className="text-right font-mono text-white/85">{d ? fmtPrice(d.price) : "—"}</span>
                    <span className="text-right font-mono" style={{ color: ch >= 0 ? "#0ecb81" : "#f6465d" }}>
                      {live ? `${ch >= 0 ? "+" : ""}${ch.toFixed(2)}%` : "—"}
                    </span>
                    <span className="text-right text-[10px] text-white/30">{live ? "Pyth" : "n/a"}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
