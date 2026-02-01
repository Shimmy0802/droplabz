'use client';

/**
 * Admin Whitelist Dashboard Component
 * Shows entry verification results and allows admin operations
 */

import { useState, useEffect } from 'react';
import { Download, RotateCcw, AlertCircle, Check, X } from 'lucide-react';

interface Entry {
    id: string;
    walletAddress: string;
    discordUserId?: string;
    status: 'VALID' | 'INVALID' | 'PENDING';
    createdAt: string;
}

interface VerificationDetails {
    entryId: string;
    status: string;
    valid: boolean;
    discordValid?: boolean;
    solanaValid?: boolean;
    discordReason?: string;
    solanaReasons?: string[];
}

interface AdminWhitelistDashboardProps {
    eventId: string;
    communityId: string;
}

export function AdminWhitelistDashboard({ eventId, communityId }: AdminWhitelistDashboardProps) {
    const [entries, setEntries] = useState<Entry[]>([]);
    const [verificationDetails, setVerificationDetails] = useState<Map<string, VerificationDetails>>(new Map());
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'VALID' | 'INVALID' | 'PENDING'>('ALL');
    const [reverifying, setReverifying] = useState<Set<string>>(new Set());

    // Fetch entries
    useEffect(() => {
        const fetchEntries = async () => {
            try {
                const response = await fetch(`/api/events/${eventId}?communityId=${communityId}`);
                if (response.ok) {
                    const data = await response.json();
                    setEntries(data.entries || []);
                }
            } catch (error) {
                console.error('Error fetching entries:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEntries();
    }, [eventId, communityId]);

    // Manually verify entry
    const handleVerify = async (entryId: string) => {
        setReverifying(prev => new Set([...prev, entryId]));

        try {
            const response = await fetch(`/api/entries/${entryId}/verify`, {
                method: 'POST',
            });

            if (response.ok) {
                const result = await response.json();
                setVerificationDetails(prev => new Map(prev).set(entryId, result));

                // Update entry status
                setEntries(prev => prev.map(e => (e.id === entryId ? { ...e, status: result.status } : e)));
            }
        } catch (error) {
            console.error('Error verifying entry:', error);
        } finally {
            setReverifying(prev => {
                const next = new Set(prev);
                next.delete(entryId);
                return next;
            });
        }
    };

    // Export verified entries
    const handleExport = () => {
        const validEntries = entries.filter(e => e.status === 'VALID');
        const csv = [
            ['Wallet Address', 'Discord ID', 'Status', 'Created At'],
            ...validEntries.map(e => [e.walletAddress, e.discordUserId || 'N/A', e.status, e.createdAt]),
        ]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `whitelist-${eventId}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    // Filter entries
    const filteredEntries = filter === 'ALL' ? entries : entries.filter(e => e.status === filter);

    // Stats
    const stats = {
        total: entries.length,
        valid: entries.filter(e => e.status === 'VALID').length,
        invalid: entries.filter(e => e.status === 'INVALID').length,
        pending: entries.filter(e => e.status === 'PENDING').length,
    };

    if (loading) {
        return <div className="text-gray-400">Loading entries...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total', value: stats.total, color: '#00d4ff' },
                    { label: 'Valid', value: stats.valid, color: '#00ff41' },
                    { label: 'Invalid', value: stats.invalid, color: '#ff6b6b' },
                    { label: 'Pending', value: stats.pending, color: '#ffd700' },
                ].map(stat => (
                    <div key={stat.label} className="p-4 bg-[#111528] border border-[rgba(0,212,255,0.1)] rounded">
                        <div className="text-xs text-gray-400 mb-1">{stat.label}</div>
                        <div className="text-2xl font-bold" style={{ color: stat.color }}>
                            {stat.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex gap-2">
                    {['ALL', 'VALID', 'INVALID', 'PENDING'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status as typeof filter)}
                            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                                filter === status
                                    ? 'bg-[#00ff41] text-[#0a0e27]'
                                    : 'bg-[#111528] border border-[rgba(0,255,65,0.1)] text-gray-300 hover:border-[#00ff41]'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                {stats.valid > 0 && (
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-[#00d4ff] text-[#0a0e27] font-medium rounded hover:bg-[#0099cc] transition-colors"
                    >
                        <Download size={18} />
                        Export Verified ({stats.valid})
                    </button>
                )}
            </div>

            {/* Entries Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[rgba(0,255,65,0.1)]">
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Wallet</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Discord</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Details</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEntries.map(entry => {
                            const details = verificationDetails.get(entry.id);
                            return (
                                <tr
                                    key={entry.id}
                                    className="border-b border-[rgba(0,255,65,0.1)] hover:bg-[#111528] transition-colors"
                                >
                                    <td className="px-4 py-3 text-sm font-mono text-gray-300">
                                        {entry.walletAddress.slice(0, 8)}...{entry.walletAddress.slice(-6)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-300">
                                        {entry.discordUserId ? `${entry.discordUserId.slice(0, 6)}...` : 'N/A'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`px-2 py-1 rounded text-xs font-semibold ${
                                                entry.status === 'VALID'
                                                    ? 'bg-[rgba(0,255,65,0.2)] text-[#00ff41]'
                                                    : entry.status === 'INVALID'
                                                      ? 'bg-[rgba(255,107,107,0.2)] text-[#ff6b6b]'
                                                      : 'bg-[rgba(255,215,0,0.2)] text-[#ffd700]'
                                            }`}
                                        >
                                            {entry.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {details ? (
                                            <div className="space-y-1">
                                                {details.discordReason && (
                                                    <div className="flex items-start gap-2 text-red-400 text-xs">
                                                        <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                                                        <span>{details.discordReason}</span>
                                                    </div>
                                                )}
                                                {details.solanaReasons?.map((reason, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex items-start gap-2 text-red-400 text-xs"
                                                    >
                                                        <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                                                        <span>{reason}</span>
                                                    </div>
                                                ))}
                                                {details.valid && (
                                                    <div className="flex items-center gap-2 text-[#00ff41] text-xs">
                                                        <Check size={14} />
                                                        <span>All requirements met</span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-gray-500 text-xs">Not verified yet</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => handleVerify(entry.id)}
                                            disabled={reverifying.has(entry.id)}
                                            className="flex items-center gap-1 px-3 py-1 text-xs bg-[#00d4ff] text-[#0a0e27] font-medium rounded hover:bg-[#0099cc] disabled:opacity-50 transition-colors"
                                        >
                                            <RotateCcw size={14} />
                                            {reverifying.has(entry.id) ? 'Verifying...' : 'Verify'}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {filteredEntries.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                    <X size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No {filter.toLowerCase() === 'all' ? 'entries' : filter.toLowerCase() + ' entries'}</p>
                </div>
            )}
        </div>
    );
}
