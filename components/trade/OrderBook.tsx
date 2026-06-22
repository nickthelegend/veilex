"use client";

import { useEffect, useMemo, useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { getBook, getFills } from "@/lib/dex-api";
import { priceDecimals } from "@/lib/markets";

type Tab = "shielded" | "trades";
const fmtSize = (n: number) => Math.round(n).toLocaleString("en-US");

/**
 * Dark-pool view (NOT a transparent order book — that would defeat the point).
 * Individual resting orders stay hidden; only the live mark, aggregate encrypted
 * interest (real, from the matcher), and executed trades are public.
 */
export default function OrderBook({ pair, mark, quote = "USDC" }: { pair: string; mark: number; quote?: string }) {
  const base = pair.split("/")[0];
  const [tab, setTab] = useState<Tab>("shielded");
  const [book, setBook] = useState<{ bids: { size: number }[]; asks: { size: number }[] }>({ bids: [], asks: [] });
  const [fills, setFills] = useState<{ price: number; size: number; side: string; createdAt: string }[]>([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [b, f] = await Promise.all([getBook(pair), getFills(pair)]);
        if (!alive) return;
        setBook({ bids: b.bids || [], asks: b.asks || [] });
        setFills(f.fills || []);
      } catch {
        /* offline */
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
  const { buySize, sellSize, resting } = useMemo(() => {
    const bs = book.bids.reduce((s, b) => s + b.size, 0);
    const ss = book.asks.reduce((s, a) => s + a.size, 0);
    return { buySize: bs, sellSize: ss, resting: book.bids.length + book.asks.length };
  }, [book]);

  return (
    <div className="flex h-full flex-col bg-[#080b12] text-[11px]">
      <div className="flex items-center gap-4 border-b border-white/5 px-3 pt-2 text-[12px]">
        <button onClick={() => setTab("shielded")} className={`pb-2 font-semibold ${tab === "shielded" ? "border-b-2 border-[#a6f24a] text-white" : "text-white/40"}`}>Dark Pool</button>
        <button onClick={() => setTab("trades")} className={`pb-2 font-semibold ${tab === "trades" ? "border-b-2 border-[#a6f24a] text-white" : "text-white/40"}`}>Trades</button>
        <span className="ml-auto flex items-center gap-1 pb-2 text-[10px] text-[#a6f24a]"><Lock size={11} /> Shielded</span>
      </div>

      {tab === "shielded" ? (
        <div className="flex min-h-0 flex-1 flex-col">
          {/* mark */}
          <div className="flex items-baseline justify-between px-3 py-3">
            <span className="font-mono text-[20px] font-bold text-[#a6f24a]">{mark ? mark.toFixed(dec) : "—"}</span>
            <span className="text-[10px] uppercase tracking-wide text-white/35">Mark · {quote}</span>
          </div>

          {/* privacy explainer */}
          <div className="mx-3 mb-3 flex gap-2 rounded-md border border-[#a6f24a]/20 bg-[#a6f24a]/[0.04] p-2.5">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#a6f24a]" />
            <p className="text-[10px] leading-relaxed text-white/55">
              Orders are committed as hashes and stay <strong className="text-white/80">encrypted until matched</strong>. There is no public book — bots can&apos;t see prices or sizes to front-run.
            </p>
          </div>

          {/* aggregate encrypted interest (real, no per-order reveal) */}
          <div className="px-3">
            <div className="mb-1 text-[10px] uppercase tracking-wide text-white/35">Encrypted interest (aggregate)</div>
            <Interest label="Buy" color="#0ecb81" size={buySize} base={base} />
            <Interest label="Sell" color="#f6465d" size={sellSize} base={base} />
          </div>

          {/* redacted depth — conveys hidden orders, deliberately not real sizes */}
          <div className="mt-3 flex-1 overflow-hidden px-3">
            <div className="flex flex-col gap-[3px] opacity-60">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Lock size={9} className="text-white/25" />
                  <div className="h-2 rounded-sm bg-white/[0.06]" style={{ width: `${30 + ((i * 37) % 60)}%` }} />
                  <span className="ml-auto font-mono text-white/20">••••</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/5 px-3 py-2 text-center text-[10px] text-white/35">
            {resting > 0 ? `${resting} order${resting === 1 ? "" : "s"} resting · all shielded` : "Pool is quiet — no resting orders"}
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

function Interest({ label, color, size, base }: { label: string; color: string; size: number; base: string }) {
  return (
    <div className="mb-1.5 flex items-center justify-between rounded-md bg-white/[0.03] px-2.5 py-2">
      <span className="flex items-center gap-1.5 font-semibold" style={{ color }}>
        <Lock size={11} /> {label} interest
      </span>
      <span className="font-mono text-white/70">{size > 0 ? `${Math.round(size).toLocaleString("en-US")} ${base}` : "— shielded"}</span>
    </div>
  );
}
