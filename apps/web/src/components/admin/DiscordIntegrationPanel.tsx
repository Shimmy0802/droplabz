import type { Community, DiscordChannel, DiscordGuild } from '@/hooks/useAdminPageState';

interface DiscordIntegrationPanelProps {
    community: Community;
    discordGuilds: DiscordGuild[];
    discordChannels: DiscordChannel[];
    showGuildSelector: boolean;
    showChannelSelector: boolean;
    isLoadingGuilds: boolean;
    isLoadingChannels: boolean;
    isLinkingGuild: boolean;
    isSelectingChannel: boolean;
    onFetchGuilds: () => void;
    onLinkGuild: (guildId: string) => void;
    onUnlinkGuild: () => void;
    onFetchChannels: () => void;
    onSelectChannel: (channelId: string) => void;
    onCloseGuildSelector: () => void;
    onCloseChannelSelector: () => void;
}

export function DiscordIntegrationPanel({
    community,
    discordGuilds,
    discordChannels,
    showGuildSelector,
    showChannelSelector,
    isLoadingGuilds,
    isLoadingChannels,
    isLinkingGuild,
    isSelectingChannel,
    onFetchGuilds,
    onLinkGuild,
    onUnlinkGuild,
    onFetchChannels,
    onSelectChannel,
    onCloseGuildSelector,
    onCloseChannelSelector,
}: DiscordIntegrationPanelProps) {
    return (
        <div>
            <label className="block text-xs font-medium text-gray-300 mb-2">Discord Server</label>
            <div className="p-4 border border-gray-700 rounded-lg bg-gray-900/40 space-y-4">
                {community.guildId ? (
                    <div className="space-y-4">
                        <div>
                            <p className="text-[#00ff41] font-semibold text-sm">✓ Connected</p>
                            <p className="text-gray-300 text-sm font-medium mt-2">
                                {community.discordGuildName ? (
                                    <>
                                        {community.discordGuildName} • {community.guildId}
                                    </>
                                ) : (
                                    <>Guild ID: {community.guildId}</>
                                )}
                            </p>
                        </div>

                        {/* Announcement Channel Selection */}
                        <div className="pt-3 border-t border-gray-700">
                            <p className="text-gray-300 font-medium text-xs mb-3">Announcement Channel</p>
                            {community.discordAnnouncementChannelId ? (
                                <div className="bg-gray-800 p-3 rounded border border-gray-700">
                                    <p className="text-[#00d4ff] text-xs">✓ Channel Selected</p>
                                    <p className="text-gray-300 text-sm font-medium mt-2">
                                        {community.discordAnnouncementChannelName ? (
                                            <>
                                                #{community.discordAnnouncementChannelName} •{' '}
                                                {community.discordAnnouncementChannelId}
                                            </>
                                        ) : (
                                            <>Channel ID: {community.discordAnnouncementChannelId}</>
                                        )}
                                    </p>
                                    <button
                                        onClick={onFetchChannels}
                                        disabled={isLoadingChannels}
                                        className="mt-2 px-3 py-2 bg-[#00d4ff] text-black rounded-lg hover:bg-[#0099cc] disabled:opacity-50 transition text-xs font-medium"
                                    >
                                        {isLoadingChannels ? 'Loading...' : 'Change Channel'}
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-gray-400 text-xs mb-3">
                                        Select a channel for bot announcements (whitelists, presales, winners).
                                    </p>
                                    <button
                                        onClick={onFetchChannels}
                                        disabled={isLoadingChannels}
                                        className="px-3 py-2 bg-[#00d4ff] text-black rounded-lg hover:bg-[#0099cc] disabled:opacity-50 transition text-xs font-medium"
                                    >
                                        {isLoadingChannels ? 'Loading...' : 'Select Channel'}
                                    </button>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={onUnlinkGuild}
                            disabled={isLinkingGuild}
                            className="px-3 py-1.5 bg-red-900/30 border border-red-700 text-red-400 rounded-lg hover:bg-red-900/50 transition text-[10px] disabled:opacity-50 font-medium"
                        >
                            {isLinkingGuild ? 'Disconnecting...' : 'Disconnect Server'}
                        </button>
                    </div>
                ) : (
                    <div>
                        <p className="text-gray-400 text-xs mb-3">
                            No Discord server connected. Link a Discord server to enable bot features.
                        </p>
                        <button
                            onClick={onFetchGuilds}
                            disabled={isLoadingGuilds}
                            className="px-3 py-2 bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] transition font-semibold disabled:opacity-50 text-xs"
                        >
                            {isLoadingGuilds ? 'Loading...' : 'Connect Discord'}
                        </button>
                    </div>
                )}
            </div>

            {/* Guild Selector Modal */}
            {showGuildSelector && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-md w-full p-6 space-y-4">
                        <h3 className="text-xl font-bold text-white">Select Discord Server</h3>
                        <p className="text-gray-400 text-sm">
                            Choose a server you own or admin to connect with your community.
                        </p>

                        {discordGuilds.length === 0 ? (
                            <p className="text-gray-400 text-sm py-8 text-center">
                                No servers available. You must own or admin a Discord server.
                            </p>
                        ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {discordGuilds.map(guild => (
                                    <button
                                        key={guild.id}
                                        onClick={() => onLinkGuild(guild.id)}
                                        disabled={isLinkingGuild}
                                        className="w-full p-3 text-left bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition disabled:opacity-50 flex items-center gap-3"
                                    >
                                        {guild.icon && (
                                            <img
                                                src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                                                alt={guild.name}
                                                className="w-8 h-8 rounded-full"
                                            />
                                        )}
                                        <div>
                                            <p className="text-white font-medium">{guild.name}</p>
                                            <p className="text-gray-400 text-xs">{guild.owner ? 'Owner' : 'Admin'}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={onCloseGuildSelector}
                            className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Channel Selector Modal */}
            {showChannelSelector && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-md w-full p-6 space-y-4">
                        <h3 className="text-xl font-bold text-white">Select Announcement Channel</h3>
                        <p className="text-gray-400 text-sm">
                            Choose a text channel for bot announcements (whitelists, presales, winners).
                        </p>

                        {discordChannels.length === 0 ? (
                            <p className="text-gray-400 text-sm py-8 text-center">
                                No text channels available in this server.
                            </p>
                        ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {discordChannels.map(channel => (
                                    <button
                                        key={channel.id}
                                        onClick={() => onSelectChannel(channel.id)}
                                        disabled={isSelectingChannel}
                                        className="w-full p-3 text-left bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition disabled:opacity-50 flex items-center gap-3"
                                    >
                                        <span className="text-[#00d4ff] font-bold">#</span>
                                        <p className="text-white font-medium">{channel.name}</p>
                                    </button>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={onCloseChannelSelector}
                            className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
