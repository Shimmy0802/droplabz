# Deployment Monitoring Checklist - Yarn Registry Failover

**Commit**: `34aba7a` - "Fix: use Yarn registry to bypass npm.org outages"  
**Date**: February 2, 2026  
**Status**: ✅ Pushed to main → Vercel auto-deployment triggered

## What Was Changed

| File            | Change                                   | Why                                       |
| --------------- | ---------------------------------------- | ----------------------------------------- |
| `.npmrc`        | Primary registry: `registry.yarnpkg.com` | Bypass npm.org outage                     |
| `.npmrc`        | Retries: 10x, Timeout: 180s              | Allow graceful fallback                   |
| `vercel.json`   | Added `--no-frozen-lockfile`             | Regenerate lockfile with working registry |
| `vercel.json`   | `NODE_OPTIONS=--max-old-space-size=4096` | Prevent OOM on free tier                  |
| `.vercelignore` | Removed `pnpm-lock.yaml`                 | Enable smart caching                      |

## Vercel Build Status

**Check here**: https://vercel.com/dashboard → DropLabz project → Deployments

### What to Look For - SUCCESS ✅

Deployment logs should show:

```
> pnpm install --no-frozen-lockfile

Resolving dependencies from https://registry.yarnpkg.com/
[============] 1234 packages
✓ 1234 packages installed successfully
```

Then:

```
> cd apps/web && pnpm build

...
✓ Compiled successfully
✓ Optimized images
✓ Ready in X.XXs
```

### What to Watch For - FAILURE ❌

- **ERR_INVALID_THIS** → Still hitting npm.org (check if .npmrc was committed)
- **ETIMEDOUT** → Yarn registry temporarily slow (will retry automatically)
- **Memory exceeded** → 45-minute timeout exceeded (rare on free tier with optimizations)

## Next Steps

### Option 1: Deployment Succeeded ✅

```bash
# Verify website is accessible
curl https://your-vercel-domain.vercel.app

# Check database migrations ran
# (Neon PostgreSQL should be set up automatically)

# Test Discord bot integration (if applicable)
```

### Option 2: Deployment Failed ❌

**Before taking action**, check:

1. **Vercel logs**: Full error message in build output
2. **GitHub commit**: Verify `.npmrc` was actually committed
    ```bash
    git show HEAD:.npmrc | grep registry
    # Should output: registry=https://registry.yarnpkg.com/
    ```
3. **npm registry status**: Check https://status.npmjs.org/

If Yarn registry is also down, switch to **GitHub Package Registry**:

```bash
# Edit .npmrc
sed -i 's|registry.yarnpkg.com|npm.pkg.github.com|g' .npmrc

# Commit and push (requires GitHub token in Vercel env vars)
git add .npmrc && git commit -m "Fallback: use GitHub Package Registry" && git push
```

## Success Indicators

- [ ] Vercel deployment completes within 45 minutes
- [ ] No `ERR_INVALID_THIS` errors in logs
- [ ] Website accessible and responds to requests
- [ ] Database connected (Neon PostgreSQL)
- [ ] Discord bot online (if configured)
- [ ] No TypeScript build errors
- [ ] No missing dependencies errors

## Commands for Monitoring

```bash
# Watch Vercel deployment progress (requires Vercel CLI)
vercel logs --follow

# Check git history
git log --oneline | grep registry

# Verify local pnpm still uses Yarn registry
pnpm config get registry
# Output: https://registry.yarnpkg.com/

# Test install locally (to verify registry works)
rm -rf node_modules && pnpm install --verbose
```

## If You Need to Rollback

```bash
# Revert to previous commit (if needed)
git revert 34aba7a
git push origin main

# Or reset .npmrc to npm.org (not recommended while npm.org is down)
git reset --soft HEAD~1
# Edit .npmrc back to registry=https://registry.npmjs.org/
```

---

**Summary**: The npm registry outage has been bypassed using Yarn's independent mirror registry. The deployment should now succeed without changes to your application architecture.

Monitor the Vercel build for the next 10 minutes to confirm success.
