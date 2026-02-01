/**
 * Discord verification utilities
 * Checks user guild membership, roles, and account age
 */

export interface DiscordGuild {
    id: string;
    name: string;
    owner: boolean;
    permissions: number;
    features: string[];
}

export interface DiscordMember {
    user: { id: string; username: string };
    roles: string[]; // Array of role IDs
    joined_at: string;
}

/**
 * Get user's Discord guilds
 * Requires OAuth access token
 */
export async function getUserGuilds(accessToken: string): Promise<DiscordGuild[]> {
    try {
        const response = await fetch('https://discord.com/api/v10/users/@me/guilds', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            console.error('Failed to fetch Discord guilds:', response.statusText);
            return [];
        }

        return response.json();
    } catch (error) {
        console.error('Error fetching Discord guilds:', error);
        return [];
    }
}

/**
 * Check if user is in a specific Discord guild
 */
export async function isUserInGuild(accessToken: string, guildId: string): Promise<boolean> {
    const guilds = await getUserGuilds(accessToken);
    return guilds.some(g => g.id === guildId);
}

/**
 * Get user's roles in a specific guild
 * Requires bot token with MANAGE_GUILD permission
 */
export async function getUserRolesInGuild(botToken: string, guildId: string, userId: string): Promise<string[]> {
    try {
        const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}`, {
            headers: {
                Authorization: `Bot ${botToken}`,
            },
        });

        if (!response.ok) {
            console.error('Failed to fetch user member info:', response.statusText);
            return [];
        }

        const member = (await response.json()) as DiscordMember;
        return member.roles;
    } catch (error) {
        console.error('Error fetching user roles in guild:', error);
        return [];
    }
}

/**
 * Check if user has required roles in guild
 */
export async function userHasRequiredRoles(
    botToken: string,
    guildId: string,
    userId: string,
    requiredRoleIds: string[],
): Promise<boolean> {
    if (requiredRoleIds.length === 0) return true; // No role requirement

    const userRoles = await getUserRolesInGuild(botToken, guildId, userId);
    return requiredRoleIds.some(roleId => userRoles.includes(roleId));
}

/**
 * Check user's Discord account age (in days)
 * Discord ID contains timestamp info
 */
export function getDiscordAccountAge(discordId: string): number {
    try {
        // Discord snowflake: timestamp (42 bits) + worker (5 bits) + process (5 bits) + increment (12 bits)
        const timestamp = BigInt(discordId) >> 22n;
        const createdAt = new Date(Number(timestamp) + 1420070400000); // Discord epoch is 2015-01-01
        const now = new Date();
        const ageMs = now.getTime() - createdAt.getTime();
        return Math.floor(ageMs / (1000 * 60 * 60 * 24)); // Convert to days
    } catch (error) {
        console.error('Error calculating Discord account age:', error);
        return 0;
    }
}

/**
 * Check user's server join age (in days)
 * Requires joining the guild
 */
export async function getServerJoinAge(botToken: string, guildId: string, userId: string): Promise<number> {
    try {
        const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}`, {
            headers: {
                Authorization: `Bot ${botToken}`,
            },
        });

        if (!response.ok) {
            console.error('Failed to fetch server join age:', response.statusText);
            return 0;
        }

        const member = (await response.json()) as DiscordMember;
        const joinedAt = new Date(member.joined_at);
        const now = new Date();
        const ageMs = now.getTime() - joinedAt.getTime();
        return Math.floor(ageMs / (1000 * 60 * 60 * 24)); // Convert to days
    } catch (error) {
        console.error('Error getting server join age:', error);
        return 0;
    }
}

/**
 * Verify all Discord requirements for an entry
 */
export async function verifyDiscordRequirements(
    guildId: string,
    userId: string,
    discordId: string,
    accessToken: string,
    botToken: string,
    requirements: {
        minAccountAgeDays?: number;
        minServerJoinAgeDays?: number;
        requiredRoleIds?: string[];
    },
): Promise<{ valid: boolean; reason?: string }> {
    // Check guild membership
    const inGuild = await isUserInGuild(accessToken, guildId);
    if (!inGuild) {
        return { valid: false, reason: 'Not a member of the required Discord server' };
    }

    // Check account age
    if (requirements.minAccountAgeDays) {
        const accountAge = getDiscordAccountAge(discordId);
        if (accountAge < requirements.minAccountAgeDays) {
            return {
                valid: false,
                reason: `Discord account must be at least ${requirements.minAccountAgeDays} days old (current: ${accountAge} days)`,
            };
        }
    }

    // Check server join age
    if (requirements.minServerJoinAgeDays) {
        const joinAge = await getServerJoinAge(botToken, guildId, userId);
        if (joinAge < requirements.minServerJoinAgeDays) {
            return {
                valid: false,
                reason: `Must be in server for at least ${requirements.minServerJoinAgeDays} days (current: ${joinAge} days)`,
            };
        }
    }

    // Check required roles
    if (requirements.requiredRoleIds && requirements.requiredRoleIds.length > 0) {
        const hasRoles = await userHasRequiredRoles(botToken, guildId, userId, requirements.requiredRoleIds);
        if (!hasRoles) {
            return { valid: false, reason: 'Missing required Discord roles' };
        }
    }

    return { valid: true };
}
