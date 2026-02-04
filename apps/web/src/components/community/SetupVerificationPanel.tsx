'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { DiscordPermissionsGuide } from './DiscordPermissionsGuide';

interface ChannelStatus {
    name: string;
    exists: boolean;
    inCategory: boolean;
    hasPermissions: boolean;
    botCanManage: boolean;
}

interface VerificationStatus {
    isValid: boolean;
    botInGuild: boolean;
    categoryExists: boolean;
    channelsStatus: ChannelStatus[];
    botCanManageChannels: boolean;
    issues: string[];
    recommendations: string[];
}

interface SetupVerificationPanelProps {
    guildId: string | null;
    onVerificationChange?: (status: VerificationStatus | null) => void;
}

export function SetupVerificationPanel({ guildId, onVerificationChange }: SetupVerificationPanelProps) {
    const [status, setStatus] = useState<VerificationStatus | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const checkSetup = useCallback(async () => {
        if (!guildId) {
            setStatus(null);
            onVerificationChange?.(null);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/discord/verify-server-setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ guildId }),
            });

            const data = await response.json();
            setStatus(data);
            onVerificationChange?.(data);
        } catch (error) {
            console.error('Verification check failed:', error);
            setStatus({
                isValid: false,
                botInGuild: false,
                categoryExists: false,
                channelsStatus: [],
                botCanManageChannels: false,
                issues: ['Unable to verify setup'],
                recommendations: ['Check your internet connection and try again'],
            });
        } finally {
            setIsLoading(false);
        }
    }, [guildId, onVerificationChange]);

    // Auto-check when guildId changes
    useEffect(() => {
        const timer = setTimeout(() => {
            checkSetup();
        }, 500);

        return () => clearTimeout(timer);
    }, [guildId, checkSetup]);

    if (!guildId) {
        return null;
    }

    if (!status) {
        return (
            <button
                onClick={checkSetup}
                disabled={isLoading}
                className="w-full px-4 py-3 text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30"
            >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {isLoading ? 'Checking Setup...' : '🔍 Verify Setup'}
            </button>
        );
    }

    const allComplete = status.isValid;
    const completionPercent = Math.round(
        ([
            status.botInGuild,
            status.categoryExists,
            status.botCanManageChannels,
            status.channelsStatus.every(c => c.exists && c.inCategory && c.hasPermissions),
        ].filter(Boolean).length /
            4) *
            100,
    );

    return (
        <div className="space-y-3">
            {/* Status Header */}
            <div
                className={`rounded-lg border p-4 transition ${
                    allComplete
                        ? 'border-green-500/40 bg-green-500/10'
                        : status.issues.length > 0
                          ? 'border-red-500/40 bg-red-500/10'
                          : 'border-yellow-500/40 bg-yellow-500/10'
                }`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className={`text-lg ${
                                allComplete
                                    ? 'text-green-400'
                                    : status.issues.length > 0
                                      ? 'text-red-400'
                                      : 'text-yellow-400'
                            }`}
                        >
                            {allComplete ? '✅' : status.issues.length > 0 ? '❌' : '⚠️'}
                        </div>
                        <div>
                            <h3 className="font-semibold text-white text-base">
                                {allComplete ? 'Setup Complete ✨' : 'Setup Issues Found'}
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {allComplete
                                    ? 'Your Discord server is ready!'
                                    : `${status.issues.length} issue${status.issues.length !== 1 ? 's' : ''} • ${completionPercent}% done`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={checkSetup}
                        disabled={isLoading}
                        className="px-3 py-1.5 text-xs font-medium bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded transition"
                    >
                        {isLoading ? '⟳' : '⟳'}
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="mt-3 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 ${
                            allComplete
                                ? 'bg-gradient-to-r from-green-500 to-green-400'
                                : status.issues.length === 0
                                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                                  : 'bg-gradient-to-r from-red-500 to-red-400'
                        }`}
                        style={{ width: `${completionPercent}%` }}
                    />
                </div>
            </div>

            {/* Collapsible Details */}
            <div>
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full flex items-center justify-between px-4 py-2 rounded-lg border border-gray-700 bg-gray-800/50 hover:bg-gray-800 text-white text-sm font-medium transition"
                >
                    <span>Details</span>
                    <span className={`transition-transform text-xs ${expanded ? 'rotate-180' : ''}`}>▼</span>
                </button>

                {expanded && (
                    <div className="mt-3 space-y-2 p-3 rounded-lg border border-gray-700 bg-gray-900/50 text-xs">
                        {/* Bot */}
                        <div>
                            <p className="font-semibold text-gray-300 mb-1">Bot Status</p>
                            <div className="space-y-1 ml-2">
                                <div className="flex items-center gap-2">
                                    {status.botInGuild ? (
                                        <CheckCircle className="w-3 h-3 text-green-400" />
                                    ) : (
                                        <AlertCircle className="w-3 h-3 text-red-400" />
                                    )}
                                    <span className="text-gray-300">Bot in guild</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {status.botCanManageChannels ? (
                                        <CheckCircle className="w-3 h-3 text-green-400" />
                                    ) : (
                                        <AlertCircle className="w-3 h-3 text-red-400" />
                                    )}
                                    <span className="text-gray-300">Manage Channels permission</span>
                                </div>
                            </div>
                        </div>

                        {/* Category */}
                        <div>
                            <p className="font-semibold text-gray-300 mb-1">Infrastructure</p>
                            <div className="ml-2 flex items-center gap-2">
                                {status.categoryExists ? (
                                    <CheckCircle className="w-3 h-3 text-green-400" />
                                ) : (
                                    <AlertCircle className="w-3 h-3 text-red-400" />
                                )}
                                <span className="text-gray-300">DropLabz category</span>
                            </div>
                        </div>

                        {/* Channels */}
                        {status.channelsStatus.length > 0 && (
                            <div>
                                <p className="font-semibold text-gray-300 mb-1">
                                    Channels (
                                    {
                                        status.channelsStatus.filter(c => c.exists && c.inCategory && c.hasPermissions)
                                            .length
                                    }
                                    /{status.channelsStatus.length})
                                </p>
                                <div className="ml-2 space-y-0.5">
                                    {status.channelsStatus.map(channel => {
                                        const allGood = channel.exists && channel.inCategory && channel.hasPermissions;
                                        return (
                                            <div key={channel.name} className="flex items-center gap-2">
                                                {allGood ? (
                                                    <CheckCircle className="w-3 h-3 text-green-400" />
                                                ) : (
                                                    <AlertCircle className="w-3 h-3 text-red-400" />
                                                )}
                                                <span className="text-gray-300">#{channel.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Issues */}
            {status.issues.length > 0 && (
                <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
                    <h4 className="text-xs font-semibold text-red-300 uppercase mb-1">⚠️ Issues</h4>
                    <ul className="space-y-0.5 text-xs text-red-200">
                        {status.issues.map((issue, i) => (
                            <li key={i} className="flex gap-2">
                                <span className="text-red-300 font-bold mt-0.5">•</span>
                                <span>{issue}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Recommendations - Hidden if channels don't exist yet (before creation) */}
            {status.recommendations.length > 0 && status.categoryExists && (
                <div className="px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <h4 className="text-xs font-semibold text-blue-300 uppercase mb-1">💡 How to Fix</h4>
                    <ul className="space-y-1 text-xs text-blue-200">
                        {status.recommendations.map((rec, i) => (
                            <li key={i} className="flex gap-2">
                                <span className="text-blue-300 font-bold">→</span>
                                <span>{rec}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Permission Setup Guide */}
            <div className="mt-4">
                <DiscordPermissionsGuide expanded={false} />
            </div>
        </div>
    );
}
