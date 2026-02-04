'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface DiscordPermissionsGuideProps {
    className?: string;
    expanded?: boolean;
}

export function DiscordPermissionsGuide({ className = '', expanded = false }: DiscordPermissionsGuideProps) {
    const [isExpanded, setIsExpanded] = useState(expanded);

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Main Guide Card */}
            <div className="rounded-lg border border-blue-600/40 bg-gradient-to-br from-blue-900/20 via-gray-800/40 to-gray-800/40 overflow-hidden">
                {/* Header */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-900/10 transition"
                >
                    <div className="flex items-center gap-3">
                        <div className="text-2xl">📋</div>
                        <div className="text-left">
                            <h3 className="font-bold text-white">Discord Channel Permissions Guide</h3>
                            <p className="text-xs text-gray-400">
                                Step-by-step instructions for manual permission setup
                            </p>
                        </div>
                    </div>
                    {isExpanded ? (
                        <ChevronUp className="text-gray-400" size={20} />
                    ) : (
                        <ChevronDown className="text-gray-400" size={20} />
                    )}
                </button>

                {/* Content */}
                {isExpanded && (
                    <div className="px-6 py-4 border-t border-blue-600/20 space-y-6">
                        {/* Overview */}
                        <div className="space-y-3">
                            <h4 className="font-bold text-white flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/30 text-xs text-blue-300">
                                    1
                                </span>
                                Overview
                            </h4>
                            <p className="text-sm text-gray-300 ml-8">
                                Discord permissions control who can see and interact with channels. DropLabz channels
                                are created in a category, which makes it easy to manage permissions for all channels at
                                once.
                            </p>
                            <div className="ml-8 p-3 rounded bg-blue-900/20 border border-blue-700/30 text-xs text-blue-200">
                                ✨ <strong>Pro Tip:</strong> You don't need to set individual channel
                                permissions—category permissions apply to all channels inside.
                            </div>
                        </div>

                        {/* Access Discord Settings */}
                        <div className="space-y-3">
                            <h4 className="font-bold text-white flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/30 text-xs text-green-300">
                                    2
                                </span>
                                Access Discord Server Settings
                            </h4>
                            <ol className="text-sm text-gray-300 ml-8 space-y-2 list-decimal list-inside">
                                <li>Open your Discord server</li>
                                <li>
                                    <strong>Click the server name</strong> at the top-left (with the dropdown arrow)
                                </li>
                                <li>
                                    Select <strong>"Server Settings"</strong> from the menu
                                </li>
                                <li>
                                    You should now be in the <strong>Overview</strong> tab
                                </li>
                            </ol>
                        </div>

                        {/* Navigate to Roles */}
                        <div className="space-y-3">
                            <h4 className="font-bold text-white flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/30 text-xs text-purple-300">
                                    3
                                </span>
                                Navigate to Roles (Optional but Recommended)
                            </h4>
                            <ol className="text-sm text-gray-300 ml-8 space-y-2 list-decimal list-inside">
                                <li>
                                    In Server Settings, find the <strong>Roles</strong> tab on the left sidebar
                                </li>
                                <li>
                                    You'll see all roles in your server, including the <strong>DropLabz Bot</strong>{' '}
                                    role
                                </li>
                                <li>
                                    Note the <strong>position</strong> of the DropLabz Bot role (shown by its position
                                    in the list)
                                </li>
                                <li>
                                    <strong>Important:</strong> The DropLabz Bot role must be positioned{' '}
                                    <strong>HIGHER</strong> than any roles you want it to assign
                                </li>
                            </ol>
                            <div className="ml-8 p-3 rounded bg-purple-900/20 border border-purple-700/30 text-xs text-purple-200">
                                ⚠️ <strong>Role Hierarchy:</strong> If DropLabz Bot tries to assign a role to a user, it
                                can only assign roles that are <strong>lower in the hierarchy</strong>. Drag the
                                DropLabz Bot role upward if needed.
                            </div>
                        </div>

                        {/* Edit Category Permissions */}
                        <div className="space-y-3">
                            <h4 className="font-bold text-white flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/30 text-xs text-cyan-300">
                                    4
                                </span>
                                Edit Category Permissions
                            </h4>
                            <ol className="text-sm text-gray-300 ml-8 space-y-2 list-decimal list-inside">
                                <li>Go back to your server's main channel list (left sidebar)</li>
                                <li>
                                    Find the <strong>DropLabz</strong> category
                                </li>
                                <li>
                                    <strong>Right-click the category</strong> (or click the three dots if on mobile)
                                </li>
                                <li>
                                    Select <strong>"Edit Category"</strong>
                                </li>
                                <li>
                                    Click the <strong>"Permissions"</strong> tab
                                </li>
                            </ol>
                        </div>

                        {/* Configure Role Permissions */}
                        <div className="space-y-3">
                            <h4 className="font-bold text-white flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500/30 text-xs text-yellow-300">
                                    5
                                </span>
                                Configure Role Permissions
                            </h4>
                            <p className="text-sm text-gray-300 ml-8">
                                In the Permissions tab, you'll see roles and what permissions they have:
                            </p>
                            <div className="ml-8 space-y-2 text-sm text-gray-300">
                                <div className="p-3 rounded bg-gray-800/50 border border-gray-700 space-y-2">
                                    <p className="font-semibold text-white">Default Setup (Recommended):</p>
                                    <ol className="list-decimal list-inside space-y-1 text-xs">
                                        <li>
                                            Find <strong>@everyone</strong> role
                                        </li>
                                        <li>
                                            Click it and set <strong>"View Channel"</strong> to{' '}
                                            <strong className="text-red-400">❌ Deny</strong>
                                        </li>
                                        <li>Now only members with other roles can see the category</li>
                                        <li>
                                            <strong>For each role that should access channels:</strong>
                                        </li>
                                        <li className="ml-4">
                                            Click the role → Set <strong>"View Channel"</strong> to{' '}
                                            <strong className="text-green-400">✅ Allow</strong>
                                        </li>
                                        <li className="ml-4">
                                            Set other permissions as needed (Send Messages, Embed Links, etc.)
                                        </li>
                                    </ol>
                                </div>
                            </div>
                            <div className="ml-8 p-3 rounded bg-yellow-900/20 border border-yellow-700/30 text-xs text-yellow-200">
                                💡 <strong>Common Permissions:</strong> View Channel (see it), Send Messages (post),
                                Embed Links (post embeds), Use Slash Commands (use bot commands)
                            </div>
                        </div>

                        {/* Save and Test */}
                        <div className="space-y-3">
                            <h4 className="font-bold text-white flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/30 text-xs text-green-300">
                                    6
                                </span>
                                Save and Test
                            </h4>
                            <ol className="text-sm text-gray-300 ml-8 space-y-2 list-decimal list-inside">
                                <li>Changes are saved automatically as you set permissions</li>
                                <li>Close the category settings dialog</li>
                                <li>Test by switching to a role that should see the channels</li>
                                <li>
                                    You can test permissions by going to <strong>Server Settings → Roles</strong> and
                                    clicking <strong>"View as Role"</strong> on any role
                                </li>
                            </ol>
                        </div>

                        {/* Example Scenarios */}
                        <div className="space-y-3 border-t border-blue-600/20 pt-4">
                            <h4 className="font-bold text-white">Example Scenarios</h4>

                            {/* Scenario 1 */}
                            <div className="ml-0 space-y-2">
                                <p className="text-sm font-semibold text-white flex items-center gap-2">
                                    <span className="text-lg">📌</span>
                                    Scenario 1: Whitelist-Only Channel
                                </p>
                                <div className="ml-6 text-xs text-gray-300 space-y-1 bg-gray-800/50 p-3 rounded border border-gray-700">
                                    <p>You want only whitelisted members to see the #announcements channel.</p>
                                    <ol className="list-decimal list-inside space-y-1">
                                        <li>
                                            Set @everyone → View Channel:{' '}
                                            <strong className="text-red-400">❌ Deny</strong>
                                        </li>
                                        <li>
                                            Set "Whitelisted" role → View Channel:{' '}
                                            <strong className="text-green-400">✅ Allow</strong>
                                        </li>
                                        <li>
                                            When members complete your whitelist, assign them the "Whitelisted" role
                                        </li>
                                        <li>They'll now see #announcements!</li>
                                    </ol>
                                </div>
                            </div>

                            {/* Scenario 2 */}
                            <div className="ml-0 space-y-2">
                                <p className="text-sm font-semibold text-white flex items-center gap-2">
                                    <span className="text-lg">📌</span>
                                    Scenario 2: Public Announcements, Private Entries
                                </p>
                                <div className="ml-6 text-xs text-gray-300 space-y-1 bg-gray-800/50 p-3 rounded border border-gray-700">
                                    <p>
                                        #announcements is public (everyone sees it), but #giveaway-entries is private
                                        (only authorized users).
                                    </p>
                                    <ol className="list-decimal list-inside space-y-1">
                                        <li>
                                            For #announcements: Set @everyone → View Channel:{' '}
                                            <strong className="text-green-400">✅ Allow</strong>, Send Messages:{' '}
                                            <strong className="text-red-400">❌ Deny</strong>
                                        </li>
                                        <li>
                                            For #giveaway-entries: Set @everyone → View Channel:{' '}
                                            <strong className="text-red-400">❌ Deny</strong>
                                        </li>
                                        <li>
                                            For #giveaway-entries: Set "Authorized" role → View Channel:{' '}
                                            <strong className="text-green-400">✅ Allow</strong>
                                        </li>
                                    </ol>
                                </div>
                            </div>

                            {/* Scenario 3 */}
                            <div className="ml-0 space-y-2">
                                <p className="text-sm font-semibold text-white flex items-center gap-2">
                                    <span className="text-lg">📌</span>
                                    Scenario 3: Role Assignment by Bot
                                </p>
                                <div className="ml-6 text-xs text-gray-300 space-y-1 bg-gray-800/50 p-3 rounded border border-gray-700">
                                    <p>
                                        You want the DropLabz bot to automatically assign a "Winner" role to giveaway
                                        winners.
                                    </p>
                                    <ol className="list-decimal list-inside space-y-1">
                                        <li>
                                            Make sure DropLabz Bot role is <strong>positioned HIGHER</strong> than the
                                            "Winner" role
                                        </li>
                                        <li>
                                            In category permissions, set "Winner" role → View Channel:{' '}
                                            <strong className="text-green-400">✅ Allow</strong>
                                        </li>
                                        <li>
                                            When bot assigns the role, winners will automatically see #winners channel
                                        </li>
                                    </ol>
                                </div>
                            </div>
                        </div>

                        {/* Troubleshooting */}
                        <div className="space-y-3 border-t border-blue-600/20 pt-4">
                            <h4 className="font-bold text-white">Troubleshooting</h4>
                            <div className="ml-0 space-y-2">
                                <div className="text-sm text-gray-300 space-y-2">
                                    <p className="font-semibold text-white">
                                        ❓ "I set permissions but users still can't see the channel"
                                    </p>
                                    <p className="text-xs ml-4">
                                        Check if the user has a conflicting role with "View Channel: Deny". Most
                                        restrictive permission wins. Also verify the user actually has the role
                                        assigned.
                                    </p>
                                </div>
                                <div className="text-sm text-gray-300 space-y-2">
                                    <p className="font-semibold text-white">❓ "Bot can't assign roles to users"</p>
                                    <p className="text-xs ml-4">
                                        Make sure the DropLabz Bot role is positioned HIGHER in the role list than the
                                        role it's trying to assign. Go to Server Settings → Roles and drag the bot role
                                        up.
                                    </p>
                                </div>
                                <div className="text-sm text-gray-300 space-y-2">
                                    <p className="font-semibold text-white">
                                        ❓ "Everyone can see the channels even with @everyone Deny"
                                    </p>
                                    <p className="text-xs ml-4">
                                        Discord has a special rule: if a user has any other role that allows viewing,
                                        they can see it. You may need to explicitly deny each role except the ones you
                                        want to allow.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Reference */}
                        <div className="space-y-3 border-t border-blue-600/20 pt-4">
                            <h4 className="font-bold text-white">Quick Reference: Permission Meanings</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-0">
                                <div className="text-xs bg-gray-800/50 p-3 rounded border border-gray-700 space-y-1">
                                    <p className="font-semibold text-white">View Channel</p>
                                    <p className="text-gray-400">Can see the channel in their channel list</p>
                                </div>
                                <div className="text-xs bg-gray-800/50 p-3 rounded border border-gray-700 space-y-1">
                                    <p className="font-semibold text-white">Send Messages</p>
                                    <p className="text-gray-400">Can type and send messages in the channel</p>
                                </div>
                                <div className="text-xs bg-gray-800/50 p-3 rounded border border-gray-700 space-y-1">
                                    <p className="font-semibold text-white">Embed Links</p>
                                    <p className="text-gray-400">Can post rich content (embeds, images)</p>
                                </div>
                                <div className="text-xs bg-gray-800/50 p-3 rounded border border-gray-700 space-y-1">
                                    <p className="font-semibold text-white">Use Slash Commands</p>
                                    <p className="text-gray-400">Can use Discord bot slash commands</p>
                                </div>
                                <div className="text-xs bg-gray-800/50 p-3 rounded border border-gray-700 space-y-1">
                                    <p className="font-semibold text-white">Read Message History</p>
                                    <p className="text-gray-400">Can see previously posted messages</p>
                                </div>
                                <div className="text-xs bg-gray-800/50 p-3 rounded border border-gray-700 space-y-1">
                                    <p className="font-semibold text-white">Manage Roles</p>
                                    <p className="text-gray-400">Can create/edit roles (admins only)</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="border-t border-blue-600/20 pt-4 bg-blue-900/20 -mx-6 -mb-4 px-6 py-4 rounded-b-lg">
                            <p className="text-xs text-blue-300">
                                ✅ <strong>You're all set!</strong> Once you've configured permissions, your DropLabz
                                channels will be properly gated and ready for your community. The bot will handle
                                announcements and role assignment automatically.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
