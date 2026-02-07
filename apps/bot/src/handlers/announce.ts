import { Client, EmbedBuilder, ChannelType } from 'discord.js';

/**
 * Professional event embed data structure for Discord announcements
 * Compatible with discord.js EmbedBuilder
 */
export interface AnnouncementData {
    title: string;
    description: string;
    color: number;
    fields?: Array<{
        name: string;
        value: string;
        inline?: boolean;
    }>;
    url?: string;
    footer?: {
        text: string;
        iconURL?: string;
    };
    thumbnail?: {
        url: string;
    };
    image?: {
        url: string;
    };
}

export interface AnnouncementOptions {
    content?: string; // Plain text content with role mentions
    mentionRoleIds?: string[]; // Discord role IDs to allow mentioning
}

/**
 * Post announcement embed to Discord channel with optional role mentions
 * @param client - Discord client
 * @param guildId - Discord guild ID
 * @param channelId - Discord channel ID
 * @param embedData - Embed data (raw JSON or AnnouncementData object)
 * @param options - Optional announcement options (content, mentionRoleIds)
 * @returns Message ID and URL of posted message
 */
export async function announceEvent(
    client: Client,
    guildId: string,
    channelId: string,
    embedData: AnnouncementData | any,
    options?: AnnouncementOptions,
): Promise<{ messageId: string; url: string }> {
    try {
        // Fetch guild
        const guild = await client.guilds.fetch(guildId);
        if (!guild) {
            throw new Error(`Guild ${guildId} not found`);
        }

        // Fetch channel
        const channel = await guild.channels.fetch(channelId);
        if (!channel || channel.type !== ChannelType.GuildText) {
            throw new Error(`Channel ${channelId} not found or not a text channel`);
        }

        // Build embed - accept both raw JSON and AnnouncementData formats
        const embed = new EmbedBuilder();

        if (embedData.title) embed.setTitle(embedData.title);
        if (embedData.description) embed.setDescription(embedData.description);
        if (embedData.color) embed.setColor(embedData.color);
        if (embedData.url) embed.setURL(embedData.url);

        if (embedData.thumbnail && typeof embedData.thumbnail === 'object') {
            embed.setThumbnail(embedData.thumbnail.url);
        }

        if (embedData.image && typeof embedData.image === 'object') {
            embed.setImage(embedData.image.url);
        }

        if (embedData.footer) {
            const footerObj: any = { text: embedData.footer.text };
            if (embedData.footer.iconURL) {
                footerObj.iconURL = embedData.footer.iconURL;
            }
            embed.setFooter(footerObj);
        }

        // Add fields
        if (embedData.fields && Array.isArray(embedData.fields)) {
            for (const field of embedData.fields) {
                if (field && field.name && field.value) {
                    embed.addFields({
                        name: field.name,
                        value: field.value,
                        inline: field.inline ?? false,
                    });
                }
            }
        }

        if (embedData.timestamp) {
            embed.setTimestamp();
        }

        // Send message with optional content and role mentions
        console.log('[announce] Sending message with options:', {
            hasContent: !!options?.content,
            mentionRoleIds: options?.mentionRoleIds || [],
            contentPreview: options?.content?.substring(0, 50),
        });

        const message = await channel.send({
            content: options?.content || undefined,
            embeds: [embed],
            allowedMentions: {
                roles: options?.mentionRoleIds || [],
                parse: [],
            },
        });

        console.log(`[announce] Announcement posted to ${guild.name}/${channel.name}: ${message.id}`);

        return {
            messageId: message.id,
            url: message.url,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[announce] Failed to announce event:', errorMessage);
        throw new Error(`Failed to announce event: ${errorMessage}`);
    }
}
