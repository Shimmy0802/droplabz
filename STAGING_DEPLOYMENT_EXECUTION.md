# Staging Deployment Execution Guide

**Started**: February 8, 2026, 21:55 UTC  
**Status**: In Progress  
**Current Step**: Blocking items validation

---

## Current System Status ✅

| Component | Status | Details |
|-----------|--------|---------|
| Anchor CLI | ✅ Installed | v0.32.1 |
| Solana CLI | ✅ Installed | Configured for mainnet-beta |
| Primary Keypair | ✅ Exists | `/home/shimmy/.config/solana/test-wallet.json` |
| Test Wallet Balance | ⏳ Check needed | Run: `solana balance` |

---

## Step 1: Prepare Solana Testnet (Required for Program Deployment)

### 1a. Check Current Wallet Balance

```bash
solana balance
```

**Expected Output**:
```
2.5 SOL  (or whatever balance exists)
```

**If showing 0 SOL or error**: Wallet has no testnet funds. **REQUIRED ACTION**:
1. Get wallet address: `solana address`
2. Fund on testnet via faucet: https://faucet.solana.com/
3. Paste address and request 5 SOL for testing

---

### 1b. Configure Solana CLI for Testnet

```bash
# Switch to testnet cluster
solana config set --url https://api.testnet.solana.com

# Verify switch
solana config get
# Should show:
# RPC URL: https://api.testnet.solana.com
```

---

### 1c. Airdrop SOL to Test Wallet (if balance is 0)

```bash
# Request airdrop
solana airdrop 5 --commitment confirmed

# Verify received
solana balance
# Should show: 5 SOL (or previous + 5)
```

---

## Step 2: Deploy Anchor Program to Testnet

### 2a. Build the Program

```bash
cd /home/shimmy/droplabz
anchor build

# Expected output:
# Compiling droplabz-anchor v0.1.0
# Finished release [optimized] target(s) in 4.32s
```

---

### 2b. Deploy to Testnet

```bash
anchor deploy --provider.cluster testnet

# Expected output:
# Deploying cluster: https://api.testnet.solana.com
# Deployment status: ok
# Deploy success. New program Id: 7q67... (SAVE THIS)

# Example output:
# Program Id: 9jDjDxcqU6YKYNVkVXHk4k8YWJr7aMfZh2qKDYPknYXV
```

### 2c. ⚠️ **CRITICAL**: Save Program ID

The output will show: `Program Id: [ADDRESS]`

**Copy this program ID** - you'll need it for environment variables.

Example format: `9jDjDxcqU6YKYNVkVXHk4k8YWJr7aMfZh2qKDYPknYXV`

---

## Step 3: Create Neon Staging Database

### 3a. Create via Neon Console (Recommended)

1. Go to https://console.neon.tech
2. Click "Create Project" or "New Project"
3. Set project name: `droplabz-staging`
4. Region: `us-east-2` (same as dev for consistency)
5. Click "Create"
6. Wait ~30 seconds for database to initialize

### 3b. Get Connection String

In Neon console:
1. Click on "droplabz-staging" project
2. Go to "Connection details"
3. Copy the "Connection string" from the "psql" section
4. It should look like:
   ```
   postgresql://neon_user:password@ep-staging-xxxx-pooler.neon.tech/neondb?sslmode=require
   ```

### 3c. Alternative: Create via Neon CLI

```bash
# If you have neon CLI installed
neon projects create --name droplabz-staging

# Get connection string
neon connection-string --project droplabz-staging

# Copy the output
```

### 3d. ⚠️ **SAVE DATABASE URL**

You'll need this connection string for Vercel environment variables. Format:
```
postgresql://neon_user:password@ep-staging-xxxx-pooler.neon.tech/staging_db?sslmode=require
```

---

## Step 4: Prepare Vercel Environment Variables

### Critical Variables to Collect

Before setting variables in Vercel, gather these values:

