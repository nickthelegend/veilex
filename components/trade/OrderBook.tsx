"use client";

import { useEffect, useMemo, useState } from "react";
import { getBook, getFills } from "@/lib/dex-api";
import { priceDecimals } from "@/lib/markets";

type Level = { price: number; size: number; total: number; real: boolean };
type Tab = "book" | "trades";

// deterministic pseudo-random in [0,1) from a number (stable per price level)
function seeded(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}
const fmtSize = (n: number) => Math.round(n).toLocaleString("en-US");

export default function OrderBook({ pair, mark, quote = "USDC" }: { pair: string; mark: number; quote?: string }) {
  const [tab, setTab] = useState<Tab>("book");
  const [real, setReal] = useState<{ bids: { price: number; size: number }[]; asks: { price: number; size: number }[] }>({ bids: [], asks: [] });
  const [fills, setFills] = useState<{ price: number; size: number; side: string; createdAt: string }[]>([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [b, f] = await Promise.all([getBook(pair), getFills(pair)]);
        if (!alive) return;
        setReal({ bids: b.bids || [], asks: b.asks || [] });
        setFills(f.fills || []);
      } catch {
        /* offline → synthetic only */
      }
    };
    load();
    const t = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [pair]);

  const dec = priceDecimals(mark || 1);
  const tick = useMemo(() => Math.max(Math.pow(10, -dec), (mark || 1) * 0.00018), [mark, dec]);

  const { asks, bids, maxTotal } = useMemo(() => {
    if (!mark) return { asks: [] as Level[], bids: [] as Level[], maxTotal: 1 };
    const round = (p: number) => Number(p.toFixed(dec));
    const realBid = new Map(real.bids.map((b) => [round(b.price), b.size]));
    const realAsk = new Map(real.asks.map((a) => [round(a.price), a.size]));
    const N = 13;
    const a: Level[] = [];
    const b: Level[] = [];
    let ta = 0;
    let tb = 0;
    for (let i = 1; i <= N; i++) {
      const ap = round(mark + tick * i);
      const bp = round(mark - tick * i);
      const aSize = (210000 / i) * (0.45 + seeded(ap * 7)) + (realAsk.get(ap) || 0);
      const bSize = (210000 / i) * (0.45 + seeded(bp * 7)) + (realBid.get(bp) || 0);
      ta += aSize;
      tb += bSize;
      a.push({ price: ap, size: aSize, total: ta, real: realAsk.has(ap) });
      b.push({ price: bp, size: bSize, total: tb, real: realBid.has(bp) });
    }
    return { asks: a.reverse(), bids: b, maxTotal: Math.max(ta, tb) };
  }, [mark, tick, dec, real]);

  const spread = tick * 2;
  const spreadPct = mark ? (spread / mark) * 100 : 0;

  return (
    <div className="flex h-full flex-col bg-[#080b12] text-[11px]">
      {/* tabs */}
      <div className="flex items-center gap-4 border-b border-white/5 px-3 pt-2 text-[12px]">
        <button onClick={() => setTab("book")} className={`pb-2 font-semibold ${tab === "book" ? "border-b-2 border-[#a6f24a] text-white" : "text-white/40"}`}>Order Book</button>
        <button onClick={() => setTab("trades")} className={`pb-2 font-semibold ${tab === "trades" ? "border-b-2 border-[#a6f24a] text-white" : "text-white/40"}`}>Trades</button>
      </div>

      {tab === "book" ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="grid grid-cols-3 px-3 py-1.5 text-[10px] uppercase tracking-wide text-white/35">
            <span>Price {quote}</span>
            <span className="text-right">Size</span>
            <span className="text-right">Total</span>
          </div>

          {/* asks */}
          <div className="flex flex-1 flex-col justify-end overflow-hidden">
            {asks.map((l, i) => (
              <Row key={`a${i}`} l={l} max={maxTotal} dec={dec} color="#f6465d" />
            ))}
          </div>

          {/* spread / mark */}
          <div className="flex items-center justify-between border-y border-white/5 bg-white/[0.02] px-3 py-1.5">
            <span className="font-mono text-[13px] font-bold text-[#a6f24a]">{mark ? mark.toFixed(dec) : "—"}</span>
            <span className="text-white/40">Spread</span>
            <span className="text-white/60">{spreadPct.toFixed(3)}%</span>
          </div>

          {/* bids */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {bids.map((l, i) => (
              <Row key={`b${i}`} l={l} max={maxTotal} dec={dec} color="#0ecb81" />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="grid grid-cols-3 px-3 py-1.5 text-[10px] uppercase tracking-wide text-white/35">
            <span>Price</span>
            <span className="text-right">Size</span>
            <span className="text-right">Time</span>
          </div>
          {fills.length === 0 && <p className="px-3 py-6 text-center text-white/30">No trades yet</p>}
          {fills.map((f, i) => (
            <div key={i} className="grid grid-cols-3 px-3 py-1 font-mono">
              <span style={{ color: f.side === "buy" ? "#0ecb81" : "#f6465d" }}>{f.price.toFixed(dec)}</span>
              <span className="text-right text-white/70">{fmtSize(f.size)}</span>
              <span className="text-right text-white/40">{new Date(f.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ l, max, dec, color }: { l: Level; max: number; dec: number; color: string }) {
  const pct = Math.min(100, (l.total / max) * 100);
  return (
    <div className="relative grid grid-cols-3 px-3 py-[2px] font-mono hover:bg-white/[0.03]">
      <div className="absolute inset-y-0 right-0" style={{ width: `${pct}%`, background: `${color}14` }} />
      <span className="relative z-10" style={{ color }}>{l.price.toFixed(dec)}</span>
      <span className="relative z-10 text-right text-white/75">{Math.round(l.size).toLocaleString("en-US")}</span>
      <span className="relative z-10 text-right text-white/45">{Math.round(l.total).toLocaleString("en-US")}</span>
      {l.real && <span className="absolute left-0.5 top-1/2 z-10 h-1 w-1 -translate-y-1/2 rounded-full bg-[#a6f24a]" title="resting order" />}
    </div>
  );
}
