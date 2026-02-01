import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

const data = new SlashCommandBuilder()
    .setName('droplabz')
    .setDescription('DropLabz community operations commands')
    .addSubcommand(sub => sub.setName('setup').setDescription('Configure DropLabz for this guild'))
    .addSubcommand(sub =>
        sub
            .setName('post')
            .setDescription('Post an event to Discord')
            .addStringOption(opt => opt.setName('event_id').setDescription('The event ID to post').setRequired(true)),
    )
    .addSubcommand(sub =>
        sub
            .setName('close')
            .setDescription('Close an event and refresh verification')
            .addStringOption(opt => opt.setName('event_id').setDescription('The event ID to close').setRequired(true)),
    );

export { data };

/**
 * Setup: Register guild in database, configure Solana program mapping
 */
export async function setupCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    // TODO: Implement guild registration
    await interaction.reply({
        content: '✅ Guild setup started. Visit the admin dashboard to complete configuration.',
        ephemeral: true,
    });
}

/**
 * Post: Create embed with event details and link to event page
 */
export async function postCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    const eventId = interaction.options.getString('event_id');

    // TODO: Fetch event from API, validate ownership, post embed
    await interaction.reply({
        content: `📢 Event ${eventId} posted!`,
        ephemeral: true,
    });
}

/**
 * Close: Mark event as closed, trigger verification refresh
 */
export async function closeCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    const eventId = interaction.options.getString('event_id');

    // TODO: Update event status, queue verification job
    await interaction.reply({
        content: `🔐 Event ${eventId} closed. Verifying entries...`,
        ephemeral: true,
    });
}
