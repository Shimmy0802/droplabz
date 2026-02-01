# Copilot Instructions — DropLabz

## Project Summary

DropLabz is a **hybrid NFT community platform** built on Solana that combines professional infrastructure with community discovery:

- **Core Functions**: Whitelist management, collaborations, pre-sales, community operations
- **Infrastructure First**: Professional tools for admins to manage their communities (NOT just a marketplace)
- **Community Discovery**: Public marketplace for discovering and joining community events (opt-in via `isListed`)
- **Multi-tenant Platform**: Users create profiles → create communities → get isolated admin panels
- **Discord Integration**: Bot for community operations (whitelists, collabs, airdrops)
- **Solana-Native**: Wallet verification and on-chain eligibility are required

**Design Philosophy**:
While we do include public discovery features (communities can opt-in to being listed), DropLabz differs from pure marketplace platforms like Subber by emphasizing **admin control and operations**. Our primary focus is empowering community managers with professional infrastructure tools, not building a consumer-facing discovery platform. Communities maintain full control over their whitelists, requirements, and access—they simply have the option to make them discoverable if they choose.

**Architecture**:

- Web application (dashboard, admin panels, community operations interface)
- Discord bot (multi-tenant, subscription-gated, admin-only)
- Solana programs (verification, eligibility, claims on-chain)
- Community management system (whitelists, collaborations, pre-sales)

**Security Model**:

- Platform admins (SUPER_ADMIN): manage entire platform
- Community admins (OWNER/ADMIN): manage their community only
- Multi-tenant data isolation enforced at database and API layers

**Solana is the source of truth** for wallet ownership, eligibility, and claims. Off-chain systems exist only for UX and performance.

This is an original platform design—avoid copying patterns from competitors.

---

## Quick Start (Development Workflow)

```bash
# First-time setup
pnpm install
cp .env.example .env  # Configure Discord, Solana, DB settings
pnpm db:push          # Push schema to PostgreSQL

# Start all services (web + bot simultaneously)
pnpm dev

# Individual services
cd apps/web && pnpm dev    # http://localhost:3000
cd apps/bot && pnpm dev    # Discord bot connects

# Database
pnpm db:studio             # Prisma Studio GUI
pnpm db:migrate            # Create migration

# Required before every commit
pnpm format                # Auto-format with @solana/prettier-config-solana
pnpm type-check            # Verify TypeScript across all packages
```

**Environment File Location**: Single `.env` file in workspace root (not `.env.local`)
**Package Manager**: `pnpm` (workspaces) — never use npm or yarn

---

## Core Development Patterns

### 1. API Route Structure (Next.js App Router)

**Pattern**: All API routes follow this structure:

```typescript
// apps/web/src/app/api/[resource]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireCommunityAdmin } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';

// Define Zod schema for validation
const createSchema = z.object({
    communityId: z.string().cuid(),
    // ...fields
});

export async function POST(req: NextRequest) {
    try {
        // 1. Authenticate user
        const user = await requireAuth();

        // 2. Parse and validate request
        const body = await req.json();
        const data = createSchema.parse(body);

        // 3. Verify community access (multi-tenant isolation)
        await requireCommunityAdmin(data.communityId);

        // 4. Execute database operation
        const result = await db.model.create({ data });

        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid data', issues: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
```

**Critical Rules**:

- ✅ Always use `requireAuth()` or `requireCommunityAdmin(communityId)` first
- ✅ Validate all inputs with Zod schemas before touching database
- ✅ Filter queries by `communityId` to enforce multi-tenant isolation
- ✅ Use structured error handling (Zod errors → 400, auth → 401/403)
- ❌ Never allow cross-community data access (except SUPER_ADMIN)

**Reference**: [apps/web/src/app/api/events/route.ts](../apps/web/src/app/api/events/route.ts)

### 2. Authentication Middleware

```typescript
import { requireAuth, requireCommunityAdmin, requireSuperAdmin } from '@/lib/auth/middleware';

// Public endpoint (no auth)
export async function GET() {
    /* ... */
}

// Authenticated user required
const user = await requireAuth();

// Community admin required (OWNER/ADMIN only)
const user = await requireCommunityAdmin(communityId);

// Platform admin required (SUPER_ADMIN only)
const user = await requireSuperAdmin();
```

