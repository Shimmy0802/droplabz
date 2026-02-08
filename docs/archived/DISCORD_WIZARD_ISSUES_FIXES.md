# Discord Setup Wizard - Issues with Fixes

## Quick Reference: All Issues & Line Numbers

### StepVerificationSocials.tsx Issues

**Issue #1**: Missing state for tracking successful channel creation

- **Line**: 19-23 (state declarations)
- **Status**: No `templateCreatedSuccess` state
- **Fix**: Add `const [templateCreatedSuccess, setTemplateCreatedSuccess] = useState(false);`

**Issue #2**: handleCreateTemplate doesn't update component state

- **Line**: 54-95 (handleCreateTemplate function)
- **Status**: Updates form data but doesn't set `templateCreatedSuccess`
- **Fix**: Add `setTemplateCreatedSuccess(true);` after successful channel creation

**Issue #3**: useEffect dependency circular reference

- **Line**: 48-50 (useEffect for fetchChannels)
- **Status**: Depends on `fetchChannels` callback instead of `data.discordGuildId`
- **Fix**: Change dependency from `[fetchChannels]` to `[data.discordGuildId]`

**Issue #4**: Permission guide unconditionally rendered

- **Line**: 310-333 (Permission Setup Instructions)
- **Status**: Shows even before channels are created
- **Fix**: Wrap with `{templateCreatedSuccess && (...)}`

**Issue #5**: SetupVerificationPanel can't be triggered after channel creation

- **Line**: 372-390 (SetupVerificationPanel section)
- **Status**: Only auto-verifies when guildId prop changes, not after channel creation
- **Fix**: Pass `templateCreatedSuccess` or add callback to trigger re-verification

**Issue #6**: No success feedback after channel creation

- **Line**: 54-95 (end of handleCreateTemplate)
- **Status**: Function completes but no visual confirmation
- **Fix**: Set success state and show confirmation message

---

## Before/After Code Examples

### FIX #1: Add Missing State Variable

**Before (Lines 19-23)**:

```tsx
const [channels, setChannels] = useState<Array<{ id: string; name: string; parentId?: string }>>([]);
const [isLoadingChannels, setIsLoadingChannels] = useState(false);
const [channelError, setChannelError] = useState<string | null>(null);
const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
const [templateError, setTemplateError] = useState<string | null>(null);
```

**After**:

```tsx
const [channels, setChannels] = useState<Array<{ id: string; name: string; parentId?: string }>>([]);
const [isLoadingChannels, setIsLoadingChannels] = useState(false);
const [channelError, setChannelError] = useState<string | null>(null);
const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
const [templateError, setTemplateError] = useState<string | null>(null);
const [templateCreatedSuccess, setTemplateCreatedSuccess] = useState(false);
```

---

### FIX #2: Fix useEffect Dependency

**Before (Lines 48-50)**:

```tsx
useEffect(() => {
    fetchChannels();
}, [fetchChannels]);
```

**After**:

```tsx
useEffect(() => {
    fetchChannels();
}, [data.discordGuildId]);
```

---

### FIX #3: Update handleCreateTemplate Success Path

**Before (Lines 54-95, end of function)**:

```tsx
const handleCreateTemplate = async () => {
    if (!data.discordGuildId) return;

    try {
        setIsCreatingTemplate(true);
        setTemplateError(null);
        const response = await fetch('/api/discord/setup-channels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guildId: data.discordGuildId }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.details || errorData.error || 'Failed to create template channels');
        }

        const result = await response.json();
        const templateChannels = result.channels || [];

        const announcement = templateChannels.find((c: any) => c.key === 'announcements');
        const giveaways = templateChannels.find((c: any) => c.key === 'giveaways');
        const giveawayEntries = templateChannels.find((c: any) => c.key === 'giveaway-entries');

        if (announcement?.id) {
            onUpdate({ discordAnnouncementChannelId: announcement.id });
            clearError('discordAnnouncementChannelId');
        }
        if (giveaways?.id) {
            onUpdate({ discordGiveawayChannelId: giveaways.id });
            clearError('discordGiveawayChannelId');
        }
        if (giveawayEntries?.id) {
            onUpdate({ discordGiveawayEntryChannelId: giveawayEntries.id });
            clearError('discordGiveawayEntryChannelId');
        }

        await fetchChannels();
    } catch (error) {
        console.error('Error creating channel template:', error);
        setTemplateError(error instanceof Error ? error.message : 'Failed to create channels');
    } finally {
        setIsCreatingTemplate(false);
    }
};
```

