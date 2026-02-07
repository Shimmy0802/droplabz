'use client';

import Image from 'next/image';
import { CategoriesBadges } from '@/components/CategoryBadge';
import { JoinCommunityButton } from './JoinCommunityButton';

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
        isListed?: boolean;
        socials?: {
            twitter?: string | null;
            discord?: string | null;
            website?: string | null;
            instagram?: string | null;
        } | null;
    };
    memberCount: number;
    reviewCount: number;
    isAdmin?: boolean;
    isMember?: boolean;
    isAuthenticated?: boolean;
    onJoinSuccess?: () => void;
}

// Social link button configurations for consistent styling
const SOCIAL_BUTTONS = {
    discord: {
        bgColor: 'bg-[#5865F2]/20',
        borderColor: 'border-[#5865F2]/40',
        textColor: 'text-[#5865F2]',
        hoverBg: 'hover:bg-[#5865F2]/30',
        hoverBorder: 'hover:border-[#5865F2]/60',
    },
    twitter: {
        bgColor: 'bg-[#1DA1F2]/20',
        borderColor: 'border-[#1DA1F2]/40',
        textColor: 'text-[#1DA1F2]',
        hoverBg: 'hover:bg-[#1DA1F2]/30',
        hoverBorder: 'hover:border-[#1DA1F2]/60',
    },
    website: {
        bgColor: 'bg-gray-700/20',
        borderColor: 'border-gray-600/40',
        textColor: 'text-gray-300',
        hoverBg: 'hover:bg-gray-700/40',
        hoverBorder: 'hover:border-gray-600/60',
    },
    instagram: {
        bgColor: 'bg-gradient-to-br from-[#f09433]/20 to-[#bc1888]/20',
        borderColor: 'border-pink-500/40',
        textColor: 'text-pink-400',
        hoverBg: 'hover:from-[#f09433]/30 hover:to-[#bc1888]/30',
        hoverBorder: 'hover:border-pink-500/60',
    },
} as const;

