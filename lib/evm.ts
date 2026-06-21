// EVM / HashKey Chain helpers — block-explorer URL builders and active chain.
import { hashkeyTestnet, hashkeyMainnet } from "@/lib/chains";

export const ACTIVE_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 133);

export const activeChain = ACTIVE_CHAIN_ID === 177 ? hashkeyMainnet : hashkeyTestnet;

/** Block-explorer base URL for the active chain (e.g. https://testnet-explorer.hsk.xyz). */
export const explorerBaseUrl =
  process.env.NEXT_PUBLIC_EXPLORER_URL ||
  activeChain.blockExplorers?.default.url ||
  "https://testnet-explorer.hsk.xyz";

/** Explorer URL for a transaction hash → https://testnet-explorer.hsk.xyz/tx/0x… */
export const hskTxUrl = (hash: string) => `${explorerBaseUrl}/tx/${hash}`;

/** Explorer URL for an address. */
export const hskAddressUrl = (address: string) => `${explorerBaseUrl}/address/${address}`;

/** Short form for a hash/address: 0x5cc1198198…b15b4388 */
export const shortHash = (h: string) => (h ? `${h.slice(0, 10)}…${h.slice(-6)}` : "");