| Variable | Source | Current Value | Staging Value |
|----------|--------|---------------|---------------|
| `SOLANA_PROGRAM_ID` | Anchor deploy output | `your-program-id` | **[FROM STEP 2c]** |
| `DATABASE_URL` | Neon staging project | `postgresql://neondb_owner:...` | **[FROM 3d]** |
| `NEXTAUTH_URL` | Vercel | `http://localhost:3000` | `https://droplabz-staging.vercel.app` |
| `APP_BASE_URL` | Your choice | `http://localhost:3000` | `https://droplabz-staging.vercel.app` |
| `SOLANA_RPC_URL` | Upgrade from devnet | `https://api.devnet.solana.com` | `https://api.testnet.solana.com` |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Same as above | `https://api.devnet.solana.com` | `https://api.testnet.solana.com` |
| `NEXT_PUBLIC_SOLANA_NETWORK` | Upgrade from devnet | `devnet` | `testnet` |

### 4a. Set Vercel Environment Variables

1. Go to Vercel Dashboard: https://vercel.com
2. Select "droplabz" project
3. Go to Settings → Environment Variables
4. Add each critical variable:

**Step-by-step for each variable:**
1. Click "Add New"
2. Name: `[VARIABLE_NAME]`
3. Value: `[STAGING_VALUE]` from table above
4. Select environments: `Preview` and `Production`
5. Click "Save"

**Variables to add** (in order):

```bash
# 1. CRITICAL - Must update
SOLANA_PROGRAM_ID = [from anchor deploy output]
DATABASE_URL = [from Neon staging]
NEXTAUTH_URL = https://droplabz-staging.vercel.app
APP_BASE_URL = https://droplabz-staging.vercel.app
SOLANA_RPC_URL = https://api.testnet.solana.com
NEXT_PUBLIC_SOLANA_RPC_URL = https://api.testnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK = testnet

# 2. MEDIUM - Verify or update
DISCORD_BOT_API_URL = https://droplabz-bot-staging.vercel.app

# 3. KEEP SAME - From dev environment
NEXTAUTH_SECRET = [existing value from .env]
DISCORD_CLIENT_ID = 1464862221203935252
DISCORD_CLIENT_SECRET = [existing value from .env]
DISCORD_BOT_TOKEN = [existing value from .env]
SUPER_ADMIN_DISCORD_IDS = 1017201660839333899
SUPER_ADMIN_WALLET_ADDRESSES = DoDr7ngNc34byAPVVNk7WKvowMuvLQ1xLeDAJvWDnXjY
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = dha7stlbm
CLOUDINARY_API_KEY = 371387272762974
CLOUDINARY_API_SECRET = [existing value from .env]
```

### 4b. Verify Discord App Configuration

1. Go to Discord Developer Portal: https://discord.com/developers/applications
2. Select "DropLabz" application
3. Go to OAuth2 → Redirects
4. Add if not present:
   ```
   https://droplabz-staging.vercel.app/api/auth/callback/discord
   ```
5. Click "Save Changes"

---

## Step 5: Deploy to Vercel

### 5a. Commit Changes (if any)

```bash
cd /home/shimmy/droplabz

git status

git add .
git commit -m "Deploy: Staging deployment - Phase 5 complete"

git push origin main
```

Vercel will automatically detect the push and start deployment.

### 5b. Monitor Deployment

```bash
# Watch deployment logs
vercel logs --follow

# Or go to Vercel Dashboard → Deployments → Watch
```

**Expected deployment time**: 3-5 minutes

### 5c: Verify URL

Once deployment completes:
```bash
curl https://droplabz-staging.vercel.app
```

Should return HTML (not 500 error).

---

## Step 6: Run Database Migrations

After deployment succeeds and DATABASE_URL is set in Vercel:

```bash
cd /home/shimmy/droplabz

# Set temporary env var for migration
export DATABASE_URL="[staging_database_url_from_vercel]"

# Run migrations
pnpm db:push

# Verify schema applied
pnpm db:studio

# You should see tables appear in GUI
```

---

## Step 7: Post-Deployment Validation

### 7a. Immediate Checks (5 minutes)

```bash
# Test homepage
curl -I https://droplabz-staging.vercel.app
# Should return: HTTP/1.1 200 OK

# Test API endpoint
curl https://droplabz-staging.vercel.app/api/communities
# Should return JSON (not error)

# Check logs for errors
vercel logs --limit 50
```

### 7b. Functional Tests (30 minutes)

