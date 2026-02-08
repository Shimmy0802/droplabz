# DropLabz Winner Announcement System Investigation

**Date**: February 6, 2026  
**Status**: Investigation Complete  
**Focus**: Giveaway Completion Flow, Winner Selection, and Discord Announcements

---

## Executive Summary

DropLabz has a **functional winner selection flow** but lacks a **complete winner announcement system** for Discord. Winners can be selected manually or randomly, but there's no dedicated endpoint to automatically post winner announcements to Discord channels. The infrastructure exists but needs implementation.

### Key Finding:

**Winner announcement to Discord is NOT currently implemented**. Only event creation/status announcements are supported via the `/announce` endpoint.

---

## 1. Current Giveaway Completion Flow

### Winner Selection Methods

The system supports **three selection modes** (Event model in schema.prisma):

```prisma
selectionMode  String   @default("RANDOM") // RANDOM | MANUAL | FCFS
```

#### A. RANDOM Mode (Manually Triggered)

- **Endpoint**: `POST /api/events/[eventId]/winners/draw`
- **Flow**:
    1. Admin calls `/draw` endpoint
    2. System queries all VALID, non-ineligible entries not already winners
    3. Random selection algorithm picks X entries (default: fill remaining spots)
    4. Creates `Winner` records linked to `Entry` records
    5. Returns selected winners with wallet/Discord info

**Code Location**: [apps/web/src/app/api/events/[eventId]/winners/draw/route.ts](apps/web/src/app/api/events/[eventId]/winners/draw/route.ts)

**Key Logic**:

```typescript
// Get eligible entries (VALID status, not ineligible, not already winners)
const eligibleEntries = await db.entry.findMany({
    where: {
        eventId,
        status: 'VALID',
        isIneligible: false,
        id: { notIn: [...existingWinnerEntryIds, ...excludeEntryIds] },
    },
});

// Randomly select winners
const shuffled = eligibleEntries.sort(() => Math.random() - 0.5);
const selectedEntries = shuffled.slice(0, Math.min(drawCount, eligibleEntries.length));

// Create winner records
const winners = await db.winner.createMany({
    data: selectedEntries.map(entry => ({
        eventId,
        entryId: entry.id,
        pickedBy: user.id,
    })),
});
```

#### B. MANUAL Mode (Admin Selection)

- **Endpoint**: `POST /api/events/[eventId]/winners`
- **Flow**:
    1. Admin specifies exact entry IDs to mark as winners
    2. System validates all entries are VALID and not ineligible
    3. Creates `Winner` records for specified entries

**Code Location**: [apps/web/src/app/api/events/[eventId]/winners/route.ts](apps/web/src/app/api/events/[eventId]/winners/route.ts)

#### C. FCFS Mode (Automatic on Submission)

- **Automatic**: Winners assigned when entry is submitted
- **Endpoint**: `POST /api/entries` (see GiveawayEntryPage.tsx)
- **Flow**:
    1. User submits entry
    2. Entry verified (VALID status)
    3. If position <= maxWinners: auto-create Winner record
    4. User redirected to `/giveaways/[eventId]/success`

---

## 2. Winner Data Storage

### Database Schema

#### Winner Model

```prisma
model Winner {
  id        String   @id @default(cuid())
  eventId   String
  entryId   String
  pickedAt  DateTime @default(now())
  pickedBy  String
  createdAt DateTime @default(now())

  event Event  @relation(fields: [eventId], references: [id], onDelete: Cascade)
  entry Entry  @relation(fields: [entryId], references: [id], onDelete: Cascade)

  @@index([eventId])
  @@index([entryId])
}
```

#### Entry Model (Links to Winner)

```prisma
model Entry {
  id            String   @id @default(cuid())
  eventId       String
  userId        String?
  discordUserId String?      // Discord user ID (can be used for mentions)
  walletAddress String       // Solana wallet (winner identifier)
  status        String   @default("PENDING") // PENDING | VALID | INVALID
  isIneligible  Boolean  @default(false)
  ineligibilityReason String?
  metadata      Json?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  event   Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  winners Winner[]
}
```

#### Event Model (Winner Settings)

