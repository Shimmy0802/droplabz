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

/**
 * Post announcement embed to Discord channel
 * @param client - Discord client
 * @param guildId - Discord guild ID
 * @param channelId - Discord channel ID
 * @param embedData - Embed data to post
 * @returns Message ID and URL of posted message
 */
export async function announceEvent(
    client: Client,
    guildId: string,
    channelId: string,
    embedData: AnnouncementData,
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

        // Build embed with enhanced styling
        const embed = new EmbedBuilder()
            .setTitle(embedData.title)
            .setDescription(embedData.description)
            .setColor(embedData.color)
            .setTimestamp(); // Add embed timestamp for premium look

        if (embedData.url) {
            embed.setURL(embedData.url);
        }

        if (embedData.thumbnail) {
            embed.setThumbnail(embedData.thumbnail.url);
        }

        if (embedData.image) {
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
        if (embedData.fields && embedData.fields.length > 0) {
            for (const field of embedData.fields) {
                embed.addFields({
                    name: field.name,
                    value: field.value,
                    inline: field.inline ?? false,
                });
            }
        }

        // Send message
        const message = await channel.send({ embeds: [embed] });

        console.log(`[Bot] Announcement posted to ${guild.name}/${channel.name}: ${message.id}`);

        return {
            messageId: message.id,
            url: message.url,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Bot] Failed to announce event:', errorMessage);
        throw new Error(`Failed to announce event: ${errorMessage}`);
    }
}
