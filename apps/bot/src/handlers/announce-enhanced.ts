/**
 * Enhanced Discord Announcement System
 *
 * Professional multi-section embed design inspired by Subber.xyz
 * optimized for DropLabz brand and all event types.
 *
 * Design Philosophy:
 * - Subber-style multi-section layout with DropLabz color palette
 * - Clear visual hierarchy with strategic emoji and formatting
 * - Event image/thumbnail prominently displayed
 * - Requirements, Details, and Links sections cleanly organized
 * - Dynamic colors based on event type
 * - Compact yet professional spacing
 */

import { EmbedBuilder, Client, TextChannel } from 'discord.js';

export interface EnhancedAnnouncementData {
    eventId: string;
    eventTitle: string;
    eventType: 'WHITELIST' | 'PRESALE' | 'GIVEAWAY' | 'COLLABORATION';
    description?: string;
    imageUrl?: string;
    prize?: string;
    endAt: string; // ISO 8601 datetime
    maxWinners?: number;
    selectionMode?: 'RANDOM' | 'MANUAL' | 'FCFS';
    requirements?: Array<{
        type: string;
        description: string;
    }>;
    links?: {
        website?: string;
        twitter?: string;
        discord?: string;
        instagram?: string;
    };
    eventUrl: string; // Link to event on web
}

/**
 * Color selection based on event type
 * Follows DropLabz brand: Green for action, Blue for info
 */
function getEventColor(eventType: string): number {
    const colors: Record<string, number> = {
        WHITELIST: 0x00ff41, // Radioactive green
        PRESALE: 0x00d4ff, // Electric blue
        GIVEAWAY: 0x00ff41, // Radioactive green
        COLLABORATION: 0x00d4ff, // Electric blue
    };
    return colors[eventType] || 0x00d4ff;
}

/**
 * Get emoji for event type
 */
function getEventEmoji(eventType: string): string {
    const emojis: Record<string, string> = {
        WHITELIST: '✓',
        PRESALE: '💰',
        GIVEAWAY: '🎁',
        COLLABORATION: '🤝',
    };
    return emojis[eventType] || '✨';
}

/**
 * Get event type badge text
 */
function getEventBadge(eventType: string): string {
    const badges: Record<string, string> = {
        WHITELIST: '⭕ WHITELIST',
        PRESALE: '💰 PRE-SALE',
        GIVEAWAY: '🎁 GIVEAWAY',
        COLLABORATION: '🤝 COLLABORATION',
    };
    return badges[eventType] || eventType;
}

/**
 * Format time remaining until event ends
 */
function formatTimeRemaining(endAtIso: string): string {
    const endDate = new Date(endAtIso);
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();

    if (diff <= 0) return '❌ Event Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `⏰ ${days}d ${hours}h remaining`;
    return `⏰ ${hours}h remaining`;
}

/**
 * Format requirements section with visual structure
 */
function formatRequirementsSection(
    requirements?: Array<{
        type: string;
        description: string;
    }>,
): string {
    if (!requirements || requirements.length === 0) {
        return 'No specific requirements';
    }

    return requirements
        .map(req => {
            const icon = getRequirementEmoji(req.type);
            return `${icon} ${req.description}`;
        })
        .join('\n');
}

/**
 * Get emoji for requirement type
 */
function getRequirementEmoji(type: string): string {
    const emojiMap: Record<string, string> = {
        DISCORD_MEMBER: '💬',
        DISCORD_ROLE: '🏆',
        TOKEN_HOLDING: '💎',
        NFT_OWNERSHIP: '🖼️',
        WALLET_REQUIRED: '👛',
        ACCOUNT_AGE: '📅',
        INVITE_REQUIREMENT: '📬',
        DEFAULT: '✓',
    };
    return emojiMap[type] || emojiMap.DEFAULT;
}

/**
 * Format selection mode display
 */
function formatSelectionMode(mode?: string): string {
    const modes: Record<string, string> = {
        RANDOM: '🎲 Random Draw',
        MANUAL: '👤 Manual Selection',
        FCFS: '⚡ First Come, First Served',
    };
    return modes[mode || 'RANDOM'] || 'Random Draw';
}

/**
 * Format links section
 */
function formatLinksSection(links?: Record<string, string>): string {
    if (!links) return '';

    const linkEntries = Object.entries(links).filter(([_, url]) => url);
    if (linkEntries.length === 0) return '';

    return linkEntries
        .map(([type, url]) => {
            const icons: Record<string, string> = {
                website: '🌐',
                twitter: '𝕏',
                discord: '💬',
                instagram: '📸',
            };
            const icon = icons[type] || '🔗';
            const label = type.charAt(0).toUpperCase() + type.slice(1);
            return `[${icon} ${label}](${url})`;
        })
        .join(' • ');
}

