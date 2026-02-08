const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateCommunityGuildId() {
    try {
        // Find the DropLabz community
        const community = await prisma.community.findFirst({
            where: {
                slug: 'droplabz',
            },
        });

        if (!community) {
            console.error('❌ Community "droplabz" not found');
            process.exit(1);
        }

        console.log(`\nFound community: ${community.name} (ID: ${community.id})`);
        console.log(`Current guildId: ${community.guildId || 'NULL'}`);

        // Update with the correct guild ID
        const GUILD_ID = '1256434168188108850';
        const updated = await prisma.community.update({
            where: { id: community.id },
            data: { guildId: GUILD_ID },
        });

        console.log(`✅ Updated guildId to: ${updated.guildId}`);
        console.log('\nThe community can now fetch Discord roles for requirement validation!');
    } catch (err) {
        console.error('❌ Error:', err instanceof Error ? err.message : err);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

updateCommunityGuildId();
