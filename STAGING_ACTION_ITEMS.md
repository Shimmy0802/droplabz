# Staging Deployment - Immediate Action Items

**Date**: February 8, 2026, 22:05 UTC  
**Status**: ✅ Ready for manual execution  
**Next Action**: Complete external service setup

---

## 🎯 What's Done (You Don't Need to Do)

✅ **31/31 unit tests** passing  
✅ **TypeScript** compilation verified  
✅ **Code formatting** (Prettier) compliant  
✅ **Performance** validated - all endpoints within thresholds  
✅ **Database** optimization confirmed  
✅ **Solana CLI** configured for testnet  
✅ **Anchor.toml** setup with provider config  
✅ **Documentation** complete with step-by-step guides

---

## ⚡ What You Need to Do (5 External Actions)

### 1️⃣ Fund Testnet Wallet (Highest Priority)

**Why**: Deploying Solana program requires SOL to pay transaction fees

**Wallet Address**: `BgznvTng1Q4Qx537HBzJVqwJThDcMmhNvE1rzqKnuQ3N`

**Action**:
```
Go to: https://www.alchemy.com/faucets/solana-testnet
Paste wallet address: BgznvTng1Q4Qx537HBzJVqwJThDcMmhNvE1rzqKnuQ3N
Request 5 SOL
Wait for confirmation
Run: solana balance
Expected: 5 SOL
```

**Time**: 5-10 minutes

---

### 2️⃣ Create Neon Staging Database

**Why**: Staging needs separate database from development

**Action**:
```
Go to: https://console.neon.tech
Click: New Project
Name: droplabz-staging
Region: us-east-2
Click: Create
Wait: ~30 seconds
Copy: Connection string from "Connection details"
Save: This is your DATABASE_URL for Vercel
```

**Time**: 5 minutes

---

### 3️⃣ Set Vercel Environment Variables

**Why**: Vercel needs all 19 environment variables to deploy correctly

**Action**:
```
Go to: https://vercel.com
Select: droplabz project
Go to: Settings → Environment Variables
Add each variable below for Preview + Production
```

**Critical Variables to Add** (7):
```
SOLANA_PROGRAM_ID = [will get from Step 4 below]
DATABASE_URL = [from Neon - Step 2 above]
NEXTAUTH_URL = https://droplabz-staging.vercel.app
APP_BASE_URL = https://droplabz-staging.vercel.app
NEXT_PUBLIC_SOLANA_NETWORK = testnet
SOLANA_RPC_URL = https://api.testnet.solana.com
NEXT_PUBLIC_SOLANA_RPC_URL = https://api.testnet.solana.com
```

**Keep Same Variables** (12):
```
NEXTAUTH_SECRET = [from your .env]
DISCORD_CLIENT_ID = 1464862221203935252
DISCORD_CLIENT_SECRET = [from your .env]
DISCORD_BOT_TOKEN = [from your .env]
DISCORD_BOT_API_URL = https://droplabz-bot-staging.vercel.app
SUPER_ADMIN_DISCORD_IDS = 1017201660839333899
SUPER_ADMIN_WALLET_ADDRESSES = DoDr7ngNc34byAPVVNk7WKvowMuvLQ1xLeDAJvWDnXjY
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = dha7stlbm
CLOUDINARY_API_KEY = 371387272762974
CLOUDINARY_API_SECRET = [from your .env]
```

**Time**: 10 minutes

---

### 4️⃣ Deploy Solana Program to Testnet

**Why**: Smart contracts must run on blockchain; hard-coded program ID needed

**Prerequisites**:
- Must complete Step 1 (wallet funded)
- Rust updated to latest (may be automatic)

**Action**:
```bash
# Run in terminal:
cd /home/shimmy/droplabz
anchor build
anchor deploy --provider.cluster testnet

# Watch for output showing:
# "Deploy success. New program Id: [ADDRESS]"

# COPY THE PROGRAM ID
# Example: 9jDjDxcqU6YKYNVkVXHk4k8YWJr7aMfZh2qKDYPknYXV
```

**Time**: 5-10 minutes

**Then**: Update Vercel with this `SOLANA_PROGRAM_ID` (from Step 3)

---

### 5️⃣ Update Discord App Redirect URI

**Why**: Discord OAuth won't work without staging domain in redirect URIs

**Action**:
```
Go to: https://discord.com/developers/applications
Select: DropLabz
Go to: OAuth2 → General
Add Redirect URI: https://droplabz-staging.vercel.app/api/auth/callback/discord
Click: Save Changes
```

**Time**: 2 minutes

---

## 🚀 After External Actions: Automatic Deployment

Once you've completed the 5 external actions above, run this:

