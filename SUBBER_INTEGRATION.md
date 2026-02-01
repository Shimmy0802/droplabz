# Subber-Inspired Features Integration

## Overview

This document outlines the integration of features inspired by Subber Docs research into the DropLabz platform. These enhancements maintain DropLabz's infrastructure-first approach while adding powerful operational tools for community admins.

## Central Documentation Set

- [SUBBER_INTEGRATION.md](./SUBBER_INTEGRATION.md) — Full integration overview (this document)
- [SUBBER_INTEGRATION_QUICK_REF.md](./SUBBER_INTEGRATION_QUICK_REF.md) — Operator quick reference
- [SUBBER_INTEGRATION_VERIFICATION_REPORT.md](./SUBBER_INTEGRATION_VERIFICATION_REPORT.md) — Verification report

---

## What Subber Provides

**Subber** is a multi-chain community platform (20k+ communities, 850k+ users) offering:

- **Giveaway/Raffle/FCFS Management** with duplicate detection
- **Pre-mint Allowlist Coordination** with collaboration management
- **Discord Bot Integration** with auto role assignment
- **Member Access Passes** (Discord roles + NFT gating)
- **Presale Management** with tiered requirements
- **Wallet Collection & Export** tools for airdrops
- **Scheduled Auto-Draw** for raffles

**Key Philosophy**: "Subber's Giveaway feature is BY FAR the most viable, flexible tool for WL hunters... Accommodates any process, saves a ton of time, & eliminates fakes."

---

## Features Integrated into DropLabz

### 1. ✅ Duplicate Entry Detection

**Inspiration**: Subber "calling out potential dupes and letting you mark them as ineligible before drawing winners"

**Implementation**:

- `/api/events/[eventId]/entries/duplicates` — GET endpoint to analyze entries
- `/lib/utils/duplicate-detection.ts` — Detection engine with risk scoring
- `/components/admin/DuplicateDetectionPanel.tsx` — Admin UI component

**Detection Signals**:

- **Discord ID Reuse** (HIGH): Same Discord account with multiple wallets in one event
- **Multi-Event Participation** (LOW): Same wallet in 5+ events from community
- **Timing Patterns** (MEDIUM): 5+ entries within 1-minute window

**Risk Scoring**:

- 0-30: Low risk (likely legitimate)
- 31-60: Medium risk (review recommended)
- 61-100: High risk (likely duplicate)

**Admin Features**:

- View all flagged entries sorted by risk score
- See detailed signals for each flagged entry
- Bulk select and mark entries as ineligible
- Add custom ineligibility reasons

**Usage**:

```tsx
import { DuplicateDetectionPanel } from '@/components/admin/DuplicateDetectionPanel';

<DuplicateDetectionPanel eventId={eventId} onMarkIneligible={refreshData} />;
```

---

### 2. ✅ Entry Ineligibility Marking

**Inspiration**: Subber "mark them as ineligible before drawing winners"

**Implementation**:

- `/api/events/[eventId]/entries/mark-ineligible` — POST endpoint for bulk marking
- Schema fields: `isIneligible` (boolean), `ineligibilityReason` (string)
- Audit logging for all ineligibility actions

**Features**:

- Bulk mark multiple entries as ineligible
- Require reason for each action
- Ineligible entries excluded from winner draws
- Admin can still export ineligible entries for analysis
- All actions logged in `AuditLog`

**API Usage**:

```typescript
POST /api/events/{eventId}/entries/mark-ineligible
{
  "entryIds": ["cuid1", "cuid2", "cuid3"],
  "reason": "Suspected bot submissions - same IP address"
}
```

---

### 3. ✅ CSV Export (Entries & Winners)

**Inspiration**: Subber "export wallet addresses" and "full list ready to export for your airdrop or mint claim"

**Implementation**:

- `/api/events/[eventId]/export?type=winners|entries&includeIneligible=true|false` — GET endpoint
- `/components/admin/ExportButton.tsx` — Download button component
- CSV format with all relevant fields

**Export Types**:

- **Winners Only**: Wallet addresses + Discord IDs + timestamps
- **All Entries**: All entries with status, winner flag, ineligibility
- **Include Ineligible**: Toggle to include flagged entries in export

