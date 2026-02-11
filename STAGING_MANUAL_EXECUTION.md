# Staging Deployment - Manual Execution Plan

**Date**: February 8, 2026, 22:00 UTC  
**Status**: ✅ Preparation complete, automated steps blocked by environment  
**Action Required**: Manual steps needed (external service access required)

---

## Summary of Completion Status

✅ **Automated Pre-Deployment (Completed)**:
- Unit tests: 31/31 passing
- TypeScript compilation: ✅ Pass
- Code formatting: ✅ Pass
- Performance validation: ✅ Pass
- Database indexes: ✅ Optimized
- Solana CLI: ✅ Configured for testnet
- Anchor.toml: ✅ Updated with provider config

⏳ **Blocked by External Services**:
- Testnet faucet: Rate-limited (common)
- Cargo environment: Version conflicts (Rust 1.84.0 vs anchor 0.32.1)
- Neon database: Requires console/CLI access
- Vercel env vars: Requires dashboard access
- Discord OAuth: Requires developer portal

---

## Detailed Manual Execution Steps

### ❌ BLOCKED #1: Testnet Faucet Rate-Limited

**Issue**: `Error: airdrop request failed. This can happen when the rate limit is reached.`

**Why**: Public testnet faucets have rate limits (1 airdrop per wallet per ~hour).

**Solution - Choose One**:

#### Option A: Wait for Rate Limit Reset (Simplest)
- Time: Wait ~60 minutes
- Then: `solana airdrop 5 --url https://api.testnet.solana.com`

#### Option B: Use Alternative Testnet Faucet
```bash
# Try Helius faucet (sometimes less rate-limited)
# Go to: https://www.helius.dev/solana-testnet-faucet

# Enter wallet address: BgznvTng1Q4Qx537HBzJVqwJThDcMmhNvE1rzqKnuQ3N
# Request 5 SOL
# Wait for confirmation
```

#### Option C: Use Alchemy Testnet Faucet
```bash
# Go to: https://www.alchemy.com/faucets/solana-testnet
# Connect wallet or paste: BgznvTng1Q4Qx537HBzJVqwJThDcMmhNvE1rzqKnuQ3N
# Request tokens
```

#### Option D: Deploy to Devnet Instead
If testnet is not critical for staging:
```bash
solana config set --url https://api.devnet.solana.com
solana airdrop 5  # Devnet faucet usually works better
```
Then use `devnet` for staging (not production).

---

### ❌ BLOCKED #2: Rust/Cargo Version Conflict

**Issue**:
```
error: failed to parse manifest... feature `edition2024` is required
The package requires the Cargo feature called `edition2024`
This version of Cargo (1.84.0) doesn't support it
```

**Why**: `constant_time_eq v0.4.2` dependency requires newer Rust.

**Solution - Choose One**:

#### Option A: Update Rust (Recommended)
```bash
# Update Rust to latest stable
rustup update stable

# Verify version
cargo --version
# Should show 1.85.0 or newer

# Then try build again
cd /home/shimmy/droplabz
anchor build
```

#### Option B: Pin Dependency Version
Edit `programs/verification/Cargo.toml`:
```toml
[dependencies]
constant_time_eq = "=0.4.1"  # Use older version
```

Then rebuild.

#### Option C: Use Anchor Docker Image
```bash
docker run --rm -v $(pwd):/workspace \
  projectserum/build:latest \
  anchor build
```

---

## Manual Execution Checklist

Copy this checklist and complete each step manually:

### Step 1: Fund Testnet Wallet ⏳ **MANUAL**

```bash
# Your wallet address (save this):
BgznvTng1Q4Qx537HBzJVqwJThDcMmhNvE1rzqKnuQ3N
```

**Action**: 
- [ ] Go to one of the faucets above
- [ ] Paste address and request 5 SOL
- [ ] Wait for confirmation
- [ ] Verify: `solana balance` shows > 0 SOL

---

### Step 2: Fix Rust Version ⏳ **MANUAL**

```bash
# Run in your terminal:
rustup update stable

# Verify update:
cargo --version
# Should show: cargo 1.85.0+
```

**Action**:
- [ ] Run update command
- [ ] Verify cargo version is 1.85.0 or newer