```bash
cd /home/shimmy/droplabz

git add .
git commit -m "Deploy: Staging deployment - Phase 5 complete"
git push origin main

# Vercel automatically deploys on push
# Monitor: https://vercel.com/projects/droplabz
```

**Time**: 3-5 minutes (automatic)

---

## ✅ Verify Staging is Live

After Vercel deployment completes (~5 minutes):

```bash
# Test in browser or terminal
curl https://droplabz-staging.vercel.app

# Expected: HTML response (not 500 error)
```

---

## 📋 Summary: External Services Required

| Service | Action | Time | Link |
|---------|--------|------|------|
| **Testnet Faucet** | Send 5 SOL to wallet | 5 min | https://www.alchemy.com/faucets/solana-testnet |
| **Neon Console** | Create staging database | 5 min | https://console.neon.tech |
| **Vercel Dashboard** | Set 19 env vars | 10 min | https://vercel.com |
| **Discord Dev Portal** | Add redirect URI | 2 min | https://discord.com/developers |
| **Terminal** | Deploy program + push | 10 min | Local |
| **Total** | All steps | ~40 min | — |

---

## 🎬 Quick Start Sequence

```
1. Fund wallet (Alchemy faucet) - 5 min
   ↓
2. Create Neon database - 5 min
   ↓
3. Set Vercel env vars (first 7 from table above) - 10 min
   ↓
4. Deploy Solana program - 5 min
      ↓
      Copy Program ID
      ↓
5. Update Vercel with Program ID (add SOLANA_PROGRAM_ID) - 1 min
   ↓
6. Update Discord redirect URI - 2 min
   ↓
7. Push to main: git push origin main - (automatic)
   ↓
✅ Wait 5 minutes for Vercel deployment ✅
   ↓
Go to: https://droplabz-staging.vercel.app
```

**Total time**: ~40-45 minutes for all manual steps

---

## 📊 Current Status

| Phase | Status | Details |
|-------|--------|---------|
| Validation | ✅ Complete | 31/31 tests, Type-safe, Formatted |
| Preparation | ✅ Complete | Docs, checklists, execution guides |
| Blockchain | ⏳ Awaiting Action | Wallet fund, program deploy, env config |
| Deployment | ⏳ Awaiting Action | Vercel push (automatic once setup done) |
| Monitoring | ℹ️ Next Stage | 24-48 hour validation after live |

---

## 📚 Documentation References

- **[STAGING_READINESS_REPORT.md](./STAGING_READINESS_REPORT.md)** — Complete validation report
- **[STAGING_MANUAL_EXECUTION.md](./STAGING_MANUAL_EXECUTION.md)** — Step-by-step guide with detailed instructions
- **[STAGING_ENV_CONFIGURATION.md](./STAGING_ENV_CONFIGURATION.md)** — Environment variable reference
- **[STAGING_DEPLOYMENT_CHECKLIST.md](./STAGING_DEPLOYMENT_CHECKLIST.md)** — Pre-deployment checklist

---

## 🚨 If You Get Stuck

| Issue | Solution | Doc |
|-------|----------|-----|
| Testnet faucet rate-limited | Wait 60 min or use Helius faucet | STAGING_MANUAL_EXECUTION.md |
| Rust/Cargo errors on build | Run `rustup update stable` | STAGING_MANUAL_EXECUTION.md |
| Neon database won't connect | Check connection string has ?sslmode=require | STAGING_ENV_CONFIGURATION.md |
| Vercel deployment fails | Check `vercel logs --follow` | TROUBLESHOOTING.md |
| Discord login fails | Verify redirect URI matches exactly | STAGING_ENV_CONFIGURATION.md |

---

## ✨ Success Looks Like

After ~45 minutes of actions, you'll have:

✅ Staging website: https://droplabz-staging.vercel.app  
✅ Testnet wallet connected  
✅ Discord OAuth working  
✅ Database queries < 100ms  
✅ API endpoints responding  
✅ All tests passing  
✅ Code formatted & type-safe  
✅ Performance validated  

Then: 48-hour monitoring period, UAT, production deployment.

---

## 💡 Pro Tips

1. **Do actions in order** - wallet fund unblocks program deploy
2. **Save IDs as you go** - Program ID, Database URL needed for Vercel
3. **Account for rate limits** - Testnet faucet might need an hour wait
4. **Monitor Vercel logs** - `vercel logs --follow` shows all issues in real-time
5. **Test after each step** - Verify each service works before moving to next

---

## Ready? Start Here

1. Open 5 browser tabs for each external service (links above)
2. Work through them in order
3. Come back here after each one is complete
4. Then push to main for automatic deployment

**Questions?** See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

**Estimated Total Time**: 45-60 minutes  
**Blocking Issues**: None if you have SOL and internet access  
**Risk Level**: Low (staging environment, testnet, not production)  
**Timeline to Production**: After 48-hour staging validation