**Implementation**: [apps/web/src/lib/auth/middleware.ts](../apps/web/src/lib/auth/middleware.ts)

**How it works**:

- `requireAuth()` → validates NextAuth session, throws 401 if missing
- `requireCommunityAdmin(id)` → checks if user is OWNER/ADMIN of specific community
- SUPER_ADMIN role bypasses all community-level checks
- Middleware functions throw `ApiError` with status codes (caught in route handlers)

### 3. Database Queries (Multi-Tenant Isolation)

**CRITICAL**: Every query MUST be scoped to `communityId` or verify permissions:

```typescript
// ✅ CORRECT: Filtered by communityId
const events = await db.event.findMany({
    where: { communityId: validatedCommunityId },
    include: { requirements: true, entries: true },
});

// ❌ WRONG: Missing communityId filter (data leak!)
const events = await db.event.findMany({
    include: { requirements: true },
});

// ✅ CORRECT: Verify ownership before update
await requireCommunityAdmin(communityId);
await db.event.update({
    where: { id: eventId, communityId }, // Double-check communityId
    data: { status: 'CLOSED' },
});
```

**Schema Reference**: [apps/web/prisma/schema.prisma](../apps/web/prisma/schema.prisma)

### 4. Wallet Integration (Anza Wallet Adapter)

**Client-Side** (React components):

```tsx
'use client';
import { useWalletState, useRequireWallet } from '@/lib/wallet';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export function Component() {
    // Option 1: Get wallet state (may be disconnected)
    const { publicKey, connected } = useWalletState();

    // Option 2: Require connected wallet (throws if not connected)
    const publicKey = useRequireWallet();

    return <WalletMultiButton />;
}
```

**Server-Side** (API verification):

```typescript
import { validateSolanaAddress, verifyWalletOwnership } from '@/lib/solana/verification';

// Validate address format
const publicKey = validateSolanaAddress(walletAddress); // Throws ApiError if invalid

// Verify ownership (signature challenge - TODO: implement)
const isValid = await verifyWalletOwnership(walletAddress, signature);
```

**Setup**: All pages already wrapped with `WalletContextProvider` in [apps/web/src/app/layout.tsx](../apps/web/src/app/layout.tsx)

**References**:

- [apps/web/src/lib/wallet/WalletContextProvider.tsx](../apps/web/src/lib/wallet/WalletContextProvider.tsx) — Provider setup
- [apps/web/src/lib/wallet/hooks.ts](../apps/web/src/lib/wallet/hooks.ts) — React hooks
- [docs/guides/WALLET_INTEGRATION.md](../docs/guides/WALLET_INTEGRATION.md) — Full wallet implementation guide

### 5. Discord Bot Architecture

**Bot runs as separate service** (`apps/bot`), loads config from root `.env`:

```typescript
// apps/bot/src/index.ts
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../../../.env') }); // Load from workspace root

// Bot uses slash commands with subcommands
client.on('interactionCreate', async interaction => {
    if (interaction.commandName === 'droplabz') {
        const subcommand = interaction.options.getSubcommand();
        // Handle: setup, post, close
    }
});
```

**Multi-Tenant Design**:

- Same bot instance serves multiple Discord guilds (servers)
- Each guild maps to a `Community` record via `guildId`
- Bot validates subscription status via API before executing commands
- Admin-only commands verified through Discord permissions + database

**Reference**: [apps/bot/src/index.ts](../apps/bot/src/index.ts)

---

## Design System & Brand

**See**: [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) for complete visual design, color palette, typography, and UI component guidelines.

**Key Brand Points**:

- Dark, industrial, infrastructure aesthetic
- Radioactive green for execution/primary actions
- Electric blue for information/secondary actions
- Professional, technical, serious tone
- NOT a marketplace — operational platform
- Droplet motif used sparingly

---

## Code Formatting (MANDATORY)

**ALL code MUST be formatted using the official Solana Prettier config.**

### Setup

- Package: `@solana/prettier-config-solana` (v0.0.6+)
- Configured in all package.json files via `"prettier": "@solana/prettier-config-solana"`
- Run before committing: `pnpm format`
- Check without modifying: `pnpm format:check`

### What This Ensures

- ✅ Consistent code style across entire monorepo (web, bot, SDK)
- ✅ Industry-standard Solana ecosystem formatting
- ✅ Single point of truth for formatting rules
- ✅ No formatting debates (rules come from official Solana labs)

