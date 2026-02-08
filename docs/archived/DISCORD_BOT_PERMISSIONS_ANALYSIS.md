# DropLabz Discord Bot - Required Permissions Analysis

**Last Updated**: February 3, 2026  
**Status**: Complete Analysis

---

## Summary

The DropLabz bot requires **7 core Discord permissions** to function. Below is a breakdown by operation with permission requirements and role hierarchy details.

---

## Required Permissions by Operation

### 1. Create Category & Text Channels

**Operation**: Creating a "DropLabz" category and 5 text channels within it

| Permission          | Type    | Purpose                       | Hierarchy Required |
| ------------------- | ------- | ----------------------------- | ------------------ |
| **Manage Channels** | General | Create/delete/modify channels | ❌ No              |

**Details**:

- Allows creating the "DropLabz" category and text channels (announcements, giveaways, winners, etc.)
- Works at guild and category levels
- Bot role does NOT need to be higher than server roles
- Note: The bot only needs `ManageChannels` to CREATE channels; role hierarchy becomes relevant when modifying existing channels

---

### 2. Set Channel-Level Permissions (Role-Based Gating)

**Operations**: Restrict channels to specific roles by creating permission overwrites

| Permission          | Type    | Purpose                              | Hierarchy Required |
| ------------------- | ------- | ------------------------------------ | ------------------ |
| **Manage Channels** | General | Modify channel permission overwrites | ✅ **YES**         |

**Details**:

- Used to set `ViewChannel`, `SendMessages`, `ReadMessageHistory` overwrites
- Process: Deny @everyone → Allow specific roles
- **CRITICAL**: Bot's role must be positioned HIGHER in the role hierarchy than ANY roles being assigned
    - If assigning roles at positions 5, 7, 9 → Bot role must be at position 10+
    - Example error: "Role hierarchy violation - bot's role must be positioned ABOVE these roles"
- Role hierarchy is Discord's default security model (prevents users from assigning roles above their own rank)

**Implementation Pattern**:

```typescript
// Check bot's highest role position
const botHighestRole = botMember.roles.highest; // Returns highest role this bot has

// For each role being assigned permissions
if (role.position >= botHighestRole.position) {
    // FAIL: Bot cannot modify this role
    throw new Error('ROLE_HIERARCHY_VIOLATION');
}

// If hierarchy is OK, proceed with permission overwrites
await category.permissionOverwrites.create(roleId, {
    ViewChannel: true,
    SendMessages: true,
    ReadMessageHistory: true,
});
```

---

### 3. Assign Discord Roles to Members

**Operation**: Dynamically assign roles to guild members (e.g., winners, verified users)

| Permission       | Type    | Purpose                             | Hierarchy Required |
| ---------------- | ------- | ----------------------------------- | ------------------ |
| **Manage Roles** | General | Assign/remove roles to/from members | ✅ **YES**         |

**Details**:

- Allows assigning roles like `@winners` or `@whitelist_verified` to members
- **CRITICAL**: Bot's role must be positioned HIGHER than any roles being assigned
- Discord enforces role hierarchy automatically - bot cannot assign roles above its own
- When winner detection happens: `await member.roles.add(winnerRoleId)`
- When verification happens: `await member.roles.add(verifiedRoleId)`
- Error if hierarchy violated: "Missing Permissions - the member's highest role is higher than or equal to the role you tried to assign"

**UI Safeguard** (implemented in `check-role-hierarchy` endpoint):

- Admin panel checks role hierarchy before attempting assignment
- If conflicts detected, recommends: "Drag the bot's role ABOVE these roles: [list]"
- Prevents user errors by catching hierarchy issues upfront

---

### 4. Send Message Embeds/Announcements

**Operation**: Post rich embeds (announcements) to text channels

| Permission        | Type | Purpose                                    | Hierarchy Required |
| ----------------- | ---- | ------------------------------------------ | ------------------ |
| **Send Messages** | Text | Post messages to channels                  | ❌ No              |
| **Embed Links**   | Text | Send rich embeds (formatted announcements) | ❌ No              |

**Details**:

- `SendMessages`: Post plain text and embeds
- `EmbedLinks`: Send formatted embeds with title, description, fields, colors
- No role hierarchy check needed - message posting is not affected by role positions
- Applied at text channel level (announcements, giveaways, winners channels)
- Implements: `/announce` endpoint that posts event details with professional formatting

