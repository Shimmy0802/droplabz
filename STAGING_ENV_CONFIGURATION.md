# Staging Environment Configuration Guide

**Date**: February 8, 2026  
**Phase**: Staging Deployment Preparation  
**Status**: Ready to configure

---

## Environment Variables - Development vs Staging

### Current Development Configuration

| Variable | Current Value | Type | Security |
|----------|---------------|------|----------|
| `DATABASE_URL` | Neon devnet pool | URL | Production DB (safe) |
| `NEXTAUTH_URL` | http://localhost:3000 | URL | Local (safe) |
| `NEXTAUTH_SECRET` | [configured] | Secret | ✅ Secure |
| `DISCORD_CLIENT_ID` | 1464862221203935252 | ID | App registration |
| `DISCORD_CLIENT_SECRET` | [configured] | Secret | ✅ Secure |
| `DISCORD_BOT_TOKEN` | [configured] | Secret | ✅ Secure |
| `DISCORD_BOT_API_URL` | http://localhost:3001 | URL | Local (safe) |
| `APP_BASE_URL` | http://localhost:3000 | URL | Local (safe) |
| `NEXT_PUBLIC_SOLANA_NETWORK` | devnet | Config | Test network ✅ |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | https://api.devnet.solana.com | URL | Public endpoint |
| `SOLANA_RPC_URL` | https://api.devnet.solana.com | URL | Public endpoint |
| `SOLANA_PROGRAM_ID` | your-program-id | ID | **PLACEHOLDER** ⚠️ |
| `SUPER_ADMIN_DISCORD_IDS` | 1017201660839333899 | ID | Required |
| `SUPER_ADMIN_WALLET_ADDRESSES` | DoDr7ngNc34byAPVVNk7WKvowMuvLQ1xLeDAJvWDnXjY | Address | Required |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | dha7stlbm | ID | Public |
| `CLOUDINARY_API_KEY` | 371387272762974 | Key | Upload-only |
| `CLOUDINARY_API_SECRET` | [configured] | Secret | ✅ Secure |

---

## Staging Configuration Template

**Copy this to Vercel Staging Environment Variables:**

```bash
# Database (Staging - Neon)
DATABASE_URL="postgresql://neon_user:password@ep-staging-db.c-2.us-east-2.aws.neon.tech/staging_db?sslmode=require"

# NextAuth (Staging Domain)
NEXTAUTH_URL="https://droplabz-staging.vercel.app"
NEXTAUTH_SECRET="<COPY_FROM_DEV_ENV>"

# Discord OAuth (Reuse from dev, or create staging app)
DISCORD_CLIENT_ID="1464862221203935252"
DISCORD_CLIENT_SECRET="<COPY_FROM_DEV_ENV>"

# Discord Bot (Reuse from dev, or create staging bot)
DISCORD_BOT_TOKEN="<COPY_FROM_DEV_ENV>"
DISCORD_BOT_API_URL="https://droplabz-bot-staging.vercel.app"

# App URLs (Staging)
APP_BASE_URL="https://droplabz-staging.vercel.app"

# Solana (Upgrade to Testnet)
NEXT_PUBLIC_SOLANA_NETWORK="testnet"
NEXT_PUBLIC_SOLANA_RPC_URL="https://api.testnet.solana.com"
SOLANA_RPC_URL="https://api.testnet.solana.com"
SOLANA_PROGRAM_ID="<DEPLOY_TO_TESTNET_AND_UPDATE>"

# Admin Configuration (Can reuse for testing)
SUPER_ADMIN_DISCORD_IDS="1017201660839333899"
SUPER_ADMIN_WALLET_ADDRESSES="DoDr7ngNc34byAPVVNk7WKvowMuvLQ1xLeDAJvWDnXjY"

# Cloudinary (Can reuse)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="dha7stlbm"
CLOUDINARY_API_KEY="371387272762974"
CLOUDINARY_API_SECRET="<COPY_FROM_DEV_ENV>"
```

---

## Critical Changes for Staging

### 1. **Database URL** (CRITICAL)

**Current (Dev)**:
```
postgresql://neondb_owner:npg_VF3BbhwtNHW0@ep-rapid-wind-aebw03lo-pooler.c-2.us-east-2.aws.neon.tech/neondb
```