```prisma
model Event {
  // ... other fields ...
  maxWinners     Int      @default(1)
  reservedSpots  Int      @default(0)
  selectionMode  String   @default("RANDOM") // RANDOM | MANUAL | FCFS

  // Discord-specific fields
  autoAssignDiscordRole Boolean @default(false)
  winnerDiscordRoleId   String? // Role to assign to winners
  mentionRoleIds        String[] @default([]) // Roles to mention in announcement
  autoAnnounceWinners   Boolean @default(false) // **FLAG but NOT IMPLEMENTED**
  customAnnouncementLine String? // Custom text for announcement

  winners Winner[]
}
```

### Key Observation

**`autoAnnounceWinners` field exists but is not used anywhere in the codebase**. This indicates winner announcements were planned but not implemented.

---

## 3. Discord Bot Capabilities

### Current Bot Architecture

**File**: [apps/bot/src/index.ts](apps/bot/src/index.ts)

#### A. HTTP Endpoints Available

| Endpoint                          | Purpose                             | Status             |
| --------------------------------- | ----------------------------------- | ------------------ |
| `POST /announce`                  | Post event embed to Discord         | ✅ Implemented     |
| `POST /setup-channels`            | Create DropLabz category & channels | ✅ Implemented     |
| `POST /check-channel-permissions` | Verify bot permissions              | ✅ Implemented     |
| `POST /verify-server-setup`       | Full setup verification             | ✅ Implemented     |
| `POST /announce-winners`          | **Winner announcement**             | ❌ NOT IMPLEMENTED |

#### B. Available Discord Channels

When setup wizard runs (`/setup-channels`), these channels are created:

```typescript
const desiredChannels = [
    { key: 'announcements', name: 'announcements' }, // Event announcements
    { key: 'giveaways', name: 'giveaways' }, // Giveaway posts
    { key: 'giveaway-entries', name: 'giveaway-entries' }, // Entry confirmations
    { key: 'winners', name: 'winners' }, // **EMPTY - No announcements posted here**
    { key: 'admin', name: 'droplabz-admin' }, // Admin logs
];
```

**Note**: The `#winners` channel exists but is never populated with winner announcements.

#### C. Event Announcement System (Currently Working)

**Handler**: [apps/bot/src/handlers/announce.ts](apps/bot/src/handlers/announce.ts)

The `announceEvent()` function:

```typescript
export async function announceEvent(
    client: Client,
    guildId: string,
    channelId: string,
    embedData: AnnouncementData | any,
    options?: AnnouncementOptions,
): Promise<{ messageId: string; url: string }>;
```

**Capabilities**:

- ✅ Fetches guild and channel by ID
- ✅ Validates channel is text channel
- ✅ Builds rich embeds with images, fields, footer
- ✅ Supports role mentions (via `allowedMentions.roles`)
- ✅ Returns message ID and URL
- ✅ Comprehensive error handling

**Could be reused** for winner announcements with minimal changes.

---

## 4. Event-Discord Linkage

### Community ↔ Discord Guild Mapping

**Community Model** ([apps/web/prisma/schema.prisma](apps/web/prisma/schema.prisma)):

```prisma
model Community {
  // ... other fields ...

  guildId                       String?  @unique  // Discord guild ID
  discordGuildName              String?  // Display name

  // Channel IDs (populated during setup)
  discordAnnouncementChannelId  String?  // #announcements
  discordAnnouncementChannelName String?
  discordGiveawayChannelId      String?  // #giveaways
  discordGiveawayChannelName    String?
  discordGiveawayEntryChannelId String?  // #giveaway-entries
  discordGiveawayEntryChannelName String?
  discordWinnerChannelId        String?  // #winners
  discordWinnerChannelName      String?
  discordAdminChannelId         String?  // #droplabz-admin
  discordAdminChannelName       String?
}
```

### Event ↔ Winner Channel Flow

**Current Flow** (Incomplete):

1. Event created with `guildId` inherited from Community
2. Event stores Discord role IDs for winner role assignment
3. Winners selected → Winner records created
4. **MISSING**: No code triggers announcement to Discord

**What Should Happen**:

