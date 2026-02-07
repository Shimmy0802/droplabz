'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { OverviewTab } from '@/components/admin/OverviewTab';
import { useAdminPageState } from '@/hooks/useAdminPageState';
import { useCommunityData } from '@/hooks/useCommunityData';
import { useCommunityEvents } from '@/hooks/useCommunityEvents';
import { useWhitelists } from '@/hooks/useWhitelists';

interface PresaleSummary {
    id: string;
    name: string;
    description?: string | null;
    status: string;
    createdAt: string;
}

interface MemberSummary {
    id: string;
    role: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';
    createdAt: string;
    user: {
        id: string;
        email: string | null;
        discordId: string | null;
        username?: string | null;
        discordUsername?: string | null;
    };
}

export default function CommunityAdminPage() {
    const { slug } = useParams() as { slug: string };
    const router = useRouter();
    const { status } = useSession();
    const { state, dispatch } = useAdminPageState();
    const community = state.community;
    const loading = state.isLoading;
    const error = state.error;
    const whitelists = state.whitelists.items;
    const discordTicketUrl = process.env.NEXT_PUBLIC_DISCORD_TICKET_URL || '';
    const [presales, setPresales] = useState<PresaleSummary[]>([]);
    const [loadingPresales, setLoadingPresales] = useState(false);
    const [members, setMembers] = useState<MemberSummary[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);

    const { events: giveaways, isLoading: loadingGiveaways } = useCommunityEvents({
        communityId: community?.id,
        type: 'GIVEAWAY',
        enabled: !!community?.id,
    });

    const { fetchWhitelists } = useWhitelists(dispatch);
    const { fetchCommunity } = useCommunityData({ slug, dispatch, fetchWhitelists });

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        if (status === 'authenticated') {
            fetchCommunity();
        }
    }, [fetchCommunity, router, status]);

    useEffect(() => {
        if (!community?.id) return;

        const loadPresales = async () => {
            setLoadingPresales(true);
            try {
                const response = await fetch(`/api/presales?communityId=${community.id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch presales');
                }
                const data = (await response.json()) as PresaleSummary[];
                setPresales(data || []);
            } catch (err) {
                console.error('Error fetching presales:', err);
                setPresales([]);
            } finally {
                setLoadingPresales(false);
            }
        };

        void loadPresales();
    }, [community?.id]);

    useEffect(() => {
        if (!community?.id) return;

        const loadMembers = async () => {
            setLoadingMembers(true);
            try {
                const params = new URLSearchParams({ limit: '5', offset: '0' });
                const url = `/api/communities/${community.id}/members?${params}`;
                console.log('[Members] Fetching from:', url);
                const response = await fetch(url);
                console.log('[Members] Response status:', response.status);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error('[Members] Error response:', errorData);
                    throw new Error(
                        `Failed to fetch members: ${response.status} - ${errorData.error || response.statusText}`,
                    );
                }

                const data = await response.json();
                console.log('[Members] Fetched successfully:', data.data?.length || 0, 'members');
                setMembers((data.data as MemberSummary[]) || []);
            } catch (err) {
                console.error('[Members] Error:', err);
                setMembers([]);
            } finally {
                setLoadingMembers(false);
            }
        };

        void loadMembers();
    }, [community?.id]);

    if (status === 'loading' || loading) {
        return (
            <div className="space-y-6">
                <div className="h-32 bg-gray-700 rounded animate-pulse" />
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-gray-700 rounded animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return null;
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div className="p-6 bg-red-900/20 border border-red-800 rounded-lg">
                    <h1 className="text-2xl font-bold text-red-400 mb-2">Error</h1>
                    <p className="text-red-300">{error}</p>
                    <Link
                        href="/profile/communities"
                        className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Back to Communities
                    </Link>
                </div>
            </div>
        );
    }

    if (!community) {
        return null;
    }

    return (
        <div className="min-h-full flex flex-col gap-6">
            {/* Community Banner */}
            {community.banner && (
                <div className="relative h-32 md:h-48 -mx-4 md:mx-0 md:rounded-lg overflow-hidden">
                    <img src={community.banner} alt={community.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between flex-shrink-0 gap-4">
                <div className="flex items-start gap-4">
                    {community.icon && (
                        <div className="flex-shrink-0">
                            <img
                                src={community.icon}
                                alt={community.name}
                                className="w-16 h-16 rounded-lg border border-gray-700 object-cover"
                            />
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-white">{community.name}</h1>
                        <p className="text-gray-400 text-xs mt-1">Admin Overview</p>
                        {community.description && (
                            <p className="text-gray-400 text-xs mt-2 max-w-2xl line-clamp-2">{community.description}</p>
                        )}
                    </div>
                </div>
                <Link
                    href="/profile/communities"
                    className="px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg hover:border-gray-600 text-xs flex-shrink-0"
                >
                    Back
                </Link>
            </div>
            {!community.isVerified && (
                <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-lg p-4 text-sm">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <p className="text-yellow-300 font-semibold">Verification required</p>
                            <p className="text-yellow-200/80 mt-1">
                                Communities must be manually approved. Open a Discord ticket to request verification.
                            </p>
                            <p className="text-yellow-200/70 mt-1">
                                Status: <span className="font-semibold">{community.verificationStatus}</span>
                            </p>
                        </div>
                        {discordTicketUrl ? (
                            <a
                                href={discordTicketUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 rounded-lg bg-[#00d4ff] text-[#0a0e27] font-semibold hover:bg-[#0099cc] transition"
                            >
                                Open Discord Ticket
                            </a>
                        ) : (
                            <div className="text-yellow-200/80">Discord ticket link not configured</div>
                        )}
                    </div>
                </div>
            )}
            <OverviewTab
                slug={slug}
                whitelists={whitelists}
                giveaways={giveaways}
                presales={presales}
                members={members}
                memberCount={community._count.members}
                isLoadingGiveaways={loadingGiveaways}
                isLoadingPresales={loadingPresales}
                isLoadingMembers={loadingMembers}
            />
        </div>
    );
}
