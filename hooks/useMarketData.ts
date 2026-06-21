"use client";

import { useEffect, useRef, useState } from "react";
import { fetchPythPrices, fetchPyth24hAgo } from "@/lib/pyth";

export type MarketDatum = { price: number; change24h: number; prevDayPrice: number };

/**
 * Live market data for a set of Pyth feed ids. Polls Hermes every `intervalMs`
 * for the latest price and fetches the 24h-ago price once for change %.
 * Returns a map keyed by 0x-lowercased feed id.
 */
export function useMarketData(feedIds: string[], intervalMs = 4000) {
  const [data, setData] = useState<Record<string, MarketDatum>>({});
  const prevDay = useRef<Record<string, number>>({});
  const key = feedIds.join(",");

  useEffect(() => {
    let alive = true;

    const loadBaseline = async () => {
      const ago = await fetchPyth24hAgo(feedIds);
      if (alive) prevDay.current = ago;
    };

    const tick = async () => {
      try {
        const latest = await fetchPythPrices(feedIds);
        if (!alive) return;
        setData((prev) => {
          const next = { ...prev };
          for (const [id, p] of Object.entries(latest)) {
            const base = prevDay.current[id] || prev[id]?.prevDayPrice || p.price;
            next[id] = {
              price: p.price,
              prevDayPrice: base,
              change24h: base > 0 ? ((p.price - base) / base) * 100 : 0,
            };
          }
          return next;
        });
      } catch {
        /* keep last known */
      }
    };

    loadBaseline().then(tick);
    const t = setInterval(tick, intervalMs);
    return () => {
      alive = false;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, intervalMs]);

  return data;
}
