'use client';

/**
 * Presale Entry Form Component
 * Public form for users to enter presales
 */

import { useState } from 'react';
import { useWalletState } from '@/lib/wallet';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { AlertCircle, Check } from 'lucide-react';

interface PresaleEntryFormProps {
    presaleId: string;
    presaleName: string;
}

interface EntryResult {
    success: boolean;
    tier?: { name: string; allocationAmount: number };
    error?: string;
}

export function PresaleEntryForm({ presaleId, presaleName }: PresaleEntryFormProps) {
    const { publicKey, connected } = useWalletState();
    const [discordId, setDiscordId] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<EntryResult | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!publicKey) return;

        setLoading(true);
        setResult(null);

        try {
            const response = await fetch(`/api/presales/${presaleId}/entries`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    presaleId,
                    walletAddress: publicKey.toBase58(),
                    discordUserId: discordId || undefined,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setResult({
                    success: true,
                    tier: data.tier,
                });
                setDiscordId('');
            } else {
                setResult({
                    success: false,
                    error: data.error || 'Failed to enter presale',
                });
            }
        } catch (error) {
            setResult({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to enter presale',
            });
        } finally {
            setLoading(false);
        }
    };

    if (!connected) {
        return (
            <div className="p-6 bg-[#111528] border border-[rgba(0,255,65,0.1)] rounded space-y-4">
                <h3 className="text-lg font-semibold">Enter {presaleName}</h3>
                <p className="text-gray-400 text-sm">Connect your Solana wallet to participate in this presale.</p>
                <WalletMultiButton className="!w-full" />
            </div>
        );
    }

    return (
        <div className="p-6 bg-[#111528] border border-[rgba(0,255,65,0.1)] rounded">
            <h3 className="text-lg font-semibold mb-4">Enter {presaleName}</h3>

            {result && (
                <div
                    className={`p-4 rounded mb-4 flex items-start gap-3 ${
                        result.success
                            ? 'bg-[rgba(0,255,65,0.1)] border border-[#00ff41]'
                            : 'bg-[rgba(255,107,107,0.1)] border border-red-500'
                    }`}
                >
                    {result.success ? (
                        <>
                            <Check size={20} className="text-[#00ff41] flex-shrink-0 mt-0.5" />
                            <div>
                                <div className="font-semibold text-[#00ff41]">Entry Confirmed!</div>
                                <div className="text-sm text-gray-300 mt-1">
                                    You've been assigned to <strong>{result.tier?.name}</strong> with an allocation of{' '}
                                    <strong>{result.tier?.allocationAmount} tokens</strong>.
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <div className="font-semibold text-red-400">Entry Failed</div>
                                <div className="text-sm text-gray-300 mt-1">{result.error}</div>
                            </div>
                        </>
                    )}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Wallet Display */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Connected Wallet</label>
                    <div className="p-3 bg-[#0a0e27] border border-[#00d4ff] rounded font-mono text-sm text-gray-300">
                        {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-6)}
                    </div>
                </div>

                {/* Discord ID (Optional) */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Discord ID (Optional)</label>
                    <input
                        type="text"
                        value={discordId}
                        onChange={e => setDiscordId(e.target.value)}
                        className="w-full px-4 py-2 bg-[#0a0e27] border border-[#00d4ff] rounded text-white focus:outline-none focus:border-[#00ff41]"
                        placeholder="Your Discord ID"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Provide this if the presale has Discord-based requirements.
                    </p>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-3 bg-[#00ff41] text-[#0a0e27] font-semibold rounded hover:bg-[#00dd33] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? 'Verifying...' : 'Submit Entry'}
                </button>
            </form>

            {/* Info */}
            <div className="mt-4 p-3 bg-[rgba(0,212,255,0.05)] border border-[rgba(0,212,255,0.1)] rounded text-sm text-gray-400">
                Your wallet will be verified against the presale requirements. You'll be assigned to a tier based on
                your eligibility.
            </div>
        </div>
    );
}