**After** (changes in success path):

```tsx
const handleCreateTemplate = async () => {
    if (!data.discordGuildId) return;

    try {
        setIsCreatingTemplate(true);
        setTemplateError(null);
        const response = await fetch('/api/discord/setup-channels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guildId: data.discordGuildId }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.details || errorData.error || 'Failed to create template channels');
        }

        const result = await response.json();
        const templateChannels = result.channels || [];

        const announcement = templateChannels.find((c: any) => c.key === 'announcements');
        const giveaways = templateChannels.find((c: any) => c.key === 'giveaways');
        const giveawayEntries = templateChannels.find((c: any) => c.key === 'giveaway-entries');

        if (announcement?.id) {
            onUpdate({ discordAnnouncementChannelId: announcement.id });
            clearError('discordAnnouncementChannelId');
        }
        if (giveaways?.id) {
            onUpdate({ discordGiveawayChannelId: giveaways.id });
            clearError('discordGiveawayChannelId');
        }
        if (giveawayEntries?.id) {
            onUpdate({ discordGiveawayEntryChannelId: giveawayEntries.id });
            clearError('discordGiveawayEntryChannelId');
        }

        // ✅ NEW: Mark that channels were successfully created
        setTemplateCreatedSuccess(true);

        await fetchChannels();
    } catch (error) {
        console.error('Error creating channel template:', error);
        setTemplateError(error instanceof Error ? error.message : 'Failed to create channels');
        // ✅ NEW: Reset success flag on error
        setTemplateCreatedSuccess(false);
    } finally {
        setIsCreatingTemplate(false);
    }
};
```

---

### FIX #4: Conditionally Show Permission Guide

**Before (Lines 310-333)**:

```tsx
{/* Conditional UI based on mode */}
{data.discordChannelMode === 'premade' ? (
    <div className="space-y-4">
        <button
            type="button"
            onClick={handleCreateTemplate}
            disabled={!data.discordGuildId || isCreatingTemplate}
            className="w-full rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-4 py-3 text-black font-semibold text-sm hover:from-green-400 hover:to-green-500 disabled:cursor-not-allowed disabled:opacity-50 transition shadow-lg shadow-green-500/50"
        >
            {isCreatingTemplate ? 'Creating Channels...' : '✨ Create DropLabz Channels'}
        </button>
        {templateError && <p className="text-red-500 text-sm">{templateError}</p>}
        <p className="text-xs text-gray-500">
            Creates: #announcements, #giveaways, #giveaway-entries, #winners, #droplabz-admin
        </p>

        {/* Permission Setup Instructions */}
        <div className="mt-6 space-y-3">
            <h4 className="font-semibold text-white text-sm flex items-center gap-2">
                📋 Next: Set Channel Permissions
            </h4>
            <p className="text-sm text-gray-300">
                After channels are created, configure permissions in Discord. The DropLabz bot only
                creates channels—you control who can access them.
            </p>
            <PermissionSetupGuide />
            <div className="bg-cyan-900/20 border border-cyan-700/50 rounded p-3 mt-3">
                <p className="text-xs text-cyan-300">
                    💡 <strong className="text-white">Bookmark this:</strong> Save a link to the
                    Permission Guide in your admin dashboard for future reference.
                </p>
            </div>
        </div>
    </div>
) : (
    // ... custom mode UI ...
)}
```

**After** (with conditional permission guide):

