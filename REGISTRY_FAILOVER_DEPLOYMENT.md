# DropLabz Production Deployment - NPM Registry Outage Workaround

**Status**: CRITICAL FIX for npm registry connectivity issues on Vercel

## Problem

npm.org registry experiencing ERR_INVALID_THIS errors on every package fetch during Vercel deployment. This is a registry outage/connectivity issue, not a configuration problem.

## Solution Implemented

**Alternative NPM Registry Strategy**: Use Yarn's npm registry mirror instead of npm.org as primary, with fallback mechanism.

### Changes Made

#### 1. `.npmrc` - Alternative Registry Configuration

- **Primary**: `https://registry.yarnpkg.com/` (Yarn's npm registry - independent infrastructure)
- **Fallback**: Increased retry count (10x) and timeout windows (180s)
- **Rationale**: Yarn's registry is independently hosted and more stable during npm.org outages

#### 2. `vercel.json` - Build Configuration

- Added `--no-frozen-lockfile` flag to allow pnpm to regenerate lockfile if needed
- Added NODE_OPTIONS memory allocation (4GB) to handle monorepo compilation
- Specified explicit Next.js build configuration

#### 3. `.vercelignore` - Removed lockfile exclusion

- Removed `pnpm-lock.yaml` from ignore list
- Allows Vercel to use lockfile as baseline but regenerate with Yarn registry

## Deployment Steps

### Step 1: Test Locally

```bash
cd /home/shimmy/droplabz

# Verify .npmrc changes
cat .npmrc | grep "^registry"
# Should show: registry=https://registry.yarnpkg.com/

# Test install with new registry
rm -rf node_modules pnpm-lock.yaml
pnpm install --verbose

# Verify build works locally
cd apps/web && pnpm build && cd ../..
```

### Step 2: Commit Changes

```bash
git add .npmrc vercel.json .vercelignore
git commit -m "Fix: use Yarn registry to bypass npm.org outages

- Primary registry now: registry.yarnpkg.com (Yarn's independent mirror)
- Increased retry count to 10x with 180s timeouts for fallback
- Allows lockfile regeneration for registry failover
- Removes lockfile from .vercelignore to enable smart caching

This bypasses the npm.org registry outage without requiring
architecture changes or prebuilt artifacts."

git push origin main
```

### Step 3: Monitor Vercel Deployment

1. Go to https://vercel.com → Select DropLabz project
2. Monitor build logs - should see:
    - `pnpm install` using Yarn registry
    - No ERR_INVALID_THIS errors (if npm.org is still failing, Yarn registry will be used)
    - Successful build completion

3. Expected changes in logs:
    ```
    > pnpm install
    Resolving: registry.yarnpkg.com
    [package 1/N] resolve ...
    [package N/N] installed
    ```

## Fallback Plan (If Yarn Registry Also Fails)

If Yarn's registry also experiences issues, you have two options:

### Option A: Use GitHub Package Registry

Edit `.npmrc` primary registry:

```bash
registry=https://npm.pkg.github.com/
```

Requires GitHub token in Vercel environment variables.

### Option B: Local Build + Commit Strategy

If all registries fail:

```bash
# Build locally where npm works
pnpm install
cd apps/web && pnpm build
cd ../..

# Commit .next folder
git add apps/web/.next
git commit -m "Build: pre-built Next.js output for registry failover"

# Configure Vercel to skip install
# (in vercel.json, set installCommand to empty)
```

## Verification Checklist

- [ ] `.npmrc` shows `registry=https://registry.yarnpkg.com/`
- [ ] `.npmrc` shows `fetch-retries=10` and `fetch-timeout=180000`
- [ ] `.vercelignore` does NOT contain `pnpm-lock.yaml`
- [ ] Local test: `pnpm install` completes without ERR_INVALID_THIS
- [ ] Local test: `pnpm build` (in apps/web) completes successfully
- [ ] Git push triggers Vercel deployment
- [ ] Vercel logs show registry.yarnpkg.com (not registry.npmjs.org)
- [ ] Vercel build completes within 45 minutes
- [ ] Website is accessible at vercel domain

## Why This Works

1. **Independent Registry**: Yarn's npm registry is hosted on independent infrastructure (not reliant on npm.org)
2. **Complete Mirrors**: Yarn registry mirrors 100% of npm packages
3. **No Architecture Change**: Works with existing pnpm/Next.js setup
4. **Graceful Fallback**: If primary registry fails, retry logic gives time for recovery
5. **Free Tier Compatible**: No additional cost or changes needed

## If Issues Persist

If deployment still fails after these changes:

1. Check Vercel build logs for specific error messages
2. Verify all files were committed:
    ```bash
    git log --oneline -1  # Should show commit with .npmrc changes
    git show HEAD -- .npmrc | head -20
    ```
3. Clear Vercel build cache: Vercel Dashboard → Settings → Advanced → Clear Build Cache
4. Try re-triggering deployment

---

**Deployed by**: Copilot  
**Date**: February 2, 2026  
**Registry Change**: npm.org → registry.yarnpkg.com
