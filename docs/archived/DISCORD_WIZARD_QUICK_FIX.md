# Discord Wizard Issues - Quick Reference Card

## 6 Critical Issues Found in StepVerificationSocials.tsx

### Issue #1: Missing State Variable ❌

**Line**: 19-23  
**Problem**: No `templateCreatedSuccess` flag to track when channels are created  
**Fix**: Add `const [templateCreatedSuccess, setTemplateCreatedSuccess] = useState(false);`

---

### Issue #2: handleCreateTemplate Incomplete ❌

**Line**: 54-95  
**Problem**: Function updates form data but not component state  
**Missing**:

- `setTemplateCreatedSuccess(true)` after success
- `setTemplateCreatedSuccess(false)` in catch block  
  **Result**: Permission guide never shows, verification never auto-triggers

---

### Issue #3: useEffect Circular Dependency ❌

**Line**: 48-50  
**Problem**: `useEffect(() => { fetchChannels(); }, [fetchChannels])`  
**Why bad**: `fetchChannels` depends on `data.discordGuildId`, so this creates indirect circular dependency  
**Fix**: Change to `}, [data.discordGuildId])`

---

### Issue #4: Permission Guide Always Shows (or Never) ❌

**Line**: 310-333  
**Problem**: Unconditionally rendered when mode is 'premade', but should only show AFTER channels created  
**Current**: Guide shows before channels exist  
**Fix**: Wrap with `{templateCreatedSuccess && (...)}`

---

### Issue #5: SetupVerificationPanel Can't Auto-Verify ❌

**Line**: 372-390  
**Problem**: Only auto-verifies when `guildId` prop changes, not when channels are created  
**Why**: Channel creation doesn't change `guildId`, so useEffect doesn't trigger  
**Fix**: Add `key={templateCreatedSuccess ? 'verified' : 'unverified'}` to force remount

---

### Issue #6: No Success Feedback ❌

**Line**: 54-95  
**Problem**: No visual confirmation that channels were created  
**Fix**: Add success message after line 88:

```tsx
{
    templateCreatedSuccess && (
        <p className="text-green-400 text-sm font-semibold">
            ✅ Channels created successfully! Scroll down to set permissions.
        </p>
    );
}
```

---

## The 5-Minute Fix

```tsx
// BEFORE: Lines 19-23
const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
const [templateError, setTemplateError] = useState<string | null>(null);

// AFTER: Add one line
const [templateCreatedSuccess, setTemplateCreatedSuccess] = useState(false);

// BEFORE: Lines 48-50
useEffect(() => {
    fetchChannels();
}, [fetchChannels]);

// AFTER: Change dependency
useEffect(() => {
    fetchChannels();
}, [data.discordGuildId]);

// BEFORE: Lines 88-93
        if (giveawayEntries?.id) {
            onUpdate({ discordGiveawayEntryChannelId: giveawayEntries.id });
            clearError('discordGiveawayEntryChannelId');
        }

        await fetchChannels();

// AFTER: Add two lines
        if (giveawayEntries?.id) {
            onUpdate({ discordGiveawayEntryChannelId: giveawayEntries.id });
            clearError('discordGiveawayEntryChannelId');
        }

        setTemplateCreatedSuccess(true);  // ← ADD THIS
        await fetchChannels();

// BEFORE: Line 93 (in catch block)
    } catch (error) {
        console.error('Error creating channel template:', error);
        setTemplateError(error instanceof Error ? error.message : 'Failed to create channels');

// AFTER: Add state reset
    } catch (error) {
        console.error('Error creating channel template:', error);
        setTemplateError(error instanceof Error ? error.message : 'Failed to create channels');
        setTemplateCreatedSuccess(false);  // ← ADD THIS

// BEFORE: Lines 310-333
{data.discordChannelMode === 'premade' ? (
    <div className="space-y-4">
        {/* ... button ... */}
        {/* Permission guide always shows here */}
        <div className="mt-6 space-y-3">
            {/* Permission guide content */}
        </div>
    </div>

// AFTER: Conditional render
{data.discordChannelMode === 'premade' ? (
    <div className="space-y-4">
        {/* ... button ... */}
        {templateCreatedSuccess && (  // ← ADD THIS
            <p className="text-green-400 text-sm font-semibold">
                ✅ Channels created successfully! Scroll down to set permissions.
            </p>
        )}
        {templateCreatedSuccess && (  // ← ADD THIS
            <div className="mt-6 space-y-3">
                {/* Permission guide content */}
            </div>
        )}
    </div>

// BEFORE: Lines 381-389
<SetupVerificationPanel guildId={data.discordGuildId} />

// AFTER: Add key to force remount
<SetupVerificationPanel
    key={templateCreatedSuccess ? 'verified' : 'unverified'}
    guildId={data.discordGuildId}
/>
```

---

## Test Checklist

- [ ] Create channels → Success message appears
- [ ] Create channels → Permission guide appears
- [ ] Create channels → SetupVerificationPanel auto-verifies
- [ ] Cancel/error → State resets properly
- [ ] Reload page → Channels still selected
- [ ] Manual permission guide verification works

---

## Key Takeaway

**Root issue**: State synchronization gap between what the user sees (UI) and what actually happened (channels created).

**Solution**: Add a state flag (`templateCreatedSuccess`) to tell the component "channels were just created, show the dependent UI now."
