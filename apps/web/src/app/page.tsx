export const dynamic = 'force-dynamic';

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
    isVerified?: boolean;
    socials?: {
        twitter?: string | null;
        discord?: string | null;
        website?: string | null;
        instagram?: string | null;
    } | null;
    memberCount?: number;
    activeMemberCount?: number;
    activeWhitelistCount?: number;
    activeGiveawayCount?: number;
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
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {featuredCommunities.map(c => (
                                        <Link key={c.id} href={`/communities/${c.slug}`} className="group">
                                            <div className="h-full rounded-lg border border-[rgba(0,255,65,0.2)] group-hover:border-[rgba(0,255,65,0.5)] overflow-hidden transition bg-gradient-to-b from-[#111528] to-[#0a0e27]">
                                                {/* Banner */}
                                                <div
                                                    className={`w-full h-32 relative overflow-hidden transition ${
                                                        !c.banner
                                                            ? 'bg-gradient-to-br from-[#00ff41]/10 to-[#00d4ff]/10 group-hover:from-[#00ff41]/20 group-hover:to-[#00d4ff]/20'
                                                            : 'bg-cover bg-center'
                                                    }`}
                                                    style={
                                                        c.banner
                                                            ? {
                                                                  backgroundImage: `url('${c.banner}')`,
                                                                  backgroundSize: 'cover',
                                                                  backgroundPosition: 'center',
                                                              }
                                                            : {}
                                                    }
                                                >
                                                    {!c.banner && (
                                                        <div className="absolute inset-0 bg-gradient-to-br from-[#00ff41] to-[#00d4ff] opacity-10" />
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className="p-4 space-y-3">
                                                    {/* Header */}
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-12 h-12 rounded bg-gradient-to-br from-[#00ff41] to-[#00d4ff] flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0">
                                                            {c.icon ? (
                                                                <img src={c.icon} alt="" className="w-full h-full" />
                                                            ) : (
                                                                c.name[0]
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-white font-bold truncate group-hover:text-[#00ff41] transition">
                                                                {c.name}
                                                            </h3>
                                                            {c.categories && c.categories.length > 0 && (
                                                                <p className="text-[#00d4ff] text-xs">
                                                                    {c.categories[0]}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Description */}
                                                    {c.description && (
                                                        <p className="text-gray-300 text-sm line-clamp-2">
                                                            {c.description}
                                                        </p>
                                                    )}

                                                    {/* Stats */}
                                                    <div className="flex items-center justify-between text-xs border-t border-gray-700 pt-3">
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-gray-400">
                                                                👥 {c._count?.members || 0}
                                                            </span>
                                                            {c.rating && (
                                                                <span className="text-[#00ff41] font-bold">
                                                                    ⭐ {c.rating}%
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Socials */}
                                                    {c.socials &&
                                                        (c.socials.twitter ||
                                                            c.socials.discord ||
                                                            c.socials.website ||
                                                            c.socials.instagram) && (
                                                            <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
                                                                {c.socials.twitter && (
                                                                    <a
                                                                        href={c.socials.twitter}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-gray-400 hover:text-[#00d4ff] transition"
                                                                        title="Twitter"
                                                                    >
                                                                        <svg
                                                                            className="w-4 h-4"
                                                                            fill="currentColor"
                                                                            viewBox="0 0 24 24"
                                                                        >
                                                                            <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 7-1 7-4 0-.5-.06-1-.12-1.5A7.52 7.52 0 0023 3z" />
                                                                        </svg>
                                                                    </a>
                                                                )}
                                                                {c.socials.discord && (
                                                                    <a
                                                                        href={c.socials.discord}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-gray-400 hover:text-[#00d4ff] transition"
                                                                        title="Discord"
                                                                    >
                                                                        <svg
                                                                            className="w-4 h-4"
                                                                            fill="currentColor"
                                                                            viewBox="0 0 24 24"
                                                                        >
                                                                            <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.211.375-.444.864-.607 1.25a18.27 18.27 0 00-5.487 0c-.163-.386-.399-.875-.607-1.25a.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.873-1.295 1.226-1.994a.076.076 0 00-.042-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.294.075.075 0 01.078-.01c3.927 1.793 8.18 1.793 12.062 0a.075.075 0 01.079.009c.12.098.246.198.373.295a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.076.076 0 00-.041.107c.359.698.77 1.364 1.225 1.994a.077.077 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.056c.5-4.506.093-8.413-.404-12.657a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-.965-2.157-2.156 0-1.193.964-2.157 2.157-2.157 1.193 0 2.156.964 2.157 2.157 0 1.19-.964 2.156-2.157 2.156zm7.975 0c-1.183 0-2.157-.965-2.157-2.156 0-1.193.965-2.157 2.157-2.157 1.192 0 2.157.964 2.157 2.157 0 1.19-.965 2.156-2.157 2.156z" />
                                                                        </svg>
                                                                    </a>
                                                                )}
                                                                {c.socials.website && (
                                                                    <a
                                                                        href={c.socials.website}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-gray-400 hover:text-[#00d4ff] transition"
                                                                        title="Website"
                                                                    >
                                                                        <svg
                                                                            className="w-4 h-4"
                                                                            fill="currentColor"
                                                                            viewBox="0 0 24 24"
                                                                        >
                                                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                                                        </svg>
                                                                    </a>
                                                                )}
                                                                {c.socials.instagram && (
                                                                    <a
                                                                        href={c.socials.instagram}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-gray-400 hover:text-[#00d4ff] transition"
                                                                        title="Instagram"
                                                                    >
                                                                        <svg
                                                                            className="w-4 h-4"
                                                                            fill="currentColor"
                                                                            viewBox="0 0 24 24"
                                                                        >
                                                                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.057-1.645.069-4.849.069-3.204 0-3.584-.012-4.849-.069-3.259-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163C8.756 0 8.331.012 7.052.07 2.696.278.278 2.579.07 7.052c-.058 1.28-.07 1.704-.07 7.052 0 5.348.012 5.772.07 7.052.278 4.476 2.597 6.894 7.052 7.102 1.279.058 1.704.07 7.052.07 5.348 0 5.772-.012 7.052-.07 4.476-.278 6.894-2.598 7.103-7.052.058-1.28.07-1.704.07-7.052 0-5.348-.012-5.771-.07-7.052-.278-4.475-2.596-6.894-7.052-7.103-1.28-.058-1.704-.07-7.052-.07z" />
                                                                            <path d="M12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a4 4 0 110 -8 4 4 0 010 8zm4.965-10.322a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z" />
                                                                        </svg>
                                                                    </a>
                                                                )}
                                                            </div>
                                                        )}
                                                </div>
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
                        <section id="trending">
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
                                                    <th className="px-4 py-3 text-center">Active Giveaways</th>
                                                    <th className="px-4 py-3 text-center">Total Members</th>
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
                                                            {c.activeWhitelistCount || 0}
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-sm text-white">
                                                            {c.activeGiveawayCount || 0}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="text-[#00ff41] font-semibold text-sm">
                                                                {c.memberCount || c._count?.members || 0}
                                                            </span>
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
                        <div id="events" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

                        {/* SECTION 4: Giveaways */}
                        <section id="giveaways" className="mt-6">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <svg className="w-4 h-4 text-[#00ff41]" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M4 3a1 1 0 011-1h10a1 1 0 011 1v2a3 3 0 11-2 5.83V14a2 2 0 01-2 2H8a2 2 0 01-2-2V10.83A3 3 0 014 5V3z" />
                                    </svg>
                                    Giveaways
                                </h3>
                                <Link
                                    href="/profile/communities/create"
                                    className="text-xs px-3 py-1.5 rounded border border-[#00d4ff] text-[#00d4ff] hover:bg-[rgba(0,212,255,0.1)] transition"
                                >
                                    Create Community
                                </Link>
                            </div>
                            <div className="bg-[#111528] border border-[rgba(0,255,65,0.15)] rounded p-4 text-sm text-gray-400">
                                Giveaways surface here when communities publish active events.
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
