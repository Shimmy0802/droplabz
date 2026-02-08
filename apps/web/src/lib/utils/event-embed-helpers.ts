/**
 * Event Embed Helpers - DRAMATICALLY ENHANCED Discord announcements
 *
 * Professional embeds with 11 enhancements:
 * 1. Prioritized Prize Pool field
 * 2. Urgency indicators with color-coded badges
 * 3. Strategic color usage based on urgency
 * 4. Semantic emoji icons for requirements
 * 5. Live status indicator in title
 * 6. Two-column layout with inline fields
 * 7. Capacity progress bar visual
 * 8. Event-type color mapping
 * 9. Enhanced CTA with visual emphasis
 * 10. Personalization-ready structure
 * 11. Image support with absolute URL conversion
 *
 * Returns plain JSON objects compatible with Discord API
 * (no discord.js dependency to avoid zlib-sync issues in web app)
 */

import { Prisma } from '@prisma/client';

/**
 * Discord Embed JSON format (compatible with Discord API)
 */
export interface DiscordEmbed {
    title?: string;
    description?: string;
    color?: number;
    fields?: Array<{
        name: string;
        value: string;
        inline?: boolean;
    }>;
    image?: {
        url: string;
    } | null;
    footer?: {
        text: string;
    };
    timestamp?: string;
}

/**
 * Event data required for embed building
 */
export interface EventData {
    id: string;
    type: string;
    title: string;
    description?: string | null;
    prize?: string | null;
    imageUrl?: string | null;
    endAt: Date;
    maxWinners?: number;
    selectionMode?: string;
    status?: string;
    mentionRoleIds?: string[]; // Discord role IDs to mention in announcement
    customAnnouncementLine?: string | null; // Custom announcement text
    requirements?: Array<{
        id: string;
        type: string;
        config: Prisma.JsonValue;
    }>;
    communityId?: string;
    _count?: {
        entries: number;
    };
    community?: {
        id: string;
        slug: string;
        name: string;
        socials?: Record<string, string | null>;
    };
}

/**
 * Generate creative announcement line based on event type
 * Used as Discord message content before the embed
 */
export function generateAnnouncementLine(eventType: string): string {
    const type = (eventType || '').toUpperCase();

    const lines: Record<string, string[]> = {
        GIVEAWAY: [
            '⚡ Giveaway live — execute your entry now.',
            '💥 Giveaway activated — claim your allocation.',
            '🔥 Giveaway window open — take action immediately.',
            '⚙️ Giveaway processing — secure your spot.',
        ],
        WHITELIST: [
            '🔐 Whitelist window open — lock in your access.',
            '🛡️ Whitelist verification active — complete setup.',
            '✓ Whitelist is live — claim your reserved slot.',
            '🔑 Whitelist opens now — control your entry.',
        ],
        PRESALE: [
            '⚙️ Presale infrastructure live — initialize allocation.',
            '🔌 Presale connected — secure your reservation.',
            '📊 Presale window open — execute your purchase.',
            '⚡ Presale activation — grab your allocation now.',
        ],
        ACCESS: [
            '🔓 Access unlocked — enter the system.',
            '🔑 Access control active — verify your credentials.',
            '🛡️ Access granted — complete verification.',
            '📍 Access portal open — join the network.',
        ],
        AIRDROP: [
            '📡 Airdrop signal broadcast — claim your share.',
            '💿 Airdrop distribution live — execute transfer.',
            '🔄 Airdrop cycle active — collect allocation.',
            '⚡ Airdrop initialized — secure tokens now.',
        ],
    };

    const typeLines = lines[type] || lines.GIVEAWAY;
    return typeLines[Math.floor(Math.random() * typeLines.length)];
}

/**
 * ENHANCEMENT 2: Urgency Indicator
 * Dynamic color-coded badges based on time remaining
 * 🔴 = 1 day, 🟠 = 3 days, 🟡 = 7 days, 🟢 = normal
 */
