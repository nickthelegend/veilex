import { useAccount } from "wagmi";

// EVM wallet (wagmi / RainbowKit) on HashKey Chain. Returns the connected
// account so address-consuming UI across the app reflects the EVM wallet.
export function usePolarisWallet() {
  const { address, isConnected, isConnecting, chainId } = useAccount();
  return {
    address: address as string | undefined,
    connected: isConnected,
    connecting: isConnecting,
    networkId: chainId as number | undefined,
  };
}