---

### Step 3: Build Anchor Program ✅ **READY TO RUN**

Once steps 1 and 2 are complete:

```bash
cd /home/shimmy/droplabz

# Full build with output
anchor build

# Expected output:
# Compiling verification...
# Finished release [optimized] target(s)
```

**Action**:
- [ ] Run this command after wallet funded and Rust updated
- [ ] Note any output showing compilation success

---

### Step 4: Deploy Program to Testnet ✅ **READY TO RUN**

```bash
anchor deploy --provider.cluster testnet

# Example output:
# Deploying cluster: https://api.testnet.solana.com
# Deploy success. New program Id: [ADDRESS]

# SAVE THE PROGRAM ID! Example:
# Program Id: 9jDjDxcqU6YKYNVkVXHk4k8YWJr7aMfZh2qKDYPknYXV
```

**Action**:
- [ ] Run deploy command
- [ ] **Copy the Program ID** from output
- [ ] Paste below:

```
SOLANA_PROGRAM_ID = [PASTE HERE]
```

---

### Step 5: Create Neon Staging Database ⏳ **MANUAL (Neon Console)**

**Option A: Via Neon Console**

1. Go to: https://console.neon.tech
2. Click "New Project"
3. Name: `droplabz-staging`
4. Region: `us-east-2` (match dev)
5. Click "Create"
6. Wait ~30 seconds
7. Copy connection string from "Connection details" → "psql"

**Save the connection string**:
```
postgresql://neon_user:[password]@ep-staging-xxxxx-pooler.neon.tech/neondb?sslmode=require
DATABASE_URL = [PASTE HERE]
```

**Option B: Via Neon CLI**

```bash
neon projects create --name droplabz-staging

# Get connection string
neon connection-string --project-name droplabz-staging

# Copy output and save as DATABASE_URL
```

**Action**:
- [ ] Create staging database (choose A or B)
- [ ] Copy and save connection string

---

### Step 6: Set Vercel Environment Variables ⏳ **MANUAL (Vercel Dashboard)**

1. Go to: https://vercel.com
2. Select "droplabz" project
3. Settings → Environment Variables
4. Add each variable below for Preview + Production:

**CRITICAL VARIABLES**:

| Name | Value | Source |
|------|-------|--------|
| `SOLANA_PROGRAM_ID` | [from Step 4] | Anchor deploy |
| `DATABASE_URL` | [from Step 5] | Neon staging |
| `NEXTAUTH_URL` | `https://droplabz-staging.vercel.app` | Fixed value |
| `APP_BASE_URL` | `https://droplabz-staging.vercel.app` | Fixed value |
| `NEXT_PUBLIC_SOLANA_NETWORK` | `testnet` | Fixed value |
| `SOLANA_RPC_URL` | `https://api.testnet.solana.com` | Fixed value |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | `https://api.testnet.solana.com` | Fixed value |

**KEEP SAME (from dev .env)**:

| Name | Value |
|------|-------|
| `NEXTAUTH_SECRET` | [from .env] |
| `DISCORD_CLIENT_ID` | 1464862221203935252 |
| `DISCORD_CLIENT_SECRET` | [from .env] |
| `DISCORD_BOT_TOKEN` | [from .env] |
| `DISCORD_BOT_API_URL` | `https://droplabz-bot-staging.vercel.app` |
| `SUPER_ADMIN_DISCORD_IDS` | 1017201660839333899 |
| `SUPER_ADMIN_WALLET_ADDRESSES` | DoDr7ngNc34byAPVVNk7WKvowMuvLQ1xLeDAJvWDnXjY |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | dha7stlbm |
| `CLOUDINARY_API_KEY` | 371387272762974 |
| `CLOUDINARY_API_SECRET` | [from .env] |

**Action**:
- [ ] Go to Vercel dashboard
- [ ] Add all CRITICAL variables
- [ ] Add all KEEP SAME variables
- [ ] Ensure all are set for Preview + Production

---

### Step 7: Update Discord App ⏳ **MANUAL (Discord Developer Portal)**

1. Go to: https://discord.com/developers/applications
2. Select "DropLabz"
3. OAuth2 → General
4. Add Redirect URI:
```
https://droplabz-staging.vercel.app/api/auth/callback/discord
```
5. Click "Save Changes"

