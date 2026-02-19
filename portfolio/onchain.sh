#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SNAPSHOT_DIR="$SCRIPT_DIR/snapshots"
mkdir -p "$SNAPSHOT_DIR"

# Load Allium credentials
source ~/.allium/credentials
ALLIUM_API="https://api.allium.so/api/v1"
ALLIUM_HDR=(-H "Content-Type: application/json" -H "X-API-KEY: $API_KEY")

# Hyperliquid
HL_API="https://api.hyperliquid.xyz/info"
EVM_ADDR="0x513B17960306Ca65bc5Be955cB3E89565D205c9f"
SOL_ADDR="4bcCCbfuVmvjdSBcFTWF4zWkcHzg8uz9LbSPjYEmSotk"

JSON_MODE=false
[[ "${1:-}" == "--json" ]] && JSON_MODE=true

# --- Helper: query Allium wallet balances for a chain ---
allium_balances() {
  local chain="$1" addr="$2"
  curl -sf -X POST "$ALLIUM_API/developer/wallet/balances" \
    "${ALLIUM_HDR[@]}" \
    -d "[{\"chain\":\"$chain\",\"address\":\"$addr\"}]" 2>/dev/null || echo "[]"
}

# --- Helper: query Hyperliquid ---
hl_query() {
  local type="$1"
  curl -sf -X POST "$HL_API" \
    -H "Content-Type: application/json" \
    -d "{\"type\":\"$type\",\"user\":\"$EVM_ADDR\"}" 2>/dev/null || echo "{}"
}

# --- Collect Allium data (with 1s rate limit) ---
echo "Fetching onchain balances..." >&2

sol_raw=$(allium_balances "solana" "$SOL_ADDR")
sleep 1
eth_raw=$(allium_balances "ethereum" "$EVM_ADDR")
sleep 1
base_raw=$(allium_balances "base" "$EVM_ADDR")
sleep 1
hypervm_raw=$(allium_balances "hyperevm" "$EVM_ADDR")

# --- Collect Hyperliquid data ---
echo "Fetching Hyperliquid data..." >&2
hl_spot_raw=$(hl_query "spotClearinghouseState")
hl_perps_raw=$(hl_query "clearinghouseState")
hl_orders_raw=$(hl_query "openOrders")

