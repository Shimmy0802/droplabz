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
    requirements?: Array<{
        id: string;
        type: string;
        config: Prisma.JsonValue;
    }>;
    communityId?: string;
    _count?: {
        entries: number;
    };
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
        TOKEN_BALANCE: '💎', // Token/asset icon
        NFT_HOLDER: '🖼️', // NFT visual
        TWITTER_FOLLOW: '𝕏', // Twitter/X
        DISCORD_ROLE: '👤', // Person/role icon
        DISCORD_MEMBER: '👥', // Multiple people
        ALLOWLIST: '✅', // Checkmark
        CUSTOM: '🔐', // Generic lock/verification
        WHITELIST: '📋', // List icon
        POINTS: '⭐', // Points/rewards
        LEVEL: '📈', // Level/progress
        INVITE: '🔗', // Referral/invite
    };

    return typeMap[type] || '🔐'; // Default to lock icon
}

/**
 * ENHANCEMENT 7: Capacity Progress Bar
 * ASCII visualization of entry progress toward max winners
 */
function getCapacityProgressBar(entries: number, maxWinners: number | undefined): string {
    if (!maxWinners || maxWinners === 0) return `📊 **${entries}** entries received`;

    const barLength = 10;
    const percentage = Math.min((entries / maxWinners) * 100, 100);
    const filledBlocks = Math.round((percentage / 100) * barLength);
    const emptyBlocks = barLength - filledBlocks;

    const filledBar = '█'.repeat(filledBlocks);
    const emptyBar = '░'.repeat(emptyBlocks);
    const progressBar = `[${filledBar}${emptyBar}]`;

    return `${progressBar} **${entries}/${maxWinners}** slots filled (${Math.round(percentage)}%)`;
}

/**
 * ENHANCEMENT 3: Strategic Color Mapping by Urgency
 * Reserve green (#00FF41) for CTAs, use escalating urgency colors
 */
function getColorByUrgency(daysLeft: number): number {
    if (daysLeft <= 1) return 0xff4444; // Red - critical
    if (daysLeft <= 3) return 0xff8844; // Orange - urgent
    if (daysLeft <= 7) return 0xffaa44; // Yellow - limited time
    return 0x00d4ff; // Electric blue (DropLabz secondary brand) - normal
}

/**
 * ENHANCEMENT 8: Event-Type Color Mapping
 * Different colors per event type for visual distinction
 */
function getColorByEventType(eventType: string): number {
    const colorMap: Record<string, number> = {
        WHITELIST: 0x00ff41, // Green
        PRESALE: 0x00d4ff, // Electric blue
        GIVEAWAY: 0xff6b9d, // Pink/magenta
        COLLABORATION: 0xffd700, // Gold
    };
    return colorMap[eventType] || 0x00d4ff; // Default to blue
}

