import { defineChain } from 'viem'

export const hashkeyTestnet = defineChain({
  id: 133,
  name: 'HashKey Chain Testnet',
  nativeCurrency: { name: 'HSK', symbol: 'HSK', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet.hsk.xyz'], webSocket: ['wss://testnet.hsk.xyz/ws'] },
    public: { http: ['https://testnet.hsk.xyz'] },
  },
  blockExplorers: { default: { name: 'HSK Explorer', url: 'https://testnet-explorer.hsk.xyz' } },
  testnet: true,
})

export const hashkeyMainnet = defineChain({
  id: 177,
  name: 'HashKey Chain',
  nativeCurrency: { name: 'HSK', symbol: 'HSK', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://mainnet.hsk.xyz'], webSocket: ['wss://mainnet.hsk.xyz/ws'] },
    public: { http: ['https://mainnet.hsk.xyz'] },
  },
  blockExplorers: { default: { name: 'Blockscout', url: 'https://hashkey.blockscout.com' } },
})
