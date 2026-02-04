'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Edit2, Trash2, Eye, Clock, Users, Gift } from 'lucide-react';
import { AdminLoadingState } from '@/components/admin/AdminLoadingState';
import { EventListPageShell } from '@/components/admin/EventListPageShell';
import { EventListCard } from '@/components/admin/EventListCard';
import { useCommunityBySlug } from '@/hooks/useCommunityBySlug';
import { useCommunityEvents } from '@/hooks/useCommunityEvents';

export default function AdminGiveawaysPage() {
    const { slug } = useParams() as { slug: string };
    const { community, isLoading: loadingCommunity } = useCommunityBySlug(slug);
    const {
        events: giveaways,
        setEvents: setGiveaways,
        isLoading: loadingGiveaways,
        error,
    } = useCommunityEvents({ communityId: community?.id, type: 'GIVEAWAY', enabled: !!community?.id });
    const [activeTab, setActiveTab] = useState<'active' | 'closed' | 'draft'>('active');
    const [deleting, setDeleting] = useState<string | null>(null);

    const handleDelete = async (giveawayId: string) => {
        if (!window.confirm('Are you sure you want to delete this giveaway?')) return;

        try {
            setDeleting(giveawayId);
            const response = await fetch(`/api/events/${giveawayId}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete giveaway');
            setGiveaways(prev => prev.filter(g => g.id !== giveawayId));
        } catch (err) {
            console.error('Failed to delete giveaway:', err);
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
            setGiveaways(prev => prev.map(g => (g.id === giveawayId ? updatedGiveaway : g)));
        } catch (err) {
            console.error('Failed to close giveaway:', err);
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

    if (loadingCommunity || loadingGiveaways) {
        return <AdminLoadingState variant="list" />;
    }

    return (
        <EventListPageShell
            title="Giveaways"
            description="Manage your community giveaways"
            cta={
                <Link
                    href={`/profile/communities/${slug}/admin/giveaways/create`}
                    className="px-6 py-3 bg-[#00ff41] text-[#0a0e27] font-semibold rounded-lg hover:bg-[#00dd33] transition flex items-center gap-2"
                >
                    <Gift className="w-5 h-5" />
                    Create Giveaway
                </Link>
            }
            error={error}
            tabs={
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
            }
        >
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
                        <EventListCard
                            key={giveaway.id}
                            title={giveaway.title}
                            description={giveaway.description}
                            status={giveaway.status}
                            statusTone={
                                giveaway.status === 'ACTIVE'
                                    ? 'success'
                                    : giveaway.status === 'CLOSED'
                                      ? 'muted'
                                      : 'warning'
                            }
                            meta={
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
                            }
                            actions={
                                <>
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
                                </>
                            }
                        />
                    ))
                )}
            </div>
        </EventListPageShell>
    );
}

function Trophy({ className }: { className?: string }) {
    return <span className={className}>🏆</span>;
}
