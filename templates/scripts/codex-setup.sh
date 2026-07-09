#!/usr/bin/env bash
set -euo pipefail

# Codex cloud setup: dependency preparation only.
# Do not place production secrets here.

if [ -f package-lock.json ]; then
  npm ci
elif [ -f pnpm-lock.yaml ]; then
  corepack enable
  pnpm install --frozen-lockfile
else
  npm install
fi

# Dummy build-time values may be exported by the Codex environment settings.
# Do not run migration against a remote database in this script.
