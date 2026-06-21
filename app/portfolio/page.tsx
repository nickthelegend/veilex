"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";
import { Wallet } from "lucide-react";
import { getMyOrdersAll, getMyFills, cancelOrder } from "@/lib/dex-api";
import { priceDecimals } from "@/lib/markets";

type Order = { _id: string; pair: string; side: string; type: string; price: number; size: number; remaining: number; status: string };
type Fill = { pair: string; price: number; size: number; side: string; createdAt: string };

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { data: native } = useBalance({ address });
  const [orders, setOrders] = useState<Order[]>([]);
  const [fills, setFills] = useState<Fill[]>([]);

  const load = useCallback(async () => {
    if (!address) return;
    try {
      const [o, f] = await Promise.all([getMyOrdersAll(address), getMyFills(address)]);
      setOrders((o.orders || []).filter((x: Order) => x.status === "open"));
      setFills(f.fills || []);
    } catch {
      /* ignore */
    }
  }, [address]);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

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

  if (!isConnected) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
        <Wallet className="text-primary/40" size={48} />
        <h1 className="text-xl font-black text-foreground">Your Portfolio</h1>
        <p className="text-sm text-foreground/50">Connect your wallet to see balances, open orders, and trade history.</p>
        <button onClick={() => openConnectModal?.()} className="rounded-md bg-primary px-5 py-2.5 text-sm font-bold text-black">Connect Wallet</button>
      </div>
    );
  }

  const Card = ({ label, value }: { label: string; value: string }) => (
    <div className="rounded-xl border border-white/10 bg-[#080b12] p-4">
      <p className="text-[11px] uppercase tracking-wide text-white/40">{label}</p>
      <p className="mt-1 font-mono text-lg text-foreground">{value}</p>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-5xl py-8">
      <h1 className="mb-1 text-2xl font-black text-foreground">Portfolio</h1>
      <p className="mb-6 font-mono text-xs text-foreground/40">{address}</p>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card label="HSK Balance" value={`${native ? Number(native.formatted).toFixed(4) : "0.0000"}`} />
        <Card label="Open Orders" value={String(orders.length)} />
        <Card label="Fills" value={String(fills.length)} />
        <Card label="Network" value="HashKey" />
      </div>

      <Section title="Open Orders">
        {orders.length === 0 ? (
          <Empty>No open orders</Empty>
        ) : (
          <Table head={["Market", "Side", "Type", "Price", "Size", "Remaining", ""]}>
            {orders.map((o) => (
              <tr key={o._id} className="border-t border-white/5 text-white/80">
                <td className="py-2">{o.pair}</td>
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
          </Table>
        )}
      </Section>

      <Section title="Trade History">
        {fills.length === 0 ? (
          <Empty>No trade history</Empty>
        ) : (
          <Table head={["Market", "Side", "Price", "Size", "Time"]}>
            {fills.map((f, i) => (
              <tr key={i} className="border-t border-white/5 text-white/80">
                <td className="py-2">{f.pair}</td>
                <td style={{ color: f.side === "buy" ? "#0ecb81" : "#f6465d" }}>{f.side.toUpperCase()}</td>
                <td className="text-right">{f.price.toFixed(priceDecimals(f.price))}</td>
                <td className="text-right">{f.size}</td>
                <td className="text-right text-white/40">{new Date(f.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </Table>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="mb-2 text-sm font-bold text-foreground/70">{title}</h2>
      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#080b12] p-1">{children}</div>
    </div>
  );
}
function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <table className="w-full px-3 font-mono text-sm">
      <thead className="text-[10px] uppercase text-white/35">
        <tr className="text-left">
          {head.map((h, i) => (
            <th key={i} className={`px-3 py-2 ${i >= 3 ? "text-right" : ""}`}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="px-3">{children}</tbody>
    </table>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <div className="flex h-20 items-center justify-center text-white/30">{children}</div>;
}
