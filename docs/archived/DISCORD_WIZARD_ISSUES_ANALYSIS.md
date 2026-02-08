# Discord Setup Wizard Issues Analysis

**File**: `/home/shimmy/droplabz/apps/web/src/components/community/wizard-steps/StepVerificationSocials.tsx`

**Date**: February 3, 2026

---

## Executive Summary

The Discord setup wizard component has **6 critical issues** preventing proper state updates and UI synchronization. These issues prevent:

1. Channel creation success from updating the form
2. SetupVerificationPanel from auto-verifying when guildId changes
3. Permission guide from showing/hiding correctly
4. Channel mode UI from responding to state changes

---

## Detailed Issues Found

### ❌ ISSUE #1: Missing State Variable for Channel Creation Success

**Severity**: CRITICAL  
**Location**: Lines 19-23 (state declarations)

**Problem**:
The component has no state variable to track when channels have been successfully created. This causes:

- No way to conditionally show the permission guide
- No way to trigger SetupVerificationPanel re-check
- Permission guide always shows (or never shows) regardless of creation state

**Current Code**:

```tsx
const [channels, setChannels] = useState<Array<{ id: string; name: string; parentId?: string }>>([]);
const [isLoadingChannels, setIsLoadingChannels] = useState(false);
const [channelError, setChannelError] = useState<string | null>(null);
const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
const [templateError, setTemplateError] = useState<string | null>(null);
// ❌ MISSING: No state to track if channels were created
```

**Impact**:

- Permission guide doesn't show AFTER channels are created
- Can't conditionally render success state
- SetupVerificationPanel doesn't know when to re-verify

**Fix**: Add state variable:

```tsx
const [templateCreatedSuccess, setTemplateCreatedSuccess] = useState(false);
```

---

### ❌ ISSUE #2: handleCreateTemplate() Doesn't Update Form Data with guildId

**Severity**: CRITICAL  
**Location**: Lines 54-95 (handleCreateTemplate function)

**Problem**:
After successfully creating channels, the function updates individual channel IDs but **never updates `discordGuildId`** in the form data. The SetupVerificationPanel checks `if (guildId)` but the value might not have been properly set when channels are created.

**Current Code** (lines 54-95):

```tsx
const handleCreateTemplate = async () => {
    if (!data.discordGuildId) return;

    try {
        // ... API call ...
        const result = await response.json();
        const templateChannels = result.channels || [];

        // Updates individual channel IDs
        if (announcement?.id) {
            onUpdate({ discordAnnouncementChannelId: announcement.id });
            clearError('discordAnnouncementChannelId');
        }
        // ... more channel updates ...

        // ❌ MISSING: No explicit form data update after success
        // ❌ MISSING: No trigger to SetupVerificationPanel to re-verify

        await fetchChannels();
    } catch (error) {
        // ...
    } finally {
        setIsCreatingTemplate(false);
    }
};
```

**Impact**:

- SetupVerificationPanel might render but not trigger verification
- Parent component doesn't know channels were created
- Form data inconsistency

**Fix**: Add after successful channel creation:

```tsx
setTemplateCreatedSuccess(true);
// Trigger verification panel to re-check
await fetchChannels();
```

---

### ❌ ISSUE #3: SetupVerificationPanel Missing Auto-Verification on Channel Creation

**Severity**: CRITICAL  
**Location**: Lines 372-390 (SetupVerificationPanel section)

**Problem**:
SetupVerificationPanel has a useEffect that checks `guildId` (line 69-78 of SetupVerificationPanel), but:

1. It only fires when `guildId` changes
2. Channel creation happens AFTER guildId is already set
3. No way to trigger verification after channels are created
4. Missing dependency that would trigger on successful channel creation

**Current Code** (StepVerificationSocials.tsx, lines 372-390):

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

**The Problem**:

- SetupVerificationPanel only auto-checks when `guildId` prop changes (new guild connected)
- After channel creation, `guildId` hasn't changed, so verification doesn't re-trigger
- No callback to parent to signal "channels were created, please re-verify"

**Impact**:

- User creates channels but verification still shows "setup incomplete"
- Must manually click "Verify Setup" button
- Poor UX for multi-step process

**Fix**: Pass a dependency or callback:

```tsx
<SetupVerificationPanel
    guildId={data.discordGuildId}
    onVerificationChange={...}
    // Add trigger for template creation
/>
```

---

### ❌ ISSUE #4: useEffect for fetchChannels Has Circular Dependency

**Severity**: HIGH  
**Location**: Lines 48-50 (fetchChannels useEffect)

**Problem**:

```tsx
const fetchChannels = useCallback(async () => {
    // ...
}, [data.discordGuildId]);

useEffect(() => {
    fetchChannels();
}, [fetchChannels]); // ❌ Problem: depends on fetchChannels
```

