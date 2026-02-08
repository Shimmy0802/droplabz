# ✅ Vercel Production Setup Complete

**Deployment Date**: February 4, 2026  
**Status**: 🟢 LIVE IN PRODUCTION

---

## 🚀 Deployment Details

### Production URLs

- **Main App**: https://droplabz.vercel.app
- **Vercel Dashboard**: https://vercel.com/jasons-projects-e7014405/droplabz
- **Inspect/Logs**: https://vercel.com/jasons-projects-e7014405/droplabz/BzFDtCmYp74szHKXHpQv8BEocnBd

### Database

- **Provider**: Neon PostgreSQL
- **Type**: Existing dev/test database (to be erased before go-live)
- **Connection**: Pooled connection (sslmode=require)

---

## 🔐 Environment Variables (Production)

All of the following are configured in Vercel Dashboard:

| Variable                             | Status | Environment                      |
| ------------------------------------ | ------ | -------------------------------- |
| `NEXTAUTH_SECRET`                    | ✅ Set | Production, Preview, Development |
| `NEXTAUTH_URL`                       | ✅ Set | Production, Preview, Development |
| `APP_BASE_URL`                       | ✅ Set | Production, Preview, Development |
| `DATABASE_URL`                       | ✅ Set | Production, Preview, Development |
| `DISCORD_CLIENT_ID`                  | ✅ Set | Production, Preview, Development |
| `DISCORD_CLIENT_SECRET`              | ✅ Set | Production, Preview, Development |
| `DISCORD_BOT_TOKEN`                  | ✅ Set | Production, Preview, Development |
| `SUPER_ADMIN_DISCORD_IDS`            | ✅ Set | Production, Preview, Development |
| `SUPER_ADMIN_WALLET_ADDRESSES`       | ✅ Set | Production, Preview, Development |
| `NEXT_PUBLIC_SOLANA_NETWORK`         | ✅ Set | Production, Preview, Development |
| `NEXT_PUBLIC_SOLANA_RPC_URL`         | ✅ Set | Production, Preview, Development |
| `SOLANA_RPC_URL`                     | ✅ Set | Production, Preview, Development |
| `SOLANA_PROGRAM_ID`                  | ✅ Set | Production, Preview, Development |
| `BOT_API_BASE_URL`                   | ✅ Set | Production                       |
| `NEXT_PUBLIC_DISCORD_BOT_INVITE_URL` | ✅ Set | Production                       |

---

## 🔗 Discord OAuth Setup

### Status: ⚠️ PENDING - Manual Step Required

**What You Need to Do:**

1. Visit Discord Developer Portal: https://discord.com/developers/applications
2. Select your DropLabz app (Client ID: `1464862221203935252`)
3. Click **OAuth2** → **Redirects**
4. Add this redirect URL for production:
    ```
    https://droplabz.vercel.app/api/auth/callback/discord
    ```

Your Discord OAuth redirects should now include:

```
✓ http://localhost:3000/api/auth/callback/discord          (Development)
✓ http://localhost:3000/profile/communities/create?step=2  (Development)
✓ http://localhost:3000/profile/communities/create         (Development)
✓ https://droplabz.vercel.app/api/auth/callback/discord    (Production - NEW)
```

5. **Save Changes**

---

## ✅ Testing Checklist

After Discord OAuth is configured:

- [ ] Visit https://droplabz.vercel.app
- [ ] Test Discord login (should work seamlessly)
- [ ] Test Solana wallet connection
- [ ] Try creating a community
- [ ] Verify database connectivity (create a test community and check database)

---

## 🗑️ Database Cleanup (Before Go-Live)

When ready for production launch:

```bash
# 1. Connect to Neon PostgreSQL
# Option A: Via Neon Dashboard
# Option B: Via psql command line
psql $DATABASE_URL

# 2. Reset all data
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

# 3. Re-deploy schema
cd apps/web && pnpm db:push

# 4. Verify fresh database
pnpm db:studio
```

---

## 📊 Vercel Configuration

### Build Settings

- **Build Command**: `cd apps/web && pnpm build`
- **Install Command**: `corepack enable && pnpm install --no-frozen-lockfile`
- **Output Directory**: `apps/web/.next`
- **Node Options**: `--max-old-space-size=4096` (for large builds)

### Deployment History

- **Latest Deployment**: Production
- **URL**: https://droplabz.vercel.app
- **Status**: ✅ Deployed

---

## 🚨 Important Notes

### Before Go-Live

1. **Add Discord OAuth redirect** (step above)
2. **Clean database** (remove test data)
3. **Update Solana network** if using mainnet-beta
4. **Test all features** in production
5. **Monitor logs** for errors

### Production URLs to Update (if custom domain)

- Discord OAuth redirects must match
- NEXTAUTH_URL must match
- APP_BASE_URL must match
- NEXT_PUBLIC_DISCORD_BOT_INVITE_URL must use correct domain

### Vercel-Specific

- Auto-deploys from main branch to production
- Preview deployments on pull requests
- SSL/HTTPS automatically configured
- CDN caching enabled by default

---

## 📝 Next Steps

1. **Add Discord OAuth Redirect** (Manual)
    - Go to Discord Developer Portal
    - Add: `https://droplabz.vercel.app/api/auth/callback/discord`

2. **Test Production**
    - Visit https://droplabz.vercel.app
    - Verify Discord login works
    - Test wallet connection

3. **Clean Database** (When ready)
    - Run database reset commands above
    - Re-seed with production data if needed

4. **Deploy Discord Bot** (If needed)
    - Consider deploying bot to Railway/Heroku
    - Update BOT_API_BASE_URL when ready

---

## 🔗 Useful Links

- **Vercel Dashboard**: https://vercel.com/jasons-projects-e7014405/droplabz
- **Discord Developer Portal**: https://discord.com/developers/applications
- **Neon PostgreSQL Console**: https://console.neon.tech
- **App URL**: https://droplabz.vercel.app

---

## 📞 Support

If you encounter issues:

1. Check Vercel deployment logs: https://vercel.com/jasons-projects-e7014405/droplabz
2. Verify environment variables are set
3. Check Discord OAuth redirects match exactly
4. Ensure database is accessible from Vercel

---

**Status**: ✅ Ready for Production  
**Last Updated**: February 4, 2026
