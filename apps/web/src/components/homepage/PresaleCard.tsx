import Link from 'next/link';
import Image from 'next/image';
import CountdownTimer from './CountdownTimer';

interface PresaleCardProps {
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
    variant?: 'default' | 'marketplace';
}

export default function PresaleCard({
    id,
    title,
    description,
    imageUrl,
    endAt,
    maxWinners,
    validEntries,
    community,
    variant = 'default',
}: PresaleCardProps) {
    const spotsRemaining = Math.max(0, maxWinners - validEntries);
    const percentFilled = maxWinners > 0 ? (validEntries / maxWinners) * 100 : 0;
    const isHotOpportunity = percentFilled > 70;

    return (
        <Link href={`/whitelists/${id}`}>
            <div
                className={`group h-full rounded-lg border transition-all duration-300 cursor-pointer overflow-hidden ${
                    variant === 'marketplace'
                        ? 'border-[#00d4ff] bg-gradient-to-br from-[rgba(0,212,255,0.08)] to-[#000000] hover:border-[#00ffaa] hover:shadow-[0_0_40px_rgba(0,212,255,0.4)]'
                        : 'border-[rgba(0,212,255,0.2)] bg-gradient-to-br from-[#0a0a0a] to-[#000000] hover:border-[#00d4ff] hover:shadow-[0_0_30px_rgba(0,212,255,0.2)]'
                }`}
            >
                {/* Image */}
                <div className="relative h-32 bg-black overflow-hidden">
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#00d4ff] to-[#00ff41]">
                            <svg className="w-12 h-12 text-black" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                            </svg>
                        </div>
                    )}
                    {/* Badge */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[rgba(0,212,255,0.9)] text-black text-[10px] font-bold uppercase backdrop-blur-sm">
                        Pre-Sale
                    </div>

                    {/* Hot Badge */}
                    {isHotOpportunity && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-yellow-400 text-black text-[10px] font-bold uppercase backdrop-blur-sm">
                            ⭐ Popular
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
                            variant === 'marketplace'
                                ? 'text-[#00d4ff] group-hover:text-[#00ffaa]'
                                : 'text-white group-hover:text-[#00d4ff]'
                        }`}
                    >
                        {title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-gray-400 mb-3 line-clamp-2 min-h-[32px]">
                        {description || 'Participate in this pre-sale'}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <div
                            className={`p-2 rounded-lg border ${
                                variant === 'marketplace'
                                    ? 'bg-[rgba(0,212,255,0.1)] border-[rgba(0,212,255,0.3)]'
                                    : 'bg-[rgba(0,212,255,0.05)] border-[rgba(0,212,255,0.2)]'
                            }`}
                        >
                            <div className="text-[10px] text-gray-400 mb-0.5 uppercase font-bold">Participants</div>
                            <div className="text-base font-bold text-[#00d4ff]">{validEntries}</div>
                        </div>
                        <div
                            className={`p-2 rounded-lg border ${
                                variant === 'marketplace'
                                    ? 'bg-[rgba(0,212,255,0.1)] border-[rgba(0,212,255,0.3)]'
                                    : 'bg-[rgba(0,212,255,0.05)] border-[rgba(0,212,255,0.2)]'
                            }`}
                        >
                            <div className="text-[10px] text-gray-400 mb-0.5 uppercase font-bold">Max Spots</div>
                            <div className="text-base font-bold text-[#00d4ff]">{maxWinners}</div>
                        </div>
                    </div>

                    {/* Countdown */}
                    <div
                        className={`mb-3 p-2 rounded-lg ${
                            variant === 'marketplace'
                                ? 'bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.3)]'
                                : 'bg-[rgba(0,255,65,0.05)] border border-[rgba(0,255,65,0.2)]'
                        }`}
                    >
                        <div className="text-[10px] text-gray-400 mb-1 uppercase font-bold">Ends In</div>
                        <CountdownTimer endDate={endAt} variant="compact" />
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                        <div className="w-full h-1.5 bg-[#0a0e27] rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-300 ${
                                    isHotOpportunity
                                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-300'
                                        : 'bg-gradient-to-r from-[#00d4ff] to-[#00ff41]'
                                }`}
                                style={{ width: `${Math.min(percentFilled, 100)}%` }}
                            />
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="flex items-center justify-between pt-2 text-xs">
                        <div>
                            {spotsRemaining > 0 ? (
                                <span
                                    className={`font-bold ${isHotOpportunity ? 'text-yellow-400' : 'text-[#00d4ff]'}`}
                                >
                                    {spotsRemaining} / {maxWinners} spots
                                </span>
                            ) : (
                                <span className="text-red-400 font-bold">Filled</span>
                            )}
                        </div>
                        <div
                            className={`group-hover:translate-x-1 transition-transform ${
                                variant === 'marketplace' ? 'text-[#00ffaa]' : 'text-[#00d4ff]'
                            }`}
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
