"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { hashkeyTestnet, hashkeyMainnet } from "@/lib/chains";

// WalletConnect project id — get one at https://cloud.walletconnect.com and set
// NEXT_PUBLIC_WC_PROJECT_ID. A non-empty placeholder keeps the build/dev server
// alive when it's not configured (injected wallets like MetaMask still work).
const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || "veilex_walletconnect_dev";

export const ACTIVE_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 133);

/**
 * RainbowKit + wagmi config for HashKey Chain.
 * Testnet (133) is the default; mainnet (177) is available for switching.
 */
export const wagmiConfig = getDefaultConfig({
  appName: "Veilex",
  appDescription: "Trade without a trace. MEV-protected privacy DEX on HashKey Chain.",
  projectId,
  chains: ACTIVE_CHAIN_ID === 177 ? [hashkeyMainnet, hashkeyTestnet] : [hashkeyTestnet, hashkeyMainnet],
  ssr: true,
});