```tsx
{/* Conditional UI based on mode */}
{data.discordChannelMode === 'premade' ? (
    <div className="space-y-4">
        <button
            type="button"
            onClick={handleCreateTemplate}
            disabled={!data.discordGuildId || isCreatingTemplate}
            className="w-full rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-4 py-3 text-black font-semibold text-sm hover:from-green-400 hover:to-green-500 disabled:cursor-not-allowed disabled:opacity-50 transition shadow-lg shadow-green-500/50"
        >
            {isCreatingTemplate ? 'Creating Channels...' : '✨ Create DropLabz Channels'}
        </button>
        {templateError && <p className="text-red-500 text-sm">{templateError}</p>}

        {/* ✅ NEW: Show success message after creation */}
        {templateCreatedSuccess && (
            <p className="text-green-400 text-sm font-semibold">
                ✅ Channels created successfully! Scroll down to set permissions.
            </p>
        )}

        <p className="text-xs text-gray-500">
            Creates: #announcements, #giveaways, #giveaway-entries, #winners, #droplabz-admin
        </p>

        {/* ✅ NEW: Only show permission guide after channels are created */}
        {templateCreatedSuccess && (
            <div className="mt-6 space-y-3">
                <h4 className="font-semibold text-white text-sm flex items-center gap-2">
                    📋 Next: Set Channel Permissions
                </h4>
                <p className="text-sm text-gray-300">
                    After channels are created, configure permissions in Discord. The DropLabz bot only
                    creates channels—you control who can access them.
                </p>
                <PermissionSetupGuide />
                <div className="bg-cyan-900/20 border border-cyan-700/50 rounded p-3 mt-3">
                    <p className="text-xs text-cyan-300">
                        💡 <strong className="text-white">Bookmark this:</strong> Save a link to the
                        Permission Guide in your admin dashboard for future reference.
                    </p>
                </div>
            </div>
        )}
    </div>
) : (
    // ... custom mode UI ...
)}
```

---

### FIX #5: SetupVerificationPanel Auto-Refresh

**Before (Lines 372-390)**:

```tsx
{
    /* Setup Verification Status */
}
{
    data.discordGuildId && (
        <div className="border border-yellow-500/30 rounded-lg p-6 bg-gradient-to-br from-yellow-900/10 via-gray-800/40 to-gray-800/40">
            <div className="flex items-center gap-3 mb-4">
                <div className="h-1 w-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-white">Setup Status</h3>
            </div>
            <p className="text-gray-300 text-sm mb-4">
                Complete verification of your Discord setup. Ensure all channels are properly configured and gated.
            </p>
            <SetupVerificationPanel guildId={data.discordGuildId} />
        </div>
    );
}
```

**After** (with trigger for channel creation):

```tsx
{
    /* Setup Verification Status */
}
{
    data.discordGuildId && (
        <div className="border border-yellow-500/30 rounded-lg p-6 bg-gradient-to-br from-yellow-900/10 via-gray-800/40 to-gray-800/40">
            <div className="flex items-center gap-3 mb-4">
                <div className="h-1 w-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-white">Setup Status</h3>
            </div>
            <p className="text-gray-300 text-sm mb-4">
                Complete verification of your Discord setup. Ensure all channels are properly configured and gated.
            </p>
            {/* ✅ NEW: Pass templateCreatedSuccess to trigger re-verification */}
            <SetupVerificationPanel
                key={templateCreatedSuccess ? 'verified' : 'unverified'}
                guildId={data.discordGuildId}
            />
        </div>
    );
}
```

**Note**: The `key` prop forces React to remount the component, which triggers a fresh verification check. Alternatively, SetupVerificationPanel could be modified to accept a trigger prop.

---

## Implementation Checklist

- [ ] Add `templateCreatedSuccess` state variable (line 23)
- [ ] Fix useEffect dependency (line 50)
- [ ] Set `templateCreatedSuccess` in handleCreateTemplate success path (after line 88)
- [ ] Reset `templateCreatedSuccess` in catch block (after line 94)
- [ ] Wrap permission guide with conditional `{templateCreatedSuccess && (...)}` (line 310)
- [ ] Add success message after creation (after line 88)
- [ ] Update SetupVerificationPanel key or add callback (line 381)
- [ ] Test channel creation flow end-to-end
- [ ] Verify permission guide appears only after creation
- [ ] Verify SetupVerificationPanel auto-verifies after creation

---

## Testing Checklist

1. **Channel Creation**:
    - [ ] Click "Create DropLabz Channels"
    - [ ] Wait for creation to complete
    - [ ] Verify success message appears
    - [ ] Verify permission guide appears

2. **Permission Guide**:
    - [ ] Permission guide does NOT show before creation
    - [ ] Permission guide DOES show after successful creation
    - [ ] Permission guide does NOT show for custom mode

3. **Setup Verification**:
    - [ ] SetupVerificationPanel appears after channels created
    - [ ] Verification status updates automatically
    - [ ] Manual refresh button works

4. **Form State**:
    - [ ] Channel IDs saved in form data
    - [ ] GuildId persists in form data
    - [ ] Returning to page preserves channel selections
