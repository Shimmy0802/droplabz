import { useState, useCallback } from 'react';

export type CommunityType = 'NFT_PROJECT' | 'DAO' | 'COMMUNITY' | 'GAMING' | 'OTHER';

export interface WizardData {
    // Step 1: Project Details
    name: string;
    slug: string;
    types: CommunityType[];
    description: string;
    website: string;
    logo: File | null;
    logoPreview: string;
    banner: File | null;
    bannerPreview: string;

    // Step 2: Verification & Socials
    discordGuildId: string;
    discordChannelMode: 'premade' | 'custom'; // NEW: Choice between premade and custom channels
    discordRoles: string[]; // Role IDs - MOVED FROM Step 3 to Step 2
    discordAnnouncementChannelId: string;
    discordGiveawayChannelId: string;
    discordGiveawayEntryChannelId: string;
    discordWinnerChannelId: string; // Winner announcement channel
    discordAdminChannelId: string; // Admin/moderation channel
    twitterHandle: string;
    twitterVerified: boolean;
    skipVerification: boolean;

    // Step 3: Allowlist Settings (Simplified - roles removed)
    customEligibility: string;
    minimumAccountAge: number; // days
    minimumServerJoinAge: number; // days

    // Step 4: Giveaway Settings
    enableGiveaways: boolean;
    giveawayHolderRules: 'ANY_HOLDER' | 'SPECIFIC_ROLE' | 'NONE';
    giveawayRoles: string[];
    giveawayEntryRequirements: string[];
    giveawayAnnouncementChannel: string;
    giveawayEntryChannel: string;
    giveawayResultChannel: string;
}

export interface WizardErrors {
    [key: string]: string;
}

const initialData: WizardData = {
    // Step 1
    name: '',
    slug: '',
    types: ['NFT_PROJECT'],
    description: '',
    website: '',
    logo: null,
    logoPreview: '',
    banner: null,
    bannerPreview: '',

    // Step 2
    discordGuildId: '',
    discordChannelMode: 'premade', // NEW: Default to premade
    discordRoles: [], // MOVED FROM Step 3
    discordAnnouncementChannelId: '',
    discordGiveawayChannelId: '',
    discordGiveawayEntryChannelId: '',
    discordWinnerChannelId: '',
    discordAdminChannelId: '',
    twitterHandle: '',
    twitterVerified: false,
    skipVerification: false,

    // Step 3
    customEligibility: '',
    minimumAccountAge: 0,
    minimumServerJoinAge: 0,

    // Step 4
    enableGiveaways: false,
    giveawayHolderRules: 'NONE',
    giveawayRoles: [],
    giveawayEntryRequirements: [],
    giveawayAnnouncementChannel: '',
    giveawayEntryChannel: '',
    giveawayResultChannel: '',
};

export function useCommunityWizard() {
    const [step, setStep] = useState(1);
    const [data, setData] = useState<WizardData>(initialData);
    const [errors, setErrors] = useState<WizardErrors>({});

    const updateData = useCallback((updates: Partial<WizardData>) => {
        setData(prev => ({ ...prev, ...updates }));
    }, []);

    const setError = useCallback((field: string, message: string) => {
        setErrors(prev => ({ ...prev, [field]: message }));
    }, []);

    const clearError = useCallback((field: string) => {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
        });
    }, []);

    const clearAllErrors = useCallback(() => {
        setErrors({});
    }, []);

    const nextStep = useCallback(() => {
        if (step < 4) {
            setStep(prev => prev + 1);
            clearAllErrors();
        }
    }, [step, clearAllErrors]);

    const prevStep = useCallback(() => {
        if (step > 1) {
            setStep(prev => prev - 1);
            clearAllErrors();
        }
    }, [step, clearAllErrors]);

    const goToStep = useCallback(
        (stepNum: number) => {
            if (stepNum >= 1 && stepNum <= 4) {
                setStep(stepNum);
                clearAllErrors();
            }
        },
        [clearAllErrors],
    );

    const reset = useCallback(() => {
        setStep(1);
        setData(initialData);
        setErrors({});
    }, []);

    return {
        step,
        data,
        errors,
        updateData,
        setError,
        clearError,
        clearAllErrors,
        nextStep,
        prevStep,
        goToStep,
        reset,
    };
}
