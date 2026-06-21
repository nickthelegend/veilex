// Live prices from Pyth Hermes + 24h-ago prices from Pyth Benchmarks (both public).
const HERMES = process.env.NEXT_PUBLIC_PYTH_HERMES_URL || "https://hermes.pyth.network";
const BENCHMARKS = "https://benchmarks.pyth.network";

export type PythPrice = { price: number; conf: number; expo: number; publishTime: number };

const norm = (id: string) => "0x" + id.replace(/^0x/, "").toLowerCase();
const isRealFeed = (id?: string) => !!id && /[1-9a-f]/i.test(id.replace(/^0x/, "").replace(/0/g, ""));

function scale(raw: string | number, expo: number) {
  return Number(raw) * Math.pow(10, expo);
}

/** Latest prices for the given feed ids, keyed by 0x-prefixed lowercase id. */
export async function fetchPythPrices(feedIds: string[]): Promise<Record<string, PythPrice>> {
  const ids = feedIds.filter(isRealFeed);
  if (!ids.length) return {};
  const qs = ids.map((id) => `ids[]=${id}`).join("&");
  const res = await fetch(`${HERMES}/v2/updates/price/latest?${qs}&parsed=true`, { cache: "no-store" });
  if (!res.ok) throw new Error(`hermes ${res.status}`);
  const data = await res.json();
  const out: Record<string, PythPrice> = {};
  for (const p of data.parsed || []) {
    out[norm(p.id)] = {
      price: scale(p.price.price, p.price.expo),
      conf: scale(p.price.conf, p.price.expo),
      expo: p.price.expo,
      publishTime: p.price.publish_time,
    };
  }
  return out;
}

/** Prices ~24h ago, keyed the same way. Used for 24h change. */
export async function fetchPyth24hAgo(feedIds: string[]): Promise<Record<string, number>> {
  const ids = feedIds.filter(isRealFeed);
  if (!ids.length) return {};
  const ts = Math.floor(Date.now() / 1000) - 24 * 3600;
  const qs = ids.map((id) => `ids=${id}`).join("&");
  try {
    const res = await fetch(`${BENCHMARKS}/v1/updates/price/${ts}?${qs}&parsed=true`, { cache: "no-store" });
    if (!res.ok) return {};
    const data = await res.json();
    const out: Record<string, number> = {};
    for (const p of data.parsed || []) out[norm(p.id)] = scale(p.price.price, p.price.expo);
    return out;
  } catch {
    return {};
  }
}
