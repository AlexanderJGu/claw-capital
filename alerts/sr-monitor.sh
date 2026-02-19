#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="$SCRIPT_DIR/config"
STATE_DIR="$SCRIPT_DIR/state"
SR_LEVELS="$CONFIG_DIR/sr-levels.json"
SR_STATE="$STATE_DIR/sr-state.json"
SR_OVERRIDES="$CONFIG_DIR/sr-overrides.json"

mkdir -p "$CONFIG_DIR" "$STATE_DIR"

source ~/.allium/credentials
source ~/.config/env/global.env 2>/dev/null || true

ALLIUM_API="https://api.allium.so/api/v1"
FINNHUB_API="https://finnhub.io/api/v1"
HL_API="https://api.hyperliquid.xyz/info"

NOW_UNIX=$(date +%s)
NOW_ISO=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Load watchlist
WATCHLIST_FILE="$CONFIG_DIR/watchlist.json"

# Build asset maps from watchlist (crypto)
declare -A TOKEN_ADDR
declare -A TOKEN_CHAIN
CRYPTO_ASSETS=()
EQUITIES=()
COMMODITY_ASSETS=()

if [[ -f "$WATCHLIST_FILE" ]]; then
  while IFS='|' read -r sym type chain addr finnhub_sym; do
    case "$type" in
      crypto)
        TOKEN_ADDR["$sym"]="$addr"
        TOKEN_CHAIN["$sym"]="$chain"
        CRYPTO_ASSETS+=("$sym")
        ;;
      equity)
        EQUITIES+=("${finnhub_sym:-$sym}")
        ;;
      commodity)
        # Commodities tracked via Finnhub if finnhub_symbol set
        if [[ -n "$finnhub_sym" && "$finnhub_sym" != "null" ]]; then
          EQUITIES+=("$finnhub_sym")
        fi
        COMMODITY_ASSETS+=("$sym")
        ;;
    esac
  done < <(jq -r '.assets[] | select(.sr_enabled == true) | "\(.symbol)|\(.type)|\(.chain // "")|\(.token_address // "")|\(.finnhub_symbol // "")"' "$WATCHLIST_FILE")
else
  # Fallback defaults
  TOKEN_ADDR=(["BTC"]="0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf")
  TOKEN_CHAIN=(["BTC"]="ethereum")
  CRYPTO_ASSETS=("BTC")
fi

# Rate limit helper
rate_limit() { sleep 1; }

##############################################################################
# Fetch OHLCV candles from Allium
# Args: asset, granularity (1d or 4h), lookback_days
##############################################################################
fetch_allium_candles() {
  local asset="$1" gran="$2" lookback="$3"
  local addr="${TOKEN_ADDR[$asset]}" chain="${TOKEN_CHAIN[$asset]}"
  local start_ts=$((NOW_UNIX - lookback * 86400))
  
  local body
  body=$(jq -n \
    --arg addr "$addr" \
    --arg chain "$chain" \
    --argjson start "$start_ts" \
    --argjson end "$NOW_UNIX" \
    --arg gran "$gran" \
    '{addresses: [{token_address: $addr, chain: $chain}], start_timestamp: $start, end_timestamp: $end, time_granularity: $gran}')

  curl -sf -X POST "$ALLIUM_API/developer/prices/history" \
    -H "Content-Type: application/json" \
    -H "X-API-KEY: $API_KEY" \
    -d "$body" 2>/dev/null || echo "[]"
  rate_limit
}

