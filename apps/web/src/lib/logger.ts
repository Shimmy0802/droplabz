/**
 * Production-safe logger utility
 * Handles environment-based logging with no console.log in logs
 *
 * Usage:
 * - Development: logger.debug() outputs to console
 * - Production: logger.debug() is no-op; logger.error() writes to stderr only
 */

const isDevelopment = process.env.NODE_ENV === 'development';

interface LogContext {
    [key: string]: any;
}

export class Logger {
    private name: string;

    constructor(name: string) {
        this.name = name;
    }

    /**
     * Debug logging - only visible in development
     * Production: completely silent (no performance impact)
     */
    debug(message: string, context?: LogContext): void {
        if (isDevelopment) {
            console.debug(`[${this.name}] ${message}`, context || '');
        }
    }

    /**
     * Info logging - minimal output
     * Production: silent (use for development workflow)
     */
    info(message: string, context?: LogContext): void {
        if (isDevelopment) {
            console.info(`[${this.name}] ${message}`, context || '');
        }
    }

    /**
     * Warning logging - important but not critical
     * Production: logged to stderr only (no console)
     */
    warn(message: string, context?: LogContext): void {
        if (isDevelopment) {
            console.warn(`[${this.name}] ${message}`, context || '');
        } else {
            // Production: write to stderr without console.log
            process.stderr.write(`WARN [${this.name}] ${message} ${JSON.stringify(context || {})}\n`);
        }
    }

    /**
     * Error logging - critical issues
     * Production: logged to stderr with context for debugging
     */
    error(message: string, error?: Error | LogContext, context?: LogContext): void {
        const errorMsg =
            error instanceof Error ? `${error.message}${isDevelopment ? `\n${error.stack}` : ''}` : message;

        if (isDevelopment) {
            console.error(`[${this.name}] ${errorMsg}`, context || error || '');
        } else {
            // Production: write detailed error to stderr (for log aggregation)
            const fullContext = error instanceof Error ? context : error;
            process.stderr.write(`ERROR [${this.name}] ${errorMsg} ${JSON.stringify(fullContext || {})}\n`);
        }
    }
}

/**
 * Create a logger instance for a module
 * @param moduleName - Name to display in logs (e.g., 'Events API', 'Auth Service')
 */
export function createLogger(moduleName: string): Logger {
    return new Logger(moduleName);
}

/**
 * Global logger instance
 */
export const logger = new Logger('DropLabz');
