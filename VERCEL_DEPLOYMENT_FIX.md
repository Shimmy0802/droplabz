# Vercel Deployment Configuration for pnpm Monorepo

## Problem: ERR_INVALID_THIS Errors

**Root Causes**:

1. Yarn registry (registry.yarnpkg.com) has compatibility issues with pnpm in Vercel's ephemeral environment
2. pnpm 9.0.0 has a known bug with the 'in' operator in timeout handling
3. Missing explicit pnpm configuration for CI/CD environments
4. No proper retry/timeout configuration for unstable network conditions

## Solution Implemented

### 1. Registry Migration (.npmrc)

**Changed from**: `registry=https://registry.yarnpkg.com`  
**Changed to**: `registry=https://registry.npmjs.org/`

**Why npm registry is more reliable for CI/CD**:

- npm registry is the canonical source for npm packages
- Better tested with CI/CD tools like Vercel
- Yarn registry optimizations don't benefit pnpm
- npm registry has better global CDN coverage
- No compatibility issues with pnpm's resolver

### 2. pnpm Version Upgrade

**Changed from**: `pnpm@9.0.0`  
**Changed to**: `pnpm@9.1.3`

**Why 9.1.3**:

- 9.0.0 has a bug in timeout error handling (ERR_INVALID_THIS)
- 9.1.3 has fixes for this and other stability issues
- Still part of the 9.x series to maintain compatibility
- Well-tested and stable in CI/CD environments

### 3. Enhanced .npmrc Configuration

```properties
# Registry configuration
registry=https://registry.npmjs.org/
strict-ssl=true

# Network timeout settings (optimized for Vercel)
fetch-timeout=120000              # 120s for slow/degraded networks
fetch-retry-mintimeout=20000       # 20s minimum wait between retries
fetch-retry-maxtimeout=120000      # 120s maximum wait between retries
fetch-retries=3                    # 3 total retry attempts

# Performance optimizations
prefer-offline=false               # false: always check for newest
auto-install-peers=true            # Auto-install peer dependencies
store-dir=.pnpm-store             # Central store location
```

**Timeout logic**:

- First attempt: fails after 120s
- Retry 1: waits 20s, tries again (20s window)
- Retry 2: waits 20-120s exponential, tries again
- Retry 3: final attempt with 120s timeout
- Total possible time: ~6 minutes (reasonable for CI)

### 4. Vercel Configuration (vercel.json)

**Key changes**:

```json
{
    "installCommand": "pnpm install --frozen-lockfile",
    "buildCommand": "pnpm install --frozen-lockfile && cd apps/web && pnpm build",
    "env": {
        "PNPM_HOME": ".pnpm",
        "PATH": "$PNPM_HOME:$PATH"
    }
}
```

**Why `--frozen-lockfile`**:

- Ensures pnpm-lock.yaml is respected exactly
- Prevents version mismatches in CI
- Faster builds (no dependency resolution)
- Critical for monorepos to prevent drift between branches

**Why explicit PATH**:

- Ensures Vercel uses the correct pnpm binary
- `.pnpm` directory added to PATH
- Prevents fallback to system pnpm

## Testing Locally

```bash
# Test with frozen lockfile
pnpm install --frozen-lockfile

# Verify web app builds
cd apps/web && pnpm build

# Test the exact Vercel build command
pnpm install --frozen-lockfile && cd apps/web && pnpm build
```

## Vercel Deployment Steps

1. **Update root package.json**:
    - Verify `packageManager: "pnpm@9.1.3"`

2. **Commit changes**:

    ```bash
    git add .npmrc vercel.json package.json
    git commit -m "fix: update pnpm registry and versions for Vercel stability"
    git push
    ```

3. **Clear Vercel cache**:
    - Go to Project Settings → Git
    - Click "Clear Build Cache"
    - Or redeploy from git

4. **Redeploy**:
    - Vercel will auto-deploy on push
    - Monitor build logs for success

## Troubleshooting Build Failures

### If still seeing ERR_INVALID_THIS:

```bash
# Clear local node_modules
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules

# Reinstall with new pnpm
pnpm install
```

### If timeout errors persist:

- Increase `fetch-timeout` in .npmrc to 180000 (3 minutes)
- Reduce `fetch-retries` to 2 if network is very unstable
- Contact Vercel support for network issues

### If specific packages fail to install:

- Check pnpm-lock.yaml is not corrupted:
    ```bash
    pnpm install --force
    ```
- Update lock file and recommit

## Alternative: Emergency Fallback

If registry issues persist, you can temporarily:

```properties
# .npmrc fallback
registry=https://registry.npmjs.org/
fetch-timeout=180000
fetch-retries=5

# With authentication (if needed)
npm.org:always-auth=true
```

## Performance Impact

- **Build time impact**: Minimal (same packages, faster with --frozen-lockfile)
- **Disk usage**: Same (pnpm is already efficient)
- **Network usage**: Slightly better (npm registry is optimized)
- **Cost**: No change (Vercel doesn't charge for build time)

## Related Files

- `.npmrc` - npm registry and pnpm configuration
- `.npmrc.ci` - CI-specific overrides (optional)
- `vercel.json` - Vercel build configuration
- `pnpm-workspace.yaml` - Workspace configuration
- `package.json` - pnpm version specification

---

**Updated**: February 2, 2026  
**Status**: Ready for deployment