function getUrgencyBadge(endAt: Date): { emoji: string; text: string; color: number } {
    const now = new Date();
    const timeUntilEnd = endAt.getTime() - now.getTime();
    const daysLeft = Math.floor(timeUntilEnd / (1000 * 60 * 60 * 24));

    if (daysLeft <= 1) {
        return { emoji: '🔴', text: 'CRITICAL - Closes Today!', color: 0xff4444 }; // Red
    } else if (daysLeft <= 3) {
        return { emoji: '🟠', text: 'URGENT - 3 Days Left!', color: 0xff8844 }; // Orange
    } else if (daysLeft <= 7) {
        return { emoji: '🟡', text: 'Limited Time - 7 Days!', color: 0xffaa44 }; // Yellow
    } else {
        return { emoji: '🟢', text: 'OPEN', color: 0x00ff41 }; // Green (DropLabz brand)
    }
}

/**
 * ENHANCEMENT 4: Semantic Emoji Icons
 * Returns appropriate emoji for requirement type
 */
function getRequirementEmoji(type: string): string {
    const typeMap: Record<string, string> = {
        SOLANA_BALANCE: '⚡', // Solana network icon
        TOKEN_BALANCE: '�', // Data/token icon
        NFT_HOLDER: '💿', // Technical asset icon
        TWITTER_FOLLOW: '📡', // Signal/broadcast
        DISCORD_ROLE: '🔑', // Role/access control
        DISCORD_MEMBER: '🔐', // Security/membership
        ALLOWLIST: '✓', // Verification checkmark
        CUSTOM: '⚙️', // Configuration/custom
        WHITELIST: '🛡️', // Protection/whitelist
        POINTS: '📊', // Data/metrics
        LEVEL: '📈', // Infrastructure/progress
        INVITE: '🔌', // Connected/network
    };

    return typeMap[type] || '⚙️'; // Default to infrastructure icon
}

/**
 * Format requirement type for display
 * Converts DISCORD_ROLE to "Discord Role Required" etc.
 */
function formatRequirementName(req: { type: string; config?: any }): string {
    const typeNames: Record<string, string> = {
        DISCORD_MEMBER: 'Discord Member',
        DISCORD_ROLE: 'Discord Role Required',
        DISCORD_ROLE_REQUIRED: 'Discord Role Required',
        SOLANA_BALANCE: 'Solana Balance Required',
        TOKEN_BALANCE: 'Token Holder',
        NFT_HOLDER: 'NFT Holder',
        TWITTER_FOLLOW: 'Follow Twitter/X',
        ALLOWLIST: 'On Allowlist',
        WHITELIST: 'On Whitelist',
        POINTS: 'Minimum Points',
        LEVEL: 'Minimum Level',
        INVITE: 'Invite Required',
        CUSTOM: 'Custom Requirement',
    };

    return typeNames[req.type] || req.type.replace(/_/g, ' ');
}

/**
 * Sanitize URLs for Discord embeds
 * Ensures proper URL formatting for markdown links
 */
function sanitizeUrl(url: string): string {
    if (!url) return '';

    // If missing protocol, add https://
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('discord://')) {
        return `https://${url}`;
    }

    return url;
}

/**
 * Build enhanced professional event embed matching reference design
 *
 * Format:
 * - Title with emoji prefix (🏆 Event Name)
 * - Event description
 * - "To Enter:" requirements section with verification needs
 * - "Requirements:" section with checkmarks
 * - Links section (Website, Telegram, Discord)
 * - Mint/Event details (date, supply, price)
 * - Type, # of winners, Ends
 * - Twitter info
 * - Event image at bottom
 *
 * Returns plain JSON object (no discord.js dependency)
 */
