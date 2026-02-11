# Staging Deployment Checklist

**Status**: Ready for staging deployment ✅  
**Last Generated**: February 8, 2026  
**Phase**: Pre-staging validation completed

---

## Pre-Deployment Verification

- [x] TypeScript type-check: **PASS**
- [x] Code formatting (Prettier): **PASS**
- [x] Unit tests (31 tests): **PASS** ✅
  - Sanitization: 8/8 ✅
  - Validation: 6/6 ✅
  - Rate limiting: 3/3 ✅
  - API utilities: 3/3 ✅
  - Auth middleware: 6/6 ✅
  - Solana verification: 5/5 ✅
- [x] Performance baseline executed
  - API endpoints: All within thresholds ✅
  - Database queries: Indexes verified correct ✅
  - Investigation: No blockers identified ✅

---

## Environment Variables Configuration

### Required for Staging (Vercel)

| Variable | Current (Dev) | Staging | Priority | Notes |
|----------|---------------|---------|----------|-------|
| `DATABASE_URL` | Neon devnet | Neon staging DB | **CRITICAL** | Use separate staging database |
| `NEXTAUTH_URL` | localhost:3000 | `https://droplabz-staging.vercel.app` | **CRITICAL** | Must match Vercel staging domain |
| `NEXTAUTH_SECRET` | ✅ Configured | Keep same | MEDIUM | Already secure, reuse in staging |
| `DISCORD_CLIENT_ID` | 1464862221203935252 | Use staging app or same | MEDIUM | Can reuse dev app for testing |
| `DISCORD_CLIENT_SECRET` | Configured | Keep same or staging app | MEDIUM | Match CLIENT_ID choice |
| `DISCORD_BOT_TOKEN` | Configured | Use staging bot or same | MEDIUM | Can reuse for testing |
| `DISCORD_BOT_API_URL` | localhost:3001 | Staging bot endpoint | MEDIUM | Update if separate bot instance |
| `APP_BASE_URL` | localhost:3000 | `https://droplabz-staging.vercel.app` | **CRITICAL** | Links and redirects depend on this |
| `NEXT_PUBLIC_SOLANA_NETWORK` | devnet | **testnet** or mainnet-beta | **CRITICAL** | Upgrade from devnet for staging |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | api.devnet.solana.com | api.testnet.solana.com | **CRITICAL** | Match network upgrade |
| `SOLANA_RPC_URL` | api.devnet.solana.com | api.testnet.solana.com | **CRITICAL** | Backend verification |
| `SOLANA_PROGRAM_ID` | your-program-id | Staging program ID | **CRITICAL** | Must be deployed to testnet/mainnet |
| `SUPER_ADMIN_DISCORD_IDS` | Configured | Keep or update | LOW | Staging admins |
| `SUPER_ADMIN_WALLET_ADDRESSES` | Configured | Keep or update | LOW | Staging admin wallets |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Configured | Keep same | LOW | Can reuse for staging images |
| `CLOUDINARY_API_KEY` | Configured | Keep same | LOW | API key is for upload only |
| `CLOUDINARY_API_SECRET` | Configured | Keep same | LOW | Already secure |

### Critical Actions Required

**BEFORE deploying to Vercel staging:**

1. **Database Setup**
   - [ ] Create or designate staging PostgreSQL database in Neon
   - [ ] Run migrations: `pnpm db:push` or `pnpm db:migrate`
   - [ ] Seed initial data if needed
   - [ ] Verify connection string in staging environment

2. **Solana Network Upgrade**
   - [ ] Deploy Anchor programs to **testnet** or **mainnet-beta**
   - [ ] Update `SOLANA_PROGRAM_ID` to deployed program address
   - [ ] Test wallet connection against new network
   - [ ] Verify RPC endpoints are functional

3. **Vercel Environment Setup**
   - [ ] Create Vercel staging project or environment
   - [ ] Set all critical env vars in Vercel dashboard
   - [ ] Enable automatic deployments from `main` branch
   - [ ] Configure domain (or use vercel.app URL)

4. **Discord Integration Verification**
   - [ ] Verify Discord OAuth redirect URIs include staging domain
   - [ ] Test Discord bot token connects to staging bot
   - [ ] Ensure Discord guild IDs are correct for staging server

5. **Post-Deployment Testing**
   - [ ] [ ] Test wallet connection flow end-to-end
   - [ ] [ ] Test Discord OAuth login
   - [ ] [ ] Verify database queries work against staging DB
   - [ ] [ ] Test API endpoints respond correctly
   - [ ] [ ] Check logs for errors

