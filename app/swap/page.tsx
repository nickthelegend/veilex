"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";
import { ArrowDownUp, ShieldCheck, Loader2, ChevronDown } from "lucide-react";
import { MARKETS, MARKET_FEED_IDS, findMarket, priceDecimals, fmtPrice } from "@/lib/markets";
import { useMarketData } from "@/hooks/useMarketData";
import { submitOrder } from "@/lib/dex-api";

export default function SwapPage() {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const data = useMarketData(MARKET_FEED_IDS, 4000);

  const [symbol, setSymbol] = useState("SOL");
  const [dir, setDir] = useState<"buy" | "sell">("buy"); // buy = USDC→token, sell = token→USDC
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [pickOpen, setPickOpen] = useState(false);

  const market = findMarket(symbol);
  const price = data[market.feedId.toLowerCase()]?.price ?? 0;
  const FEE = 0.0025;
  const amt = Number(amount) || 0;

  const baseSize = dir === "buy" ? (price ? amt / price : 0) : amt;
  const out = dir === "buy" ? baseSize * (1 - FEE) : amt * price * (1 - FEE);
  const fromSym = dir === "buy" ? "USDC" : symbol;
  const toSym = dir === "buy" ? symbol : "USDC";

  const swap = async () => {
    if (!isConnected || !address) return openConnectModal?.();
    if (!amt || !price) return;
    setBusy(true);
    try {
      const { order, fills } = await submitOrder({ pair: market.pair, side: dir, type: "market", price: 0, size: baseSize, trader: address });
      const filled = (fills || []).reduce((s: number, f: { size: number }) => s + f.size, 0);
      if (filled > 0) {
        const ap = order.avgPrice || price;
        toast.success("Swap filled", { description: `${dir === "buy" ? "Bought" : "Sold"} ${filled.toFixed(4)} ${symbol} @ avg ${ap.toFixed(priceDecimals(ap || 1))} USDC` });
      } else {
        toast.message("No liquidity yet", { description: "No resting orders to fill. Place a limit order on Trade to seed the book." });
      }
      setAmount("");
    } catch (e) {
      toast.error("Swap failed", { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md py-12">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-black text-foreground">Swap</h1>
        <span className="flex items-center gap-1 text-xs text-primary"><ShieldCheck size={13} /> MEV-Protected</span>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#080b12] p-4">
        {/* From */}
        <TokenRow
          label="You pay"
          token={fromSym}
          amount={amount}
          editable
          onAmount={setAmount}
          onPick={fromSym === "USDC" ? undefined : () => setPickOpen(true)}
        />

        <div className="my-2 flex justify-center">
          <button onClick={() => setDir((d) => (d === "buy" ? "sell" : "buy"))} className="rounded-lg border border-white/10 bg-white/5 p-2 text-primary hover:bg-white/10">
            <ArrowDownUp size={16} />
          </button>
        </div>

        {/* To */}
        <TokenRow
          label="You receive (est.)"
          token={toSym}
          amount={out ? out.toLocaleString("en-US", { maximumFractionDigits: 6 }) : ""}
          onPick={toSym === "USDC" ? undefined : () => setPickOpen(true)}
        />

        <div className="mt-4 space-y-1.5 border-t border-white/5 pt-3 text-[12px]">
          <Row label="Rate" value={price ? `1 ${symbol} = ${fmtPrice(price)} USDC` : "—"} />
          <Row label="Fee" value="0.25%" />
          <Row label="Route" value="Dark pool · commit-reveal" />
        </div>

        <button
          onClick={swap}
          disabled={busy || (!!isConnected && (!amt || !price))}
          className="mt-4 w-full rounded-xl py-3.5 text-sm font-bold transition disabled:opacity-50"
          style={{ background: "#a6f24a", color: "#05080f" }}
        >
          {busy ? <Loader2 className="mx-auto animate-spin" size={18} /> : !isConnected ? "Connect Wallet" : `Swap ${fromSym} → ${toSym}`}
        </button>
      </div>

      {pickOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setPickOpen(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#0b0f17] p-3 shadow-2xl">
            <p className="mb-2 px-2 text-sm font-bold text-white">Select token</p>
            <div className="max-h-[360px] overflow-y-auto">
              {MARKETS.map((m) => {
                const d = data[m.feedId.toLowerCase()];
                return (
                  <button key={m.symbol} onClick={() => { setSymbol(m.symbol); setPickOpen(false); }} className="flex w-full items-center justify-between rounded-lg px-2 py-2.5 hover:bg-white/5">
                    <span className="flex items-center gap-2 font-semibold text-white">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[10px] text-primary">{m.symbol.slice(0, 2)}</span>
                      {m.symbol}
                    </span>
                    <span className="font-mono text-sm text-white/60">{d ? fmtPrice(d.price) : "—"}</span>
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

function TokenRow({ label, token, amount, editable, onAmount, onPick }: { label: string; token: string; amount: string; editable?: boolean; onAmount?: (v: string) => void; onPick?: () => void }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
      <div className="mb-1 text-[11px] uppercase tracking-wide text-white/35">{label}</div>
      <div className="flex items-center gap-2">
        <input
          value={amount}
          onChange={(e) => onAmount?.(e.target.value)}
          readOnly={!editable}
          type={editable ? "number" : "text"}
          placeholder="0.00"
          className="w-full bg-transparent font-mono text-xl text-white outline-none"
        />
        <button onClick={onPick} disabled={!onPick} className="flex items-center gap-1 rounded-lg bg-white/8 px-3 py-1.5 text-sm font-bold text-white disabled:opacity-80">
          {token}
          {onPick && <ChevronDown size={14} />}
        </button>
      </div>
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/40">{label}</span>
      <span className="text-white/75">{value}</span>
    </div>
  );
}
