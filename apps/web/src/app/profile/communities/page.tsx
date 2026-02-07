'use client';

export const dynamic = 'force-dynamic';

import { useSession } from 'next-auth/react';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface Community {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    banner: string | null;
    ownerId: string;
    _count: {
        members: number;
    };
}

function CommunitiesPageContent() {
    const { status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [communities, setCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        if (status === 'authenticated') {
            fetchCommunities();
        }
    }, [status, router]);

    const fetchCommunities = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/communities');

            if (!response.ok) {
                throw new Error('Failed to fetch communities');
            }

            const data = await response.json();
            setCommunities(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="space-y-6">
                <div className="h-10 bg-gray-700 rounded animate-pulse w-64" />
                <div className="grid gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-gray-700 rounded animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    const showAll = searchParams.get('view') === 'all';
    const visibleCommunities = showAll ? communities : communities.slice(0, 6);
    const hasMore = communities.length > visibleCommunities.length;

    return (
        <div className="min-h-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Communities</h1>
                        <p className="text-gray-300 text-sm mt-2">Manage and create communities for your projects</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {!showAll && hasMore && (
                            <Link
                                href="/profile/communities?view=all"
                                className="text-sm text-[#00d4ff] hover:text-[#00e6ff] transition"
                            >
                                View all →
                            </Link>
                        )}
                        <Link
                            href="/profile/communities/create"
                            className="px-4 py-2 bg-[#00ff41] text-black rounded-lg font-semibold hover:bg-[#00dd33] transition text-sm"
                        >
                            + Create
                        </Link>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg text-red-400 text-sm backdrop-blur-sm">
                        Error: {error}
                    </div>
                )}

                {communities.length === 0 ? (
                    <div className="border border-[rgba(0,255,65,0.18)] rounded-lg p-12 text-center bg-gray-900/30 backdrop-blur-sm">
                        <h3 className="text-lg font-semibold text-white mb-2">No communities yet</h3>
                        <p className="text-gray-300 text-sm mb-4">Create your first community to get started</p>
                        <Link
                            href="/profile/communities/create"
                            className="inline-block px-4 py-2 bg-[#00ff41] text-black rounded-lg font-semibold hover:bg-[#00dd33] transition text-sm"
                        >
                            Create Community
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {visibleCommunities.map(community => (
                            <Link
                                key={community.id}
                                href={`/profile/communities/${community.slug}/admin`}
                                className="block p-4 border border-gray-700 rounded-lg hover:border-[#00d4ff] hover:bg-gray-900/60 bg-gray-900/30 backdrop-blur-sm transition group"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-white group-hover:text-[#00d4ff] transition">
                                            {community.name}
                                        </h3>
                                        <p className="text-gray-400 text-sm mt-1">@{community.slug}</p>
                                        {community.description && (
                                            <p className="text-gray-300 mt-2 text-sm line-clamp-2">
                                                {community.description}
                                            </p>
                                        )}
                                    </div>
                                    <div className="ml-4 text-right flex-shrink-0">
                                        <div className="text-2xl font-bold text-[#00ff41]">
                                            {community._count.members}
                                        </div>
                                        <p className="text-gray-400 text-xs mt-1">members</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function CommunitiesPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <CommunitiesPageContent />
        </Suspense>
    );
}
