# DropLabz Platform Architecture

## Overview

DropLabz is a **multifunctional NFT community platform** providing professional infrastructure tools for managing Web3 communities. Core functions include:

- **Whitelist Management**: Create and manage allowlists for NFT launches, verified through Discord and Solana wallets
- **Collaboration Coordination**: Facilitate partnerships between projects and communities
- **Pre-Sale Creation**: Set up verified pre-sales with custom access requirements
- **Community Management**: Manage members, roles, and community operations

All features are verified through Discord integration and Solana blockchain verification. **This is NOT a marketplace or discovery platform**—it's an operational toolkit for projects and communities to manage their own initiatives with confidence and security.

---

## Product Vision

### Core Value Proposition

**For Web3 Projects & Communities:**

- Create whitelists with custom Discord and Solana requirements
- Coordinate collaborations with other projects
- Set up verified pre-sales with wallet-level access control
- Manage community members and operations
- Verify participants through Discord roles and Solana wallets
- Subscription-based access to advanced features

**For Platform:**

- Infrastructure service for Web3 communities
- SaaS subscription revenue (Free, Pro, Enterprise)
- Multi-tenant architecture supporting thousands of communities
- Platform-level admin controls and analytics
- No public marketplace or discovery—purely operational

---

## Key Features

### 1. Whitelist Management

**Purpose**: Create allowlists for NFT launches with verified participants

**Admin Flow**:

```
1. Create whitelist event
   - Set max spots
   - Define Discord requirements (roles, account age, server join age)
   - Define Solana requirements (token holdings, NFT ownership)
2. Users submit wallets via web form or Discord bot
3. Verify Discord + Solana requirements server-side
4. Entry marked VALID/INVALID
5. Export whitelist addresses for launch
```

**Verification**: Discord role checks + server age + Solana wallet ownership + on-chain eligibility

**Deliverable**: Exported list of verified wallet addresses

### 2. Collaboration Management

**Purpose**: Coordinate partnerships between projects and communities

**Admin Flow**:

```
1. Create collaboration event
   - Select partner project
   - Define mutual access requirements
   - Set collaboration period
2. Exchange whitelists between collaborators
3. Manage shared requirements
4. Track participation across communities
5. Post collaboration to Discord
```

**Features**: Multi-project coordination, shared requirements, mutual verification

**Deliverable**: Shared whitelist with cross-community participants

### 3. Pre-Sale Management

**Purpose**: Run verified pre-sales with custom access levels

**Admin Flow**:

```
1. Create pre-sale event
   - Set max participants per tier
   - Define allocation amounts
   - Set custom access requirements
2. Users apply with verified wallets
3. Allocations assigned based on requirements
4. Whitelist exported for on-chain claim program
5. Monitor participation and claims
```

**Features**: Tiered allocations, custom requirements, claim tracking

**Deliverable**: Verified pre-sale participants list with allocation amounts

### 4. Community Management

**Purpose**: Manage community members and operations

**Features**:

- Member role assignment (OWNER, ADMIN, MODERATOR, MEMBER)
- Permission-based access control
- Event/whitelist history
- Member analytics (participation, claims)
- Discord integration (guild management, role linking)

---

## User Flows

### 1. User Registration & Community Creation

```
User Journey:
1. Visit DropLabz.com
2. Sign up (email/password or Discord OAuth)
3. Create profile (username, avatar, bio)
4. Create first community
   - Choose name, description
   - Upload logo
   - Connect Discord server (optional)
   - Choose subscription tier
5. Get community admin panel access
```

### 2. Whitelist Event Creation

```
Whitelist Creation Flow:
1. Community admin navigates to Whitelists
2. Clicks "Create Whitelist"
3. Configures:
   - Name, description
   - Max participants
   - Discord requirements (roles, account age, server join age)
   - Solana requirements (token holdings, NFT ownership)
   - Start/end dates
4. Bot posts announcement to Discord (optional)
5. Users submit wallets:
   - Via web form
   - Via Discord bot command
6. Server verifies Discord + Solana requirements
7. Entries marked VALID/INVALID
8. Admin exports whitelist addresses
```

### 3. Collaboration Setup

```
Collaboration Flow:
1. Project A admin creates collaboration event
2. Invites Project B admin
3. Project B accepts collaboration
4. Define shared requirements
5. Both projects' members can participate
6. Whitelists combined for shared access
```

