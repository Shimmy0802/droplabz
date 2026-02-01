import { NextRequest } from 'next/server';
import { requireAuth, getCurrentUser } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { ApiError, apiResponse, apiError } from '@/lib/api-utils';
import { buildProfessionalEventEmbed } from '@/lib/utils/event-embed-helpers';
import { z } from 'zod';

const announceSchema = z.object({
    communityId: z.string().cuid(),
    scheduleFor: z.string().datetime().optional(),
});

export async function POST(_req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
    try {
        const { eventId } = await params;
        console.log('[announce] POST request received for eventId:', eventId);

        await requireAuth();
        const user = await getCurrentUser();
        console.log('[announce] User authenticated:', user.id);

        // Parse and validate input
        let body;
        try {
            body = await _req.json();
            console.log('[announce] Request body parsed:', {
                communityId: body.communityId,
                scheduleFor: body.scheduleFor,
            });
        } catch (parseError) {
            console.error('[announce] Failed to parse request JSON:', parseError);
            throw new ApiError('INVALID_JSON', 400, 'Invalid request JSON');
        }

        const { communityId, scheduleFor } = announceSchema.parse(body);

        // Fetch event
        const event = await db.event.findUnique({
            where: { id: eventId },
            include: {
                community: {
                    select: {
                        id: true,
                        slug: true,
                        ownerId: true,
                        guildId: true,
                        discordAnnouncementChannelId: true,
                        discordGuildName: true,
                        discordAnnouncementChannelName: true,
                    },
                },
                requirements: true,
                _count: {
                    select: {
                        entries: true,
                    },
                },
            },
        });

        console.log('[announce] Event fetched:', {
            eventId: event?.id,
            title: event?.title,
            communityId: event?.communityId,
            guildId: event?.community?.guildId,
            channelId: event?.community?.discordAnnouncementChannelId,
        });

        if (!event) {
            throw new ApiError('EVENT_NOT_FOUND', 404, 'Event not found');
        }

        // Verify community matches
        if (event.communityId !== communityId) {
            throw new ApiError('INVALID_COMMUNITY', 400, 'Event does not belong to this community');
        }

        // Verify community admin
        if (event.community.ownerId !== user.id) {
            const membership = await db.communityMember.findUnique({
                where: {
                    communityId_userId: {
                        communityId: event.communityId,
                        userId: user.id,
                    },
                },
            });

            if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
                throw new ApiError('FORBIDDEN', 403, 'Community admin access required');
            }
        }

        // Validate Discord is configured
        if (!event.community.guildId || !event.community.discordAnnouncementChannelId) {
            throw new ApiError(
                'DISCORD_NOT_CONFIGURED',
                400,
                'Discord guild and announcement channel must be configured',
            );
        }

        // Check rate limit (10 per hour)
        const recentAnnouncements = await db.eventAnnouncement.count({
            where: {
                communityId: event.communityId,
                createdAt: { gte: new Date(Date.now() - 3600000) }, // Last hour
            },
        });

        if (recentAnnouncements >= 10) {
            throw new ApiError('RATE_LIMITED', 429, 'Announcement limit exceeded (10 per hour)');
        }

        // Create announcement record
        let announcement;
        try {
            // Delete any existing announcement with the same trigger to allow re-posting
            console.log('[announce] Checking for existing announcement with trigger MANUAL');
            const existingAnnouncement = await db.eventAnnouncement.findFirst({
                where: {
                    eventId,
                    trigger: 'MANUAL',
                },
            });

            if (existingAnnouncement) {
                console.log('[announce] Found existing announcement, deleting it:', {
                    announcementId: existingAnnouncement.id,
                });
                await db.eventAnnouncement.delete({
                    where: { id: existingAnnouncement.id },
                });
            }

            // Now create the new announcement
            announcement = await db.eventAnnouncement.create({
                data: {
                    eventId,
                    communityId: event.communityId,
                    trigger: 'MANUAL',
                    status: scheduleFor ? 'SCHEDULED' : 'QUEUED',
                    scheduledFor: scheduleFor ? new Date(scheduleFor) : new Date(),
                    triggeredBy: user.id,
                },
            });
            console.log('[announce] Prisma insert succeeded, announcement:', {
                id: announcement.id,
                status: announcement.status,
            });
        } catch (createError) {
            console.error('[announce] Error creating announcement record:', {
                errorType: createError instanceof Error ? createError.constructor.name : typeof createError,
                message: createError instanceof Error ? createError.message : String(createError),
                stack: createError instanceof Error ? createError.stack : undefined,
            });
            throw createError;
        }

        console.log('[announce] Announcement record created:', {
            announcementId: announcement.id,
            status: announcement.status,
            scheduled: !!scheduleFor,
        });

        console.log('[announce] About to check scheduleFor:', { scheduleFor, isScheduled: !!scheduleFor });

        // If immediate, send to bot
        if (!scheduleFor) {
            console.log('[announce] Entering immediate announcement branch');
            try {
                console.log('[announce] Building embed for event:', {
                    eventId: event.id,
                    type: event.type,
                    endAt: event.endAt,
                });

                console.log('[announce] Calling postAnnouncementToBot...');
                const botResponse = await postAnnouncementToBot(event);
                console.log('[announce] postAnnouncementToBot completed successfully');

                // Update with success
                try {
                    await db.eventAnnouncement.update({
                        where: { id: announcement.id },
                        data: {
                            discordMessageId: botResponse.messageId,
                            status: 'SENT',
                            sentAt: new Date(),
                        },
                    });
                } catch (updateError) {
                    console.error('[announce] Failed to update announcement with success:', updateError);
                    throw updateError;
                }

                // Log action
                await db.auditLog.create({
                    data: {
                        communityId: event.communityId,
                        actorId: user.id,
                        action: 'EVENT_ANNOUNCEMENT',
                        meta: {
                            eventId,
                            announcementId: announcement.id,
                            trigger: 'MANUAL',
                            discordMessageId: botResponse.messageId,
                        },
                    },
                });

                return apiResponse({
                    success: true,
                    announcementId: announcement.id,
                    status: 'SENT',
                    message: 'Event announced successfully',
                    discordMessageUrl: botResponse.url,
                });
            } catch (error) {
                console.error('[announce] Error in announcement flow:', {
                    errorType: error instanceof Error ? error.constructor.name : typeof error,
                    message: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                });
                // Update with error
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                try {
                    await db.eventAnnouncement.update({
                        where: { id: announcement.id },
                        data: {
                            status: 'FAILED',
                            lastError: errorMessage,
                            attemptCount: 1,
                        },
                    });
                } catch (updateError) {
                    console.error('[announce] Failed to update announcement with error status:', updateError);
                }

                throw new ApiError('ANNOUNCEMENT_FAILED', 500, `Failed to post announcement: ${errorMessage}`);
            }
        }

        // Log scheduled announcement
        await db.auditLog.create({
            data: {
                communityId: event.communityId,
                actorId: user.id,
                action: 'EVENT_ANNOUNCEMENT_SCHEDULED',
                meta: {
                    eventId,
                    announcementId: announcement.id,
                    scheduleFor,
                },
            },
        });

        return apiResponse({
            success: true,
            announcementId: announcement.id,
            status: 'SCHEDULED',
            message: 'Announcement scheduled',
        });
    } catch (error) {
        return apiError(error);
    }
}

