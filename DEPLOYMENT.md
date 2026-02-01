# DropLabz - Git & Vercel Deployment Guide

## Quick Start - Git Setup

```bash
# 1. Repository is already initialized with initial commit ✅

# 2. Add your remote repository (GitHub, GitLab, etc.)
git remote add origin https://github.com/YOUR_USERNAME/droplabz.git

# 3. Push to remote
git push -u origin main
```

## Vercel Deployment

### Option 1: Vercel CLI (Recommended)

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (from project root)
vercel

# Deploy to production
vercel --prod
```

### Option 2: Vercel Dashboard (Import from Git)

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your Git repository
4. Vercel will auto-detect Next.js configuration
5. Configure environment variables (see below)
6. Click "Deploy"

## Environment Variables for Vercel

Set these in Vercel Dashboard → Project Settings → Environment Variables:

### Required Variables

```bash
# Database (use PostgreSQL provider: Neon, Supabase, Railway)
DATABASE_URL="postgresql://user:password@host:5432/droplabz"

# NextAuth
NEXTAUTH_SECRET="[generate-new-secret-for-production]"
NEXTAUTH_URL="https://your-domain.vercel.app"

# Discord OAuth (create new app for production)
DISCORD_CLIENT_ID="your_production_discord_client_id"
DISCORD_CLIENT_SECRET="your_production_discord_client_secret"
DISCORD_BOT_TOKEN="your_production_discord_bot_token"

# Discord Verification Ticket URL
NEXT_PUBLIC_DISCORD_TICKET_URL="https://discord.gg/your-production-invite"

# Super Admin (your Discord ID and Solana wallet)
SUPER_ADMIN_DISCORD_IDS="your_discord_id"
SUPER_ADMIN_WALLET_ADDRESSES="your_solana_wallet_address"

# Solana (use mainnet for production)
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
NEXT_PUBLIC_SOLANA_NETWORK="mainnet-beta"
NEXT_PUBLIC_SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
SOLANA_PROGRAM_ID="your_deployed_program_id"

# App Base URL (will be your Vercel domain)
APP_BASE_URL="https://your-domain.vercel.app"
```

### Optional Variables (for Stripe subscriptions)

```bash
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

## Pre-Deployment Checklist

- [ ] PostgreSQL database created (Neon, Supabase, Railway, etc.)
- [ ] Database schema deployed (`pnpm db:push` or migrations)
- [ ] Discord OAuth app created (production credentials)
- [ ] Discord bot created (production token)
- [ ] Bot added to Discord server
- [ ] Solana program deployed (if using on-chain features)
- [ ] All environment variables configured in Vercel
- [ ] Super admin Discord ID and wallet address set

## Database Setup for Production

### Option 1: Neon (Recommended - Free tier available)

```bash
# 1. Create account at neon.tech
# 2. Create new project
# 3. Copy connection string
# 4. Add to Vercel as DATABASE_URL
# 5. Run migrations from local (with DATABASE_URL pointing to Neon)
DATABASE_URL="postgresql://..." pnpm db:push
```

### Option 2: Supabase

```bash
# 1. Create account at supabase.com
# 2. Create new project
# 3. Go to Settings → Database → Connection String
# 4. Copy connection string (use "Connection Pooling" URL)
# 5. Add to Vercel as DATABASE_URL
```

### Option 3: Railway

```bash
# 1. Create account at railway.app
# 2. Create new PostgreSQL database
# 3. Copy connection string
# 4. Add to Vercel as DATABASE_URL
```

## Discord Bot Deployment

The Discord bot (`apps/bot`) needs to run separately from Vercel (which only hosts the web app).

### Option 1: Railway (Recommended)

```bash
# 1. Create Railway account
# 2. Create new project from GitHub repo
# 3. Set root directory to "apps/bot"
# 4. Add environment variables:
#    - DISCORD_BOT_TOKEN
#    - APP_BASE_URL (your Vercel URL)
#    - All other required env vars
# 5. Railway will auto-deploy and keep bot running
```

### Option 2: Heroku

```bash
# 1. Create Heroku account
# 2. Create new app
# 3. Connect GitHub repo
# 4. Set buildpack to Node.js
# 5. Configure environment variables
# 6. Deploy
```

### Option 3: VPS (DigitalOcean, Linode, etc.)

```bash
# SSH into server
cd /opt/droplabz
git pull
cd apps/bot
pnpm install
# Use PM2 for process management
pm2 start "pnpm start" --name droplabz-bot
pm2 save
pm2 startup
```

## Post-Deployment Steps

1. **Verify Web App**:
    - Visit your Vercel URL
    - Test login/signup
    - Create a test community
    - Verify Discord OAuth works

2. **Verify Discord Bot**:
    - Run `/droplabz setup` in your Discord server
    - Test bot commands

3. **Test Integrations**:
    - Create a test whitelist
    - Post announcement via bot
    - Submit entry with Solana wallet
    - Verify Discord role assignment

4. **Configure Custom Domain** (optional):
    - Add domain in Vercel dashboard
    - Update NEXTAUTH_URL and APP_BASE_URL

## Monitoring & Logs

- **Vercel Logs**: Dashboard → Project → Deployments → Click deployment
- **Bot Logs**: Check your bot hosting platform (Railway/Heroku/PM2)
- **Database Logs**: Check your database provider dashboard

## Troubleshooting

### Build Fails on Vercel

```bash
# Check build logs for errors
# Common issues:
# - Missing environment variables
# - TypeScript errors
# - Missing dependencies

# Fix locally first:
cd apps/web
pnpm build
# Fix any errors, then push to Git
```

### Database Connection Issues

```bash
# Verify DATABASE_URL is correct
# Ensure IP allowlist (if required by provider)
# Check connection string format
# Test connection locally first
```

### Discord Bot Not Responding

```bash
# Verify bot is running on hosting platform
# Check bot logs for errors
# Verify DISCORD_BOT_TOKEN is correct
# Ensure APP_BASE_URL points to your Vercel deployment
```

## Security Notes

- ✅ Never commit `.env` file (already in .gitignore)
- ✅ Use production Discord credentials (separate from dev)
- ✅ Use production Solana RPC (mainnet-beta)
- ✅ Rotate NEXTAUTH_SECRET for production
- ✅ Enable Vercel authentication for admin pages (optional)
- ✅ Set up Vercel analytics and monitoring

## Continuous Deployment

Once connected to Git:

```bash
# Push changes to main branch
git add .
git commit -m "feature: description"
git push origin main

# Vercel will auto-deploy
# Bot platform will auto-deploy (if configured)
```

## Rollback

```bash
# Vercel Dashboard → Deployments → Click previous deployment → Promote to Production
```

---

**Ready to Deploy!** 🚀

Your Git repository is initialized and ready to push.
