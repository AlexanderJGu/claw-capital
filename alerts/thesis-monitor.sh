#!/usr/bin/env bash
set -uo pipefail

# HTF Thesis Monitor — checks prices against thesis buy/watch zones
# Crypto: Hyperliquid allMids | Equities: Twelve Data batch API

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="$SCRIPT_DIR/config"
STATE_DIR="$SCRIPT_DIR/state"
THESIS_FILE="$CONFIG_DIR/thesis-levels.json"
STATE_FILE="$STATE_DIR/thesis-state.json"
PRICES_FILE="$STATE_DIR/thesis-prices.json"

mkdir -p "$STATE_DIR"
source ~/.config/env/global.env 2>/dev/null || true

# --- Collect all prices into a JSON object ---
prices="{}"

# Crypto from Hyperliquid
hl=$(curl -s --max-time 10 -X POST "https://api.hyperliquid.xyz/info" \
  -H "Content-Type: application/json" \
  -d '{"type":"allMids"}' 2>/dev/null) || hl="{}"

for name in $(jq -r '.assets | to_entries[] | select(.value.type=="crypto") | .key' "$THESIS_FILE"); do
  p=$(echo "$hl" | jq -r ".\"$name\" // empty")
  [[ -n "$p" ]] && prices=$(echo "$prices" | jq --arg k "$name" --arg v "$p" '. + {($k): ($v|tonumber)}')
done

# Equities from Twelve Data (batched, max 7 per request)
eq_syms=$(jq -r '[.assets | to_entries[] | select(.value.type=="equity" and (.value.alert_triggers.price_enters_buy_zone==true or .value.alert_triggers.price_enters_watch_zone==true)) | .value.symbol // .key] | join(",")' "$THESIS_FILE")

IFS=',' read -ra syms <<< "$eq_syms"
total=${#syms[@]}
batch_size=7

for (( i=0; i<total; i+=batch_size )); do
  batch="${syms[*]:i:batch_size}"
  batch_csv="${batch// /,}"
  count=$(echo "$batch_csv" | tr ',' '\n' | wc -l)
  
  data=$(curl -s --max-time 15 "https://api.twelvedata.com/price?symbol=${batch_csv}&apikey=${TWELVEDATA_API_KEY}" 2>/dev/null)
  
  if [[ $count -eq 1 ]]; then
    p=$(echo "$data" | jq -r '.price // empty')
    name=$(jq -r ".assets | to_entries[] | select(.value.symbol==\"$batch_csv\" or .key==\"$batch_csv\") | .key" "$THESIS_FILE" | head -1)
    [[ -n "$p" && -n "$name" ]] && prices=$(echo "$prices" | jq --arg k "$name" --arg v "$p" '. + {($k): ($v|tonumber)}')
  else
    for sym in ${batch}; do
      p=$(echo "$data" | jq -r ".\"$sym\".price // empty")
      name=$(jq -r ".assets | to_entries[] | select(.value.symbol==\"$sym\" or .key==\"$sym\") | .key" "$THESIS_FILE" | head -1)
      [[ -n "$p" && -n "$name" ]] && prices=$(echo "$prices" | jq --arg k "$name" --arg v "$p" '. + {($k): ($v|tonumber)}')
    done
  fi
  
  # Wait if more batches
  remaining=$(( total - i - batch_size ))
  (( remaining > 0 )) && sleep 62
done

echo "$prices" > "$PRICES_FILE"

# --- Use jq to do all zone checking in one pass ---
prev_zones="{}"
[[ -f "$STATE_FILE" ]] && prev_zones=$(jq '.zones // {}' "$STATE_FILE" 2>/dev/null || echo "{}")

result=$(jq -n \
  --argjson prices "$prices" \
  --argjson prev "$prev_zones" \
  --argjson thesis "$(cat "$THESIS_FILE")" \
  '
  def zone(price; asset):
    if asset.buy_zone != null and (price >= asset.buy_zone[0] and price <= asset.buy_zone[1]) then "buy"
    elif asset.buy_zone != null and price < asset.buy_zone[0] then "below_buy"
    elif asset.watch_zone != null and (price >= asset.watch_zone[0] and price <= asset.watch_zone[1]) then "watch"
    else "above"
    end;
  
  reduce ($thesis.assets | to_entries[]) as $e (
    {zones: {}, alerts: []};
    if $prices[$e.key] then
      ($prices[$e.key]) as $price |
      zone($price; $e.value) as $z |
      ($prev[$e.key] // "above") as $pz |
      .zones[$e.key] = $z |
      if $z != $pz then
        if $z == "buy" then
          .alerts += [("🟢 " + $e.key + " entered BUY ZONE at $" + ($price|tostring) + " (range: $" + ($e.value.buy_zone[0]|tostring) + "–$" + ($e.value.buy_zone[1]|tostring) + ")\nThesis: " + $e.value.current_thesis)]
        elif $z == "below_buy" then
          .alerts += [("🔥 " + $e.key + " BELOW buy zone at $" + ($price|tostring) + " (buy starts at $" + ($e.value.buy_zone[0]|tostring) + ")\nThesis: " + $e.value.current_thesis)]
        elif $z == "watch" then
          .alerts += [("🟡 " + $e.key + " entered WATCH ZONE at $" + ($price|tostring) + " (range: $" + ($e.value.watch_zone[0]|tostring) + "–$" + ($e.value.watch_zone[1]|tostring) + ")\nBuy zone: $" + ($e.value.buy_zone[0]|tostring) + "–$" + ($e.value.buy_zone[1]|tostring) + "\nThesis: " + $e.value.current_thesis)]
        elif $z == "above" and ($pz == "buy" or $pz == "watch" or $pz == "below_buy") then
          .alerts += [("⬆️ " + $e.key + " left buy/watch zone — back to $" + ($price|tostring))]
        else . end
      else . end
    else . end
  )
')

# Save state
echo "$result" | jq --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" '{last_check: $ts, zones: .zones}' > "$STATE_FILE"

# Output alerts
alert_count=$(echo "$result" | jq '.alerts | length')
if [[ "$alert_count" -gt 0 ]]; then
  echo "📋 HTF THESIS MONITOR"
  echo ""
  echo "$result" | jq -r '.alerts[]'
fi