/**
 * Build professional enhanced embed for event announcement
 *
 * Layout:
 * ┌─────────────────────────────────┐
 * │ 🎁 GIVEAWAY                     │
 * │ Event Title                     │
 * │ [Thumbnail Image]               │
 * ├─────────────────────────────────┤
 * │ Description                     │
 * │                                 │
 * │ ⏰ Time remaining               │
 * ├─────────────────────────────────┤
 * │ 📋 REQUIREMENTS                 │
 * │ ✓ Discord member                │
 * │ 💎 Hold 1000+ tokens            │
 * ├─────────────────────────────────┤
 * │ 📊 EVENT DETAILS                │
 * │ Type: Giveaway                  │
 * │ Prize: 1000 tokens              │
 * │ Winners: 5                      │
 * │ Selection: Random Draw          │
 * │ Ends: 2026-02-15 18:00 UTC      │
 * ├─────────────────────────────────┤
 * │ 🔗 Links: Website • Twitter     │
 * ├─────────────────────────────────┤
 * │ [Join Now Button]               │
 * └─────────────────────────────────┘
 */
export function buildProfessionalEventEmbed(data: EnhancedAnnouncementData): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setColor(getEventColor(data.eventType))
        .setTitle(`${getEventEmoji(data.eventType)} ${data.eventTitle}`)
        .setDescription(data.description || `Join our ${data.eventType.toLowerCase()} event!`)
        .setURL(data.eventUrl);

    // Add thumbnail if available
    if (data.imageUrl) {
        embed.setThumbnail(data.imageUrl);
    }

    // Time remaining (prominent display)
    const timeRemaining = formatTimeRemaining(data.endAt);
    embed.addFields({
        name: '⏰ Time Remaining',
        value: `\`\`\`${timeRemaining}\`\`\``,
        inline: false,
    });

    // Requirements section
    if (data.requirements && data.requirements.length > 0) {
        const requirementsText = formatRequirementsSection(data.requirements);
        embed.addFields({
            name: '📋 REQUIREMENTS',
            value: requirementsText,
            inline: false,
        });
    }

    // Event Details section (structured fields)
    const detailsFields: Array<{ name: string; value: string; inline: boolean }> = [];

    detailsFields.push({
        name: '📊 EVENT TYPE',
        value: getEventBadge(data.eventType),
        inline: true,
    });

    if (data.maxWinners) {
        detailsFields.push({
            name: '🏆 WINNERS',
            value: `${data.maxWinners} winner${data.maxWinners !== 1 ? 's' : ''}`,
            inline: true,
        });
    }

    if (data.selectionMode) {
        detailsFields.push({
            name: '🎲 SELECTION',
            value: formatSelectionMode(data.selectionMode),
            inline: true,
        });
    }

    if (data.prize) {
        detailsFields.push({
            name: '💎 PRIZE',
            value: data.prize,
            inline: true,
        });
    }

    // Format end date/time
    const endDate = new Date(data.endAt);
    const formattedEnd = endDate.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
    });

    detailsFields.push({
        name: '📅 ENDS',
        value: formattedEnd,
        inline: true,
    });

    if (detailsFields.length > 0) {
        embed.addFields(detailsFields);
    }

    // Links section
    const linksText = formatLinksSection(data.links);
    if (linksText) {
        embed.addFields({
            name: '🔗 LINKS',
            value: linksText,
            inline: false,
        });
    }

    // Footer with branding
    embed.setFooter({
        text: 'DropLabz • Professional Community Operations',
        iconURL: 'https://droplabz.com/logos/droplabz.png',
    });

    // Timestamp
    embed.setTimestamp(new Date());

    return embed;
}

/**
 * Build CTA (Call-to-Action) button message
 *
 * Follows Discord button best practices:
 * - Primary button in brand green
 * - Secondary button for more info
 */
export interface CtaButtons {
    primaryLabel?: string;
    primaryUrl?: string;
    secondaryLabel?: string;
    secondaryUrl?: string;
}

export function buildCtaButtons(eventUrl: string, buttons?: CtaButtons): { embeds: EmbedBuilder[] } {
    const ctaEmbed = new EmbedBuilder()
        .setColor(0x00ff41) // Radioactive green
        .setDescription('👇 **Ready to participate?** Click the button below to join this event!');

    return {
        embeds: [ctaEmbed],
    };
}

/**
 * Post enhanced announcement to Discord
 */
export async function postEnhancedAnnouncement(
    client: Client,
    guildId: string,
    channelId: string,
    data: EnhancedAnnouncementData,
): Promise<{
    success: boolean;
    messageId?: string;
    url?: string;
    error?: string;
}> {
    try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            return { success: false, error: 'Guild not found' };
        }

        const channel = guild.channels.cache.get(channelId);
        if (!channel || !(channel instanceof TextChannel)) {
            return { success: false, error: 'Channel not found or is not a text channel' };
        }

        const embed = buildProfessionalEventEmbed(data);

        const message = await channel.send({
            embeds: [embed],
        });

        return {
            success: true,
            messageId: message.id,
            url: message.url,
        };
    } catch (error) {
        console.error('Error posting announcement:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Edit existing announcement with new data
 */
export async function editEnhancedAnnouncement(
    client: Client,
    guildId: string,
    channelId: string,
    messageId: string,
    data: EnhancedAnnouncementData,
): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            return { success: false, error: 'Guild not found' };
        }

        const channel = guild.channels.cache.get(channelId);
        if (!channel || !(channel instanceof TextChannel)) {
            return { success: false, error: 'Channel not found' };
        }

        const message = await channel.messages.fetch(messageId);
        const embed = buildProfessionalEventEmbed(data);

        await message.edit({
            embeds: [embed],
        });

        return { success: true };
    } catch (error) {
        console.error('Error editing announcement:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
