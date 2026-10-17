#!/usr/bin/env bash
# Production deploy for the I ARCH TECH site (run on the droplet as the `deploy` user).
#
# Pulls origin/main, installs dependencies only when the lockfile changed, builds
# into a side folder and swaps it in, so the live site keeps serving during the build.
# If the build fails, or the new build doesn't answer after the restart, the previous
# commit and build are put back and the deploy exits non-zero.
# Triggered by GitHub Actions over SSH (forced command) or by hand: ~/airplan/scripts/deploy.sh

# Everything lives in main(): bash parses it fully before running, so the
# `git reset` below can safely replace this very file mid-deploy.
main() {
  set -euo pipefail
  export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"
  local app_dir app_name health_url
  app_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  app_name="airplan"
  health_url="http://127.0.0.1:${HEALTH_PORT:-8080}/"
  cd "$app_dir"

  # wait for a deploy already in progress instead of silently skipping this one
  exec 9>/tmp/airplan-deploy.lock
  if ! flock -w 1200 9; then
    echo "✗ Another deploy has held the lock for 20 minutes; giving up." >&2
    exit 1
  fi

  local prev_rev deps_changed=0
  prev_rev="$(git rev-parse HEAD)"
  git fetch --quiet origin main
  git reset --hard --quiet origin/main
  echo "▶ Deploying $(git log --oneline -1)"

  # put the previous commit (and its dependencies) back if anything below fails
  rollback_code() {
    echo "✗ Deploy failed; restoring $(git rev-parse --short "$prev_rev")" >&2
    git reset --hard --quiet "$prev_rev"
    if [ "$deps_changed" = 1 ]; then
      npm ci --no-audit --no-fund >/dev/null 2>&1 || true
      sha1sum package-lock.json | cut -d' ' -f1 > .deploy-lock-hash
    fi
  }
  trap rollback_code ERR

  local lock_hash
  lock_hash="$(sha1sum package-lock.json | cut -d' ' -f1)"
  if [ ! -d node_modules ] || [ "$(cat .deploy-lock-hash 2>/dev/null || true)" != "$lock_hash" ]; then
    echo "▶ Installing dependencies"
    deps_changed=1
    npm ci --no-audit --no-fund
    echo "$lock_hash" > .deploy-lock-hash
  fi

  echo "▶ Building"
  rm -rf .next-build
  NEXT_DIST_DIR=.next-build NODE_OPTIONS="--max-old-space-size=1536" NEXT_TELEMETRY_DISABLED=1 npx next build
  trap - ERR

  echo "▶ Switching to the new build"
  rm -rf .next-prev
  if [ -d .next ]; then mv .next .next-prev; fi
  mv .next-build .next
  pm2 restart "$app_name" --update-env >/dev/null

  # health check: the new build must answer before the old one is thrown away
  local ok=0
  for _ in $(seq 1 30); do
    if [ "$(curl -s -o /dev/null -w '%{http_code}' "$health_url" || true)" = "200" ]; then ok=1; break; fi
    sleep 1
  done
  if [ "$ok" != 1 ]; then
    echo "✗ New build did not answer at $health_url; rolling back" >&2
    if [ -d .next-prev ]; then rm -rf .next && mv .next-prev .next; fi
    rollback_code
    pm2 restart "$app_name" --update-env >/dev/null
    exit 1
  fi

  pm2 save >/dev/null || true
  rm -rf .next-prev
  echo "✓ Deployed $(git rev-parse --short HEAD)"
}

main "$@"