### 4. Pre-Sale Creation

```
Pre-Sale Flow:
1. Admin creates pre-sale event
2. Configures:
   - Tier 1: 1000 spots @ 10 tokens
   - Tier 2: 500 spots @ 20 tokens
   - Tier 3: 250 spots @ 50 tokens
3. Sets custom requirements per tier
4. Opens registration
5. Users apply with verified wallets
6. System assigns tiers based on requirements
7. Whitelist exported to blockchain
8. Users claim allocation via on-chain program
9. Admin monitors claims
```

---

## Architecture Layers

### 1. Frontend (Next.js 16)

**Public Pages:**

- `/` - Homepage
- `/communities/[slug]` - Community profile (if listed)
- `/pricing` - Subscription tiers

**Authenticated Pages:**

- `/dashboard` - User dashboard (owned communities)
- `/communities/new` - Create community
- `/communities/[slug]/admin` - Community admin panel
    - Whitelists management
    - Collaborations management
    - Pre-sales management
    - Community settings
    - Members management
    - Analytics
- `/profile` - User profile settings

**Platform Admin Pages:**

- `/admin` - Platform admin dashboard (SUPER_ADMIN only)
    - User management
    - Community management
    - Subscription management
    - Platform settings
    - Analytics

### 2. Backend API (Next.js App Router)

**Authentication:**

- NextAuth with multiple providers:
    - Email/password
    - Discord OAuth
- Session-based auth with JWT tokens
- Role-based access control (RBAC)

**API Routes:**

```
/api/
├── auth/
│   ├── [...nextauth]/route.ts    # NextAuth handler
│   ├── register/route.ts         # Email signup
│   └── verify-email/route.ts     # Email verification
├── users/
│   ├── [userId]/route.ts         # User CRUD
│   └── me/route.ts               # Current user
├── communities/
│   ├── route.ts                  # Create (auth)
│   ├── [slug]/route.ts           # Admin operations
│   ├── [slug]/members/route.ts   # Membership
│   └── [slug]/settings/route.ts  # Community settings
├── whitelists/
│   ├── [eventId]/route.ts        # Whitelist CRUD
│   ├── [eventId]/entries/route.ts # Entry submission
│   ├── [eventId]/verify/route.ts  # Verification
│   └── [eventId]/export/route.ts  # Export addresses
├── collaborations/
│   ├── [eventId]/route.ts        # Collaboration CRUD
│   └── [eventId]/entries/route.ts # Participation
├── presales/
│   ├── [eventId]/route.ts        # Pre-sale CRUD
│   ├── [eventId]/entries/route.ts # Application
│   └── [eventId]/claims/route.ts  # Claim tracking
├── subscriptions/
│   ├── route.ts                  # Subscription CRUD
│   └── webhook/route.ts          # Stripe webhooks
└── admin/
    ├── communities/route.ts      # Platform admin
    ├── users/route.ts
    └── settings/route.ts
```

**Middleware Stack:**

```typescript
// Authentication
requireAuth() -> throws 401 if not logged in

// Community admin
requireCommunityAdmin(communityId) -> throws 403 if not OWNER/ADMIN

// Platform admin
requireSuperAdmin() -> throws 403 if not SUPER_ADMIN

// Subscription validation
requireActiveSubscription(communityId) -> throws 402 if expired

// Rate limiting
rateLimit(tier) -> 429 if exceeded
```

### 3. Database (PostgreSQL + Prisma)

**Core Models:**

