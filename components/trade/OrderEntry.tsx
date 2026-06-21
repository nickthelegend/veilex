"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";
import { ShieldCheck, Loader2 } from "lucide-react";
import { submitOrder } from "@/lib/dex-api";
import { priceDecimals, type Market } from "@/lib/markets";

export default function OrderEntry({ market, mark, onPlaced }: { market: Market; mark: number; onPlaced?: () => void }) {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [type, setType] = useState<"market" | "limit">("market");
  const [size, setSize] = useState("");
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);

  const px = type === "market" ? mark : Number(price) || 0;
  const sz = Number(size) || 0;
  const orderValue = px * sz;
  const fee = orderValue * 0.0025;
  const buy = side === "buy";
  const accent = buy ? "#0ecb81" : "#f6465d";

  const submit = async () => {
    if (!isConnected || !address) return openConnectModal?.();
    if (!sz || (type === "limit" && !Number(price))) return;
    setBusy(true);
    try {
      const { order, fills } = await submitOrder({
        pair: market.pair,
        side,
        type,
        price: Number(price) || 0,
        size: sz,
        trader: address,
      });
      const filled = (fills || []).reduce((s: number, f: { size: number }) => s + f.size, 0);
      if (filled > 0) {
        const ap = order.avgPrice || px;
        toast.success(`${buy ? "Bought" : "Sold"} ${filled} ${market.base}`, {
          description: `avg ${ap.toFixed(priceDecimals(ap || 1))} ${market.quote}${order.status === "open" ? ` · ${order.remaining} resting` : ""}`,
        });
      } else if (type === "market") {
        toast.message("No liquidity yet", { description: "No resting orders to fill. Place a limit order to seed the book." });
      } else {
        toast.success("Limit order placed", { description: `${side.toUpperCase()} ${sz} ${market.base} @ ${price} ${market.quote}` });
      }
      setSize("");
      onPlaced?.();
    } catch (e) {
      toast.error("Order failed", { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  };

  const Stat = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between py-1 text-[11px]">
      <span className="text-white/40">{label}</span>
      <span className="text-white/80">{value}</span>
    </div>
  );

  return (
    <div className="flex h-full flex-col gap-3 bg-[#080b12] p-3">
      <div className="flex items-center justify-between rounded-md bg-white/[0.04] px-3 py-2 text-[12px] text-white/70">
        <span>Spot</span>
        <span className="flex items-center gap-1 text-[#a6f24a]"><ShieldCheck size={12} /> MEV-Protected</span>
      </div>

      {/* Buy / Sell */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setSide("buy")}
          className="rounded-md py-2 text-[13px] font-bold transition"
          style={{ background: buy ? "#0ecb81" : "rgba(255,255,255,0.04)", color: buy ? "#04130c" : "rgba(255,255,255,0.55)" }}
        >
          Long / Buy
        </button>
        <button
          onClick={() => setSide("sell")}
          className="rounded-md py-2 text-[13px] font-bold transition"
          style={{ background: !buy ? "#f6465d" : "rgba(255,255,255,0.04)", color: !buy ? "#1a0507" : "rgba(255,255,255,0.55)" }}
        >
          Short / Sell
        </button>
      </div>

      {/* Market / Limit */}
      <div className="flex items-center gap-4 border-b border-white/5 text-[12px]">
        {(["market", "limit"] as const).map((t) => (
          <button key={t} onClick={() => setType(t)} className={`pb-2 font-semibold capitalize ${type === t ? "border-b-2 border-[#a6f24a] text-white" : "text-white/40"}`}>
            {t}
          </button>
        ))}
        <span className="ml-auto pb-2 font-mono text-white/50">{mark ? mark.toFixed(priceDecimals(mark)) : "—"} MID</span>
      </div>

      {type === "limit" && (
        <Field label={`Limit Price (${market.quote})`}>
          <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" placeholder={mark ? mark.toFixed(priceDecimals(mark)) : "0.00"} className="w-full bg-transparent text-right font-mono text-[15px] text-white outline-none" />
        </Field>
      )}

      <Field label="Order Size">
        <div className="flex items-center gap-2">
          <input value={size} onChange={(e) => setSize(e.target.value)} type="number" placeholder="0" className="w-full bg-transparent font-mono text-[15px] text-white outline-none" />
          <span className="rounded bg-white/5 px-2 py-1 text-[11px] font-bold text-white/70">{market.base}</span>
        </div>
        <div className="mt-1 text-right text-[11px] text-white/40">${orderValue ? orderValue.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "0.00"}</div>
      </Field>

      <div className="flex gap-4 text-[11px] text-white/45">
        <label className="flex items-center gap-1"><input type="checkbox" className="accent-[#a6f24a]" /> Reduce Only</label>
        <label className="flex items-center gap-1"><input type="checkbox" className="accent-[#a6f24a]" /> Post Only</label>
      </div>

      <button
        onClick={submit}
        disabled={busy}
        className="mt-1 rounded-md py-3 text-[14px] font-bold transition disabled:opacity-60"
        style={{ background: isConnected ? accent : "#a6f24a", color: isConnected ? (buy ? "#04130c" : "#1a0507") : "#05080f" }}
      >
        {busy ? <Loader2 className="mx-auto animate-spin" size={18} /> : !isConnected ? "Connect Wallet" : `${buy ? "Buy / Long" : "Sell / Short"} ${market.base}`}
      </button>

      <div className="mt-1 border-t border-white/5 pt-2">
        <Stat label="Expected Price" value={px ? `$${px.toFixed(priceDecimals(px))}` : "-"} />
        <Stat label="Order Value" value={`$${orderValue.toLocaleString("en-US", { maximumFractionDigits: 2 })}`} />
        <Stat label="Slippage" value="Est: - / Max: 1%" />
        <Stat label="Fee (0.25%)" value={`$${fee.toLocaleString("en-US", { maximumFractionDigits: 2 })}`} />
        <Stat label="Settlement" value="Commit-reveal" />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-white/8 bg-white/[0.02] px-3 py-2">
      <div className="mb-1 text-[10px] uppercase tracking-wide text-white/35">{label}</div>
      {children}
    </div>
  );
}
