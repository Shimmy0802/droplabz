'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Edit2, Trash2, Eye, Clock, Users, Gift } from 'lucide-react';

interface EventData {
    id: string;
    title: string;
    description?: string;
    prize?: string;
    type: string;
    status: string;
    maxWinners: number;
    startAt: string;
    endAt: string;
    createdAt: string;
    _count?: {
        entries: number;
    };
}

export default function AdminGiveawaysPage({ params }: { params: Promise<{ slug: string }> }) {
    const [slug, setSlug] = useState<string>('');
    const [giveaways, setGiveaways] = useState<EventData[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'active' | 'closed' | 'draft'>('active');
    const [deleting, setDeleting] = useState<string | null>(null);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        params.then(p => {
            setSlug(p.slug);
            loadGiveaways(p.slug);
        });
    }, [params]);

    const loadGiveaways = async (communitySlug: string) => {
        try {
            setLoading(true);
            const communityRes = await fetch(`/api/communities?slug=${communitySlug}`);
            if (!communityRes.ok) throw new Error('Community not found');
            const community = await communityRes.json();

            const eventsRes = await fetch(`/api/events?communityId=${community.id}&type=GIVEAWAY`);
            if (!eventsRes.ok) throw new Error('Failed to load giveaways');
            const events = await eventsRes.json();
            setGiveaways(events);
        } catch (err) {
            console.error('Error loading giveaways:', err);
            setError('Failed to load giveaways');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (giveawayId: string) => {
        if (!window.confirm('Are you sure you want to delete this giveaway?')) return;

        try {
            setDeleting(giveawayId);
            const response = await fetch(`/api/events/${giveawayId}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete giveaway');
            setGiveaways(giveaways.filter(g => g.id !== giveawayId));
        } catch (err) {
            setError('Failed to delete giveaway');
        } finally {
            setDeleting(null);
        }
    };

    const handleCloseGiveaway = async (giveawayId: string) => {
        try {
            const response = await fetch(`/api/events/${giveawayId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'CLOSED' }),
            });

            if (!response.ok) throw new Error('Failed to close giveaway');
            const updatedGiveaway = await response.json();
            setGiveaways(giveaways.map(g => (g.id === giveawayId ? updatedGiveaway : g)));
        } catch (err) {
            setError('Failed to close giveaway');
        }
    };

    const filterGiveaways = () => {
        const now = new Date();
        return giveaways.filter(g => {
            if (activeTab === 'active') {
                return g.status === 'ACTIVE' && new Date(g.endAt) > now;
            } else if (activeTab === 'closed') {
                return g.status === 'CLOSED' || new Date(g.endAt) <= now;
            } else {
                return g.status === 'DRAFT';
            }
        });
    };

    const filtered = filterGiveaways();

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="text-center py-12 text-gray-400">Loading...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-[#00ff41]">Giveaways</h1>
                    <p className="text-gray-400 mt-2">Manage your community giveaways</p>
                </div>
                <Link
                    href={`/profile/communities/${slug}/admin/giveaways/create`}
                    className="px-6 py-3 bg-[#00ff41] text-[#0a0e27] font-semibold rounded-lg hover:bg-[#00dd33] transition flex items-center gap-2"
                >
                    <Gift className="w-5 h-5" />
                    Create Giveaway
                </Link>
            </div>

            {error && <div className="bg-red-500/20 border border-red-500 text-red-200 p-3 rounded">{error}</div>}

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-700/50">
                {(['active', 'closed', 'draft'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-3 font-medium capitalize transition ${
                            activeTab === tab
                                ? 'text-[#00ff41] border-b-2 border-[#00ff41]'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        {tab === 'active' ? `Active (${giveaways.filter(g => g.status === 'ACTIVE').length})` : ''}
                        {tab === 'closed' ? `Closed (${giveaways.filter(g => g.status === 'CLOSED').length})` : ''}
                        {tab === 'draft' ? `Draft (${giveaways.filter(g => g.status === 'DRAFT').length})` : ''}
                    </button>
                ))}
            </div>

            {/* Giveaways List */}
            <div className="space-y-4">
                {filtered.length === 0 ? (
                    <div className="text-center py-12 bg-[#111528] border border-[#00d4ff]/20 rounded-lg">
                        <Gift className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-400 mb-4">No {activeTab} giveaways yet</p>
                        <Link
                            href={`/profile/communities/${slug}/admin/giveaways/create`}
                            className="inline-block text-[#00ff41] hover:text-[#00dd33] font-medium"
                        >
                            Create your first giveaway
                        </Link>
                    </div>
                ) : (
                    filtered.map(giveaway => (
                        <div
                            key={giveaway.id}
                            className="bg-[#111528] border border-[#00d4ff]/20 rounded-lg p-6 hover:border-[#00ff41]/50 transition"
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-semibold text-white">{giveaway.title}</h3>
                                        <span
                                            className={`text-xs px-2 py-1 rounded font-medium ${
                                                giveaway.status === 'ACTIVE'
                                                    ? 'bg-[#00ff41]/20 text-[#00ff41]'
                                                    : giveaway.status === 'CLOSED'
                                                      ? 'bg-gray-500/20 text-gray-300'
                                                      : 'bg-yellow-500/20 text-yellow-300'
                                            }`}
                                        >
                                            {giveaway.status}
                                        </span>
                                    </div>

                                    {giveaway.description && (
                                        <p className="text-gray-400 text-sm mb-2">{giveaway.description}</p>
                                    )}

                                    {giveaway.prize && (
                                        <p className="text-[#00d4ff] text-sm font-medium mb-3">🎁 {giveaway.prize}</p>
                                    )}

                                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <Trophy className="w-4 h-4 text-[#ffd700]" />
                                            {giveaway.maxWinners} winner{giveaway.maxWinners !== 1 ? 's' : ''}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Users className="w-4 h-4 text-[#00d4ff]" />
                                            {giveaway._count?.entries || 0} entries
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            Ends {formatDate(giveaway.endAt)}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <Link
                                        href={`/profile/communities/${slug}/admin/giveaways/${giveaway.id}`}
                                        className="p-2 hover:bg-[#00d4ff]/20 rounded-lg text-[#00d4ff] transition"
                                        title="View details"
                                    >
                                        <Eye className="w-5 h-5" />
                                    </Link>
                                    <Link
                                        href={`/profile/communities/${slug}/admin/giveaways/${giveaway.id}/edit`}
                                        className="p-2 hover:bg-blue-500/20 rounded-lg text-blue-400 transition"
                                        title="Edit"
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </Link>
                                    {giveaway.status === 'ACTIVE' && (
                                        <button
                                            onClick={() => handleCloseGiveaway(giveaway.id)}
                                            className="p-2 hover:bg-yellow-500/20 rounded-lg text-yellow-400 transition"
                                            title="Close giveaway"
                                        >
                                            <Clock className="w-5 h-5" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(giveaway.id)}
                                        disabled={deleting === giveaway.id}
                                        className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition disabled:opacity-50"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function Trophy({ className }: { className?: string }) {
    return <span className={className}>🏆</span>;
}
