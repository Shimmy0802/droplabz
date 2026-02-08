# Visual Issue Reference - StepVerificationSocials.tsx

## Component Map with Issue Locations

```
┌─────────────────────────────────────────────────────────────────────┐
│ StepVerificationSocials Component                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ STATE DECLARATIONS (Lines 19-23)                                    │
│ ├── [channels]                    ✅ Good                            │
│ ├── [isLoadingChannels]           ✅ Good                            │
│ ├── [channelError]                ✅ Good                            │
│ ├── [isCreatingTemplate]          ✅ Good                            │
│ ├── [templateError]               ✅ Good                            │
│ └── [templateCreatedSuccess]      ❌ MISSING (Issue #1)             │
│                                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ EFFECTS (Lines 48-50)                                               │
│ └── useEffect(                                                       │
│       () => { fetchChannels(); },                                   │
│       [fetchChannels]  ❌ ISSUE #3 - Should be [data.discordGuildId]
│     )                                                                │
│                                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ HANDLERS (Lines 54-95)                                              │
│ └── handleCreateTemplate()                                          │
│     ├── Fetch: POST /api/discord/setup-channels ✅ Good           │
│     ├── Parse response                          ✅ Good           │
│     ├── Update channel IDs with onUpdate()      ✅ Good           │
│     ├── fetchChannels()                         ✅ Good           │
│     ├── setTemplateCreatedSuccess(true)         ❌ MISSING (Issue #2)
│     ├── Handle errors                           ✅ Good           │
│     └── setTemplateCreatedSuccess(false)        ❌ MISSING (Issue #2)
│                                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ DISCORD SERVER SETUP SECTION (Lines 101-170)                       │
│ ├── Shows guild ID or connection button ✅ Good                    │
│ └── Error display                      ✅ Good                    │
│                                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ CHANNEL MODE SELECTION (Lines 172-310)                             │
│ ├── Radio buttons (premade/custom)     ✅ Good                    │
│ └── Conditional render on mode         ✅ Good                    │
│                                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ IF MODE = "PREMADE" (Lines 296-337)                                │
│ ├── Create button                      ✅ Good                    │
│ ├── Error message                      ✅ Good                    │
│ ├── Success message                    ❌ MISSING (Issue #6)      │
│ └── Permission guide section (Lines 310-333)                       │
│     └── {templateCreatedSuccess && (   ❌ MISSING WRAPPER (Issue #4)
│            <PermissionSetupGuide />                                │
│         )}                                                          │
│                                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ SETUP VERIFICATION STATUS SECTION (Lines 372-390)                  │
│ ├── Conditional: if (data.discordGuildId)      ✅ Good           │
│ ├── Render title                               ✅ Good           │
│ └── SetupVerificationPanel                                         │
│     └── guildId={data.discordGuildId}         ⚠️ ISSUE #5       │
│        key={templateCreatedSuccess ? ...}      ❌ MISSING        │
│                                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ TWITTER SECTION (Lines 389-408)                                    │
│ ├── Input field                        ✅ Good                    │
│ └── Error display                      ✅ Good                    │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## State Flow Diagram

### Current (Broken)

```
Input Event
  ↓
User changes mode to 'premade'
  ↓
onUpdate({ discordChannelMode: 'premade' })
  ↓
Parent updates data
  ↓
Component re-renders
  ↓
"Create Channels" button visible ✅
  ↓
User clicks button
  ↓
handleCreateTemplate()
  ├─ POST /api/discord/setup-channels ✅
  ├─ Parse response ✅
  ├─ onUpdate({ channel IDs }) ✅
  ├─ setTemplateCreatedSuccess(true) ❌ MISSING
  ├─ fetchChannels() ✅
  └─ Return
  ↓
Component re-renders
  ↓
templateCreatedSuccess = false (never set)
  ↓
Permission guide: {false && (...)} = hidden ❌
Success message: {false && (...)} = hidden ❌
SetupVerificationPanel: Same guildId = no re-verify ❌
  ↓
User sees nothing changed ❌
```

### Fixed

```
Input Event
  ↓
User changes mode to 'premade'
  ↓
onUpdate({ discordChannelMode: 'premade' })
  ↓
Parent updates data
  ↓
Component re-renders
  ↓
"Create Channels" button visible ✅
  ↓
User clicks button
  ↓
handleCreateTemplate()
  ├─ POST /api/discord/setup-channels ✅
  ├─ Parse response ✅
  ├─ onUpdate({ channel IDs }) ✅
  ├─ setTemplateCreatedSuccess(true) ✅ NEW
  ├─ fetchChannels() ✅
  └─ Return
  ↓
Component re-renders
  ↓
templateCreatedSuccess = true ✅
  ↓
Success message: {true && (...)} = visible ✅
Permission guide: {true && (...)} = visible ✅
SetupVerificationPanel: key changed = re-mounts ✅
  ↓
SetupVerificationPanel useEffect triggers
  ↓
Verification check runs
  ↓
Results displayed ✅
  ↓