```
Winner Selected
    ↓
Check event.autoAnnounceWinners flag
    ↓
Fetch community.discordWinnerChannelId
    ↓
Call bot /announce-winners endpoint (NOT YET IMPLEMENTED)
    ↓
Bot posts winner list to #winners channel
    ↓
If autoAssignDiscordRole: Bot assigns role to winners
```

---

## 5. Winner Announcement Requirements

### What Information Should Be Included

Based on Entry data available:

```typescript
interface WinnerData {
    walletAddress: string; // Primary identifier
    discordUserId?: string; // For mentions: <@DISCORD_ID>
    status: string; // Should be VALID
}
```

### Proposed Winner Announcement Embed Format

```typescript
interface WinnerAnnouncementEmbed {
    title: string; // "🎉 [Event Title] - Winners Announced"
    description: string; // "Congratulations to our winners!"
    fields: [
        {
            name: 'Winners Selected';
            value: '- Wallet 1 (50+ char Solana address)\n- Wallet 2\n...';
            inline: false;
        },
        {
            name: 'Total Winners';
            value: '3 / 10 spots filled';
            inline: true;
        },
        {
            name: 'Selection Mode';
            value: event.selectionMode;
            inline: true;
        },
    ];
    color: 0x00ff41; // Brand green
}
```

### Discord Permissions Needed

Bot must have:

- ✅ `SendMessages` - Post to #winners
- ✅ `EmbedLinks` - Format embeds
- ✅ `ManageRoles` - Assign winner role (if enabled)

Both already verified in existing setup flow.

### Optional Features

1. **Discord Role Assignment**
    - `autoAssignDiscordRole` flag exists
    - `winnerDiscordRoleId` stored in event
    - Requires bot to have role assignment permissions (already checked)
    - Implementation: Call `guild.members.fetch(discordUserId); member.roles.add(roleId)`

2. **Role Mentions in Announcement**
    - `mentionRoleIds` array exists in Event model
    - Can ping team/admins when winners announced
    - Already supported in current `announceEvent()` function

3. **Custom Announcement Line**
    - `customAnnouncementLine` field exists
    - Can override auto-generated text
    - Example: "Special thanks to our sponsors!"

---

## 6. Current Announcement System Details

### Event Creation Auto-Announce

**Code**: [apps/web/src/app/api/events/route.ts:145-180](apps/web/src/app/api/events/route.ts)

```typescript
// Auto-announce to Discord if ACTIVE and Discord is configured
const shouldAnnounce =
    status === 'ACTIVE' && community.guildId && community.discordAnnouncementChannelId && type === 'GIVEAWAY';

if (shouldAnnounce) {
    // Calls postAnnouncementToBot internally
    const botResponse = await postAnnouncementToBot(event);
    console.log(`Auto-announced giveaway ${event.id} to Discord`);
}
```

### Manual Announcement Endpoint

**Endpoint**: `POST /api/events/[eventId]/announce`  
**Code**: [apps/web/src/app/api/events/[eventId]/announce/route.ts](apps/web/src/app/api/events/[eventId]/announce/route.ts)

**Features**:

- ✅ Authentication required
- ✅ Validates Discord is configured
- ✅ Rate limiting (10 per hour)
- ✅ Creates EventAnnouncement record for tracking
- ✅ Supports scheduled announcements (future feature)
- ✅ Calls bot via `/announce` endpoint
- ✅ Logs audit trail

**Triggers** (AnnouncementTrigger enum):

```prisma
enum AnnouncementTrigger {
  MANUAL
  CREATED
  ACTIVE
  ENDING_SOON
  WINNERS_PICKED  // <-- Exists but not used
  CLOSED
}
```

---

## 7. EventAnnouncement Tracking Model

