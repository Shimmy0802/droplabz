import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetUsers() {
    console.log('🗑️  Deleting all user data...');

    // Delete in order to respect foreign key constraints
    await prisma.winner.deleteMany({});
    console.log('✓ Deleted winners');

    await prisma.entry.deleteMany({});
    console.log('✓ Deleted entries');

    await prisma.requirement.deleteMany({});
    console.log('✓ Deleted requirements');

    await prisma.event.deleteMany({});
    console.log('✓ Deleted events');

    await prisma.review.deleteMany({});
    console.log('✓ Deleted reviews');

    await prisma.auditLog.deleteMany({});
    console.log('✓ Deleted audit logs');

    await prisma.subscription.deleteMany({});
    console.log('✓ Deleted subscriptions');

    await prisma.communityMember.deleteMany({});
    console.log('✓ Deleted community members');

    await prisma.community.deleteMany({});
    console.log('✓ Deleted communities');

    await prisma.userWallet.deleteMany({});
    console.log('✓ Deleted user wallets');

    await prisma.user.deleteMany({});
    console.log('✓ Deleted users');

    console.log('\n✅ Database reset complete. All user data cleared.');
}

resetUsers()
    .catch(e => {
        console.error('❌ Error resetting database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
