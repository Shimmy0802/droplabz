import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { ChannelType, Client, GatewayIntentBits } from 'discord.js';
import express, { type Request, type Response } from 'express';
import { announceEvent, type AnnouncementData } from './handlers/announce.js';
import { verifyServerSetup } from './handlers/verify-setup.js';
import { setupCommand } from './commands/setup.js';
import { postCommand } from './commands/post.js';
import { closeCommand } from './commands/close.js';

// Load .env from workspace root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../../../.env.local') });
config({ path: resolve(__dirname, '../../../.env') });

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

// Create Express app for HTTP requests
const app = express();
app.use(express.json());

client.on('clientReady', () => {
    console.log(`✅ Bot logged in as ${client.user?.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    try {
        if (interaction.commandName === 'droplabz') {
            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'setup':
                    await setupCommand(interaction);
                    break;
                case 'post':
                    await postCommand(interaction);
                    break;
                case 'close':
                    await closeCommand(interaction);
                    break;
                default:
                    await interaction.reply('Unknown subcommand');
            }
        }
    } catch (error) {
        console.error('Error handling interaction:', error);
        await interaction.reply({
            content: 'An error occurred processing your command.',
            ephemeral: true,
        });
    }
});

/**
 * HTTP endpoint for announcing events
 * Called by the web API to post embeds via the Discord bot
 */
app.post('/announce', async (req: Request, res: Response) => {
    try {
        console.log('[Bot API] POST /announce received');
        const { guildId, channelId, embed, content, mentionRoleIds } = req.body;

        // Validate inputs
        if (!guildId || !channelId || !embed) {
            console.error('[Bot API] Missing required fields:', { guildId, channelId, embed: !!embed });
            return res.status(400).json({ error: 'Missing guildId, channelId, or embed' });
        }

        console.log('[Bot API] Announcing to guild:', {
            guildId,
            channelId,
            title: embed.title,
            hasContent: !!content,
        });

        // Post to Discord
        const result = await announceEvent(client, guildId, channelId, embed as AnnouncementData, {
            content,
            mentionRoleIds,
        });

        console.log('[Bot API] Announcement posted successfully:', result);
        res.json({
            success: true,
            messageId: result.messageId,
            url: result.url,
        });
    } catch (error) {
        console.error('[Bot API] Error posting announcement:', error);
        res.status(500).json({
            error: 'Failed to post announcement',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * HTTP endpoint for creating DropLabz category and channels
 */
app.post('/setup-channels', async (req: Request, res: Response) => {
    try {
        console.log('[Bot API] POST /setup-channels received');
        const { guildId } = req.body;

        if (!guildId) {
            return res.status(400).json({ error: 'Missing guildId' });
        }

        const guild = await client.guilds.fetch(guildId);
        await guild.channels.fetch();

        const categoryName = 'DropLabz';
        let category = guild.channels.cache.find(
            channel => channel.type === ChannelType.GuildCategory && channel.name === categoryName,
        );

        if (!category) {
            category = await guild.channels.create({
                name: categoryName,
                type: ChannelType.GuildCategory,
            });
        }

        if (!category?.id) {
            return res.status(500).json({ error: 'Failed to create or locate category' });
        }

        const desiredChannels = [
            { key: 'announcements', name: 'announcements' },
            { key: 'giveaways', name: 'giveaways' },
            { key: 'giveaway-entries', name: 'giveaway-entries' },
            { key: 'winners', name: 'winners' },
            { key: 'admin', name: 'droplabz-admin' },
        ];

        const createdChannels: Array<{ id: string; name: string; key: string }> = [];

        for (const channelDef of desiredChannels) {
            // Look for existing channel ONLY in the category
            const existing = guild.channels.cache.find(
                channel =>
                    channel.type === ChannelType.GuildText &&
                    channel.name === channelDef.name &&
                    channel.parentId === category.id,
            );

            if (existing && existing.type === ChannelType.GuildText) {
                createdChannels.push({ id: existing.id, name: existing.name, key: channelDef.key });
                continue;
            }

            // Create channel in category
            const created = await guild.channels.create({
                name: channelDef.name,
                type: ChannelType.GuildText,
                parent: category.id,
            });

            createdChannels.push({ id: created.id, name: created.name, key: channelDef.key });
        }

        res.json({
            success: true,
            category: {
                id: category?.id,
                name: category?.name,
            },
            channels: createdChannels,
        });
    } catch (error) {
        console.error('[Bot API] Error setting up channels:', error);
        res.status(500).json({
            error: 'Failed to setup channels',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * HTTP endpoint for checking bot permissions on a category
 * Now includes role hierarchy information
 */
app.post('/check-channel-permissions', async (req: Request, res: Response) => {
    try {
        console.log('[Bot API] POST /check-channel-permissions received');
        const { guildId, categoryId, roleIds } = req.body;

        if (!guildId || !categoryId) {
            return res.status(400).json({ error: 'Missing guildId or categoryId' });
        }

        const guild = await client.guilds.fetch(guildId);
        const category = await guild.channels.fetch(categoryId);

        if (!category || category.type !== ChannelType.GuildCategory) {
            return res.status(404).json({ error: 'Category not found' });
        }

        const botMember = await guild.members.fetchMe();
        const permissions = 'permissionsFor' in category ? category.permissionsFor(botMember) : null;
        const hasManageChannels = !!permissions?.has('ManageChannels');

        // Also check role hierarchy if roleIds provided
        const botHighestRole = botMember.roles.highest;
        const roleHierarchy: {
            botRole: { name: string; position: number };
            targetRoles: Array<{ roleId: string; roleName: string; position: number; canModify: boolean }>;
            hierarchyOk: boolean;
        } | null =
            roleIds && Array.isArray(roleIds)
                ? {
                      botRole: {
                          name: botHighestRole.name,
                          position: botHighestRole.position,
                      },
                      targetRoles: [],
                      hierarchyOk: true,
                  }
                : null;

        if (roleHierarchy && roleIds) {
            for (const roleId of roleIds) {
                const role = await guild.roles.fetch(roleId);
                if (role) {
                    const canModify = role.position < botHighestRole.position;
                    roleHierarchy.targetRoles.push({
                        roleId: role.id,
                        roleName: role.name,
                        position: role.position,
                        canModify,
                    });
                    if (!canModify) {
                        roleHierarchy.hierarchyOk = false;
                    }
                }
            }
        }

        return res.json({
            success: true,
            hasManageChannels,
            roleHierarchy,
            message: hasManageChannels
                ? roleHierarchy && !roleHierarchy.hierarchyOk
                    ? `Bot has Manage Channels permission, but role hierarchy issue detected. Bot's role must be positioned HIGHER than: ${roleHierarchy.targetRoles
                          .filter(r => !r.canModify)
                          .map(r => r.roleName)
                          .join(', ')}`
                    : 'Bot has Manage Channels permission and all role hierarchy checks passed.'
                : 'Bot lacks Manage Channels permission in this category.',
        });
    } catch (error) {
        console.error('[Bot API] Error checking channel permissions:', error);
        res.status(500).json({
            error: 'Failed to check channel permissions',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * HTTP endpoint for complete Discord server setup verification
 * Verifies: bot presence, category, channels, permissions, bot capabilities
 */
app.post('/verify-server-setup', async (req: Request, res: Response) => {
    try {
        console.log('[Bot API] POST /verify-server-setup received');
        const { guildId } = req.body;

        if (!guildId) {
            return res.status(400).json({ error: 'Missing guildId' });
        }

        const verification = await verifyServerSetup(client, guildId);

        return res.json(verification);
    } catch (error) {
        console.error('[Bot API] Error verifying server setup:', error);
        res.status(500).json({
            error: 'Failed to verify setup',
            message: error instanceof Error ? error.message : 'Unknown error',
            isValid: false,
            botInGuild: false,
            categoryExists: false,
            channelsStatus: [],
            botCanManageChannels: false,
            issues: [error instanceof Error ? error.message : 'Unknown error'],
            recommendations: ['Ensure bot is in the guild and has necessary permissions'],
        });
    }
});

// Start HTTP server on port 3001 (accept connections from any network interface)
const PORT = 3001;
const HOST = '0.0.0.0'; // Listen on all interfaces for external access
app.listen(PORT, HOST, () => {
    console.log(`[Bot API] HTTP server listening on http://0.0.0.0:${PORT}`);
});

client.login(process.env.DISCORD_BOT_TOKEN);
