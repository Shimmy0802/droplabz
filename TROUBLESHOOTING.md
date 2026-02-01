# Troubleshooting Guide

**Last Updated**: February 1, 2026

---

## Common Issues & Solutions

### 🔴 Authentication Issues

#### NextAuth 404 Error

**Symptoms**:

- `/api/auth/session` returns 404
- Unable to sign in
- Session not persisting

**Solution**:

```bash
# 1. Check .env file exists at workspace root
ls -la .env

# 2. Verify NEXTAUTH_SECRET is set
grep NEXTAUTH_SECRET .env

# 3. Generate new secret if needed
openssl rand -base64 32

# 4. Restart dev server
pnpm dev
```

**Root Cause**: Missing or invalid `NEXTAUTH_SECRET` in environment variables

---

#### Discord OAuth Not Working

**Symptoms**:

- Discord login button doesn't work
- OAuth redirect fails
- "Invalid redirect URI" error

**Solution**:

```bash
# 1. Check Discord OAuth settings at discord.com/developers
# 2. Verify redirect URI matches:
http://localhost:3000/api/auth/callback/discord

# 3. Confirm .env has Discord credentials
grep DISCORD_CLIENT_ID .env
grep DISCORD_CLIENT_SECRET .env
```

---

### 🔴 Build & Runtime Errors

#### zlib-sync Module Not Found

**Symptoms**:

```
Error: Cannot find module 'zlib-sync'
Module not found: Can't resolve 'zlib-sync'
```

**Solution**:

```bash
# Remove discord.js from web app dependencies
cd apps/web
pnpm remove discord.js

# Discord.js should ONLY be in apps/bot
cd ../bot
pnpm add discord.js
```

**Root Cause**: discord.js imported in web app causes bundler issues

---

#### TypeScript Type Errors

**Symptoms**:

```
error TS6133: 'X' is declared but its value is never read
```

**Solution**:

```bash
# These are warnings, not errors. To fix:
# 1. Remove unused imports
# 2. Or suppress with eslint comment
// eslint-disable-next-line @typescript-eslint/no-unused-vars

# Run type-check to verify no blocking errors
pnpm type-check
```

**Note**: Unused import warnings are non-blocking

---

#### Next.js Build Cache Issues

**Symptoms**:

- Changes not appearing
- Old routes still working after deletion
- Build errors that don't make sense

**Solution**:

```bash
# Clear Next.js cache
rm -rf apps/web/.next
rm -rf apps/web/.turbo

# Restart dev server
cd /home/shimmy/droplabz
pnpm dev
```

---

### 🔴 Database Issues

#### Prisma Client Not Generated

**Symptoms**:

```
Error: Cannot find module '@prisma/client'
PrismaClient is unable to be run in the browser
```

**Solution**:

```bash
cd apps/web
pnpm prisma generate
pnpm dev
```

---

#### Database Connection Failed

**Symptoms**:

```
Error: Can't reach database server
P1001: Can't reach database server at localhost:5432
```

**Solution**:

```bash
# 1. Check PostgreSQL is running
sudo systemctl status postgresql
# or
pg_isready

# 2. Verify DATABASE_URL in .env
grep DATABASE_URL .env

# 3. Test connection
psql -U postgres -h localhost -c "SELECT 1"
```

---

#### Schema Out of Sync

**Symptoms**:

```
Error: The table `Event` does not exist in the current database
```

**Solution**:

```bash
cd apps/web

# Development: Push schema without migration
pnpm db:push

# Production: Create and run migration
pnpm db:migrate
```

---

### 🔴 Discord Bot Issues

#### Bot Not Responding to Commands

**Symptoms**:

- Slash commands don't appear
- Bot shows offline
- Commands return "Unknown interaction"

**Solution**:

```bash
# 1. Check bot is running
# Terminal should show:
# "✅ Bot logged in as [BotName]"
# "[Bot API] HTTP server listening on http://127.0.0.1:3001"

# 2. Verify DISCORD_BOT_TOKEN in .env
grep DISCORD_BOT_TOKEN .env

# 3. Check bot has proper permissions in Discord server
# Required: Send Messages, Embed Links, Use Slash Commands

# 4. Re-register slash commands (if needed)
# Commands are registered on bot startup
```

---

#### Announcements Not Posting

**Symptoms**:

- "Announce to Discord" button doesn't work
- No embed appears in Discord channel

**Solution**:

```bash
# 1. Verify bot is running on port 3001
curl http://127.0.0.1:3001

# 2. Check Discord guild and channel are configured
# Admin Panel → Settings → Discord Server → Announcement Channel

# 3. Verify bot has access to announcement channel
# Bot must be able to send messages in that channel

# 4. Check bot logs for errors
# Terminal running bot will show POST /announce requests
```

---

### 🔴 Routing & Navigation Issues

#### 404 Page Not Found

**Symptoms**:

- Clicking links results in 404
- Page exists but URL is wrong

**Solution**:

