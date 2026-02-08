/**
 * Utility functions for safe fetch operations with proper error handling
 */

/**
 * Safely parse JSON from a fetch response
 * Falls back to empty object if parsing fails instead of swallowing the error
 *
 * @param response The fetch response object
 * @returns Parsed JSON object or null if parsing fails
 */
export async function safeParseJSON<T = Record<string, unknown>>(response: Response): Promise<T | null> {
    try {
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
            console.warn('Response is not JSON:', contentType);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error('Failed to parse JSON response:', error);
        return null;
    }
}

/**
 * Extract error data from a fetch response safely
 * Used to provide better error messages to users
 *
 * @param response The fetch response object
 * @returns Error data object or empty object if parsing fails
 */
export async function extractErrorData(response: Response): Promise<Record<string, unknown>> {
    const data = await safeParseJSON(response);
    return data || {};
}

/**
 * Verify a fetch response and throw an error if not ok
 *
 * @param response The fetch response object
 * @param errorMessage Custom error message to throw
 * @throws Error if response is not ok
 */
export async function assertResponseOk(response: Response, errorMessage?: string): Promise<void> {
    if (!response.ok) {
        const errorData = await extractErrorData(response);
        const message =
            errorMessage || (typeof errorData.message === 'string' ? errorData.message : 'Request failed');
        const error = new Error(message);
        (error as any).status = response.status;
        (error as any).data = errorData;
        throw error;
    }
}
