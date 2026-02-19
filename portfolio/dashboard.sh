#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SNAPSHOT_DIR="$SCRIPT_DIR/snapshots"
mkdir -p "$SNAPSHOT_DIR"

JSON_MODE=false
[[ "${1:-}" == "--json" ]] && JSON_MODE=true

FLAG=""
$JSON_MODE && FLAG="--json"

# Run both trackers
echo "Running onchain tracker..." >&2
onchain_out=$("$SCRIPT_DIR/onchain.sh" --json 2>/dev/null) || onchain_out='{"total_value_usd":0}'
echo "Running offchain tracker..." >&2
offchain_out=$("$SCRIPT_DIR/offchain.sh" --json 2>/dev/null) || offchain_out='{"total_value_usd":0}'

onchain_total=$(echo "$onchain_out" | jq '.total_value_usd // 0')
offchain_total=$(echo "$offchain_out" | jq '.total_value_usd // 0')
grand_total=$(echo "$onchain_total $offchain_total" | awk '{printf "%.2f", $1+$2}')

# Calculate allocation percentages
if (( $(echo "$grand_total > 0" | bc -l) )); then
  onchain_pct=$(echo "$onchain_total $grand_total" | awk '{printf "%.1f", ($1/$2)*100}')
  offchain_pct=$(echo "$offchain_total $grand_total" | awk '{printf "%.1f", ($1/$2)*100}')
else
  onchain_pct="0.0"
  offchain_pct="0.0"
fi

# Build combined snapshot
combined=$(jq -n \
  --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --arg grand_total "$grand_total" \
  --arg onchain_total "$onchain_total" \
  --arg offchain_total "$offchain_total" \
  --arg onchain_pct "$onchain_pct" \
  --arg offchain_pct "$offchain_pct" \
  --argjson onchain "$onchain_out" \
  --argjson offchain "$offchain_out" \
  '{
    timestamp: $ts,
    net_worth_usd: ($grand_total | tonumber),
    allocation: {
      onchain: { total_usd: ($onchain_total | tonumber), pct: ($onchain_pct | tonumber) },
      offchain: { total_usd: ($offchain_total | tonumber), pct: ($offchain_pct | tonumber) }
    },
    onchain: $onchain,
    offchain: $offchain
  }')

echo "$combined" > "$SNAPSHOT_DIR/combined-latest.json"

if $JSON_MODE; then
  echo "$combined"
  exit 0
fi

# Human-readable
fmt_usd() { printf "$%'.2f" "$1"; }

echo ""
echo "🏦 CLAWCAPITAL NET WORTH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📅 $(date -u +%Y-%m-%d\ %H:%M\ UTC)"
echo ""
echo "💰 Net Worth: $(fmt_usd "$grand_total")"
echo ""
echo "📊 Allocation:"
echo "  • Onchain: $(fmt_usd "$onchain_total") ($onchain_pct%)"
echo "  • Offchain: $(fmt_usd "$offchain_total") ($offchain_pct%)"
echo ""

# Print chain breakdown from onchain
echo "🔗 Onchain Breakdown:"
echo "$onchain_out" | jq -r '.chains | to_entries[] |
  select(.value.total_usd > 0 or (.value.account_value // 0) > 0) |
  if .value.account_value then
    "  • \(.key): $\(.value.account_value | floor)"
  else
    "  • \(.key): $\(.value.total_usd | floor)"
  end'

# Print offchain breakdown
offchain_count=$(echo "$offchain_out" | jq '.assets | length // 0')
if [[ "$offchain_count" -gt 0 ]]; then
  echo ""
  echo "🏛️ Offchain Breakdown:"
  echo "$offchain_out" | jq -r '.assets[] | "  • \(.name): $\(.current_value | floor)"'
fi

echo ""
echo "💾 Combined snapshot saved to snapshots/combined-latest.json"
