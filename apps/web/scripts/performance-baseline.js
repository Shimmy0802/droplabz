'use strict';

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
const { PrismaClient } = require('@prisma/client');

const DEFAULT_BASE_URL = 'http://localhost:3000';
const DEFAULT_ITERATIONS = 5;
const DEFAULT_TIMEOUT_MS = 5000;

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

function nowMs() {
    return performance.now();
}

function aggregateDurations(durations) {
    if (durations.length === 0) {
        return { average: 0, min: 0, max: 0, total: 0, p95: 0 };
    }

    const sorted = [...durations].sort((a, b) => a - b);
    const total = durations.reduce((sum, value) => sum + value, 0);
    const average = total / durations.length;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const p95Index = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);
    const p95 = sorted[p95Index];

    return {
        average: Math.round(average * 100) / 100,
        min: Math.round(min * 100) / 100,
        max: Math.round(max * 100) / 100,
        total: Math.round(total * 100) / 100,
        p95: Math.round(p95 * 100) / 100,
    };
}

async function runBenchmark(name, iterations, fn) {
    const durations = [];
    for (let i = 0; i < iterations; i += 1) {
        const start = nowMs();
        await fn();
        const end = nowMs();
        durations.push(end - start);
    }

    return {
        name,
        iterations,
        durations,
        stats: aggregateDurations(durations),
    };
}

async function fetchWithTiming(url, timeoutMs) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const start = nowMs();
    let status = 0;
    try {
        const response = await fetch(url, { signal: controller.signal });
        status = response.status;
        await response.text();
    } finally {
        clearTimeout(timeout);
    }

    const duration = nowMs() - start;
    return { duration, status };
}

function getThreshold(name) {
    const thresholds = {
        'api:featured-communities': 300,
        'api:verified-communities': 300,
        'api:homepage': 500,
        'api:events-by-community': 300,
        'db:events-by-community': 100,
        'db:entries-by-status': 50,
        'db:entry-unique-check': 10,
        'db:members-by-role': 100,
    };

    return thresholds[name];
}

function formatResult(result) {
    const threshold = getThreshold(result.name);
    const status = threshold !== undefined && result.stats.max > threshold ? 'SLOW' : 'PASS';

    return {
        name: result.name,
        iterations: result.iterations,
        averageMs: result.stats.average,
        minMs: result.stats.min,
        maxMs: result.stats.max,
        p95Ms: result.stats.p95,
        thresholdMs: threshold ?? null,
        status,
    };
}

async function main() {
    loadEnv();

    const baseUrl = process.env.PERF_BASE_URL || DEFAULT_BASE_URL;
    const iterations = parseInt(process.env.PERF_ITERATIONS || '', 10) || DEFAULT_ITERATIONS;
    const timeoutMs = parseInt(process.env.PERF_TIMEOUT_MS || '', 10) || DEFAULT_TIMEOUT_MS;
    const skipApi = ['1', 'true', 'yes'].includes(String(process.env.PERF_SKIP_API || '').toLowerCase());

    const db = new PrismaClient();

    try {
        const community = await db.community.findFirst({
            orderBy: { updatedAt: 'desc' },
            select: { id: true, slug: true, updatedAt: true },
        });

        const event = community
            ? await db.event.findFirst({
                  where: { communityId: community.id },
                  orderBy: { updatedAt: 'desc' },
                  select: { id: true, communityId: true, type: true, updatedAt: true },
              })
            : await db.event.findFirst({
                  orderBy: { updatedAt: 'desc' },
                  select: { id: true, communityId: true, type: true, updatedAt: true },
              });

        const entry = event
            ? await db.entry.findFirst({
                  where: { eventId: event.id },
                  orderBy: { updatedAt: 'desc' },
                  select: { id: true, walletAddress: true, status: true },
              })
            : null;

        const member = community
            ? await db.communityMember.findFirst({
                  where: { communityId: community.id },
                  orderBy: { updatedAt: 'desc' },
                  select: { id: true, role: true },
              })
            : null;

        console.log('Performance baseline starting');
        console.log(`Base URL: ${baseUrl}`);
        console.log(`Iterations: ${iterations}`);
        console.log('Discovery summary');
        console.log({
            communityId: community?.id || null,
            eventId: event?.id || null,
            entryId: entry?.id || null,
        });

        const results = [];

        if (community) {
            results.push(
                await runBenchmark('db:events-by-community', iterations, async () => {
                    await db.event.findMany({
                        where: { communityId: community.id, status: 'ACTIVE' },
                        take: 20,
                    });
                }),
            );

            if (member?.role) {
                results.push(
                    await runBenchmark('db:members-by-role', iterations, async () => {
                        await db.communityMember.findMany({
                            where: { communityId: community.id, role: member.role },
                            take: 50,
                        });
                    }),
                );
            }
        }

        if (event) {
            results.push(
                await runBenchmark('db:entries-by-status', iterations, async () => {
                    await db.entry.findMany({
                        where: { eventId: event.id, status: entry?.status || 'PENDING' },
                        take: 50,
                    });
                }),
            );
        }

        if (event && entry?.walletAddress) {
            results.push(
                await runBenchmark('db:entry-unique-check', iterations, async () => {
                    await db.entry.findUnique({
                        where: {
                            eventId_walletAddress: {
                                eventId: event.id,
                                walletAddress: entry.walletAddress,
                            },
                        },
                    });
                }),
            );
        }

        if (!skipApi) {
            const apiBenchmarks = [
                { name: 'api:featured-communities', path: '/api/featured-communities' },
                { name: 'api:verified-communities', path: '/api/verified-communities?limit=6&offset=0' },
                { name: 'api:homepage', path: '/api/homepage' },
            ];

            if (community?.id) {
                const typeQuery = event?.type ? `&type=${encodeURIComponent(event.type)}` : '';
                apiBenchmarks.push({
                    name: 'api:events-by-community',
                    path: `/api/events?communityId=${encodeURIComponent(community.id)}${typeQuery}`,
                });
            }

            let apiAvailable = true;
            try {
                await fetchWithTiming(`${baseUrl}${apiBenchmarks[0].path}`, timeoutMs);
            } catch (error) {
                apiAvailable = false;
                console.warn(`API benchmarks skipped: unable to reach ${baseUrl}`);
            }

            if (apiAvailable) {
                for (const endpoint of apiBenchmarks) {
                    results.push(
                        await runBenchmark(endpoint.name, iterations, async () => {
                            const { status } = await fetchWithTiming(`${baseUrl}${endpoint.path}`, timeoutMs);
                            if (status >= 500) {
                                throw new Error(`API ${endpoint.name} failed with status ${status}`);
                            }
                        }),
                    );
                }
            }
        } else {
            console.log('API benchmarks skipped by PERF_SKIP_API');
        }

        console.log('Performance baseline results');
        const formatted = results.map(formatResult);
        for (const result of formatted) {
            console.log(result);
        }

        const slow = formatted.filter(result => result.status !== 'PASS');
        if (slow.length > 0) {
            console.log('Slow benchmarks detected');
            for (const result of slow) {
                console.log(result);
            }
        }
    } finally {
        await db.$disconnect();
    }
}

main().catch(error => {
    console.error('Performance baseline failed');
    console.error(error);
    process.exitCode = 1;
});
