'use client';

interface ActionButtonsProps {
    discordUrl?: string | null;
    websiteUrl?: string | null;
}

export function ActionButtons({ discordUrl, websiteUrl }: ActionButtonsProps) {
    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: document.title,
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
        <div className="flex flex-wrap gap-3">
            {discordUrl && (
                <a
                    href={discordUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3 bg-[#00ff41] text-[#0a0e27] font-semibold rounded-lg hover:bg-[#00dd33] transition"
                >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.317 4.3671a19.8062 19.8062 0 00-4.8383-1.49c-.21.12-.402.281-.583.481-.56-.084-1.113-.187-1.66-.187-.547 0-1.1.103-1.66.187-.181-.2-.383-.361-.583-.481a19.8062 19.8062 0 00-4.8383 1.49 19.5244 19.5244 0 00-3.251 6.46c0 .605.074 1.202.217 1.794.15.592.426 1.18.822 1.76a19.7394 19.7394 0 006.002 5.91c.5.375 1.041.71 1.605 1.001.564.291 1.149.529 1.75.71a14.995 14.995 0 001.75-.71c.565-.291 1.105-.626 1.606-1.001a19.7394 19.7394 0 006.002-5.91c.396-.58.672-1.168.822-1.76.143-.592.217-1.189.217-1.794 0-2.43-.78-4.694-2.336-6.46-.379-.603-.848-1.156-1.397-1.66zm-5.4987 7.35a1.887 1.887 0 11-3.773 0 1.887 1.887 0 013.773 0zm5.064 0a1.887 1.887 0 11-3.773 0 1.887 1.887 0 013.773 0z" />
                    </svg>
                    Join Discord
                </a>
            )}

            {websiteUrl && (
                <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3 bg-[#00d4ff] text-[#0a0e27] font-semibold rounded-lg hover:bg-[#0099cc] transition"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                        />
                    </svg>
                    Visit Website
                </a>
            )}

            <button
                onClick={handleShare}
                className="flex items-center gap-2 px-6 py-3 bg-transparent border border-[#00d4ff] text-[#00d4ff] font-semibold rounded-lg hover:bg-[rgba(0,212,255,0.1)] transition"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                </svg>
                Share
            </button>
        </div>
    );
}