### Guidelines

- **Must use**: `pnpm format` to auto-format all files before committing
- **Never commit**: Unformatted code (will fail CI/linting)
- **Update ranges**: If Prettier updates, update across all package.json files
- **Reference**: https://github.com/anza-xyz/prettier-config-solana

**See**: [PRETTIER_SETUP.md](../PRETTIER_SETUP.md) for complete formatting guide

---

## Multi-Tenant Architecture

**Platform-Level**:

- Users create accounts (email/password or Discord OAuth)
- Users can create and own multiple communities
- Platform admins (SUPER_ADMIN) have access to all communities
- Subscription-based access to bot features (Free, Pro, Enterprise)

**Community-Level**:

- Each **Community** can have an associated Discord guild (optional)
- Communities have isolated admin panels with role-based access (OWNER, ADMIN, MODERATOR, MEMBER)
- Communities map to Solana programs/PDAs for on-chain operations
- **All data must be scoped by `communityId`**—enforce at API and DB layers
- Never allow cross-community data access (except SUPER_ADMIN)

**Data Isolation Rules**:

- Every query MUST filter by `communityId` or validate user permissions
- Use middleware: `requireAuth()`, `requireCommunityAdmin()`, `requireSuperAdmin()`
- Community admins can ONLY access their own community data
- Platform admins can access all data for moderation/support

**Database Schema**:

```prisma
// User can own multiple communities
model User {
  ownedCommunities Community[]
  communityMembers CommunityMember[]
  role UserRole @default(MEMBER) // SUPER_ADMIN, ADMIN, or MEMBER
}

// Each community is isolated
model Community {
  id       String @id
  ownerId  String
  guildId  String? @unique  // Optional Discord guild
  members  CommunityMember[]
  events   Event[]
}

// Role-based access within community
model CommunityMember {
  communityId String
  userId      String
  role        CommunityMemberRole // OWNER, ADMIN, MODERATOR, MEMBER
  @@unique([communityId, userId])
}
```

**Reference**: [apps/web/prisma/schema.prisma](../apps/web/prisma/schema.prisma)

---

## Critical Workflows

### Event Lifecycle

1. **Create**: Admin designs event with Discord + Solana requirements
2. **Post**: Bot posts embed to Discord with event page link
3. **Verify**: On submission, validate Discord requirements + Solana wallet on-chain
4. **Close**: Event closes; bot triggered to refresh verification state
5. **Pick Winners**: Random or manual selection from valid entries
6. **Announce**: Results shown on web + Discord update

### Solana Verification Flow

1. User connects wallet via `@solana/wallet-adapter-react`
2. Backend verifies wallet ownership (signature challenge or state check)
3. Check on-chain state (tokens, NFTs) if requirements demand it
4. Entry marked VALID or INVALID server-side
5. On-chain state is authoritative when used; off-chain UX is secondary

### Bot Commands

- `/droplabz setup` — configure guild
- `/droplabz post <eventId>` — post embed with event link
- `/droplabz close <eventId>` — trigger verification refresh

---

## Solana dApp Development Standards

### Smart Contracts (Mandatory)

- **Language**: Rust + Anchor Framework
- **State**: Use PDAs (Program Derived Addresses) for all state
- **Access Control**: Use `#[account]` constraints (`has_one`, `constraint`)
- **Math**: Always use checked arithmetic; never unchecked
- **Accounts**: Use `Account<T>` wrappers; avoid bare `AccountInfo::data` access
- **Security**: Explicit signer checks, validate all accounts, separate authority from user accounts

### Frontend (Solana)

- Use `useConnection` and `useWallet` hooks
- **Wallet connection is REQUIRED** for all entries
- Handle RPC failures gracefully
- Explicit blockchain interactions (no magic)

### Testing

- Anchor TypeScript tests with Mocha/Chai
- Cover: initialization, invalid accounts, permission failures, constraint violations, success paths

---

## Security & Anti-Abuse

- **One entry per wallet per event** (enforce at API + optionally on-chain)
- Rate limit entry submissions
- **Server-side verification required** before accepting entries
- On-chain state is authoritative (for eligibility/claims)
- **Log all admin actions** via AuditLog

---

## Development Practices

