#!/usr/bin/env bash
# Pulls the latest main, and only rebuilds/restarts the container if
# something actually changed (including data/Database*.json commits from
# the daily snapshot cron — that's what keeps a self-hosted instance's
# price history in sync, since there's no Vercel-style auto-redeploy-on-
# push here). Meant to run on a schedule via cron — see DEPLOYMENT.md.
set -euo pipefail
cd "$(dirname "$0")/.."

BEFORE=$(git rev-parse HEAD)
git fetch origin main
git reset --hard origin/main
AFTER=$(git rev-parse HEAD)

if [ "$BEFORE" = "$AFTER" ]; then
  exit 0
fi

echo "$(date -u +%FT%TZ) deploying $BEFORE -> $AFTER"
docker compose build
docker compose up -d
docker image prune -f