The useEffect depends on `fetchChannels`, but `fetchChannels` depends on `data.discordGuildId`. This creates unnecessary re-renders. More critically, **after handleCreateTemplate succeeds, fetchChannels is called but the state isn't updated to trigger re-rendering of conditional UI**.

**Current Code**:

```tsx
useEffect(() => {
    fetchChannels();
}, [fetchChannels]);
```

**Impact**:

- Channels list updates but doesn't trigger permission guide to show
- Extra re-renders
- No way to know when to show success state

**Fix**:

```tsx
useEffect(() => {
    fetchChannels();
}, [data.discordGuildId]); // Depend on the actual data, not the callback
```

---

### ❌ ISSUE #5: Permission Guide Not Conditionally Hidden/Shown

**Severity**: HIGH  
**Location**: Lines 310-333 (Permission Setup Instructions section)

**Problem**:
The permission guide section is unconditionally shown whenever `data.discordChannelMode === 'premade'`, but it should ONLY show AFTER channels are successfully created.

**Current Code** (lines 310-333):

```tsx
{
    /* Permission Setup Instructions */
}
<div className="mt-6 space-y-3">
    <h4 className="font-semibold text-white text-sm flex items-center gap-2">📋 Next: Set Channel Permissions</h4>
    <p className="text-sm text-gray-300">After channels are created, configure permissions in Discord...</p>
    <PermissionSetupGuide />
    {/* ... */}
</div>;
```

This section is rendered unconditionally within the `{data.discordChannelMode === 'premade'}` block. But logically, it should only show **after channels are created**.

**Impact**:

- Guide shows even before channels exist
- Confusing UX ("set channel permissions" when channels don't exist)
- Should appear AFTER successful creation

**Fix**: Wrap with conditional:

```tsx
{
    templateCreatedSuccess && <div className="mt-6 space-y-3">{/* Permission Setup Instructions */}</div>;
}
```

---

### ❌ ISSUE #6: No Success Message After Channel Creation

**Severity**: MEDIUM  
**Location**: Lines 54-95 (handleCreateTemplate)

**Problem**:
After successfully creating channels, there's no success message or state update. The user doesn't know if it worked. The function just updates channel IDs and fetches channels, but no visual feedback.

**Current Code**:

```tsx
const handleCreateTemplate = async () => {
    // ... after successful creation ...
    if (announcement?.id) {
        onUpdate({ discordAnnouncementChannelId: announcement.id });
        clearError('discordAnnouncementChannelId');
    }
    // ... channel updates ...

    await fetchChannels(); // ❌ No state update, no UI feedback
} finally {
    setIsCreatingTemplate(false);
}
```

**Impact**:

- No visual confirmation channels were created
- User unsure if action succeeded
- No way to trigger dependent UI (permission guide, verification)

**Fix**:

```tsx
if (announcement?.id) {
    onUpdate({ discordAnnouncementChannelId: announcement.id });
    clearError('discordAnnouncementChannelId');
}
// ... other channels ...

// Update state to show success
setTemplateCreatedSuccess(true);

// Trigger verification refresh
await fetchChannels();
```

---

## Summary Table

| Issue                                                           | Severity | Impact                                                | Line(s) | Type                  |
| --------------------------------------------------------------- | -------- | ----------------------------------------------------- | ------- | --------------------- |
| Missing `templateCreatedSuccess` state                          | CRITICAL | Can't show permission guide after creation            | 19-23   | State Management      |
| handleCreateTemplate doesn't update form data                   | CRITICAL | Form data inconsistency, verification doesn't trigger | 54-95   | State Update          |
| SetupVerificationPanel doesn't re-verify after channels created | CRITICAL | Must manually click verify button                     | 372-390 | Integration           |
| Circular useEffect dependency                                   | HIGH     | Unnecessary re-renders, state not updated             | 48-50   | Dependencies          |
| Permission guide always shows                                   | HIGH     | Shows before channels exist                           | 310-333 | Conditional Rendering |
| No success feedback                                             | MEDIUM   | User doesn't know if creation worked                  | 54-95   | UX                    |

---

## Recommended Fix Order

1. **First**: Add `templateCreatedSuccess` state (Issue #1)
2. **Second**: Update useEffect dependency (Issue #4)
3. **Third**: Update handleCreateTemplate to set success state (Issue #2, #6)
4. **Fourth**: Wrap permission guide with conditional (Issue #5)
5. **Fifth**: Verify SetupVerificationPanel integration (Issue #3)

---

## Root Cause Analysis

The core issue is **missing state synchronization**:

- When channels are created, the component updates form data but doesn't update its own state
- This prevents conditional rendering from working
- SetupVerificationPanel can't know when to re-verify because no event signals "channels were created"
- Permission guide can't conditionally show because there's no flag tracking creation success

The fix requires:

1. New state variable to track creation success
2. Setting that variable after handleCreateTemplate succeeds
3. Using that variable to conditionally render dependent UI
4. Possibly passing a callback to SetupVerificationPanel to trigger re-verification
