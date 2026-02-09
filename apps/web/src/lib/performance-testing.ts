/**
 * Performance Testing Utilities for DropLabz
 *
 * Provides tools for benchmarking:
 * - API response times
 * - Database query performance
 * - Concurrent request handling
 * - Index effectiveness
 */

import { performance } from 'perf_hooks';

interface BenchmarkResult {
    name: string;
    duration: number; // milliseconds
    startTime: number;
    endTime: number;
    timestamp: Date;
}

export interface LoadTestResult {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    throughput: number; // requests per second
    duration: number;
    concurrency: number;
}

/**
 * Simple benchmarking utility
 * Usage:
 *   const timer = startBenchmark('database-query');
 *   // ... do work ...
 *   const result = endBenchmark(timer);
 *   console.log(`Query took ${result.duration}ms`);
 */
export function startBenchmark(name: string): { name: string; start: number } {
    return {
        name,
        start: performance.now(),
    };
}

export function endBenchmark(timer: { name: string; start: number }): BenchmarkResult {
    const end = performance.now();
    const duration = end - timer.start;

    return {
        name: timer.name,
        duration,
        startTime: timer.start,
        endTime: end,
        timestamp: new Date(),
    };
}

/**
 * Async benchmark wrapper
 * Usage:
 *   const result = await measureAsync('event-fetch', async () => {
 *     return await db.event.findMany();
 *   });
 */
export async function measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
): Promise<{ result: T; benchmark: BenchmarkResult }> {
    const timer = startBenchmark(name);
    const result = await fn();
    const benchmark = endBenchmark(timer);

    return { result, benchmark };
}

/**
 * Sync benchmark wrapper
 */
export function measureSync<T>(name: string, fn: () => T): { result: T; benchmark: BenchmarkResult } {
    const timer = startBenchmark(name);
    const result = fn();
    const benchmark = endBenchmark(timer);

    return { result, benchmark };
}

/**
 * Aggregate multiple benchmark results
 */
export function aggregateBenchmarks(results: BenchmarkResult[]): {
    totalTests: number;
    averageTime: number;
    minTime: number;
    maxTime: number;
    totalTime: number;
} {
    if (results.length === 0) {
        return {
            totalTests: 0,
            averageTime: 0,
            minTime: 0,
            maxTime: 0,
            totalTime: 0,
        };
    }

    const times = results.map(r => r.duration);
    const totalTime = times.reduce((a, b) => a + b, 0);
    const averageTime = totalTime / results.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    return {
        totalTests: results.length,
        averageTime: Math.round(averageTime * 100) / 100,
        minTime: Math.round(minTime * 100) / 100,
        maxTime: Math.round(maxTime * 100) / 100,
        totalTime: Math.round(totalTime * 100) / 100,
    };
}

/**
 * Format benchmark results for logging
 */
export function formatBenchmark(result: BenchmarkResult): string {
    return `[${result.name}] ${result.duration.toFixed(2)}ms (${new Date(result.timestamp).toISOString()})`;
}

/**
 * Performance alert - warn if response time exceeds threshold
 */
export function checkPerformanceThreshold(
    result: BenchmarkResult,
    thresholdMs: number,
    logFn?: (msg: string) => void,
): boolean {
    const log = logFn || console.warn;

    if (result.duration > thresholdMs) {
        log(`⚠️ SLOW: ${result.name} took ${result.duration.toFixed(2)}ms (threshold: ${thresholdMs}ms)`);
        return false;
    }

    return true;
}

/**
 * Performance thresholds by operation type
 * Use for automated performance testing/CI
 */
export const PERFORMANCE_THRESHOLDS = {
    // API endpoints
    'api:get': 100, // Simple GET requests should be < 100ms
    'api:post': 200, // POST/write operations < 200ms
    'api:list': 300, // List/pagination queries < 300ms

    // Database queries
    'db:single': 50, // Find by ID < 50ms
    'db:list': 100, // List queries < 100ms
    'db:aggregate': 200, // Aggregation queries < 200ms
    'db:write': 150, // INSERT/UPDATE/DELETE < 150ms

    // External services
    'external:discord': 500, // Discord API calls < 500ms
    'external:solana': 1000, // Solana RPC calls < 1s

    // Auth
    'auth:session': 100, // Session lookup < 100ms
    'auth:verify': 150, // Signature verification < 150ms
};

/**
 * Helper to get threshold for operation
 */
export function getThreshold(operationType: keyof typeof PERFORMANCE_THRESHOLDS): number {
    return PERFORMANCE_THRESHOLDS[operationType] || 500;
}

/**
 * Generate performance report
 */
export function generatePerformanceReport(benchmarks: Map<string, BenchmarkResult[]>): Record<string, any> {
    const report: Record<string, any> = {};

    for (const [operation, results] of benchmarks) {
        const agg = aggregateBenchmarks(results);
        const threshold = getThreshold(operation as keyof typeof PERFORMANCE_THRESHOLDS);
        const isHealthy = agg.maxTime <= threshold;

        report[operation] = {
            ...agg,
            threshold,
            status: isHealthy ? '✅ PASS' : '⚠️ SLOW',
        };
    }

    return report;
}