**For Staging**:
- [ ] Create new Neon project for staging OR new branch in existing project
- [ ] Use separate database name (e.g., `staging_db`)
- [ ] Get connection string from Neon dashboard
- [ ] Update `DATABASE_URL` in Vercel

**Action Items**:
```bash
# 1. In Neon console, create staging database
neon projects create --name droplabz-staging

# 2. Get connection string
psql $NEW_DATABASE_URL

# 3. Run migrations
pnpm db:push --env staging
```

---

### 2. **NEXTAUTH_URL** (CRITICAL)

**Current (Dev)**:
```
http://localhost:3000
```

**For Staging**:
```
https://droplabz-staging.vercel.app
```

**Why**: NextAuth uses this URL to validate authentication callbacks. Must match exact Vercel staging domain.

**Verification**:
```bash
# After staging deployment, test:
curl -X POST https://droplabz-staging.vercel.app/api/auth/callback/discord \
  -H "Content-Type: application/json"
```

---

### 3. **APP_BASE_URL** (CRITICAL)

**Current (Dev)**:
```
http://localhost:3000
```

**For Staging**:
```
https://droplabz-staging.vercel.app
```

**Why**: Used for email links, API redirects, and Discord embed URLs.

**Check**:
- Discord embed links
- Email verification links
- OAuth redirect URIs

---

### 4. **Solana Network Configuration** (CRITICAL)

**Current (Dev)**:
```
NEXT_PUBLIC_SOLANA_NETWORK="devnet"
NEXT_PUBLIC_SOLANA_RPC_URL="https://api.devnet.solana.com"
SOLANA_RPC_URL="https://api.devnet.solana.com"
SOLANA_PROGRAM_ID="your-program-id" ⚠️ PLACEHOLDER
```

**For Staging - Choose One**:

**Option A: Solana Testnet** (Recommended for staging)
```
NEXT_PUBLIC_SOLANA_NETWORK="testnet"
NEXT_PUBLIC_SOLANA_RPC_URL="https://api.testnet.solana.com"
SOLANA_RPC_URL="https://api.testnet.solana.com"
SOLANA_PROGRAM_ID="<TESTNET_PROGRAM_ID>"
```

**Option B: Solana Mainnet-Beta** (Production-like)
```
NEXT_PUBLIC_SOLANA_NETWORK="mainnet-beta"
NEXT_PUBLIC_SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
SOLANA_PROGRAM_ID="<MAINNET_PROGRAM_ID>"
```

**Required Before Deployment**:

1. **Deploy Anchor Program to Testnet**
   ```bash
   cd programs/verification
   anchor deploy --provider.cluster testnet
   # Note the program ID output
   ```

2. **Update SOLANA_PROGRAM_ID**
   - Copy program ID from deployment output
   - Set in Vercel staging environment

3. **Test Wallet Connection**
   ```bash
   # After deployment:
   # 1. Go to https://droplabz-staging.vercel.app
   # 2. Click "Connect Wallet"
   # 3. Choose Phantom or other testnet-compatible wallet
   # 4. Verify connection succeeds
   ```

---

### 5. **Discord OAuth Configuration**

**Current**: Using dev Discord app

**For Staging**:

**Option A: Reuse Dev App** (Quick, for internal testing)
```
DISCORD_CLIENT_ID="1464862221203935252"
DISCORD_CLIENT_SECRET="<EXISTING>"
```
- [ ] Add staging domain to Discord app's Authorized Redirect URIs
- [ ] Format: `https://droplabz-staging.vercel.app/api/auth/callback/discord`

**Option B: Create Staging Discord App** (Cleaner separation)
1. Go to Discord Developer Portal
2. Create new application: "DropLabz Staging"
3. Copy Client ID and Secret
4. Set OAuth2 Redirect URI: `https://droplabz-staging.vercel.app/api/auth/callback/discord`
5. Update `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET`

---

### 6. **Discord Bot Configuration**

**Current**: Bot running on localhost:3001

**For Staging**:

Option A: Reuse dev bot
```
DISCORD_BOT_TOKEN="<EXISTING>"
DISCORD_BOT_API_URL="http://localhost:3001"
```

Option B: Deploy bot to Vercel
```
DISCORD_BOT_TOKEN="<EXISTING>"
DISCORD_BOT_API_URL="https://droplabz-bot-staging.vercel.app"
```

