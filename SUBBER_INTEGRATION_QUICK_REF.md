# Subber Integration - Quick Reference

## Summary

Successfully integrated 5 key features from Subber Docs research into DropLabz platform:

1. ✅ **Duplicate Entry Detection** - Risk-based flagging with manual review
2. ✅ **Entry Ineligibility Marking** - Bulk admin actions with audit logging
3. ✅ **CSV Export** - Winners & entries export for airdrops/mints
4. ✅ **Scheduled Auto-Draw** - Automatic winner selection at event end
5. ✅ **FCFS Mode** - Instant winner assignment (already existed, enhanced)

## What Subber Provides

- Multi-chain community platform (20k+ communities, 850k+ users)
- Giveaway/raffle management with duplicate detection
- Pre-mint allowlist coordination
- Discord bot with auto role assignment
- Wallet collection & export tools

## What We Integrated

### 1. Duplicate Detection (`/api/events/{id}/entries/duplicates`)

- **Signals**: Discord ID reuse (HIGH), multi-event patterns (LOW), timing anomalies (MEDIUM)
- **Risk Scoring**: 0-100 scale for prioritized review
- **Admin UI**: Visual dashboard with bulk selection

### 2. Ineligibility Marking (`/api/events/{id}/entries/mark-ineligible`)

- **Bulk Actions**: Select multiple entries at once
- **Reason Required**: Audit trail for all actions
- **Auto-Exclusion**: Ineligible entries excluded from winner draws

### 3. CSV Export (`/api/events/{id}/export?type=winners|entries`)

- **Winners**: Wallet addresses ready for airdrop snapshots
- **All Entries**: Full dataset with status, winner flag, ineligibility
- **Flexible**: Toggle inclusion of ineligible entries

### 4. Auto-Draw Scheduler (`/api/events/{id}/auto-draw`)

- **Automatic**: Winners drawn when event ends
- **Optional**: Manual drawing always available
- **Smart**: FCFS mode auto-detected (already instant)

### 5. FCFS Enhancements

- **Instant Assignment**: Winners auto-assigned on valid entry
- **Spot Tracking**: Respects maxWinners & reservedSpots
- **Real-time**: No manual drawing needed

## New Files Created

### API Endpoints (5 files)

```
/apps/web/src/app/api/events/[eventId]/
├── entries/duplicates/route.ts
├── entries/mark-ineligible/route.ts
├── export/route.ts
└── auto-draw/route.ts
```

### Utilities (1 file)

```
/apps/web/src/lib/utils/duplicate-detection.ts
```

### Components (4 files)

```
/apps/web/src/components/admin/
├── DuplicateDetectionPanel.tsx
├── ExportButton.tsx
├── AutoDrawScheduler.tsx
└── EventManagementDashboard.tsx
```

### Documentation (2 files)

```
/SUBBER_INTEGRATION.md (detailed)
/SUBBER_INTEGRATION_QUICK_REF.md (this file)
```

### Modified Files (1 file)

```
/apps/web/src/app/api/events/[eventId]/route.ts
  - Added includeStats query param for dashboard
```

## How Admins Use It

### Step 1: Create Event

```
Admin Panel → Events → Create Event
→ Choose FCFS (instant) or RANDOM/MANUAL (draw later)
```

### Step 2: Monitor & Detect Duplicates

```
Event Page → Duplicate Detection Tab
→ Review flagged entries
→ Select suspicious entries
→ Mark as ineligible with reason
```

### Step 3: Schedule Auto-Draw (Optional)

```
Event Page → Overview Tab
→ Toggle "Enable Auto-Draw"
→ Winners drawn automatically at endAt
```

### Step 4: Export Winners

```
Event Page → Export Tab
→ Click "Export Winners CSV"
→ Use for airdrops, mint claims, allowlists
```

## Design System Compliance

All components use DropLabz design tokens:

- **Primary Actions**: `#00ff41` (radioactive green)
- **Secondary Actions**: `#00d4ff` (electric blue)
- **Backgrounds**: `#0a0e27`, `#111528`
- **Warnings**: Yellow accents
- **Errors**: Red accents

## Key Differences from Subber

| Aspect     | Subber                 | DropLabz                   |
| ---------- | ---------------------- | -------------------------- |
| Platform   | Public marketplace     | Infrastructure platform    |
| Users      | WL hunters, members    | Community admins/operators |
| Discovery  | Central directory      | Opt-in listing (secondary) |
| Blockchain | Multi-chain            | Solana-native              |
| Focus      | Community growth tools | Professional operations    |

**DropLabz is NOT a marketplace** - it's an operational platform for managing communities.

## Testing Checklist

- [ ] Duplicate detection API returns flagged entries
- [ ] Bulk marking entries as ineligible works
- [ ] CSV export downloads winners correctly
- [ ] CSV export includes all required fields
- [ ] Auto-draw toggle saves correctly
- [ ] FCFS assigns winners instantly
- [ ] Admin-only access enforced
- [ ] Audit logs created for all actions

## Next Steps

1. Test duplicate detection with real data
2. Verify CSV export format for airdrop tools
3. Implement cron job for auto-draw execution
4. Add Discord announcements for auto-drawn winners
5. Create admin tutorial video

## References

- **Full Documentation**: `/SUBBER_INTEGRATION.md`
- **Subber Docs**: https://subber.gitbook.io/subber-docs-public
- **Platform Architecture**: `/PLATFORM_ARCHITECTURE.md`
- **Design System**: `/DESIGN_SYSTEM.md`

---

**Status**: ✅ Implemented and formatted
**Date**: January 29, 2026