**Implementation**:

```typescript
await channel.send({
    embeds: [{
        title: 'Whitelist Live',
        description: 'Event details...',
        color: 0x00ff41, // Radioactive green
        fields: [...]
    }]
});
```

---

### 5. Fetch Guild & Channel Data

**Operation**: Read guild structure, fetch channels, members, roles

| Permission              | Type    | Purpose                                  | Hierarchy Required |
| ----------------------- | ------- | ---------------------------------------- | ------------------ |
| **View Channels**       | General | See guild channels and structure         | ❌ No              |
| **View Guild Insights** | General | Read guild statistics (audit logs, etc.) | ❌ No\*            |

**Details**:

- `ViewChannels`: Fetch guild channels, check channel existence, read channel names
- Needed for all verification endpoints that check setup status
- `ViewGuildInsights`: Optional for advanced analytics (currently unused)
- No hierarchy check needed - reading data doesn't trigger hierarchy validation

**Implementation**:

```typescript
const guild = await client.guilds.fetch(guildId);
const channels = await guild.channels.fetch(); // List all channels
const roles = await guild.roles.fetch(); // List all roles
```

---

### 6. Check Member Permissions

**Operation**: Verify what permissions the bot has in categories/channels

| Permission        | Type    | Purpose                             | Hierarchy Required |
| ----------------- | ------- | ----------------------------------- | ------------------ |
| **View Channels** | General | Needed to check channel permissions | ❌ No              |

**Details**:

- Not a separate permission, but uses data from `ViewChannels`
- Used by verification endpoints to check: `channel.permissionsFor(botMember)`
- Returns permission object showing what bot can do in that channel
- Example: Check if bot has `ManageChannels` before attempting to modify permissions

**Implementation**:

```typescript
const botMember = await guild.members.fetchMe();
const perms = channel.permissionsFor(botMember);
if (perms.has('ManageChannels')) {
    // Bot can modify this channel
}
```

---

## Complete Permission Matrix

### Guild-Level Permissions (General)

| Permission              | Required? | Purpose                                        |
| ----------------------- | --------- | ---------------------------------------------- |
| **Manage Channels**     | ✅ YES    | Create categories/channels, modify permissions |
| **Manage Roles**        | ✅ YES    | Assign roles to members                        |
| **View Channels**       | ✅ YES    | Read guild structure, verify setup             |
| **View Guild Insights** | ❌ NO     | Optional (not currently used)                  |

### Text Channel Permissions

| Permission          | Required? | Purpose                                        |
| ------------------- | --------- | ---------------------------------------------- |
| **Send Messages**   | ✅ YES    | Post announcements                             |
| **Embed Links**     | ✅ YES    | Format announcements as rich embeds            |
| **Manage Channels** | ✅ YES    | Modify channel permissions (at category level) |

---

## Role Hierarchy Rules Summary

### When Hierarchy Matters

✅ **REQUIRED**:

- **Manage Roles**: Assigning roles to members → Bot role must be above target roles
- **Manage Channels** (permission overwrites): Setting role-based channel access → Bot role must be above target roles

❌ **NOT REQUIRED**:

- **Manage Channels** (creation): Creating new channels → No hierarchy check
- **Send Messages**: Posting messages → No hierarchy check
- **View Channels**: Reading data → No hierarchy check

### How to Fix Role Hierarchy Issues

1. **Admin Panel Detection**:
    - User clicks "Apply Role-Based Gating"
    - Bot calls `/check-role-hierarchy` endpoint
    - If hierarchy violation detected, returns error with solution

2. **User Resolution**:
    - Server Settings → Roles
    - Locate "DropLabz Bot" role
    - Drag it ABOVE all roles being assigned/gated (alphabetically/by position)
    - Apply changes

3. **Verification**:
    - Admin clicks "Verify Setup" button
    - Bot confirms bot's role is positioned correctly
    - Allows user to proceed

---

## Minimal Permission Set for Different Features

### Feature 1: Just Post Announcements (Simplest)

```
Required Permissions:
- Send Messages (Text)
- Embed Links (Text)
- View Channels (General)

No Role Hierarchy Needed
```

### Feature 2: Create Channels + Post Announcements

