'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { CommunityHeader } from '@/components/community/CommunityHeader';
import { EventCard } from '@/components/community/EventCard';
import { StatsPanel } from '@/components/community/StatsPanel';
import { ActionButtons } from '@/components/community/ActionButtons';
import { AnnouncementCard } from '@/components/community/AnnouncementCard';
import { CreateAnnouncementForm } from '@/components/community/CreateAnnouncementForm';
import { JoinCommunityButton } from '@/components/community/JoinCommunityButton';

interface Community {
    id: string;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    banner?: string;
    categories?: string[];
    tags: string[];
    rating?: number;
    isVerified?: boolean;
    isListed?: boolean;
    nftMintAddress?: string;
    socials?: {
        twitter?: string | null;
        discord?: string | null;
        website?: string | null;
        instagram?: string | null;
    } | null;
}

interface Event {
    id: string;
    type: string;
    title: string;
    description?: string;
    imageUrl?: string;
    status: string;
    endAt: Date | string;
    maxWinners: number;
    _count?: {
        entries: number;
    };
}

interface Presale {
    id: string;
    name: string;
    description?: string;
    status: string;
    createdAt: Date | string;
    tiers?: Array<{
        id: string;
        name: string;
        maxSpots: number;
        allocationAmount: number;
        spotsUsed: number;
    }>;
}

interface Announcement {
    id: string;
    title: string;
    content: string;
    isPinned: boolean;
    createdAt: Date | string;
    author: {
        id: string;
        username: string | null;
        discordUsername: string | null;
    };
}

interface Stats {
    totalEvents: number;
    totalParticipants: number;
    activeEvents: number;
    completedEvents: number;
    memberCount: number;
    reviewCount: number;
}

type TabType = 'active' | 'past' | 'presales' | 'announcements' | 'stats';

