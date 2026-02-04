/**
 * FeaturedOpportunitySpotlight Component
 *
 * Large showcase card for a featured opportunity
 * Displays on left/center with prominent image and quick info
 * Atlas3-style featured showcase
 */

import Link from 'next/link';
import Image from 'next/image';
import CountdownTimer from './CountdownTimer';

interface FeaturedOpportunityProps {
    id: string;
    type?: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    endAt: Date | string;
    maxWinners: number;
    validEntries: number;
    community: {
        name: string;
        slug: string;
        icon: string | null;
    };
}

export default function FeaturedOpportunitySpotlight({
    id,
    type = 'WHITELIST',
    title,
    description,
    imageUrl,
    endAt,
    maxWinners,
    validEntries,
    community,
}: FeaturedOpportunityProps) {
    const opportunityHref = `/whitelists/${id}`;
    const endDate = typeof endAt === 'string' ? new Date(endAt) : endAt;
    const isEnded = endDate < new Date();

    return (
        <Link href={opportunityHref}>
            <div className="group relative overflow-hidden rounded-xl border border-[rgba(0,255,65,0.3)] bg-gradient-to-br from-[#111528] to-[#0a0e27] hover:border-[#00ff41] transition-all duration-500 shadow-[0_0_30px_rgba(0,255,65,0.1)] hover:shadow-[0_0_45px_rgba(0,255,65,0.25)]">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
                    {/* Image Section - Left Side */}
                    <div className="lg:col-span-3 relative h-40 lg:h-44 overflow-hidden bg-black">
                        {imageUrl ? (
                            <Image
                                src={imageUrl}
                                alt={title}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[rgba(0,255,65,0.1)] to-[rgba(0,212,255,0.1)]">
                                <svg
                                    className="w-24 h-24 text-[#00d4ff] opacity-20"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1}
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                            </div>
                        )}

                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(10,14,39,0.9)] via-transparent to-transparent" />

                        {/* Type Badge - Top Left */}
                        <div className="absolute top-3 left-3 z-10">
                            <div className="px-2.5 py-1 rounded-full bg-[rgba(0,255,65,0.2)] border border-[#00ff41] flex items-center gap-2">
                                <span className="w-2 h-2 bg-[#00ff41] rounded-full animate-pulse" />
                                <span className="text-[10px] font-bold text-[#00ff41] uppercase">{type}</span>
                            </div>
                        </div>
                    </div>

                    {/* Content Section - Right Side */}
                    <div className="lg:col-span-2 p-3 lg:p-4 flex flex-col justify-between">
                        {/* Community Info */}
                        <div className="mb-3">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-black flex-shrink-0">
                                    {community.icon ? (
                                        <Image
                                            src={community.icon}
                                            alt={community.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-lg font-bold text-[#00d4ff]">
                                            {community.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-gray-400 uppercase">From</p>
                                    <p className="text-sm font-bold text-white truncate">{community.name}</p>
                                </div>
                            </div>

                            {/* Title */}
                            <h3 className="text-lg lg:text-xl font-black text-white mb-2 line-clamp-2 group-hover:text-[#00ff41] transition-colors">
                                {title}
                            </h3>

                            {/* Description */}
                            {description && <p className="text-xs text-gray-300 line-clamp-2 mb-3">{description}</p>}
                        </div>

                        {/* Stats & CTA */}
                        <div className="space-y-3">
                            {/* Stats Row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-2 rounded-lg bg-[rgba(0,255,65,0.05)] border border-[rgba(0,255,65,0.2)]">
                                    <p className="text-[9px] text-gray-400 uppercase">Spots</p>
                                    <p className="text-base font-black text-[#00ff41]">{maxWinners}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-[rgba(0,212,255,0.05)] border border-[rgba(0,212,255,0.2)]">
                                    <p className="text-[9px] text-gray-400 uppercase">Entries</p>
                                    <p className="text-base font-black text-[#00d4ff]">{validEntries}</p>
                                </div>
                            </div>

                            {/* Countdown */}
                            {!isEnded && (
                                <div className="p-2 rounded-lg bg-[rgba(255,200,87,0.05)] border border-[rgba(255,200,87,0.2)]">
                                    <p className="text-[9px] text-gray-400 uppercase mb-1">Ends in</p>
                                    <CountdownTimer endDate={endDate} />
                                </div>
                            )}

                            {isEnded && (
                                <div className="p-2 rounded-lg bg-[rgba(255,87,87,0.05)] border border-[rgba(255,87,87,0.2)]">
                                    <p className="text-[10px] text-red-400 font-bold uppercase">Event Ended</p>
                                </div>
                            )}

                            {/* Join CTA */}
                            <button className="w-full py-2 rounded-lg bg-[#00ff41] text-black font-black hover:bg-[#00dd33] transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(0,255,65,0.45)] uppercase text-xs">
                                Join Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