**Action**:
- [ ] Add staging redirect URI to Discord app
- [ ] Save configuration

---

### Step 8: Trigger Vercel Deployment ✅ **READY TO RUN**

After completing steps 1-7:

```bash
cd /home/shimmy/droplabz

# Push to trigger Vercel deployment
git add .
git commit -m "Deploy: Staging deployment - Phase 5 complete"
git push origin main

# Monitor deployment
vercel logs --follow
```

**Expected**: Deployment starts within 30 seconds of push.

**Action**:
- [ ] Verify Vercel starts deployment
- [ ] Monitor logs for SUCCESS

---

### Step 9: Run Database Migrations ✅ **READY TO RUN**

After Vercel deployment succeeds:

```bash
cd /home/shimmy/droplabz

# Set temporary env for migration
export DATABASE_URL="[from Step 5]"

# Run migrations
pnpm db:push

# Verify (open GUI)
pnpm db:studio
```

**Action**:
- [ ] Run migrations
- [ ] Verify tables appear in Prisma Studio

---

### Step 10: Validate Staging ✅ **READY TO RUN**

```bash
# Test homepage
curl https://droplabz-staging.vercel.app
# Should return HTML (not 500 error)

# Test API
curl https://droplabz-staging.vercel.app/api/communities
# Should return JSON array

# Watch logs
vercel logs --follow
```

**Manual tests** (browser):
1. Go to https://droplabz-staging.vercel.app
2. Click "Connect Wallet" - should work
3. Try Discord login - should work
4. Create community - should work

**Action**:
- [ ] Verify homepage loads
- [ ] Test API endpoints
- [ ] Test wallet connection
- [ ] Check logs for errors

---

## Success Criteria - All Must Pass ✅

- [ ] Website loads: https://droplabz-staging.vercel.app
- [ ] API responds: `/api/communities` returns data
- [ ] Wallet connects: Testnet wallet works
- [ ] Discord login: OAuth flow completes
- [ ] Database: Queries respond < 100ms
- [ ] No 500 errors in logs

---

## If You Encounter Issues

**Problem**: Vercel deployment hangs  
**Solution**: Check Vercel logs: `vercel logs --follow`

**Problem**: Database connection fails  
**Solution**: Verify DATABASE_URL in Vercel, check Neon connection limits

**Problem**: Wallet won't connect  
**Solution**: Verify SOLANA_PROGRAM_ID is on testnet, check RPC endpoint works

**Problem**: Discord login fails  
**Solution**: Verify redirect URI in Discord app matches exactly

---

## Timeline

| Step | Time | Status |
|------|------|--------|
| 1. Fund testnet wallet | 5-60 min | ⏳ Manual |
| 2. Update Rust | 5 min | ⏳ Manual |
| 3. Build program | 2 min | ✅ Ready |
| 4. Deploy program | 5 min | ✅ Ready |
| 5. Create database | 5 min | ⏳ Manual |
| 6. Set Vercel vars | 10 min | ⏳ Manual |
| 7. Update Discord | 2 min | ⏳ Manual |
| 8. Push to Vercel | 5 min | ✅ Ready |
| 9. Run migrations | 2 min | ✅ Ready |
| 10. Validate | 10 min | ✅ Ready |
| **Total** | **~60 min** | — |

---

## Next: After Staging is Live

1. Announce to team: "Staging deployed to https://droplabz-staging.vercel.app"
2. Run UAT for 24-48 hours
3. Collect feedback
4. File bugs and fix
5. Prepare production deployment (mainnet-beta)

---

## Command Reference

**Quick status check**:
```bash
# Check testnet wallet
solana balance --url https://api.testnet.solana.com

# Check program deployed
solana program show [PROGRAM_ID] --url https://api.testnet.solana.com

# Check staging site
curl -I https://droplabz-staging.vercel.app

# Check staging database
pnpm db:studio
```

---

## Support Documents

- [STAGING_READINESS_REPORT.md](./STAGING_READINESS_REPORT.md) — Full report
- [STAGING_ENV_CONFIGURATION.md](./STAGING_ENV_CONFIGURATION.md) — Env var details
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — Common issues