```typescript
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  username      String?  @unique
  passwordHash  String?
  role          UserRole @default(MEMBER) // SUPER_ADMIN | ADMIN | MEMBER
  discordId     String?  @unique

  ownedCommunities Community[] @relation("CommunityOwner")
  memberships      CommunityMember[]
}

model Community {
  id          String   @id @default(cuid())
  ownerId     String
  slug        String   @unique
  name        String
  description String?
  logo        String?

  // Discord (optional)
  guildId     String?  @unique

  owner       User     @relation("CommunityOwner", fields: [ownerId])
  members     CommunityMember[]
  whitelists  Whitelist[]
  presales    Presale[]
  collaborations Collaboration[]
  subscription Subscription?
}

model CommunityMember {
  id          String        @id @default(cuid())
  communityId String
  userId      String
  role        CommunityRole @default(MEMBER) // OWNER | ADMIN | MODERATOR | MEMBER

  @@unique([communityId, userId])
}

model Subscription {
  id          String             @id @default(cuid())
  communityId String             @unique
  tier        SubscriptionTier   @default(FREE) // FREE | PRO | ENTERPRISE
  status      SubscriptionStatus @default(ACTIVE)

  stripeCustomerId     String?
  stripeSubscriptionId String?
  currentPeriodEnd     DateTime?
}

model Whitelist {
  id          String      @id @default(cuid())
  communityId String
  name        String
  description String?
  status      EventStatus // DRAFT | ACTIVE | CLOSED
  maxSpots    Int

  requirements Requirement[]
  entries      Entry[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Presale {
  id          String      @id @default(cuid())
  communityId String
  name        String
  description String?
  status      EventStatus // DRAFT | ACTIVE | CLOSED

  tiers       PresaleTier[]
  entries     Entry[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Collaboration {
  id                String      @id @default(cuid())
  primaryCommunityId String
  partnerCommunityId String
  name              String
  description       String?
  status            EventStatus // DRAFT | ACTIVE | CLOSED

  requirements Requirement[]
  entries      Entry[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Requirement {
  id        String     @id @default(cuid())
  eventId   String     // References whitelist, presale, or collab
  type      RequirementType
  config    Json       // Flexible config per requirement type

  createdAt DateTime @default(now())
}

model Entry {
  id          String      @id @default(cuid())
  eventId     String      // Whitelist, presale, or collaboration
  walletAddress String
  discordId   String?
  status      EntryStatus // PENDING | VALID | INVALID

  metadata    Json?       // Custom data per entry

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([eventId, walletAddress])
}
```

**Data Isolation:**

- Every query MUST scope by `communityId` (except SUPER_ADMIN)
- Use Prisma middleware for automatic filtering
- Database-level RLS (Row Level Security) recommended

### 4. Discord Bot (Node.js + discord.js)

**Multi-Tenant Support:**

- Bot serves multiple communities simultaneously
- Validates subscription status before actions
- Commands scoped to guilds via `guildId`

**Commands:**

```
/whitelist setup - Link community to Discord server
/whitelist join - Submit wallet to whitelist
/whitelist close - Close whitelist, trigger verification

/presale setup - Configure pre-sale in Discord
/presale join - Apply to pre-sale
/presale close - Close pre-sale, export participants

/collab setup - Initialize collaboration
/collab join - Participate in collaboration
```

**Verification Flow:**

```
1. User runs /whitelist join <whitelistId>
2. Bot checks:
   a. Community subscription is active
   b. Whitelist is open (status = ACTIVE)
   c. User hasn't already entered
3. Bot prompts for wallet signature
4. User signs message with Solana wallet
5. Bot verifies signature on-chain
6. Bot checks Discord requirements:
   - Has required roles?
   - Account age sufficient?
   - Server join age sufficient?
7. Bot checks Solana requirements:
   - Holds required tokens?
   - Owns required NFTs?
8. Entry marked VALID or INVALID
9. Confirmation message sent to user
```

### 5. Solana Programs (Rust + Anchor)

**On-Chain State:**

- Community verification PDAs
- Whitelist eligibility lists
- Pre-sale allocation records
- Claim state for presale allocations

**Programs:**

```rust
// Verification Program
- verify_wallet(user, community) -> bool
- check_token_holdings(wallet, mint, amount) -> bool
- check_nft_ownership(wallet, collection) -> bool

// Pre-Sale Program
- initialize_presale(community, tiers, total_allocation)
- create_allocation(user, tier, amount)
- claim_allocation(user, amount) -> Result<()>
```

**Why On-Chain:**

- Immutable verification records
- Trustless eligibility checks
- Decentralized allocation claims
- Audit trail for compliance

---

## Security Model

### Role-Based Access Control (RBAC)

**Platform Roles:**

1. **SUPER_ADMIN** (Platform Administrators)
    - Access all communities
    - Override subscriptions
    - View all audit logs
    - Manage platform settings

2. **ADMIN** (Default for community owners)
    - Access only owned communities
    - Full control within own communities
    - Cannot access other communities