```prisma
model EventAnnouncement {
  id              String   @id @default(cuid())
  eventId         String
  communityId     String

  trigger         AnnouncementTrigger             // MANUAL, CREATED, WINNERS_PICKED, etc.
  status          AnnouncementStatus @default(QUEUED)  // QUEUED, SENT, FAILED

  discordMessageId String?           // Message posted to Discord
  discordChannelId String?           // Which channel
  discordGuildId   String?

  scheduledFor    DateTime @default(now())
  sentAt          DateTime?

  attemptCount    Int      @default(0)
  maxAttempts     Int      @default(3)
  lastError       String?

  triggeredBy     String?   // User who triggered it

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

This model **already supports tracking winner announcements** if we implement them.

---

## Files That Need Modification

### To Implement Winner Announcements:

1. **Bot API Endpoint** (NEW)
    - **File**: `apps/bot/src/index.ts`
    - **Add**: `POST /announce-winners` endpoint
    - **Function**: Call existing `announceEvent()` handler

2. **Web Announcement Endpoint** (NEW)
    - **File**: `apps/web/src/app/api/events/[eventId]/announce-winners/route.ts`
    - **Function**: Accept event ID, build winner embed, call bot
    - **Triggers**: Manual or when winners picked

3. **Winner Selection Endpoints** (MODIFY)
    - **Files**:
        - `apps/web/src/app/api/events/[eventId]/winners/draw/route.ts`
        - `apps/web/src/app/api/events/[eventId]/winners/route.ts`
    - **Modification**: Call new announce-winners endpoint if `autoAnnounceWinners=true`

4. **Auto-Draw Scheduler** (MODIFY - if exists)
    - **File**: Likely `apps/web/src/components/admin/AutoDrawScheduler.tsx`
    - **Modification**: Trigger winner announcement after auto-draw completes

5. **Admin UI** (MODIFY)
    - **File**: `apps/web/src/app/profile/communities/[slug]/admin/giveaways/[giveawayId]/page.tsx`
    - **Modification**: Add "Announce Winners" button in Winners tab

6. **Helper Functions** (NEW)
    - **File**: `apps/web/src/lib/utils/event-embed-helpers.ts`
    - **Add**: `buildWinnerAnnouncementEmbed()` function

---

## Implementation Path (Recommended Order)

### Phase 1: Bot Capability (Backend)

1. Add `POST /announce-winners` endpoint to bot
2. Reuse existing `announceEvent()` handler
3. Handle role assignment if enabled

### Phase 2: Web API (Backend)

1. Create `POST /api/events/[eventId]/announce-winners` endpoint
2. Fetch winners with entry data
3. Build winner announcement embed
4. Call bot endpoint
5. Create EventAnnouncement record with WINNERS_PICKED trigger

### Phase 3: Auto-Announcement Integration

1. Modify `/winners/draw` and `/winners` endpoints
2. Check `autoAnnounceWinners` flag
3. If true, call announce-winners endpoint
4. Handle errors gracefully (don't fail winner selection if announcement fails)

### Phase 4: UI (Frontend)

1. Add "Announce Winners to Discord" button in Winners tab
2. Show success/error toast
3. Display last announcement timestamp
4. Add winner announcement preview

---

## Current Owner Communication & Implementation Notes

### Auto-Announce Flag Already Exists

- Field: `Event.autoAnnounceWinners` (Boolean)
- Status: **Visible in admin UI but not functional**
- Location: [apps/web/src/app/profile/communities/[slug]/admin/giveaways/[giveawayId]/page.tsx:523](apps/web/src/app/profile/communities/[slug]/admin/giveaways/[giveawayId]/page.tsx)

```tsx
<div className="flex items-center justify-between py-2 border-b border-gray-700">
    <span className="text-gray-300 text-sm">Auto-Announce Winners</span>
    <span className={`text-xs font-semibold ${event.autoAnnounceWinners ? 'text-[#00ff41]' : 'text-gray-500'}`}>
        {event.autoAnnounceWinners ? 'ENABLED' : 'DISABLED'}
    </span>
</div>
```

**This shows admins an ON/OFF toggle but the feature doesn't work yet.**

---

## Discord Bot Commands Available

### Current Commands

1. `/droplabz setup` - Configure Discord
2. `/droplabz post <eventId>` - Post event manually
3. `/droplabz close <eventId>` - Trigger verification refresh

### Winner-Related Commands (Not Yet)

- `/droplabz announce-winners <eventId>` (Could be added)

---

## Data Flow Diagram

```
Winner Selected (Manual/Random/FCFS)
    ↓