```bash
# Check routing structure:
# Public routes: /communities/[slug]
# User routes: /profile/*
# Community admin: /profile/communities/[slug]/admin/*
# Platform admin: /profile/admin/*

# Common fixes:
# Wrong: /admin/whitelists/[id]
# Right: /profile/communities/[slug]/admin/whitelists/[id]

# Wrong: /communities/[slug]/admin
# Right: /profile/communities/[slug]/admin
```

---

#### Sidebar Menu Items Missing

**Symptoms**:

- Menu shows some items but not all
- Expected navigation options not visible

**Solution**:

```bash
# This was fixed on Jan 30, 2026
# If still seeing issues:

# 1. Verify you're on community admin page
# URL should be: /profile/communities/[slug]/admin

# 2. Check AppSidebar.tsx for proper context detection
# File: apps/web/src/components/AppSidebar.tsx

# 3. Clear browser cache
# Ctrl+Shift+R (hard refresh)
```

---

### 🔴 Solana Wallet Issues

#### Wallet Not Connecting

**Symptoms**:

- "Connect Wallet" button doesn't work
- Wallet modal doesn't appear
- "Wallet not found" error

**Solution**:

```bash
# 1. Check NEXT_PUBLIC_SOLANA_NETWORK in .env
grep NEXT_PUBLIC_SOLANA_NETWORK .env
# Should be: devnet, testnet, or mainnet-beta

# 2. Ensure wallet extension is installed
# Phantom, Solflare, Backpack, etc.

# 3. Check browser console for errors
# Look for wallet adapter errors

# 4. Verify WalletContextProvider is wrapping app
# File: apps/web/src/app/layout.tsx
```

---

#### Transaction Failed

**Symptoms**:

- Transaction rejected
- "Insufficient funds" error
- RPC error

**Solution**:

```bash
# 1. Check wallet has SOL balance (for fees)
# On devnet, use faucet: https://faucet.solana.com

# 2. Verify RPC endpoint is responsive
curl $NEXT_PUBLIC_SOLANA_RPC_URL

# 3. Check program ID is correct
grep SOLANA_PROGRAM_ID .env

# 4. Verify network matches wallet network
# Wallet must be on same network as NEXT_PUBLIC_SOLANA_NETWORK
```

---

### 🔴 Development Environment

#### "Cannot find module" Errors

**Symptoms**:

```
Error: Cannot find module 'X'
Module not found: Can't resolve 'X'
```

**Solution**:

```bash
# 1. Install dependencies
pnpm install

# 2. If persists, clear node_modules
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
pnpm install

# 3. Check package.json for typos
```

---

#### Prettier Formatting Issues

**Symptoms**:

- Code not formatting on save
- Format command fails
- Inconsistent formatting

**Solution**:

```bash
# 1. Verify Prettier config exists
cat package.json | grep prettier
# Should show: "prettier": "@solana/prettier-config-solana"

# 2. Run format manually
pnpm format

# 3. Check for syntax errors
# Prettier won't format files with syntax errors

# 4. Install VS Code Prettier extension
# Extension ID: esbenp.prettier-vscode
```

---

### 🔴 Performance Issues

#### Slow Page Loads

**Symptoms**:

- Pages take 5+ seconds to load
- API requests timing out
- High CPU usage

**Solution**:

```bash
# 1. Check database query performance
# Look for N+1 queries in console

# 2. Use Prisma Studio to inspect data
pnpm db:studio

# 3. Restart dev server
# Dev server can get slow over time
pnpm dev

# 4. Clear browser cache and storage
```

---

## Quick Diagnostic Commands

```bash
# Check all services are running
ps aux | grep -E "next|node|postgres"

# Verify environment variables
env | grep -E "NEXTAUTH|DISCORD|SOLANA|DATABASE"

# Check ports in use
lsof -i :3000  # Web app
lsof -i :3001  # Discord bot
lsof -i :5432  # PostgreSQL

# View recent logs
# (if using PM2 or similar)
pm2 logs droplabz-web
pm2 logs droplabz-bot

# Database status
psql -U postgres -c "\l"  # List databases
psql -U postgres -d droplabz -c "\dt"  # List tables
```

---

## Getting Help

### Before Asking for Help

1. ✅ Check this troubleshooting guide
2. ✅ Read error message carefully
3. ✅ Check terminal/console logs
4. ✅ Verify environment variables
5. ✅ Try restarting services

### Information to Provide

- **Error message** (full text)
- **Steps to reproduce**
- **Environment** (OS, Node version, pnpm version)
- **Recent changes** (what did you change before it broke?)
- **Terminal output** (relevant logs)

### Useful Documentation

- [README.md](./README.md) - Project overview
- [SETUP.md](./SETUP.md) - Initial setup guide
- [PLATFORM_ARCHITECTURE.md](./PLATFORM_ARCHITECTURE.md) - Architecture details
- [.github/copilot-instructions.md](./.github/copilot-instructions.md) - Development guidelines

---

**Note**: This guide is based on actual issues encountered during DropLabz development. Most solutions have been tested and verified to work.
