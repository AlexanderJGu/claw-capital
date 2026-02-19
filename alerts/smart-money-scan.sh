#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="$SCRIPT_DIR/config"
STATE_DIR="$SCRIPT_DIR/state"
ACCOUNT_LIST="$CONFIG_DIR/smart-money.json"
RAW_OUTPUT="$STATE_DIR/smart-money-raw.json"
STATE_FILE="$STATE_DIR/smart-money-state.json"

mkdir -p "$CONFIG_DIR" "$STATE_DIR"

# x-research setup
XRESEARCH_DIR="/root/.openclaw/workspace/skills/x-research"
source ~/.config/env/global.env 2>/dev/null || true
export PATH="$HOME/.bun/bin:$PATH"

NOW_ISO=$(date -u +%Y-%m-%dT%H:%M:%SZ)

if [[ ! -f "$ACCOUNT_LIST" ]]; then
  echo '{"error": "No account list at '"$ACCOUNT_LIST"'"}' >&2
  exit 1
fi

# Load accounts
accounts=$(jq -r '.accounts[].handle' "$ACCOUNT_LIST")

all_tweets="[]"
account_counts=""

for handle in $accounts; do
  echo "Scanning @$handle..." >&2
  
  raw=""
  raw=$(cd "$XRESEARCH_DIR" && bun run x-search.ts search "from:${handle}" --limit 10 --since 24h --json 2>/dev/null) || {
    echo "  Failed to fetch for @$handle" >&2
    continue
  }
  
  # Parse tweets from x-search output — it outputs JSON array
  # Extract and normalize tweets, tagging with author
  parsed=$(echo "$raw" | jq --arg author "$handle" '
    if type == "array" then
      [.[] | {
        author: (.username // $author),
        text: (.text // ""),
        url: (.tweet_url // ("https://x.com/" + $author + "/status/" + (.id // "" | tostring))),
        created_at: (.created_at // ""),
        metrics: {
          likes: (.metrics.likes // 0),
          retweets: (.metrics.retweets // 0),
          replies: (.metrics.replies // 0),
          impressions: (.metrics.impressions // 0)
        }
      }]
    else []
    end
  ' 2>/dev/null) || parsed="[]"
  
  count=$(echo "$parsed" | jq 'length')
  echo "  Got $count tweets" >&2
  account_counts="$account_counts  @$handle: $count\n"
  
  all_tweets=$(jq -n --argjson a "$all_tweets" --argjson b "$parsed" '$a + $b')
  
  # Brief pause between accounts
  sleep 1
done

total=$(echo "$all_tweets" | jq 'length')
echo "" >&2
echo "Total tweets collected: $total" >&2
echo -e "$account_counts" >&2

# Build output
output=$(jq -n \
  --arg ts "$NOW_ISO" \
  --argjson tweets "$all_tweets" \
  '{scan_time: $ts, tweets: $tweets}')

# Save raw results
echo "$output" > "$RAW_OUTPUT"

# Save state
jq -n --arg ts "$NOW_ISO" --argjson total "$total" \
  '{last_scan: $ts, tweets_collected: $total}' > "$STATE_FILE"

# Output to stdout
echo "$output"
