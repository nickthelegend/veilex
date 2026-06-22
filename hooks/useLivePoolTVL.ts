"use client";

import { useEffect, useState } from "react";
import { createPublicClient, http } from "viem";
import { activeChain } from "@/lib/evm";
import { LIVE_POOLS } from "@/lib/markets";

const RESERVES_ABI = [
  {
    type: "function",
    name: "getReserves",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint112" }, { type: "uint112" }, { type: "uint32" }],
  },
] as const;

/** Real on-chain TVL (USD) for the deployed pools, read from their reserves.
 *  TVL = 2 × dUSDC reserve (reserve1, 6dp), since a balanced pool holds equal value each side. */
export function useLivePoolTVL() {
  const [tvl, setTvl] = useState<Record<string, number>>({});

  useEffect(() => {
    let alive = true;
    const client = createPublicClient({ chain: activeChain, transport: http() });
    (async () => {
      const entries = Object.entries(LIVE_POOLS);
      const res = await Promise.all(
        entries.map(([sym, p]) =>
          client
            .readContract({ address: p.pool, abi: RESERVES_ABI, functionName: "getReserves" })
            .then((r) => [sym, (2 * Number((r as readonly bigint[])[1])) / 1e6] as const)
            .catch(() => [sym, 0] as const),
        ),
      );
      if (alive) setTvl(Object.fromEntries(res));
    })();
    return () => {
      alive = false;
    };
  }, []);

  return tvl;
}
