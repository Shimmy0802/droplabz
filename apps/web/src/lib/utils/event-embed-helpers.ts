/**
 * Event Embed Helpers - DRAMATICALLY ENHANCED Discord announcements
 *
 * Professional embeds with:
 * - Heavy emoji usage for visual scanning
 * - Better section organization
 * - Strategic visual hierarchy
 * - Multiple professional layouts for different event types
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
 * Build DRAMATICALLY ENHANCED professional event embed
 * - Heavy emoji usage
 * - Better visual organization
 * - Much more professional appearance
 * - Similar to Subber examples
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

    // Determine event type emoji and color
    let typeEmoji = '🎯';
    let colorInt = 0x00ff41;

    switch (event.type) {
        case 'WHITELIST':
            typeEmoji = '✅';
            colorInt = 0x00ff41; // Green
            break;
        case 'PRESALE':
            typeEmoji = '🚀';
            colorInt = 0x00d4ff; // Blue
            break;
        case 'GIVEAWAY':
            typeEmoji = '🎁';
            colorInt = 0xff6b9d; // Pink
            break;
        case 'COLLABORATION':
            typeEmoji = '🤝';
            colorInt = 0xffd700; // Gold
            break;
        default:
            typeEmoji = '🎯';
    }

    // Status indicator - PROMINENT
    const statusEmoji = event.status === 'ACTIVE' ? '🟢' : event.status === 'CLOSED' ? '🔴' : '⚪';
    const statusText = `${statusEmoji} **${event.status}**`;

    // Selection mode - with emoji
    let selectionDisplay = '🎲 Random Draw';
    if (event.selectionMode === 'FCFS') {
        selectionDisplay = '⚡ First-Come-First-Served';
    } else if (event.selectionMode === 'MANUAL') {
        selectionDisplay = '✋ Manual Selection';
    }

    // Countdown text - PROMINENT
    let countdownText = '';
    if (daysLeft > 0) {
        countdownText = `⏳ **${daysLeft}d ${hoursLeft % 24}h** remaining`;
    } else if (hoursLeft > 0) {
        countdownText = `⏳ **${hoursLeft}h ${minutesLeft}m** remaining`;
    } else if (minutesLeft > 0) {
        countdownText = `⏳ **${minutesLeft}m** remaining ⚠️`;
    } else {
        countdownText = '🔴 Event ended';
    }

    // Build requirements section with emojis
    let requirementsText = '✅ Open to all members';
    if (event.requirements && event.requirements.length > 0) {
        const reqLines = event.requirements.map((req, idx) => {
            const displayName = req.type
                .replace(/_/g, ' ')
                .replace(/required/i, '')
                .trim();
            return `  ${idx + 1}. 🔐 ${displayName}`;
        });
        requirementsText = reqLines.join('\n');
    }

    // Entry count - eye-catching
    const entryCount = event._count?.entries || 0;
    const entryDisplay =
        entryCount === 0 ? '📊 **Be the first to enter!**' : `📊 **${entryCount}** participants joined`;

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

    const fields: DiscordEmbed['fields'] = [
        // SECTION 1: EVENT TYPE & STATUS (PROMINENT)
        {
            name: '🎯 EVENT DETAILS',
            value: `**Type:** \`${event.type}\`\n**Status:** ${statusText}`,
            inline: false,
        },

        // SECTION 2: WINNERS & SELECTION
        {
            name: '🏆 SELECTION & CAPACITY',
            value: `**Winners:** \`${event.maxWinners || 1}\`\n**Mode:** ${selectionDisplay}`,
            inline: false,
        },

        // SECTION 3: PARTICIPANTS (VISUALLY DISTINCT)
        {
            name: '👥 PARTICIPATION',
            value: entryDisplay,
            inline: false,
        },

        // SECTION 4: DEADLINE (VERY PROMINENT - FULL WIDTH)
        {
            name: '📅 ⏰ DEADLINE',
            value: `**${dateStr}** at **${timeStr}**\n${countdownText}`,
            inline: false,
        },
    ];

    // SECTION 5: PRIZE (IF EXISTS - FULL WIDTH)
    if (event.prize) {
        fields.push({
            name: '🎁 PRIZE POOL',
            value: `**${event.prize}**`,
            inline: false,
        });
    }

    // SECTION 6: REQUIREMENTS (FULL WIDTH)
    fields.push({
        name: '🔐 REQUIREMENTS TO ENTER',
        value: requirementsText,
        inline: false,
    });

    // VISUAL SEPARATOR LINE
    fields.push({
        name: separator,
        value: '\u200b',
        inline: false,
    });

    // SECTION 7: CALL TO ACTION (BOLD & PROMINENT)
    fields.push({
        name: '🚀 HOW TO JOIN',
        value: [
            '1️⃣ **Click link below** to enter event',
            '2️⃣ **Connect** your Solana wallet',
            '3️⃣ **Verify** all requirements met',
            '4️⃣ **Submit** your entry',
            '',
            `**[→ ENTER EVENT NOW ←](${eventUrl})**`,
        ].join('\n'),
        inline: false,
    });

    const embed: DiscordEmbed = {
        color: colorInt,
        title: `${typeEmoji} **${event.title}**`,
        description: `${event.description || 'Join this exclusive event!'}\n\n${separator}`,
        image: event.imageUrl ? { url: event.imageUrl } : null,
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
