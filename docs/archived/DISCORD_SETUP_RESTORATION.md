# Discord Permission Setup - Restored & Enhanced

**Date**: February 1, 2026  
**Status**: ✅ Complete

---

## Summary

We've successfully restored the Discord channel creation functionality while keeping the simplified setup flow (no permission application by bot). We've also created comprehensive, persistent permission instructions for admins to reference anytime.

---

## What Was Done

### 1. Restored Channel Creation UI ✅

**File**: [apps/web/src/components/community/wizard-steps/StepVerificationSocials.tsx](apps/web/src/components/community/wizard-steps/StepVerificationSocials.tsx)

- Channel creation button: "✨ Create DropLabz Channels" (lines 251-259)
- Creates 5 channels: #announcements, #giveaways, #giveaway-entries, #winners, #droplabz-admin
- Calls bot API: POST `/api/discord/setup-channels`
- Simple 2-step wizard:
    1. Connect Discord server
    2. Create channels

### 2. Created Reusable Permission Guide Component ✅

**File**: [apps/web/src/components/community/PermissionSetupGuide.tsx](apps/web/src/components/community/PermissionSetupGuide.tsx) (250+ lines)

- **Purpose**: Collapsible, reusable permission setup instructions
- **Content**: 7 expandable sections
    1. 📋 Permission Setup Overview
    2. 1️⃣ Navigate to Server Settings
    3. 2️⃣ Go to Roles Tab
    4. 3️⃣ Position the DropLabz Bot Role
    5. 4️⃣ Set Channel Permissions (DropLabz Category)
    6. 5️⃣ Configure Permission Overwrites
    7. 🎯 Troubleshooting
    8. 💡 Admin Channel Best Practices

- **Features**:
    - Step-by-step instructions with color-coded emphasis
    - Visual examples (e.g., role hierarchy diagram)
    - Troubleshooting section for common issues
    - @everyone deny vs role allow patterns explained
    - Emphasis on #droplabz-admin for admin operations
    - Pro tips for permission management

### 3. Created Permission Setup Help Page ✅

**File**: [apps/web/src/components/community/PermissionSetupHelp.tsx](apps/web/src/components/community/PermissionSetupHelp.tsx) (160+ lines)

- **Purpose**: Full-page help reference with context and decision rationale
- **Sections**:
    1. Why Manual Permissions (4 key benefits)
    2. Complete Permission Setup (uses PermissionSetupGuide)
    3. Quick Reference: Channel Permissions Grid
    4. Common Issues & Fixes
    5. What's Next (4 action items)
    6. Link to Discord Documentation

### 4. Integrated Help into Admin Dashboard ✅

**File**: [apps/web/src/app/profile/communities/[slug]/admin/page.tsx](apps/web/src/app/profile/communities/%5Bslug%5D/admin/page.tsx)

- **Added**: New "📋 Help" tab in community admin dashboard
- **Location**: After "Settings" tab
- **Display**: Full PermissionSetupHelp component
- **Access**: Available anytime admin needs to reference permissions

**Updated Type Definition**:

- [apps/web/src/hooks/useAdminPageState.ts](apps/web/src/hooks/useAdminPageState.ts): Added 'help' to TabType

### 5. Enhanced Wizard Instructions ✅

**Updated** [StepVerificationSocials.tsx](apps/web/src/components/community/wizard-steps/StepVerificationSocials.tsx) (lines 248-270)

- Replaced inline text list with PermissionSetupGuide component
- Added context: "After channels are created, configure permissions in Discord"
- Note: "DropLabz bot only creates channels—you control who can access them"
- Bookmark tip: "Save a link to the Permission Guide in your admin dashboard for future reference"

---

## Architecture

### Simplified Setup Flow

