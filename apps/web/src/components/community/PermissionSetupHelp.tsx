'use client';

/**
 * Permission Setup Help Component
 *
 * Provides comprehensive guide for setting up Discord channel permissions.
 * Accessible from admin dashboard as a persistent reference.
 */

import React from 'react';
import { PermissionSetupGuide } from '@/components/community/PermissionSetupGuide';

export function PermissionSetupHelp() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    📋 Discord Permission Setup Guide
                </h1>
                <p className="text-gray-400">
                    Step-by-step instructions for configuring Discord channel permissions after setup.
                </p>
            </div>

            {/* Quick Overview Card */}
            <div className="relative overflow-hidden rounded-lg border border-cyan-500/30 bg-gradient-to-br from-cyan-900/20 via-gray-900/40 to-gray-900 p-6">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 pointer-events-none"></div>
                <div className="relative z-10">
                    <h2 className="text-xl font-semibold text-white mb-3">Why Manual Permissions?</h2>
                    <ul className="space-y-2 text-sm text-gray-300">
                        <li className="flex items-start gap-2">
                            <span className="text-cyan-400 font-bold mt-0.5">✓</span>
                            <span>
                                <strong className="text-white">Your Control:</strong> You maintain full control over who
                                can access each channel
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-cyan-400 font-bold mt-0.5">✓</span>
                            <span>
                                <strong className="text-white">Flexibility:</strong> Change permissions anytime without
                                rerunning the wizard
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-cyan-400 font-bold mt-0.5">✓</span>
                            <span>
                                <strong className="text-white">Security:</strong> Bot stays at lower privilege level,
                                reducing risk
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-cyan-400 font-bold mt-0.5">✓</span>
                            <span>
                                <strong className="text-white">Simplicity:</strong> The wizard focuses on what it does
                                best—creating channels
                            </span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Main Guide */}
            <div className="border border-gray-700 rounded-lg p-6 bg-gray-900/40">
                <h2 className="text-lg font-semibold text-white mb-4">Complete Permission Setup</h2>
                <PermissionSetupGuide />
            </div>

            {/* Quick Reference Card */}
            <div className="rounded-lg border border-gray-700 bg-gray-800/40 p-6">
                <h3 className="font-semibold text-white mb-4">🎯 Quick Reference: Channel Permissions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <h4 className="font-semibold text-green-300 text-sm">#announcements</h4>
                        <ul className="text-xs text-gray-400 space-y-1">
                            <li>
                                • <strong className="text-white">@everyone:</strong> View ✓, Send ✗
                            </li>
                            <li>
                                • <strong className="text-white">Bot role:</strong> View ✓, Send ✓
                            </li>
                            <li className="text-gray-500 pt-1 italic">View-only announcements channel</li>
                        </ul>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-semibold text-green-300 text-sm">#giveaways</h4>
                        <ul className="text-xs text-gray-400 space-y-1">
                            <li>
                                • <strong className="text-white">@everyone:</strong> View ✗, Send ✗
                            </li>
                            <li>
                                • <strong className="text-white">Members role:</strong> View ✓, Send ✗
                            </li>
                            <li className="text-gray-500 pt-1 italic">Gated to verified members</li>
                        </ul>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-semibold text-green-300 text-sm">#giveaway-entries</h4>
                        <ul className="text-xs text-gray-400 space-y-1">
                            <li>
                                • <strong className="text-white">@everyone:</strong> View ✗, Send ✗
                            </li>
                            <li>
                                • <strong className="text-white">Members role:</strong> View ✓, Send ✓
                            </li>
                            <li className="text-gray-500 pt-1 italic">Members submit entries here</li>
                        </ul>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-semibold text-green-300 text-sm">#droplabz-admin</h4>
                        <ul className="text-xs text-gray-400 space-y-1">
                            <li>
                                • <strong className="text-white">Admins only:</strong> View ✓, Send ✓
                            </li>
                            <li>
                                • <strong className="text-white">@everyone:</strong> View ✗, Send ✗
                            </li>
                            <li className="text-gray-500 pt-1 italic">Admin management & logs</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Troubleshooting Tips */}
            <div className="rounded-lg border border-yellow-700/30 bg-yellow-900/20 p-6">
                <h3 className="font-semibold text-yellow-300 mb-4">⚠️ Common Issues & Fixes</h3>
                <div className="space-y-3">
                    <div>
                        <p className="text-sm font-semibold text-white mb-1">Bot can't send messages to a channel</p>
                        <p className="text-xs text-gray-300">
                            → Check that the channel's @everyone deny doesn't block the bot. Set the channel permissions
                            to allow the bot role.
                        </p>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white mb-1">
                            Users can't see a channel they should access
                        </p>
                        <p className="text-xs text-gray-300">
                            → Verify their role has "View Channel" permission set to ALLOW. Check that @everyone doesn't
                            have DENY overrides.
                        </p>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white mb-1">
                            Permissions aren't changing even after updates
                        </p>
                        <p className="text-xs text-gray-300">
                            → Discord caches permissions. Try refreshing Discord (Ctrl+R or Cmd+R) or waiting a few
                            seconds.
                        </p>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white mb-1">Bot role position seems wrong</p>
                        <p className="text-xs text-gray-300">
                            → Go to Server Settings → Roles. The bot role must be positioned HIGHER than any roles it
                            manages. Drag it up if needed.
                        </p>
                    </div>
                </div>
            </div>

            {/* Next Steps */}
            <div className="rounded-lg border border-green-700/30 bg-green-900/20 p-6">
                <h3 className="font-semibold text-green-300 mb-3">✅ What's Next?</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-start gap-2">
                        <span className="text-green-400 font-bold">1.</span>
                        <span>Configure channel permissions in Discord following the guide above</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-green-400 font-bold">2.</span>
                        <span>Test by visiting your channels with a regular member account</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-green-400 font-bold">3.</span>
                        <span>Create your first whitelist/giveaway event</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-green-400 font-bold">4.</span>
                        <span>Post the event to Discord and start accepting entries</span>
                    </li>
                </ul>
            </div>

            {/* Support CTA */}
            <div className="rounded-lg border border-gray-700 bg-gray-800/40 p-6 text-center">
                <p className="text-sm text-gray-300 mb-3">Still have questions about permissions?</p>
                <a
                    href="https://support.discord.com/hc/en-us/articles/206994498-Managing-User-Permissions"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition font-semibold text-sm"
                >
                    📖 Discord's Permission Documentation
                    <span>→</span>
                </a>
            </div>
        </div>
    );
}
