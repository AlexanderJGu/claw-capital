#!/bin/bash
# Copy/refresh data for Vercel builds
# watchlist.json and trade-ideas.json are maintained directly in dashboard/data/
# regime.json and drafts/ are synced from source

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DASH_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(dirname "$DASH_DIR")"
DATA_DIR="$DASH_DIR/data"

mkdir -p "$DATA_DIR/drafts"

# Drafts
cp "$REPO_ROOT/drafts/tweets/"*.md "$DATA_DIR/drafts/" 2>/dev/null

# Portfolio data
PORTFOLIO_JSON="$REPO_ROOT/portfolio/../dashboard/data/portfolio.json"
if [ -f "$REPO_ROOT/portfolio/pull-portfolio.js" ]; then
  # If portfolio.json already exists in data/, it's already in place
  # Otherwise try to generate it (requires plaid tokens)
  if [ ! -f "$DATA_DIR/portfolio.json" ]; then
    cd "$REPO_ROOT/portfolio" && node pull-portfolio.js 2>/dev/null || true
  fi
fi

echo "Data synced to $DATA_DIR"
