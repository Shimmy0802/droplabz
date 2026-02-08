'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useProfileSettingsState } from '@/hooks/useProfileSettingsState';
import type { ModalState } from '@/hooks/useProfileSettingsState';

/**
 * Obscures an email address for privacy
 * Example: jasonchmielecki@gmail.com → j***@gmail.com
 */
function obscureEmail(email: string): string {
    if (!email || !email.includes('@')) return email;
    const [local, domain] = email.split('@');
    if (local.length <= 1) return email;
    return `${local[0]}${'*'.repeat(Math.min(local.length - 1, 3))}@${domain}`;
}

export default function ProfileSettings() {
    const { data: session, status, update } = useSession();
    const { state, dispatch } = useProfileSettingsState();
    const {
        username,
        discordUsername,
        hasPassword,
        isEditingUsername,
        isEditingEmail,
        isEditingPassword,
        newEmail,
        currentPassword,
        newPassword,
        confirmPassword,
        modal,
        loading,
    } = state;

    const showModal = (config: ModalState) => {
        dispatch({ type: 'SET_MODAL', payload: config });
    };
    const closeModal = () => dispatch({ type: 'CLEAR_MODAL' });

    // Fetch Discord username if user is linked to Discord
    useEffect(() => {
        if (session?.user?.id) {
            const controller = new AbortController();

            (async () => {
                try {
                    const res = await fetch('/api/users/me', { signal: controller.signal });
                    if (!res.ok) throw new Error('Failed to fetch user profile');

                    const data = await res.json();
                    if (data.user?.discordUsername) {
                        dispatch({ type: 'SET_DISCORD_USERNAME', payload: data.user.discordUsername });
                    }
                    if (typeof data.user?.hasPassword === 'boolean') {
                        dispatch({ type: 'SET_HAS_PASSWORD', payload: data.user.hasPassword });
                    }
                } catch (err) {
                    if (err instanceof Error && err.name !== 'AbortError') {
                        // Silently fail - it's okay if we can't fetch this data
                        // User can still use the page
                    }
                }
            })();

            return () => controller.abort();
        }
    }, [dispatch, session]);

    useEffect(() => {
        dispatch({ type: 'SYNC_USERNAME', payload: session?.user?.username || '' });
    }, [dispatch, session?.user?.username]);

    const handleDisconnectDiscord = async () => {
        showModal({
            type: 'confirm',
            title: 'Disconnect Discord?',
            message:
                'Are you sure you want to disconnect your Discord account? You will need an email and password set to continue using your account.',
            icon: 'warning',
            onConfirm: async () => {
                closeModal();
                dispatch({ type: 'SET_LOADING', payload: true });
                try {
                    const res = await fetch('/api/users/me/discord', {
                        method: 'DELETE',
                    });

                    const data = await res.json();

                    if (!res.ok) {
                        showModal({
                            type: 'alert',
                            title: 'Cannot Disconnect',
                            message: data.message || data.error || 'Failed to disconnect Discord account',
                            icon: 'error',
                        });
                        return;
                    }

                    // Update session
                    await update();

                    // Clear Discord username state
                    dispatch({ type: 'SET_DISCORD_USERNAME', payload: null });

                    showModal({
                        type: 'alert',
                        title: 'Success',
                        message: 'Discord account disconnected successfully',
                        icon: 'success',
                    });
                } catch (error) {
                    showModal({
                        type: 'alert',
                        title: 'Error',
                        message: 'An unexpected error occurred',
                        icon: 'error',
                    });
                } finally {
                    dispatch({ type: 'SET_LOADING', payload: false });
                }
            },
            onCancel: closeModal,
        });
    };

    const handleSaveUsername = async () => {
        if (!username.trim()) {
            showModal({
                type: 'alert',
                title: 'Invalid Username',
                message: 'Username cannot be empty',
                icon: 'error',
            });
            return;
        }

        if (username === session?.user?.username) {
            dispatch({ type: 'STOP_EDIT_USERNAME' });
            return;
        }

        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const res = await fetch('/api/users/me/username', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            });

            const data = await res.json();

            if (!res.ok) {
                showModal({
                    type: 'alert',
                    title: 'Error',
                    message: data.error || 'Failed to update username',
                    icon: 'error',
                });
                return;
            }

            // Update session
            await update();

            showModal({
                type: 'alert',
                title: 'Success',
                message: 'Username updated successfully',
                icon: 'success',
            });
            dispatch({ type: 'STOP_EDIT_USERNAME' });
        } catch (error) {
            showModal({
                type: 'alert',
                title: 'Error',
                message: 'Failed to update username',
                icon: 'error',
            });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const handleSaveEmail = async () => {
        if (!newEmail.trim()) {
            showModal({
                type: 'alert',
                title: 'Invalid Email',
                message: 'Email cannot be empty',
                icon: 'error',
            });
            return;
        }

        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const res = await fetch('/api/users/me/email', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: newEmail }),
            });

            const data = await res.json();

            if (!res.ok) {
                showModal({
                    type: 'alert',
                    title: 'Error',
                    message: data.error || 'Failed to update email',
                    icon: 'error',
                });
                return;
            }

            // Update session
            await update();

            showModal({
                type: 'alert',
                title: 'Success',
                message: data.message || 'Email updated successfully',
                icon: 'success',
            });
            dispatch({ type: 'STOP_EDIT_EMAIL' });
            dispatch({ type: 'RESET_EMAIL_FIELDS' });
        } catch (error) {
            showModal({
                type: 'alert',
                title: 'Error',
                message: 'Failed to update email',
                icon: 'error',
            });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const handleSavePassword = async () => {
        if (!newPassword.trim()) {
            showModal({
                type: 'alert',
                title: 'Invalid Password',
                message: 'Password cannot be empty',
                icon: 'error',
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            showModal({
                type: 'alert',
                title: 'Password Mismatch',
                message: 'Passwords do not match',
                icon: 'error',
            });
            return;
        }

        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const res = await fetch('/api/users/me/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: hasPassword ? currentPassword : undefined,
                    newPassword,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                showModal({
                    type: 'alert',
                    title: 'Error',
                    message: data.error || 'Failed to update password',
                    icon: 'error',
                });
                return;
            }

            // Update session to refresh user data
            await update();

            showModal({
                type: 'alert',
                title: 'Success',
                message: data.message || 'Password updated successfully',
                icon: 'success',
            });
            dispatch({ type: 'STOP_EDIT_PASSWORD' });
            dispatch({ type: 'RESET_PASSWORD_FIELDS' });
            dispatch({ type: 'SET_HAS_PASSWORD', payload: true });
        } catch (error) {
            showModal({
                type: 'alert',
                title: 'Error',
                message: 'Failed to update password',
                icon: 'error',
            });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#00ff41]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">Profile</p>
                    <h1 className="text-3xl font-bold text-white mt-2">Settings</h1>
                    <p className="text-gray-300 text-sm mt-2">Manage your account settings and preferences.</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Account Settings */}
                <section className="rounded-lg border border-gray-700 bg-gray-900/30 p-6 space-y-6 backdrop-blur-sm">
                    <div>
                        <h2 className="text-xl font-semibold text-white">Account Settings</h2>
                        <p className="text-gray-300 text-sm mt-1">Manage your account information and security.</p>
                    </div>

                    <div className="space-y-4">
                        {/* Username */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => dispatch({ type: 'SET_USERNAME', payload: e.target.value })}
                                    readOnly={!isEditingUsername}
                                    className={`flex-1 px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:border-[#00d4ff] focus:outline-none transition ${!isEditingUsername ? 'cursor-not-allowed opacity-70' : ''}`}
                                />
                                {isEditingUsername ? (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSaveUsername}
                                            disabled={loading}
                                            className="px-4 py-3 rounded-lg text-sm bg-[#00ff41] text-[#0a0e27] font-semibold hover:bg-[#00dd33] transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? 'Saving...' : 'Save'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                dispatch({
                                                    type: 'SYNC_USERNAME',
                                                    payload: session?.user?.username || '',
                                                });
                                                dispatch({ type: 'STOP_EDIT_USERNAME' });
                                            }}
                                            disabled={loading}
                                            className="px-4 py-3 rounded-lg text-sm border border-gray-600 text-gray-400 hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => dispatch({ type: 'START_EDIT_USERNAME' })}
                                        className="px-4 py-3 rounded-lg text-sm border border-[#00d4ff] text-[#00d4ff] hover:bg-[rgba(0,212,255,0.1)] transition"
                                    >
                                        Change
                                    </button>
                                )}
                            </div>
                            <p className="text-gray-500 text-xs mt-1">
                                Your public username (letters, numbers, and underscores only)
                            </p>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                            {isEditingEmail ? (
                                <div className="space-y-3">
                                    <input
                                        type="email"
                                        value={newEmail}
                                        onChange={e => dispatch({ type: 'SET_NEW_EMAIL', payload: e.target.value })}
                                        placeholder="Enter new email address"
                                        className="w-full px-4 py-3 rounded-lg bg-[#111528] border border-[rgba(0,212,255,0.2)] text-white focus:border-[#00d4ff] focus:outline-none"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSaveEmail}
                                            disabled={loading}
                                            className="px-4 py-3 rounded-lg text-sm bg-[#00ff41] text-[#0a0e27] font-semibold hover:bg-[#00dd33] transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? 'Saving...' : 'Save'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                dispatch({ type: 'RESET_EMAIL_FIELDS' });
                                                dispatch({ type: 'STOP_EDIT_EMAIL' });
                                            }}
                                            disabled={loading}
                                            className="px-4 py-3 rounded-lg text-sm border border-gray-600 text-gray-400 hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <input
                                        type="text"
                                        value={session?.user?.email ? obscureEmail(session.user.email) : 'Not linked'}
                                        readOnly
                                        className="flex-1 px-4 py-3 rounded-lg bg-[#111528] border border-[rgba(0,212,255,0.2)] text-gray-400 cursor-not-allowed"
                                    />
                                    <button
                                        onClick={() => dispatch({ type: 'START_EDIT_EMAIL' })}
                                        className="px-4 py-3 rounded-lg text-sm border border-[#00d4ff] text-[#00d4ff] hover:bg-[rgba(0,212,255,0.1)] transition"
                                    >
                                        {session?.user?.email ? 'Change' : 'Add Email'}
                                    </button>
                                </div>
                            )}
                            <p className="text-gray-500 text-xs mt-1">
                                {session?.user?.email
                                    ? 'Email is obscured for security. Click "Change" to update.'
                                    : 'Add an email to enable password recovery and notifications.'}
                            </p>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                            {isEditingPassword ? (
                                <div className="space-y-3">
                                    {hasPassword && (
                                        <input
                                            type="password"
                                            value={currentPassword}
                                            onChange={e =>
                                                dispatch({ type: 'SET_CURRENT_PASSWORD', payload: e.target.value })
                                            }
                                            placeholder="Current password"
                                            className="w-full px-4 py-3 rounded-lg bg-[#111528] border border-[rgba(0,212,255,0.2)] text-white focus:border-[#00d4ff] focus:outline-none"
                                        />
                                    )}
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={e => dispatch({ type: 'SET_NEW_PASSWORD', payload: e.target.value })}
                                        placeholder="New password"
                                        className="w-full px-4 py-3 rounded-lg bg-[#111528] border border-[rgba(0,212,255,0.2)] text-white focus:border-[#00d4ff] focus:outline-none"
                                    />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={e =>
                                            dispatch({ type: 'SET_CONFIRM_PASSWORD', payload: e.target.value })
                                        }
                                        placeholder="Confirm new password"
                                        className="w-full px-4 py-3 rounded-lg bg-[#111528] border border-[rgba(0,212,255,0.2)] text-white focus:border-[#00d4ff] focus:outline-none"
                                    />
                                    <p className="text-gray-400 text-xs">
                                        Password must be at least 8 characters with uppercase, lowercase, and number
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSavePassword}
                                            disabled={loading}
                                            className="px-4 py-3 rounded-lg text-sm bg-[#00ff41] text-[#0a0e27] font-semibold hover:bg-[#00dd33] transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? 'Saving...' : 'Save'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                dispatch({ type: 'RESET_PASSWORD_FIELDS' });
                                                dispatch({ type: 'STOP_EDIT_PASSWORD' });
                                            }}
                                            disabled={loading}
                                            className="px-4 py-3 rounded-lg text-sm border border-gray-600 text-gray-400 hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={() => dispatch({ type: 'START_EDIT_PASSWORD' })}
                                        className="px-4 py-3 rounded-lg text-sm border border-[#00d4ff] text-[#00d4ff] hover:bg-[rgba(0,212,255,0.1)] transition"
                                    >
                                        {hasPassword ? 'Change Password' : 'Set Password'}
                                    </button>
                                    <p className="text-gray-500 text-xs mt-1">
                                        {hasPassword
                                            ? 'Update your password to keep your account secure'
                                            : 'Set a password to enable email/password login'}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </section>

                {/* Alert Modal */}
                {modal && (
                    <div
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={closeModal}
                    >
                        <div
                            className="bg-[#0f1329] border border-[rgba(0,212,255,0.2)] rounded-xl max-w-md w-full p-6 space-y-4"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Icon */}
                            {modal.icon && (
                                <div className="flex justify-center">
                                    {modal.icon === 'success' && (
                                        <div className="w-12 h-12 rounded-full bg-[rgba(0,255,65,0.1)] border border-[rgba(0,255,65,0.3)] flex items-center justify-center">
                                            <svg
                                                className="w-6 h-6 text-[#00ff41]"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                        </div>
                                    )}
                                    {modal.icon === 'error' && (
                                        <div className="w-12 h-12 rounded-full bg-[rgba(255,0,0,0.1)] border border-[rgba(255,0,0,0.3)] flex items-center justify-center">
                                            <svg
                                                className="w-6 h-6 text-red-500"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M6 18L18 6M6 6l12 12"
                                                />
                                            </svg>
                                        </div>
                                    )}
                                    {modal.icon === 'warning' && (
                                        <div className="w-12 h-12 rounded-full bg-[rgba(255,193,7,0.1)] border border-[rgba(255,193,7,0.3)] flex items-center justify-center">
                                            <svg
                                                className="w-6 h-6 text-yellow-500"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                                />
                                            </svg>
                                        </div>
                                    )}
                                    {modal.icon === 'info' && (
                                        <div className="w-12 h-12 rounded-full bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.3)] flex items-center justify-center">
                                            <svg
                                                className="w-6 h-6 text-[#00d4ff]"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="text-center">
                                <h3 className="text-xl font-semibold text-white mb-2">{modal.title}</h3>
                                <p className="text-gray-400 text-sm">{modal.message}</p>
                            </div>

                            <div className="flex gap-2">
                                {modal.type === 'confirm' ? (
                                    <>
                                        <button
                                            onClick={() => {
                                                modal.onConfirm?.();
                                                closeModal();
                                            }}
                                            className="flex-1 px-4 py-3 rounded-lg text-sm bg-[#00ff41] text-[#0a0e27] font-semibold hover:bg-[#00dd33] transition"
                                        >
                                            Confirm
                                        </button>
                                        <button
                                            onClick={() => {
                                                modal.onCancel?.();
                                                closeModal();
                                            }}
                                            className="flex-1 px-4 py-3 rounded-lg text-sm border border-gray-600 text-gray-400 hover:bg-gray-800 transition"
                                        >
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={closeModal}
                                        className="w-full px-4 py-3 rounded-lg text-sm bg-[#00d4ff] text-[#0a0e27] font-semibold hover:bg-[#00bfe6] transition"
                                    >
                                        OK
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Connected Accounts */}
                <section className="rounded-xl border border-[rgba(0,212,255,0.1)] bg-[#0f1329] p-6 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-white">Connected Accounts</h2>
                        <p className="text-gray-400 text-sm mt-1">
                            Link multiple authentication methods to your account.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {/* Discord */}
                        <div className="flex items-center justify-between rounded-lg border border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.05)] px-4 py-3">
                            <div className="flex items-center gap-3">
                                <svg className="w-6 h-6 text-[#5865F2]" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                                </svg>
                                <div>
                                    <p className="text-white font-medium text-sm">Discord</p>
                                    <p className="text-gray-400 text-xs">{discordUsername || 'Connected'}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleDisconnectDiscord}
                                disabled={loading}
                                className="px-3 py-1.5 rounded-lg text-xs border border-red-600/40 text-red-400 hover:bg-red-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Disconnect
                            </button>
                        </div>

                        {/* Twitter/X - Coming Soon */}
                        <div className="flex items-center justify-between rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] px-4 py-3 opacity-60">
                            <div className="flex items-center gap-3">
                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                                <div>
                                    <p className="text-white font-medium text-sm">X / Twitter</p>
                                    <p className="text-gray-500 text-xs">Coming soon</p>
                                </div>
                            </div>
                            <button
                                disabled
                                className="px-3 py-1.5 rounded-lg text-xs border border-gray-600 text-gray-500 cursor-not-allowed"
                            >
                                Connect
                            </button>
                        </div>

                        {/* Google - Coming Soon */}
                        <div className="flex items-center justify-between rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] px-4 py-3 opacity-60">
                            <div className="flex items-center gap-3">
                                <svg className="w-6 h-6" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                <div>
                                    <p className="text-white font-medium text-sm">Google</p>
                                    <p className="text-gray-500 text-xs">Coming soon</p>
                                </div>
                            </div>
                            <button
                                disabled
                                className="px-3 py-1.5 rounded-lg text-xs border border-gray-600 text-gray-500 cursor-not-allowed"
                            >
                                Connect
                            </button>
                        </div>
                    </div>
                </section>

                {/* Privacy Settings */}
                <section className="rounded-xl border border-[rgba(0,212,255,0.1)] bg-[#0f1329] p-6 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-white">Privacy</h2>
                        <p className="text-gray-400 text-sm mt-1">Control how your information is displayed.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-3">
                            <div>
                                <p className="text-white font-medium">Public profile</p>
                                <p className="text-gray-500 text-sm">Allow others to view your profile</p>
                            </div>
                            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-[#00ff41] transition">
                                <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition" />
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
