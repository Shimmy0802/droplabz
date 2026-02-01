/**
 * Wallet integration index
 * Exports all wallet-related utilities
 */

export { WalletContextProvider } from './WalletContextProvider';
export { useWalletState, useWalletConnect, useRequireWallet, useWalletConnection, useSelectedWallet } from './hooks';
export {
    isValidWalletAddress,
    createVerificationMessage,
    verifySignedMessage,
    prepareTransactionForSigning,
} from './verification';
