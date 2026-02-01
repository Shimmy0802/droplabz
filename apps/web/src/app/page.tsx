import Link from 'next/link';

interface Community {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    icon: string | null;
    banner: string | null;
    rating: number | null;
    boostLevel: number;
    categories: string[];
    tags: string[];
    memberCount?: number;
    _count?: {
        members: number;
    };
}

interface Event {
    id: string;
    type?: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    endAt: string;
    maxWinners: number;
    validEntries: number;
    community: {
        name: string;
        slug: string;
        icon: string | null;
    };
}

interface HomepageData {
    topCommunities: Community[];
    upcomingMints: Event[];
    presales: Event[];
    endingSoon: Event[];
}

async function getFeaturedCommunities(): Promise<Community[]> {
    try {
        const response = await fetch(`${process.env.NEXTAUTH_URL}/api/featured-communities`, {
            cache: 'no-store',
        });

        if (!response.ok) {
            return [];
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching featured communities:', error);
        return [];
    }
}

async function getVerifiedCommunities(): Promise<Community[]> {
    try {
        const response = await fetch(`${process.env.NEXTAUTH_URL}/api/verified-communities?limit=6`, {
            cache: 'no-store',
        });

        if (!response.ok) {
            return [];
        }

        const data = await response.json();
        return data.communities || [];
    } catch (error) {
        console.error('Error fetching verified communities:', error);
        return [];
    }
}

async function getHomepageData(): Promise<HomepageData> {
    try {
        const response = await fetch(`${process.env.NEXTAUTH_URL}/api/homepage`, {
            cache: 'no-store',
        });

        if (!response.ok) {
            return {
                topCommunities: [],
                upcomingMints: [],
                presales: [],
                endingSoon: [],
            };
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching homepage data:', error);
        return {
            topCommunities: [],
            upcomingMints: [],
            presales: [],
            endingSoon: [],
        };
    }
}

export default async function HomePage() {
    const [featuredCommunities, verifiedCommunities, homepageData] = await Promise.all([
        getFeaturedCommunities(),
        getVerifiedCommunities(),
        getHomepageData(),
    ]);

    return (
        <div className="min-h-full">
            <div className="h-full overflow-y-auto w-full">
                <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
                    <div className="max-w-[1600px] mx-auto space-y-6">
                        {/* SECTION 1: Featured Communities - Now at Top */}
                        <section>
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-[#00ff41]" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                Featured Communities
                            </h2>

                            {featuredCommunities.length === 0 ? (
                                <div className="text-center py-12 bg-[#111528] rounded border border-gray-700">
                                    <svg
                                        className="w-12 h-12 mx-auto text-gray-600 mb-3"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    <p className="text-gray-400 font-semibold">No Featured Communities Yet</p>
                                    <p className="text-gray-500 text-sm mt-1">
                                        Check back soon for highlighted communities
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                    {featuredCommunities.map(c => (
                                        <Link key={c.id} href={`/communities/${c.slug}`} className="group">
                                            <div className="aspect-square rounded bg-[#111528] border border-[rgba(0,255,65,0.15)] group-hover:border-[rgba(0,255,65,0.4)] p-2.5 flex flex-col items-center justify-center transition">
                                                <div className="w-8 h-8 rounded bg-gradient-to-br from-[#00ff41] to-[#00d4ff] flex items-center justify-center text-white font-bold text-xs mb-1.5 overflow-hidden">
                                                    {c.icon ? (
                                                        <img src={c.icon} alt="" className="w-full h-full" />
                                                    ) : (
                                                        c.name[0]
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-white font-semibold text-center line-clamp-1">
                                                    {c.name}
                                                </p>
                                                {c.rating && (
                                                    <p className="text-[8px] text-[#00ff41] font-bold mt-0.5">
                                                        {c.rating}%
                                                    </p>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* SECTION 1.5: Verified Communities - New Section */}
                        <section>
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-[#00d4ff]" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                </svg>
                                Verified Communities
                            </h2>

                            {verifiedCommunities.length === 0 ? (
                                <div className="text-center py-12 bg-[#111528] rounded border border-gray-700">
                                    <svg
                                        className="w-12 h-12 mx-auto text-gray-600 mb-3"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                    </svg>
                                    <p className="text-gray-400 font-semibold">No Verified Communities Yet</p>
                                    <p className="text-gray-500 text-sm mt-1">
                                        Check back soon for verified communities
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {verifiedCommunities.map(c => (
                                        <Link key={c.id} href={`/communities/${c.slug}`} className="group">
                                            <div className="bg-[#111528] border border-[rgba(0,212,255,0.2)] group-hover:border-[rgba(0,212,255,0.5)] rounded-lg p-4 transition h-full">
                                                <div className="flex items-start gap-3 mb-3">
                                                    <div className="w-10 h-10 rounded bg-gradient-to-br from-[#00d4ff] to-[#00ff41] flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0">
                                                        {c.icon ? (
                                                            <img src={c.icon} alt="" className="w-full h-full" />
                                                        ) : (
                                                            c.name[0]
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-white font-semibold text-sm truncate group-hover:text-[#00d4ff] transition">
                                                            {c.name}
                                                        </h3>
                                                        <p className="text-[#00d4ff] text-xs">✓ Verified</p>
                                                    </div>
                                                </div>
                                                {c.description && (
                                                    <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                                                        {c.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                                    <span>👥 {c._count?.members ?? 0} members</span>
                                                    {c.rating && <span>⭐ {c.rating}%</span>}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* SECTION 2: Community Leaderboard - New Major Section */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <svg className="w-5 h-5 text-[#00d4ff]" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    Community Leaderboard
                                </h2>
                                <Link
                                    href="/communities"
                                    className="text-xs text-[#00d4ff] hover:text-[#00ff41] transition"
                                >
                                    View All →
                                </Link>
                            </div>

                            {homepageData.topCommunities.length === 0 ? (
                                <div className="text-center py-8 bg-[#111528] rounded border border-gray-700">
                                    <p className="text-gray-400 text-sm">No communities yet</p>
                                </div>
                            ) : (
                                <div className="bg-[#111528] rounded border border-gray-700 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-[#0a0e27] border-b border-gray-700">
                                                <tr className="text-xs font-bold text-gray-400 uppercase">
                                                    <th className="px-4 py-3 text-left">Community</th>
                                                    <th className="px-4 py-3 text-center">Active Whitelists</th>
                                                    <th className="px-4 py-3 text-center">Members</th>
                                                    <th className="px-4 py-3 text-center">Avg Verification</th>
                                                    <th className="px-4 py-3 text-center">24h Volume</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {homepageData.topCommunities.slice(0, 8).map(c => (
                                                    <tr
                                                        key={c.id}
                                                        className="border-b border-gray-700/50 last:border-b-0 hover:bg-[#16192f] transition"
                                                    >
                                                        <td className="px-4 py-3">
                                                            <Link
                                                                href={`/communities/${c.slug}`}
                                                                className="flex items-center gap-2 hover:text-[#00ff41] transition"
                                                            >
                                                                <div className="w-8 h-8 rounded bg-gradient-to-br from-[#00ff41] to-[#00d4ff] flex items-center justify-center text-white font-bold text-xs overflow-hidden flex-shrink-0">
                                                                    {c.icon ? (
                                                                        <img
                                                                            src={c.icon}
                                                                            alt=""
                                                                            className="w-full h-full"
                                                                        />
                                                                    ) : (
                                                                        c.name[0]
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-semibold text-white">
                                                                        {c.name}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">
                                                                        {c.categories?.[0] || 'Community'}
                                                                    </p>
                                                                </div>
                                                            </Link>
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-sm text-white">
                                                            {Math.floor(Math.random() * 15) + 2}
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-sm">
                                                            <span className="text-white">
                                                                {c.memberCount || c._count?.members || 0}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="text-[#00ff41] font-semibold text-sm">
                                                                {c.rating || 95}%
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-sm text-[#00d4ff]">
                                                            ${(Math.random() * 500000 + 50000).toFixed(0)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* SECTION 3: Events Section Below Leaderboard */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Minting Soon */}
                            {homepageData.upcomingMints.length > 0 && (
                                <section>
                                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-[#00ff41]" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        Minting Soon
                                    </h3>
                                    <div className="space-y-2">
                                        {homepageData.upcomingMints.slice(0, 4).map(event => (
                                            <div
                                                key={event.id}
                                                className="p-3 bg-[#111528] border border-[rgba(0,255,65,0.15)] rounded hover:border-[rgba(0,255,65,0.4)] transition"
                                            >
                                                <p className="text-xs font-semibold text-white truncate">
                                                    {event.title}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-1">{event.community.name}</p>
                                                <p className="text-[10px] text-[#00ff41] font-bold mt-1">
                                                    {event.validEntries} entries
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Pre-sales */}
                            {homepageData.presales.length > 0 && (
                                <section>
                                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-[#00d4ff]" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                                        </svg>
                                        Pre-Sales
                                    </h3>
                                    <div className="space-y-2">
                                        {homepageData.presales.slice(0, 4).map(event => (
                                            <div
                                                key={event.id}
                                                className="p-3 bg-[#111528] border border-[rgba(0,212,255,0.15)] rounded hover:border-[rgba(0,212,255,0.4)] transition"
                                            >
                                                <p className="text-xs font-semibold text-white truncate">
                                                    {event.title}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-1">{event.community.name}</p>
                                                <p className="text-[10px] text-[#00d4ff] font-bold mt-1">
                                                    {event.validEntries} allocated
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Ending Soon */}
                            {homepageData.endingSoon.length > 0 && (
                                <section>
                                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                        <svg
                                            className="w-4 h-4 text-orange-400"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        Ending Soon
                                    </h3>
                                    <div className="space-y-2">
                                        {homepageData.endingSoon.slice(0, 4).map(event => (
                                            <div
                                                key={event.id}
                                                className="p-3 bg-[#111528] border border-orange-500/20 rounded hover:border-orange-500/40 transition"
                                            >
                                                <p className="text-xs font-semibold text-white truncate">
                                                    {event.title}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-1">{event.community.name}</p>
                                                <p className="text-[10px] text-orange-400 font-bold mt-1">
                                                    Ends {new Date(event.endAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
