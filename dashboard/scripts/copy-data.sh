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

echo "Data synced to $DATA_DIR"
