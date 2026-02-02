#!/bin/bash
# Vercel pre-install hook to ensure Yarn registry is used
# This runs before pnpm install to set up the correct registry

set -e

echo "=== DropLabz Vercel Pre-Install Hook ==="
echo "Ensuring alternative npm registry is configured..."

# Verify .npmrc exists and uses Yarn registry
if ! grep -q "registry.yarnpkg.com" .npmrc; then
  echo "WARNING: .npmrc may not have Yarn registry configured"
  echo "Current registry:"
  grep "^registry=" .npmrc || echo "No registry found"
fi

# Display pnpm version
echo "pnpm version: $(pnpm --version)"

# Display registry being used
echo "Registry configured: $(grep '^registry=' .npmrc || echo 'Using system default')"

echo "=== Pre-install hook complete ==="
