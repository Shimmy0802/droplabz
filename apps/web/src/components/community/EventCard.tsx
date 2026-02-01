'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

interface EventCardProps {
    event: {
        id: string;
        type: string;
        title: string;
        description?: string | null;
        imageUrl?: string | null;
        status: string;
        endAt: Date | string;
        maxWinners: number;
        _count?: {
            entries: number;
        };
    };
    showType?: boolean;
}

export function EventCard({ event, showType = true }: EventCardProps) {
    const endDate = typeof event.endAt === 'string' ? new Date(event.endAt) : event.endAt;
    const spotsRemaining = Math.max(0, event.maxWinners - (event._count?.entries || 0));
    const percentFilled = event.maxWinners > 0 ? ((event._count?.entries || 0) / event.maxWinners) * 100 : 0;
    const isAlmostFull = spotsRemaining <= Math.ceil(event.maxWinners * 0.1);
    const isActive = event.status === 'ACTIVE';
    const isClosed = event.status === 'CLOSED';

    const typeColors = {
        WHITELIST: { bg: 'rgba(0,255,65,0.15)', text: '#00ff41', border: 'rgba(0,255,65,0.3)' },
        GIVEAWAY: { bg: 'rgba(255,215,0,0.15)', text: '#ffd700', border: 'rgba(255,215,0,0.3)' },
        PRESALE: { bg: 'rgba(0,212,255,0.15)', text: '#00d4ff', border: 'rgba(0,212,255,0.3)' },
        COLLABORATION: { bg: 'rgba(147,51,234,0.15)', text: '#9333ea', border: 'rgba(147,51,234,0.3)' },
    };

    const typeConfig = typeColors[event.type as keyof typeof typeColors] || typeColors.WHITELIST;

    // Route to correct event page based on type
    const getEventRoute = () => {
        switch (event.type) {
            case 'GIVEAWAY':
                return `/giveaways/${event.id}`;
            case 'PRESALE':
                return `/presales/${event.id}`;
            case 'COLLABORATION':
                return `/collaborations/${event.id}`;
            case 'WHITELIST':
            default:
                return `/whitelists/${event.id}`;
        }
    };

    return (
        <Link href={getEventRoute()}>
            <div
                className={`group h-full rounded-lg border transition-all duration-300 cursor-pointer overflow-hidden ${
                    isActive
                        ? 'border-[rgba(0,255,65,0.3)] hover:border-[#00ff41] hover:shadow-[0_0_20px_rgba(0,255,65,0.2)]'
                        : 'border-[rgba(100,100,100,0.3)] hover:border-gray-500'
                } bg-gradient-to-br from-[#111528] to-[#0a0e27]`}
            >
                {/* Image */}
                <div className="relative h-36 bg-black overflow-hidden">
                    {event.imageUrl ? (
                        <Image
                            src={event.imageUrl}
                            alt={event.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div
                            className="w-full h-full flex items-center justify-center"
                            style={{
                                background: `linear-gradient(135deg, ${typeConfig.bg}, rgba(0,0,0,0.8))`,
                            }}
                        >
                            <svg className="w-16 h-16 text-white/20" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                    )}

                    {/* Type Badge */}
                    {showType && (
                        <div
                            className="absolute top-2 left-2 px-2 py-1 rounded text-[10px] font-bold uppercase backdrop-blur-sm"
                            style={{
                                backgroundColor: typeConfig.bg,
                                color: typeConfig.text,
                                border: `1px solid ${typeConfig.border}`,
                            }}
                        >
                            {event.type}
                        </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                        {isClosed ? (
                            <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-gray-700 text-gray-300 backdrop-blur-sm">
                                Closed
                            </span>
                        ) : isAlmostFull ? (
                            <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-red-500 text-white backdrop-blur-sm">
                                ⚡ Limited
                            </span>
                        ) : null}
                    </div>
                </div>

                {/* Content */}
                <div className="p-4">
                    {/* Title */}
                    <h3 className="text-base font-bold text-white mb-2 line-clamp-1">{event.title}</h3>

                    {/* Description */}
                    {event.description && (
                        <p className="text-xs text-gray-400 mb-3 line-clamp-2">{event.description}</p>
                    )}

                    {/* Progress Bar */}
                    {isActive && (
                        <div className="mb-3">
                            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                                <span>Entries</span>
                                <span>
                                    {event._count?.entries || 0} / {event.maxWinners}
                                </span>
                            </div>
                            <div className="w-full h-2 bg-[#0a0e27] rounded-full overflow-hidden border border-[rgba(0,255,65,0.2)]">
                                <div
                                    className="h-full bg-gradient-to-r from-[#00ff41] to-[#00d4ff] transition-all"
                                    style={{ width: `${Math.min(percentFilled, 100)}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* End Date */}
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">
                            {isClosed
                                ? 'Ended'
                                : isActive
                                  ? `Ends ${formatDistanceToNow(endDate, { addSuffix: true })}`
                                  : 'Draft'}
                        </span>
                        {isActive && (
                            <span
                                className="font-semibold px-2 py-1 rounded"
                                style={{ color: typeConfig.text, backgroundColor: typeConfig.bg }}
                            >
                                {spotsRemaining} spots
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