POST /api/events/[eventId]/winners/draw
    ↓
✅ Winner records created in DB
    ↓
Check event.autoAnnounceWinners
    ├─→ FALSE: Stop (admin can announce manually later)
    │
    └─→ TRUE: POST /api/events/[eventId]/announce-winners
            ↓
        ✅ Fetch winners with entry data
            ↓
        ✅ Build winner announcement embed
            ↓
        ✅ POST to bot: /announce
            ↓
        ✅ Bot posts to #winners channel
            ↓
        ✅ If autoAssignDiscordRole: Assign role
            ↓
        ✅ Create EventAnnouncement record
            ↓
        ✅ Return success to frontend
```

---

## Questions Answered

### 1. How are giveaway winners currently selected?

- **Random**: Call `/winners/draw` to randomly select from eligible entries
- **Manual**: Call `/winners` with specific entry IDs
- **FCFS**: Auto-assigned when entry submitted and spots available

### 2. Is there an endpoint to pick winners/mark giveaway as closed?

- ✅ `/winners/draw` - Random draw
- ✅ `/winners` - Manual selection
- ❌ No dedicated "close giveaway" endpoint (status updated via event update)
- ❌ No dedicated "announce winners" endpoint

### 3. Where is winner selection triggered?

- Admin dashboard tab (Winners section)
- Auto-draw scheduler component (if scheduled)
- Entry submission endpoint (for FCFS mode)

### 4. How are winners stored in the database?

- `Winner` model with `eventId`, `entryId`, `pickedBy`, `pickedAt`
- Winner data linked to Entry which contains `walletAddress` and `discordUserId`

### 5. Are there winner selection modes?

- ✅ RANDOM, MANUAL, FCFS (all supported)
- ✅ Fields for configuration exist (`maxWinners`, `reservedSpots`, `selectionMode`)

### 6. Can the bot post messages to Discord text channels?

- ✅ Yes, fully implemented in `announceEvent()` handler
- ✅ Already used for event announcements
- ✅ Supports embeds, role mentions, custom content

### 7. How does the bot know which channel to post to?

- Guild ID stored in `Community.guildId`
- Channel IDs stored in `Community.discordAnnouncementChannelId`, etc.
- Passed via API call from web to bot

### 8. Is there a winner announcement system?

- ❌ **No** - This is the missing piece
- ✅ Infrastructure exists (channels, bot capability, embeds)
- ✅ Event model has flags (`autoAnnounceWinners`, `customAnnouncementLine`)
- ❌ No endpoint to trigger announcement
- ❌ No UI button to announce winner

---

## Summary Table

| Component                 | Status         | Notes                                    |
| ------------------------- | -------------- | ---------------------------------------- |
| Winner selection (Random) | ✅ Complete    | `/winners/draw` endpoint working         |
| Winner selection (Manual) | ✅ Complete    | `/winners` endpoint working              |
| Winner selection (FCFS)   | ✅ Complete    | Auto-assign on entry submission          |
| Winner data storage       | ✅ Complete    | Winner model with full relationships     |
| Discord bot connectivity  | ✅ Complete    | HTTP API fully functional                |
| Event→Discord mapping     | ✅ Complete    | Community.guildId + channel IDs          |
| General announcements     | ✅ Complete    | `/announce` endpoint working             |
| **Winner announcements**  | ❌ **MISSING** | Needs new `/announce-winners` endpoint   |
| Admin UI for winners      | ✅ Partial     | Shows winners, missing "announce" button |
| Auto-announce flag        | ⚠️ UI Only     | Field exists but not implemented         |
| Discord role assignment   | ✅ Ready       | Bot has permissions, just needs code     |
| Winner tracking (DB)      | ✅ Complete    | EventAnnouncement model supports it      |

---

## Next Steps

1. **Implement Bot Endpoint** → Add POST /announce-winners to bot HTTP API
2. **Implement Web Endpoint** → Create POST /api/events/[eventId]/announce-winners
3. **Wire Up Auto-Announcement** → Call from winner selection endpoints
4. **Add UI Controls** → "Announce Winners" button in admin panel
5. **Test End-to-End** → Manual draw → Discord announcement → Verify message