- [ ] Ensure bot has permissions in staging Discord server
- [ ] Bot must be in the staging guild with admin permissions

---

## Environment Variable Checklist

### Before Staging Deployment

**Database & Auth**
- [ ] Neon staging database created
- [ ] DATABASE_URL updated with staging connection string
- [ ] NEXTAUTH_SECRET copied and verified
- [ ] NEXTAUTH_URL set to staging Vercel domain

**Solana Network**
- [ ] Anchor program deployed to testnet/mainnet
- [ ] SOLANA_PROGRAM_ID updated with deployed program
- [ ] NEXT_PUBLIC_SOLANA_NETWORK updated (devnet → testnet)
- [ ] SOLANA_RPC_URL updated

**URLs**
- [ ] APP_BASE_URL set to staging Vercel domain
- [ ] DISCORD_BOT_API_URL updated (if applicable)

**Discord**
- [ ] Discord app redirect URI configured for staging domain
- [ ] Discord bot added to staging server
- [ ] DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET verified

**Admin Config**
- [ ] SUPER_ADMIN_DISCORD_IDS verified
- [ ] SUPER_ADMIN_WALLET_ADDRESSES verified

**Media**
- [ ] Cloudinary credentials copied (same as dev)

---

## Vercel Deployment Steps

### 1. Create Staging Environment (if new project)

```bash
# Create production deployment (optional)
vercel --prod

# Or use existing Vercel project
vercel link
```

### 2. Set Environment Variables in Vercel Dashboard

1. Go to Vercel dashboard
2. Select project: droplabz
3. Go to Settings → Environment Variables
4. Set each variable for the appropriate environment (Preview/Production)

Example for Production (staging) environment:
```
DATABASE_URL=... (staging value)
NEXTAUTH_URL=https://droplabz-staging.vercel.app
... (other staging values)
```

### 3. Deploy

```bash
# Trigger deployment
git push

# Or manual deploy
vercel deploy --prod
```

### 4. Verify Deployment

```bash
# Check status
curl https://droplabz-staging.vercel.app

# Check health endpoint
curl https://droplabz-staging.vercel.app/api/health
```

---

## Staging vs Production Environments

| Aspect | Development | Staging | Production |
|--------|-------------|---------|-----------|
| **Domain** | localhost:3000 | droplabz-staging.vercel.app | droplabz.com |
| **Database** | Neon devnet pool | Neon staging pool | Neon prod pool |
| **Solana Network** | devnet | testnet | mainnet-beta |
| **Discord** | Dev app | Staging/dev app | Staging/prod app |
| **Bot** | localhost:3001 | Vercel/staging | Vercel/prod |
| **HTTPS** | N/A | Yes ✅ | Yes ✅ |
| **Analytics** | None | Vercel Analytics | Vercel Analytics |
| **Error Tracking** | Console | Sentry (if setup) | Sentry (if setup) |

---

## Troubleshooting Env Config

**Q: NEXTAUTH_URL mismatch error?**
- A: Ensure URL matches exactly, including protocol (https://)

**Q: Solana RPC endpoint not responding?**
- A: Check network (devnet/testnet/mainnet) and try alternative RPC: Alchemy, QuickNode, Helius

**Q: Discord OAuth redirect fails?**
- A: Add exact redirect URI to Discord app settings, including `/api/auth/callback/discord`

**Q: Program not found on-chain?**
- A: Verify program deployed to correct network (testnet vs mainnet)
- A: Use `solana program show <PROGRAM_ID> --url testnet`

---

## Security Notes

✅ **Safe to commit**:
- NEXT_PUBLIC_* variables (public, visible to clients)
- Network endpoints (public)

❌ **Never commit**:
- NEXTAUTH_SECRET
- DISCORD_CLIENT_SECRET
- DISCORD_BOT_TOKEN
- CLOUDINARY_API_SECRET
- DATABASE_URL (contains password)

**Solution**: Use Vercel Environment Variables UI or `.env.local` in .gitignore

---

## Next Steps

1. [ ] Prepare staging database
2. [ ] Deploy Anchor program to testnet
3. [ ] Configure Vercel staging environment
4. [ ] Set all environment variables
5. [ ] Deploy to Vercel
6. [ ] Run post-deployment tests
7. [ ] Monitor for 24-48 hours

