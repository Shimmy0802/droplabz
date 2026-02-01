'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Star, TrendingUp, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Community {
    id: string;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    banner?: string;
    categories?: string[];
    tags?: string[];
    isFeatured?: boolean;
    isVerified?: boolean;
    rating?: number;
    _count?: {
        members: number;
    };
    owner?: {
        username: string;
    };
}

type CategoryFilter = 'All' | 'Featured' | 'Verified' | 'NFT' | 'Gaming' | 'DeFi' | 'DAO' | 'Community';

export default function CommunitiesPage() {
    const [communities, setCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All');

    const categories: CategoryFilter[] = ['All', 'Featured', 'Verified', 'NFT', 'Gaming', 'DeFi', 'DAO', 'Community'];

    useEffect(() => {
        fetchCommunities();
    }, []);

    const fetchCommunities = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/communities?public=true');
            if (!response.ok) throw new Error('Failed to fetch communities');
            const data = await response.json();
            setCommunities(data || []);
        } catch (err) {
            console.error('Error fetching communities:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredCommunities = communities.filter(community => {
        const matchesSearch =
            community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            community.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            community.categories?.some(category => category.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCategory =
            activeCategory === 'All' ||
            (activeCategory === 'Featured' && community.isFeatured) ||
            (activeCategory === 'Verified' && community.isVerified) ||
            community.categories?.includes(activeCategory) ||
            community.tags?.includes(activeCategory);

        return matchesSearch && matchesCategory;
    });

    return (
        <div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-white">NFT Communities Ecosystem</h1>
                    <p className="text-gray-400">Discover and join verified Web3 communities building on Solana</p>
                </div>

                {/* Category Navigation */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                                activeCategory === category
                                    ? 'bg-[#00ff41] text-[#0a0e27]'
                                    : 'bg-[#111528] text-gray-400 hover:text-white border border-[rgba(0,212,255,0.1)] hover:border-[#00d4ff]'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Search communities..."
                            className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-[#111528] border border-[rgba(0,212,255,0.1)] text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff41] transition"
                        />
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span className="font-semibold text-white">{filteredCommunities.length}</span>
                        <span>communities found</span>
                    </div>
                </div>

                {/* Communities Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00ff41]"></div>
                    </div>
                ) : filteredCommunities.length === 0 ? (
                    <div className="text-center py-16 border border-[rgba(0,212,255,0.1)] rounded-lg bg-[#111528]">
                        <p className="text-gray-400 mb-6">
                            {searchTerm || activeCategory !== 'All'
                                ? 'No communities found matching your criteria'
                                : 'No public communities yet. Be the first to create one!'}
                        </p>
                        <Link
                            href="/dashboard"
                            className="inline-block px-6 py-3 rounded-lg bg-[#00ff41] text-[#0a0e27] font-semibold hover:bg-[#00dd33] transition"
                        >
                            Create Community
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredCommunities.map(community => (
                            <CommunityCard key={community.id} community={community} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function CommunityCard({ community }: { community: Community }) {
    const primaryCategory = community.categories?.[0];
    const categoryColor =
        primaryCategory === 'NFT'
            ? 'bg-purple-500/20 text-purple-300'
            : primaryCategory === 'Gaming'
              ? 'bg-blue-500/20 text-blue-300'
              : primaryCategory === 'DeFi'
                ? 'bg-green-500/20 text-green-300'
                : primaryCategory === 'DAO'
                  ? 'bg-orange-500/20 text-orange-300'
                  : primaryCategory === 'Community'
                    ? 'bg-pink-500/20 text-pink-300'
                    : 'bg-gray-500/20 text-gray-300';

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <Link
            href={`/communities/${community.slug}`}
            className="group block p-5 rounded-lg border border-[rgba(0,212,255,0.1)] bg-[#111528] hover:border-[#00ff41] hover:shadow-lg hover:shadow-[rgba(0,255,65,0.15)] transition-all duration-300"
        >
            <div className="flex items-start gap-4">
                {/* Logo */}
                <div className="flex-shrink-0">
                    {community.icon ? (
                        <img
                            src={community.icon}
                            alt={community.name}
                            className="w-16 h-16 rounded-lg object-cover bg-[#0a0e27]"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#00ff41]/20 to-[#00d4ff]/20 flex items-center justify-center text-xl font-bold text-white">
                            {getInitials(community.name)}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Category Badge & Featured */}
                    <div className="flex items-center gap-2 mb-2">
                        {primaryCategory && (
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoryColor}`}>
                                {primaryCategory}
                            </span>
                        )}
                        {community.isFeatured && <Star className="w-4 h-4 text-[#00ff41] fill-[#00ff41]" />}
                        {community.isVerified && <span className="text-xs text-[#00d4ff]">Verified</span>}
                    </div>

                    {/* Name */}
                    <h3 className="text-lg font-bold text-white mb-1 line-clamp-1 group-hover:text-[#00ff41] transition">
                        {community.name}
                    </h3>

                    {/* Platform Badge */}
                    <div className="flex items-center gap-1.5 mb-2">
                        <div className="px-2 py-0.5 rounded bg-[#14F195]/10 border border-[#14F195]/30">
                            <span className="text-xs font-medium text-[#14F195]">Solana</span>
                        </div>
                        {community.tags && community.tags.length > 0 && (
                            <div className="px-2 py-0.5 rounded bg-[#00d4ff]/10 border border-[#00d4ff]/30">
                                <span className="text-xs font-medium text-[#00d4ff]">+{community.tags.length}</span>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                        {community.description ||
                            'Join this community to participate in exclusive events and whitelists'}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4" />
                            <span className="font-medium">{community._count?.members || 0}</span>
                            <span>members</span>
                        </div>
                        {community.rating && (
                            <div className="flex items-center gap-1.5">
                                <Star className="w-4 h-4 text-[#00ff41]" />
                                <span className="font-medium text-white">{community.rating.toFixed(1)}</span>
                            </div>
                        )}
                        <div className="ml-auto">
                            <TrendingUp className="w-4 h-4 text-[#00d4ff] group-hover:text-[#00ff41] transition" />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
