import Link from 'next/link';
import Image from 'next/image';
import CountdownTimer from './CountdownTimer';

interface WhitelistCardProps {
    id: string;
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
    variant?: 'default' | 'trending';
}

export default function WhitelistCard({
    id,
    title,
    description,
    imageUrl,
    endAt,
    maxWinners,
    validEntries,
    community,
    variant = 'default',
}: WhitelistCardProps) {
    const spotsRemaining = Math.max(0, maxWinners - validEntries);
    const percentFilled = maxWinners > 0 ? (validEntries / maxWinners) * 100 : 0;
    const isTrending = variant === 'trending' && validEntries > maxWinners * 0.8;
    const isAlmostFull = spotsRemaining <= Math.ceil(maxWinners * 0.1);

    return (
        <Link href={`/whitelists/${id}`}>
            <div
                className={`group h-full rounded-lg border transition-all duration-300 cursor-pointer overflow-hidden ${
                    variant === 'trending'
                        ? 'border-[#00ff41] bg-gradient-to-br from-[rgba(0,255,65,0.08)] to-[#000000] hover:border-[#00ffff] hover:shadow-[0_0_40px_rgba(0,255,65,0.4)]'
                        : 'border-[rgba(0,255,65,0.2)] bg-gradient-to-br from-[#0a0a0a] to-[#000000] hover:border-[#00ff41] hover:shadow-[0_0_30px_rgba(0,255,65,0.2)]'
                }`}
            >
                {/* Image */}
                <div className="relative h-36 bg-black overflow-hidden">
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#00ff41] to-[#00d4ff]">
                            <svg className="w-16 h-16 text-black" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                    )}
                    {/* Badge */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[rgba(0,255,65,0.9)] text-black text-[10px] font-bold uppercase backdrop-blur-sm">
                        Whitelist
                    </div>

                    {/* Trending/Hot Badge */}
                    {isTrending && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-yellow-400 text-black text-[10px] font-bold uppercase backdrop-blur-sm">
                            🔥 Hot
                        </div>
                    )}
                    {isAlmostFull && !isTrending && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold uppercase backdrop-blur-sm">
                            ⚡ Limited
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-4">
                    {/* Community Info */}
                    <div className="flex items-center gap-2 mb-2">
                        <div className="relative w-5 h-5 rounded overflow-hidden bg-black">
                            {community.icon ? (
                                <Image src={community.icon} alt={community.name} fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[#00d4ff]">
                                    {community.name.charAt(0)}
                                </div>
                            )}
                        </div>
                        <span className="text-xs text-gray-400">{community.name}</span>
                    </div>

                    {/* Title */}
                    <h3
                        className={`text-base font-bold transition-colors mb-2 line-clamp-1 ${
                            variant === 'trending'
                                ? 'text-[#00ff41] group-hover:text-[#00ffff]'
                                : 'text-white group-hover:text-[#00ff41]'
                        }`}
                    >
                        {title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-gray-400 mb-3 line-clamp-2 min-h-[32px]">
                        {description || 'Join this whitelist to secure your spot'}
                    </p>

                    {/* Countdown */}
                    <div
                        className={`mb-3 p-2 rounded-lg ${
                            variant === 'trending'
                                ? 'bg-[rgba(0,255,65,0.1)] border border-[rgba(0,255,65,0.3)]'
                                : 'bg-[rgba(0,212,255,0.05)] border border-[rgba(0,212,255,0.2)]'
                        }`}
                    >
                        <div className="text-[10px] text-gray-400 mb-1 uppercase">Ends In</div>
                        <CountdownTimer endDate={endAt} variant="compact" />
                    </div>

                    {/* Progress */}
                    <div className="mb-3">
                        <div className="flex items-center justify-between text-[10px] mb-1.5">
                            <span className="text-gray-400">Spots Filled</span>
                            <span className={`font-medium ${percentFilled >= 90 ? 'text-red-400' : 'text-white'}`}>
                                {validEntries} / {maxWinners}
                            </span>
                        </div>
                        <div className="w-full h-2 bg-[#0a0e27] rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-300 ${
                                    percentFilled >= 90
                                        ? 'bg-gradient-to-r from-red-500 to-red-400'
                                        : 'bg-gradient-to-r from-[#00ff41] to-[#00d4ff]'
                                }`}
                                style={{ width: `${Math.min(percentFilled, 100)}%` }}
                            />
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="flex items-center justify-between pt-3 border-t border-[rgba(0,212,255,0.1)]">
                        <div className="text-xs">
                            {spotsRemaining > 0 ? (
                                <span className={`font-medium ${isAlmostFull ? 'text-red-400' : 'text-[#00ff41]'}`}>
                                    {spotsRemaining} spots left
                                </span>
                            ) : (
                                <span className="text-red-400 font-medium">Filled</span>
                            )}
                        </div>
                        <div
                            className={`${
                                variant === 'trending' ? 'text-[#00ffff]' : 'text-[#00d4ff]'
                            } group-hover:translate-x-1 transition-transform`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                                />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
