'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Entry {
    id: string;
    walletAddress: string;
    discordUserId: string | null;
    status: 'PENDING' | 'VALID' | 'INVALID';
    createdAt: string;
    metadata?: Record<string, any>;
}

interface Whitelist {
    id: string;
    title: string;
    description: string | null;
    status: 'ACTIVE' | 'DRAFT' | 'CLOSED';
    maxSpots: number;
    endAt: string;
    createdAt: string;
    requirements: Array<{
        id: string;
        type: string;
        config: Record<string, any>;
    }>;
}

export default function WhitelistDetailsPage() {
    const { slug, id } = useParams() as { slug: string; id: string };
    const router = useRouter();
    const { status } = useSession();
    const [whitelist, setWhitelist] = useState<Whitelist | null>(null);
    const [entries, setEntries] = useState<Entry[]>([]);
    const [loading, setLoading] = useState(true);
    const [entriesLoading, setEntriesLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'VALID' | 'INVALID' | 'PENDING'>('ALL');

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        if (status === 'authenticated') {
            fetchWhitelist();
        }
    }, [status, id, router]);

    const fetchWhitelist = async () => {
        try {
            setLoading(true);
            // First get community to verify access
            const communityRes = await fetch(`/api/communities?slug=${slug}`);
            if (!communityRes.ok) {
                setError('Community not found');
                return;
            }

            // Get whitelist details
            const whitelistRes = await fetch(`/api/events/${id}`);
            if (!whitelistRes.ok) {
                setError('Whitelist not found');
                return;
            }

            const whitelistData = await whitelistRes.json();
            setWhitelist(whitelistData);

            // Get entries for this whitelist
            await fetchEntries(id);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const fetchEntries = async (whitelistId: string) => {
        try {
            setEntriesLoading(true);
            const response = await fetch(`/api/entries?eventId=${whitelistId}`);

            if (!response.ok) {
                throw new Error('Failed to fetch entries');
            }

            const data = await response.json();
            setEntries(data || []);
        } catch (err) {
            console.error('Error fetching entries:', err);
            setEntries([]);
        } finally {
            setEntriesLoading(false);
        }
    };

    const filteredEntries = filterStatus === 'ALL' ? entries : entries.filter(e => e.status === filterStatus);

    const statsCounts = {
        total: entries.length,
        valid: entries.filter(e => e.status === 'VALID').length,
        invalid: entries.filter(e => e.status === 'INVALID').length,
        pending: entries.filter(e => e.status === 'PENDING').length,
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="h-48 bg-gray-700 rounded animate-pulse" />
            </div>
        );
    }

    if (error || !whitelist) {
        return (
            <div className="max-w-6xl mx-auto">
                <div className="p-6 bg-red-900/20 border border-red-800 rounded-lg">
                    <h1 className="text-2xl font-bold text-red-400 mb-2">Error</h1>
                    <p className="text-red-300 mb-4">{error || 'Whitelist not found'}</p>
                    <Link
                        href={`/profile/communities/${slug}/admin/whitelists`}
                        className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Back to Whitelists
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-white">{whitelist.title}</h1>
                    {whitelist.description && <p className="text-gray-400 mt-2">{whitelist.description}</p>}
                </div>
                <Link
                    href={`/profile/communities/${slug}/admin/whitelists`}
                    className="px-4 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg hover:border-gray-600"
                >
                    Back
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-900/40 border border-gray-700 rounded-lg">
                    <p className="text-gray-400 text-sm mb-2">Total Entries</p>
                    <p className="text-3xl font-bold text-white">{statsCounts.total}</p>
                </div>
                <div className="p-4 bg-gray-900/40 border border-gray-700 rounded-lg">
                    <p className="text-gray-400 text-sm mb-2">Valid</p>
                    <p className="text-3xl font-bold text-green-400">{statsCounts.valid}</p>
                </div>
                <div className="p-4 bg-gray-900/40 border border-gray-700 rounded-lg">
                    <p className="text-gray-400 text-sm mb-2">Invalid</p>
                    <p className="text-3xl font-bold text-red-400">{statsCounts.invalid}</p>
                </div>
                <div className="p-4 bg-gray-900/40 border border-gray-700 rounded-lg">
                    <p className="text-gray-400 text-sm mb-2">Pending</p>
                    <p className="text-3xl font-bold text-yellow-400">{statsCounts.pending}</p>
                </div>
            </div>

            {/* Filter and Actions */}
            <div className="p-6 bg-gray-900/40 border border-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Entries</h2>
                    <button className="px-4 py-2 bg-[#00d4ff] text-black rounded-lg font-semibold hover:bg-[#0099cc] transition text-sm">
                        Export CSV
                    </button>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6 border-b border-gray-700">
                    {(['ALL', 'VALID', 'INVALID', 'PENDING'] as const).map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-3 font-medium border-b-2 transition ${
                                filterStatus === status
                                    ? 'border-[#00ff41] text-[#00ff41]'
                                    : 'border-transparent text-gray-400 hover:text-white'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                {/* Entries List */}
                {entriesLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-gray-800 rounded animate-pulse" />
                        ))}
                    </div>
                ) : filteredEntries.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-400">
                            No {filterStatus === 'ALL' ? 'entries' : `${filterStatus.toLowerCase()} entries`} yet
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {filteredEntries.map(entry => (
                            <div
                                key={entry.id}
                                className="p-4 bg-gray-800 border border-gray-700 rounded-lg hover:border-gray-600 transition flex items-center justify-between"
                            >
                                <div className="flex-1">
                                    <p className="text-white font-mono text-sm break-all">{entry.walletAddress}</p>
                                    <p className="text-gray-500 text-xs mt-1">
                                        {new Date(entry.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 ml-4">
                                    <span
                                        className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                                            entry.status === 'VALID'
                                                ? 'bg-green-900/30 text-green-400 border border-green-700'
                                                : entry.status === 'INVALID'
                                                  ? 'bg-red-900/30 text-red-400 border border-red-700'
                                                  : 'bg-yellow-900/30 text-yellow-400 border border-yellow-700'
                                        }`}
                                    >
                                        {entry.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
