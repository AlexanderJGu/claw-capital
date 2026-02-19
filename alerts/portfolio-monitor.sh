#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORTFOLIO_DIR="$(cd "$SCRIPT_DIR/../portfolio" && pwd)"
STATE_FILE="$SCRIPT_DIR/state/portfolio-state.json"
mkdir -p "$SCRIPT_DIR/state"

# Run onchain.sh --json to get fresh snapshot
current=$("$PORTFOLIO_DIR/onchain.sh" --json 2>/dev/null) || {
  echo "ERROR: onchain.sh failed" >&2
  exit 1
}

alerts=()

# Load previous state if exists
if [[ -f "$STATE_FILE" ]]; then
  prev=$(cat "$STATE_FILE")

  # --- Check total portfolio value drop >5% ---
  prev_total=$(echo "$prev" | jq -r '.total_value_usd // 0')
  curr_total=$(echo "$current" | jq -r '.total_value_usd // 0')
  if (( $(echo "$prev_total > 0" | bc -l) )); then
    pct_change=$(echo "scale=4; ($curr_total - $prev_total) / $prev_total * 100" | bc -l)
    if (( $(echo "$pct_change < -5" | bc -l) )); then
      alerts+=("🚨 Portfolio dropped $(printf '%.1f' "$pct_change")% — \$$(printf '%0.0f' "$prev_total") → \$$(printf '%0.0f' "$curr_total")")
    fi
  fi

  # --- Check non-stablecoin positions for >8% move ---
  stablecoins='["USDC","USDH","USDT","DAI"]'
  # Extract all holdings from all chains into flat list
  for chain in solana ethereum base hyperevm hyperliquid_spot; do
    prev_holdings=$(echo "$prev" | jq -c ".chains.${chain}.holdings // []")
    curr_holdings=$(echo "$current" | jq -c ".chains.${chain}.holdings // []")

    echo "$prev_holdings" | jq -c --argjson stable "$stablecoins" '.[] | select(.token as $t | ($stable | index($t)) | not)' 2>/dev/null | while read -r prev_h; do
      token=$(echo "$prev_h" | jq -r '.token')
      prev_val=$(echo "$prev_h" | jq -r '.value_usd')
      prev_bal=$(echo "$prev_h" | jq -r '.balance // 0')
      curr_val=$(echo "$curr_holdings" | jq -r --arg t "$token" '[.[] | select(.token == $t) | .value_usd] | add // 0')
      curr_bal=$(echo "$curr_holdings" | jq -r --arg t "$token" '[.[] | select(.token == $t) | .balance] | add // 0')

      if (( $(echo "$prev_val > 50" | bc -l) )); then
        val_pct=$(echo "scale=4; ($curr_val - $prev_val) / $prev_val * 100" | bc -l)
        # Check if balance changed (transfer/sell) vs pure price move
        bal_pct=$(echo "scale=4; ($curr_bal - $prev_bal) / ($prev_bal + 0.000000001) * 100" | bc -l)
        bal_change_abs=${bal_pct#-}

        if (( $(echo "$bal_change_abs > 2" | bc -l) )); then
          # Balance changed significantly — this is a transfer, not just price
          bal_delta=$(echo "scale=6; $curr_bal - $prev_bal" | bc -l)
          val_delta=$(echo "scale=2; $curr_val - $prev_val" | bc -l)
          if (( $(echo "$bal_pct < 0" | bc -l) )); then
            echo "💸 Sold/sent ${bal_delta#-} $token on $chain ($(printf '%0.1f' "${bal_pct#-}")% of position) — balance \$$(printf '%0.0f' "$prev_val") → \$$(printf '%0.0f' "$curr_val")"
          else
            echo "📥 Received $bal_delta $token on $chain — balance \$$(printf '%0.0f' "$prev_val") → \$$(printf '%0.0f' "$curr_val")"
          fi
        elif (( $(echo "${val_pct#-} > 8" | bc -l) )); then
          # Balance unchanged, pure price move >8%
          direction="📈"; (( $(echo "$val_pct < 0" | bc -l) )) && direction="📉"
          echo "$direction $token on $chain price moved $(printf '%+.1f' "$val_pct")% — \$$(printf '%0.0f' "$prev_val") → \$$(printf '%0.0f' "$curr_val")"
        fi
      fi
    done
  done | while read -r line; do
    # Collect from subshell
    echo "$line"
  done > /tmp/portfolio_position_alerts.txt 2>/dev/null || true

  if [[ -s /tmp/portfolio_position_alerts.txt ]]; then
    while IFS= read -r line; do
      alerts+=("$line")
    done < /tmp/portfolio_position_alerts.txt
  fi
  rm -f /tmp/portfolio_position_alerts.txt

  # --- Check if HL orders filled ---
  prev_orders=$(echo "$prev" | jq -c '[.open_orders[] | "\(.coin)_\(.side)_\(.price)"] | sort')
  curr_orders=$(echo "$current" | jq -c '[.open_orders[] | "\(.coin)_\(.side)_\(.price)"] | sort')

  # Find orders in prev but not in current (= filled or cancelled)
  filled=$(jq -n --argjson prev "$prev_orders" --argjson curr "$curr_orders" '$prev - $curr | .[]' 2>/dev/null || true)
  if [[ -n "$filled" ]]; then
    while IFS= read -r order_key; do
      order_key=$(echo "$order_key" | tr -d '"')
      # Look up details from prev state
      price=$(echo "$order_key" | cut -d_ -f3)
      side=$(echo "$order_key" | cut -d_ -f2)
      coin=$(echo "$order_key" | cut -d_ -f1)
      details=$(echo "$prev" | jq -r --arg p "$price" '.open_orders[] | select(.price == ($p | tonumber)) | "  \(.side) \(.size) \(.coin) @ $\(.price)"')
      alerts+=("🔔 HL order filled/cancelled: $details")
    done <<< "$filled"
  fi
fi

# Save current state
echo "$current" > "$STATE_FILE"

# Output alerts
if [[ ${#alerts[@]} -gt 0 ]]; then
  echo "⚠️ Portfolio Alert"
  echo ""
  for a in "${alerts[@]}"; do
    echo "• $a"
  done
fi
