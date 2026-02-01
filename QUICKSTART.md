# DropLabz Developer Quick Start

## Monorepo Commands

```bash
# Install dependencies
pnpm install

# Start all services in watch mode
pnpm dev

# Build all packages
pnpm build

# Type check all packages
pnpm type-check

# Lint all packages
pnpm lint
```

## Package-Specific Commands

### Web App (`apps/web`)

```bash
cd apps/web

# Development
pnpm dev                    # Start Next.js dev server

# Database
pnpm db:push               # Push schema to database
pnpm db:studio             # Open Prisma Studio UI
pnpm db:migrate            # Create and run migrations

# Build & Deploy
pnpm build                 # Build for production
pnpm start                 # Start production server
```

### Discord Bot (`apps/bot`)

```bash
cd apps/bot

# Development
pnpm dev                   # Start bot with ts-node

# Build
pnpm build                 # Compile TypeScript to dist/
```

### Solana Program (`programs/verification`)

```bash
cd programs/verification

# Development
anchor build               # Build program
anchor test                # Run TypeScript tests
anchor deploy devnet       # Deploy to devnet (requires CLI)

# Keys & Config
solana config get          # Check cluster & keypair
```

## Key Files & Their Purpose

| Path                               | Purpose                          |
| ---------------------------------- | -------------------------------- |
| `pnpm-workspace.yaml`              | Monorepo workspace configuration |
| `apps/web/prisma/schema.prisma`    | Database schema                  |
| `apps/web/src/lib/validation.ts`   | Zod schemas for API inputs       |
| `apps/web/src/lib/db.ts`           | Prisma client singleton          |
| `apps/bot/src/commands/`           | Bot slash command handlers       |
| `apps/bot/src/lib/api-client.ts`   | HTTP client to web API           |
| `programs/verification/src/lib.rs` | Solana smart contract code       |
| `packages/sdk/src/types.ts`        | Shared TypeScript types          |
| `.github/copilot-instructions.md`  | AI agent guidelines              |

## Common Workflows

### Adding a New API Endpoint

1. **Create Zod schema** in `apps/web/src/lib/validation.ts`
2. **Create route handler** in `apps/web/src/app/api/`
3. **Use Prisma** via `import { db } from '@/lib/db'`
4. **Return via `apiResponse(data)` or `apiError(error)`**
5. **Update `.github/copilot-instructions.md`** if new pattern

Example:

```typescript
import { db } from '@/lib/db';
import { apiResponse, apiError } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
    try {
        // Parse & validate
        const input = mySchema.parse(await request.json());

        // Query database
        const result = await db.event.create({ data: input });

        // Return success
        return apiResponse(result, 201);
    } catch (error) {
        return apiError(error);
    }
}
```

### Adding a New Database Entity

1. **Update `apps/web/prisma/schema.prisma`**
2. **Export type in `packages/sdk/src/types.ts`**
3. **Run `pnpm db:push`** in `apps/web`
4. **Create API endpoints** for CRUD operations

### Calling Web API from Bot

Use the HTTP client in `apps/bot/src/lib/api-client.ts`:

```typescript
import { fetchEvent, closeEvent } from './lib/api-client';

const event = await fetchEvent(eventId);
await closeEvent(eventId);
```

## Testing Locally

### Database

```bash
# Start PostgreSQL (Docker)
docker run --name droplabz-db -e POSTGRES_PASSWORD=password -d postgres

# Or use a local PostgreSQL instance
# Update DATABASE_URL in .env
```

### Discord Bot

```bash
# Create a test Discord server
# Add bot via https://discord.com/developers/applications
# Copy bot token to DISCORD_BOT_TOKEN in .env
# Run: cd apps/bot && pnpm dev
```

### Solana Program

```bash
# Use devnet for testing
# Set SOLANA_RPC_URL=https://api.devnet.solana.com in .env
# Run: anchor test
```

## Debugging

### Web App

- Open `http://localhost:3000`
- VS Code: F5 to attach debugger
- Prisma Studio: `pnpm db:studio`

### Bot

- Check terminal output for logs
- Add `console.log()` for debugging
- Run `pnpm build` to check TypeScript errors

### Solana

- Run `anchor test --skip-build` to debug
- Check Solana docs: [https://docs.rs/anchor-lang/latest](https://docs.rs/anchor-lang/latest)

## Common Issues

**"Cannot find module"** → Run `pnpm install` in workspace root

**Database connection error** → Check `DATABASE_URL` in `.env`

**Bot doesn't respond** → Check `DISCORD_BOT_TOKEN` and bot permissions

**Solana program error** → Check RPC URL and cluster in `solana config get`

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [discord.js Docs](https://discord.js.org)
- [Anchor Docs](https://www.anchor-lang.com)
- [Solana Docs](https://docs.solana.com)