**CSV Columns**:

- Wallet Address
- Discord User ID
- Status (VALID/INVALID/PENDING)
- Is Winner (YES/NO)
- Is Ineligible (YES/NO)
- Ineligibility Reason
- Created At / Picked At timestamps

**Usage**:

```tsx
import { ExportButton } from '@/components/admin/ExportButton';

<ExportButton eventId={eventId} eventTitle="My Whitelist" type="winners" />;
```

---

### 4. ✅ Scheduled Auto-Draw

**Inspiration**: Subber "schedule it to run and auto-draw at specified times"

**Implementation**:

- `/api/events/[eventId]/auto-draw` — GET/POST endpoint for scheduling
- `/components/admin/AutoDrawScheduler.tsx` — Toggle UI component
- Backend cron job support (implementation note below)

**Features**:

- Enable/disable automatic winner drawing
- Winners drawn automatically when event `endAt` is reached
- FCFS events skip this (already automatic)
- Manual mode always available as fallback

**Cron Job Implementation** (Future):

```typescript
// Pseudo-code for background job
setInterval(async () => {
    const events = await db.event.findMany({
        where: {
            status: 'ACTIVE',
            selectionMode: { not: 'FCFS' },
            autoDrawEnabled: true,
            endAt: { lte: new Date() },
        },
    });

    for (const event of events) {
        await drawWinnersAutomatically(event.id);
    }
}, 60000); // Check every minute
```

**Usage**:

```tsx
import { AutoDrawScheduler } from '@/components/admin/AutoDrawScheduler';

<AutoDrawScheduler eventId={eventId} eventEndDate={event.endAt} selectionMode={event.selectionMode} />;
```

---

### 5. ✅ FCFS (First-Come-First-Served) Mode

**Inspiration**: Subber "FCFC winners will be automatically assigned as your members enter"

**Implementation**:

- Already integrated in `/api/entries/route.ts` (existing code)
- Winners auto-assigned immediately upon valid entry
- No manual drawing required
- Respects `maxWinners` and `reservedSpots` limits

**Features**:

- Instant winner assignment for valid entries
- Stops assigning when spots are filled
- No duplicate winner risk (one entry per wallet enforced)
- Perfect for time-sensitive access grants

**Flow**:

```text
1. User submits entry
2. Entry verified against requirements
3. If VALID and spots available → Auto-assign as winner
4. Discord role assigned (if configured)
5. User notified immediately
```

---

## File Structure

### New API Endpoints

```text
/apps/web/src/app/api/events/[eventId]/
├── entries/
│   ├── duplicates/route.ts       ✅ NEW: Duplicate detection
│   └── mark-ineligible/route.ts  ✅ NEW: Bulk ineligibility marking
├── export/route.ts               ✅ NEW: CSV export
└── auto-draw/route.ts            ✅ NEW: Scheduled auto-draw
```

### New Utilities

```text
/apps/web/src/lib/utils/
└── duplicate-detection.ts        ✅ NEW: Duplicate analysis engine
```

### New Components

```text
/apps/web/src/components/admin/
├── DuplicateDetectionPanel.tsx   ✅ NEW: Duplicate detection UI
├── ExportButton.tsx              ✅ NEW: CSV export button
├── AutoDrawScheduler.tsx         ✅ NEW: Auto-draw toggle
└── EventManagementDashboard.tsx  ✅ NEW: Unified admin dashboard
```

### Modified Files

```text
/apps/web/src/app/api/events/[eventId]/route.ts
  - Added `includeStats` query param
  - Returns detailed entry/winner statistics for dashboard
```

---

## How Community Admins Use These Features

### 1. Create Event with FCFS or Raffle Mode

```text
Admin Panel → Events → Create Event
- Choose selection mode: RANDOM, MANUAL, or FCFS
- FCFS = instant winners as entries arrive
- RANDOM/MANUAL = draw winners manually or on schedule
```

### 2. Monitor Entries and Detect Duplicates

```text
Admin Panel → Events → [Event] → Duplicate Detection Tab
- System automatically flags suspicious entries
- Review risk scores and signals
- Select flagged entries and mark as ineligible
- Add reason (e.g., "Same Discord ID across 3 wallets")
```

