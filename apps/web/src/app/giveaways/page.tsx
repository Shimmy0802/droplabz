export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { db } from '@/lib/db';

interface GiveawayItem {
    id: string;
    title: string;
    description: string | null;
    endAt: Date;
    community: {
        name: string;
        slug: string;
        icon: string | null;
    };
}

async function getActiveGiveaways(): Promise<GiveawayItem[]> {
    try {
        return await db.event.findMany({
            where: {
                type: 'GIVEAWAY',
                status: 'ACTIVE',
                endAt: { gte: new Date() },
                community: { isListed: true },
            },
            orderBy: { endAt: 'asc' },
            take: 12,
            include: {
                community: {
                    select: {
                        name: true,
                        slug: true,
                        icon: true,
                    },
                },
            },
        });
    } catch (error) {
        console.error('Error fetching giveaways:', error);
        return [];
    }
}

function formatDate(date: Date) {
    return new Date(date).toLocaleDateString();
}

export default async function GiveawaysPage() {
    const giveaways = await getActiveGiveaways();

    return (
        <div className="min-h-full px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-[1400px] mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Giveaways</h1>
                    <p className="text-sm text-gray-400 mt-1">Active community giveaways that are open for entries.</p>
                </div>

                {giveaways.length === 0 ? (
                    <div className="bg-[#111528] border border-[rgba(0,255,65,0.15)] rounded p-6 text-sm text-gray-400">
                        No active giveaways right now.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {giveaways.map(giveaway => (
                            <Link
                                key={giveaway.id}
                                href={`/giveaways/${giveaway.id}`}
                                className="bg-[#111528] border border-[rgba(0,255,65,0.15)] rounded-lg p-4 hover:border-[rgba(0,255,65,0.4)] transition"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded bg-gradient-to-br from-[#00ff41] to-[#00d4ff] flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0">
                                        {giveaway.community.icon ? (
                                            <img src={giveaway.community.icon} alt="" className="w-full h-full" />
                                        ) : (
                                            giveaway.community.name[0]
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">{giveaway.title}</p>
                                        <p className="text-xs text-gray-400 mt-1">{giveaway.community.name}</p>
                                    </div>
                                </div>
                                <div className="mt-4 text-xs text-[#00ff41] font-semibold">
                                    Ends {formatDate(giveaway.endAt)}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