- **Language**: Generate TypeScript everywhere (except Rust for Solana programs)
- **Correctness > Cleverness**: Keep functions small and explicit
- **Schema Migrations**: Update Prisma schema and run migrations together; commit both
- **API Validation**: Use Zod for all inputs; no invalid data to DB
- **Error Handling**: Explicit error codes for client clarity (especially Solana RPC errors)
- **Permissions**: Always verify `communityId` ownership before modifying data

---

## Environment Variables

```
DATABASE_URL=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_BOT_TOKEN=
APP_BASE_URL=
SOLANA_RPC_URL=
SOLANA_PROGRAM_ID=
```

**Location**: Single `.env` file in workspace root (NOT `.env.local`)

---

## Key Directories & Files

### Critical Implementation Files

- [apps/web/src/lib/auth/middleware.ts](../apps/web/src/lib/auth/middleware.ts) — Auth middleware (`requireAuth`, `requireCommunityAdmin`)
- [apps/web/src/lib/api-utils.ts](../apps/web/src/lib/api-utils.ts) — `ApiError` class and response helpers
- [apps/web/src/lib/wallet/](../apps/web/src/lib/wallet/) — Wallet adapter setup and hooks
- [apps/web/src/lib/solana/verification.ts](../apps/web/src/lib/solana/verification.ts) — Solana wallet validation
- [apps/web/prisma/schema.prisma](../apps/web/prisma/schema.prisma) — Database schema (source of truth)

### Directory Structure

- `/apps/web` — Next.js app (admin + public pages)
- `/apps/bot` — Discord bot service
- `/programs` — Solana Rust programs (Anchor)
- `/packages/sdk` — Shared TypeScript utilities
- `/apps/web/src/lib/wallet` — Wallet adapter integration

### Documentation Files

- [README.md](../README.md) — Project overview and setup
- [SETUP.md](../SETUP.md) — Detailed setup checklist
- [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) — Visual design guidelines
- [PLATFORM_ARCHITECTURE.md](../PLATFORM_ARCHITECTURE.md) — Full architecture documentation
- [SUBBER_INTEGRATION.md](../SUBBER_INTEGRATION.md) — Central Subber integration guide
- [SUBBER_INTEGRATION_QUICK_REF.md](../SUBBER_INTEGRATION_QUICK_REF.md) — Subber ops quick reference
- [SUBBER_INTEGRATION_VERIFICATION_REPORT.md](../SUBBER_INTEGRATION_VERIFICATION_REPORT.md) — Subber integration verification
- [docs/guides/WALLET_INTEGRATION.md](../docs/guides/WALLET_INTEGRATION.md) — Wallet setup guide
- [PRETTIER_SETUP.md](../PRETTIER_SETUP.md) — Code formatting guide

---

## Common Tasks

### Add New API Endpoint

1. Create route file: `apps/web/src/app/api/[resource]/route.ts`
2. Import auth middleware and validation
3. Define Zod schema for request body
4. Add authentication check (requireAuth or requireCommunityAdmin)
5. Validate input with Zod
6. Execute database query with communityId filter
7. Return JSON response
8. Run `pnpm format` before committing

**Example**: [apps/web/src/app/api/events/route.ts](../apps/web/src/app/api/events/route.ts)

### Add Database Model

1. Edit `apps/web/prisma/schema.prisma`
2. Add model with proper relations
3. Run `pnpm db:push` (dev) or `pnpm db:migrate` (prod)
4. Update TypeScript types if needed
5. Run `pnpm format` on schema file

### Add Bot Command

1. Create command file: `apps/bot/src/commands/[name].ts`
2. Export async function accepting `ChatInputCommandInteraction`
3. Register command in `apps/bot/src/index.ts`
4. Validate subscription status via API call
5. Execute command logic
6. Reply to interaction

---

## Design Principles

- **Operator-first**: Admins design custom event flows
- **Modular**: Events, requirements, verification, rewards are composable
- **Automation-focused**: Web + Discord bot act as one system
- **On-chain truth**: Solana is authoritative; web/Discord are views
- **Extendable**: Design for future access control, token gating, claims, rewards

---

## Wallet Integration (Anza Wallet Adapter)

DropLabz uses the **official Anza Wallet Adapter** for Solana wallet connection.

### Architecture

- **Provider Setup**: 3-layer nesting in `src/app/layout.tsx`
    - `ConnectionProvider` (RPC endpoint)
    - `WalletProvider` (wallet state & lifecycle)
    - `WalletModalProvider` (wallet selection UI)
