#!/usr/bin/env bash
# Production deploy for the I ARCH TECH site (run on the droplet as the `deploy` user).
#
# Pulls origin/main, installs dependencies only when the lockfile changed, builds
# into a side folder and swaps it in, so the live site keeps serving during the build.
# Triggered by GitHub Actions over SSH (forced command) or by hand: ~/airplan/scripts/deploy.sh

# Everything lives in main(): bash parses it fully before running, so the
# `git reset` below can safely replace this very file mid-deploy.
main() {
  set -euo pipefail
  export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"
  local app_dir app_name
  app_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  app_name="airplan"
  cd "$app_dir"

  exec 9>/tmp/airplan-deploy.lock
  if ! flock -n 9; then
    echo "Another deploy is running; skipping."
    exit 0
  fi

  git fetch --quiet origin main
  git reset --hard --quiet origin/main
  echo "▶ Deploying $(git log --oneline -1)"

  local lock_hash
  lock_hash="$(sha1sum package-lock.json | cut -d' ' -f1)"
  if [ ! -d node_modules ] || [ "$(cat .deploy-lock-hash 2>/dev/null || true)" != "$lock_hash" ]; then
    echo "▶ Installing dependencies"
    npm ci --no-audit --no-fund
    echo "$lock_hash" > .deploy-lock-hash
  fi

  echo "▶ Building"
  rm -rf .next-build
  NEXT_DIST_DIR=.next-build NODE_OPTIONS="--max-old-space-size=1536" NEXT_TELEMETRY_DISABLED=1 npx next build

  echo "▶ Switching to the new build"
  rm -rf .next-prev
  if [ -d .next ]; then mv .next .next-prev; fi
  mv .next-build .next
  pm2 restart "$app_name" --update-env >/dev/null
  pm2 save >/dev/null || true
  rm -rf .next-prev
  echo "✓ Deployed $(git rev-parse --short HEAD)"
}

main "$@"
