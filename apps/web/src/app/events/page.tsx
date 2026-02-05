export const dynamic = 'force-dynamic';

import Link from 'next/link';

interface EventItem {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    endAt: string;
    validEntries: number;
    community: {
        name: string;
        slug: string;
        icon: string | null;
    };
}

interface HomepageData {
    upcomingMints: EventItem[];
    presales: EventItem[];
    endingSoon: Array<EventItem & { type?: string }>;
}

async function getHomepageData(): Promise<HomepageData> {
    try {
        const response = await fetch(`${process.env.NEXTAUTH_URL}/api/homepage`, {
            cache: 'no-store',
        });

        if (!response.ok) {
            return { upcomingMints: [], presales: [], endingSoon: [] };
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching events:', error);
        return { upcomingMints: [], presales: [], endingSoon: [] };
    }
}

function formatDate(date: string) {
    return new Date(date).toLocaleDateString();
}

export default async function EventsPage() {
    const { upcomingMints, presales, endingSoon } = await getHomepageData();

    return (
        <div className="min-h-full px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-[1400px] mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Events</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Active whitelists, presales, and time-sensitive opportunities.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <section>
                        <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#00ff41]" />
                            Whitelists
                        </h2>
                        <div className="space-y-2">
                            {upcomingMints.length === 0 && (
                                <div className="bg-[#111528] border border-[rgba(0,255,65,0.15)] rounded p-4 text-xs text-gray-400">
                                    No active whitelists right now.
                                </div>
                            )}
                            {upcomingMints.map(event => (
                                <Link
                                    key={event.id}
                                    href={`/events/${event.community.slug}/${event.id}`}
                                    className="block p-3 bg-[#111528] border border-[rgba(0,255,65,0.15)] rounded hover:border-[rgba(0,255,65,0.4)] transition"
                                >
                                    <p className="text-xs font-semibold text-white truncate">{event.title}</p>
                                    <p className="text-[10px] text-gray-400 mt-1">{event.community.name}</p>
                                    <p className="text-[10px] text-[#00ff41] font-bold mt-1">
                                        {event.validEntries} entries
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#00d4ff]" />
                            Presales
                        </h2>
                        <div className="space-y-2">
                            {presales.length === 0 && (
                                <div className="bg-[#111528] border border-[rgba(0,212,255,0.15)] rounded p-4 text-xs text-gray-400">
                                    No active presales right now.
                                </div>
                            )}
                            {presales.map(event => (
                                <Link
                                    key={event.id}
                                    href={`/events/${event.community.slug}/${event.id}`}
                                    className="block p-3 bg-[#111528] border border-[rgba(0,212,255,0.15)] rounded hover:border-[rgba(0,212,255,0.4)] transition"
                                >
                                    <p className="text-xs font-semibold text-white truncate">{event.title}</p>
                                    <p className="text-[10px] text-gray-400 mt-1">{event.community.name}</p>
                                    <p className="text-[10px] text-[#00d4ff] font-bold mt-1">
                                        {event.validEntries} allocated
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-400" />
                            Ending Soon
                        </h2>
                        <div className="space-y-2">
                            {endingSoon.length === 0 && (
                                <div className="bg-[#111528] border border-orange-500/20 rounded p-4 text-xs text-gray-400">
                                    No events ending soon.
                                </div>
                            )}
                            {endingSoon.map(event => {
                                const href =
                                    event.type === 'GIVEAWAY'
                                        ? `/giveaways/${event.id}`
                                        : `/events/${event.community.slug}/${event.id}`;

                                return (
                                    <Link
                                        key={event.id}
                                        href={href}
                                        className="block p-3 bg-[#111528] border border-orange-500/20 rounded hover:border-orange-500/40 transition"
                                    >
                                        <p className="text-xs font-semibold text-white truncate">{event.title}</p>
                                        <p className="text-[10px] text-gray-400 mt-1">{event.community.name}</p>
                                        <p className="text-[10px] text-orange-400 font-bold mt-1">
                                            Ends {formatDate(event.endAt)}
                                        </p>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