User sees: Success message + Guide + Verification ✅
```

---

## Props Flow Analysis

```
CommunityCreationWizard
  │
  ├─ data: WizardData
  │  ├─ discordGuildId: string
  │  ├─ discordChannelMode: 'premade' | 'custom'
  │  ├─ discordAnnouncementChannelId: string
  │  ├─ discordGiveawayChannelId: string
  │  └─ discordGiveawayEntryChannelId: string
  │
  ├─ onUpdate: (updates: Partial<WizardData>) => void
  │  └─ Called by: handleCreateTemplate()
  │     Updates: Channel IDs
  │
  ├─ clearError: (field: string) => void
  │
  └─→ StepVerificationSocials
      │
      ├─ Receives: data, onUpdate, clearError
      │
      ├─ Internal State:
      │  ├─ [channels] ✅
      │  ├─ [isLoadingChannels] ✅
      │  ├─ [channelError] ✅
      │  ├─ [isCreatingTemplate] ✅
      │  ├─ [templateError] ✅
      │  └─ [templateCreatedSuccess] ❌ MISSING
      │
      └─→ SetupVerificationPanel
          │
          ├─ Receives: guildId (from data.discordGuildId) ✅
          │
          ├─ Problem: No way to signal "re-verify"
          │
          └─ Solution: Pass key prop to force remount ✅
```

---

## Rendering Decision Tree

```
Component renders
  │
  ├─ discordGuildId is set? NO
  │  └─ Show: "Connect Discord server" ✅
  │
  └─ discordGuildId is set? YES
     │
     ├─ Show: Channel mode selection ✅
     │
     ├─ discordChannelMode === 'premade'? NO
     │  └─ Show: Channel select dropdowns ✅
     │
     └─ discordChannelMode === 'premade'? YES
        │
        ├─ Show: Create channels button ✅
        │
        ├─ templateCreatedSuccess? NO
        │  └─ DON'T show: Success message ❌ (needs state)
        │  └─ DON'T show: Permission guide ❌ (needs state)
        │
        └─ templateCreatedSuccess? YES
           ├─ Show: Success message ✅ (after fix)
           └─ Show: Permission guide ✅ (after fix)

        ├─ Always show: SetupVerificationPanel ✅
        │  └─ Problem: Doesn't re-verify after creation ❌
        │  └─ Fix: Add key to force remount ✅
```

---

## Data Flow Timing

```
Timeline: Channel Creation

T=0s: User clicks "Create Channels"
     handleCreateTemplate() called
     isCreatingTemplate = true

T=0.1s: API request sent
        POST /api/discord/setup-channels

T=0.5s: Server response received
        Channels created in Discord ✅
        Response includes channel IDs

T=0.6s: Response processed
        onUpdate() called for each channel ID
        setTemplateCreatedSuccess(true) ❌ MISSING
        fetchChannels() called

T=0.7s: Channels list fetched from API
        setChannels([...]) updates

T=0.8s: Component re-renders
        Permission guide: Hidden ❌ (no success flag)
        SetupVerificationPanel: No re-verify ❌ (guildId unchanged)

T=2.0s: User gets no feedback ❌
        Must manually click "Verify Setup" button ❌
```

### With Fixes

```
T=0.6s: Response processed
        onUpdate() called for each channel ID ✅
        setTemplateCreatedSuccess(true) ✅ NEW
        fetchChannels() called

T=0.7s: Channels list fetched
        setChannels([...]) updates
        SetupVerificationPanel key changes → remount

T=0.8s: Component re-renders
        Permission guide: Visible ✅
        SetupVerificationPanel: New instance created
        SetupVerificationPanel.useEffect triggers checkSetup()

T=0.9s: Verification check runs
        Results fetched from API

T=1.0s: Component re-renders again
        Success message: Visible ✅
        Permission guide: Visible ✅
        Verification results: Visible ✅

T=1.2s: User gets complete feedback ✅
        No manual action needed ✅
```

---

## Issue Impact Matrix

```
Issue #1 (Missing state)
  ├─ Blocks: Issue #4, #5, #6
  ├─ Severity: CRITICAL
  └─ Impact: Nothing can work without this

Issue #2 (handleCreateTemplate incomplete)
  ├─ Depends on: Issue #1
  ├─ Blocks: Issue #4, #5, #6
  ├─ Severity: CRITICAL
  └─ Impact: State never updated

Issue #3 (useEffect circular)
  ├─ Depends on: Nothing
  ├─ Blocks: Nothing directly
  ├─ Severity: HIGH
  └─ Impact: Extra re-renders, potential issues

Issue #4 (Permission guide always shows)
  ├─ Depends on: Issue #1, #2
  ├─ Blocks: Nothing
  ├─ Severity: HIGH
  └─ Impact: Bad UX, guide shows before ready

Issue #5 (SetupVerificationPanel doesn't re-verify)
  ├─ Depends on: Issue #1, #2
  ├─ Blocks: Nothing
  ├─ Severity: CRITICAL
  └─ Impact: User must manually verify

Issue #6 (No success feedback)
  ├─ Depends on: Issue #1, #2
  ├─ Blocks: Nothing
  ├─ Severity: MEDIUM
  └─ Impact: User confusion
```
