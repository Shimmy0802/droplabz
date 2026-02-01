'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CreateWhitelistForm } from '@/components/whitelists/CreateWhitelistForm';

interface EventData {
    id: string;
    title: string;
    description?: string;
    type: string;
    status: string;
    maxWinners: number;
    createdAt: string;
    _count?: {
        entries: number;
    };
}

export default function AdminWhitelistsPage({ params }: { params: Promise<{ slug: string }> }) {
    const [slug, setSlug] = useState<string>('');
    const [whitelists, setWhitelists] = useState<EventData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);

    useEffect(() => {
        params.then(p => {
            setSlug(p.slug);
            loadWhitelists(p.slug);
        });
    }, [params]);

    const loadWhitelists = async (communitySlug: string) => {
        try {
            setLoading(true);
            // First get community by slug to get ID
            const communityRes = await fetch(`/api/communities?slug=${communitySlug}`);
            if (!communityRes.ok) throw new Error('Community not found');
            const community = await communityRes.json();

            // Then get whitelists for this community
            const eventsRes = await fetch(`/api/events?communityId=${community.id}&type=WHITELIST`);
            if (!eventsRes.ok) throw new Error('Failed to load whitelists');
            const events = await eventsRes.json();
            setWhitelists(events);
        } catch (err) {
            console.error('Error loading whitelists:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center py-12 text-white">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold text-[#00ff41]">Whitelist Management</h1>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="px-6 py-2 bg-[#00ff41] text-[#0a0e27] font-semibold rounded-lg hover:bg-[#00dd33] transition"
                >
                    {showCreateForm ? 'Cancel' : 'Create Whitelist'}
                </button>
            </div>

            {showCreateForm && (
                <div className="bg-[#111528] border border-[#00d4ff]/20 rounded-lg p-6 mb-8">
                    <h2 className="text-2xl font-bold text-white mb-6">New Whitelist</h2>
                    <CreateWhitelistForm communityId={slug} />
                </div>
            )}

            {/* Whitelists List */}
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
                        <div
                            key={whitelist.id}
                            className="bg-[#111528] border border-[#00d4ff]/20 rounded-lg p-6 hover:border-[#00ff41]/50 transition"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-white mb-1">{whitelist.title}</h3>
                                    {whitelist.description && (
                                        <p className="text-gray-400 text-sm mb-3">{whitelist.description}</p>
                                    )}
                                    <div className="flex gap-4 text-sm">
                                        <span className="text-[#00d4ff]">
                                            Status:{' '}
                                            <span
                                                className={
                                                    whitelist.status === 'ACTIVE' ? 'text-[#00ff41]' : 'text-yellow-400'
                                                }
                                            >
                                                {whitelist.status}
                                            </span>
                                        </span>
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
                                </div>
                                <Link
                                    href={`/profile/communities/${slug}/admin/whitelists/${whitelist.id}`}
                                    className="px-4 py-2 bg-[#00d4ff]/20 text-[#00d4ff] rounded-lg hover:bg-[#00d4ff]/30 transition"
                                >
                                    Manage
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
