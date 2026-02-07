/**
 * Helper utilities to resolve Discord role names from IDs
 */

/**
 * Fetch Discord role name by guild and role ID using bot token
 */
export async function getDiscordRoleName(guildId: string, roleId: string, botToken: string): Promise<string | null> {
    try {
        const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
            headers: {
                Authorization: `Bot ${botToken}`,
            },
        });

        if (!response.ok) {
            console.warn(
                `[Discord API] Failed to fetch roles for guild ${guildId}: ${response.status} ${response.statusText}`,
            );
            return null;
        }

        const roles = await response.json();
        const role = roles.find((r: any) => r.id === roleId);
        return role?.name || null;
    } catch (err) {
        console.error(`[Discord API] Error fetching roles:`, err);
        return null;
    }
}

/**
 * Resolve missing role names in event requirements
 * Updates requirement config with role names fetched from Discord
 */
export async function resolveMissingRoleNames(event: any, botToken: string): Promise<void> {
    if (!event.community?.guildId || !botToken) {
        console.debug(`[Role Resolver] Skipping: guildId=${event.community?.guildId}, hasToken=${!!botToken}`);
        return;
    }

    console.debug(`[Role Resolver] Starting for guildId: ${event.community.guildId}`);

    for (const req of event.requirements || []) {
        if (req.type === 'DISCORD_ROLE_REQUIRED' && req.config) {
            // If roleName is missing, try to fetch it
            if (!req.config.roleName && req.config.roleId) {
                console.debug(`[Role Resolver] Fetching role name for ${req.config.roleId}`);
                const roleName = await getDiscordRoleName(event.community.guildId, req.config.roleId, botToken);
                if (roleName) {
                    console.debug(`[Role Resolver] Found role name: ${roleName}`);
                    req.config.roleName = roleName;
                } else {
                    console.debug(`[Role Resolver] Could not resolve role: ${req.config.roleId}`);
                }
            }
        }
    }
}
