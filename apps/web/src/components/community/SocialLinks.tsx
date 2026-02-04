interface SocialLinksProps {
    socials?: {
        twitter?: string | null;
        discord?: string | null;
        website?: string | null;
        instagram?: string | null;
    } | null;
    className?: string;
    iconClassName?: string;
    variant?: 'default' | 'banner';
}

/**
 * Render social media links as clickable icons
 * Supports: Twitter, Discord, Website, Instagram
 * @param variant - 'default' for standard styling, 'banner' for enhanced banner styling with glows
 */
export function SocialLinks({
    socials,
    className = 'flex gap-4',
    iconClassName = 'w-6 h-6',
    variant = 'default',
}: SocialLinksProps) {
    if (!socials) {
        return null;
    }

    const links = [
        {
            key: 'twitter',
            url: socials.twitter,
            label: 'Twitter',
            icon: (
                <svg className={iconClassName} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 002.856-3.51 9.98 9.98 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a14.995 14.995 0 008.134 2.391c9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
            ),
        },
        {
            key: 'discord',
            url: socials.discord,
            label: 'Discord',
            icon: (
                <svg className={iconClassName} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.3671a19.8062 19.8062 0 00-4.8383-1.49c-.21.12-.402.281-.583.481-.56-.084-1.113-.187-1.66-.187-.547 0-1.1.103-1.66.187-.181-.2-.383-.361-.583-.481a19.8062 19.8062 0 00-4.8383 1.49 19.5244 19.5244 0 00-3.251 6.46c0 .605.074 1.202.217 1.794.15.592.426 1.18.822 1.76a19.7394 19.7394 0 006.002 5.91c.5.375 1.041.71 1.605 1.001.564.291 1.149.529 1.75.71a14.995 14.995 0 001.75-.71c.565-.291 1.105-.626 1.606-1.001a19.7394 19.7394 0 006.002-5.91c.396-.58.672-1.168.822-1.76.143-.592.217-1.189.217-1.794 0-2.43-.78-4.694-2.336-6.46-.379-.603-.848-1.156-1.397-1.66zm-5.4987 7.35a1.887 1.887 0 11-3.773 0 1.887 1.887 0 013.773 0zm5.064 0a1.887 1.887 0 11-3.773 0 1.887 1.887 0 013.773 0z" />
                </svg>
            ),
        },
        {
            key: 'website',
            url: socials.website,
            label: 'Website',
            icon: (
                <svg className={iconClassName} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.658 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                </svg>
            ),
        },
        {
            key: 'instagram',
            url: socials.instagram,
            label: 'Instagram',
            icon: (
                <svg className={iconClassName} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08a11.798 11.798 0 01-4.118-.06c-1.066-.049-1.793-.218-2.428-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.248-.636-.415-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                </svg>
            ),
        },
    ];

    // Filter for links with valid URLs (not null, undefined, or empty string)
    const activeLinks = links.filter(link => link.url && link.url.trim() !== '');

    if (activeLinks.length === 0) {
        return null;
    }

    // Style variants
    const linkStyles = {
        default: 'text-gray-400 hover:text-[#00d4ff] transition-colors',
        banner: 'text-white/70 hover:text-[#00ff41] transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(0,255,65,0.6)] hover:scale-110',
    };

    return (
        <div className={className}>
            {activeLinks.map(link => (
                <a
                    key={link.key}
                    href={link.url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={link.label}
                    className={linkStyles[variant]}
                >
                    {link.icon}
                </a>
            ))}
        </div>
    );
}
