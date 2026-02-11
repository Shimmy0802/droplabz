# 🚀 STAGING DEPLOYMENT - START HERE

**Status**: ✅ Ready Now  
**Time to Live**: 40-60 minutes  
**Difficulty**: Medium (mostly copy-paste values into dashboards)

---

## 📋 5-Step Quick Action Plan

### Step 1️⃣: Fund Wallet (5 min)
```
Go to: https://www.alchemy.com/faucets/solana-testnet
Address: BgznvTng1Q4Qx537HBzJVqwJThDcMmhNvE1rzqKnuQ3N
Request: 5 SOL
Wait: Confirmation email
Verify: solana balance
```

### Step 2️⃣: Create Database (5 min)
```
Go to: https://console.neon.tech
New Project: droplabz-staging
Region: us-east-2
COPY: Connection string
SAVE: As DATABASE_URL
```

### Step 3️⃣: Set Vercel Variables (10 min)
```
Go to: https://vercel.com
Project: droplabz
Settings → Environment Variables

Add these 7 CRITICAL:
  SOLANA_PROGRAM_ID = [wait for step 4]
  DATABASE_URL = [from step 2]
  NEXTAUTH_URL = https://droplabz-staging.vercel.app
  APP_BASE_URL = https://droplabz-staging.vercel.app
  NEXT_PUBLIC_SOLANA_NETWORK = testnet
  SOLANA_RPC_URL = https://api.testnet.solana.com
  NEXT_PUBLIC_SOLANA_RPC_URL = https://api.testnet.solana.com

Add these 12 KEEP SAME:
  NEXTAUTH_SECRET = [from .env]
  DISCORD_CLIENT_ID = 1464862221203935252
  DISCORD_CLIENT_SECRET = [from .env]
  DISCORD_BOT_TOKEN = [from .env]
  DISCORD_BOT_API_URL = https://droplabz-bot-staging.vercel.app
  SUPER_ADMIN_DISCORD_IDS = 1017201660839333899
  SUPER_ADMIN_WALLET_ADDRESSES = DoDr7ngNc34byAPVVNk7WKvowMuvLQ1xLeDAJvWDnXjY
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = dha7stlbm
  CLOUDINARY_API_KEY = 371387272762974
  CLOUDINARY_API_SECRET = [from .env]
```

### Step 4️⃣: Deploy Program (5 min)
```bash
cd /home/shimmy/droplabz
anchor build
anchor deploy --provider.cluster testnet

Output will show:
  Program Id: 9jDjDxcqU6YKYNVkVXHk4k8YWJr7aMfZh2qKDYPknYXV

COPY THIS and go back to Step 3
Add SOLANA_PROGRAM_ID = [copied value]
SAVE in Vercel
```

### Step 5️⃣: Update Discord & Push (3 min)
```
1. Go to: https://discord.com/developers/applications
   Select: DropLabz
   OAuth2 → General
   Add Redirect: https://droplabz-staging.vercel.app/api/auth/callback/discord
   Save

2. Then in terminal:
   git push origin main
   
   (Vercel auto-deploys on push)
```

---

## ✅ Verify It Worked

```bash
# Wait ~5 minutes for Vercel deployment
curl https://droplabz-staging.vercel.app
# Should return HTML

# Test in browser:
https://droplabz-staging.vercel.app
# Should load, not 500 error
```

---

## 📚 Full Guides

Read these ONLY if you get stuck or want details:

- **[STAGING_ACTION_ITEMS.md](./STAGING_ACTION_ITEMS.md)** — Detailed action items
- **[STAGING_MANUAL_EXECUTION.md](./STAGING_MANUAL_EXECUTION.md)** — Step-by-step everything
- **[STAGING_READINESS_REPORT.md](./STAGING_READINESS_REPORT.md)** — Full validation report

---

## 🎯 Total Time: ~45 minutes

```
Step 1 (Wallet):    5 min  ← Wait for block (rate limit possible)
Step 2 (Database):  5 min
Step 3 (Vercel):   10 min  ← Takes a while due to form fields
Step 4 (Program):   5 min  ← Wait for compile
Step 5 (Discord):   3 min
Deploy:             5 min  ← Wait for Vercel
Verify:             5 min

Total: 45-60 min
```

---

## 🚨 If Faucet Rate-Limited

Testnet faucet might say: "Too many requests"

**Solution**: Use Helius instead  
Go to: https://www.helius.dev/solana-testnet-faucet

---

## ✨ Success = This Works

After ~50 minutes, you'll have:
- Staging live at: https://droplabz-staging.vercel.app
- Wallet connection working
- Discord login working
- Database responding
- All tests passing
- Ready for 48-hour UAT

---

## 🆘 Stuck? Start with This Order

1. Read: [STAGING_ACTION_ITEMS.md](./STAGING_ACTION_ITEMS.md) (~5 min)
2. Try: Follow 5 steps above
3. If error: Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
4. Still stuck: Read [STAGING_MANUAL_EXECUTION.md](./STAGING_MANUAL_EXECUTION.md) for that step

---

**Ready?** Go to Step 1️⃣ above and start!

Once complete, check: https://droplabz-staging.vercel.app ✅