```
Required Permissions:
- Manage Channels (General)
- Send Messages (Text)
- Embed Links (Text)
- View Channels (General)

No Role Hierarchy Needed
```

### Feature 3: Full Setup (Categories + Gating + Announcements) - **DEFAULT**

```
Required Permissions:
- Manage Channels (General) ← Hierarchy matters for permission overwrites
- Manage Roles (General) ← Hierarchy matters for role assignment
- Send Messages (Text)
- Embed Links (Text)
- View Channels (General)

Role Hierarchy REQUIRED:
- Bot's role must be positioned ABOVE all roles being gated
- Bot's role must be positioned ABOVE all roles being assigned
```

---

## Discord Permission Codes (for OAuth Setup)

When setting up the bot in Discord Developer Portal:

### OAuth2 Scopes

```
bot
applications.commands  (for slash commands)
```

### Permissions Code

```
Decimal: 18432  (Manage Channels + Manage Roles + Send Messages + Embed Links)
Hex:     0x4800

OR individually:
- Manage Channels: 268435456 (0x10000000)
- Manage Roles: 268435456 (0x10000000)
- Send Messages: 2048 (0x0800)
- Embed Links: 16384 (0x4000)
- View Channels: 1024 (0x0400)
```

### Recommended OAuth2 URL

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=18432&scope=bot%20applications.commands
```

---

## Implementation Checklist

- [x] **Manage Channels** → Create categories and text channels
- [x] **Manage Channels** → Set channel permission overwrites with role gating
- [x] **Manage Roles** → Assign roles to members (winners, verified, etc.)
- [x] **Send Messages** → Post event announcements
- [x] **Embed Links** → Format announcements as rich embeds
- [x] **View Channels** → Verify guild setup and permissions
- [x] **Role Hierarchy Validation** → Check bot role is above target roles before modifying

---

## Testing Checklist

### 1. Verify Permissions Granted

- [ ] Bot invited to test server
- [ ] Bot has all 6 permissions in Server Settings → Integrations → DropLabz Bot
- [ ] Permissions shown: Manage Channels ✓, Manage Roles ✓, Send Messages ✓, Embed Links ✓, View Channels ✓

### 2. Test Channel Creation

- [ ] Click "Create Channels" button
- [ ] DropLabz category appears
- [ ] All 5 channels created inside category
- [ ] Verify in `/verify-server-setup` endpoint

### 3. Test Role Hierarchy Check

- [ ] Create test role "member-role" at lower position
- [ ] Create test role "bot-role-test" above "member-role"
- [ ] Ensure bot has "bot-role-test"
- [ ] Call `/check-role-hierarchy` with "member-role"
- [ ] Should return: `hierarchyOk: true`
- [ ] Call with role ABOVE bot's role
- [ ] Should return: `hierarchyOk: false` with fix instructions

### 4. Test Permission Overwrites

- [ ] Click "Apply Role-Based Gating"
- [ ] Select roles to gate (e.g., "verified", "whitelist")
- [ ] Verify bot is above these roles
- [ ] Click apply
- [ ] Verify @everyone denied, selected roles allowed
- [ ] Test: Regular member cannot see channel ✓
- [ ] Test: Member with role CAN see channel ✓

### 5. Test Announcements

- [ ] Create event in web dashboard
- [ ] Click "Post to Discord"
- [ ] Embed appears in announcements channel
- [ ] Verify formatting and colors

---

## Summary Table

| Operation                | Permissions Needed          | Hierarchy Required | Status         |
| ------------------------ | --------------------------- | ------------------ | -------------- |
| Create category/channels | Manage Channels             | ❌ No              | ✅ Implemented |
| Set channel permissions  | Manage Channels             | ✅ **YES**         | ✅ Implemented |
| Assign roles             | Manage Roles                | ✅ **YES**         | ✅ Implemented |
| Post announcements       | Send Messages, Embed Links  | ❌ No              | ✅ Implemented |
| Verify setup             | View Channels               | ❌ No              | ✅ Implemented |
| Check role hierarchy     | View Channels, Manage Roles | ✅ **YES**         | ✅ Implemented |

---

**Note**: All operations are currently implemented in the DropLabz bot codebase. Role hierarchy enforcement is built into discord.js and cannot be bypassed—attempting to assign roles above the bot's role will throw a "Missing Permissions" error automatically.
