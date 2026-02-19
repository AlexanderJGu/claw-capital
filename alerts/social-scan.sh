#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_FILE="$SCRIPT_DIR/state/social-state.json"
XRESEARCH_DIR="/root/.openclaw/workspace/skills/x-research"
mkdir -p "$SCRIPT_DIR/state"

source ~/.config/env/global.env
export PATH="$HOME/.bun/bin:$PATH"

WATCHLIST_FILE="$SCRIPT_DIR/config/watchlist.json"
now=$(date -u +%s)
now_iso=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Load watchlist — use social_query from config, fall back to symbol
if [[ -f "$WATCHLIST_FILE" ]]; then
  readarray -t ASSETS < <(jq -r '.assets[] | select(.social_enabled == true) | .symbol' "$WATCHLIST_FILE")
  declare -A QUERIES
  while IFS='|' read -r sym query; do
    QUERIES["$sym"]="$query"
  done < <(jq -r '.assets[] | select(.social_enabled == true) | "\(.symbol)|\(.social_query // .symbol)"' "$WATCHLIST_FILE")
else
  ASSETS=("BTC" "HYPE")
  declare -A QUERIES
  QUERIES["BTC"]='$BTC OR bitcoin'
  QUERIES["HYPE"]='$HYPE OR hyperliquid'
fi

# Load previous state
if [[ -f "$STATE_FILE" ]]; then
  state=$(cat "$STATE_FILE")
else
  state='{"history":{}}'
fi

alerts=()
new_history=$(echo "$state" | jq '.history')

for asset in "${ASSETS[@]}"; do
  # Search for mentions using watchlist query
  query="${QUERIES[$asset]:-$asset}"

  raw=$(cd "$XRESEARCH_DIR" && bun run x-search.ts search "$query" --since 2h --limit 20 --json 2>/dev/null) || {
    echo "WARN: x-search failed for $asset" >&2
    continue
  }

  # Count tweets and get top engaged
  count=$(echo "$raw" | jq 'if type == "array" then length else 0 end' 2>/dev/null || echo "0")

  top_tweets=$(echo "$raw" | jq -r '
    if type == "array" then
      sort_by(-(.metrics.likes // 0) - (.metrics.retweets // 0)) |
      .[0:3] |
      .[] |
      "  → @\(.username // "unknown"): \(.text[0:120] | gsub("\n"; " "))... (❤️\(.metrics.likes // 0) 🔁\(.metrics.retweets // 0))"
    else empty end' 2>/dev/null || echo "")

  # Get 7-day rolling average from history
  seven_days_ago=$((now - 604800))
  avg=$(echo "$new_history" | jq --arg a "$asset" --arg cutoff "$seven_days_ago" '
    (.[$a] // []) |
    [.[] | select(.ts >= ($cutoff | tonumber)) | .count] |
    if length > 0 then (add / length) else 0 end
  ' 2>/dev/null || echo "0")

  # Add current data point to history (keep last 7 days)
  new_history=$(echo "$new_history" | jq --arg a "$asset" --arg cutoff "$seven_days_ago" --argjson ts "$now" --argjson c "$count" '
    .[$a] = ([(.[$a] // [])[] | select(.ts >= ($cutoff | tonumber))] + [{"ts": $ts, "count": $c}])
  ')

  # Check if velocity > 3x average
  if (( $(echo "$avg > 0 && $count > ($avg * 3)" | bc -l 2>/dev/null || echo "0") )); then
    alert="📢 $asset social spike: $count mentions (avg: $(printf '%.0f' "$avg"))"
    if [[ -n "$top_tweets" ]]; then
      alert="$alert
$top_tweets"
    fi
    alerts+=("$alert")
  fi
done

# Save state
jq -n --argjson h "$new_history" --arg ts "$now_iso" '{"timestamp": $ts, "history": $h}' > "$STATE_FILE"

# Output
if [[ ${#alerts[@]} -gt 0 ]]; then
  echo "🔍 Social Alert"
  echo ""
  for a in "${alerts[@]}"; do
    echo "• $a"
  done
fi