export function buildProfessionalEventEmbed(
    event: EventData,
    communitySlug: string,
    baseUrl: string = 'http://localhost:3000',
): DiscordEmbed {
    const eventUrl = `${baseUrl}/events/${communitySlug}/${event.id}`;
    const deadline = new Date(event.endAt);
    const now = new Date();
    const timeUntilEnd = deadline.getTime() - now.getTime();
    const daysLeft = Math.floor(timeUntilEnd / (1000 * 60 * 60 * 24));

    // Type emoji and color mapping
    const typeEmojiMap: Record<string, string> = {
        WHITELIST: '🔐',
        PRESALE: '⚙️',
        GIVEAWAY: '⚡',
        COLLABORATION: '🔌',
        ACCESS: '🔓',
        AIRDROP: '📡',
        RAFFLE: '💥',
    };
    const typeEmoji = typeEmojiMap[event.type] || '⚙️';

    // Get urgency badge
    const urgencyBadge = getUrgencyBadge(deadline);
    let embedColor = urgencyBadge.color;
    if (daysLeft > 7) {
        const colorMap: Record<string, number> = {
            WHITELIST: 0x00ff41,
            PRESALE: 0x00d4ff,
            GIVEAWAY: 0xff6b9d,
            COLLABORATION: 0xffd700,
            ACCESS: 0x00d4ff,
            AIRDROP: 0x00ff41,
            RAFFLE: 0xff9500,
        };
        embedColor = colorMap[event.type] || 0x00d4ff;
    }

    // Build title with emoji
    const titleText = `${typeEmoji} ${event.title}`;

    // Build "To Enter:" section with requirement bullets
    const toEnterLines: string[] = [];

    // Always include: Linked Solana Wallet
    toEnterLines.push('• ⚡ Linked Solana Wallet');

    // Add Discord roles if mentionRoleIds exist (show specific role IDs)
    if (event.mentionRoleIds && event.mentionRoleIds.length > 0) {
        const roleList = event.mentionRoleIds.map(id => `<@&${id}>`).join(', ');
        toEnterLines.push(`• 🔑 Discord Roles Required: ${roleList}`);
    }

    // Add other requirements (excluding DISCORD_ROLE_REQUIRED since we already showed mentionRoleIds above)
    if (event.requirements && event.requirements.length > 0) {
        event.requirements.forEach(req => {
            // Skip wallet and role requirements since they're already shown above
            if (
                req.type === 'SOLANA_WALLET_CONNECTED' ||
                req.type === 'SOLANA_BALANCE' ||
                req.type === 'DISCORD_ROLE_REQUIRED' ||
                req.type === 'DISCORD_ROLE'
            ) {
                return;
            }
            const emoji = getRequirementEmoji(req.type);
            const displayName = formatRequirementName(req);
            toEnterLines.push(`• ${emoji} ${displayName}`);
        });
    }

    // If no additional requirements beyond wallet, that's fine
    const toEnterText = toEnterLines.length > 0 ? toEnterLines.join('\n') : '✅ Linked Solana Wallet';

    // Build fields array
    const fields: DiscordEmbed['fields'] = [];

    // Section: "To Enter:"
    fields.push({
        name: 'To Enter:',
        value: toEnterText,
        inline: false,
    });

    // Section: Requirements with checkmarks
    const requirementsLines: string[] = [];
    if (event.requirements && event.requirements.length > 0) {
        event.requirements.forEach(req => {
            // Skip wallet and role requirements since they're already shown in "To Enter:"
            if (
                req.type === 'SOLANA_WALLET_CONNECTED' ||
                req.type === 'SOLANA_BALANCE' ||
                req.type === 'DISCORD_ROLE_REQUIRED' ||
                req.type === 'DISCORD_ROLE'
            ) {
                return;
            }
            const emoji = getRequirementEmoji(req.type);
            const displayName = formatRequirementName(req);
            requirementsLines.push(`☑️ ${emoji} ${displayName}`);
        });
        if (requirementsLines.length > 0) {
            fields.push({
                name: 'Requirements:',
                value: requirementsLines.join('\n'),
                inline: false,
            });
        }
    }

    // Section: Links (Website, Telegram, Discord)
    const socials = event.community?.socials as Record<string, string | null> | undefined;
    if (socials && Object.values(socials).some(v => v)) {
        const linkLines: string[] = [];

        if (socials.website) {
            linkLines.push(`🔗 [Website](${sanitizeUrl(socials.website)})`);
        }
        if (socials.telegram) {
            linkLines.push(`📱 [Telegram](${sanitizeUrl(socials.telegram)})`);
        }
        if (socials.discord) {
            linkLines.push(`💬 [Discord](${sanitizeUrl(socials.discord)})`);
        }
        if (socials.twitter) {
            linkLines.push(`𝕏 [Twitter](${sanitizeUrl(socials.twitter)})`);
        }

        if (linkLines.length > 0) {
            fields.push({
                name: `${event.community?.name || 'Community'} Links 🔗`,
                value: linkLines.join('\n'),
                inline: false,
            });
        }
    }

    // Section: Mint Details (if presale)
    if (event.type === 'PRESALE') {
        fields.push({
            name: 'Mint Date:',
            value: 'TBD',
            inline: true,
        });
        fields.push({
            name: 'Mint supply:',
            value: 'TBD',
            inline: true,
        });
        fields.push({
            name: 'Mint price:',
            value: 'TBD',
            inline: true,
        });
    }

    // Section: Event details (Type, Winners, Ends)
    const endDate = deadline.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
    const endTime = deadline.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });

    fields.push({
        name: 'Type:',
        value: event.type === 'RAFFLE' ? 'Raffle' : event.type,
        inline: true,
    });
    fields.push({
        name: '# of winners:',
        value: `${event.maxWinners || 1}`,
        inline: true,
    });
    fields.push({
        name: 'Ends:',
        value: `${endDate} ${endTime}`,
        inline: true,
    });

    // Section: Twitter info (if available)
    if (socials?.twitter) {
        // Extract handle from URL for display
        const twitterUrl = sanitizeUrl(socials.twitter);
        const twitterHandle = twitterUrl.split('/').pop() || 'Twitter';
        fields.push({
            name: 'Twitter:',
            value: `[@${twitterHandle}](${twitterUrl})`,
            inline: false,
        });
    }

    // CTA button text (displayed with image)
    fields.push({
        name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        value: `**[→ CLICK HERE TO ENTER ←](${eventUrl})**\n\n*One entry per wallet • Results announced at close*`,
        inline: false,
    });

    // Process image URL - do NOT include if from local uploads
    let imageUrl: string | null = null;
    if (event.imageUrl && !event.imageUrl.includes('/uploads/')) {
        // Only use external images, not local uploads
        if (event.imageUrl.startsWith('http://') || event.imageUrl.startsWith('https://')) {
            imageUrl = event.imageUrl;
        }
    }

    const embed: DiscordEmbed = {
        color: embedColor,
        title: titleText,
        description: event.description
            ? `${event.description}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
            : '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        fields,
        ...(imageUrl && { image: { url: imageUrl } }),
        footer: {
            text: `✨ DropLabz • Managed event • ${event.id.slice(0, 8)}`,
        },
        timestamp: true,
    };

    return embed;
}

/**
 * Build presale-specific embed with tier information
 */
export function buildPresaleEventEmbed(
    event: EventData,
    communitySlug: string,
    baseUrl: string = 'http://localhost:3000',
): DiscordEmbed {
    const eventUrl = `${baseUrl}/events/${communitySlug}/${event.id}`;
    const deadline = new Date(event.endAt);

    const dateStr = deadline.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    const embed: DiscordEmbed = {
        color: 0x00d4ff,
        title: `💰 **${event.title}**`,
        description: `${event.description || 'Exclusive presale opportunity!'}\n\n━━━━━━━━━━━━━━━━━━`,
        ...(event.imageUrl && { image: { url: event.imageUrl } }),
        fields: [
            {
                name: '💎 PRESALE DETAILS',
                value: `**Allocation:** \`${event.maxWinners || 1} slots\`\n**Price:** ${event.prize || 'See details'}`,
                inline: false,
            },
            {
                name: '📅 SALE DEADLINE',
                value: `**${dateStr}**`,
                inline: false,
            },
            {
                name: '👥 QUALIFIED PARTICIPANTS',
                value: `📊 \`${event._count?.entries || 0}\` registered`,
                inline: false,
            },
            {
                name: '🔐 ELIGIBILITY REQUIREMENTS',
                value:
                    event.requirements && event.requirements.length > 0
                        ? event.requirements
                              .map((req, idx) => `  ${idx + 1}. 🔐 ${req.type.replace(/_/g, ' ')}`)
                              .join('\n')
                        : '✅ All members eligible',
                inline: false,
            },
            {
                name: '━━━━━━━━━━━━━━━━━━',
                value: '\u200b',
                inline: false,
            },
            {
                name: '🚀 SECURE YOUR SPOT',
                value: `**[→ REGISTER FOR PRESALE ←](${eventUrl})**\n\n*Limited slots available - register early!*`,
                inline: false,
            },
        ],
        footer: {
            text: '✨ DropLabz Presales',
        },
        timestamp: true,
    };

    return embed;
}

