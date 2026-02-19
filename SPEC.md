# ClawCapital — Personal Trading Signal System

> **Owner:** Alex
> **Version:** 0.1.0
> **Created:** 2026-02-12
> **Status:** Spec / Pre-build

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Signal Layers](#signal-layers)
4. [Portfolio Monitoring](#portfolio-monitoring)
5. [Ticker Discovery Engine](#ticker-discovery-engine)
6. [Alert Format](#alert-format)
7. [Cron Schedule](#cron-schedule)
8. [Data Sources & Tools](#data-sources--tools)
9. [Smart Money List](#smart-money-list)
10. [Output Structure](#output-structure)
11. [Build Phases](#build-phases)
12. [Out of Scope](#out-of-scope)

---

## Overview

ClawCapital is an automated trading signal system that reduces Alex's manual monitoring time across crypto, equities, and commodities. It ingests data from onchain sources, market feeds, and social platforms to surface high-conviction signals — prioritizing volume anomalies that haven't yet reached social consensus.

**Core thesis:** The highest-alpha signals come from detecting unusual accumulation or flow *before* Crypto Twitter and FinTwit start talking about it. By the time everyone's posting, you're late.

**Design principles:**
- Signal-to-noise ratio over coverage breadth
- Quiet volume > loud volume
- Data validates narrative, not the other way around
- Surface 1-3 actionable items per cycle, not 50 tickers
- No trade execution — decision layer only

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   ORACLE (Main Agent)            │
│         Coordinates all scanning + alerts        │
│              Runs in main session                 │
└──────────┬──────────┬──────────┬────────────────┘
           │          │          │
     ┌─────▼───┐ ┌────▼────┐ ┌──▼──────────┐
     │ Volume  │ │ Social  │ │ Portfolio   │
     │ Scanner │ │ Scanner │ │ Monitor     │
     │ (cron)  │ │ (cron)  │ │ (cron)      │
     └────┬────┘ └────┬────┘ └──┬──────────┘
          │           │          │
          ▼           ▼          ▼
    ┌─────────────────────────────────────┐
    │        Telegram Delivery            │
    │   (Alerts to Alex's main chat)      │
    └─────────────────────────────────────┘
```

### Components

| Component | Type | Role |
|-----------|------|------|
| **Oracle** | Main agent session | Coordinates sub-agents, handles on-demand queries, maintains state |
| **Volume Scanner** | Cron sub-agent (hourly) | Queries Allium + Finnhub for flow anomalies, cross-references social silence |
| **Social Scanner** | Cron sub-agent (2h) | Monitors X/Twitter via x-research for mention velocity changes |
| **Portfolio Monitor** | Cron sub-agent (4h) | Pulls live prices for held positions, flags significant moves |
| **S/R Monitor** | Cron sub-agent (6h) | Checks price proximity to key structural levels on mature assets |
| **Discovery Engine** | Integrated into Volume + Social scanners | Synthesizes cross-layer signals into ticker recommendations |

### Data Flow

1. Cron sub-agents run independently on schedule
2. Each scanner writes results to `signals/` as timestamped JSON
3. If a signal crosses the alert threshold, sub-agent delivers directly via Telegram
4. Oracle reads signal files during main session for context and follow-up
5. Alex can query Oracle ad-hoc: "what's moving?", "check $TICKER", "exposure snapshot"

### State Management

- **Portfolio:** `projects/claw-capital/portfolio.json` (synced from Google Sheet or manually maintained)
- **Signal history:** `signals/YYYY-MM-DD/` — daily directories with JSON signal files
- **Smart money list:** `projects/claw-capital/smart-money.json`
- **S/R levels cache:** `projects/claw-capital/sr-levels.json`
- **Scan state:** `projects/claw-capital/scan-state.json` (last scan timestamps, dedup hashes)

---

## Signal Layers

Signals are ranked by alpha potential. Layer 1 signals are the money — everything else is supporting evidence or timing refinement.

### Layer 1: Volume/Flow Anomalies WITHOUT Social Buzz ⭐

**Priority:** Highest — this is where the edge lives.

**Logic:** Detect unusual accumulation, whale wallet loading, or DEX volume spikes on assets that have LOW or ZERO social mention growth. The divergence between on-chain activity and social silence is the signal.

**What to detect:**

| Signal | Source | Threshold |
|--------|--------|-----------|
| DEX volume spike | Allium (DEX trades table) | >3x 7-day avg daily volume |
| Whale wallet accumulation | Allium (token transfers) | Top-100 wallets increasing position >10% in 24h |
| CEX inflow/outflow anomaly | Allium (exchange flows) | Net outflow >2x monthly avg (accumulation signal) |
| Equity volume spike | Finnhub (quote endpoint) | >2.5x 20-day avg volume |
| Unusual options activity | Future data source | — |

**Social silence check (required):**
- Query x-research for asset mentions in last 24h
- Compare to 7-day rolling average mention count
- Signal is VALID only if social mentions are ≤1.2x average (flat or declining)
- If social is also spiking → reclassify as Layer 3 (late/timing signal)

**Investigation step:**
When a Layer 1 signal fires, the sub-agent must attempt to determine WHY:
- Check for upcoming governance votes (snapshot.org, tally.xyz)
- Check for token unlocks / vesting events
- Check for recent contract deployments or protocol upgrades
- Check Finnhub news for equity catalysts
- If no catalyst found, flag as "unexplained accumulation" (still valid, sometimes the best kind)

**Output:** Signal file + Telegram alert if conviction score ≥ 7/10.

---

### Layer 2: Thesis Validation

**Priority:** Secondary — confirms or denies a directional view before it becomes consensus.

**Two modes:**

#### A) Alex-initiated thesis
Alex tells the system: *"I think RWA tokens will run because BlackRock is expanding tokenization."*

The system then:
1. Identifies relevant tickers in the RWA narrative (ONDO, MKR, CPOOL, etc.)
2. Pulls onchain data for each: TVL trends, wallet growth, volume trajectory
3. Checks social mentions — is CT already talking about this?
4. Scores the thesis: **Strong data + low social = best entry** vs **Strong data + high social = late**
5. Stores thesis in `research/theses/` with periodic re-evaluation

#### B) System-detected narrative
The Volume Scanner detects correlated volume spikes across multiple assets that share a theme:
- 3+ DeFi tokens spiking volume simultaneously → "DeFi rotation" narrative
- Multiple AI tokens accumulating → "AI narrative forming"

System surfaces the pattern and asks Alex if he wants to track it as a thesis.

**Thesis scoring matrix:**

| Onchain Data | Social Mentions | Score | Action |
|-------------|----------------|-------|--------|
| Strong ↑ | Low/flat | 🟢 Best entry | Alert immediately |
| Strong ↑ | Rising | 🟡 Good but getting crowded | Alert with caution |
| Strong ↑ | High | 🔴 Late | Alert as exit timing |
| Weak/flat | Rising | ⚪ Noise | Ignore |

---

### Layer 3: Social Acceleration

**Priority:** Tertiary — primarily a timing and exit signal, not an entry signal.

**Data source:** x-research skill (Twitter/X search + profile monitoring)

**Key metric: Rate of mention GROWTH, not absolute volume.**

The system tracks:
- Mention count per asset per 6h window
- Rolling 7-day average mention count
- **Growth rate** = (current window) / (7-day avg window)
- **Acceleration** = change in growth rate between consecutive windows

**Smart money weighting:**
- Accounts in `smart-money.json` → mentions weighted **10x**
- Accounts with >50k followers + crypto/finance bio → **3x**
- Random accounts → **1x**
- Known shill/paid promo accounts → **0x** (filtered out)

**Signal interpretation:**

| Social Growth | Volume | Interpretation | Action |
|--------------|--------|----------------|--------|
| High ↑↑ | High ↑↑ | 🔴 Late / Exit signal | Alert: "CT is on this, consider trimming" |
| High ↑↑ | Low/flat | ⚪ Noise / vapor | Ignore |
| Low/flat | High ↑↑ | 🟢 **Layer 1 signal** | Re-route to Layer 1 processing |
| Smart money ↑ | Any | 🟡 Early attention | Flag for monitoring |

**Special tracking:**
- If a smart money account mentions an asset for the FIRST TIME → immediate flag regardless of other metrics
- Track "mention chains" — when smart money A mentions something, then B mentions it 2h later, then C — this is the acceleration pattern

---

### Layer 4: S/R and Structural Analysis

**Priority:** Supporting context — adds conviction to other signals, not standalone.

**Scope: Mature assets ONLY**
- ✅ BTC, ETH, SOL, major L1s
- ✅ SPY, QQQ, major equities, individual large-caps
- ✅ Gold, oil, DXY
- ✅ Cross-asset ratios: BTC/GOLD, ETH/BTC, SPX/GOLD
- ❌ Memecoins < 30 days old
- ❌ Micro-cap tokens < $10M mcap
- ❌ Recently launched tokens with insufficient price history

**Method:**
1. Pull OHLCV candles from Allium (crypto) / Finnhub (equities)
2. Identify swing highs and swing lows on daily + 4h timeframes
3. Cluster nearby levels (within 1.5% of each other) into S/R zones
4. Track number of touches per zone (more touches = stronger)
5. Store in `sr-levels.json` with last-updated timestamp

**Alert triggers:**
- Price within 2% of a strong S/R zone (≥3 touches) AND another signal layer is active
- Price breaks through a key level with volume confirmation
- Cross-asset ratio hits an extreme (e.g., BTC/GOLD at multi-year high/low)

**Update frequency:** Every 6 hours for crypto, daily for equities/commodities.

---

## Portfolio Monitoring

### Position Tracking

**Source:** `projects/claw-capital/portfolio.json`

Format:
```json
{
  "positions": [
    {
      "asset": "BTC",
      "type": "crypto",
      "chain": "bitcoin",
      "quantity": 1.5,
      "avgEntry": 42000,
      "entryDate": "2025-12-15",
      "tags": ["core", "long-term"]
    },
    {
      "asset": "AAPL",
      "type": "equity",
      "exchange": "NASDAQ",
      "quantity": 100,
      "avgEntry": 185.50,
      "entryDate": "2026-01-10",
      "tags": ["swing"]
    }
  ],
  "lastUpdated": "2026-02-12T00:00:00Z"
}
```

Can also sync from a Google Sheet (URL stored in config). Manual file takes precedence if both exist.

### Price Monitoring

- **Crypto:** Allium API → latest prices by token symbol
- **Equities:** Finnhub API → `/quote` endpoint
- Prices cached per scan cycle to avoid redundant API calls

### Alerts

| Trigger | Threshold | Alert Level |
|---------|-----------|-------------|
| Position up significantly | >8% in 24h | 🟡 Info |
| Position down significantly | >8% in 24h | 🔴 Warning |
| Position hits S/R level | Within 2% of key level | 🟡 Info |
| Portfolio-wide drawdown | >5% total in 24h | 🔴 Warning |
| New ATH on held position | Price > all-time high | 🟢 Info |

### On-Demand Commands

Alex can ask Oracle at any time:
- `exposure` → Full portfolio snapshot with current prices, P&L, allocation %
- `check $TICKER` → Pull current price, volume, social, S/R context for any asset
- `what's moving?` → Summary of biggest movers across all positions

---

## Ticker Discovery Engine

The discovery engine synthesizes signals across all layers to surface NEW tickers Alex should pay attention to. It runs as part of the Volume and Social scanners.

### Discovery Pipeline

```
Step 1: SCAN
  Volume Scanner finds assets with unusual activity
  ↓
Step 2: FILTER
  Remove known scams, rugs, <$50k liquidity, paid promos
  ↓
Step 3: CROSS-REFERENCE
  Check social mentions — is anyone talking about this?
  Low social = higher priority
  ↓
Step 4: CLUSTER
  Group related discoveries into narratives
  "3 AI tokens spiking" > "1 random token spiking"
  ↓
Step 5: RANK
  Score by: volume anomaly strength × social silence × liquidity × narrative fit
  ↓
Step 6: SURFACE
  Top 1-3 discoveries per scan cycle only
  Include reasoning and supporting data
```

### Narrative Clustering

Don't just find individual tickers — detect THEMES forming:
- Multiple tokens in same sector spiking → narrative rotation
- Volume across a specific chain (e.g., all Sui tokens) → ecosystem play
- Correlated moves in seemingly unrelated assets → macro theme

Store detected narratives in `research/narratives/` with constituent tickers and evidence.

### Negative Filters

Automatically discard:
- Tokens with <$50k DEX liquidity
- Tokens launched <24h ago with no verifiable contract
- Assets flagged by community scam databases
- Tickers that only appear in known paid promo accounts
- Obvious pump-and-dump patterns (>500% spike with concentrated wallet activity)

### Output Cap

**Maximum 3 discoveries per scan cycle.** If more qualify, rank by conviction score and only surface the top 3. Alex doesn't need 50 tickers — he needs the right 3.

---

## Alert Format

Every alert delivered via Telegram follows this structure:

```
━━━━━━━━━━━━━━━━━━━━━
🔔 CLAWCAPITAL SIGNAL
━━━━━━━━━━━━━━━━━━━━━

📊 Asset: $ONDO (Ethereum)
⚡ Signal: Layer 1 — Volume Anomaly (Silent)
📈 Source: DEX volume 4.2x 7-day avg

📋 Supporting Data:
  • 24h DEX vol: $18.2M (avg: $4.3M)
  • Social mentions: 12 (avg: 15) — FLAT ✓
  • Top wallet accumulation: +$2.1M net inflow
  • Possible catalyst: RWA narrative + BlackRock news

📐 S/R Context:
  • Nearest resistance: $1.85 (tested 4x)
  • Nearest support: $1.42 (tested 3x)
  • Current: $1.61

💼 Exposure: 0 (not held)

💡 Suggested: Research for entry. Volume without social = early.
  Conviction: 8/10

━━━━━━━━━━━━━━━━━━━━━
```

### Alert fields (all required):

| Field | Description |
|-------|-------------|
| **Asset** | Symbol + chain or exchange |
| **Signal** | Layer number + type |
| **Source** | What triggered it (specific data point) |
| **Supporting Data** | Volume, social stats, onchain metrics |
| **S/R Context** | Key levels (if applicable for asset type; omit for micro-caps) |
| **Exposure** | Current position size, or "not held" |
| **Suggested** | Actionable next step + conviction score (1-10) |

### Conviction Scoring

| Score | Meaning |
|-------|---------|
| 9-10 | Multiple layers aligned, strong data, clear catalyst |
| 7-8 | Single strong layer signal, solid data |
| 5-6 | Interesting but incomplete picture |
| 1-4 | Noise, don't alert (internal logging only) |

**Alert threshold: ≥ 7 for Telegram delivery.** Scores 5-6 logged to `signals/` for Oracle context but no push notification.

---

## Cron Schedule

| Job | Frequency | Sub-agent Model | Think Level | Description |
|-----|-----------|-----------------|-------------|-------------|
| `volume-scan` | Every 1 hour | claude-sonnet | low | Query Allium + Finnhub for volume anomalies, cross-ref social |
| `social-scan` | Every 2 hours | claude-sonnet | low | Monitor X/Twitter mention velocity via x-research |
| `portfolio-check` | Every 4 hours | claude-haiku | off | Pull prices for held positions, flag significant moves |
| `sr-monitor` | Every 6 hours (crypto) / daily (equities) | claude-sonnet | low | Update S/R levels, check proximity alerts |

### Cron Definitions

```bash
# Volume/flow anomaly scan — hourly
openclaw cron add --name "cc-volume-scan" \
  --schedule "0 * * * *" \
  --prompt "Run ClawCapital volume scan. Read projects/claw-capital/SPEC.md Layer 1 section. Query Allium for crypto volume anomalies and Finnhub for equity volume spikes. Cross-reference with social silence via x-research. Write results to signals/. Alert via Telegram if conviction ≥ 7." \
  --channel telegram

# Social acceleration scan — every 2 hours
openclaw cron add --name "cc-social-scan" \
  --schedule "0 */2 * * *" \
  --prompt "Run ClawCapital social scan. Read projects/claw-capital/SPEC.md Layer 3 section. Use x-research to check mention velocity for watchlist + trending assets. Weight smart money accounts 10x. Write results to signals/. Alert if smart money first-mention detected." \
  --channel telegram

# Portfolio price check — every 4 hours
openclaw cron add --name "cc-portfolio-check" \
  --schedule "0 */4 * * *" \
  --prompt "Run ClawCapital portfolio check. Read projects/claw-capital/portfolio.json. Pull live prices via Allium (crypto) and Finnhub (equities). Alert if any position moved >8% in 24h or portfolio drawdown >5%." \
  --channel telegram

# S/R level monitoring — every 6 hours
openclaw cron add --name "cc-sr-monitor" \
  --schedule "0 */6 * * *" \
  --prompt "Run ClawCapital S/R monitor. Read projects/claw-capital/sr-levels.json. Update levels for mature assets using Allium and Finnhub OHLCV data. Alert if price within 2% of strong level AND another signal is active." \
  --channel telegram
```

---

## Data Sources & Tools

### Allium API (Crypto)

- **Credentials:** `~/.allium/credentials`
- **Capabilities:** Token prices, wallet balances, transaction history, DEX trades, custom SQL queries
- **Use for:** Crypto prices, volume data, whale tracking, onchain flow analysis
- **Key queries:**
  - DEX volume by token (last 24h vs 7-day avg)
  - Top wallet balance changes by token
  - Exchange net flow (inflow - outflow)
  - Token transfer volume and unique addresses

### Finnhub API (Equities + Commodities)

- **API Key:** `~/.config/env/global.env` → `FINNHUB_API_KEY`
- **Capabilities:** Stock quotes, candles, company news, financials, market status
- **Use for:** Equity prices, volume data, OHLCV candles, news catalysts
- **Key endpoints:**
  - `/quote` — real-time price + volume
  - `/stock/candle` — OHLCV history
  - `/company-news` — recent news for catalyst identification
  - `/stock/metric` — fundamentals for context

### X Research (Social/Twitter)

- **Bearer Token:** `~/.config/env/global.env` → `X_BEARER_TOKEN`
- **CLI:** `skills/x-research/`
- **Capabilities:** Search tweets, monitor profiles, track mention counts
- **Use for:** Social mention velocity, smart money tracking, sentiment
- **Key operations:**
  - Search for $TICKER mentions in time windows
  - Monitor smart money account activity
  - Track mention growth rate over rolling windows

---

## Smart Money List

Stored at `projects/claw-capital/smart-money.json`:

```json
{
  "accounts": [
    {
      "handle": "@example_trader",
      "weight": 10,
      "notes": "Consistently early on DeFi plays",
      "added": "2026-02-12"
    }
  ],
  "lastUpdated": "2026-02-12"
}
```

**Placeholder — Alex to populate with 10-20 trusted accounts.**

Criteria for inclusion:
- Track record of being early (mentioned assets before major moves)
- Not a paid promoter
- Genuine trader/analyst, not an influencer farming engagement
- Covers Alex's focus areas (crypto, equities, macro)

These accounts receive **10x weighting** in all social signal calculations.

---

## Output Structure

```
projects/claw-capital/
├── SPEC.md                    # This document
├── portfolio.json             # Current positions
├── smart-money.json           # Trusted Twitter accounts
├── sr-levels.json             # Cached S/R levels for mature assets
├── scan-state.json            # Last scan timestamps, dedup state
├── config.json                # Thresholds, alert settings
│
signals/
├── 2026-02-12/
│   ├── volume-scan-1400.json  # Hourly volume scan results
│   ├── social-scan-1400.json  # Social scan results
│   └── portfolio-1600.json    # Portfolio check results
│
research/
├── theses/
│   └── rwa-tokenization.md    # Tracked thesis with validation data
├── narratives/
│   └── ai-tokens-rotation.md  # Detected narrative cluster
│
reports/
├── daily/
│   └── 2026-02-12.md          # Daily summary (generated end of day)
└── weekly/
    └── 2026-W07.md            # Weekly recap
```

---

## Build Phases

### Phase 1: Foundation (Week 1)
- [ ] Create `portfolio.json` with Alex's current positions
- [ ] Create `smart-money.json` with initial account list
- [ ] Set up Allium API queries (test: pull BTC price, DEX volumes)
- [ ] Set up Finnhub API queries (test: pull AAPL quote, candles)
- [ ] Set up x-research queries (test: search $BTC mentions, count)
- [ ] Build alert formatting function (Telegram message template)

### Phase 2: Volume Scanner (Week 2)
- [ ] Implement Allium volume anomaly detection (DEX volume vs 7-day avg)
- [ ] Implement Finnhub equity volume anomaly detection
- [ ] Implement social silence cross-reference
- [ ] Implement catalyst investigation logic
- [ ] Set up `cc-volume-scan` cron job
- [ ] Test end-to-end: anomaly → cross-ref → alert

### Phase 3: Social Scanner (Week 2-3)
- [ ] Implement mention velocity tracking via x-research
- [ ] Implement smart money weighting
- [ ] Implement mention growth rate calculation
- [ ] Implement first-mention detection for smart money accounts
- [ ] Set up `cc-social-scan` cron job

### Phase 4: Portfolio Monitor (Week 3)
- [ ] Implement price fetching for all held positions
- [ ] Implement P&L calculation and exposure snapshot
- [ ] Implement move-based alerting (>8% threshold)
- [ ] Implement on-demand commands (exposure, check, what's moving)
- [ ] Set up `cc-portfolio-check` cron job

### Phase 5: S/R Analysis (Week 3-4)
- [ ] Implement swing high/low identification on OHLCV data
- [ ] Implement level clustering algorithm
- [ ] Implement `sr-levels.json` cache with update logic
- [ ] Implement proximity alerts combined with other signal layers
- [ ] Set up `cc-sr-monitor` cron job

### Phase 6: Discovery Engine + Polish (Week 4)
- [ ] Implement narrative clustering logic
- [ ] Implement negative filtering (scam, low liquidity, promo)
- [ ] Implement discovery ranking and output cap (top 3)
- [ ] Implement thesis tracking (manual + auto-detected)
- [ ] Build daily/weekly report generation
- [ ] End-to-end testing across all layers

---

## Out of Scope (Future)

| Feature | Status | Notes |
|---------|--------|-------|
| Trade execution | ❌ Not planned | No wallet/broker access. Decision layer only. |
| Discord/Telegram group monitoring | 🔮 Future | Would add paid alpha group signals |
| Options flow data | 🔮 Future | Needs data provider (Unusual Whales, etc.) |
| Automated position sizing | ❌ Not planned | Alex sizes manually |
| Backtesting framework | 🔮 Future | Validate signal quality over historical data |
| Multi-user support | ❌ Not planned | Personal system for Alex only |

---

## Appendix: Key Decisions

1. **Why volume before social?** By the time CT is talking, the move is 30-70% done. Onchain doesn't lie and doesn't have a marketing budget.

2. **Why cap discoveries at 3?** Decision fatigue kills traders. Better to deeply research 3 high-conviction ideas than skim 30 maybes.

3. **Why no execution?** Separation of concerns. The system finds signals; Alex decides and executes. Keeps risk management human.

4. **Why weight smart money 10x?** A handful of accounts with real edge are worth more than 10,000 random CT posters. Signal density matters.

5. **Why exclude fresh memecoins from S/R?** A token that's 5 days old has no meaningful price structure. S/R analysis on it is astrology. Volume and social layers handle memecoins.
