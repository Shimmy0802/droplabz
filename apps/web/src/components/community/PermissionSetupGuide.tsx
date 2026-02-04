'use client';

/**
 * PermissionSetupGuide Component
 *
 * Reusable guide for setting up Discord channel permissions.
 * Used in: Discord Setup Wizard, Admin Dashboard, Help sections
 */

import React, { useState } from 'react';

export function PermissionSetupGuide() {
    const [expandedSection, setExpandedSection] = useState<string | null>('overview');

    const sections = [
        {
            id: 'overview',
            title: '📋 Permission Setup Overview',
            content: (
                <div className="space-y-3">
                    <p className="text-sm text-gray-300">
                        After channels are created, you need to set Discord permissions to control who can see and use
                        each channel.
                    </p>
                    <p className="text-sm text-gray-400">
                        This is done manually in Discord, giving you full control. DropLabz bot only creates the
                        channels.
                    </p>
                    <div className="bg-green-900/20 border border-green-700/30 rounded p-3 mt-3">
                        <p className="text-xs text-green-300">
                            ✅ <strong>Benefit:</strong> Your server, your rules. Change permissions anytime without
                            needing DropLabz.
                        </p>
                    </div>
                </div>
            ),
        },
        {
            id: 'step1',
            title: '1️⃣ Navigate to Server Settings',
            content: (
                <div className="space-y-3">
                    <ol className="space-y-2">
                        <li className="text-sm">
                            <span className="font-semibold text-white">Click server name</span> at the top-left of
                            Discord
                        </li>
                        <li className="text-sm">
                            <span className="font-semibold text-white">Select "Server Settings"</span> from the dropdown
                            menu
                        </li>
                        <li className="text-sm">
                            You'll see a left sidebar with options like Members, Roles, Channels, etc.
                        </li>
                    </ol>
                    <div className="bg-gray-900/50 border border-gray-700 rounded p-3 mt-3 text-xs text-gray-400">
                        <strong className="text-white">Screenshot equivalent:</strong> Discord server name dropdown →
                        "Server Settings" button
                    </div>
                </div>
            ),
        },
        {
            id: 'step2',
            title: '2️⃣ Go to Roles Tab',
            content: (
                <div className="space-y-3">
                    <ol className="space-y-2">
                        <li className="text-sm">
                            In Server Settings, click <span className="font-semibold text-white">"Roles"</span> in the
                            left sidebar
                        </li>
                        <li className="text-sm">You'll see all roles in your server (Admins, Mods, Members, etc.)</li>
                        <li className="text-sm">
                            Find the <span className="font-semibold text-cyan-300">DropLabz bot role</span> in this list
                        </li>
                    </ol>
                    <div className="bg-yellow-900/20 border border-yellow-700/30 rounded p-3 mt-3">
                        <p className="text-xs text-yellow-300">
                            ⚠️ <strong>Important:</strong> The DropLabz bot role must be HIGHER in the list than any
                            roles you want it to interact with.
                        </p>
                    </div>
                </div>
            ),
        },
        {
            id: 'step3',
            title: '3️⃣ Position the DropLabz Bot Role',
            content: (
                <div className="space-y-3">
                    <ol className="space-y-2">
                        <li className="text-sm">
                            Find <span className="font-semibold text-white">DropLabz (bot)</span> in the Roles list
                        </li>
                        <li className="text-sm">
                            Click and drag it <span className="font-semibold text-white">ABOVE</span> any roles you want
                            to gate channels with
                        </li>
                        <li className="text-sm">
                            Example: If you're creating a Verified Members role, the bot must be above it
                        </li>
                    </ol>
                    <div className="bg-gray-900/50 border border-gray-700 rounded p-3 mt-3 space-y-2">
                        <p className="text-xs text-gray-300">
                            <strong className="text-white">Example hierarchy (top to bottom):</strong>
                        </p>
                        <div className="text-xs text-gray-400 space-y-1 ml-3">
                            <div>→ @everyone (lowest)</div>
                            <div>→ Members</div>
                            <div>→ Moderators</div>
                            <div className="text-cyan-400">→ DropLabz (bot) ⬅️ Must be here or higher</div>
                            <div>→ Admin (highest)</div>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            id: 'step4',
            title: '4️⃣ Set Channel Permissions (DropLabz Category)',
            content: (
                <div className="space-y-3">
                    <ol className="space-y-2">
                        <li className="text-sm">
                            Leave Server Settings and go to your{' '}
                            <span className="font-semibold text-white">channel list</span>
                        </li>
                        <li className="text-sm">
                            Find the <span className="font-semibold text-cyan-300">DropLabz</span> category
                        </li>
                        <li className="text-sm">
                            Right-click the category → <span className="font-semibold text-white">"Edit Channel"</span>
                        </li>
                        <li className="text-sm">
                            Click the <span className="font-semibold text-white">"Permissions"</span> tab
                        </li>
                    </ol>
                </div>
            ),
        },
        {
            id: 'step5',
            title: '5️⃣ Configure Permission Overwrites',
            content: (
                <div className="space-y-3">
                    <p className="text-sm text-gray-300 mb-3">
                        In the Permissions tab, you'll set "Overrides" for who can see/use the channels:
                    </p>
                    <div className="space-y-3">
                        <div className="bg-red-900/20 border border-red-700/30 rounded p-3">
                            <p className="text-xs text-red-300 font-semibold mb-1">❌ @everyone Role:</p>
                            <ul className="text-xs text-red-200 space-y-1">
                                <li>
                                    • View Channel: <span className="font-semibold">DENY</span>
                                </li>
                                <li>
                                    • Send Messages: <span className="font-semibold">DENY</span>
                                </li>
                                <li>
                                    • Read Message History: <span className="font-semibold">DENY</span>
                                </li>
                            </ul>
                        </div>
                        <div className="bg-green-900/20 border border-green-700/30 rounded p-3">
                            <p className="text-xs text-green-300 font-semibold mb-1">
                                ✅ Specific Roles (e.g., "Verified Members"):
                            </p>
                            <ul className="text-xs text-green-200 space-y-1">
                                <li>
                                    • View Channel: <span className="font-semibold">ALLOW</span>
                                </li>
                                <li>
                                    • Send Messages: <span className="font-semibold">ALLOW</span>
                                </li>
                                <li>
                                    • Read Message History: <span className="font-semibold">ALLOW</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            id: 'step6',
            title: '🎯 Troubleshooting',
            content: (
                <div className="space-y-3">
                    <div className="space-y-3">
                        <div className="bg-yellow-900/20 border border-yellow-700/30 rounded p-3">
                            <p className="text-xs text-yellow-300 font-semibold mb-2">
                                ⚠️ Bot can't assign roles or manage channels?
                            </p>
                            <p className="text-xs text-yellow-200">
                                Check that the DropLabz bot role is positioned higher than the target roles in your
                                server's role list.
                            </p>
                        </div>
                        <div className="bg-yellow-900/20 border border-yellow-700/30 rounded p-3">
                            <p className="text-xs text-yellow-300 font-semibold mb-2">
                                ⚠️ Can't edit DropLabz category permissions?
                            </p>
                            <p className="text-xs text-yellow-200">
                                You need "Manage Channels" permission in the server. Usually given to Admin role or
                                above.
                            </p>
                        </div>
                        <div className="bg-yellow-900/20 border border-yellow-700/30 rounded p-3">
                            <p className="text-xs text-yellow-300 font-semibold mb-2">⚠️ Changes not taking effect?</p>
                            <p className="text-xs text-yellow-200">
                                Discord can take a few seconds to sync. Refresh Discord (Ctrl+R) if needed.
                            </p>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            id: 'admin-tips',
            title: '💡 Admin Channel Best Practices',
            content: (
                <div className="space-y-3">
                    <ul className="space-y-2 text-xs text-gray-300">
                        <li>
                            <span className="font-semibold text-white">#droplabz-admin:</span> Keep this restricted to
                            Admins only. This is where entries and giveaway management happens.
                        </li>
                        <li>
                            <span className="font-semibold text-white">#announcements:</span> Set to view-only for most
                            users. Only bot and Admins post here.
                        </li>
                        <li>
                            <span className="font-semibold text-white">#giveaways & #giveaway-entries:</span> Make these
                            public (or role-gated) if users need to see active giveaways.
                        </li>
                        <li>
                            <span className="font-semibold text-white">#winners:</span> Optional to show public
                            announcements. Keep private if you prefer discretion.
                        </li>
                    </ul>
                    <div className="bg-cyan-900/20 border border-cyan-700/30 rounded p-3 mt-3">
                        <p className="text-xs text-cyan-300">
                            💻 <strong>Pro tip:</strong> You can change permissions anytime. Start with restrictive and
                            open up as needed.
                        </p>
                    </div>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-3">
            {sections.map(section => (
                <div key={section.id} className="border border-gray-700 rounded-lg overflow-hidden bg-gray-800/40">
                    <button
                        onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-700/40 transition text-left"
                    >
                        <h4 className="font-semibold text-white text-sm">{section.title}</h4>
                        <span
                            className={`text-gray-400 transition transform ${
                                expandedSection === section.id ? 'rotate-180' : ''
                            }`}
                        >
                            ▼
                        </span>
                    </button>
                    {expandedSection === section.id && (
                        <div className="px-4 py-3 border-t border-gray-700 bg-gray-900/40 text-sm">
                            {section.content}
                        </div>
                    )}
                </div>
            ))}

            <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4 mt-4">
                <p className="text-sm text-green-300">
                    ✅ <strong className="text-white">All set!</strong> Your Discord channels are now configured with
                    proper permissions. Users will only see channels they have access to.
                </p>
            </div>
        </div>
    );
}
