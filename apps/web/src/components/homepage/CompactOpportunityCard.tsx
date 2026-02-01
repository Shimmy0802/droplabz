'use client';

/**
 * CompactOpportunityCard Component
 *
 * Smaller card optimized for 4-6 column grid layouts
 * Shows essential information efficiently
 * Used in marketplace grid view
 */

import Link from 'next/link';
import Image from 'next/image';
import CountdownTimer from './CountdownTimer';

interface CompactOpportunityCardProps {
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

export default function CompactOpportunityCard({
    id,
    type = 'WHITELIST',
    title,
    description,
    imageUrl,
    endAt,
    maxWinners,
    validEntries,
    community,
}: CompactOpportunityCardProps) {
    const opportunityHref = `/whitelists/${id}`;
    const endDate = typeof endAt === 'string' ? new Date(endAt) : endAt;
    const isEnded = endDate < new Date();
    const timeUntilEnd = endDate.getTime() - new Date().getTime();
    const hoursLeft = Math.floor(timeUntilEnd / (1000 * 60 * 60));

    return (
        <Link href={opportunityHref}>
            <div className="group h-full flex flex-col rounded-xl border border-[rgba(0,212,255,0.2)] bg-gradient-to-br from-[#111528] to-[#0a0e27] hover:border-[#00ff41] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,65,0.2)] overflow-hidden">
                {/* Image Container */}
                <div className="relative h-32 overflow-hidden bg-black">
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[rgba(0,255,65,0.05)] to-[rgba(0,212,255,0.05)]">
                            <svg
                                className="w-16 h-16 text-[#00d4ff] opacity-20"
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

                    {/* Type Badge - Top Left */}
                    <div className="absolute top-2 left-2 z-10">
                        <span className="inline-block px-2 py-1 rounded-full bg-[rgba(0,255,65,0.2)] border border-[#00ff41] text-[10px] font-bold text-[#00ff41] uppercase">
                            {type}
                        </span>
                    </div>

                    {/* Hot Badge - Top Right */}
                    {hoursLeft < 24 && !isEnded && (
                        <div className="absolute top-2 right-2 z-10">
                            <span className="inline-block px-2 py-1 rounded-full bg-[rgba(255,200,87,0.2)] border border-[rgba(255,200,87,0.5)] text-[10px] font-bold text-yellow-400 uppercase flex items-center gap-1">
                                🔥 Hot
                            </span>
                        </div>
                    )}
                </div>

                {/* Content Container */}
                <div className="flex-1 p-3 flex flex-col">
                    {/* Community Info - Compact */}
                    <div className="flex items-center gap-2 mb-2">
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-black flex-shrink-0">
                            {community.icon ? (
                                <Image src={community.icon} alt={community.name} fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[#00d4ff]">
                                    {community.name.charAt(0)}
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] text-gray-400 truncate">{community.name}</p>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-white mb-1 line-clamp-2 group-hover:text-[#00ff41] transition-colors">
                        {title}
                    </h3>

                    {/* Description - Minimal */}
                    {description && <p className="text-[10px] text-gray-500 line-clamp-1 mb-2">{description}</p>}

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-[rgba(0,255,65,0.05)] border border-[rgba(0,255,65,0.15)] text-center">
                            <p className="text-[9px] text-gray-400 uppercase">Spots</p>
                            <p className="text-xs font-black text-[#00ff41]">{maxWinners}</p>
                        </div>
                        <div className="p-1.5 rounded-lg bg-[rgba(0,212,255,0.05)] border border-[rgba(0,212,255,0.15)] text-center">
                            <p className="text-[9px] text-gray-400 uppercase">Entries</p>
                            <p className="text-xs font-black text-[#00d4ff]">{validEntries}</p>
                        </div>
                    </div>

                    {/* Countdown or Status */}
                    {!isEnded ? (
                        <div className="text-[10px] text-gray-400 mb-2">
                            <p className="uppercase font-bold text-yellow-400 mb-1">Ends in</p>
                            <CountdownTimer endDate={endDate} />
                        </div>
                    ) : (
                        <div className="text-[10px] text-red-400 font-bold uppercase mb-2">Event Ended</div>
                    )}

                    {/* Join Button */}
                    <button className="w-full py-2 px-3 rounded-lg bg-[#00ff41] text-black font-bold hover:bg-[#00dd33] transition-all duration-300 uppercase text-[10px] shadow-md hover:shadow-[0_0_20px_rgba(0,255,65,0.4)]">
                        Join
                    </button>
                </div>
            </div>
        </Link>
    );
}
