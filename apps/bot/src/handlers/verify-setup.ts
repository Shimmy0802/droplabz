import { Client, ChannelType } from 'discord.js';

export interface SetupVerification {
    isValid: boolean;
    botInGuild: boolean;
    categoryExists: boolean;
    channelsStatus: Array<{
        name: string;
        exists: boolean;
        inCategory: boolean;
        hasPermissions: boolean;
        botCanManage: boolean;
    }>;
    botCanManageChannels: boolean;
    issues: string[];
    recommendations: string[];
}

/**
 * Verify complete Discord server setup for DropLabz
 * Checks: bot presence, category, channels, permissions, bot capabilities
 */
export async function verifyServerSetup(client: Client, guildId: string): Promise<SetupVerification> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    let botInGuild = false;
    let categoryExists = false;
    let botCanManageChannels = false;
    const categoryName = 'DropLabz';
    const desiredChannels = [
        { key: 'announcements', name: 'announcements' },
        { key: 'giveaways', name: 'giveaways' },
        { key: 'giveaway-entries', name: 'giveaway-entries' },
        { key: 'winners', name: 'winners' },
        { key: 'admin', name: 'droplabz-admin' },
    ];

    try {
        const guild = await client.guilds.fetch(guildId);
        botInGuild = true;
        await guild.channels.fetch();

        const botMember = await guild.members.fetchMe();
        const category = guild.channels.cache.find(
            c => c.type === ChannelType.GuildCategory && c.name === categoryName,
        );

        if (!category) {
            categoryExists = false;
            issues.push('DropLabz category not found');
            recommendations.push('Run the "Create Channels" button to create the DropLabz category');
        } else {
            categoryExists = true;

            // Check if bot can manage the category
            const categoryPerms = 'permissionsFor' in category ? category.permissionsFor(botMember) : null;
            if (categoryPerms?.has('ManageChannels')) {
                botCanManageChannels = true;
            } else {
                botCanManageChannels = false;
                issues.push('Bot lacks "Manage Channels" permission on DropLabz category');
                recommendations.push('In Discord → Server Settings → Roles → @DropLabz Bot → Enable "Manage Channels"');
            }
        }

        // Check each channel
        const channelsStatus = desiredChannels.map(channelDef => {
            const channel = guild.channels.cache.find(
                c => c.type === ChannelType.GuildText && c.name === channelDef.name,
            );

            const status = {
                name: channelDef.name,
                exists: !!channel,
                inCategory: category ? channel?.parentId === category.id : false,
                hasPermissions: false,
                botCanManage: false,
            };

            if (!channel) {
                issues.push(`Channel #${channelDef.name} does not exist`);
            } else if (!status.inCategory && category) {
                issues.push(`Channel #${channelDef.name} is not in DropLabz category`);
                recommendations.push(`Move #${channelDef.name} into the DropLabz category`);
            }

            // Check if bot can manage this channel
            if (channel && 'permissionsFor' in channel) {
                const channelPerms = channel.permissionsFor(botMember);
                status.botCanManage = !!channelPerms?.has('ManageChannels');

                if (!status.botCanManage && status.inCategory) {
                    issues.push(`Bot cannot manage #${channelDef.name}`);
                }
            }

            // Check if permissions are applied (simplified - just check if not @everyone)
            if (channel && 'permissionOverwrites' in channel && category) {
                const perms = channel.permissionOverwrites.cache;
                const everyoneOverwrite = perms.find(p => p.id === guild.id);
                const hasRoleOverwrite = perms.some(p => p.id !== guild.id);

                // Permissions are good if @everyone is denied and at least one role is allowed
                status.hasPermissions = !!everyoneOverwrite && hasRoleOverwrite;

                if (!status.hasPermissions) {
                    issues.push(`Channel #${channelDef.name} does not have role-based permissions`);
                }
            }

            return status;
        });

        const allChannelsExist = channelsStatus.every(c => c.exists);
        const allChannelsInCategory = channelsStatus.every(c => c.inCategory);
        const allChannelsHavePermissions = channelsStatus.every(c => c.hasPermissions);

        if (!allChannelsExist) {
            recommendations.push('Run the "Create Channels" button to create missing channels');
        }

        if (allChannelsExist && !allChannelsInCategory && categoryExists) {
            recommendations.push('All channels must be in the DropLabz category before applying permissions');
        }

        if (allChannelsInCategory && !allChannelsHavePermissions && botCanManageChannels) {
            recommendations.push('Run "Apply Role-Based Gating" to set up channel permissions');
        }

        const isValid =
            botInGuild &&
            categoryExists &&
            allChannelsExist &&
            allChannelsInCategory &&
            allChannelsHavePermissions &&
            botCanManageChannels;

        return {
            isValid,
            botInGuild,
            categoryExists,
            channelsStatus,
            botCanManageChannels,
            issues,
            recommendations,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (!botInGuild) {
            issues.push('Bot is not in this guild');
            recommendations.push('Click "Add DropLabz Bot to Discord" to invite the bot');
        } else {
            issues.push(`Error verifying setup: ${errorMessage}`);
        }

        return {
            isValid: false,
            botInGuild,
            categoryExists,
            channelsStatus: desiredChannels.map(c => ({
                name: c.name,
                exists: false,
                inCategory: false,
                hasPermissions: false,
                botCanManage: false,
            })),
            botCanManageChannels,
            issues,
            recommendations,
        };
    }
}