##############################################################################
# Fetch candles from Binance (free, no key, 4h + 1d)
# Args: asset, interval (4h or 1d), lookback_days
# Supports: BTC, ETH, SOL + any Binance-listed pair
##############################################################################
declare -A BINANCE_SYMBOL=(
  ["BTC"]="BTCUSDT"
  ["ETH"]="ETHUSDT"
  ["SOL"]="SOLUSDT"
  ["AAVE"]="AAVEUSDT"
  ["MORPHO"]="MORPHOUSDT"
  ["PENDLE"]="PENDLEUSDT"
  ["ETHFI"]="ETHFIUSDT"
  ["SKY"]="SKYUSDT"
  ["SYRUP"]="SYRUPUSDT"
)
# NOT on Binance spot (or wrong symbol): HYPE, VVV, LIT (Binance LIT = Litentry, not Lighter.xyz)
# These use Hyperliquid for current price only; S/R from Twelve Data or skip candles

fetch_binance_candles() {
  local asset="$1" interval="$2" lookback="$3"
  local symbol="${BINANCE_SYMBOL[$asset]:-}"
  [[ -z "$symbol" ]] && { echo "[]"; return; }
  
  local start_ms=$(( (NOW_UNIX - lookback * 86400) * 1000 ))
  local end_ms=$(( NOW_UNIX * 1000 ))
  local limit=1000
  
  curl -sf "https://data-api.binance.vision/api/v3/klines?symbol=${symbol}&interval=${interval}&startTime=${start_ms}&endTime=${end_ms}&limit=${limit}" 2>/dev/null || echo "[]"
  sleep 0.3
}

# Normalize Binance klines to [{high, low, open, close, timestamp}]
normalize_binance() {
  jq '
    if type == "array" and length > 0 and (.[0] | type == "array") then
      [.[] | {
        timestamp: (.[0] / 1000 | todate),
        open: (.[1] | tonumber),
        high: (.[2] | tonumber),
        low: (.[3] | tonumber),
        close: (.[4] | tonumber),
        volume: (.[5] | tonumber)
      }]
    else [] end
  '
}

##############################################################################
# Fetch candles from Twelve Data (equities, ETFs, commodities)
# Args: symbol, interval (4h or 1day), outputsize
##############################################################################
TWELVEDATA_API="https://api.twelvedata.com"

fetch_twelvedata_candles() {
  local symbol="$1" interval="$2" outputsize="$3"
  curl -sf "${TWELVEDATA_API}/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${TWELVEDATA_API_KEY}" 2>/dev/null || echo "{}"
  sleep 4  # rate limit: 8 credits/min on free tier
}