/**
 * Build DRAMATICALLY ENHANCED professional event embed
 * Implements ALL 11 enhancements:
 * 1. Prioritized Prize Pool (moved to second field)
 * 2. Urgency indicators with color-coded badges
 * 3. Strategic color usage (escalating urgency colors, reserve green for CTA)
 * 4. Semantic emoji icons per requirement type
 * 5. Live status indicator in title (🔴 LIVE if ACTIVE)
 * 6. Two-column layout with inline fields
 * 7. Capacity progress bar visualization
 * 8. Event-type color mapping
 * 9. Enhanced CTA with visual emphasis
 * 10. Personalization-ready code structure
 * 11. Image support with absolute URL conversion
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
    const hoursLeft = Math.floor(timeUntilEnd / (1000 * 60 * 60));
    const daysLeft = Math.floor(timeUntilEnd / (1000 * 60 * 60 * 24));
    const minutesLeft = Math.floor((timeUntilEnd % (1000 * 60 * 60)) / (1000 * 60));

    // ENHANCEMENT 1 & 8: Event type emoji and get base color from event type
    const typeEmojiMap: Record<string, string> = {
        WHITELIST: '✅',
        PRESALE: '🚀',
        GIVEAWAY: '🎁',
        COLLABORATION: '🤝',
    };
    const typeEmoji = typeEmojiMap[event.type] || '🎯';
    const typeColor = getColorByEventType(event.type);

    // ENHANCEMENT 2: Get urgency badge with color override
    const urgencyBadge = getUrgencyBadge(deadline);

    // ENHANCEMENT 3: Use urgency color, but fallback to type color for normal urgency
    let embedColor = urgencyBadge.color;
    if (daysLeft > 7) {
        // Normal urgency - use event type color
        embedColor = typeColor;
    }

    // ENHANCEMENT 5: Live status indicator in title
    const liveIndicator = event.status === 'ACTIVE' ? ' 🔴 LIVE' : '';
    const titleText = `${typeEmoji} **${event.title}**${liveIndicator}`;

    // ENHANCEMENT 4: Build requirements section with semantic emoji icons
    let requirementsText = '✅ Open to all members';
    if (event.requirements && event.requirements.length > 0) {
        const reqLines = event.requirements.map((req, idx) => {
            const displayName = req.type
                .replace(/_/g, ' ')
                .replace(/required/i, '')
                .trim();
            const emoji = getRequirementEmoji(req.type);
            return `  ${idx + 1}. ${emoji} ${displayName}`;
        });
        requirementsText = reqLines.join('\n');
    }

    // Entry count - eye-catching
    const entryCount = event._count?.entries || 0;

    // ENHANCEMENT 7: Capacity progress bar
    const progressBar = getCapacityProgressBar(entryCount, event.maxWinners);

    // Countdown text with urgency emoji
    let countdownText = '';
    if (daysLeft > 0) {
        countdownText = `⏳ **${daysLeft}d ${hoursLeft % 24}h** remaining`;
    } else if (hoursLeft > 0) {
        countdownText = `⏳ **${hoursLeft}h ${minutesLeft}m** remaining`;
    } else if (minutesLeft > 0) {
        countdownText = `⏳ **${minutesLeft}m** remaining ${urgencyBadge.emoji}`;
    } else {
        countdownText = '🔴 Event ended';
    }

    // Selection mode - with emoji
    let selectionDisplay = '🎲 Random Draw';
    if (event.selectionMode === 'FCFS') {
        selectionDisplay = '⚡ First-Come-First-Served';
    } else if (event.selectionMode === 'MANUAL') {
        selectionDisplay = '✋ Manual Selection';
    }

    // Detailed timestamp formatting
    const dateStr = deadline.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
    const timeStr = deadline.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
    });

    // Visual separator
    const separator = '━━━━━━━━━━━━━━━━━━━━━━━━━━';

    // ENHANCEMENT 6: Two-column layout with inline fields and strategic reorganization
    const fields: DiscordEmbed['fields'] = [];

    // SECTION 1: PRIZE POOL (ENHANCEMENT 1: Prioritized to second position in display order)
    if (event.prize) {
        fields.push({
            name: '🎁 PRIZE POOL',
            value: `**${event.prize}**`,
            inline: false,
        });
    }

    // SECTION 2: DEADLINE WITH URGENCY (PROMINENT)
    fields.push({
        name: `📅 ${urgencyBadge.emoji} DEADLINE - ${urgencyBadge.text}`,
        value: `**${dateStr}** at **${timeStr}**\n${countdownText}`,
        inline: false,
    });

    // SECTION 3: SELECTION & CAPACITY (TWO-COLUMN LAYOUT)
    fields.push({
        name: '🏆 WINNERS',
        value: `\`${event.maxWinners || 1}\` spots`,
        inline: true,
    });

    fields.push({
        name: '⚙️ SELECTION',
        value: selectionDisplay,
        inline: true,
    });

    // SECTION 4: PARTICIPATION PROGRESS (TWO-COLUMN WITH PROGRESS BAR)
    fields.push({
        name: '📊 PARTICIPATION',
        value: progressBar,
        inline: false,
    });

    // SECTION 5: REQUIREMENTS WITH SEMANTIC EMOJIS
    fields.push({
        name: '🔐 REQUIREMENTS TO ENTER',
        value: requirementsText,
        inline: false,
    });

    // VISUAL SEPARATOR
    fields.push({
        name: separator,
        value: '\u200b',
        inline: false,
    });

    // ENHANCEMENT 9: Enhanced CTA with visual emphasis and surrounding emojis
    // ENHANCEMENT 10: Code structure is ready for future personalization (e.g., user status field can be added here)
    fields.push({
        name: '🚀 HOW TO JOIN',
        value: [
            '1️⃣ **Click the link below** to open event',
            '2️⃣ **Connect** your Solana wallet',
            '3️⃣ **Verify requirements** are met',
            '4️⃣ **Submit** your entry',
            '',
            `✨ **[→ ENTER EVENT NOW ←](${eventUrl})** ✨`,
            '',
            '*One entry per wallet. Results announced upon close.*',
        ].join('\n'),
        inline: false,
    });

    // ENHANCEMENT 11: Image support with absolute URL conversion
    let imageUrl: string | null = null;
    if (event.imageUrl) {
        if (event.imageUrl.startsWith('/')) {
            // Relative path - convert to absolute URL
            const appBaseUrl =
                process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_BASE_URL || 'http://localhost:3000';
            imageUrl = `${appBaseUrl}${event.imageUrl}`;
        } else if (event.imageUrl.startsWith('http://') || event.imageUrl.startsWith('https://')) {
            // Already absolute - use as-is
            imageUrl = event.imageUrl;
        }
        // Ignore invalid URLs (not http(s) and not relative path)
    }

    const embed: DiscordEmbed = {
        color: embedColor,
        title: titleText,
        description: `${event.description || 'Join this exclusive event!'}\n\n${separator}`,
        image: imageUrl ? { url: imageUrl } : null,
        fields,
        footer: {
            text: `✨ DropLabz • Solana Community Operations | Event: ${event.id.slice(0, 8)}`,
        },
        timestamp: new Date().toISOString(),
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
        image: event.imageUrl ? { url: event.imageUrl } : null,
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
        timestamp: new Date().toISOString(),
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
        description: `${event.description || 'Join this collaboration event!'}\n\n━━━━━━━━━━━━━━━━━━`,
        image: event.imageUrl ? { url: event.imageUrl } : null,
        fields,
        footer: {
            text: '✨ DropLabz Collaborations',
        },
        timestamp: new Date().toISOString(),
    };

    return embed;
}
