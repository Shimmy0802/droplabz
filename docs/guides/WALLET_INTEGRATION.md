# Wallet Integration Guide

## Overview

DropLabz uses the **Anza Wallet Adapter** for Solana wallet connection. This is the official, maintained wallet adapter from the Solana ecosystem.

- **Repository**: [https://github.com/anza-xyz/wallet-adapter](https://github.com/anza-xyz/wallet-adapter)
- **Documentation**: [https://github.com/anza-xyz/wallet-adapter/blob/main/APP.md](https://github.com/anza-xyz/wallet-adapter/blob/main/APP.md)

## Installation

All required wallet adapter packages are already in `package.json`:

```text
@solana/wallet-adapter-base
@solana/wallet-adapter-react
@solana/wallet-adapter-react-ui
@solana/wallet-adapter-wallets
@solana/web3.js
```

Install them with:

```bash
cd apps/web
pnpm install
```

## Architecture

The wallet system is built on a **3-layer provider pattern**:

```text
┌─ ConnectionProvider (RPC Endpoint) ─────────────┐
│  ┌─ WalletProvider (Wallet State) ───────────┐  │
│  │  ┌─ WalletModalProvider (UI Modal) ──────┐│  │
│  │  │  Your App with useWallet() hooks      ││  │
│  │  └─────────────────────────────────────────┘│  │
│  └────────────────────────────────────────────────┘
└──────────────────────────────────────────────────────┘
```

## Files

### Core Provider

- **File**: `apps/web/src/lib/wallet/WalletContextProvider.tsx`
- **Purpose**: Initializes the 3-layer provider setup
- **Auto-detects** wallets via Solana Wallet Standard
- **Auto-connects** to previously selected wallet

### Hooks

- **File**: `apps/web/src/lib/wallet/hooks.ts`
- **Exports**:
- `useWalletState()` — Get wallet connection status
- `useWalletConnect()` — Handle wallet connection
- `useRequireWallet()` — Ensure wallet is connected
- `useWalletConnection()` — Get RPC connection
- `useSelectedWallet()` — Access localStorage wallet selection

### Verification

- **File**: `apps/web/src/lib/solana/verification.ts`
- **Functions**:
    - `validateSolanaAddress()` — Validate Solana address
    - `verifyWalletSignature()` — Verify wallet signature
    - `verifyWalletOwnership()` — Ownership check helper

### Integration Point

- **File**: `apps/web/src/app/layout.tsx`
- **Status**: Already wrapped with `WalletContextProvider`
- **Effect**: Wallet is available throughout the entire app

## Usage Examples

### Get Wallet State

```tsx
import { useWalletState } from '@/lib/wallet';

export function MyComponent() {
    const { publicKey, connected, connecting } = useWalletState();

    if (connecting) return <div>Connecting...</div>;
    if (!connected) return <div>Not connected</div>;

    return <div>Connected: {publicKey?.toBase58()}</div>;
}
```

### Connect Wallet

```tsx
import { useWalletState } from '@/lib/wallet';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export function WalletButton() {
    return <WalletMultiButton />;
}
```

### Require Connected Wallet

```tsx
import { useRequireWallet } from '@/lib/wallet';

export function ProtectedComponent() {
    const publicKey = useRequireWallet(); // Throws if not connected
    return <div>Your wallet: {publicKey.toBase58()}</div>;
}
```

### Submit Entry with Wallet

```tsx
import { useWalletState } from '@/lib/wallet';

export async function submitEntry(eventId: string) {
    const { publicKey } = useWalletState();

    if (!publicKey) throw new Error('Wallet not connected');

    const response = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            eventId,
            walletAddress: publicKey.toBase58(),
        }),
    });

    return response.json();
}
```

## Environment Variables

Required in `.env`:

```bash
# Solana Network (devnet, testnet, or mainnet-beta)
NEXT_PUBLIC_SOLANA_NETWORK=devnet

# Optional: Custom RPC endpoint (defaults to QuickNode/Anza if not provided)
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

## Wallet Discovery

The system automatically discovers wallets that implement:

1. **Solana Wallet Standard** (modern wallets)
    - Phantom, OKX Wallet, Backpack, Brave Wallet, Shfl, Glow, etc.

2. **Mobile Wallet Adapter Protocol** (mobile apps)
    - Automatically detected on mobile devices

No manual wallet list configuration needed—Wallet Standard handles discovery.

## Wallet UI Components

From `@solana/wallet-adapter-react-ui`:

```tsx
// Multi-button with dropdown selection
<WalletMultiButton />

// Disconnect button (only shows when connected)
<WalletDisconnectButton />

// Manual wallet selection modal
<WalletModalProvider>
  <WalletSelectionModal />
</WalletModalProvider>
```

Styles are auto-imported from `@solana/wallet-adapter-react-ui/styles.css`.

## Security Notes

- ✅ **Never ask for seed phrases** — wallet adapter handles signing
- ✅ **Always verify wallet ownership server-side** before accepting entries
- ✅ **One entry per wallet per event** — enforced at API layer
- ✅ **Use signature challenges** for sensitive operations (future)
- ✅ **Check on-chain state** for token/NFT requirements (future)

## Troubleshooting

### "Cannot find module '@solana/wallet-adapter-react'"

→ Run `pnpm install` to install dependencies

### "Wallet not found"

→ Ensure wallet is installed in your browser
→ Check that `NEXT_PUBLIC_SOLANA_NETWORK` matches wallet network

### "Transaction failed"

→ Check that fee payer has SOL balance
→ Verify program ID is correct in `.env`
→ Check RPC endpoint is responsive

## Migration from Legacy Wallets

The Anza adapter replaces the old Solana Labs wallet-adapter. Benefits:

- **Modern Wallet Standard** support
- **Mobile Wallet Adapter** protocol
- **Better UX** with auto-detection
- **Fewer dependencies** to manage
- **Official maintenance** from Anza

## Next Steps

1. Run `pnpm install` to install dependencies
2. Set `NEXT_PUBLIC_SOLANA_NETWORK` in `.env`
3. Verify `.env` has `NEXTAUTH_URL` set
4. Test wallet connection in browser
5. Wire wallet to entry submission flow (see `apps/web/src/app/api/entries/route.ts`)

## Reference Links

- **GitHub**: [https://github.com/anza-xyz/wallet-adapter](https://github.com/anza-xyz/wallet-adapter)
- **APP.md Setup Guide**: [https://github.com/anza-xyz/wallet-adapter/blob/main/APP.md](https://github.com/anza-xyz/wallet-adapter/blob/main/APP.md)
- **PACKAGES.md Details**: [https://github.com/anza-xyz/wallet-adapter/blob/main/PACKAGES.md](https://github.com/anza-xyz/wallet-adapter/blob/main/PACKAGES.md)
- **React UI Docs**: [https://github.com/anza-xyz/wallet-adapter/tree/main/packages/ui/react-ui](https://github.com/anza-xyz/wallet-adapter/tree/main/packages/ui/react-ui)
