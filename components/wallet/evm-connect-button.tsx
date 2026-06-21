"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";

/**
 * EVM wallet connect for HashKey Chain, powered by RainbowKit but styled to
 * match the Veilex terminal aesthetic. Renders connect / wrong-network /
 * connected states.
 */
export function EvmConnectButton() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: { opacity: 0, pointerEvents: "none", userSelect: "none" },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button
                    onClick={openConnectModal}
                    variant="outline"
                    className="bg-primary/10 border-primary/20 text-primary font-mono text-[10px] tracking-widest uppercase hover:bg-primary/20 rounded-sm px-4 h-9"
                  >
                    CONNECT_VEILEX_WALLET
                  </Button>
                );
              }

              if (chain.unsupported) {
                return (
                  <Button
                    onClick={openChainModal}
                    variant="outline"
                    className="bg-red-500/10 border-red-500/30 text-red-400 font-mono text-[10px] tracking-widest uppercase hover:bg-red-500/20 rounded-sm px-4 h-9"
                  >
                    WRONG_NETWORK
                  </Button>
                );
              }

              return (
                <div className="flex items-center gap-2">
                  <button
                    onClick={openChainModal}
                    className="hidden sm:flex items-center gap-1.5 bg-white/5 border border-white/10 text-foreground/70 px-2.5 h-9 rounded-sm font-mono text-[9px] uppercase tracking-widest hover:border-primary/40 transition-colors"
                    title="Switch network"
                  >
                    <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                    {chain.name}
                  </button>
                  <button
                    onClick={openAccountModal}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 h-9 rounded-sm font-mono text-[10px] font-black tracking-tight transition-all active:scale-95 shadow-[0_0_15px_rgba(166,242,74,0.2)]"
                    title="Account"
                  >
                    <span className="size-1.5 bg-primary-foreground rounded-full" />
                    {account.displayName}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
