import Image from 'next/image';
import { SocialLinks } from './SocialLinks';
import { CategoriesBadges } from '@/components/CategoryBadge';

interface CommunityHeaderProps {
    community: {
        id: string;
        name: string;
        description?: string | null;
        icon?: string | null;
        banner?: string | null;
        categories?: string[];
        tags: string[];
        rating?: number | null;
        nftMintAddress?: string | null;
        isVerified?: boolean;
        socials?: {
            twitter?: string | null;
            discord?: string | null;
            website?: string | null;
            instagram?: string | null;
        } | null;
    };
    memberCount: number;
    reviewCount: number;
}

export function CommunityHeader({ community, memberCount, reviewCount }: CommunityHeaderProps) {
    return (
        <div className="bg-gradient-to-br from-[#111528] to-[#0a0e27] border border-[rgba(0,255,65,0.2)] rounded-lg overflow-hidden">
            {/* Banner/Cover */}
            <div className="relative h-32">
                {community.banner ? (
                    // Custom banner image
                    <>
                        <Image src={community.banner} alt={`${community.name} banner`} fill className="object-cover" />
                        {/* Dark overlay for better text/icon visibility */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40" />
                    </>
                ) : (
                    // Default gradient - darker, more subtle
                    <div className="absolute inset-0 bg-gradient-to-r from-[#1a1f3a]/80 via-[#0f1729]/60 to-[#1a1f3a]/80" />
                )}

                {/* Social Links in Banner - Top Right */}
                <div className="absolute top-4 right-6 z-10">
                    <SocialLinks
                        socials={community.socials}
                        className="flex gap-4"
                        iconClassName="w-6 h-6"
                        variant="banner"
                    />
                </div>
            </div>

            {/* Profile Section */}
            <div className="px-6 pb-6">
                {/* Avatar */}
                <div className="relative -mt-12 mb-4">
                    <div className="relative w-24 h-24 rounded-lg border-4 border-[#0a0e27] overflow-hidden bg-[#111528]">
                        {community.icon ? (
                            <Image src={community.icon} alt={community.name} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#00ff41] to-[#00d4ff]">
                                <span className="text-3xl font-bold text-black">
                                    {community.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Name and Tags */}
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <h1 className="text-2xl font-bold text-white">{community.name}</h1>
                        {community.isVerified && (
                            <svg className="w-6 h-6 text-[#00d4ff]" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        )}
                    </div>

                    {/* Category and Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        {community.categories && community.categories.length > 0 && (
                            <CategoriesBadges categories={community.categories} />
                        )}
                        {community.tags.slice(0, 3).map(tag => (
                            <span
                                key={tag}
                                className="px-3 py-1 rounded-full bg-[rgba(0,255,65,0.15)] text-[#00ff41] text-xs font-semibold"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-6 text-sm text-gray-300 mb-3">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-[#00d4ff]" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                            </svg>
                            <span>{memberCount.toLocaleString()} members</span>
                        </div>

                        {community.rating !== null && community.rating !== undefined && (
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span>
                                    {community.rating.toFixed(1)} ({reviewCount} reviews)
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {community.description && (
                        <p className="text-gray-300 leading-relaxed mb-4">{community.description}</p>
                    )}
                </div>

                {/* NFT Link */}
                <div className="flex items-center justify-end gap-4 pt-4 border-t border-[rgba(0,255,65,0.2)]">
                    {community.nftMintAddress && (
                        <a
                            href={`https://solana.fm/address/${community.nftMintAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.3)] text-[#00d4ff] hover:bg-[rgba(0,212,255,0.2)] transition text-sm"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13 7H7v6h6V7z" />
                                <path
                                    fillRule="evenodd"
                                    d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span className="font-mono text-xs">
                                {community.nftMintAddress.slice(0, 4)}...{community.nftMintAddress.slice(-4)}
                            </span>
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
