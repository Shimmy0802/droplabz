'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCommunityWizard } from '@/hooks/useCommunityWizard';
import StepProjectDetails from './wizard-steps/StepProjectDetails';
import StepVerificationSocials from './wizard-steps/StepVerificationSocials';
import StepAllowlistSettings from './wizard-steps/StepAllowlistSettings';
import StepGiveawaySettings from './wizard-steps/StepGiveawaySettings';

export default function CommunityCreationWizard() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { step, data, errors, updateData, setError, clearError, clearAllErrors, nextStep, prevStep, goToStep } =
        useCommunityWizard();

    const [isLoading, setIsLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        const guildId = searchParams.get('guild_id');
        const stepParam = searchParams.get('step');

        const normalizedGuildId = guildId ? guildId.replace(/\D/g, '') : '';

        if (normalizedGuildId && normalizedGuildId !== data.discordGuildId) {
            updateData({ discordGuildId: normalizedGuildId, skipVerification: false });
            clearError('discordGuildId');
        }

        if (normalizedGuildId && step === 1) {
            goToStep(2);
        } else if (stepParam === '2' && step === 1) {
            goToStep(2);
        }
    }, [searchParams, data.discordGuildId, updateData, clearError, goToStep, step]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [step]);

    const validateStep = (): boolean => {
        clearAllErrors();
        let isValid = true;

        if (step === 1) {
            if (!data.name.trim()) {
                setError('name', 'Community name is required');
                isValid = false;
            }
            if (!data.types || data.types.length === 0) {
                setError('types', 'Select at least one community type');
                isValid = false;
            }
            if (!data.slug.trim()) {
                setError('slug', 'Community URL slug is required');
                isValid = false;
            } else if (!/^[a-z0-9-]+$/.test(data.slug)) {
                setError('slug', 'Slug must contain only lowercase letters, numbers, and hyphens');
                isValid = false;
            }
            if (data.website && !isValidUrl(data.website)) {
                setError('website', 'Please enter a valid URL');
                isValid = false;
            }
        }

        if (step === 2) {
            if (data.skipVerification) {
                return true;
            }
            if (data.discordGuildId && !/^\d+$/.test(data.discordGuildId)) {
                setError('discordGuildId', 'Please enter a valid Discord Guild ID');
                isValid = false;
            }
            if (data.twitterHandle && !isValidTwitterHandle(data.twitterHandle)) {
                setError('twitterHandle', 'Please enter a valid Twitter handle');
                isValid = false;
            }
        }

        if (step === 3) {
            // Validation for Step 3 (Allowlist Settings) - simplified
            // Discord roles are now configured in Step 2
        }

        return isValid;
    };

    const isValidUrl = (urlString: string): boolean => {
        try {
            new URL(urlString);
            return true;
        } catch {
            return false;
        }
    };

    const isValidTwitterHandle = (handle: string): boolean => {
        return /^[a-zA-Z0-9_]{1,15}$/.test(handle);
    };

    const handleNext = () => {
        if (validateStep()) {
            nextStep();
        }
    };

    const handleSubmit = async () => {
        if (!validateStep()) return;

        setIsLoading(true);
        setSubmitError(null);

        try {
            // Prepare FormData for file uploads
            const formData = new FormData();

            // Add basic fields
            formData.append('name', data.name);
            formData.append('slug', data.slug);
            formData.append('types', JSON.stringify(data.types));
            formData.append('description', data.description);
            formData.append('website', data.website);

            // Add image files
            if (data.logo) {
                formData.append('logo', data.logo);
            }
            if (data.banner) {
                formData.append('banner', data.banner);
            }

            // Add Discord settings
            if (data.discordGuildId) {
                formData.append('discordGuildId', data.discordGuildId);
            }

            // Add social settings
            const socials: any = {};
            if (data.twitterHandle) {
                socials.twitter = `https://twitter.com/${data.twitterHandle}`;
            }
            if (Object.keys(socials).length > 0) {
                formData.append('socials', JSON.stringify(socials));
            }

            // Add settings as JSON
            const settings = {
                discord: {
                    channelMode: data.discordChannelMode,
                    announcementChannelId: data.discordAnnouncementChannelId,
                    giveawayChannelId: data.discordGiveawayChannelId,
                    giveawayEntryChannelId: data.discordGiveawayEntryChannelId,
                    winnerChannelId: data.discordWinnerChannelId,
                    adminChannelId: data.discordAdminChannelId,
                    roles: data.discordRoles,
                },
                allowlist: {
                    minimumAccountAge: data.minimumAccountAge,
                    minimumServerJoinAge: data.minimumServerJoinAge,
                    customEligibility: data.customEligibility,
                },
                giveaway: {
                    enableGiveaways: data.enableGiveaways,
                    holderRules: data.giveawayHolderRules,
                    roles: data.giveawayRoles,
                    entryRequirements: data.giveawayEntryRequirements,
                    channels: {
                        announcement: data.giveawayAnnouncementChannel,
                        entry: data.giveawayEntryChannel,
                        result: data.giveawayResultChannel,
                    },
                },
            };
            formData.append('settings', JSON.stringify(settings));

            const response = await fetch('/api/communities', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                setSubmitError(result.message || result.error || 'Failed to create community');
                if (result.issues) {
                    result.issues.forEach((issue: any) => {
                        setError(issue.path?.[0] || 'general', issue.message);
                    });
                }
                return;
            }

            // Success - redirect to community admin panel
            const community = result;
            router.push(`/profile/communities/${community.slug}/admin`);
        } catch (error) {
            console.error('Error creating community:', error);
            setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const steps = [
        { num: 1, title: 'Project Details', completed: step > 1 },
        { num: 2, title: 'Verification & Socials', completed: step > 2 },
        { num: 3, title: 'Allowlist Settings', completed: step > 3 },
        { num: 4, title: 'Giveaway Settings', completed: step > 4 },
    ];

    return (
        <div className="max-w-5xl mx-auto py-8 px-4">
            {/* Progress Indicator */}
            <div className="mb-12">
                <div className="flex items-center justify-between mb-8">
                    {steps.map((s, idx) => (
                        <React.Fragment key={s.num}>
                            <button
                                onClick={() => goToStep(s.num)}
                                disabled={isLoading}
                                className={`flex flex-col items-center gap-2 transition ${
                                    step === s.num
                                        ? 'text-green-500'
                                        : s.completed
                                          ? 'text-blue-500 hover:text-blue-400'
                                          : 'text-gray-600'
                                }`}
                            >
                                <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition border-2 ${
                                        step === s.num
                                            ? 'border-green-400 bg-green-500/20 shadow-[0_0_20px_rgba(0,255,65,0.35)]'
                                            : s.completed
                                              ? 'border-blue-400 bg-blue-500/20 shadow-[0_0_16px_rgba(0,212,255,0.25)]'
                                              : 'border-gray-600 bg-gray-800'
                                    }`}
                                >
                                    {s.completed ? (
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    ) : (
                                        s.num
                                    )}
                                </div>
                                <span className="text-xs font-medium whitespace-nowrap">{s.title}</span>
                            </button>
                            {idx < steps.length - 1 && (
                                <div
                                    className={`flex-1 h-1 mx-4 rounded transition ${
                                        s.completed ? 'bg-blue-500' : 'bg-gray-700'
                                    }`}
                                />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Step Content */}
            <div className="relative overflow-hidden rounded-lg border border-gray-700 bg-gradient-to-b from-gray-900/80 via-gray-900/60 to-gray-900/40 p-8 mb-8 shadow-[0_0_30px_rgba(0,255,65,0.08)]">
                <div className="pointer-events-none absolute inset-0 opacity-30 [background:radial-gradient(circle_at_top,rgba(0,255,65,0.12),transparent_55%),radial-gradient(circle_at_bottom,rgba(0,212,255,0.12),transparent_55%)]" />
                <div className="relative">
                    {step === 1 && (
                        <StepProjectDetails
                            data={data}
                            errors={errors}
                            onUpdate={updateData}
                            setError={setError}
                            clearError={clearError}
                        />
                    )}

                    {step === 2 && (
                        <StepVerificationSocials
                            data={data}
                            errors={errors}
                            onUpdate={updateData}
                            clearError={clearError}
                        />
                    )}

                    {step === 3 && (
                        <StepAllowlistSettings
                            data={data}
                            errors={errors}
                            onUpdate={updateData}
                            clearError={clearError}
                        />
                    )}

                    {step === 4 && (
                        <StepGiveawaySettings
                            data={data}
                            errors={errors}
                            onUpdate={updateData}
                            clearError={clearError}
                        />
                    )}
                </div>
            </div>

            {/* Error Message */}
            {submitError && (
                <div className="mb-8 bg-red-900/20 border border-red-700 rounded-lg p-4">
                    <p className="text-red-300">
                        <span className="font-semibold">Error:</span> {submitError}
                    </p>
                </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center gap-4">
                <button
                    onClick={prevStep}
                    disabled={step === 1 || isLoading}
                    className="px-6 py-2 rounded-lg border border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    ← Previous
                </button>

                <div className="text-sm text-gray-400">
                    Step {step} of {steps.length}
                </div>

                {step < 4 ? (
                    <button
                        onClick={handleNext}
                        disabled={isLoading}
                        className="px-6 py-2 rounded-lg bg-green-500 text-black font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        Next →
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="px-6 py-2 rounded-lg bg-green-500 text-black font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <svg
                                    className="animate-spin h-5 w-5"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                                Creating...
                            </>
                        ) : (
                            'Create Community'
                        )}
                    </button>
                )}
            </div>

            {/* Info Box */}
            <div className="mt-8 bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
                <p className="text-yellow-300 text-sm">
                    ⓘ <span className="font-semibold">Note:</span> Your community will need to be verified by our team
                    before it appears on the public marketplace. You'll receive a Discord ticket link to request
                    approval after creation.
                </p>
            </div>
        </div>
    );
}
