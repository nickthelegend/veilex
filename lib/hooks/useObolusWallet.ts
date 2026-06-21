// Thin wrapper over usePolarisWallet (wagmi/EVM) so consumers
// (sidebar-drawer, footer, connect-gate) keep a stable shape.
import { useDisconnect } from "wagmi";
import { usePolarisWallet } from "@/lib/hooks/usePolarisWallet";

export function useObolusWallet() {
  const { address, connected, connecting, networkId } = usePolarisWallet();
  const { disconnect } = useDisconnect();
  return {
    address,
    connected,
    connecting,
    networkId,
    disconnect: () => disconnect(),
  };
}
