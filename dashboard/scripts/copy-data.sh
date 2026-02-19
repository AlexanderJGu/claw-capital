#!/bin/bash
# Copy data files into dashboard/data/ for Vercel builds
# In local dev, data.ts reads from ../crypto-desk etc.
# On Vercel, it reads from ./data/ (copied at build time)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DASH_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(dirname "$DASH_DIR")"
DATA_DIR="$DASH_DIR/data"

rm -rf "$DATA_DIR"
mkdir -p "$DATA_DIR/crypto-desk/coverage"
mkdir -p "$DATA_DIR/crypto-desk/theses"
mkdir -p "$DATA_DIR/crypto-desk/reports"
mkdir -p "$DATA_DIR/alerts/config"
mkdir -p "$DATA_DIR/drafts/tweets"
mkdir -p "$DATA_DIR/portfolio/snapshots"

# Coverage
cp "$REPO_ROOT/crypto-desk/coverage/"*.json "$DATA_DIR/crypto-desk/coverage/" 2>/dev/null

# Theses
cp "$REPO_ROOT/crypto-desk/theses/"*.md "$DATA_DIR/crypto-desk/theses/" 2>/dev/null

# Reports
cp "$REPO_ROOT/crypto-desk/reports/"*.json "$DATA_DIR/crypto-desk/reports/" 2>/dev/null

# Alerts config
cp "$REPO_ROOT/alerts/config/"*.json "$DATA_DIR/alerts/config/" 2>/dev/null

# Drafts
cp "$REPO_ROOT/drafts/tweets/"*.md "$DATA_DIR/drafts/tweets/" 2>/dev/null

# Portfolio
cp "$REPO_ROOT/portfolio/snapshots/"*.json "$DATA_DIR/portfolio/snapshots/" 2>/dev/null

echo "Data copied to $DATA_DIR"