export function CommunityHeader({
    community,
    memberCount,
    reviewCount,
    isAdmin,
    isMember,
    isAuthenticated,
    onJoinSuccess,
}: CommunityHeaderProps) {
    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${community.name} on DropLabz`,
                    url: url,
                });
            } catch (err) {
                // User cancelled or error - fallback to clipboard
                navigator.clipboard.writeText(url);
                alert('Link copied to clipboard!');
            }
        } else {
            navigator.clipboard.writeText(url);
            alert('Link copied to clipboard!');
        }
    };

    return (
        <div className="bg-gradient-to-br from-[#111528] to-[#0a0e27] border border-[rgba(0,255,65,0.2)] rounded-lg overflow-hidden">
            {/* Banner with Dark Overlay */}
            <div className="relative h-40 z-0">
                {community.banner ? (
                    <>
                        <Image src={community.banner} alt={`${community.name} banner`} fill className="object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
                    </>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-[#1a1f3a]/80 via-[#0f1729]/60 to-[#1a1f3a]/80" />
                )}
            </div>

            {/* Main Content Section */}
            <div className="relative px-6 pb-8 pt-4">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Column: Community Info */}
                    <div className="flex-1 min-w-0">
                        {/* Avatar */}
                        <div className="relative -mt-20 mb-6 z-10 w-fit">
                            <div className="relative w-24 h-24 rounded-xl border-4 border-[#0a0e27] overflow-hidden bg-[#111528] shadow-lg">
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
                            {/* NFT Badge positioned on avatar */}
                            {community.nftMintAddress && (
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#00d4ff] rounded-full flex items-center justify-center border-2 border-[#0a0e27] shadow-md">
                                    <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M13 7H7v6h6V7z" />
                                        <path
                                            fillRule="evenodd"
                                            d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                            )}
                        </div>

                        {/* Community Name & Badge */}
                        <div className="mb-4 flex items-baseline gap-2">
                            <h1 className="text-3xl font-bold text-white">{community.name}</h1>
                            {community.isVerified && (
                                <svg
                                    className="w-6 h-6 flex-shrink-0 text-[#00d4ff]"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            )}
                        </div>

                        {/* Categories & Tags */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {community.categories && community.categories.length > 0 && (
                                <CategoriesBadges categories={community.categories} />
                            )}
                            {community.tags.slice(0, 3).map(tag => (
                                <span
                                    key={tag}
                                    className="px-3 py-1 rounded-full bg-[rgba(0,255,65,0.15)] text-[#00ff41] text-xs font-semibold whitespace-nowrap"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>

                        {/* Stats */}
                        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-300 mb-4">
                            <div className="flex items-center gap-2">
                                <svg
                                    className="w-5 h-5 flex-shrink-0 text-[#00d4ff]"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                </svg>
                                <span>{memberCount.toLocaleString()} members</span>
                            </div>

                            {community.rating !== null && community.rating !== undefined && (
                                <div className="flex items-center gap-2">
                                    <svg
                                        className="w-5 h-5 flex-shrink-0 text-yellow-400"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
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
                            <p className="text-gray-300 leading-relaxed text-sm">{community.description}</p>
                        )}
                    </div>

                    {/* Right Column: Action Buttons */}
                    <div className="flex flex-col gap-3 items-start">
                        {/* Join Button */}
                        <JoinCommunityButton
                            communityId={community.id}
                            isAuthenticated={isAuthenticated || false}
                            isMember={isMember || false}
                            isListed={community.isListed || false}
                            onJoinSuccess={onJoinSuccess}
                        />

                        {/* Share Button */}
                        <button
                            onClick={handleShare}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-800/50 border border-gray-700 text-white font-semibold rounded-lg hover:bg-gray-800/70 hover:border-gray-600/80 transition duration-200"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                                />
                            </svg>
                            Share Community
                        </button>

                        {/* Social Links - Icon Only, Consistent Styling */}
                        {(() => {
                            console.log('🔗 Community socials:', JSON.stringify(community.socials, null, 2));
                            return null;
                        })()}
                        {community.socials && (
                            <div className="flex gap-2 flex-wrap">
                                {/* Discord */}
                                {community.socials.discord && (
                                    <a
                                        href={community.socials.discord}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Join Discord"
                                        className={`p-3 rounded-lg border transition duration-200 ${SOCIAL_BUTTONS.discord.bgColor} ${SOCIAL_BUTTONS.discord.borderColor} ${SOCIAL_BUTTONS.discord.textColor} ${SOCIAL_BUTTONS.discord.hoverBg} ${SOCIAL_BUTTONS.discord.hoverBorder}`}
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M20.317 4.3671a19.8062 19.8062 0 00-4.8383-1.49c-.21.12-.402.281-.583.481-.56-.084-1.113-.187-1.66-.187-.547 0-1.1.103-1.66.187-.181-.2-.383-.361-.583-.481a19.8062 19.8062 0 00-4.8383 1.49 19.5244 19.5244 0 00-3.251 6.46c0 .605.074 1.202.217 1.794.15.592.426 1.18.822 1.76a19.7394 19.7394 0 006.002 5.91c.5.375 1.041.71 1.605 1.001.564.291 1.149.529 1.75.71a14.995 14.995 0 001.75-.71c.565-.291 1.105-.626 1.606-1.001a19.7394 19.7394 0 006.002-5.91c.396-.58.672-1.168.822-1.76.143-.592.217-1.189.217-1.794 0-2.43-.78-4.694-2.336-6.46-.379-.603-.848-1.156-1.397-1.66zm-5.4987 7.35a1.887 1.887 0 11-3.773 0 1.887 1.887 0 013.773 0zm5.064 0a1.887 1.887 0 11-3.773 0 1.887 1.887 0 013.773 0z" />
                                        </svg>
                                    </a>
                                )}

                                {/* Twitter */}
                                {community.socials.twitter && (
                                    <a
                                        href={community.socials.twitter}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Follow on Twitter"
                                        className={`p-3 rounded-lg border transition duration-200 ${SOCIAL_BUTTONS.twitter.bgColor} ${SOCIAL_BUTTONS.twitter.borderColor} ${SOCIAL_BUTTONS.twitter.textColor} ${SOCIAL_BUTTONS.twitter.hoverBg} ${SOCIAL_BUTTONS.twitter.hoverBorder}`}
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417a9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                                        </svg>
                                    </a>
                                )}

                                {/* Website */}
                                {community.socials.website && (
                                    <a
                                        href={community.socials.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Visit Website"
                                        className={`p-3 rounded-lg border transition duration-200 ${SOCIAL_BUTTONS.website.bgColor} ${SOCIAL_BUTTONS.website.borderColor} ${SOCIAL_BUTTONS.website.textColor} ${SOCIAL_BUTTONS.website.hoverBg} ${SOCIAL_BUTTONS.website.hoverBorder}`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                                            />
                                        </svg>
                                    </a>
                                )}

                                {/* Instagram */}
                                {community.socials.instagram && (
                                    <a
                                        href={community.socials.instagram}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Follow on Instagram"
                                        className={`p-3 rounded-lg border transition duration-200 ${SOCIAL_BUTTONS.instagram.bgColor} ${SOCIAL_BUTTONS.instagram.borderColor} ${SOCIAL_BUTTONS.instagram.textColor} ${SOCIAL_BUTTONS.instagram.hoverBg} ${SOCIAL_BUTTONS.instagram.hoverBorder}`}
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03z" />
                                        </svg>
                                    </a>
                                )}
                            </div>
                        )}

                        {/* NFT Info Link */}
                        {community.nftMintAddress && (
                            <a
                                href={`https://solana.fm/address/${community.nftMintAddress}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.3)] text-[#00d4ff] hover:bg-[rgba(0,212,255,0.2)] hover:border-[rgba(0,212,255,0.4)] transition duration-200 text-sm font-medium"
                            >
                                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
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
        </div>
    );
}