---

## Environment Variable Priority Guide

**CRITICAL** (Must update for staging):
- `DATABASE_URL` — Different database required
- `NEXTAUTH_URL` — Must match staging domain
- `APP_BASE_URL` — Redirects and links depend on this
- `SOLANA_NETWORK` / `SOLANA_RPC_URL` — Network upgrade required
- `SOLANA_PROGRAM_ID` — Must deploy programs to staging network

**MEDIUM** (Should review):
- Discord OAuth variables — Can reuse dev app for initial testing
- `DISCORD_BOT_API_URL` — Update if separate bot instance
- Other Discord bot variables — Keep synchronized

**LOW** (Can reuse from dev):
- `NEXTAUTH_SECRET` — Already secure
- Cloudinary credentials — Can reuse
- Admin Discord IDs — Can keep same for testing

---

## Staging Deployment Steps

### 1. Prepare Environment Variables

```bash
# In Vercel dashboard, set environment variables for staging:
# Go to Settings → Environment Variables

DATABASE_URL="postgresql://user:password@staging-db.neon.tech/staging_db?sslmode=require"
NEXTAUTH_URL="https://droplabz-staging.vercel.app"
NEXTAUTH_SECRET="<existing-secret>"
APP_BASE_URL="https://droplabz-staging.vercel.app"
NEXT_PUBLIC_SOLANA_NETWORK="testnet"
NEXT_PUBLIC_SOLANA_RPC_URL="https://api.testnet.solana.com"
SOLANA_RPC_URL="https://api.testnet.solana.com"
SOLANA_PROGRAM_ID="<testnet-deployed-program-id>"
DISCORD_CLIENT_ID="<your-discord-id>"
DISCORD_CLIENT_SECRET="<your-discord-secret>"
DISCORD_BOT_TOKEN="<your-bot-token>"
DISCORD_BOT_API_URL="https://droplabz-bot-staging.vercel.app"
SUPER_ADMIN_DISCORD_IDS="<your-discord-ids>"
SUPER_ADMIN_WALLET_ADDRESSES="<your-wallet-addresses>"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="<your-cloudinary-name>"
CLOUDINARY_API_KEY="<your-api-key>"
CLOUDINARY_API_SECRET="<your-api-secret>"
```

### 2. Deploy to Vercel Staging

```bash
# Option A: Deploy via git (recommended)
# Just push to main, Vercel will auto-deploy to staging environment

# Option B: Manual deployment
vercel deploy --prod --env-file .env.staging
```

### 3. Verify Deployment

```bash
# Check deployment status
curl https://droplabz-staging.vercel.app

# Check API health
curl https://droplabz-staging.vercel.app/api/health

# Check bot connectivity
curl https://droplabz-staging.vercel.app/api/bot/status
```

### 4. Run Post-Deployment Tests

```bash
# Connect to staging database
psql $STAGING_DATABASE_URL

# Verify migrations applied
\d

# Check community table
SELECT COUNT(*) FROM "Community";

# Test API endpoints
pnpm --filter @droplabz/web test:integration --env staging
```

---

## Rollback Plan

If staging deployment encounters critical issues:

1. **Revert to last known good commit**
   ```bash
   git revert HEAD
   git push
   # Vercel will auto-redeploy previous commit
   ```

2. **Quick rollback via Vercel UI**
   - Go to Vercel dashboard
   - Select staging project
   - Click deployments → previous successful deployment
   - Click "Redeploy"

3. **Database Rollback** (if schema changed)
   ```bash
   # Restore from backup
   psql $STAGING_DATABASE_URL < staging_backup.sql
   ```

---

## Monitoring During Staging

| Metric | Threshold | Tool |
|--------|-----------|------|
| API Response Time | < 500ms | Vercel Analytics |
| Database Query Time | < 100ms | Performance dashboard |
| Error Rate | < 1% | Sentry (if configured) |
| Uptime | > 99.5% | Vercel Status |

---

## Sign-Off

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Solana programs deployed to testnet
- [ ] Discord integration tested
- [ ] Unit tests passing (31/31)
- [ ] Performance baseline confirmed
- [ ] Security tests passing
- [ ] Code formatting verified

**Approved for Staging Deployment**: ___________________

---

## Next Steps After Staging

1. **Staging Validation Period**: 24-48 hours of monitoring
2. **User Acceptance Testing**: Core team tests features
3. **Production Deployment**: After staging passes UAT

