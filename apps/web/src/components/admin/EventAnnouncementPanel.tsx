'use client';

import { useState } from 'react';
import { buildProfessionalEventEmbed, generateAnnouncementLine } from '@/lib/utils/event-embed-helpers';

interface EventAnnouncementPanelProps {
    eventId: string;
    communityId: string;
    eventTitle: string;
    eventDescription?: string;
    eventType: 'GIVEAWAY' | 'WHITELIST' | 'PRESALE' | 'COLLABORATION';
    event?: any; // Full event object for building the actual embed preview
    onAnnouncementSent?: () => void;
}

interface AnnouncementResult {
    success: boolean;
    announcementId: string;
    status: string;
    discordMessageUrl?: string;
}

export function EventAnnouncementPanel({
    eventId,
    communityId,
    eventTitle,
    eventDescription,
    eventType,
    event,
    onAnnouncementSent,
}: EventAnnouncementPanelProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<AnnouncementResult | null>(null);

    const handleAnnounce = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch(`/api/events/${eventId}/announce`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    communityId,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            const result = await response.json();
            setSuccess(result);
            onAnnouncementSent?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to announce event');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#111528] border border-[rgba(0,255,65,0.1)] rounded-lg p-6 space-y-4">
            <div>
                <h3 className="text-lg font-semibold text-white">Discord Announcement</h3>
                <p className="text-gray-400 text-sm mt-1">Post this event to your Discord community</p>
            </div>

            {/* Preview */}
            <div className="bg-[#0a0e27] rounded-lg border border-[rgba(0,212,255,0.1)] p-4 space-y-3">
                <div className="text-sm text-gray-400">Preview:</div>

                {/* Announcement Line + Role Mentions */}
                {event && (
                    <div className="space-y-2">
                        {/* Role mentions */}
                        {event.mentionRoleIds && event.mentionRoleIds.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {event.mentionRoleIds.map((roleId: string) => (
                                    <span
                                        key={roleId}
                                        className="px-2 py-1 bg-[#5865f2] text-white text-xs rounded font-semibold"
                                    >
                                        @{roleId}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Announcement line */}
                        <div className="text-gray-200 text-sm">
                            {event.customAnnouncementLine || generateAnnouncementLine(event.type)}
                        </div>

                        {/* Divider */}
                        <div className="border-t border-[rgba(0,212,255,0.2)] my-3"></div>

                        {/* Full Professional Embed Preview */}
                        <EmbedPreview
                            event={event}
                            baseUrl={process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}
                        />
                    </div>
                )}

                {/* Fallback preview when full event data not available */}
                {!event && (
                    <>
                        <div className="text-white font-semibold">
                            {getEventEmoji(eventType)} {eventTitle}
                        </div>
                        {eventDescription && <div className="text-gray-300 text-sm">{eventDescription}</div>}
                        <div className="text-xs text-gray-500 mt-2">
                            Type: {eventType.charAt(0) + eventType.slice(1).toLowerCase()}
                        </div>
                    </>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-900/20 border border-red-700 rounded p-3">
                    <div className="text-red-200 text-sm">{error}</div>
                </div>
            )}

            {/* Success */}
            {success && (
                <div className="bg-green-900/20 border border-green-700 rounded p-3 space-y-2">
                    <div className="text-green-200 text-sm">✓ Announcement posted!</div>
                    {success.discordMessageUrl && (
                        <a
                            href={success.discordMessageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-300 text-xs hover:underline"
                        >
                            View on Discord →
                        </a>
                    )}
                </div>
            )}

            {/* Action Button */}
            <button
                onClick={handleAnnounce}
                disabled={loading || !!success}
                className="w-full px-4 py-2 bg-[#00ff41] text-[#0a0e27] font-semibold rounded-lg hover:bg-[#00dd33] disabled:opacity-50 transition-colors"
            >
                {loading ? 'Posting...' : success ? '✓ Posted' : 'Post to Discord'}
            </button>

            {/* Info */}
            <div className="text-xs text-gray-500 space-y-1">
                <p>• Announcement will be posted to your configured Discord channel</p>
                <p>• Users can click the link to enter the event</p>
            </div>
        </div>
    );
}

/**
 * Render the full professional embed preview
 */
function EmbedPreview({ event, baseUrl }: { event: any; baseUrl: string }) {
    const embed = buildProfessionalEventEmbed(event, event.community?.slug || '', baseUrl);

    return (
        <div
            className="rounded-lg p-4 space-y-2 border-l-4"
            style={{ borderColor: `#${embed.color?.toString(16).padStart(6, '0') || '00d4ff'}` }}
        >
            {/* Title */}
            <div className="text-white font-bold text-base">{embed.title}</div>

            {/* Description */}
            {embed.description && (
                <div className="text-gray-300 text-sm whitespace-pre-wrap">{embed.description.split('\n\n')[0]}</div>
            )}

            {/* Fields */}
            {embed.fields && embed.fields.length > 0 && (
                <div className="space-y-3 mt-3">
                    {embed.fields.map((field, idx) => (
                        <div key={idx} className="text-xs">
                            {/* Skip divider-only fields but show dividers between sections */}
                            {field.name === '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' ? (
                                <div className="border-t border-[rgba(0,212,255,0.2)] my-2"></div>
                            ) : !field.inline ? (
                                <>
                                    <div className="text-gray-400 font-semibold text-xs mb-1">{field.name}</div>
                                    <div className="text-gray-300 text-xs ml-2 whitespace-pre-wrap">
                                        {field.value.replace(/\*\*/g, '').replace(/\[|\]/g, '')}
                                    </div>
                                </>
                            ) : (
                                <div className="inline-block mr-4">
                                    <span className="text-gray-400 font-semibold text-xs">{field.name}</span>{' '}
                                    <span className="text-gray-300 text-xs">{field.value}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Footer */}
            {embed.footer && (
                <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-[rgba(0,212,255,0.2)]">
                    {embed.footer.text}
                </div>
            )}
        </div>
    );
}

function getEventEmoji(type: string): string {
    const emojis: { [key: string]: string } = {
        GIVEAWAY: '⚡',
        WHITELIST: '🔐',
        PRESALE: '⚙️',
        COLLABORATION: '🔌',
    };
    return emojis[type] || '⚙️';
}
