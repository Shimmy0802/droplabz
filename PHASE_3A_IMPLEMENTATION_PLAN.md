# Phase 3a Implementation Plan: Community Admin Page Refactor

**File**: `apps/web/src/app/profile/communities/[slug]/admin/page.tsx`  
**Status**: CRITICAL Priority  
**Estimated Effort**: 10 hours (being done in chunks)  
**Objective**: Convert 24 useState calls to useReducer + split into subcomponents

---

## Current State

### State Variables (24 total)

**Core Data**:

- community: Community | null
- loading: boolean
- error: string | null
- tab: 'overview' | 'whitelists' | 'giveaways' | 'presales' | 'members' | 'settings'

**Discord Guild**:

- discordGuilds: DiscordGuild[]
- showGuildSelector: boolean
- loadingGuilds: boolean
- linkingGuild: boolean

**Discord Channel**:

- discordChannels: DiscordChannel[]
- showChannelSelector: boolean
- loadingChannels: boolean
- selectingChannel: boolean

**Whitelist**:

- whitelists: Whitelist[]
- loadingWhitelists: boolean
- showCreateWhitelist: boolean

**UI**:

- toggling: boolean

---

## Target Refactor Strategy

### Step 1: Create Admin Reducer Hook

Create `useAdminPageState` hook with combined reducer managing:

- Current tab
- Load/error states
- Discord integration state
- Modal visibility
- Data state (community, guilds, channels, whitelists)

### Step 2: Create Subcomponents

Split page into:

1. **OverviewTab.tsx** - Community stats + quick actions
2. **DiscordIntegrationPanel.tsx** - Guild + channel selection
3. **WhitelistsTab.tsx** - List + create whitelist
4. **GiveawaysTab.tsx** - Existing code (minimal changes)
5. **MembersTab.tsx** - User management
6. **SettingsTab.tsx** - Community settings

### Step 3: Extract Reusable Hooks

- `useCommunityData(slug)` - Fetch + cache community
- `useDiscordIntegration(communityId)` - Guild/channel logic
- `useWhitelists(communityId)` - Fetch + manage whitelists

### Step 4: Implement Navigation

Replace hash-based navigation with proper route-based tabs

---

## Reducer Shape (Draft)

```typescript
interface AdminPageState {
    // Current page
    tab: 'overview' | 'whitelists' | 'giveaways' | 'presales' | 'members' | 'settings';

    // Core data
    community: Community | null;
    error: string | null;
    isLoading: boolean;

    // Discord guild panel
    discord: {
        guilds: DiscordGuild[];
        channels: DiscordChannel[];
        showGuildSelector: boolean;
        showChannelSelector: boolean;
        isLoadingGuilds: boolean;
        isLoadingChannels: boolean;
        isLinking: boolean;
    };

    // Whitelist panel
    whitelists: {
        items: Whitelist[];
        isLoading: boolean;
        showCreate: boolean;
    };

    // UI state
    ui: {
        isToggling: boolean;
    };
}

type AdminAction =
    | { type: 'SET_TAB'; payload: AdminPageState['tab'] }
    | { type: 'SET_COMMUNITY'; payload: Community }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'DISCORD_OPEN_GUILD_SELECTOR' }
    | { type: 'DISCORD_CLOSE_GUILD_SELECTOR' }
    | { type: 'DISCORD_SET_GUILDS'; payload: DiscordGuild[] }
    | { type: 'DISCORD_LINK_GUILD_START' }
    | { type: 'DISCORD_LINK_GUILD_SUCCESS'; payload: { guildId: string; guildName: string } }
    | { type: 'DISCORD_OPEN_CHANNEL_SELECTOR'; payload: DiscordChannel[] }
    | { type: 'DISCORD_SELECT_CHANNEL_START' }
    | { type: 'DISCORD_SELECT_CHANNEL_SUCCESS'; payload: { channelId: string; channelName: string } }
    | { type: 'WHITELISTS_SET'; payload: Whitelist[] }
    | { type: 'WHITELISTS_SET_LOADING'; payload: boolean }
    | { type: 'WHITELISTS_SHOW_CREATE' }
    | { type: 'WHITELISTS_HIDE_CREATE' }
    | { type: 'UI_START_TOGGLE' }
    | { type: 'UI_END_TOGGLE' };
```

---

## Implementation Sequence

### Phase 3a-i (Chunk 1): Create Reducer Hook

- Create `/apps/web/src/hooks/useAdminPageState.ts`
- Implement AdminPageState interface
- Implement reducer function
- Add action dispatchers

### Phase 3a-ii (Chunk 2): Create Subcomponents

- Create `/apps/web/src/components/admin/OverviewTab.tsx`
- Create `/apps/web/src/components/admin/DiscordIntegrationPanel.tsx`
- Create `/apps/web/src/components/admin/WhitelistsTabContent.tsx`

### Phase 3a-iii (Chunk 3): Refactor Main Page

- Replace useState with useReducer hook
- Connect subcomponents
- Test all workflows

### Phase 3a-iv (Chunk 4): Extract Reusable Hooks

- Create `useCommunityData` hook
- Create `useDiscordIntegration` hook
- Create `useWhitelists` hook

---

## Expected Outcomes

**Before**:

- 24 useState calls scattered throughout
- 1024 lines in single component
- Complex state management
- Difficult to test
- Hard to reuse logic

**After**:

- 1 useReducer + 3 reusable hooks
- Main page: ~300 lines
- Subcomponents: 100-150 lines each
- Clear separation of concerns
- Testable reducer logic
- Reusable data hooks

**Metrics**:

- Code quality: 5/10 → 9/10
- UX impact: 6/10 (cleaner, fewer bugs)
- Maintainability: 4/10 → 8/10

---

## Version Control Plan

**Commit Strategy**:

- Chunk 1: `Phase 3a-i: Create useAdminPageState reducer hook`
- Chunk 2: `Phase 3a-ii: Extract subcomponents (Overview, Discord, Whitelists)`
- Chunk 3: `Phase 3a-iii: Refactor main page to use useReducer + subcomponents`
- Chunk 4: `Phase 3a-iv: Extract reusable hooks (Community, Discord, Whitelists)`

**Verification After Each Chunk**:

- pnpm build
- pnpm type-check
- Manual testing in browser

---

_Ready to begin Phase 3a-i: Create reducer hook_
