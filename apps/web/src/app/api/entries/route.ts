import { db } from '@/lib/db';
import { createEntrySchema } from '@/lib/validation';
import { apiResponse, ApiError } from '@/lib/api-utils';
import { validateSolanaAddress } from '@/lib/solana/verification';
import { getCurrentUserId } from '@/lib/auth/session';
import { verifyAndUpdateEntry } from '@/lib/verification/entry-verifier';
import { NextRequest } from 'next/server';
import { z } from 'zod';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const input = createEntrySchema.parse(body);

        // Get current user ID if authenticated (optional for entries)
        let userId: string | null = null;
        try {
            userId = await getCurrentUserId();
        } catch {
            // User not authenticated, that's okay for entries
        }

        // Verify wallet format
        try {
            validateSolanaAddress(input.walletAddress);
        } catch {
            throw new ApiError('INVALID_WALLET', 400, 'Invalid Solana wallet address');
        }

        // Check if event exists
        const event = await db.event.findUnique({
            where: { id: input.eventId },
            include: {
                requirements: true,
                community: {
                    select: {
                        id: true,
                        name: true,
                        guildId: true,
                    },
                },
            },
        });

        if (!event) {
            throw new ApiError('EVENT_NOT_FOUND', 404, 'Event not found');
        }

        if (event.status !== 'ACTIVE') {
            throw new ApiError('EVENT_INACTIVE', 400, 'Event is not currently accepting entries');
        }

        // Check for duplicate entry (one entry per wallet per event)
        const existingEntry = await db.entry.findUnique({
            where: {
                eventId_walletAddress: {
                    eventId: input.eventId,
                    walletAddress: input.walletAddress,
                },
            },
        });

        if (existingEntry) {
            throw new ApiError('DUPLICATE_ENTRY', 400, 'This wallet has already entered this event');
        }

        // Create entry with PENDING status first
        const entry = await db.entry.create({
            data: {
                eventId: input.eventId,
                walletAddress: input.walletAddress,
                discordUserId: input.discordUserId || undefined,
                userId: userId || undefined,
                status: 'PENDING',
            },
        });

        // Run verification against requirements
        const verificationResult = await verifyAndUpdateEntry(
            entry.id,
            input.walletAddress,
            input.discordUserId || undefined,
            event.requirements,
        );

        // Handle FCFS (First Come First Served) mode
        let winner = null;
        if (event.selectionMode === 'FCFS' && verificationResult.entry.status === 'VALID') {
            // Check available spots (maxWinners - reservedSpots - current winners)
            const currentWinners = await db.winner.count({
                where: { eventId: input.eventId },
            });

            const availableSpots = event.maxWinners - (event.reservedSpots || 0) - currentWinners;

            if (availableSpots > 0) {
                // Auto-assign as winner
                winner = await db.winner.create({
                    data: {
                        eventId: input.eventId,
                        entryId: entry.id,
                        pickedBy: 'SYSTEM_FCFS',
                    },
                });
            }
        }

        return apiResponse(
            {
                entry: verificationResult.entry,
                verification: verificationResult.verification,
                winner: winner || undefined,
                fcfsAssigned: !!winner,
            },
            201,
        );
    } catch (error) {
        console.error('[API Error] POST /api/entries:', error);
        
        if (error instanceof z.ZodError) {
            return apiResponse(
                { error: 'VALIDATION_ERROR', issues: error.issues },
                400
            );
        }
        
        if (error instanceof ApiError) {
            return apiResponse(
                { error: error.code, message: error.message },
                error.statusCode
            );
        }

        if (error instanceof Error) {
            console.error('Error details:', error.message, error.stack);
        }
        
        return apiResponse(
            { error: 'INTERNAL_SERVER_ERROR', message: 'Failed to create entry' },
            500
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get('eventId');
        const status = searchParams.get('status');

        if (!eventId) {
            throw new ApiError('MISSING_PARAM', 400, 'eventId is required');
        }

        const whereClause: any = { eventId };
        if (status) {
            whereClause.status = status;
        }

        const entries = await db.entry.findMany({
            where: whereClause,
            include: {
                event: {
                    select: {
                        title: true,
                        community: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return apiResponse(entries);
    } catch (error) {
        console.error('[API Error] GET /api/entries:', error);
        
        if (error instanceof ApiError) {
            return apiResponse(
                { error: error.code, message: error.message },
                error.statusCode
            );
        }

        return apiResponse(
            { error: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch entries' },
            500
        );
    }
}