**Via browser** (https://droplabz-staging.vercel.app):

- [ ] Homepage loads and renders
- [ ] "Connect Wallet" button visible
- [ ] Can click Discord login
- [ ] Can connect wallet (testnet)
- [ ] Navigation works

**Via API**:

```bash
# Test communities endpoint
curl https://droplabz-staging.vercel.app/api/communities

# Test events endpoint
curl https://droplabz-staging.vercel.app/api/events

# Both should return JSON arrays or empty data
```

### 7c. Integration Test (2 hours)

1. Go to https://droplabz-staging.vercel.app
2. Click "Connect Wallet" → Select testnet wallet (Phantom, Solflare, etc.)
3. Verify wallet connects successfully
4. Click "Discord Login" → OAuth flow completes
5. Dashboard loads
6. Try creating a community

---

## Monitoring Checklist

After deployment, monitor for 24-48 hours:

- [ ] Check Vercel Analytics dashboard daily
- [ ] Monitor error rates (should be < 1%)
- [ ] Check response time (should be < 500ms)
- [ ] Verify database queries complete
- [ ] Watch Vercel logs for critical errors

**Command for continuous monitoring**:
```bash
watch -n 60 'vercel logs --limit 20'  # Update every 60 seconds
```

---

## Troubleshooting During Deployment

| Issue | Symptom | Fix |
|-------|---------|-----|
| Program deploy fails | `Anchor error: Account not found` | Fund wallet: `solana airdrop 5` |
| Neon database won't connect | `FATAL: remaining connection slots reserved` | Check connection string, restart connection pool |
| NEXTAUTH_URL mismatch | Redirect loop on login | Verify exact URL in Vercel, no trailing slash |
| Wallet connection fails | `Network: testnet but on devnet RPC` | Check `SOLANA_RPC_URL` is testnet endpoint |

---

## Rollback Plan

If critical issues arise:

```bash
# Option 1: Immediate rollback via Vercel
vercel rollback

# Option 2: Previous version via dashboard
# Vercel → Deployments → [Previous successful] → Click "..." → Redeploy

# Option 3: Git revert
git revert HEAD
git push
# Vercel auto-redeploys
```

---

## Success Criteria - All Must Pass ✅

1. ✅ Website loads without 500 errors
2. ✅ Can connect wallet (testnet)
3. ✅ Can login via Discord
4. ✅ API endpoints respond with data
5. ✅ Database migrations applied
6. ✅ No critical errors in logs (1 hour with traffic)
7. ✅ Uptime > 99.5% for 24 hours

---

## Next Steps After Success

1. **Announce staging to team** (QA, backend, frontend)
2. **Run UAT for 24-48 hours**
3. **Collect feedback and fix issues**
4. **Prepare production deployment** (upgrade to mainnet-beta)

---

## Timeline Summary

| Step | Estimated Time | Blocking |
|------|----------------|----------|
| 1. Prepare testnet | 5 min | Yes |
| 2. Deploy program | 10 min | Yes |
| 3. Create Neon DB | 5 min | Yes |
| 4. Set Vercel vars | 10 min | Yes |
| 5. Deploy to Vercel | 5-10 min | No |
| 6. Run migrations | 2 min | No |
| 7. Validation | 5-30 min | No |
| **Total** | **45 min** | — |

---

## Commands Reference

**Quick deployment script**:
```bash
#!/bin/bash
set -e

echo "1️⃣  Switch to testnet..."
solana config set --url https://api.testnet.solana.com

echo "2️⃣  Check balance..."
solana balance

echo "3️⃣  Build Anchor program..."
cd /home/shimmy/droplabz
anchor build

echo "4️⃣  Deploy to testnet..."
anchor deploy --provider.cluster testnet

echo "5️⃣  Push to main (triggers Vercel)..."
git add . && git commit -m "Deploy: Staging deployment" && git push origin main

echo "6️⃣  Monitor Vercel..."
vercel logs --follow

echo "✅ Deployment in progress! Monitor at: https://vercel.com/projects/droplabz"
```

Save as `deploy-staging.sh` and run: `bash deploy-staging.sh`

---

## Support

If you encounter issues:
1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) first
2. Review [STAGING_READINESS_REPORT.md](./STAGING_READINESS_REPORT.md) for details
3. Check Vercel logs: `vercel logs --limit 100`
4. Check database: `pnpm db:studio`