```
Admin Journey:
1. Community Admin → Create Community
2. Verify & Socials Step:
   a. Connect Discord server
   b. (Bot creates 5 channels automatically)
   c. See permission setup instructions
3. Manual Configuration (in Discord):
   - Go to Server Settings → Roles → Position bot role
   - Go to DropLabz category → Edit permissions
   - Set @everyone deny, specific roles allow
4. (Optional) Reference help later:
   - Admin Dashboard → Help tab → Full permission guide

Bot Role:
- ✅ Creates channels
- ❌ Does NOT apply permissions (manual only)
- ❌ Does NOT manage roles
- Impact: Lower privilege, no permission escalation risks
```

### Component Reusability

```
PermissionSetupGuide
├── Used in: StepVerificationSocials.tsx (wizard)
└── Used in: PermissionSetupHelp.tsx (admin dashboard)

PermissionSetupHelp
└── Displayed in: Community Admin → Help Tab
```

---

## Key Features

### 1. Clear Step-by-Step Instructions

- 7 sections covering setup from start to finish
- Each section expandable for focused reading
- Visual examples and diagrams

### 2. Troubleshooting & FAQs

- Common permission issues addressed
- Quick fixes for role positioning
- Solutions for permission caching

### 3. Channel-Specific Guidance

- What each channel is for
- Recommended permissions per channel
- Special note about #droplabz-admin

### 4. Persistent & Accessible

- No need to re-run wizard to remember steps
- Admin Dashboard → Help tab anytime
- Color-coded sections for quick scanning

---

## Files Created/Modified

| File                                                                                   | Type     | Lines    | Status     |
| -------------------------------------------------------------------------------------- | -------- | -------- | ---------- |
| [PermissionSetupGuide.tsx](apps/web/src/components/community/PermissionSetupGuide.tsx) | New      | 260      | ✅ Created |
| [PermissionSetupHelp.tsx](apps/web/src/components/community/PermissionSetupHelp.tsx)   | New      | 165      | ✅ Created |
| StepVerificationSocials.tsx                                                            | Modified | +3 lines | ✅ Updated |
| CommunityAdminPage.tsx                                                                 | Modified | +2 lines | ✅ Updated |
| useAdminPageState.ts                                                                   | Modified | +1 line  | ✅ Updated |

---

## Bot API Endpoints (Unchanged)

These were never removed and continue to work:

```
POST /api/discord/setup-channels
├── Input: { guildId }
└── Output: { category: {id, name}, channels: [{id, name, key}] }

Creates:
- Category: "DropLabz"
- Channels:
  - #announcements
  - #giveaways
  - #giveaway-entries
  - #winners
  - #droplabz-admin
```

---

## Testing Checklist

- [x] Formatting passes (`pnpm format`)
- [x] No new TypeScript errors introduced
- [x] Wizard imports PermissionSetupGuide correctly
- [x] Admin dashboard has "Help" tab visible
- [x] Help tab displays PermissionSetupHelp component
- [x] Permission guide sections are expandable
- [x] Links to Discord documentation work

---

## What Admins Experience

### During Setup

1. **Connect Discord** → Select guild
2. **Create Channels** → Click "✨ Create DropLabz Channels"
3. **See Instructions** → Collapsible permission guide inline
4. **Continue Wizard** → Finish community creation

### Later if Needed

1. **Admin Dashboard** → Click "📋 Help" tab
2. **Read Full Guide** → Detailed permission setup instructions
3. **Apply Permissions** → Follow step-by-step in Discord
4. **Reference Anytime** → Guide always available

---

## Design Decisions

### Why Manual Permissions?

1. **Admin Control**: You maintain full control
2. **Flexibility**: Change permissions anytime without wizard
3. **Security**: Bot stays at lower privilege level
4. **Simplicity**: Bot does what it does best—create channels

### Why Persistent Instructions?

1. **Fallback**: No need to run wizard again to remember
2. **Reference**: Available for future troubleshooting
3. **Scalable**: One source of truth for all admins
4. **Low Maintenance**: Update once, reflects everywhere

---

## Next Steps (If Needed)

- [ ] Test with real Discord server
- [ ] Verify channel creation works end-to-end
- [ ] Test permission guide on mobile
- [ ] Gather admin feedback on instruction clarity
- [ ] Consider video tutorial (links from help guide)

---

**Status**: Ready for testing and deployment