### 3. Schedule Auto-Draw (Optional)

```text
Admin Panel → Events → [Event] → Overview Tab
- Toggle "Enable Auto-Draw"
- Winners drawn automatically when event ends
- Or manually draw winners anytime before end
```

### 4. Export Winners for Airdrop/Mint

```text
Admin Panel → Events → [Event] → Export Tab
- Click "Export Winners CSV"
- Download file with all winner wallet addresses
- Use for:
  - Airdrop snapshots
  - Mint claim lists
  - On-chain allowlist programs
  - Record keeping
```

---

## Design System Compliance

All new components follow DropLabz design system:

### Colors

- **Primary Actions (Export, Draw)**: `#00ff41` (radioactive green)
- **Secondary Actions (View, Info)**: `#00d4ff` (electric blue)
- **Warnings (Duplicates)**: Yellow/orange accents
- **Errors (Ineligible)**: Red accents
- **Backgrounds**: `#0a0e27` (dark navy), `#111528` (card backgrounds)

### Typography

- **Headers**: Bold, white text
- **Body**: 14-16px, gray-300 to gray-400
- **Monospace**: Wallet addresses, IDs
- **Labels**: Uppercase sparingly for badges

### Components

- Cards: Dark background with subtle glow borders
- Buttons: Solid colors with hover states
- Badges: Low-opacity backgrounds with colored text
- Spacing: Consistent 8px/16px grid

---

## Differences from Subber

While inspired by Subber's features, DropLabz maintains its distinct approach:

| Feature                 | Subber                               | DropLabz                             |
| ----------------------- | ------------------------------------ | ------------------------------------ |
| **Platform Type**       | Public marketplace & discovery       | Infrastructure for community admins  |
| **Primary Users**       | WL hunters, community members        | Project admins, community operators  |
| **Community Discovery** | Central directory, featured listings | Opt-in listing (not primary focus)   |
| **Blockchain**          | Multi-chain (SOL, ETH, MATIC, etc.)  | Solana-native infrastructure         |
| **Bot Model**           | SaaS bot for multiple communities    | Multi-tenant bot, subscription-gated |
| **Admin Control**       | Community tools within platform      | Full infrastructure ownership        |

**Key Distinction**: DropLabz is **NOT a marketplace**—it's an operational platform. Communities maintain full control over their whitelists, requirements, and access.

---

## Future Enhancements (Backlog)

1. **Advanced Duplicate Detection**:
    - IP address tracking (with privacy considerations)
    - Browser fingerprinting (ethical considerations)
    - Machine learning-based pattern detection

2. **Auto-Draw Cron Job**:
    - Background service to check for events needing auto-draw
    - Webhook notifications when winners are drawn
    - Discord announcement integration

3. **Batch Operations**:
    - Bulk import entries from CSV
    - Bulk verify Discord requirements
    - Bulk update entry statuses

4. **Analytics Dashboard**:
    - Entry conversion rates (submitted → valid → winner)
    - Duplicate detection effectiveness metrics
    - Community engagement trends

5. **Integration APIs**:
    - Webhook subscriptions for entry events
    - REST API for external integrations
    - Zapier/Make.com connectors

---

## Testing Checklist

- [ ] Test duplicate detection with various signals
- [ ] Test bulk marking entries as ineligible
- [ ] Test CSV export (winners, entries, with/without ineligible)
- [ ] Test auto-draw scheduling toggle
- [ ] Test FCFS auto-assignment
- [ ] Verify admin-only access to all features
- [ ] Verify audit logging for all actions
- [ ] Test with real Discord + Solana data

---

## References

- **Subber Docs**: [https://subber.gitbook.io/subber-docs-public](https://subber.gitbook.io/subber-docs-public)
- **DropLabz Copilot Instructions**: [.github/copilot-instructions.md](./.github/copilot-instructions.md)
- **Platform Architecture**: [PLATFORM_ARCHITECTURE.md](./PLATFORM_ARCHITECTURE.md)
- **Design System**: [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)

---

**Updated**: January 29, 2026
**Status**: ✅ Implemented and ready for testing