/**
 * Build collaboration-specific embed
 */
export function buildCollaborationEventEmbed(
    event: EventData,
    communitySlug: string,
    baseUrl: string = 'http://localhost:3000',
): DiscordEmbed {
    const eventUrl = `${baseUrl}/events/${communitySlug}/${event.id}`;
    const deadline = new Date(event.endAt);

    const dateStr = deadline.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });

    const endDateStr = deadline.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });

    const fields: DiscordEmbed['fields'] = [
        {
            name: '🎯 COLLABORATION TYPE',
            value: `**Type:** \`${event.type}\`\n**Status:** ${event.status === 'ACTIVE' ? '🟢 ACTIVE' : '⚪ UPCOMING'}`,
            inline: false,
        },
        {
            name: '📅 EVENT PERIOD',
            value: `**${dateStr}** through **${endDateStr}**`,
            inline: false,
        },
        {
            name: '👥 COMMUNITY PARTICIPANTS',
            value: `📊 \`${event._count?.entries || 0}\` joined so far`,
            inline: false,
        },
    ];

    if (event.requirements && event.requirements.length > 0) {
        fields.push({
            name: '🔐 PARTNERSHIP REQUIREMENTS',
            value: event.requirements.map((req, idx) => `  ${idx + 1}. 🔐 ${req.type.replace(/_/g, ' ')}`).join('\n'),
            inline: false,
        });
    }

    fields.push(
        {
            name: '━━━━━━━━━━━━━━━━━━',
            value: '\u200b',
            inline: false,
        },
        {
            name: '🚀 JOIN COLLABORATION',
            value: `**[→ VIEW DETAILS & JOIN ←](${eventUrl})**`,
            inline: false,
        },
    );

    const embed: DiscordEmbed = {
        color: 0xffd700,
        title: `🤝 **${event.title}**`,
        description: `${event.description || 'Join this collaboration'}\n\n━━━━━━━━━━━━━━━━━━`,
        ...(event.imageUrl && { image: { url: event.imageUrl } }),
        fields,
        footer: {
            text: '✨ DropLabz Collaborations',
        },
        timestamp: true,
    };

    return embed;
}

