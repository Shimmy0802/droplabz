export const dynamic = 'force-dynamic';

import Link from 'next/link';

interface CommunityItem {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    icon: string | null;
    rating: number | null;
    boostLevel: number;
    memberCount: number;
    categories: string[];
}

interface HomepageData {
    topCommunities: CommunityItem[];
}

async function getTrendingCommunities(): Promise<CommunityItem[]> {
    try {
        const response = await fetch(`${process.env.NEXTAUTH_URL}/api/homepage`, {
            cache: 'no-store',
        });

        if (!response.ok) {
            return [];
        }

        const data: HomepageData = await response.json();
        return data.topCommunities || [];
    } catch (error) {
        console.error('Error fetching trending communities:', error);
        return [];
    }
}

export default async function TrendingPage() {
    const communities = await getTrendingCommunities();

    return (
        <div className="min-h-full px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-[1400px] mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Trending Communities</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        High-velocity communities with verified activity signals.
                    </p>
                </div>

                {communities.length === 0 ? (
                    <div className="bg-[#111528] border border-[rgba(0,255,65,0.15)] rounded p-6 text-sm text-gray-400">
                        No trending communities available right now.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {communities.map(community => (
                            <Link
                                key={community.id}
                                href={`/communities/${community.slug}`}
                                className="bg-[#111528] border border-[rgba(0,212,255,0.2)] rounded-lg p-4 hover:border-[rgba(0,212,255,0.5)] transition"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded bg-gradient-to-br from-[#00d4ff] to-[#00ff41] flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0">
                                        {community.icon ? (
                                            <img src={community.icon} alt="" className="w-full h-full" />
                                        ) : (
                                            community.name[0]
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">{community.name}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {community.categories?.[0] || 'Community'}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                                    <span>{community.memberCount ?? 0} members</span>
                                    <span className="text-[#00ff41] font-semibold">{community.rating || 95}%</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
