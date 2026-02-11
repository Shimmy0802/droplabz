'use strict';

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

function loadEnvFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return;
    }

    const contents = fs.readFileSync(filePath, 'utf8');
    const lines = contents.split(/\r?\n/);

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
            continue;
        }
        const equalsIndex = trimmed.indexOf('=');
        if (equalsIndex === -1) {
            continue;
        }
        const key = trimmed.slice(0, equalsIndex).trim();
        let value = trimmed.slice(equalsIndex + 1).trim();

        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }

        if (process.env[key] === undefined) {
            process.env[key] = value;
        }
    }
}

function loadEnv() {
    const rootEnv = path.resolve(__dirname, '../../..', '.env');
    const appEnvLocal = path.resolve(__dirname, '../.env.local');

    loadEnvFile(rootEnv);
    loadEnvFile(appEnvLocal);
}

async function main() {
    loadEnv();

    const db = new PrismaClient();

    try {
        const event = await db.event.findFirst({
            orderBy: { updatedAt: 'desc' },
            select: { id: true, communityId: true },
        });

        if (!event) {
            console.log('No events found for EXPLAIN ANALYZE.');
            return;
        }

        const entry = await db.entry.findFirst({
            where: { eventId: event.id },
            orderBy: { updatedAt: 'desc' },
            select: { walletAddress: true, status: true },
        });

        if (!entry) {
            console.log('No entries found for EXPLAIN ANALYZE.');
            return;
        }

        console.log('EXPLAIN ANALYZE targets');
        console.log({
            eventId: event.id,
            status: entry.status,
            walletAddress: entry.walletAddress,
        });

        const entriesByStatus = await db.$queryRawUnsafe(`
            EXPLAIN (ANALYZE, BUFFERS)
            SELECT * FROM "Entry"
            WHERE "eventId" = '${event.id}'
              AND status = '${entry.status}'
            ORDER BY "createdAt" DESC
            LIMIT 50;
        `);

        const uniqueCheck = await db.$queryRawUnsafe(`
            EXPLAIN (ANALYZE, BUFFERS)
            SELECT * FROM "Entry"
            WHERE "eventId" = '${event.id}'
              AND "walletAddress" = '${entry.walletAddress}'
            LIMIT 1;
        `);

        console.log('EXPLAIN ANALYZE: entries-by-status');
        entriesByStatus.forEach(row => console.log(row['QUERY PLAN']));

        console.log('EXPLAIN ANALYZE: entry-unique-check');
        uniqueCheck.forEach(row => console.log(row['QUERY PLAN']));
    } finally {
        await db.$disconnect();
    }
}

main().catch(error => {
    console.error('EXPLAIN ANALYZE failed');
    console.error(error);
    process.exitCode = 1;
});
