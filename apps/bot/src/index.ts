import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Client, GatewayIntentBits } from 'discord.js';
import express, { type Request, type Response } from 'express';
import { announceEvent, type AnnouncementData } from './handlers/announce.js';
import { setupCommand } from './commands/setup.js';
import { postCommand } from './commands/post.js';
import { closeCommand } from './commands/close.js';

// Load .env from workspace root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
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
        const { guildId, channelId, embed } = req.body;

        // Validate inputs
        if (!guildId || !channelId || !embed) {
            console.error('[Bot API] Missing required fields:', { guildId, channelId, embed: !!embed });
            return res.status(400).json({ error: 'Missing guildId, channelId, or embed' });
        }

        console.log('[Bot API] Announcing to guild:', { guildId, channelId, title: embed.title });

        // Post to Discord
        const result = await announceEvent(client, guildId, channelId, embed as AnnouncementData);

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

// Start HTTP server on port 3001 (internal communication)
const PORT = 3001;
app.listen(PORT, '127.0.0.1', () => {
    console.log(`[Bot API] HTTP server listening on http://127.0.0.1:${PORT}`);
});

client.login(process.env.DISCORD_BOT_TOKEN);
