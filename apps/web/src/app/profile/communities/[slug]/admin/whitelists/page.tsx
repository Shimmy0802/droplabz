'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CreateWhitelistForm } from '@/components/whitelists/CreateWhitelistForm';
import { AdminLoadingState } from '@/components/admin/AdminLoadingState';
import { EventListPageShell } from '@/components/admin/EventListPageShell';
import { EventListCard } from '@/components/admin/EventListCard';
import { useCommunityBySlug } from '@/hooks/useCommunityBySlug';
import { useCommunityEvents } from '@/hooks/useCommunityEvents';

export default function AdminWhitelistsPage() {
    const { slug } = useParams() as { slug: string };
    const [showCreateForm, setShowCreateForm] = useState(false);
    const { community, isLoading: loadingCommunity } = useCommunityBySlug(slug);
    const {
        events: whitelists,
        isLoading: loadingWhitelists,
        error,
    } = useCommunityEvents({ communityId: community?.id, type: 'WHITELIST', enabled: !!community?.id });

    if (loadingCommunity || loadingWhitelists) {
        return <AdminLoadingState variant="list" />;
    }

    return (
        <EventListPageShell
            title="Whitelist Management"
            description="Manage whitelists for your community"
            cta={
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="px-6 py-2 bg-[#00ff41] text-[#0a0e27] font-semibold rounded-lg hover:bg-[#00dd33] transition"
                >
                    {showCreateForm ? 'Cancel' : 'Create Whitelist'}
                </button>
            }
            error={error}
        >
            {showCreateForm && community?.id && (
                <div className="bg-[#111528] border border-[#00d4ff]/20 rounded-lg p-6 mb-8">
                    <h2 className="text-2xl font-bold text-white mb-6">New Whitelist</h2>
                    <CreateWhitelistForm communityId={community.id} slug={slug} />
                </div>
            )}

            <div className="space-y-4">
                {whitelists.length === 0 ? (
                    <div className="text-center py-12 bg-[#111528] border border-[#00d4ff]/20 rounded-lg">
                        <p className="text-gray-400">No whitelists yet</p>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="mt-4 text-[#00d4ff] hover:text-[#00ff41]"
                        >
                            Create your first whitelist
                        </button>
                    </div>
                ) : (
                    whitelists.map(whitelist => (
                        <EventListCard
                            key={whitelist.id}
                            title={whitelist.title}
                            description={whitelist.description}
                            status={whitelist.status}
                            statusTone={whitelist.status === 'ACTIVE' ? 'success' : 'warning'}
                            meta={
                                <div className="flex gap-4 text-sm">
                                    <span className="text-[#00d4ff]">
                                        Spots:{' '}
                                        <span className="text-white">
                                            {whitelist._count?.entries || 0} / {whitelist.maxWinners}
                                        </span>
                                    </span>
                                    <span className="text-gray-500">
                                        {new Date(whitelist.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            }
                            actions={
                                <Link
                                    href={`/profile/communities/${slug}/admin/whitelists/${whitelist.id}`}
                                    className="px-4 py-2 bg-[#00d4ff]/20 text-[#00d4ff] rounded-lg hover:bg-[#00d4ff]/30 transition"
                                >
                                    Manage
                                </Link>
                            }
                        />
                    ))
                )}
            </div>
        </EventListPageShell>
    );
}
