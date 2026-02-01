# Prettier Configuration — DropLabz

## Overview

DropLabz uses the **official Solana Prettier config** for consistent code formatting
across the entire monorepo.

- **Package**: `@solana/prettier-config-solana` (v0.0.6+)
- **Repository**: <https://github.com/anza-xyz/prettier-config-solana>
- **Reference**: Industry-standard Solana ecosystem formatting

## CRITICAL: Formatting is Mandatory

**ALL code must be formatted using `pnpm format` before committing.**

Unformatted code will:

- ❌ Fail CI/pre-commit hooks
- ❌ Be rejected in code review
- ❌ Cause inconsistency across the codebase

## Installation & Usage

### Format All Files

```bash
pnpm format
```

This formats all TypeScript, JavaScript, JSON, Markdown, and other supported files
across the entire monorepo.

### Check Formatting Without Modifying

```bash
pnpm format:check
```

Use this to verify files are properly formatted before committing.

### Package-Specific Formatting

Each workspace has its own `format` and `format:check` scripts:

```bash
# Format only web app
cd apps/web && pnpm format

# Format only bot
cd apps/bot && pnpm format

# Format only SDK
cd packages/sdk && pnpm format
```

## Configuration

### Where Configuration Lives

1. **prettier field in package.json**:

    ```json
    "prettier": "@solana/prettier-config-solana"
    ```

    - Set in: `/package.json` (root), `apps/web/package.json`, `apps/bot/package.json`,
      `packages/sdk/package.json`

2. **.prettierignore**:

    ```
    node_modules
    dist
    build
    .next
    .turbo
    .cache
    coverage
    *.lock
    pnpm-lock.yaml
    package-lock.json
    yarn.lock
    ```

    - Located at: `/home/shimmy/droplabz/.prettierignore`

### Rules Enforced

The Solana Prettier config enforces:

- **Semicolons**: Required
- **Quotes**: Double quotes (unless single quotes are necessary)
- **Trailing commas**: As of ES5
- **Tabs vs Spaces**: 2 spaces for indentation
- **Arrow parentheses**: Always
- **Line width**: 80 characters (for documentation), auto-configured for code
- **Bracket spacing**: Consistent
- **Line endings**: LF (Unix)

For full details, see:
<https://github.com/anza-xyz/prettier-config-solana/blob/main/README.md>

## Git Workflow

### Before Committing

```bash
# 1. Make your changes
# 2. Format the code
pnpm format

# 3. Verify formatting (optional)
pnpm format:check

# 4. Stage and commit
git add .
git commit -m "feature: description"
```

### Pre-commit Hook (Recommended)

Consider adding a pre-commit hook to enforce formatting:

```bash
#!/bin/sh
# .git/hooks/pre-commit

pnpm format:check || {
  echo "❌ Code is not formatted. Run 'pnpm format' before committing."
  exit 1
}
```

## CI Integration

Formatting should be verified in CI:

```yaml
# Example GitHub Actions
- name: Check Code Formatting
  run: pnpm format:check
```

## Troubleshooting

### "Code is not formatted"

**Solution**: Run `pnpm format` at the repository root.

```bash
cd /home/shimmy/droplabz
pnpm format
```

### Some files not being formatted

**Check**:

1. File is not in `.prettierignore`
2. File extension is supported by Prettier (`.ts`, `.tsx`, `.js`, `.jsx`, `.json`, `.md`,
   etc.)
3. File path is included in current working directory

### Prettier conflicts with ESLint

**Solution**: Ensure `@solana/prettier-config-solana` version matches across all packages.
ESLint should defer to Prettier for formatting.

## Updating Prettier Version

When updating the Prettier config version:

1. Update version in all package.json files:

    ```json
    "@solana/prettier-config-solana": "^x.x.x"
    ```

2. Reinstall dependencies:

    ```bash
    pnpm install
    ```

3. Format entire codebase:

    ```bash
    pnpm format
    ```

4. Commit formatted changes:

    ```bash
    git add .
    git commit -m "chore: update prettier config to vx.x.x"
    ```

## References

- **Official Repo**: <https://github.com/anza-xyz/prettier-config-solana>
- **Prettier Docs**: <https://prettier.io/docs/>
- **Solana Labs Standards**: <https://github.com/anza-xyz/prettier-config-solana>

---

**Status**: ✅ All code is currently formatted with the Solana Prettier config.

Last formatted: January 24, 2026
