'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
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

export default function CommunitiesPage() {
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
        <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-white">Communities</h1>
                        <p className="text-xs text-gray-400">Manage and create communities for your projects</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {!showAll && hasMore && (
                            <Link href="/profile/communities?view=all" className="text-xs text-[#00d4ff]">
                                View all
                            </Link>
                        )}
                        <Link
                            href="/profile/communities/create"
                            className="px-3 py-2 bg-[#00ff41] text-black rounded-lg font-semibold hover:bg-[#00dd33] transition text-xs"
                        >
                            Create
                        </Link>
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-xs">
                        Error: {error}
                    </div>
                )}

                {communities.length === 0 ? (
                    <div className="border border-gray-700 rounded-lg p-8 text-center">
                        <h3 className="text-sm font-semibold text-gray-400 mb-2">No communities yet</h3>
                        <p className="text-gray-500 text-xs mb-3">Create your first community to get started</p>
                        <Link
                            href="/profile/communities/create"
                            className="inline-block px-3 py-2 bg-[#00ff41] text-black rounded-lg font-semibold hover:bg-[#00dd33] transition text-xs"
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
                                className="block p-4 border border-gray-700 rounded-lg hover:border-[#00d4ff] hover:bg-gray-900/30 transition group"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-base font-semibold text-white group-hover:text-[#00d4ff] transition">
                                            {community.name}
                                        </h3>
                                        <p className="text-gray-500 text-xs mt-1">@{community.slug}</p>
                                        {community.description && (
                                            <p className="text-gray-400 mt-2 text-xs line-clamp-2">
                                                {community.description}
                                            </p>
                                        )}
                                    </div>
                                    <div className="ml-4 text-right">
                                        <div className="text-lg font-bold text-[#00ff41]">
                                            {community._count.members}
                                        </div>
                                        <p className="text-gray-500 text-xs">members</p>
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
