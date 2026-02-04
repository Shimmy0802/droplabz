import { formatDistanceToNow } from 'date-fns';

interface Announcement {
    id: string;
    title: string;
    content: string;
    isPinned: boolean;
    createdAt: string | Date;
    author: {
        id: string;
        username: string | null;
        discordUsername: string | null;
    };
}

interface AnnouncementCardProps {
    announcement: Announcement;
    isAuthor?: boolean;
    isAdmin?: boolean;
}

/**
 * Display a community announcement/news post
 * - Card-based layout with DropLabz design system
 * - Shows author, timestamp, title, and content
 * - Green accent for pinned posts, blue for regular
 * - Admin badge for community admins
 */
export function AnnouncementCard({ announcement, isAdmin = false }: AnnouncementCardProps) {
    const authorName = announcement.author.username || announcement.author.discordUsername || 'Unknown';
    const timestamp = formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true });

    // Color scheme based on pinned status
    const borderColor = announcement.isPinned ? 'border-[rgba(0,255,65,0.3)]' : 'border-[rgba(0,212,255,0.2)]';
    const accentColor = announcement.isPinned ? 'text-[#00ff41]' : 'text-[#00d4ff]';
    const bgGradient = announcement.isPinned
        ? 'from-[rgba(0,255,65,0.05)] to-transparent'
        : 'from-[rgba(0,212,255,0.05)] to-transparent';

    return (
        <div
            className={`bg-gradient-to-r ${bgGradient} border ${borderColor} rounded-lg p-4 sm:p-6 transition-all hover:border-opacity-50`}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    {/* Author Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00ff41] to-[#00d4ff] flex items-center justify-center text-black font-bold">
                        {authorName.charAt(0).toUpperCase()}
                    </div>

                    {/* Author Info */}
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-white font-semibold">{authorName}</span>
                            {isAdmin && (
                                <span className="px-2 py-0.5 rounded bg-[rgba(0,255,65,0.15)] text-[#00ff41] text-xs font-semibold uppercase">
                                    Admin
                                </span>
                            )}
                        </div>
                        <span className="text-gray-400 text-sm">{timestamp}</span>
                    </div>
                </div>

                {/* Pinned Badge */}
                {announcement.isPinned && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-[rgba(0,255,65,0.15)] text-[#00ff41] text-xs font-semibold uppercase">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.06l1.06-1.06zM6.464 14.596a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.596 15.657a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.06 1.06l1.06 1.06zM5.404 6.464a.75.75 0 001.06-1.06l-1.06-1.06a.75.75 0 10-1.06 1.06l1.06 1.06z" />
                        </svg>
                        Pinned
                    </div>
                )}
            </div>

            {/* Title */}
            <h3 className={`text-xl font-bold ${accentColor} mb-2`}>{announcement.title}</h3>

            {/* Content */}
            <div className="text-gray-300 whitespace-pre-wrap break-words">{announcement.content}</div>
        </div>
    );
}