async function postAnnouncementToBot(event: any): Promise<{ messageId: string; url: string }> {
    try {
        console.log('[announce] postAnnouncementToBot called with event:', {
            eventId: event.id,
            type: event.type,
            title: event.title,
        });

        const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
        const communitySlug = event.community.slug;
        const embed = buildProfessionalEventEmbed(event, communitySlug, baseUrl);
        console.log('[announce] Embed built successfully');

        // Call the Discord bot's HTTP server (runs on port 3001)
        const botUrl = 'http://127.0.0.1:3001/announce';

        console.log(`[announce] Posting to Discord bot API: ${botUrl}`);

        const response = await fetch(botUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                guildId: event.community.guildId,
                channelId: event.community.discordAnnouncementChannelId,
                embed,
            }),
        });

        console.log(`[announce] Bot API response status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'No error text');
            console.error(`[announce] Bot API error: ${response.status} ${response.statusText} - ${errorText}`);
            throw new Error(`Bot API error: ${response.status} ${response.statusText}`);
        }

        let data;
        try {
            data = await response.json();
            console.log(`[announce] Bot API success:`, data);
        } catch (parseError) {
            console.error(`[announce] Failed to parse bot response as JSON:`, parseError);
            throw new Error(
                `Failed to parse bot response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
            );
        }

        return { messageId: data.messageId, url: data.url };
    } catch (error) {
        console.error('[announce] postAnnouncementToBot error:', error);
        throw error;
    }
}
