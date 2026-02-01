# DropLabz Setup Checklist

Use this checklist to ensure your development environment is properly configured.

For Subber integration behavior and admin workflows, see:

- [SUBBER_INTEGRATION.md](./SUBBER_INTEGRATION.md)
- [SUBBER_INTEGRATION_QUICK_REF.md](./SUBBER_INTEGRATION_QUICK_REF.md)

## Prerequisites

- [ ] Node.js 18+ installed (`node --version`)
- [ ] pnpm 9.0+ installed (`pnpm --version`)
- [ ] PostgreSQL running (local or Docker)
- [ ] Git installed (`git --version`)
- [ ] Solana CLI installed (`solana --version`) — optional for program development

## Project Setup

- [ ] Clone/initialize the repository
- [ ] Run `pnpm install` in workspace root
- [ ] Copy `.env.example` to `.env`
- [ ] Update `.env` with your configuration (see below)

## Environment Configuration

### Database

- [ ] PostgreSQL running on `localhost:5432` (or update `DATABASE_URL`)
- [ ] Database created (name: `droplabz` or custom)
- [ ] User/password matches `DATABASE_URL`
- [ ] Test connection: `pnpm db:push` in `apps/web`

### Discord OAuth

- [ ] Create Discord application: [https://discord.com/developers/applications](https://discord.com/developers/applications)
- [ ] Copy `Client ID` → `DISCORD_CLIENT_ID`
- [ ] Copy `Client Secret` → `DISCORD_CLIENT_SECRET`
- [ ] Set OAuth2 redirect: `http://localhost:3000/api/auth/callback/discord`
- [ ] Enable "bot" under OAuth2 scopes
- [ ] Grant bot permissions (read messages, send messages, use slash commands)
- [ ] Copy bot token → `DISCORD_BOT_TOKEN`

### Solana

- [ ] Choose cluster: devnet (testing) or mainnet-beta
- [ ] Update `SOLANA_RPC_URL` (e.g., `https://api.devnet.solana.com`)
- [ ] Create test wallet or use existing one
- [ ] Update `solana config` if using CLI: `solana config set --url [RPC_URL]`
- [ ] (Later) Deploy program and update `SOLANA_PROGRAM_ID`

### Application URLs

- [ ] `APP_BASE_URL=http://localhost:3000` for local development
- [ ] `NEXTAUTH_URL=http://localhost:3000`
- [ ] `NEXTAUTH_SECRET=` (generate: `openssl rand -base64 32`)

## Running Services

### Option 1: Start All Services

```bash
pnpm dev
# Starts: Next.js, Discord bot, file watching for Solana
```

### Option 2: Start Individually

```bash
# Terminal 1: Web app
cd apps/web && pnpm dev
# Runs on http://localhost:3000

# Terminal 2: Bot
cd apps/bot && pnpm dev
# Bot connects to Discord

# Terminal 3: Solana (optional)
cd programs/verification && anchor test
# Or: anchor build
```

## Verification

- [ ] Web app loads at `http://localhost:3000`
- [ ] Can see Prisma logs when making database queries
- [ ] Discord bot appears online in test server
- [ ] Bot responds to `/droplabz` slash command (replies with ephemeral message)
- [ ] No TypeScript errors: `pnpm type-check`

## Database Setup (One-Time)

```bash
cd apps/web

# Push schema to database
pnpm db:push

# Open Studio to inspect
pnpm db:studio
```

Should see tables:

- Community
- AdminUser
- Event
- Requirement
- Entry
- Winner
- AuditLog

## Testing Discord Integration (Optional)

1. Create a test Discord server or use existing
2. Add bot to server via OAuth link with bot scope
3. In terminal with bot running, try command in Discord:

    ```text
    /droplabz setup
    ```

4. Bot should respond with ephemeral message

## First Development Task

Once everything is set up:

1. [ ] Create a community record via SQL or Prisma Studio
2. [ ] Create an event for that community
3. [ ] Test `/api/events/:eventId` endpoint
4. [ ] Add an entry via `/api/entries` POST request
5. [ ] Verify entry appears in database

## Troubleshooting

### "Cannot find module"

- Run `pnpm install` again
- Delete `node_modules` and `pnpm-lock.yaml`, then reinstall

### Database connection error

- Check `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Test: `psql -U postgres -h localhost -c "SELECT 1"`

### Bot doesn't respond

- Check `DISCORD_BOT_TOKEN` is valid
- Verify bot is in test server
- Check terminal logs for connection errors

### Solana errors

- Confirm RPC URL is reachable: `curl [RPC_URL]`
- Check `SOLANA_PROGRAM_ID` is valid format
- Review Anchor error messages for specific issues

## Next Steps

- [ ] Read `.github/copilot-instructions.md` for coding guidelines
- [ ] Review `/apps/web/prisma/schema.prisma` for data model
- [ ] Check `/packages/sdk/src/types.ts` for shared types
- [ ] Look at `/apps/web/src/app/api/` for API endpoint patterns
- [ ] Explore Discord bot commands in `/apps/bot/src/commands/`

## Resources

- [DropLabz README](./README.md) — Project overview
- [DropLabz Quick Start](./QUICKSTART.md) — Development commands
- [Copilot Instructions](./.github/copilot-instructions.md) — AI agent guidelines
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Solana Docs](https://docs.solana.com)
