'use client';

import { useReducer } from 'react';

export interface ModalState {
    type: 'alert' | 'confirm';
    title: string;
    message: string;
    icon?: 'success' | 'error' | 'warning' | 'info';
    onConfirm?: () => void;
    onCancel?: () => void;
}

interface ProfileSettingsState {
    username: string;
    discordUsername: string | null;
    hasPassword: boolean;
    isEditingUsername: boolean;
    isEditingEmail: boolean;
    isEditingPassword: boolean;
    newEmail: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    modal: ModalState | null;
    loading: boolean;
}

type ProfileSettingsAction =
    | { type: 'SYNC_USERNAME'; payload: string }
    | { type: 'SET_DISCORD_USERNAME'; payload: string | null }
    | { type: 'SET_HAS_PASSWORD'; payload: boolean }
    | { type: 'SET_USERNAME'; payload: string }
    | { type: 'SET_NEW_EMAIL'; payload: string }
    | { type: 'SET_CURRENT_PASSWORD'; payload: string }
    | { type: 'SET_NEW_PASSWORD'; payload: string }
    | { type: 'SET_CONFIRM_PASSWORD'; payload: string }
    | { type: 'START_EDIT_USERNAME' }
    | { type: 'STOP_EDIT_USERNAME' }
    | { type: 'START_EDIT_EMAIL' }
    | { type: 'STOP_EDIT_EMAIL' }
    | { type: 'START_EDIT_PASSWORD' }
    | { type: 'STOP_EDIT_PASSWORD' }
    | { type: 'RESET_PASSWORD_FIELDS' }
    | { type: 'RESET_EMAIL_FIELDS' }
    | { type: 'SET_MODAL'; payload: ModalState }
    | { type: 'CLEAR_MODAL' }
    | { type: 'SET_LOADING'; payload: boolean };

const initialState: ProfileSettingsState = {
    username: '',
    discordUsername: null,
    hasPassword: false,
    isEditingUsername: false,
    isEditingEmail: false,
    isEditingPassword: false,
    newEmail: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    modal: null,
    loading: false,
};

function profileSettingsReducer(state: ProfileSettingsState, action: ProfileSettingsAction): ProfileSettingsState {
    switch (action.type) {
        case 'SYNC_USERNAME':
            return { ...state, username: action.payload };
        case 'SET_DISCORD_USERNAME':
            return { ...state, discordUsername: action.payload };
        case 'SET_HAS_PASSWORD':
            return { ...state, hasPassword: action.payload };
        case 'SET_USERNAME':
            return { ...state, username: action.payload };
        case 'SET_NEW_EMAIL':
            return { ...state, newEmail: action.payload };
        case 'SET_CURRENT_PASSWORD':
            return { ...state, currentPassword: action.payload };
        case 'SET_NEW_PASSWORD':
            return { ...state, newPassword: action.payload };
        case 'SET_CONFIRM_PASSWORD':
            return { ...state, confirmPassword: action.payload };
        case 'START_EDIT_USERNAME':
            return { ...state, isEditingUsername: true };
        case 'STOP_EDIT_USERNAME':
            return { ...state, isEditingUsername: false };
        case 'START_EDIT_EMAIL':
            return { ...state, isEditingEmail: true };
        case 'STOP_EDIT_EMAIL':
            return { ...state, isEditingEmail: false };
        case 'START_EDIT_PASSWORD':
            return { ...state, isEditingPassword: true };
        case 'STOP_EDIT_PASSWORD':
            return { ...state, isEditingPassword: false };
        case 'RESET_PASSWORD_FIELDS':
            return { ...state, currentPassword: '', newPassword: '', confirmPassword: '' };
        case 'RESET_EMAIL_FIELDS':
            return { ...state, newEmail: '' };
        case 'SET_MODAL':
            return { ...state, modal: action.payload };
        case 'CLEAR_MODAL':
            return { ...state, modal: null };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        default:
            return state;
    }
}

export function useProfileSettingsState() {
    const [state, dispatch] = useReducer(profileSettingsReducer, initialState);

    return { state, dispatch };
}