# --- Process Allium balances: filter dust <$1, extract holdings ---
process_allium() {
  local chain="$1" raw="$2"
  echo "$raw" | jq -c --arg chain "$chain" '
    (if .items then .items elif type == "array" then . else [] end) |
    [ .[] |
      (.token.price // 0) as $price |
      ((.raw_balance_str // "0") | tonumber) as $raw_bal |
      (.token.decimals // 0) as $dec |
      ($raw_bal / pow(10; $dec)) as $balance |
      ($balance * $price) as $value |
      select($value >= 1) |
      {
        chain: $chain,
        token: (.token.info.symbol // .token.address // "unknown"),
        balance: ($balance | tostring),
        value_usd: ($value | . * 100 | floor | . / 100),
        price_usd: $price
      }
    ] | sort_by(-.value_usd)
  ' 2>/dev/null || echo "[]"
}

# Spam token blocklist (fake airdrops / inflated pricing)
ETH_BLOCKLIST='["0x111bb5c4157f3ec5f1967e57025ea84a924efe07"]'  # KEB spam
BASE_BLOCKLIST='["0x4206b5a3329b13fec774a576d4d2f06a6780cd22"]'  # Lordz (bad data)

# Process with chain-specific dust thresholds
# Solana: show stables (USDC/SOL) always, other tokens only if recent (2026+) and >$50
sol_holdings=$(echo "$sol_raw" | jq -c '
  (if .items then .items elif type == "array" then . else [] end) |
  [ .[] |
    (.token.info.symbol // .token.info.name // "unknown") as $sym |
    (.block_timestamp // "1970-01-01") as $ts |
    (.token.price // 0) as $price |
    ((.raw_balance_str // "0") | tonumber) as $raw_bal |
    (.token.decimals // 0) as $dec |
    ($raw_bal / pow(10; $dec)) as $balance |
    ($balance * $price) as $value |
    # Always show USDC and native SOL if >$1; other tokens must be recent and >$50
    select(
      (($sym == "USDC" or $sym == "Native SOL" or $sym == "SOL") and $value >= 1) or
      ($ts >= "2026-01-01" and $value >= 50)
    ) |
    { chain: "solana", token: $sym,
      balance: ($balance | tostring), value_usd: ($value | . * 100 | floor | . / 100), price_usd: $price }
  ] | sort_by(-.value_usd)' 2>/dev/null || echo "[]")

eth_holdings=$(echo "$eth_raw" | jq -c --argjson blocklist "$ETH_BLOCKLIST" '
  (if .items then .items elif type == "array" then . else [] end) |
  [ .[] |
    select(.token.address as $addr | ($blocklist | index($addr | ascii_downcase)) | not) |
    (.token.price // 0) as $price |
    ((.raw_balance_str // "0") | tonumber) as $raw_bal |
    (.token.decimals // 0) as $dec |
    ($raw_bal / pow(10; $dec)) as $balance |
    ($balance * $price) as $value |
    select($value >= 1) |
    { chain: "ethereum", token: (.token.info.symbol // .token.address // "unknown"),
      balance: ($balance | tostring), value_usd: ($value | . * 100 | floor | . / 100), price_usd: $price }
  ] | sort_by(-.value_usd)' 2>/dev/null || echo "[]")

base_holdings=$(echo "$base_raw" | jq -c --argjson blocklist "$BASE_BLOCKLIST" '
  (if .items then .items elif type == "array" then . else [] end) |
  [ .[] |
    select(.token.address as $addr | ($blocklist | index($addr | ascii_downcase)) | not) |
    (.token.price // 0) as $price |
    ((.raw_balance_str // "0") | tonumber) as $raw_bal |
    (.token.decimals // 0) as $dec |
    ($raw_bal / pow(10; $dec)) as $balance |
    ($balance * $price) as $value |
    select($value >= 50) |
    { chain: "base", token: (.token.info.symbol // .token.address // "unknown"),
      balance: ($balance | tostring), value_usd: ($value | . * 100 | floor | . / 100), price_usd: $price }
  ] | sort_by(-.value_usd)' 2>/dev/null || echo "[]")

hypervm_holdings=$(process_allium "hyperevm" "$hypervm_raw")

# --- Process Hyperliquid spot ---
hl_spot_holdings=$(echo "$hl_spot_raw" | jq -c '
  if .balances then
    [ .balances[] |
      select((.total | tonumber) > 0) |
      {
        token: .coin,
        balance: .total,
        value_usd: (if .coin == "USDC" then (.total | tonumber)
                     else ((.total | tonumber) * (if .coin == "HYPE" then 25 elif .coin == "PURR" then 0.5 else 1 end))
                     end)
      }
    ]
  else [] end
' 2>/dev/null || echo "[]")

# Get mid prices from Hyperliquid for spot tokens
hl_all_mids=$(curl -sf -X POST "$HL_API" \
  -H "Content-Type: application/json" \
  -d '{"type":"allMids"}' 2>/dev/null || echo "{}")

# Recalculate spot holdings with real prices
# Hyperliquid spot uses prefixed names (UBTC, UPUMP) but allMids uses unprefixed (BTC, PUMP)
hl_spot_holdings=$(echo "$hl_spot_raw" | jq -c --argjson mids "$hl_all_mids" '
  if .balances then
    [ .balances[] |
      select((.total | tonumber) > 0.001) |
      .coin as $coin | (.total | tonumber) as $bal |
      # Strip leading "U" prefix for mid lookup (UBTC->BTC, UPUMP->PUMP) but not USDC/USDH
      ($coin | if startswith("U") and . != "USDC" and . != "USDH" then .[1:] else . end) as $mid_key |
      ($mids[$mid_key] // $mids[$coin] // null) as $mid |
      {
        chain: "hyperliquid-spot",
        token: $coin,
        balance: .total,
        price_usd: (if $coin == "USDC" or $coin == "USDH" then 1 elif $mid then ($mid | tonumber) else 0 end),
        value_usd: (if $coin == "USDC" or $coin == "USDH" then $bal elif $mid then ($bal * ($mid | tonumber)) else 0 end)
      }
    ] | [ .[] | select(.value_usd >= 1) ] | sort_by(-.value_usd)
  else [] end
' 2>/dev/null || echo "[]")

# --- Process Hyperliquid perps ---
hl_perps_data=$(echo "$hl_perps_raw" | jq -c '
  {
    account_value: ((.marginSummary.accountValue // "0") | tonumber),
    total_margin_used: ((.marginSummary.totalMarginUsed // "0") | tonumber),
    positions: [
      (.assetPositions // [])[] |
      select((.position.szi | tonumber) != 0) |
      {
        coin: .position.coin,
        size: (.position.szi | tonumber),
        entry_price: (.position.entryPx | tonumber),
        unrealized_pnl: (.position.unrealizedPnl | tonumber),
        value_usd: ((.position.szi | tonumber | fabs) * (.position.entryPx | tonumber))
      }
    ]
  }
' 2>/dev/null || echo '{"account_value":0,"total_margin_used":0,"positions":[]}')

# --- Process Hyperliquid open orders ---
hl_orders_data=$(echo "$hl_orders_raw" | jq -c '
  if type == "array" then
    [ .[] | {
      coin: .coin,
      side: (if .side == "B" then "buy" else "sell" end),
      price: (.limitPx | tonumber),
      size: (.sz | tonumber),
      value_usd: ((.limitPx | tonumber) * (.sz | tonumber))
    }]
  else [] end
' 2>/dev/null || echo "[]")

# --- Calculate totals ---
sol_total=$(echo "$sol_holdings" | jq '[.[].value_usd] | add // 0')
eth_total=$(echo "$eth_holdings" | jq '[.[].value_usd] | add // 0')
base_total=$(echo "$base_holdings" | jq '[.[].value_usd] | add // 0')
hypervm_total=$(echo "$hypervm_holdings" | jq '[.[].value_usd] | add // 0')
hl_spot_total=$(echo "$hl_spot_holdings" | jq '[.[].value_usd] | add // 0')
hl_perps_value=$(echo "$hl_perps_data" | jq '.account_value')

allium_total=$(echo "$sol_total $eth_total $base_total $hypervm_total" | awk '{printf "%.2f", $1+$2+$3+$4}')
hl_total=$(echo "$hl_spot_total $hl_perps_value" | awk '{printf "%.2f", $1+$2}')
grand_total=$(echo "$allium_total $hl_total" | awk '{printf "%.2f", $1+$2}')

# --- Build JSON snapshot ---
snapshot=$(jq -n \
  --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --arg grand_total "$grand_total" \
  --argjson sol "$sol_holdings" \
  --argjson eth "$eth_holdings" \
  --argjson base "$base_holdings" \
  --argjson hypervm "$hypervm_holdings" \
  --argjson hl_spot "$hl_spot_holdings" \
  --argjson hl_perps "$hl_perps_data" \
  --argjson hl_orders "$hl_orders_data" \
  --arg sol_total "$sol_total" \
  --arg eth_total "$eth_total" \
  --arg base_total "$base_total" \
  --arg hypervm_total "$hypervm_total" \
  --arg hl_spot_total "$hl_spot_total" \
  --arg hl_perps_value "$hl_perps_value" \
  '{
    timestamp: $ts,
    total_value_usd: ($grand_total | tonumber),
    chains: {
      solana: { total_usd: ($sol_total | tonumber), holdings: $sol },
      ethereum: { total_usd: ($eth_total | tonumber), holdings: $eth },
      base: { total_usd: ($base_total | tonumber), holdings: $base },
      hyperevm: { total_usd: ($hypervm_total | tonumber), holdings: $hypervm },
      hyperliquid_spot: { total_usd: ($hl_spot_total | tonumber), holdings: $hl_spot },
      hyperliquid_perps: { account_value: ($hl_perps_value | tonumber), details: $hl_perps }
    },
    open_orders: $hl_orders
  }')

echo "$snapshot" > "$SNAPSHOT_DIR/onchain-latest.json"

# --- Output ---
if $JSON_MODE; then
  echo "$snapshot"
  exit 0
fi

# Human-readable output
fmt_usd() { printf "$%'.2f" "$1"; }

echo ""
echo "🏦 ONCHAIN PORTFOLIO"
echo "━━━━━━━━━━━━━━━━━━━━"
echo "📅 $(date -u +%Y-%m-%d\ %H:%M\ UTC)"
echo ""
echo "💰 Total Value: $(fmt_usd "$grand_total")"
echo ""

print_chain() {
  local label="$1" total="$2" holdings="$3"
  local count=$(echo "$holdings" | jq 'length')
  if (( $(echo "$total > 0" | bc -l) )); then
    echo "▸ $label: $(fmt_usd "$total")"
    echo "$holdings" | jq -r '.[] | "  • \(.token): \(.balance) (~$\(.value_usd | floor))"'
  fi
}

echo "📊 By Chain:"
print_chain "Solana" "$sol_total" "$sol_holdings"
print_chain "Ethereum" "$eth_total" "$eth_holdings"
print_chain "Base" "$base_total" "$base_holdings"
print_chain "HyperEVM" "$hypervm_total" "$hypervm_holdings"

if (( $(echo "$hl_spot_total > 0" | bc -l) )); then
  echo "▸ Hyperliquid Spot: $(fmt_usd "$hl_spot_total")"
  echo "$hl_spot_holdings" | jq -r '.[] | "  • \(.token): \(.balance) @ $\(.price_usd | floor) (~$\(.value_usd | floor))"'
fi

if (( $(echo "$hl_perps_value > 0" | bc -l) )); then
  echo "▸ Hyperliquid Perps: $(fmt_usd "$hl_perps_value")"
  positions=$(echo "$hl_perps_data" | jq '.positions | length')
  if [[ "$positions" -gt 0 ]]; then
    echo "$hl_perps_data" | jq -r '.positions[] | "  • \(.coin): \(.size) @ $\(.entry_price) (PnL: $\(.unrealized_pnl | floor))"'
  else
    echo "  • No open positions (cash)"
  fi
fi

orders_count=$(echo "$hl_orders_data" | jq 'length')
if [[ "$orders_count" -gt 0 ]]; then
  echo ""
  echo "📋 Open Orders:"
  echo "$hl_orders_data" | jq -r '.[] | "  • \(.side) \(.size) \(.coin) @ $\(.price)"'
fi

echo ""
echo "💾 Snapshot saved to snapshots/onchain-latest.json"
