#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SNAPSHOT_DIR="$SCRIPT_DIR/snapshots"
mkdir -p "$SNAPSHOT_DIR"

source ~/.config/env/global.env
OFFCHAIN_FILE="$SCRIPT_DIR/offchain.json"

JSON_MODE=false
[[ "${1:-}" == "--json" ]] && JSON_MODE=true

if [[ ! -f "$OFFCHAIN_FILE" ]]; then
  echo "ERROR: $OFFCHAIN_FILE not found" >&2
  exit 1
fi

assets=$(jq -c '.assets' "$OFFCHAIN_FILE")
count=$(echo "$assets" | jq 'length')

if [[ "$count" -eq 0 ]]; then
  empty=$(jq -n --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" '{timestamp: $ts, total_value_usd: 0, assets: []}')
  echo "$empty" > "$SNAPSHOT_DIR/offchain-latest.json"
  if $JSON_MODE; then
    echo "$empty"
  else
    echo "No offchain assets configured. Edit offchain.json to add them."
  fi
  exit 0
fi

# Separate stock/ETF assets (need price lookup) from static assets
stock_types='["stock","etf"]'
stocks=$(echo "$assets" | jq -c "[.[] | select(.type as \$t | $stock_types | index(\$t))]")
static=$(echo "$assets" | jq -c "[.[] | select(.type as \$t | $stock_types | index(\$t) | not)]")

# Fetch prices for stocks/ETFs
enriched_stocks="[]"
stock_count=$(echo "$stocks" | jq 'length')
for i in $(seq 0 $((stock_count - 1))); do
  asset=$(echo "$stocks" | jq -c ".[$i]")
  symbol=$(echo "$asset" | jq -r '.name')
  qty=$(echo "$asset" | jq '.quantity // 0')

  price_data=$(curl -sf "https://finnhub.io/api/v1/quote?symbol=$symbol&token=$FINNHUB_API_KEY" 2>/dev/null || echo '{}')
  current_price=$(echo "$price_data" | jq '.c // 0')

  if (( $(echo "$current_price > 0" | bc -l) )); then
    value=$(echo "$qty $current_price" | awk '{printf "%.2f", $1*$2}')
  else
    # Fallback: use avg_cost
    avg_cost=$(echo "$asset" | jq '.avg_cost // 0')
    value=$(echo "$qty $avg_cost" | awk '{printf "%.2f", $1*$2}')
    current_price="$avg_cost"
    echo "WARNING: Could not fetch price for $symbol, using avg_cost" >&2
  fi

  enriched_stocks=$(echo "$enriched_stocks" | jq -c --argjson a "$asset" --arg price "$current_price" --arg val "$value" \
    '. + [$a + {current_price: ($price | tonumber), current_value: ($val | tonumber)}]')

  # Rate limit Finnhub
  [[ $i -lt $((stock_count - 1)) ]] && sleep 0.5
done

# Process static assets (cash, retirement, real estate, etc.)
enriched_static=$(echo "$static" | jq -c '[.[] | . + {current_value: (.value // 0)}]')

# Combine
all_enriched=$(echo "$enriched_stocks $enriched_static" | jq -sc '.[0] + .[1]')
total=$(echo "$all_enriched" | jq '[.[].current_value] | add // 0')

# Build snapshot
snapshot=$(jq -n \
  --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --argjson assets "$all_enriched" \
  --argjson total "$total" \
  '{timestamp: $ts, total_value_usd: $total, assets: $assets}')

echo "$snapshot" > "$SNAPSHOT_DIR/offchain-latest.json"

if $JSON_MODE; then
  echo "$snapshot"
  exit 0
fi

# Human-readable
fmt_usd() { printf "$%'.2f" "$1"; }

echo ""
echo "🏛️ OFFCHAIN PORTFOLIO"
echo "━━━━━━━━━━━━━━━━━━━━━"
echo "📅 $(date -u +%Y-%m-%d\ %H:%M\ UTC)"
echo ""
echo "💰 Total Value: $(fmt_usd "$total")"
echo ""

# Group by type
for typ in stock etf cash retirement real_estate other; do
  group=$(echo "$all_enriched" | jq -c "[.[] | select(.type == \"$typ\")]")
  group_count=$(echo "$group" | jq 'length')
  [[ "$group_count" -eq 0 ]] && continue

  type_total=$(echo "$group" | jq '[.[].current_value] | add // 0')
  label=$(echo "$typ" | sed 's/_/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)}1')
  echo "▸ $label: $(fmt_usd "$type_total")"

  echo "$group" | jq -r '.[] |
    if .quantity then
      "  • \(.name): \(.quantity) shares @ $\(.current_price) = $\(.current_value) (\(.account // "—"))"
    else
      "  • \(.name): $\(.current_value) (\(.account // "—"))"
    end'
done

echo ""
echo "💾 Snapshot saved to snapshots/offchain-latest.json"
