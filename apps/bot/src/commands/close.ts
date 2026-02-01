import { ChatInputCommandInteraction } from 'discord.js';

export async function closeCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    const eventId = interaction.options.getString('event_id');

    // TODO: Mark event as CLOSED in database
    // TODO: Queue async verification job
    // TODO: Notify admins of completion

    await interaction.reply({
        content: `🔐 Event ${eventId} closed. Verification in progress...`,
        ephemeral: true,
    });
}