- **Auto-detection**: Wallets discovered via Solana Wallet Standard (no manual list needed)
- **Auto-connect**: Persists wallet selection in localStorage
- **Mobile Support**: Automatically handles Solana Mobile Wallet Adapter Protocol

### Common Patterns

```tsx
// Get wallet state
import { useWalletState } from '@/lib/wallet';
const { publicKey, connected } = useWalletState();

// Require connected wallet
import { useRequireWallet } from '@/lib/wallet';
const publicKey = useRequireWallet(); // Throws if not connected

// Display wallet button
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
<WalletMultiButton />;
```

### Rules

- ✅ All entries **MUST** have a connected Solana wallet (mandatory requirement)
- ✅ Verify wallet ownership **server-side** before accepting entries
- ✅ Use `publicKey.toBase58()` to store wallet address
- ✅ One entry per wallet per event (enforce at API layer)
- ⚠️ Never request seed phrases—wallet adapter handles signing
- ⚠️ Always check `connected` state before calling wallet methods

### Environment

- `NEXT_PUBLIC_SOLANA_NETWORK` — devnet, testnet, or mainnet-beta
- `NEXT_PUBLIC_SOLANA_RPC_URL` — Custom RPC endpoint (optional)
- See [docs/guides/WALLET_INTEGRATION.md](../docs/guides/WALLET_INTEGRATION.md) for full setup guide

---

## UI/UX Conventions

- SaaS-style, clean interface
- Lab/reactor-inspired visuals
- Avoid hype or scam language
- Prefer: "Event", "Access", "Verification", "Claim" over "Drop", "Moon", "Giveaway"

**See**: [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) for complete visual design, color palette, typography, and UI component guidelines.

### Page Scrolling Guidelines

**CRITICAL**: All pages must have proper scrolling enabled by default.

**Rules**:

- ✅ Pages should scroll naturally without restrictions
- ✅ Use `min-h-screen` or `min-h-full` instead of `h-screen` or `h-full` for outer containers
- ✅ Remove `overflow-hidden` from page-level containers
- ✅ Allow content to flow and scroll as needed
- ❌ Do NOT use `overflow-hidden` on `<body>`, main layout containers, or page wrappers
- ❌ Do NOT restrict page height with `h-screen` or `h-full` unless absolutely necessary

**When to Use `overflow-hidden`**:

- ✅ Modals and overlays (to prevent background scrolling)
- ✅ Specific components that need controlled scroll (tables, sidebars with internal scroll)
- ✅ Image containers to prevent overflow
- ❌ NOT on page-level or layout-level containers

**Layout Pattern**:

```tsx
// ✅ CORRECT: Main layout allows scrolling
<body className="min-h-screen text-white antialiased">
    <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
    </div>
</body>

// ❌ WRONG: Layout blocks scrolling
<body className="h-full overflow-hidden">
    <div className="h-full flex flex-col overflow-hidden">
        <main className="flex-1 overflow-hidden">{children}</main>
    </div>
</body>
```

**Page Pattern**:

```tsx
// ✅ CORRECT: Page content can scroll
export default function Page() {
    return <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">{/* Content flows naturally */}</div>;
}

// ❌ WRONG: Nested overflow wrappers
export default function Page() {
    return (
        <div className="h-full overflow-hidden">
            <div className="h-full overflow-y-auto">{/* Unnecessarily complex */}</div>
        </div>
    );
}
```

**Testing**: After creating/modifying pages:

1. Verify content scrolls properly on mobile and desktop
2. Check that long content doesn't get cut off
3. Ensure background patterns (fixed backgrounds) remain visible while scrolling
4. Test responsive layouts at different screen sizes

---

**Updated**: January 29, 2026
**Status**: Active development — Phase 2 (Core Operations) ~70% complete

| Layer           | Technology                                                             |
| --------------- | ---------------------------------------------------------------------- |
| **Web/Backend** | Next.js (App Router), TypeScript, Tailwind, Prisma, PostgreSQL, Zod    |
| **Auth**        | NextAuth (Discord OAuth + Email/Password)                              |
| **Discord Bot** | Node.js, TypeScript, discord.js (subscription-gated, admin-only)       |
| **Solana**      | Rust + Anchor Framework; @solana/web3.js, @solana/wallet-adapter-react |
