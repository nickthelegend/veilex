import { TOKENS } from "@/lib/tokens";

// TradingView symbols for the live chart (real price history).
const TV: Record<string, string> = {
  WETH: "BINANCE:ETHUSDT",
  WBTC: "BINANCE:BTCUSDT",
  SOL: "BINANCE:SOLUSDT",
  BNB: "BINANCE:BNBUSDT",
  AVAX: "BINANCE:AVAXUSDT",
  MATIC: "BINANCE:MATICUSDT",
  ARB: "BINANCE:ARBUSDT",
  OP: "BINANCE:OPUSDT",
  LINK: "BINANCE:LINKUSDT",
  UNI: "BINANCE:UNIUSDT",
  AAVE: "BINANCE:AAVEUSDT",
  MKR: "BINANCE:MKRUSDT",
  CRV: "BINANCE:CRVUSDT",
  SNX: "BINANCE:SNXUSDT",
  LDO: "BINANCE:LDOUSDT",
  SUI: "BINANCE:SUIUSDT",
  APT: "BINANCE:APTUSDT",
  DOGE: "BINANCE:DOGEUSDT",
  PEPE: "BINANCE:PEPEUSDT",
  WIF: "BINANCE:WIFUSDT",
};

export type Market = {
  symbol: string;
  base: string;
  quote: string;
  pair: string;
  feedId: string;
  tv: string;
};

// Tradable markets = every token except the quote/stable/native assets, vs USDC.
const QUOTES = new Set(["USDC", "USDT", "DAI", "HSK"]);

export const MARKETS: Market[] = TOKENS.filter((t) => !QUOTES.has(t.symbol)).map((t) => ({
  symbol: t.symbol,
  base: t.symbol,
  quote: "USDC",
  pair: `${t.symbol}/USDC`,
  feedId: t.pythFeedId,
  tv: TV[t.symbol] || `PYTH:${t.symbol}USD`,
}));

export const MARKET_FEED_IDS = MARKETS.map((m) => m.feedId);

export function findMarket(symbol: string): Market {
  return MARKETS.find((m) => m.symbol === symbol) || MARKETS[0];
}

/** Display precision based on price magnitude. */
export function priceDecimals(price: number): number {
  if (price >= 1000) return 2;
  if (price >= 1) return 3;
  if (price >= 0.01) return 4;
  return 6;
}

export const fmtPrice = (p: number) =>
  p > 0 ? p.toLocaleString("en-US", { minimumFractionDigits: priceDecimals(p), maximumFractionDigits: priceDecimals(p) }) : "—";

export const fmtUsd = (n: number) => {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
};
