"use client";

import { PropsWithChildren, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { SuiClientProvider, WalletProvider, createNetworkConfig } from "@mysten/dapp-kit";
import "@mysten/dapp-kit/dist/index.css";
import { ThemeProvider } from "next-themes";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Toaster } from "sonner";
import { wagmiConfig } from "@/lib/wagmi";
import { SUI_NETWORK, SUI_RPC_URLS } from "@/lib/sui";

// Sui networks for @mysten/dapp-kit (kept for legacy Sui-only pages so the app
// keeps building during the EVM pivot; new Veilex flows use wagmi/RainbowKit).
const { networkConfig } = createNetworkConfig({
  testnet: { url: SUI_RPC_URLS.testnet, network: "testnet" },
  mainnet: { url: SUI_RPC_URLS.mainnet, network: "mainnet" },
  devnet: { url: SUI_RPC_URLS.devnet, network: "devnet" },
  localnet: { url: SUI_RPC_URLS.localnet, network: "localnet" },
});

const queryClient = new QueryClient();

export function Providers({ children }: PropsWithChildren) {
  // The wallet stack (RainbowKit) reads localStorage during render, which
  // crashes static prerendering on the server. Mount it client-side only.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        {mounted ? (
          // EVM / HashKey Chain — primary wallet layer
          <WagmiProvider config={wagmiConfig}>
            <RainbowKitProvider
              modalSize="compact"
              theme={darkTheme({
                accentColor: "#a6f24a",
                accentColorForeground: "#05080f",
                borderRadius: "small",
                overlayBlur: "small",
              })}
            >
              {/* Sui context retained for legacy pages */}
              <SuiClientProvider networks={networkConfig} defaultNetwork={SUI_NETWORK}>
                <WalletProvider autoConnect>
                  {children}
                  <Toaster position="top-right" theme="dark" />
                  <ToastContainer
                    position="top-right"
                    autoClose={5000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="light"
                  />
                </WalletProvider>
              </SuiClientProvider>
            </RainbowKitProvider>
          </WagmiProvider>
        ) : (
          // Pre-hydration placeholder (keeps layout height, no wallet code on server)
          <div className="min-h-dvh bg-background" aria-hidden />
        )}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
