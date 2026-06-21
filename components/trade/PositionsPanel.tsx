"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { toast } from "sonner";
import { getMyOrders, getFills, cancelOrder } from "@/lib/dex-api";
import { priceDecimals, type Market } from "@/lib/markets";

type Tab = "orders" | "history" | "balances";
type Order = { _id: string; pair: string; side: string; type: string; price: number; size: number; remaining: number; status: string };
type Fill = { pair: string; price: number; size: number; side: string; taker: string; maker: string; createdAt: string };

export default function PositionsPanel({ market, refreshKey }: { market: Market; refreshKey: number }) {
  const { address, isConnected } = useAccount();
  const [tab, setTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [fills, setFills] = useState<Fill[]>([]);
  const { data: native } = useBalance({ address });

  const load = useCallback(async () => {
    if (!address) {
      setOrders([]);
      setFills([]);
      return;
    }
    try {
      const [o, f] = await Promise.all([getMyOrders(address, market.pair), getFills(market.pair)]);
      setOrders((o.orders || []).filter((x: Order) => x.status === "open"));
      setFills(
        (f.fills || []).filter(
          (x: Fill) => x.taker?.toLowerCase() === address.toLowerCase() || x.maker?.toLowerCase() === address.toLowerCase(),
        ),
      );
    } catch {
      /* ignore */
    }
  }, [address, market.pair]);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load, refreshKey]);

  const cancel = async (id: string) => {
    if (!address) return;
    try {
      await cancelOrder(id, address);
      toast.success("Order cancelled");
      load();
    } catch (e) {
      toast.error("Cancel failed", { description: e instanceof Error ? e.message : String(e) });
    }
  };

  const tabs: [Tab, string][] = [
    ["orders", `Open Orders (${orders.length})`],
    ["history", "Trade History"],
    ["balances", "Balances"],
  ];

  return (
    <div className="flex h-full flex-col bg-[#080b12] text-[12px]">
      <div className="flex items-center gap-5 border-b border-white/5 px-4 py-2">
        {tabs.map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} className={`font-semibold ${tab === t ? "text-[#a6f24a]" : "text-white/40"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
        {!isConnected ? (
          <Empty>Connect a wallet to view your orders & balances</Empty>
        ) : tab === "orders" ? (
          orders.length === 0 ? (
            <Empty>No open orders</Empty>
          ) : (
            <table className="w-full font-mono">
              <thead className="text-[10px] uppercase text-white/35">
                <tr className="text-left">
                  <th className="py-1">Market</th><th>Side</th><th>Type</th><th className="text-right">Price</th><th className="text-right">Size</th><th className="text-right">Remaining</th><th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id} className="border-t border-white/5 text-white/80">
                    <td className="py-1.5">{o.pair}</td>
                    <td style={{ color: o.side === "buy" ? "#0ecb81" : "#f6465d" }}>{o.side.toUpperCase()}</td>
                    <td className="capitalize text-white/50">{o.type}</td>
                    <td className="text-right">{o.price ? o.price.toFixed(priceDecimals(o.price)) : "MKT"}</td>
                    <td className="text-right">{o.size}</td>
                    <td className="text-right">{o.remaining}</td>
                    <td className="text-right">
                      <button onClick={() => cancel(o._id)} className="rounded bg-white/5 px-2 py-0.5 text-[11px] text-[#f6465d] hover:bg-white/10">Cancel</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : tab === "history" ? (
          fills.length === 0 ? (
            <Empty>No trade history</Empty>
          ) : (
            <table className="w-full font-mono">
              <thead className="text-[10px] uppercase text-white/35">
                <tr className="text-left"><th className="py-1">Market</th><th>Side</th><th className="text-right">Price</th><th className="text-right">Size</th><th className="text-right">Time</th></tr>
              </thead>
              <tbody>
                {fills.map((f, i) => (
                  <tr key={i} className="border-t border-white/5 text-white/80">
                    <td className="py-1.5">{f.pair}</td>
                    <td style={{ color: f.side === "buy" ? "#0ecb81" : "#f6465d" }}>{f.side.toUpperCase()}</td>
                    <td className="text-right">{f.price.toFixed(priceDecimals(f.price))}</td>
                    <td className="text-right">{f.size}</td>
                    <td className="text-right text-white/40">{new Date(f.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          <div className="flex flex-col gap-2 font-mono">
            <div className="flex items-center justify-between rounded-md bg-white/[0.03] px-3 py-2">
              <span className="text-white/60">HSK (gas)</span>
              <span className="text-white/85">{native ? Number(native.formatted).toFixed(4) : "0.0000"} HSK</span>
            </div>
            <p className="px-1 text-[11px] text-white/30">Spot balances settle on HashKey Chain. Connect dUSDC via the faucet to trade size.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="flex h-full min-h-[80px] items-center justify-center text-center text-white/30">{children}</div>;
}
