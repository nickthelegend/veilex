# Veilex

> Trade without a trace.

A **MEV-protected, privacy-first DEX** on HashKey Chain — a pro trading terminal backed by a shielded dark-pool matcher and live Pyth prices.

## Features
- **Pro trading terminal** (`/trade`) — TradingView chart, a **Dark Pool** panel (no public order book — orders stay encrypted until matched), order entry, and live positions/history.
- **Swap** (`/swap`) — MEV-protected token↔USDC swaps with live Pyth quotes.
- **Pools** (`/pools`) — liquidity pools; the ones deployed on-chain show **real TVL read from contract reserves** and link to the explorer.
- **Portfolio / Leaderboard** — your orders & fills, and a top-traders board, all from the real matcher.
- **MEV protection** — commit-reveal `VeilexVault` on-chain; the dark-pool matcher keeps resting orders shielded so bots can't front-run.

## Live on HashKey Chain testnet (133)
Addresses in [`../veilex-contracts/DEPLOYMENTS.md`](../veilex-contracts/DEPLOYMENTS.md): `VeilexFactory 0x83F4…5fd6`, `VeilexVault 0x57CD…Ad8f`, `dUSDC 0xc006…7e03`, + seeded SOL/WETH/WBTC pools.

## Stack
Next.js 15 (App Router) · wagmi + RainbowKit · viem · Pyth (Hermes prices + Benchmarks 24h) · MongoDB (matcher) · Tailwind

## Run
```bash
npm install
cp .env.example .env.local   # add MONGODB_URI + NEXT_PUBLIC_* addresses
npm run dev                  # http://localhost:3000/trade
```

Contracts live in [`../veilex-contracts`](../veilex-contracts).