3. **MEMBER** (Regular users)
    - Join whitelists/presales
    - Participate in collaborations

**Community Roles:**

1. **OWNER**
    - Full control over community
    - Manage subscription
    - Add/remove admins
    - Delete community

2. **ADMIN**
    - Create/manage whitelists, presales, collabs
    - Manage members (except OWNER)
    - View analytics

3. **MODERATOR**
    - Verify entries
    - Export whitelists
    - Manage bot settings

4. **MEMBER**
    - View community content
    - Join whitelists/presales

### Multi-Tenant Security

**Enforcement at Every Layer:**

```typescript
// ❌ WRONG: No community scoping
const whitelist = await db.whitelist.findUnique({ where: { id } });

// ✅ CORRECT: Always scope by communityId
const whitelist = await db.whitelist.findFirst({
    where: {
        id,
        communityId: user.allowedCommunityId,
    },
});
```

**Middleware Pattern:**

```typescript
export async function requireCommunityAdmin(communityId: string, userId: string) {
    // SUPER_ADMIN always passes
    const user = await db.user.findUnique({ where: { id: userId } });
    if (user.role === 'SUPER_ADMIN') return user;

    // Check community membership
    const member = await db.communityMember.findFirst({
        where: {
            communityId,
            userId,
            role: { in: ['OWNER', 'ADMIN'] },
        },
    });

    if (!member) throw new Error('FORBIDDEN');
    return { user, member };
}
```

### Subscription Enforcement

```typescript
// Before creating whitelist/presale
const subscription = await db.subscription.findUnique({
    where: { communityId },
});

if (subscription.status !== 'ACTIVE') {
    throw new Error('SUBSCRIPTION_REQUIRED');
}

const monthlyWhitelists = await getWhitelistsThisMonth(communityId);
if (monthlyWhitelists.length >= subscription.maxWhitelistsPerMonth) {
    throw new Error('WHITELIST_LIMIT_REACHED');
}
```

---

## Subscription Tiers

| Feature                   | Free      | Pro        | Enterprise |
| ------------------------- | --------- | ---------- | ---------- |
| Whitelists per month      | 3         | Unlimited  | Unlimited  |
| Max entries per whitelist | 500       | 50,000     | Unlimited  |
| Collaborations            | ✅        | ✅         | ✅         |
| Pre-sales                 | ❌        | ✅         | ✅         |
| Discord integration       | ✅        | ✅         | ✅         |
| Wallet verification       | ✅        | ✅         | ✅         |
| Advanced requirements     | ❌        | ✅         | ✅         |
| Custom branding           | ❌        | ❌         | ✅         |
| Priority support          | ❌        | ✅         | ✅         |
| Dedicated account manager | ❌        | ❌         | ✅         |
| **Price**                 | **$0/mo** | **$49/mo** | **Custom** |

---

## Roadmap

### Phase 1: Foundation (Current)

- ✅ Monorepo structure
- ✅ Discord OAuth + Email/Password auth
- ✅ User model and profile system
- ✅ Community creation and management
- ✅ Database schema with Prisma
- ✅ NextAuth integration
- ⏳ Discord bot foundational setup

### Phase 2: Core Operations (Next)

- Whitelist management UI
- Whitelist entry verification flow
- Presale management UI
- Collaboration coordination UI
- Community member management
- Event analytics dashboard

### Phase 3: Subscriptions & Monetization

- Stripe integration
- Subscription models
- Usage limits enforcement
- Billing management

### Phase 4: Discord Bot Operations

- Slash commands for whitelists
- Slash commands for presales
- Slash commands for collaborations
- Bot verification flow

### Phase 5: Advanced Features

- Custom requirement types
- Batch import/export
- API for integrations
- Webhook notifications
- Advanced analytics

### Phase 6: Platform Admin

- Community moderation tools
- Revenue analytics
- Abuse prevention
- Feature gating

---

## Tech Stack Reference

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Next.js App Router, Prisma, PostgreSQL
- **Auth**: NextAuth 5, Discord OAuth
- **Payments**: Stripe
- **Discord**: discord.js 14
- **Blockchain**: Solana web3.js, Wallet Adapter (Anza), Anchor Framework
- **Formatting**: Prettier (Solana config)

---

**Status**: Foundation complete (Phase 1), ready for core operations development (Phase 2).