export default function CommunityPage({ params }: { params: Promise<{ slug: string }> }) {
    const { data: session } = useSession();
    const [community, setCommunity] = useState<Community | null>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [presales, setPresales] = useState<Presale[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [announcementsTotal, setAnnouncementsTotal] = useState(0);
    const [stats, setStats] = useState<Stats>({
        totalEvents: 0,
        totalParticipants: 0,
        activeEvents: 0,
        completedEvents: 0,
        memberCount: 0,
        reviewCount: 0,
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('active');
    const [isAdmin, setIsAdmin] = useState(false);
    const [isMember, setIsMember] = useState(false);

    useEffect(() => {
        params.then(p => {
            loadCommunityData(p.slug);
        });
    }, [params]);

    const loadCommunityData = async (communitySlug: string) => {
        try {
            setLoading(true);

            // Get community by slug
            const communityRes = await fetch(`/api/communities?slug=${communitySlug}`);
            if (!communityRes.ok) throw new Error('Community not found');
            const communityData = await communityRes.json();
            setCommunity(communityData);

            // Get all events
            const eventsRes = await fetch(`/api/events?communityId=${communityData.id}`);
            if (eventsRes.ok) {
                const eventsData = await eventsRes.json();
                setEvents(eventsData);

                // Calculate stats from events
                const activeCount = eventsData.filter((e: Event) => e.status === 'ACTIVE').length;
                const closedCount = eventsData.filter((e: Event) => e.status === 'CLOSED').length;
                const totalParticipants = eventsData.reduce(
                    (sum: number, e: Event) => sum + (e._count?.entries || 0),
                    0,
                );

                setStats(prev => ({
                    ...prev,
                    totalEvents: eventsData.length,
                    activeEvents: activeCount,
                    completedEvents: closedCount,
                    totalParticipants,
                }));
            }

            // Get presales
            const presalesRes = await fetch(`/api/presales?communityId=${communityData.id}`);
            if (presalesRes.ok) {
                const presalesData = await presalesRes.json();
                setPresales(presalesData);
            }

            // Get member count (from CommunityMember table)
            // TODO: Create API endpoint for this
            setStats(prev => ({ ...prev, memberCount: 0, reviewCount: 0 }));

            // Get announcements
            await loadAnnouncements(communityData.id);

            // Check if user is admin or member of this community
            if (session?.user?.id) {
                const memberRes = await fetch(`/api/communities/${communityData.id}/members?userId=${session.user.id}`);
                if (memberRes.ok) {
                    const memberData = await memberRes.json();
                    setIsMember(true);
                    setIsAdmin(
                        memberData.role === 'OWNER' ||
                            memberData.role === 'ADMIN' ||
                            session.user.role === 'SUPER_ADMIN',
                    );
                } else {
                    setIsMember(false);
                }
            }
        } catch (err) {
            console.error('Error loading community:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadAnnouncements = async (communityId: string) => {
        try {
            const res = await fetch(`/api/communities/${communityId}/announcements?limit=20`);
            if (res.ok) {
                const data = await res.json();
                setAnnouncements(data.announcements || []);
                setAnnouncementsTotal(data.total || 0);
            }
        } catch (err) {
            console.error('Error loading announcements:', err);
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#00ff41] border-t-transparent mb-4"></div>
                    <p className="text-white">Loading community...</p>
                </div>
            </div>
        );
    }

    if (!community) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center py-12">
                    <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                        />
                    </svg>
                    <p className="text-red-400 text-lg font-semibold">Community not found</p>
                </div>
            </div>
        );
    }

    // Filter events by type and status
    const activeWhitelists = events.filter(e => e.type === 'WHITELIST' && e.status === 'ACTIVE');
    const pastWhitelists = events.filter(e => e.type === 'WHITELIST' && e.status === 'CLOSED');
    const activeGiveaways = events.filter(e => e.type === 'GIVEAWAY' && e.status === 'ACTIVE');
    const pastGiveaways = events.filter(e => e.type === 'GIVEAWAY' && e.status === 'CLOSED');
    const activeCollaborations = events.filter(e => e.type === 'COLLABORATION' && e.status === 'ACTIVE');
    const pastCollaborations = events.filter(e => e.type === 'COLLABORATION' && e.status === 'CLOSED');
    const activePresales = presales.filter(p => p.status === 'ACTIVE');
    const pastPresales = presales.filter(p => p.status === 'CLOSED');

    const allActiveEvents = [...activeWhitelists, ...activeGiveaways, ...activeCollaborations];
    const allPastEvents = [...pastWhitelists, ...pastGiveaways, ...pastCollaborations];

    const tabs = [
        { id: 'active' as TabType, label: 'Active Events', count: allActiveEvents.length },
        { id: 'past' as TabType, label: 'Past Events', count: allPastEvents.length },
        { id: 'presales' as TabType, label: 'Pre-Sales', count: presales.length },
        { id: 'announcements' as TabType, label: 'Announcements', count: announcementsTotal },
        { id: 'stats' as TabType, label: 'Stats', count: null },
    ];

    return (
        <div className="min-h-full">
            <div className="h-full px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Community Header */}
                    <CommunityHeader
                        community={community}
                        memberCount={stats.memberCount}
                        reviewCount={stats.reviewCount}
                    />

                    {/* Join Community Button */}
                    {!isAdmin && (
                        <div className="flex justify-center">
                            <JoinCommunityButton
                                communityId={community.id}
                                isAuthenticated={!!session}
                                isMember={isMember}
                                isListed={community.isListed || false}
                                onJoinSuccess={() => loadCommunityData(community.slug)}
                            />
                        </div>
                    )}

                    {/* Action Buttons */}
                    <ActionButtons discordUrl={community.socials?.discord} websiteUrl={community.socials?.website} />

                    {/* Tabs */}
                    <div className="border-b border-[rgba(0,255,65,0.2)]">
                        <div className="flex gap-1 overflow-x-auto pb-px">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-6 py-3 font-semibold whitespace-nowrap transition ${
                                        activeTab === tab.id
                                            ? 'text-[#00ff41] border-b-2 border-[#00ff41]'
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    {tab.label}
                                    {tab.count !== null && (
                                        <span
                                            className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                                                activeTab === tab.id
                                                    ? 'bg-[rgba(0,255,65,0.2)] text-[#00ff41]'
                                                    : 'bg-[rgba(100,100,100,0.2)] text-gray-400'
                                            }`}
                                        >
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="pb-8">
                        {/* Active Events Tab */}
                        {activeTab === 'active' && (
                            <div className="space-y-6">
                                {activeWhitelists.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-bold text-[#00ff41] mb-4">Active Whitelists</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {activeWhitelists.map(event => (
                                                <EventCard key={event.id} event={event} showType={false} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeGiveaways.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-bold text-[#ffd700] mb-4">Active Giveaways</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {activeGiveaways.map(event => (
                                                <EventCard key={event.id} event={event} showType={false} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeCollaborations.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-bold text-[#9333ea] mb-4">Active Collaborations</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {activeCollaborations.map(event => (
                                                <EventCard key={event.id} event={event} showType={false} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {allActiveEvents.length === 0 && (
                                    <div className="text-center py-16 bg-[#111528] border border-[rgba(0,255,65,0.2)] rounded-lg">
                                        <svg
                                            className="w-16 h-16 text-gray-500 mx-auto mb-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                            />
                                        </svg>
                                        <p className="text-gray-400 text-lg">No active events at the moment</p>
                                        <p className="text-gray-500 text-sm mt-2">
                                            Check back soon for new opportunities
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Past Events Tab */}
                        {activeTab === 'past' && (
                            <div className="space-y-6">
                                {pastWhitelists.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-400 mb-4">Past Whitelists</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {pastWhitelists.map(event => (
                                                <EventCard key={event.id} event={event} showType={false} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {pastGiveaways.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-400 mb-4">Past Giveaways</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {pastGiveaways.map(event => (
                                                <EventCard key={event.id} event={event} showType={false} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {pastCollaborations.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-400 mb-4">Past Collaborations</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {pastCollaborations.map(event => (
                                                <EventCard key={event.id} event={event} showType={false} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {allPastEvents.length === 0 && (
                                    <div className="text-center py-16 bg-[#111528] border border-[rgba(0,255,65,0.2)] rounded-lg">
                                        <p className="text-gray-400 text-lg">No past events</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Pre-Sales Tab */}
                        {activeTab === 'presales' && (
                            <div className="space-y-6">
                                {activePresales.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-bold text-[#00d4ff] mb-4">Active Pre-Sales</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {activePresales.map(presale => (
                                                <div
                                                    key={presale.id}
                                                    className="bg-gradient-to-br from-[#111528] to-[#0a0e27] border border-[rgba(0,212,255,0.3)] rounded-lg p-6 hover:border-[#00d4ff] transition"
                                                >
                                                    <div className="flex items-start justify-between mb-3">
                                                        <h4 className="text-xl font-bold text-white">{presale.name}</h4>
                                                        <span className="px-3 py-1 rounded-full bg-[rgba(0,212,255,0.2)] text-[#00d4ff] text-xs font-semibold uppercase">
                                                            Active
                                                        </span>
                                                    </div>
                                                    {presale.description && (
                                                        <p className="text-gray-300 mb-4">{presale.description}</p>
                                                    )}
                                                    {presale.tiers && presale.tiers.length > 0 && (
                                                        <div className="space-y-2">
                                                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                                                                Tiers
                                                            </p>
                                                            {presale.tiers.map(tier => (
                                                                <div
                                                                    key={tier.id}
                                                                    className="flex items-center justify-between p-3 bg-[#0a0e27] rounded border border-[rgba(0,212,255,0.2)]"
                                                                >
                                                                    <div>
                                                                        <p className="font-semibold text-white">
                                                                            {tier.name}
                                                                        </p>
                                                                        <p className="text-xs text-gray-400">
                                                                            {tier.allocationAmount} tokens
                                                                        </p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-sm text-[#00d4ff]">
                                                                            {tier.maxSpots - tier.spotsUsed} /{' '}
                                                                            {tier.maxSpots}
                                                                        </p>
                                                                        <p className="text-xs text-gray-400">spots</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {pastPresales.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-400 mb-4">Past Pre-Sales</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {pastPresales.map(presale => (
                                                <div
                                                    key={presale.id}
                                                    className="bg-gradient-to-br from-[#111528] to-[#0a0e27] border border-[rgba(100,100,100,0.3)] rounded-lg p-6 opacity-75"
                                                >
                                                    <div className="flex items-start justify-between mb-3">
                                                        <h4 className="text-xl font-bold text-white">{presale.name}</h4>
                                                        <span className="px-3 py-1 rounded-full bg-gray-700 text-gray-300 text-xs font-semibold uppercase">
                                                            Closed
                                                        </span>
                                                    </div>
                                                    {presale.description && (
                                                        <p className="text-gray-400">{presale.description}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {presales.length === 0 && (
                                    <div className="text-center py-16 bg-[#111528] border border-[rgba(0,255,65,0.2)] rounded-lg">
                                        <p className="text-gray-400 text-lg">No pre-sales</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Announcements Tab */}
                        {activeTab === 'announcements' && (
                            <div className="space-y-6">
                                {/* Create Announcement Form (admin only) */}
                                {isAdmin && (
                                    <CreateAnnouncementForm
                                        communityId={community.id}
                                        onSuccess={() => loadAnnouncements(community.id)}
                                    />
                                )}

                                {/* Announcements List */}
                                {announcements.length > 0 ? (
                                    <div className="space-y-4">
                                        {announcements.map(announcement => (
                                            <AnnouncementCard
                                                key={announcement.id}
                                                announcement={announcement}
                                                isAdmin={isAdmin}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-16 bg-[#111528] border border-[rgba(0,255,65,0.2)] rounded-lg">
                                        <svg
                                            className="w-16 h-16 text-gray-500 mx-auto mb-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                                            />
                                        </svg>
                                        <p className="text-gray-400 text-lg">No announcements yet</p>
                                        {isAdmin && (
                                            <p className="text-gray-500 text-sm mt-2">
                                                Be the first to post an announcement!
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Stats Tab */}
                        {activeTab === 'stats' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <StatsPanel stats={stats} />

                                {/* Activity Timeline Placeholder */}
                                <div className="bg-gradient-to-br from-[#111528] to-[#0a0e27] border border-[rgba(0,255,65,0.2)] rounded-lg p-6">
                                    <h2 className="text-lg font-bold text-[#00d4ff] mb-4">Recent Activity</h2>
                                    <div className="space-y-4">
                                        {events
                                            .sort((a, b) => new Date(b.endAt).getTime() - new Date(a.endAt).getTime())
                                            .slice(0, 5)
                                            .map(event => (
                                                <div
                                                    key={event.id}
                                                    className="flex items-start gap-3 pb-3 border-b border-[rgba(100,100,100,0.2)] last:border-0"
                                                >
                                                    <div
                                                        className="w-2 h-2 rounded-full mt-2"
                                                        style={{
                                                            backgroundColor:
                                                                event.status === 'ACTIVE' ? '#00ff41' : '#666',
                                                        }}
                                                    />
                                                    <div className="flex-1">
                                                        <p className="text-white font-semibold text-sm">
                                                            {event.title}
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            {event.type} •{' '}
                                                            {event.status === 'ACTIVE' ? 'Active' : 'Closed'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
