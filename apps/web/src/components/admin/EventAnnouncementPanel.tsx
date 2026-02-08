'use client';

import { useState, useEffect } from 'react';
import {
    buildProfessionalEventEmbed,
    generateAnnouncementLine,
    buildWinnerAnnouncementEmbed,
} from '@/lib/utils/event-embed-helpers';

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
    announcementId?: string;
    status?: string;
    discordMessageUrl?: string;
    messageId?: string;
    url?: string;
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
    const [isWinnerMode, setIsWinnerMode] = useState(false);
    const [channelId, setChannelId] = useState('');

    // Determine if we should show winner announcement
    useEffect(() => {
        const hasWinners = event?._count?.winners > 0;
        setIsWinnerMode(hasWinners);

        // Pre-fill channel ID from community settings if available
        if (event?.community?.discordAnnouncementChannelId) {
            setChannelId(event.community.discordAnnouncementChannelId);
        }
    }, [event]);

    const handleAnnounce = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (isWinnerMode) {
                // Announce winners
                if (!channelId) {
                    throw new Error('Discord channel ID is required');
                }

                const response = await fetch(`/api/events/${eventId}/announce-winners`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ channelId }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || `HTTP ${response.status}`);
                }

                const result = await response.json();
                setSuccess(result);
                onAnnouncementSent?.();
            } else {
                // Announce event
                const response = await fetch(`/api/events/${eventId}/announce`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ communityId }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || `HTTP ${response.status}`);
                }

                const result = await response.json();
                setSuccess(result);
                onAnnouncementSent?.();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to announce');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#111528] border border-[rgba(0,255,65,0.1)] rounded-lg p-6 space-y-4">
            <div>
                <h3 className="text-lg font-semibold text-white">
                    {isWinnerMode ? '🏆 Winner Announcement' : 'Discord Announcement'}
                </h3>
                <p className="text-gray-400 text-sm mt-1">
                    {isWinnerMode
                        ? 'Announce the winners to your Discord community'
                        : 'Post this event to your Discord community'}
                </p>
            </div>

            {/* Channel ID Input (for winner announcements) */}
            {isWinnerMode && (
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                        Discord Channel ID
                        {event?.community?.discordAnnouncementChannelId && (
                            <span className="text-xs text-gray-500 ml-2">(Auto-filled from settings)</span>
                        )}
                    </label>
                    <input
                        type="text"
                        value={channelId}
                        onChange={e => setChannelId(e.target.value)}
                        placeholder="123456789012345678"
                        className="w-full px-4 py-2 bg-[#0a0e27] border border-[rgba(0,212,255,0.3)] text-white rounded-lg focus:outline-none focus:border-[#00ff41] focus:ring-1 focus:ring-[#00ff41]"
                    />
                    <p className="text-xs text-gray-500">
                        The Discord channel where winner announcement will be posted
                    </p>
                </div>
            )}

            {/* Preview */}
            <div className="bg-[#0a0e27] rounded-lg border border-[rgba(0,212,255,0.1)] p-4 space-y-3">
                <div className="text-sm text-gray-400">Preview:</div>

                {event && isWinnerMode ? (
                    <WinnerEmbedPreview event={event} />
                ) : event ? (
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
                ) : (
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
                    <div className="text-green-200 text-sm">
                        ✓ {isWinnerMode ? 'Winners announced!' : 'Announcement posted!'}
                    </div>
                    {(success.discordMessageUrl || success.url) && (
                        <a
                            href={success.discordMessageUrl || success.url}
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
                disabled={loading || !!success || (isWinnerMode && !channelId)}
                className="w-full px-4 py-2 bg-[#00ff41] text-[#0a0e27] font-semibold rounded-lg hover:bg-[#00dd33] disabled:opacity-50 transition-colors"
            >
                {loading
                    ? 'Posting...'
                    : success
                      ? '✓ Posted'
                      : isWinnerMode
                        ? '🏆 Announce Winners'
                        : 'Post to Discord'}
            </button>

            {/* Info */}
            <div className="text-xs text-gray-500 space-y-1">
                {isWinnerMode ? (
                    <>
                        <p>• Winner announcement will be posted to the specified Discord channel</p>
                        <p>• Winners will be notified with their wallet addresses</p>
                        <p>• Up to 20 winners will be shown in the announcement</p>
                    </>
                ) : (
                    <>
                        <p>• Announcement will be posted to your configured Discord channel</p>
                        <p>• Users can click the link to enter the event</p>
                    </>
                )}
            </div>
        </div>
    );
}

/**
 * Render winner announcement preview
 */
function WinnerEmbedPreview({ event }: { event: any }) {
    // Fetch winners from event
    const winners = event.winners?.slice(0, 20) || [];

    if (winners.length === 0) {
        return (
            <div className="text-gray-400 text-sm">No winners selected yet. Draw winners first before announcing.</div>
        );
    }

    const embed = buildWinnerAnnouncementEmbed({
        title: event.title,
        prize: event.prize || undefined,
        type: event.type,
        winners: winners.map((w: any) => ({
            walletAddress: w.entry?.walletAddress || w.walletAddress,
            discordUserId: w.entry?.discordUserId || w.discordUserId || undefined,
        })),
        selectionMode: event.selectionMode,
    });

    return (
        <div
            className="rounded-lg p-4 space-y-2 border-l-4"
            style={{ borderColor: `#${embed.color?.toString(16).padStart(6, '0') || '00ff41'}` }}
        >
            {/* Title */}
            {embed.title && <div className="text-white font-bold text-base">{embed.title}</div>}

            {/* Description */}
            {embed.description && <div className="text-gray-300 text-sm whitespace-pre-wrap">{embed.description}</div>}

            {/* Fields */}
            {embed.fields && embed.fields.length > 0 && (
                <div className="space-y-3 mt-3">
                    {embed.fields.map((field, idx) => (
                        <div key={idx} className="text-xs">
                            <div className="text-gray-400 font-semibold text-xs mb-1">{field.name}</div>
                            <div className="text-gray-300 text-xs ml-2 whitespace-pre-wrap font-mono">
                                {field.value}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Footer */}
            {embed.footer && (
                <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-[rgba(0,255,65,0.2)]">
                    {embed.footer.text}
                </div>
            )}
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