# Normalize Twelve Data to [{high, low, open, close, timestamp}]
normalize_twelvedata() {
  jq '
    if .values and (.values | type == "array") then
      [.values[] | {
        timestamp: .datetime,
        open: (.open | tonumber),
        high: (.high | tonumber),
        low: (.low | tonumber),
        close: (.close | tonumber),
        volume: ((.volume // "0") | tonumber)
      }] | reverse
    else [] end
  '
}

##############################################################################
# Fetch daily candles from Finnhub (legacy fallback)
##############################################################################
fetch_finnhub_candles() {
  local symbol="$1" lookback="$2"
  local from=$((NOW_UNIX - lookback * 86400))
  local result
  result=$(curl -sf "https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${NOW_UNIX}&token=${FINNHUB_API_KEY}" 2>/dev/null || echo "{}")
  if echo "$result" | jq -e '.error' >/dev/null 2>&1; then
    echo "{}"
  else
    echo "$result"
  fi
  sleep 0.5
}

##############################################################################
# Detect swing highs/lows from candle arrays
# Input: JSON array of {high, low, timestamp} objects on stdin
# Output: JSON array of {price, type, timestamp}
##############################################################################
detect_swings() {
  jq '
    [., length] | .[0] as $c | .[1] as $n |
    [range(1; $n-1) |
      . as $i |
      # swing high
      (if $c[$i].high > $c[$i-1].high and $c[$i].high > $c[$i+1].high
       then {price: $c[$i].high, type: "resistance", timestamp: $c[$i].timestamp}
       else empty end),
      # swing low
      (if $c[$i].low < $c[$i-1].low and $c[$i].low < $c[$i+1].low
       then {price: $c[$i].low, type: "support", timestamp: $c[$i].timestamp}
       else empty end)
    ]
  '
}

##############################################################################
# Cluster nearby levels within 1.5%
# Input: JSON array of {price, type, timestamp} on stdin
# Output: JSON array of {price, type, strength, timeframe}
##############################################################################
cluster_levels() {
  local timeframe="$1"
  jq --arg tf "$timeframe" '
    # Sort by price
    sort_by(.price) |
    # Group into clusters within 1.5%
    reduce .[] as $item ([];
      if length == 0 then [[$item]]
      else
        (last | .[0].price) as $ref |
        if (($item.price - $ref) / $ref * 100) < 1.5 and $item.type == (last | .[0].type)
        then .[:-1] + [last + [$item]]
        else . + [[$item]]
        end
      end
    ) |
    [.[] | {
      price: ([.[].price] | add / length | . * 100 | round / 100),
      type: .[0].type,
      strength: length,
      timeframe: $tf
    }]
  '
}

##############################################################################
# Process Allium response into normalized candles
##############################################################################
normalize_allium() {
  jq '
    # Allium returns {items: [{prices: [...]}]}
    (if type == "object" and .items then
      [.items[].prices[] // empty]
    elif type == "array" then .
    else []
    end) |
    [.[] | {
      high: ((.high // 0) | tonumber),
      low: ((.low // 0) | tonumber),
      open: ((.open // 0) | tonumber),
      close: ((.close // 0) | tonumber),
      price: ((.price // 0) | tonumber),
      timestamp: (.timestamp // .time // "")
    } |
    # Fix: if low is 0, use min of open/close as proxy
    if .low == 0 or .low == null then .low = ([.open, .close] | map(select(. > 0)) | min // 0) else . end |
    # Fix: if high is 0, use max of open/close
    if .high == 0 or .high == null then .high = ([.open, .close, .price] | max // 0) else . end |
    select(.high > 0 and .low > 0)
    ] | sort_by(.timestamp)
  '
}

##############################################################################
# Process Finnhub response into normalized candles
##############################################################################
normalize_finnhub() {
  jq '
    if .s == "ok" and .h and .l and .c and .t then
      [range(0; (.t | length)) | {
        high: .h[.],
        low: .l[.],
        close: .c[.],
        timestamp: (.t[.] | tostring)
      }]
    else []
    end
  '
}

##############################################################################
# Main: Detect S/R levels for all assets
##############################################################################

all_levels="{}"

# --- Crypto assets via Allium ---
for asset in "${CRYPTO_ASSETS[@]}"; do
  echo "Detecting S/R for $asset..." >&2
  
  daily_swings="[]"
  fourh_swings="[]"
  
  has_allium=false
  [[ -n "${TOKEN_ADDR[$asset]:-}" && "${TOKEN_ADDR[$asset]:-}" != "" ]] && has_allium=true
  has_binance=false
  [[ -n "${BINANCE_SYMBOL[$asset]:-}" ]] && has_binance=true
  
  # Daily candles (90 days) — prefer Binance, fall back to Allium, then Twelve Data
  if $has_binance; then
    raw=$(fetch_binance_candles "$asset" "1d" 90)
    candles=$(echo "$raw" | normalize_binance)
    src="Binance"
  elif $has_allium; then
    raw=$(fetch_allium_candles "$asset" "1d" 90)
    candles=$(echo "$raw" | normalize_allium)
    src="Allium"
  else
    # Fallback: try Twelve Data with /USD suffix
    raw=$(fetch_twelvedata_candles "${asset}/USD" "1day" 90)
    candles=$(echo "$raw" | normalize_twelvedata)
    src="TwelveData"
  fi
  cnt=$(echo "$candles" | jq 'length')
  if [[ "$cnt" -gt 3 ]]; then
    daily_swings=$(echo "$candles" | detect_swings)
  fi
  echo "  Daily: $cnt candles ($src), $(echo "$daily_swings" | jq 'length') swings" >&2
  
  # 4h candles (30 days) — prefer Binance, fall back to Allium, then Twelve Data
  if $has_binance; then
    raw=$(fetch_binance_candles "$asset" "4h" 30)
    candles=$(echo "$raw" | normalize_binance)
    src="Binance"
  elif $has_allium; then
    raw=$(fetch_allium_candles "$asset" "4h" 30)
    candles=$(echo "$raw" | normalize_allium)
    src="Allium"
  else
    raw=$(fetch_twelvedata_candles "${asset}/USD" "4h" 180)
    candles=$(echo "$raw" | normalize_twelvedata)
    src="TwelveData"
  fi
  cnt=$(echo "$candles" | jq 'length')
  if [[ "$cnt" -gt 3 ]]; then
    fourh_swings=$(echo "$candles" | detect_swings)
  fi
  echo "  4h: $cnt candles ($src), $(echo "$fourh_swings" | jq 'length') swings" >&2
  
  # Cluster daily and 4h separately
  daily_levels=$(echo "$daily_swings" | cluster_levels "daily")
  fourh_levels=$(echo "$fourh_swings" | cluster_levels "4h")
  
  # Merge
  combined=$(jq -n --argjson d "$daily_levels" --argjson f "$fourh_levels" '$d + $f | sort_by(.price)')
  
  # Determine range (strongest support and resistance)
  range_low=$(echo "$combined" | jq '[.[] | select(.type=="support")] | sort_by(-.strength) | .[0].price // null')
  range_high=$(echo "$combined" | jq '[.[] | select(.type=="resistance")] | sort_by(-.strength) | .[0].price // null')
  
  asset_data=$(jq -n \
    --argjson levels "$combined" \
    --argjson rl "$range_low" \
    --argjson rh "$range_high" \
    '{levels: $levels, range: {low: $rl, high: $rh, note: "auto-detected"}}')
  
  all_levels=$(echo "$all_levels" | jq --arg a "$asset" --argjson d "$asset_data" '. + {($a): $d}')
done

# --- Equities/ETFs/Commodities via Twelve Data ---
for symbol in "${EQUITIES[@]}"; do
  echo "Detecting S/R for $symbol..." >&2
  
  daily_swings="[]"
  fourh_swings="[]"
  
  # Daily candles (90 days)
  raw=$(fetch_twelvedata_candles "$symbol" "1day" 90)
  candles=$(echo "$raw" | normalize_twelvedata)
  cnt=$(echo "$candles" | jq 'length')
  if [[ "$cnt" -gt 3 ]]; then
    daily_swings=$(echo "$candles" | detect_swings)
  fi
  echo "  Daily: $cnt candles, $(echo "$daily_swings" | jq 'length') swings" >&2
  
  # 4h candles (30 days)
  raw=$(fetch_twelvedata_candles "$symbol" "4h" 180)
  candles=$(echo "$raw" | normalize_twelvedata)
  cnt=$(echo "$candles" | jq 'length')
  if [[ "$cnt" -gt 3 ]]; then
    fourh_swings=$(echo "$candles" | detect_swings)
  fi
  echo "  4h: $cnt candles, $(echo "$fourh_swings" | jq 'length') swings" >&2
  
  daily_levels=$(echo "$daily_swings" | cluster_levels "daily")
  fourh_levels=$(echo "$fourh_swings" | cluster_levels "4h")
  levels=$(jq -n --argjson d "$daily_levels" --argjson f "$fourh_levels" '$d + $f | sort_by(.price)')
  
  range_low=$(echo "$levels" | jq '[.[] | select(.type=="support")] | sort_by(-.strength) | .[0].price // null')
  range_high=$(echo "$levels" | jq '[.[] | select(.type=="resistance")] | sort_by(-.strength) | .[0].price // null')
  
  asset_data=$(jq -n \
    --argjson levels "$levels" \
    --argjson rl "$range_low" \
    --argjson rh "$range_high" \
    '{levels: $levels, range: {low: $rl, high: $rh, note: "auto-detected"}}')
  
  all_levels=$(echo "$all_levels" | jq --arg a "$symbol" --argjson d "$asset_data" '. + {($a): $d}')
done

##############################################################################
# Merge overrides (override takes priority)
##############################################################################
if [[ -f "$SR_OVERRIDES" ]]; then
  echo "Merging manual overrides..." >&2
  overrides=$(cat "$SR_OVERRIDES")
  
  for asset in $(echo "$overrides" | jq -r 'keys[]'); do
    override_levels=$(echo "$overrides" | jq --arg a "$asset" '.[$a]')
    existing=$(echo "$all_levels" | jq --arg a "$asset" '.[$a].levels // []')
    
    # Remove auto-detected levels that are within 2% of any override level, then add overrides
    merged=$(jq -n --argjson auto "$existing" --argjson over "$override_levels" '
      ($over | [.[].price]) as $op |
      [$auto[] | select(
        . as $l | [$op[] | select((. - $l.price) / . * 100 | fabs < 2)] | length == 0
      )] + $over | sort_by(.price)
    ')
    
    all_levels=$(echo "$all_levels" | jq --arg a "$asset" --argjson l "$merged" '
      .[$a].levels = $l |
      .[$a].range.low = ([($l[] | select(.type=="support") | .price)] | sort | first // null) |
      .[$a].range.high = ([($l[] | select(.type=="resistance") | .price)] | sort | last // null)
    ')
  done
fi

# Save S/R levels
jq -n --arg ts "$NOW_ISO" --argjson assets "$all_levels" \
  '{last_updated: $ts, assets: $assets}' > "$SR_LEVELS"

echo "S/R levels saved to $SR_LEVELS" >&2

##############################################################################
# Structure Break Detection
##############################################################################

# Get current prices
# Crypto from Hyperliquid
hl_mids=$(curl -sf -X POST "$HL_API" -H "Content-Type: application/json" \
  -d '{"type":"allMids"}' 2>/dev/null || echo "{}")

declare -A CURRENT_PRICES

# Crypto from Hyperliquid mids
for asset in "${CRYPTO_ASSETS[@]}"; do
  CURRENT_PRICES["$asset"]=$(echo "$hl_mids" | jq -r --arg a "$asset" '.[$a] // "0"' | tr -d '"')
done

# Equities + commodities from Finnhub
for symbol in "${EQUITIES[@]}"; do
  price=$(curl -sf "https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}" 2>/dev/null | jq '.c // 0' || echo "0")
  CURRENT_PRICES["$symbol"]="$price"
  sleep 0.3
done

# Load previous state
prev_state="{}"
[[ -f "$SR_STATE" ]] && prev_state=$(cat "$SR_STATE")

alerts=""
new_state=$(jq -n --arg ts "$NOW_ISO" '{last_check: $ts, alerted_breaks: {}}')

# First run detection — if no previous state, seed state without alerting
FIRST_RUN=false
if [[ "$prev_state" == "{}" ]] || ! echo "$prev_state" | jq -e '.last_check' >/dev/null 2>&1; then
  FIRST_RUN=true
  echo "First run — seeding state, no alerts will fire" >&2
fi

# Copy previous alerted breaks
prev_breaks=$(echo "$prev_state" | jq '.alerted_breaks // {}')

# Check each asset — use jq for break detection to avoid slow bash loops
levels_data=$(cat "$SR_LEVELS")

# Build current prices as JSON dynamically from all tracked assets
prices_json="{"
first=true
for key in "${!CURRENT_PRICES[@]}"; do
  val="${CURRENT_PRICES[$key]:-0}"
  $first || prices_json+=","
  prices_json+="\"$key\":$val"
  first=false
done
prices_json+="}"

# Detect all breaks in one jq call
break_results=$(jq -n \
  --argjson levels "$levels_data" \
  --argjson prices "$prices_json" \
  --argjson prev "$prev_breaks" \
  --arg now "$NOW_ISO" '
  $levels.assets | to_entries | map(
    .key as $asset |
    ($prices[$asset] // 0) as $price |
    .value.levels as $lvls |
    select($price > 0 and ($lvls | length) > 0) |
    {
      asset: $asset,
      price: $price,
      breaks: [
        $lvls[] |
        . as $l |
        ($asset + "_" + .type + "_" + (.price | tostring)) as $key |
        if .type == "resistance" and $price > (.price * 1.01) and .strength >= 3 then
          {key: $key, level: ., desc: "breakout above", new: ($prev[$key] == null)}
        elif .type == "support" and $price < (.price * 0.99) and .strength >= 3 then
          {key: $key, level: ., desc: "close below", new: ($prev[$key] == null)}
        else empty
        end
      ],
      next_support: ([$lvls[] | select(.type=="support" and .price < $price)] | sort_by(-.price) | .[0]),
      next_resist: ([$lvls[] | select(.type=="resistance" and .price > $price)] | sort_by(.price) | .[0])
    }
  )
')

# Update state with all breaks
new_state=$(echo "$break_results" | jq --arg now "$NOW_ISO" '
  reduce (.[] | .breaks[]) as $b (
    {last_check: $now, alerted_breaks: {}};
    .alerted_breaks[$b.key] = $now
  )
')

# Also carry forward previous breaks that still hold
new_state=$(jq -n --argjson ns "$new_state" --argjson pb "$prev_breaks" '
  $ns | .alerted_breaks = ($pb + .alerted_breaks)
')

# Format alerts for new breaks only (skip on first run — just seed state)
if $FIRST_RUN; then
  alerts=""
else
alerts=$(echo "$break_results" | jq -r '
  [.[] | select(.breaks | any(.new)) |
    . as $r |
    .breaks[] | select(.new) |
    "🔔 STRUCTURE BREAK\n\n📊 " + $r.asset + " — " + .desc + " $" + (.level.price | floor | tostring) + " " + .level.type +
    "\n  • Current: $" + ($r.price | floor | tostring) +
    "\n  • Level strength: " + (.level.strength | tostring) + " touches (" + .level.timeframe + ")" +
    (if $r.next_support or $r.next_resist then
      "\n\nKey levels:" +
      (if $r.next_support then "\n  • Next support: $" + ($r.next_support.price | floor | tostring) + " (" + ($r.next_support.strength | tostring) + " touches)" else "" end) +
      (if $r.next_resist then "\n  • Resistance: $" + ($r.next_resist.price | floor | tostring) + " (" + ($r.next_resist.strength | tostring) + " touches)" else "" end)
    else "" end)
  ] | join("\n---\n")
')
fi  # end FIRST_RUN check

# Save state
echo "$new_state" > "$SR_STATE"

# Output alerts (or summary if no breaks)
if [[ -n "$alerts" ]] && [[ "$alerts" != "" ]]; then
  echo -e "$alerts"
else
  echo "📊 S/R Monitor — No structure breaks detected"
  echo ""
  all_symbols=("${CRYPTO_ASSETS[@]}" "${EQUITIES[@]}" "${COMMODITY_ASSETS[@]}")
  for asset in "${all_symbols[@]}"; do
    price="${CURRENT_PRICES[$asset]:-0}"
    [[ "$price" == "0" ]] && continue
    n=$(echo "$levels_data" | jq --arg a "$asset" '.assets[$a].levels | length // 0')
    range_lo=$(echo "$levels_data" | jq -r --arg a "$asset" '.assets[$a].range.low // "—"')
    range_hi=$(echo "$levels_data" | jq -r --arg a "$asset" '.assets[$a].range.high // "—"')
    echo "  $asset: \$$(printf '%0.0f' "$price") | $n levels | range \$${range_lo}–\$${range_hi}"
  done
fi
