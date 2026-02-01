import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api-utils';
import { z } from 'zod';

const announceSchema = z.object({
    guildId: z.string(),
    channelId: z.string(),
    embed: z.object({
        title: z.string(),
        description: z.string(),
        color: z.number(),
        fields: z
            .array(
                z.object({
                    name: z.string(),
                    value: z.string(),
                    inline: z.boolean().optional(),
                }),
            )
            .optional(),
        url: z.string().optional(),
        footer: z
            .object({
                text: z.string(),
            })
            .optional(),
    }),
});

/**
 * Bot API endpoint for posting announcements to Discord
 * This is called by the web API to post embeds via the Discord bot
 */
export async function POST(req: NextRequest) {
    try {
        console.log('[bot/announce] Received request');
        const body = await req.json();
        const { guildId, channelId, embed } = announceSchema.parse(body);

        console.log('[bot/announce] Validated:', {
            guild: guildId,
            channel: channelId,
            title: embed.title,
        });

        // TODO: Call the bot process to post the announcement
        // For MVP, we'll simulate success
        // In production, this would call: botClient.postAnnouncement(guildId, channelId, embed)

        const messageId = `msg_${Date.now()}`;
        const messageUrl = `https://discord.com/channels/${guildId}/${channelId}/${Date.now()}`;

        console.log('[bot/announce] Returning simulated response:', { messageId, messageUrl });

        return NextResponse.json(
            {
                success: true,
                messageId,
                url: messageUrl,
                message: 'Announcement posted to Discord (simulated)',
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('[bot/announce] Error:', error);
        return apiError(error);
    }
}
