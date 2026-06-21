"use client";

import { usePublicClient } from "wagmi";
import { toast } from "sonner";
import type { Hash, TransactionReceipt } from "viem";
import { hskTxUrl, shortHash } from "./evm";

/**
 * Renders the clickable "confirmed" sonner card that opens the tx on the
 * HashKey Chain explorer. Used by useEvmTx and can be called directly when a
 * hash is already known.
 */
export function notifyTxConfirmed(label: string, hash: string) {
  const url = hskTxUrl(hash);
  toast.custom(
    (t) => (
      <div
        onClick={() => {
          window.open(url, "_blank", "noopener,noreferrer");
          toast.dismiss(t);
        }}
        className="cursor-pointer select-none w-[340px] rounded-xl border border-primary/30 bg-[#0d0f14] px-4 py-3 shadow-2xl hover:border-primary/60 transition-colors font-mono"
        role="button"
        title="Open on HSK Explorer"
      >
        <div className="flex items-center gap-2 text-primary text-[12px] font-black uppercase tracking-widest">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" /> {label} confirmed
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] text-foreground/50">
          <span className="truncate">tx {shortHash(hash)}</span>
          <span className="text-primary/70 font-bold">View on HSK Explorer ↗</span>
        </div>
      </div>
    ),
    { duration: 9000 },
  );
}

/**
 * useEvmTx — one hook for every on-chain interaction on HashKey Chain.
 *
 * Pass a `send` function that submits the tx and resolves to its hash (e.g.
 * `writeContractAsync(...)` or `sendTransactionAsync(...)`). The hook shows a
 * loading → waiting → success/error sonner toast, and on success renders a
 * CLICKABLE card that opens the tx on the HSK block explorer.
 *
 * Example:
 *   const runTx = useEvmTx();
 *   await runTx("Register stealth key", () =>
 *     writeContractAsync({ address, abi, functionName: "registerStealthMetaAddress", args }));
 */
export function useEvmTx() {
  const publicClient = usePublicClient();

  return async function runTx(
    label: string,
    send: () => Promise<Hash>,
  ): Promise<TransactionReceipt | undefined> {
    const toastId = toast.loading(`${label}…`, { description: "Confirm in your wallet" });
    try {
      const hash = await send();
      toast.loading(`${label}…`, { id: toastId, description: `Pending · ${shortHash(hash)}` });

      const receipt = await publicClient?.waitForTransactionReceipt({ hash });

      toast.dismiss(toastId);
      if (receipt && receipt.status === "reverted") {
        toast.error(`${label} reverted`, { description: `tx ${shortHash(hash)}` });
        return receipt;
      }
      notifyTxConfirmed(label, hash);
      return receipt;
    } catch (e) {
      const text = e instanceof Error ? e.message : String(e);
      toast.error(`${label} failed`, { id: toastId, description: text.slice(0, 140) });
      throw e;
    }
  };
}
