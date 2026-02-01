import { GiveawayEntryPage } from '@/components/giveaways/GiveawayEntryPage';

export default async function GiveawayPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return <GiveawayEntryPage eventId={id} />;
}