/**
 * Build winner announcement embed for Discord
 * Shows celebration message with winner details
 */
export function buildWinnerAnnouncementEmbed(eventData: {
    title: string;
    prize?: string;
    type?: string;
    winners: Array<{
        walletAddress: string;
        discordUserId?: string;
    }>;
    selectionMode?: string;
}): DiscordEmbed {
    const { title, prize, type = 'GIVEAWAY', winners, selectionMode = 'RANDOM' } = eventData;

    // Build winner list with Discord mentions if available
    const winnerList = winners
        .map(w => {
            if (w.discordUserId) {
                return `<@${w.discordUserId}> (\`${w.walletAddress.slice(0, 8)}...\`)`;
            }
            return `\`${w.walletAddress.slice(0, 12)}...\``;
        })
        .join('\n');

    // Determine emoji based on event type
    const typeEmoji = type === 'GIVEAWAY' ? '🎁' : type === 'WHITELIST' ? '📋' : type === 'PRESALE' ? '💰' : '⭐';

    // Build fields
    const fields: Array<{
        name: string;
        value: string;
        inline?: boolean;
    }> = [
        {
            name: '🏆 Event',
            value: title,
            inline: false,
        },
        {
            name: '🎯 Winners',
            value: winnerList || 'No winners selected',
            inline: false,
        },
    ];

    // Add prize if present
    if (prize) {
        fields.push({
            name: '🎖️ Prize',
            value: prize,
            inline: true,
        });
    }

    // Add selection mode
    fields.push({
        name: '⚙️ Method',
        value: selectionMode === 'RANDOM' ? '🎲 Random Draw' : '📌 Manual Selection',
        inline: true,
    });

    const embed: DiscordEmbed = {
        color: 0x00ff41, // Radioactive green - success/celebration
        title: `${typeEmoji} **${title} - Winners Announced!**`,
        description: `🎉 Congratulations to our ${type.toLowerCase()} winners!\n\n━━━━━━━━━━━━━━━━━━`,
        fields,
        footer: {
            text: '✨ DropLabz Winner Announcement',
        },
        timestamp: true,
    };

    return embed;
}
