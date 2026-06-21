"use client";

import { useEffect, useRef } from "react";

/**
 * TradingView Advanced Chart embed — real candlestick history for the market's
 * mapped symbol (e.g. BINANCE:SOLUSDT). Same chart engine Phoenix uses.
 */
export default function TradingChart({ tvSymbol }: { tvSymbol: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = "";
    const container = document.createElement("div");
    container.className = "tradingview-widget-container__widget";
    container.style.height = "100%";
    container.style.width = "100%";
    el.appendChild(container);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: "60",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      hide_top_toolbar: false,
      hide_side_toolbar: false,
      allow_symbol_change: false,
      save_image: false,
      calendar: false,
      backgroundColor: "rgba(8,11,18,1)",
      gridColor: "rgba(255,255,255,0.05)",
      support_host: "https://www.tradingview.com",
    });
    el.appendChild(script);
  }, [tvSymbol]);

  return <div ref={ref} className="tradingview-widget-container h-full w-full" style={{ height: "100%", width: "100%" }} />;
}
