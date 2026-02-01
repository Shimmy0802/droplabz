# DropLabz

A Solana-native, multi-tenant community operations platform.

> **📚 [View the complete Documentation Index →](./DOCUMENTATION_INDEX.md)**

## ⭐ Subber Integration (Central Doc Set)

These are the canonical docs for Subber-inspired features in DropLabz:

- [SUBBER_INTEGRATION.md](./SUBBER_INTEGRATION.md)
- [SUBBER_INTEGRATION_QUICK_REF.md](./SUBBER_INTEGRATION_QUICK_REF.md)
- [SUBBER_INTEGRATION_VERIFICATION_REPORT.md](./SUBBER_INTEGRATION_VERIFICATION_REPORT.md)

## 🏗️ Architecture

```text
droplabz/
├── apps/
│   ├── web/          # Next.js admin + public pages
│   └── bot/          # Discord bot service
├── programs/
│   └── verification/ # Solana/Anchor smart contracts
├── packages/
│   └── sdk/          # Shared TypeScript utilities
└── pnpm-workspace.yaml
```

## 📦 Tech Stack

- **Frontend/Backend**: Next.js 14, TypeScript, Tailwind CSS
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth (Discord OAuth)
- **Discord**: discord.js
- **Solana**: Rust + Anchor Framework
- **Package Manager**: pnpm (workspaces)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9.0+
- PostgreSQL (local or Docker)
- Solana CLI (for program development)

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Update .env with your values (Discord, Solana, Database URLs)
```

### Development

Start all services in watch mode:

```bash
pnpm dev
```

Or run individual services:

```bash
# Web app (http://localhost:3000)
cd apps/web && pnpm dev

# Bot (requires DISCORD_BOT_TOKEN)
cd apps/bot && pnpm dev

# Solana tests
cd programs/verification && anchor test
```

### Database

```bash
# Push schema to database
pnpm db:push

# Open Prisma Studio
pnpm db:studio

# Create and run migrations
pnpm db:migrate
```

## 📁 Project Structure

### `/apps/web` — Next.js Web Application

- **Admin Dashboard**: Community management, event creation, winner selection
- **Public Pages**: Event listings, entry submission, wallet verification
- **API Routes**: REST endpoints for events, entries, verification

Key files:

- `prisma/schema.prisma` — Database schema
- `src/app/api/` — Route handlers
- `src/lib/solana/` — Solana verification logic

### `/apps/bot` — Discord Bot

- Slash commands: `/droplabz setup`, `/droplabz post`, `/droplabz close`
- Event posting as Discord embeds
- Verification triggers

Key files:

- `src/commands/` — Command handlers
- `src/lib/api-client.ts` — HTTP client to web API

### `/programs/verification` — Solana Smart Contract

- Event initialization and state management (PDAs)
- Wallet registration and verification
- Entry validation (on-chain access control)

Key files:

- `src/lib.rs` — Main program logic
- `tests/verification.ts` — Anchor TypeScript tests

### `/packages/sdk` — Shared Utilities

Exported types and schemas used across web, bot, and frontend:

- `types.ts` — Core data models (Event, Entry, Community, etc.)
- `validation.ts` — Zod schemas for API inputs
- `solana.ts` — Solana address validation

## 🔒 Security

- **Multi-tenant isolation**: All data scoped by `communityId`
- **One entry per wallet per event**: Enforced at API and optionally on-chain
- **Server-side verification**: Required before accepting entries
- **On-chain authority**: Solana smart contracts are the source of truth
- **Audit logging**: All admin actions logged via `AuditLog` table

## 🌐 Multi-Tenant Design

- **Communities** map 1:1 to Discord guilds
- Admin permissions validated via Discord OAuth + guild roles
- All database queries filtered by `communityId`
- Each community can map to different Solana programs/PDAs

## 📊 Data Model

**Community**: Represents a Discord guild

- `guildId`, `name`, `ownerUserId`, `solanaConfig`

**Event**: Represents a giveaway, whitelist, or access event

- `type` (GIVEAWAY | WHITELIST | ACCESS | AIRDROP)
- `status` (DRAFT | ACTIVE | CLOSED)
- `requirements` (array of discord/solana requirements)

**Entry**: User/wallet entry into an event

- `walletAddress` (required, must be verified)
- `status` (PENDING | VALID | INVALID after verification)
- Unique constraint: one per wallet per event

**Winner**: Selected entries from valid entries

- Selected via RANDOM or MANUAL mode
- Stored for historical record

**AuditLog**: Track all admin actions

- `action`, `meta` (JSON), `createdAt`

## 🔗 API Endpoints (Draft)

### Events

- `POST /api/events` — Create event (admin)
- `GET /api/events/:eventId` — Get event details with entries
- `POST /api/events/:eventId/close` — Close event (admin)
- `POST /api/events/:eventId/winners/pick` — Select winners (admin)

### Entries

- `POST /api/entries` — Submit wallet entry
- `GET /api/events/:eventId/entries` — List entries (paginated)

### Verification

- `POST /api/verification/wallet` — Verify Solana wallet

## 🤖 Bot Commands

- `/droplabz setup` — Register guild and configure Solana program
- `/droplabz post <eventId>` — Post event embed to Discord
- `/droplabz close <eventId>` — Close event and trigger verification

## 🔬 Testing

### Web App

```bash
cd apps/web
pnpm build
pnpm type-check
```

### Bot

```bash
cd apps/bot
pnpm build
```

### Solana Program

```bash
cd programs/verification
anchor build
anchor test
```

## 🌍 Environment Variables

See `.env.example` for all required variables:

- `DATABASE_URL` — PostgreSQL connection
- `NEXTAUTH_SECRET` — NextAuth session encryption
- `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` — OAuth app
- `DISCORD_BOT_TOKEN` — Bot token for slash commands
- `SOLANA_RPC_URL` — Solana cluster RPC endpoint
- `SOLANA_PROGRAM_ID` — Deployed program ID
- `APP_BASE_URL` — Web app URL (for Discord bot API calls)

## 🚀 MVP Scope

1. ✅ Discord OAuth login
2. ✅ Solana wallet connection (required)
3. ✅ Community creation from guild selection
4. ✅ Event creation with Discord + Solana requirements
5. ✅ Public event entry page
6. ✅ Server-side + Solana verification
7. ✅ Bot posting embeds with links
8. ✅ Random winner selection
9. ✅ Winner display on web + Discord update

## 📝 Development Guidelines

See `.github/copilot-instructions.md` for AI agent guidelines including:

- Architecture patterns and design principles
- Security and anti-abuse rules
- Development practices and conventions
- Solana dApp standards

## 📄 License

MIT

## 🤝 Contributing

Follow the conventions in `.github/copilot-instructions.md` and maintain TypeScript strict mode.
