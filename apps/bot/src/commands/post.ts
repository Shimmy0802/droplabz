import { ChatInputCommandInteraction } from 'discord.js';

export async function postCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    const eventId = interaction.options.getString('event_id');

    // TODO: Fetch event from API
    // TODO: Validate guild ownership
    // TODO: Create embed with event details
    // TODO: Post to configured channel

    await interaction.reply({
        content: `📢 Event ${eventId} posted to Discord!`,
        ephemeral: true,
    });
}
