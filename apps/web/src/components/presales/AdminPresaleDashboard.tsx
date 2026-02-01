'use client';

/**
 * Admin Presale Dashboard Component
 * Displays presale allocations, participants, and allows exports
 */

import { useEffect, useState } from 'react';
import { Download, Filter } from 'lucide-react';

interface Tier {
    id: string;
    name: string;
    maxSpots: number;
    allocationAmount: number;
    spotsUsed: number;
}

interface Entry {
    id: string;
    walletAddress: string;
    discordUserId?: string;
    tierId: string;
    tierName: string;
    allocationAmount: number;
    createdAt: string;
}

interface Presale {
    id: string;
    name: string;
    description?: string;
    status: string;
    tiers: Tier[];
    entries?: Entry[];
}

interface AdminPresaleDashboardProps {
    presaleId: string;
}

export function AdminPresaleDashboard({ presaleId }: AdminPresaleDashboardProps) {
    const [presale, setPresale] = useState<Presale | null>(null);
    const [entries, setEntries] = useState<Entry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTier, setSelectedTier] = useState<string | null>(null);

    useEffect(() => {
        const fetchPresale = async () => {
            try {
                const response = await fetch(`/api/presales/${presaleId}`);
                if (!response.ok) throw new Error('Failed to load presale');
                const data = await response.json();
                setPresale(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load presale');
            } finally {
                setLoading(false);
            }
        };

        const fetchEntries = async () => {
            try {
                const response = await fetch(`/api/presales/${presaleId}/entries`);
                if (!response.ok) throw new Error('Failed to load entries');
                const data = await response.json();
                setEntries(data);
            } catch (err) {
                console.error('Failed to load entries:', err);
            }
        };

        fetchPresale();
        fetchEntries();
    }, [presaleId]);

    if (loading) {
        return <div className="p-6 text-center text-gray-400">Loading...</div>;
    }

    if (error || !presale) {
        return (
            <div className="p-6 bg-red-900/10 border border-red-500 rounded">
                <div className="text-red-400 font-semibold">Error</div>
                <div className="text-sm text-red-300 mt-1">{error || 'Presale not found'}</div>
            </div>
        );
    }

    const filteredEntries = selectedTier ? entries.filter(e => e.tierId === selectedTier) : entries;

    const exportCSV = () => {
        const headers = ['Wallet Address', 'Discord ID', 'Tier', 'Allocation', 'Date'];
        const rows = filteredEntries.map(e => [
            e.walletAddress,
            e.discordUserId || 'N/A',
            e.tierName,
            e.allocationAmount.toString(),
            new Date(e.createdAt).toLocaleDateString(),
        ]);

        const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${presale.name.toLowerCase()}-participants.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold">{presale.name}</h2>
                <p className="text-gray-400 text-sm mt-1">{presale.description}</p>
                <div className="mt-2 inline-block px-3 py-1 bg-[rgba(0,255,65,0.1)] text-[#00ff41] text-xs font-semibold rounded">
                    {presale.status}
                </div>
            </div>

            {/* Tier Allocation Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {presale.tiers.map(tier => (
                    <div
                        key={tier.id}
                        className="p-4 bg-[#111528] border border-[rgba(0,255,65,0.1)] rounded cursor-pointer hover:border-[rgba(0,255,65,0.3)] transition-all"
                        onClick={() => setSelectedTier(selectedTier === tier.id ? null : tier.id)}
                    >
                        <div className="font-semibold text-white mb-2">{tier.name}</div>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-gray-300">
                                <span>Spots Used:</span>
                                <span className="font-mono">
                                    {tier.spotsUsed} / {tier.maxSpots}
                                </span>
                            </div>

                            <div className="flex justify-between text-gray-300">
                                <span>Allocation:</span>
                                <span className="font-mono text-[#00ff41]">{tier.allocationAmount} tokens</span>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full h-2 bg-[#0a0e27] rounded mt-3">
                                <div
                                    className="h-full bg-[#00ff41] rounded transition-all"
                                    style={{
                                        width: `${(tier.spotsUsed / tier.maxSpots) * 100}%`,
                                    }}
                                />
                            </div>
                            <div className="text-xs text-gray-500">
                                {Math.round((tier.spotsUsed / tier.maxSpots) * 100)}% full
                            </div>
                        </div>

                        {selectedTier === tier.id && (
                            <div className="mt-3 pt-3 border-t border-[rgba(0,255,65,0.1)] text-xs text-gray-400">
                                Click to deselect
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Participants Table */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Participants ({filteredEntries.length})</h3>

                    <div className="flex items-center gap-2">
                        {selectedTier && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)] rounded text-sm">
                                <Filter size={16} />
                                <span className="text-gray-300">
                                    Tier: {presale.tiers.find(t => t.id === selectedTier)?.name}
                                </span>
                            </div>
                        )}

                        <button
                            onClick={exportCSV}
                            className="flex items-center gap-2 px-3 py-1 bg-[#00ff41] text-[#0a0e27] text-sm font-semibold rounded hover:bg-[#00dd33] transition-colors"
                        >
                            <Download size={16} />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[rgba(0,255,65,0.1)]">
                                <th className="text-left px-4 py-2 text-gray-400 font-semibold">Wallet</th>
                                <th className="text-left px-4 py-2 text-gray-400 font-semibold">Discord</th>
                                <th className="text-left px-4 py-2 text-gray-400 font-semibold">Tier</th>
                                <th className="text-right px-4 py-2 text-gray-400 font-semibold">Allocation</th>
                                <th className="text-left px-4 py-2 text-gray-400 font-semibold">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEntries.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-6 text-gray-500">
                                        No participants yet
                                    </td>
                                </tr>
                            ) : (
                                filteredEntries.map(entry => (
                                    <tr
                                        key={entry.id}
                                        className="border-b border-[rgba(0,255,65,0.05)] hover:bg-[rgba(0,255,65,0.05)]"
                                    >
                                        <td className="px-4 py-3 font-mono text-xs text-gray-300">
                                            {entry.walletAddress.slice(0, 6)}...{entry.walletAddress.slice(-4)}
                                        </td>
                                        <td className="px-4 py-3 text-gray-400">
                                            {entry.discordUserId ? (
                                                <span className="font-mono text-xs">{entry.discordUserId}</span>
                                            ) : (
                                                <span className="text-gray-600">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 bg-[rgba(0,212,255,0.1)] text-[#00d4ff] text-xs rounded">
                                                {entry.tierName}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-[#00ff41]">
                                            {entry.allocationAmount}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">
                                            {new Date(entry.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
