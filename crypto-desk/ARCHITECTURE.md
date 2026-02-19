# Claw Capital Crypto Desk — Architecture

> **Version:** 1.0.0
> **Created:** 2026-02-18
> **Author:** Oracle (Main Agent)
> **Status:** Blueprint — ready to build
> **Scope:** Crypto assets only. Equities/commodities remain in the broader ClawCapital system.

---

## Table of Contents

1. [Macro Regime Layer](#1-macro-regime-layer) ← **Gates all decisions**
2. [Mission](#2-mission)
3. [Agent Specifications](#3-agent-specifications)
4. [Signal Schema](#4-signal-schema)
5. [Thesis Template](#5-thesis-template)
6. [Coverage Universe](#6-coverage-universe)
7. [Workflows](#7-workflows)
8. [Inter-Agent Communication Protocol](#8-inter-agent-communication-protocol)
9. [Data Sources — Unified Inventory](#9-data-sources)
10. [Quality Control — Thesis Accuracy Tracking](#10-quality-control)
11. [Autonomous Asset Discovery](#11-autonomous-asset-discovery)
12. [File Structure](#12-file-structure)
13. [Implementation Plan](#13-implementation-plan)
14. [Appendix: Design Decisions](#appendix-design-decisions)

---

## 1. Macro Regime Layer

**The regime layer sits ABOVE all other agents. It gates every decision the desk makes.**

No thesis is written, no discovery scan runs, no position is entered without first checking: **what regime are we in?**

### 1.1 Regime Definitions

| Regime | Description | Desk Behavior |
|--------|-------------|---------------|
| **Accumulation** | BTC in lower risk bands, post-capitulation, macro turning supportive | Discovery engine most active. New buy theses encouraged. DCA plans activated. Maximum aggression on high-conviction entries. |
| **Early Bull** | BTC breaking above key MAs, risk bands expanding, dominance peaking | Selective new positions. Rotate focus from BTC to quality alts. Theses written for alt positions. |
| **Mid Bull** | BTC in fair value bands, alts starting to run, narrative rotation accelerating | Only highest conviction new positions. Start defining exit levels. Tighten stops on existing positions. |
| **Euphoria** | BTC in upper risk bands, retail influx, "this time is different" narratives | **NO new buy theses.** Focus entirely on exit planning and profit-taking. Discovery engine paused. Risk Manager authority maximized. |
| **Distribution** | BTC failing at highs, divergences forming, smart money exiting | Active exit execution. No new entries. Reduce exposure systematically. |
| **Bear** | BTC below 200W SMA or equivalent, capitulation events, extended downtrend | Accumulation watchlist only. DCA into cycle lows for highest conviction assets. Build thesis pipeline for next cycle. Content creation focus (bear market = build in public). |

### 1.2 Regime Indicators

The regime is determined by a composite of indicators, weighted by reliability:

**Primary Indicators (highest weight):**

| Indicator | Source | What It Tells Us | How to Get It |
|-----------|--------|-----------------|---------------|
| BTC Log Regression Risk Band | ITC dashboard / calculated | Where BTC is relative to long-term fair value (0-1 scale) | ITC premium app or calculate from BTC price history |
| BTC 200-Week SMA | Calculated | Bull/bear regime binary — price above = bull, below = bear | Simple calculation from Allium/price data |
| Federal Funds Rate + direction | FRED / web search | Monetary tightening (risk-off) vs easing (risk-on) | Web fetch from FRED or macro news |

**Secondary Indicators:**

| Indicator | Source | What It Tells Us |
|-----------|--------|-----------------|
| BTC Dominance | CoinGecko global data | Cycle positioning — rising = BTC season, falling = alt season |
| Total Crypto Market Cap | CoinGecko global data | Overall risk appetite |
| ETH/BTC Ratio | Price data | Alt appetite — rising ETH/BTC = risk-on for alts |
| Stablecoin Market Cap | DeFiLlama | Dry powder — growing stablecoin supply = capital waiting to deploy |
| Funding Rates (aggregate) | Hyperliquid API | Market leverage — extreme positive = overheated, negative = capitulation |

**Qualitative Inputs (from ITC / Benjamin Cowen):**

| Input | Source | How We Access It |
|-------|--------|-----------------|
| Cycle fractal analysis | ITC YouTube (public) + premium videos | Transcript extraction from public videos; manual input from premium |
| Monetary policy → BTC mapping | ITC YouTube + premium dashboard | Same |
| Risk metric updates | ITC premium dashboard | Browser access to app.intothecryptoverse.com |
| Macro recession probability | ITC premium tool | Browser access |

### 1.3 Regime Determination Process

**Frequency:** Monthly formal review + ad-hoc when primary indicators shift significantly.

**Who determines it:** Oracle, with input from:
- Quantitative indicators (calculated automatically by Sentinel)
- ITC qualitative analysis (extracted from Cowen's content)
- Alex's override (human judgment always trumps)

**Output:** A regime file updated at `coverage/regime.json`:

```json
{
  "current_regime": "bear",
  "confidence": "high",
  "last_updated": "2026-02-18",
  "determined_by": "oracle",
  "primary_indicators": {
    "btc_log_regression_band": {
      "value": 0.18,
      "interpretation": "Lower risk bands — accumulation territory",
      "source": "ITC dashboard",
      "as_of": "2026-02-18"
    },
    "btc_vs_200w_sma": {
      "btc_price": 66278,
      "sma_200w": 52000,
      "ratio": 1.27,
      "interpretation": "Above 200W SMA but declining — transitional",
      "source": "calculated",
      "as_of": "2026-02-18"
    },
    "fed_funds_rate": {
      "value": 4.50,
      "direction": "cutting",
      "interpretation": "Easing cycle begun — supportive for risk assets on 6-12 month horizon",
      "source": "FRED",
      "as_of": "2026-02-18"
    }
  },
  "secondary_indicators": {
    "btc_dominance": {"value": 61.2, "trend": "rising", "interpretation": "BTC season — alts underperforming"},
    "total_crypto_mcap": {"value": 2100000000000, "trend": "declining", "interpretation": "Risk-off"},
    "eth_btc": {"value": 0.027, "trend": "declining", "interpretation": "ETH weakness — not alt season"},
    "stablecoin_mcap": {"value": 215000000000, "trend": "growing", "interpretation": "Dry powder accumulating"},
    "aggregate_funding": {"value": -0.002, "trend": "negative", "interpretation": "Market deleveraging"}
  },
  "itc_qualitative": {
    "cowen_cycle_view": "Bear market comparable to 2022 Q3-Q4. Expects BTC to find support in $50-60K range based on log regression. Alt season not until BTC dominance peaks and reverses.",
    "last_video_analyzed": "How low will Bitcoin go? (2026-02-17)",
    "last_video_id": "WUJwW3mf6to"
  },
  "regime_history": [
    {"regime": "distribution", "from": "2025-11-01", "to": "2026-01-15"},
    {"regime": "bear", "from": "2026-01-15", "to": null}
  ],
  "desk_implications": {
    "new_buy_theses": "allowed — accumulation watchlist active",
    "discovery_engine": "active — bear market is best time to identify next cycle winners",
    "risk_posture": "defensive — small position sizes, wide DCA ranges",
    "focus": "thesis building + research pipeline for next bull cycle"
  }
}
```

### 1.4 Regime Gating Rules

Every agent checks `coverage/regime.json` before acting:

| Agent | Euphoria/Distribution | Bear/Accumulation | Early/Mid Bull |
|-------|----------------------|-------------------|----------------|
| **Analyst** | No new buy theses. Focus on exit levels + thesis invalidation review. | Full thesis pipeline active. Discovery encouraged. Build research for next cycle. | Selective new theses. Prioritize quality over quantity. |
| **Sentinel** | Heightened monitoring. Lower alert thresholds. Watch for distribution signals. | Standard monitoring. Focus on accumulation signals (whale buying, exchange outflows). | Standard monitoring. |
| **Risk Manager** | Maximum authority. Can veto any position addition. Enforce strict profit-taking. | Relaxed on new entries (this is when you WANT to buy). Strict on position sizing (don't blow your wad early). | Standard risk limits. |
| **Execution Structurer** | Exit plans only. DCA-out schedules. | Wide DCA-in ranges. Patient entries. Don't chase. | Standard entry plans. |
| **Discovery Engine** | **Paused.** No new candidates surfaced. | **Most active.** Bear markets are where next cycle's 10x names are found cheap. | Reduced cadence. Monthly instead of weekly. |

### 1.5 ITC Data Integration

**Public YouTube channel** (3-4 free videos/week):
- Titles indicate topic — Sentinel monitors for new uploads via RSS/API
- Transcripts extracted and summarized for regime-relevant conclusions
- Key data points: risk band levels, cycle fractal comparisons, monetary policy mapping

**Premium dashboard** (app.intothecryptoverse.com):
- Oracle accesses via browser when regime review is triggered
- Key charts to check: BTC Risk Metric, BTC Dominance, Macro Recession Risk, DCA simulation
- Values extracted and stored in `regime.json`

**Integration cadence:**
- Weekly: Check for new ITC public videos, extract regime-relevant conclusions
- Monthly: Full regime review using ITC dashboard + all indicators
- Ad-hoc: Major market moves (>10% BTC weekly move) trigger immediate regime check

---

## 2. Mission

The Crypto Desk exists to answer three questions on a rolling basis:

1. **What should we own?** — Identify crypto assets with asymmetric upside over a 2-4 year cycle
2. **Where are we in the move?** — Define HTF trend direction + key S/R levels for each asset
3. **Why should we own it?** — Develop Citrini-style theses with clear entry/exit levels and risk/reward

The desk surfaces **1-3 high-conviction ideas at a time**. It does not generate 50 tickers. It does not execute trades. It produces structured analysis that Alex acts on.

---

## 2. Agent Specifications

### 2.1 Oracle (CIO / Chief Strategist)

**Role:** Already exists as the main agent. The Oracle is Alex's direct interface and the desk's coordinator.

**Mandate:**
- Set and maintain the macro framework (cycle positioning, risk appetite, sector rotation views)
- Route tasks to desk agents
- Synthesize cross-agent outputs into actionable recommendations
- Make final calls on conviction rankings
- Communicate directly with Alex via Telegram

**Data Sources:** All agent outputs, Alex's direct input, macro research files

**Outputs:**
- Weekly conviction rankings (top 1-3 ideas)
- Ad-hoc synthesis when signals conflict
- Thesis approval/rejection decisions

**Cadence:** Always-on (main session + heartbeat)

**SOUL.md Outline:**
```
You are the Oracle — CIO of Claw Capital's Crypto Desk.
You synthesize, you don't grind. Your analysts do the work; you make the calls.
Bias toward inaction. The default answer is "no position."
Never fall in love with a thesis. Kill it the moment the evidence turns.
Alex trusts you to filter noise. Surface only what matters.
```

---

### 2.2 Crypto Desk Analyst

**Role:** The workhorse. Maintains thesis documents for every asset in the coverage universe.

**Mandate:**
- Write and maintain Citrini-style thesis docs for each covered asset
- Conduct deep-dive research: protocol fundamentals, tokenomics, competitive landscape, on-chain metrics
- Run periodic thesis reviews (weekly for active positions, bi-weekly for watchlist)
- Identify new assets that meet the desk's criteria
- Track narrative evolution and flag when a thesis is stale

**Data Sources:**
- **Allium API** — on-chain metrics: TVL, revenue, active addresses, whale flows, token distribution
- **DeFiLlama** (via web_fetch) — TVL aggregation, protocol revenue, fee data, chain comparisons
- **Web search** — governance proposals, partnership announcements, protocol updates
- **X/Twitter research** — smart money commentary, narrative tracking
- **CoinGecko/CoinMarketCap** (via web_fetch) — market cap, FDV, circulating supply, token unlock schedules

**Outputs:**
- `thesis_proposal` signal — new asset recommendation with full thesis
- `thesis_update` signal — material changes to existing thesis (upgraded/downgraded/invalidated)
- Per-asset thesis documents in `theses/` directory

**Cadence:**
- **Weekly:** Full review of all active theses (Sunday)
- **Daily:** Quick scan of top-3 conviction positions for material changes
- **Ad-hoc:** Deep dive on new asset when triggered by Sentinel anomaly or Oracle request

**SOUL.md Outline:**
```
You are the Crypto Desk Analyst at Claw Capital.
You write Citrini-style theses: deep fundamental analysis with clear price levels.
Every thesis must answer: Why this asset? Why now? What's the risk/reward?
You are NOT a hype machine. "I don't have a view" is an acceptable answer.
Revenue > governance tokens. Monopolies > commoditized protocols.
Always include the bear case. If you can't articulate why you're wrong, you don't understand the trade.
Be honest about price: "this is expensive at current levels" is more useful than forced bullishness.
Data first, narrative second. On-chain doesn't lie.
```

---

### 2.3 Sentinel (Market Surveillance)

**Role:** Detection engine. Monitors markets and fires structured signals. Does NOT interpret — just detects and routes.

**Mandate:**
- Monitor prices across all covered crypto assets
- Detect anomalies: volume spikes, funding rate extremes, large on-chain transfers, liquidation cascades
- Fire structured alerts when thresholds are breached
- Track proximity to thesis entry/exit levels from `thesis-levels.json`
- Monitor cross-asset correlations for regime changes

**Data Sources:**
- **Allium API** — real-time prices, DEX volumes, on-chain transfers
- **Hyperliquid API** (via web_fetch) — funding rates, open interest, liquidation data
- **DeFiLlama** — TVL changes, protocol flows

**Outputs:**
- `anomaly_alert` signal — structured detection event (no interpretation)
- Price proximity alerts when assets approach thesis levels

**Cadence:**
- **Every 1 hour:** Price check + anomaly scan for all covered crypto assets
- **Every 4 hours:** Funding rate + OI scan
- **Every 6 hours:** On-chain flow analysis (whale movements, exchange flows)

**SOUL.md Outline:**
```
You are the Sentinel — Claw Capital's market surveillance system.
You DETECT. You do NOT interpret. You do NOT recommend.
Fire signals with data. Let other agents decide what it means.
False negatives are worse than false positives. When in doubt, fire the signal.
Never suppress an anomaly because "it's probably nothing."
Format every output as structured JSON. No prose, no opinions.
```

---

### 2.4 Risk Manager (Independent, Adversarial)

**Role:** The skeptic. Reviews every thesis and trade idea with an adversarial lens. Cannot be overridden.

**Mandate:**
- Review every `thesis_proposal` before it reaches Oracle
- Force structured bear cases for every thesis
- Check portfolio-level risks: concentration, correlation, sector exposure, drawdown limits
- Maintain base rate data (what % of "high conviction" theses actually work?)
- Veto power on position sizing (advisory, but Oracle must acknowledge and document overrides)
- Run periodic stress tests: "what happens to the portfolio if ETH drops 60%?"

**Data Sources:**
- All thesis documents
- Portfolio state (`portfolio.json`)
- Historical thesis outcomes (when available)
- Correlation data across covered assets

**Outputs:**
- `risk_review` signal — structured review of every thesis proposal
- Portfolio risk reports (weekly)
- Stress test results

**Cadence:**
- **On-demand:** Triggered by every `thesis_proposal` and `execution_plan`
- **Weekly:** Portfolio-level risk review
- **Monthly:** Base rate review (thesis accuracy tracking)

**SOUL.md Outline:**
```
You are the Risk Manager at Claw Capital. You are the adversary.
Your job is to find reasons NOT to do a trade. Every thesis has holes — find them.
You cannot be overridden. If Oracle disagrees, they must document why.
Concentration kills. Correlation kills faster. Check both on every review.
Base rates matter: most "high conviction" ideas fail. Demand evidence, not narratives.
Position sizing is more important than direction. A right thesis with wrong sizing still loses money.
Never approve a thesis that doesn't have a clear invalidation level.
"What if I'm wrong?" is your favorite question.
```

---

### 2.5 Execution Structurer

**Role:** Translates approved theses into concrete position plans. Advisory only — no execution authority.

**Mandate:**
- Take approved theses and output: position sizing, entry/exit/scaling plan, risk/reward ratios
- Account for portfolio context (existing exposure, correlation with held positions)
- Define DCA schedules for accumulation theses
- Calculate R:R at current price vs thesis levels
- Output execution plans that Alex can act on directly

**Data Sources:**
- Approved thesis documents
- Portfolio state (`portfolio.json`)
- Current prices (from Sentinel)
- Risk Manager constraints

**Outputs:**
- `execution_plan` signal — structured plan with specific prices, sizes, and triggers

**Cadence:**
- **On-demand:** Triggered when Oracle approves a thesis
- **Weekly:** Review open execution plans for stale levels

**SOUL.md Outline:**
```
You are the Execution Structurer at Claw Capital.
You turn theses into plans. Specific prices, specific sizes, specific triggers.
You do NOT decide what to buy. You decide HOW to buy what's been approved.
Never risk more than 5% of portfolio on a single idea. Scale in, don't lump sum.
Every plan needs: entry levels, scale-in schedule, stop/invalidation, take-profit levels, position size as % of portfolio.
If the R:R is below 3:1 at current price, say so. Don't force a plan.
```

---

## 3. Signal Schema

All inter-agent communication uses structured JSON signals. Signals are written to `signals/crypto-desk/` and read by consuming agents.

### 3.1 Base Signal Envelope

Every signal wraps in this envelope:

```json
{
  "signal_id": "sig_20260218_143022_analyst_btc",
  "type": "thesis_proposal",
  "source_agent": "analyst",
  "target_agent": "risk_manager",
  "priority": "normal",
  "timestamp": "2026-02-18T14:30:22Z",
  "ttl_hours": 168,
  "status": "pending",
  "payload": { }
}
```

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `signal_id` | string | Unique ID: `sig_{date}_{time}_{source}_{subject}` |
| `type` | enum | One of: `thesis_proposal`, `thesis_update`, `anomaly_alert`, `risk_review`, `execution_plan` |
| `source_agent` | enum | `analyst`, `sentinel`, `risk_manager`, `execution_structurer`, `oracle` |
| `target_agent` | enum | Who should consume this. `oracle` for final decisions, specific agent for routing |
| `priority` | enum | `critical` (immediate Telegram alert), `high` (next check), `normal` (batch), `low` (informational) |
| `timestamp` | ISO 8601 | When the signal was created |
| `ttl_hours` | int | Signal expires after this many hours. Default 168 (7 days) |
| `status` | enum | `pending`, `acknowledged`, `acted_on`, `expired`, `superseded` |
| `payload` | object | Signal-type-specific data (see below) |

---

### 3.2 `thesis_proposal`

Source: **Analyst** → Target: **Risk Manager** → then **Oracle**

```json
{
  "type": "thesis_proposal",
  "payload": {
    "asset": "MORPHO",
    "chain": "ethereum",
    "sector": "defi_lending",
    "narrative": "Institutional DeFi rails",
    "conviction": 8,
    "timeframe": "6-18 months",
    "current_price": 1.32,
    "entry_levels": {
      "aggressive": 1.20,
      "base": 1.10,
      "conservative": 0.95
    },
    "targets": [2.50, 3.50, 5.00],
    "invalidation": 0.70,
    "risk_reward": "3.5:1 from base entry",
    "thesis_summary": "Coinbase partnership + curated vault model positions MORPHO as the institutional lending protocol. Revenue accruing, not governance-only. Smart money (Insomniac) highest conviction DeFi pick.",
    "catalysts": [
      {"event": "Coinbase vault expansion", "timeframe": "Q1-Q2 2026", "impact": "high"},
      {"event": "Additional institutional integrations", "timeframe": "2026", "impact": "medium"},
      {"event": "Token buyback mechanism activation", "timeframe": "Q2 2026", "impact": "medium"}
    ],
    "bear_case": "Aave's institutional push succeeds and captures the market. Morpho remains niche middleware with limited direct revenue capture.",
    "thesis_doc_path": "projects/claw-capital/crypto-desk/theses/MORPHO.md",
    "data_snapshot": {
      "tvl": 4200000000,
      "tvl_30d_change_pct": 12.5,
      "protocol_revenue_annualized": 28000000,
      "fdv": 1320000000,
      "circulating_mcap": 450000000,
      "fdv_to_revenue": 47.1
    }
  }
}
```

---

### 3.3 `anomaly_alert`

Source: **Sentinel** → Target: **Oracle** (routed to Analyst if research needed)

```json
{
  "type": "anomaly_alert",
  "payload": {
    "asset": "PENDLE",
    "anomaly_type": "volume_spike",
    "severity": "high",
    "detection_data": {
      "metric": "dex_volume_24h",
      "current_value": 45000000,
      "baseline_7d_avg": 12000000,
      "multiple": 3.75,
      "timestamp": "2026-02-18T14:00:00Z"
    },
    "context": {
      "price_change_24h_pct": 8.2,
      "funding_rate": 0.012,
      "social_mention_ratio": 1.1,
      "proximity_to_thesis_level": {
        "nearest_level": 1.10,
        "level_type": "watch_zone_upper",
        "distance_pct": -12.7
      }
    },
    "social_silence": true,
    "requires_research": true
  }
}
```

**Anomaly types:**
- `volume_spike` — DEX or CEX volume >3x 7-day avg
- `funding_extreme` — funding rate >0.05% or <-0.03% (8h)
- `whale_movement` — top wallet transfer >$1M in single tx
- `liquidation_cascade` — >$10M liquidations in 1h for single asset
- `tvl_shift` — TVL change >10% in 24h
- `exchange_flow` — net exchange inflow/outflow >2x monthly avg
- `correlation_break` — asset decorrelates from BTC/ETH >2 standard deviations
- `level_proximity` — price within 3% of thesis entry/exit level

---

### 3.4 `risk_review`

Source: **Risk Manager** → Target: **Oracle**

```json
{
  "type": "risk_review",
  "payload": {
    "reviewed_signal_id": "sig_20260218_143022_analyst_morpho",
    "asset": "MORPHO",
    "verdict": "approved_with_conditions",
    "risk_score": 6,
    "issues": [
      {
        "category": "concentration",
        "severity": "medium",
        "detail": "Adding MORPHO creates 35% DeFi lending exposure (AAVE already held). Recommend half-sizing.",
        "recommendation": "Max 2.5% portfolio allocation instead of proposed 5%"
      },
      {
        "category": "correlation",
        "severity": "low",
        "detail": "MORPHO 90d correlation with AAVE: 0.82. High but expected for same sector."
      },
      {
        "category": "base_rate",
        "severity": "medium",
        "detail": "Of 12 'institutional adoption' theses tracked across DeFi since 2023, 3 hit targets (25%). Median time to thesis invalidation: 8 months.",
        "recommendation": "Set 6-month thesis review hard deadline"
      }
    ],
    "bear_case_assessment": {
      "analyst_bear_case_quality": "adequate",
      "additional_risks": [
        "Regulatory risk: SEC action on lending protocols could freeze institutional adoption",
        "Smart contract risk: Morpho uses proxy contracts — upgradeable = attack surface",
        "Token unlock schedule: 40% of supply still locked, dilution risk"
      ]
    },
    "portfolio_impact": {
      "current_crypto_allocation_pct": 22,
      "post_trade_crypto_allocation_pct": 24.5,
      "sector_concentration": {"defi_lending": 0.35, "l1": 0.40, "defi_yield": 0.15, "other": 0.10},
      "max_portfolio_drawdown_if_thesis_fails_pct": 2.5
    },
    "conditions": [
      "Half position size (2.5% not 5%)",
      "Hard stop at $0.70 (invalidation level)",
      "6-month thesis review deadline: 2026-08-18",
      "Do not add to position if AAVE also at full size"
    ]
  }
}
```

**Verdict options:**
- `approved` — no issues, proceed to execution structuring
- `approved_with_conditions` — proceed but with constraints (conditions must be in execution plan)
- `rejected` — thesis doesn't pass risk review. Reasons documented.
- `needs_more_data` — insufficient information to review. Specific data gaps listed.

---

### 3.5 `execution_plan`

Source: **Execution Structurer** → Target: **Oracle**

```json
{
  "type": "execution_plan",
  "payload": {
    "asset": "MORPHO",
    "reviewed_signal_id": "sig_20260218_150000_risk_morpho",
    "risk_conditions_incorporated": true,
    "plan": {
      "total_allocation_pct": 2.5,
      "scaling_strategy": "dca_3_tranches",
      "tranches": [
        {"level": 1.20, "allocation_pct": 0.8, "label": "aggressive_entry", "order_type": "limit"},
        {"level": 1.10, "allocation_pct": 0.9, "label": "base_entry", "order_type": "limit"},
        {"level": 0.95, "allocation_pct": 0.8, "label": "conservative_entry", "order_type": "limit"}
      ],
      "stop_loss": {"level": 0.70, "type": "hard", "action": "exit_full_position"},
      "take_profit": [
        {"level": 2.50, "action": "trim_33pct", "label": "TP1"},
        {"level": 3.50, "action": "trim_33pct", "label": "TP2"},
        {"level": 5.00, "action": "exit_remaining", "label": "TP3"}
      ],
      "risk_reward_at_base_entry": "3.5:1",
      "max_loss_if_stopped_pct": 0.9,
      "thesis_review_date": "2026-08-18",
      "invalidation_criteria": [
        "Price below $0.70 for 3+ days",
        "Coinbase partnership terminated or scaled back",
        "Protocol revenue declining 3 consecutive months",
        "Major smart contract exploit"
      ]
    },
    "current_price": 1.32,
    "note": "Current price above aggressive entry. Set limits and wait. Do not chase."
  }
}
```

---

### 3.6 `thesis_update`

Source: **Analyst** → Target: **Oracle** (and Risk Manager if material)

```json
{
  "type": "thesis_update",
  "payload": {
    "asset": "HYPE",
    "update_type": "conviction_change",
    "previous_conviction": 8,
    "new_conviction": 9,
    "reason": "Q4 2025 revenue beat estimates by 40%. Buyback mechanism activated ahead of schedule. TVL growth accelerating.",
    "material_change": true,
    "thesis_doc_path": "projects/claw-capital/crypto-desk/theses/HYPE.md",
    "level_changes": {
      "buy_zone": [18, 22],
      "watch_zone": [22, 26],
      "targets": [45, 60, 80]
    },
    "requires_risk_review": false,
    "requires_execution_update": true
  }
}
```

**Update types:** `conviction_change`, `level_adjustment`, `catalyst_triggered`, `thesis_invalidated`, `narrative_shift`, `new_data`

---

## 4. Thesis Template

Every asset in the coverage universe gets a thesis document. This is the Citrini-style format — deep fundamental analysis, not hype.

### Template: `theses/{TICKER}.md`

```markdown
# {TICKER} — Thesis Document

> **Protocol:** {Full name}
> **Category:** {Sector}
> **Chain:** {Primary chain}
> **Last Updated:** {Date}
> **Conviction:** {1-10} | **Status:** {Active / Watchlist / Invalidated}
> **Analyst:** Crypto Desk Analyst
> **Risk Review:** {Approved / Approved w/ Conditions / Pending}

---

## 1. One-Line Thesis

{Single sentence: what is this, why does it win, what's the trade.}

## 2. The Narrative

{2-3 paragraphs. What macro trend does this ride? Why is the timing right? Where are we in the adoption curve? Is the market pricing this correctly?}

## 3. Fundamentals

### Protocol Metrics
| Metric | Value | Trend | Comparable |
|--------|-------|-------|------------|
| TVL | | | |
| Protocol Revenue (annualized) | | | |
| Active Users (30d) | | | |
| FDV | | | |
| Circulating Mcap | | | |
| FDV/Revenue | | | |
| Mcap/Revenue | | | |

### Tokenomics
- **Supply schedule:** {Emissions, unlocks, burn mechanisms}
- **Value accrual:** {How does the token capture protocol value? Buybacks? Staking? Revenue share?}
- **Holder distribution:** {Top 10 wallet concentration, insider %, community %}

### Competitive Position
- **Moat:** {What makes this defensible? Network effects, liquidity, integrations, switching costs}
- **Competitors:** {Who else does this? Why does this one win?}
- **Market share:** {% of relevant market. Trend direction.}

## 4. Catalysts

| Catalyst | Timeframe | Impact | Probability |
|----------|-----------|--------|-------------|
| | | High/Med/Low | High/Med/Low |

## 5. Bear Case (Required — Non-Negotiable)

{Structured argument for why this thesis fails. Must be specific, not generic "crypto could go down." Address:}

1. **Fundamental risk:** {What breaks the business case?}
2. **Competition risk:** {Who could eat their lunch?}
3. **Execution risk:** {What could the team screw up?}
4. **Market/Macro risk:** {What environment kills this trade?}
5. **Token-specific risk:** {Unlock dilution, governance attack, smart contract risk}

## 6. Price Levels & Structure

### HTF Structure
- **Trend:** {Uptrend / Downtrend / Range / No structure}
- **Timeframe:** {Weekly / Daily / 4H}
- **Key observation:** {Where are we in the cycle?}

### Levels
| Level | Price | Type | Touches | Notes |
|-------|-------|------|---------|-------|
| R3 | | Major resistance | | |
| R2 | | Resistance | | |
| R1 | | Resistance | | |
| Current | | — | — | |
| S1 | | Support | | |
| S2 | | Support | | |
| S3 | | Major support | | |

### Trade Plan
- **Buy zone:** {Price range}
- **Watch zone:** {Price range — start paying attention}
- **Targets:** {TP1, TP2, TP3 with rationale}
- **Invalidation:** {Hard stop level with reasoning}
- **R:R at current price:** {X:1}
- **R:R at base entry:** {X:1}

## 7. Position Sizing

- **Max allocation:** {X% of portfolio}
- **Scaling plan:** {DCA tranches or lump sum}
- **Correlation note:** {What else in portfolio moves with this?}

## 8. Testable Predictions (Required — Automated Tracking)

Every thesis must include 3-5 explicit, measurable predictions with deadlines. These are tracked automatically and drive thesis reviews.

| ID | Prediction | Metric | Target | Deadline | Category | Status |
|----|-----------|--------|--------|----------|----------|--------|
| {TICKER}-P1 | {Specific measurable statement} | {metric_name} | {value} | {date} | fundamental | open |
| {TICKER}-P2 | | | | | competitive | open |
| {TICKER}-P3 | | | | | catalyst | open |

**Categories:** fundamental, competitive, catalyst, price, macro
**Status:** open → hit / miss (with actual_value and result_date)

Critical predictions (ones the thesis depends on): {List which prediction IDs are critical — a miss triggers automatic thesis review}

## 9. Review Schedule

- **Next review:** {Date}
- **Review trigger:** {What would force an early review?}
- **Invalidation criteria:** {Specific, measurable conditions that kill the thesis}
- **Critical prediction miss:** Automatic review triggered if any critical prediction misses

## 10. Audit Trail

| Date | Action | Details |
|------|--------|---------|
| {Date} | Thesis created | Initial write-up |
```

---

## 5. Coverage Universe

### Initial Crypto Coverage (from thesis-levels.json + research)

#### Tier 1 — Active Theses (Full thesis docs required)

| Asset | Sector | Narrative | Conviction | Status |
|-------|--------|-----------|------------|--------|
| **BTC** | L1 | Cyclical accumulation at cycle low | — | Watching for $40-50K |
| **HYPE** | Infrastructure (Hyperliquid) | Best fundamentals in crypto. Perp DEX dominance | 8 | Watching for $18-22 |
| **AAVE** | DeFi Lending | Dominant lending, tokenomics upgrade | 7 | Watching for $95-105 |
| **MORPHO** | DeFi Lending | Institutional lending rails, Coinbase partnership | 8 | Watching for $0.95-1.10 |
| **PENDLE** | DeFi Yield | Only yield trading protocol. Zero competition | 7 | Watching for $0.90-1.00 |

#### Tier 2 — Watchlist (Abbreviated thesis, monitoring)

| Asset | Sector | Narrative | Notes |
|-------|--------|-----------|-------|
| **LIT** | DeFi Perps | HYPE challenger, Circle revenue-share | High risk/reward, needs more data |
| **ETHFI** | DeFi Restaking | Largest liquid restaking | Dependent on ETH + EigenLayer |
| **SKY** | DeFi Stablecoin | Ex-MakerDAO, RWA revenue, burn | Rebrand confusion, but fundamentals solid |
| **SYRUP** | DeFi Lending | Institutional under-collateralized | Niche, smallest position |
| **VVV** | AI/DeFi | Privacy AI, buyback+burn | Post-pump, needs pullback |

#### Tier 3 — Sector Watchlist (No thesis yet, monitoring for entry)

| Sector | Assets to Watch | Trigger for Promotion |
|--------|----------------|----------------------|
| **L1/L2** | SOL, ETH, SUI, APT, SEI | Cycle low + relative strength divergence |
| **AI Tokens** | TAO, FET, RENDER, AKT | Revenue inflection or institutional adoption signal |
| **RWA** | ONDO, CPOOL, MPL | TradFi integration catalyst |
| **Gaming/Social** | IMX, RONIN, PRIME | User metrics inflection |
| **Privacy** | — | Regulatory catalyst (pro-privacy legislation) |

#### Coverage Rules

1. **Tier 1** assets get full Citrini-style thesis documents, weekly reviews, Sentinel monitoring
2. **Tier 2** assets get abbreviated theses, bi-weekly reviews, Sentinel monitoring
3. **Tier 3** sectors are scanned monthly for promotion candidates
4. **Maximum 5 Tier 1 assets at any time.** If a new one enters, one must be downgraded or removed.
5. **Total coverage universe cap: 20 assets.** Beyond that, something must drop off.

---

## 6. Workflows

### 6.1 New Asset Discovery → Thesis → Watchlist

```
┌──────────────────────────────────────────────────────────────┐
│ TRIGGER: Sentinel anomaly / Analyst research / Oracle request │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────┐
│ ANALYST: Initial Screen (1 hour) │
│                                  │
│ □ Meets minimum criteria?        │
│   - Mcap > $50M                  │
│   - DEX liquidity > $1M         │
│   - Live protocol (not vaporware)│
│   - Token has value accrual      │
│ □ Fits a tracked narrative?      │
│ □ Not already covered?           │
└──────────┬──────────┬────────────┘
           │ Pass     │ Fail
           ▼          ▼
┌────────────────┐   DISCARD
│ ANALYST: Deep  │   (log reason)
│ Dive (4-8 hrs) │
│                │
│ Write full     │
│ thesis doc     │
│ using template │
└──────┬─────────┘
       │
       ▼ thesis_proposal signal
┌────────────────────────────┐
│ RISK MANAGER: Review       │
│                            │
│ □ Bear case adequate?      │
│ □ Concentration check      │
│ □ Correlation check        │
│ □ Base rate assessment     │
│ □ Position sizing review   │
└──────┬──────────┬──────────┘
       │ Approved │ Rejected
       ▼          ▼
┌────────────┐   ANALYST:
│ ORACLE:    │   Revise or
│ Final call │   archive
│            │
│ Accept?    │
└──┬─────┬───┘
   │ Yes │ No
   ▼     ▼
┌────────────────────┐   Archive thesis
│ EXEC STRUCTURER:   │   (available for
│ Build entry plan   │    future review)
│                    │
│ DCA levels, sizing,│
│ stops, targets     │
└──────┬─────────────┘
       │
       ▼ execution_plan signal
┌──────────────────────┐
│ ORACLE → ALEX        │
│                      │
│ Telegram alert with: │
│ - Thesis summary     │
│ - Entry plan         │
│ - Risk conditions    │
│ - Bear case          │
└──────────────────────┘
```

### 6.2 Existing Thesis Review / Update / Invalidation

```
┌───────────────────────────────────────────────────────┐
│ TRIGGER: Scheduled review / Sentinel anomaly / Oracle │
└──────────────────┬────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│ ANALYST: Thesis Review Checklist     │
│                                      │
│ □ Are fundamentals still intact?     │
│   - Revenue trend                    │
│   - TVL trend                        │
│   - User growth trend                │
│ □ Has the narrative changed?         │
│ □ Any catalysts triggered/missed?    │
│ □ Have competitors gained ground?    │
│ □ Token supply changes (unlocks)?    │
│ □ Price action vs thesis levels?     │
└──────┬──────────┬────────────────────┘
       │          │
       ▼          ▼
  No material    Material change
  change         detected
       │              │
       ▼              ▼
  Update           ┌─────────────────────────┐
  "last_reviewed"  │ ANALYST: thesis_update   │
  date only        │                          │
                   │ Type:                    │
                   │ a) conviction_change     │
                   │ b) level_adjustment      │
                   │ c) thesis_invalidated    │
                   │ d) narrative_shift       │
                   └──────┬──────────────────┘
                          │
                          ▼
                   ┌──────────────────────┐
                   │ If INVALIDATION:     │
                   │                      │
                   │ → Risk Manager notified│
                   │ → Oracle alerts Alex  │
                   │ → Exec Structurer:   │
                   │   exit plan if held   │
                   │ → Thesis archived    │
                   │   with outcome notes  │
                   └──────────────────────┘
```

### 6.3 Anomaly Response Flow

```
SENTINEL detects anomaly
        │
        ▼ anomaly_alert signal
┌─────────────────────────────────┐
│ ORACLE: Triage                  │
│                                 │
│ Is this a covered asset?        │
│ ├─ Yes → Route to ANALYST for  │
│ │        thesis impact review   │
│ │                               │
│ ├─ No, but meets screen? →     │
│ │   Route to ANALYST for        │
│ │   initial screen              │
│ │                               │
│ └─ No, doesn't meet screen →   │
│     Log and discard             │
│                                 │
│ Is this critical priority?      │
│ ├─ Yes → Immediate Telegram    │
│ └─ No → Batch in next cycle    │
└─────────────────────────────────┘
```

---

## 7. Inter-Agent Communication Protocol

### 7.1 Runtime Architecture — How Agents Actually Run

**No new OpenClaw instances needed.** Agents are roles, not persistent processes.

```
┌─────────────────────────────────────────────────────────┐
│                    OpenClaw Instance                      │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ ORACLE (Main Session) — Always On                 │   │
│  │ • Direct Telegram chat with Alex                  │   │
│  │ • Orchestrates all other agents                   │   │
│  │ • Reads/writes files, detects new signals         │   │
│  │ • Spawns sub-agents on demand or via cron         │   │
│  └──────┬───────────┬──────────────┬────────────────┘   │
│         │           │              │                     │
│    ┌────▼────┐ ┌────▼─────┐ ┌─────▼──────┐             │
│    │ CRON    │ │ CRON     │ │ SPAWN      │             │
│    │ Sentinel│ │ Analyst  │ │ On-demand  │             │
│    │ (hourly)│ │ (weekly) │ │ Risk/Exec  │             │
│    └────┬────┘ └────┬─────┘ └─────┬──────┘             │
│         │           │              │                     │
│         ▼           ▼              ▼                     │
│    Writes files + sessions_send notification to Oracle   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Each agent maps to OpenClaw primitives:**

| Agent | OpenClaw Primitive | Lifecycle | Context Loading |
|-------|-------------------|-----------|-----------------|
| **Oracle** | Main session | Persistent (always on) | Loads SOUL.md + MEMORY.md at session start |
| **Analyst** | `cron` (scheduled) or `sessions_spawn` (on-demand) | Ephemeral — starts, does work, dies | Loads `agents/analyst/SOUL.md` + relevant thesis files + data source configs |
| **Sentinel** | `cron` (scheduled) | Ephemeral — runs hourly/4h scans | Loads `agents/sentinel/SOUL.md` + `sentinel/config.json` + current prices |
| **Risk Manager** | `sessions_spawn` (triggered by Oracle) | Ephemeral — spawned when thesis_proposal appears | Loads `agents/risk-manager/SOUL.md` + portfolio.json + the proposal being reviewed |
| **Execution Structurer** | `sessions_spawn` (triggered by Oracle) | Ephemeral — spawned when thesis approved | Loads `agents/execution-structurer/SOUL.md` + approved thesis + risk conditions |

**Key insight:** Agents don't need to be "alive" continuously. They wake up with their specific persona loaded, do their job, write output to files, optionally notify Oracle, and terminate.

### 7.2 Communication Model — Hybrid (Files + Notifications)

**Two channels, each for its purpose:**

**Channel 1: Files (persistent state)**
All durable output — theses, signals, reviews, plans, regime data — is written to disk. This is the system of record. Every agent reads input from files and writes output to files.

**Channel 2: sessions_send (real-time notifications)**
When a sub-agent completes work that needs Oracle's attention, it sends a brief notification via `sessions_send`. This eliminates polling delay — Oracle gets notified immediately instead of waiting for the next heartbeat.

```
EXAMPLE: Thesis Pipeline

1. Oracle spawns Analyst:
   sessions_spawn(task="Write HYPE thesis", SOUL=analyst/SOUL.md)

2. Analyst does research, writes:
   → theses/HYPE.md (full thesis document)
   → signals/crypto-desk/pending/sig_..._analyst_hype.json (thesis_proposal signal)

3. Sub-agent completion auto-notifies Oracle (OpenClaw built-in)

4. Oracle reads the thesis_proposal, spawns Risk Manager:
   sessions_spawn(task="Review HYPE thesis proposal", SOUL=risk-manager/SOUL.md)

5. Risk Manager reads:
   ← theses/HYPE.md
   ← signals/crypto-desk/pending/sig_..._analyst_hype.json
   ← portfolio.json, risk-manager/config.json

6. Risk Manager writes:
   → signals/crypto-desk/pending/sig_..._risk_hype.json (risk_review)

7. Sub-agent completion auto-notifies Oracle

8. Oracle reads risk_review:
   If approved → spawns Execution Structurer
   If rejected → notifies Alex with reason
   If approved_with_conditions → spawns Exec Structurer with conditions

9. Execution Structurer writes:
   → signals/crypto-desk/pending/sig_..._exec_hype.json (execution_plan)

10. Oracle reads execution_plan → delivers to Alex via Telegram
```

**For scheduled work (cron), the flow is simpler:**

```
EXAMPLE: Sentinel Hourly Scan

1. Cron fires cc-sentinel-hourly
   → Sub-agent loads sentinel/SOUL.md + sentinel/config.json

2. Sentinel pulls prices, checks thresholds, detects anomalies

3. If anomaly found:
   → Writes signals/crypto-desk/pending/sig_..._sentinel_pendle.json
   → Cron completion summary delivered to Oracle's main session

4. If nothing found:
   → No output. Silent completion.

5. Oracle sees cron completion, checks for new signal files, triages.
```

### 7.3 Orchestration Rules

**Oracle is the hub. All communication routes through Oracle.**

Agents NEVER talk to each other directly. Oracle decides what to spawn next based on what the previous agent produced. This is sequential pipeline orchestration, not a mesh.

```
Alex ←→ Oracle ←→ Analyst
                ←→ Sentinel (via cron)
                ←→ Risk Manager
                ←→ Execution Structurer
```

**Why hub-and-spoke, not mesh:**
- Sub-agents are ephemeral — they can't receive messages after they die
- Oracle has full context (portfolio, regime, all theses) to make routing decisions
- Simpler to debug — Oracle's session log shows the full pipeline
- No race conditions or message ordering issues

### 7.4 Priority Levels

| Priority | Response Time | Telegram Alert | Example |
|----------|--------------|----------------|---------|
| `critical` | Immediate | Yes, with 🔴 | Thesis invalidation on held position, >15% move in covered asset |
| `high` | Within 1 hour | Yes, with 🟡 | Price enters buy zone, significant anomaly on Tier 1 asset |
| `normal` | Next scheduled cycle | Batched in daily digest | Routine thesis update, Tier 2 anomaly |
| `low` | When convenient | No | Informational data updates, Tier 3 sector scan results |

### 7.5 Signal Files (System of Record)

Signals are JSON files in `signals/crypto-desk/`. They serve as the audit trail and handoff mechanism between agents.

```
signals/crypto-desk/
├── pending/                    # Output waiting for next agent in pipeline
│   ├── {signal_id}.json
│   └── ...
├── completed/                  # Fully processed through pipeline
├── expired/                    # TTL exceeded without processing
└── archive/                    # Monthly archives
    └── 2026-02/
```

**Signal lifecycle:**
```
CREATED (agent writes to pending/) 
    → PROCESSING (Oracle picks it up, spawns next agent)
    → COMPLETED (pipeline finished, moved to completed/)
    
    OR → EXPIRED (TTL exceeded, moved to expired/)
    OR → SUPERSEDED (newer signal replaces, old moved to archive/)
```

### 7.6 Cron Schedule (All Agents)

| Cron Job Name | Schedule | Agent Role | Task |
|---------------|----------|-----------|------|
| `cc-sentinel-price` | `0 * * * *` (hourly) | Sentinel | Price scan, anomaly detection, level proximity alerts |
| `cc-sentinel-funding` | `0 */4 * * *` (every 4h) | Sentinel | Funding rates, OI, liquidation data |
| `cc-sentinel-firstmention` | `0 9 * * *` (daily 9am UTC) | Sentinel | Smart money first-mention detection |
| `cc-analyst-review` | `0 8 * * 0` (Sunday 8am UTC) | Analyst | Weekly thesis review for all covered assets |
| `cc-analyst-discovery` | `0 6 * * 0` (Sunday 6am UTC) | Analyst | Weekly narrative scan + fundamental screening |
| `cc-risk-portfolio` | `0 10 * * 1` (Monday 10am UTC) | Risk Manager | Portfolio-level risk review |
| `cc-regime-indicators` | `0 8 1 * *` (1st of month) | Oracle | Full regime indicator update |
| `cc-prediction-audit` | `0 8 1 * *` (1st of month) | Analyst | Resolve predictions, update scorecard |

**Existing cron jobs that continue unchanged:**
- `cc-sr-monitor` (S/R level detection, 4x/day)
- `cc-thesis-monitor` (thesis price level alerts, 3x/day)
- `cc-portfolio-monitor` (portfolio position tracking, 3x/day)
- `cc-smart-money` (smart money tweet scan, Mon+Thu)

---

## 8. File Structure

```
projects/claw-capital/
├── SPEC.md                           # Master system spec (existing)
├── portfolio.json                    # Current positions (existing)
├── smart-money.json                  # Trusted accounts (existing)
│
├── crypto-desk/
│   ├── ARCHITECTURE.md               # This document
│   │
│   ├── agents/
│   │   ├── analyst/
│   │   │   ├── SOUL.md               # Analyst agent persona
│   │   │   └── config.json           # Data source configs, review schedules
│   │   ├── sentinel/
│   │   │   ├── SOUL.md               # Sentinel agent persona
│   │   │   └── config.json           # Thresholds, monitored assets, scan intervals
│   │   ├── risk-manager/
│   │   │   ├── SOUL.md               # Risk manager persona
│   │   │   └── config.json           # Risk limits, concentration caps, correlation thresholds
│   │   └── execution-structurer/
│   │       ├── SOUL.md               # Execution structurer persona
│   │       └── config.json           # Sizing rules, DCA defaults
│   │
│   ├── theses/
│   │   ├── BTC.md                    # Per-asset thesis documents
│   │   ├── HYPE.md
│   │   ├── AAVE.md
│   │   ├── MORPHO.md
│   │   ├── PENDLE.md
│   │   └── _archive/                # Invalidated theses (with outcome notes)
│   │
│   ├── coverage/
│   │   ├── universe.json             # Current coverage list with tiers
│   │   └── sectors.json              # Sector definitions and watchlist
│   │
│   └── reports/
│       ├── weekly/                   # Weekly conviction rankings + desk summary
│       │   └── 2026-W08.md
│       └── reviews/                  # Thesis review logs
│           └── 2026-02-18-morpho.md
│
├── alerts/
│   └── config/
│       └── thesis-levels.json        # Price alert levels (existing, extend for crypto desk)
│
signals/
└── crypto-desk/
    ├── pending/
    ├── acknowledged/
    ├── completed/
    └── archive/
```

---

## 9. Data Sources — Unified Inventory

Every data source the desk uses, how to access it, and which agents consume it.

### 9.1 On-Chain & Market Data

| Source | Access Method | What It Provides | Used By | Rate Limits / Cost |
|--------|-------------|-----------------|---------|-------------------|
| **Allium API** | REST API, credentials at `~/.allium/credentials` | Token prices, wallet balances, DEX volumes, transfers, custom SQL | Analyst, Sentinel | Pay-per-query |
| **Hyperliquid API** | REST via web_fetch (`info.hyperliquid.xyz`) | Funding rates, open interest, perp volumes, order book, liquidations | Sentinel, Analyst | Free, no auth |
| **DeFiLlama API** | REST via web_fetch (`api.llama.fi`) | TVL by protocol/chain, protocol revenue, fee data, stablecoin supply | Analyst, Regime | Free, no auth |
| **CoinGecko API** | REST via web_fetch (`api.coingecko.com`) | Market cap, FDV, circulating supply, global market data, BTC dominance | Analyst, Regime | Free tier: 10-30 calls/min |

### 9.2 Social & Narrative

| Source | Access Method | What It Provides | Used By |
|--------|-------------|-----------------|---------|
| **X/Twitter** | x-research skill (`~/.config/env/global.env` bearer token) | Smart money tweets, narrative detection, sentiment, first-mention alerts | Analyst, Sentinel |
| **Discord servers** | Manual input from Alex | Private alpha, thesis discussions | Analyst (via manual feed) |
| **Telegram groups** | Manual input from Alex | Same | Analyst (via manual feed) |

### 9.3 Macro & Cycle

| Source | Access Method | What It Provides | Used By |
|--------|-------------|-----------------|---------|
| **ITC Premium Dashboard** | Browser tool → `app.intothecryptoverse.com` (Alex logged in) | BTC risk bands, cycle fractals, macro recession risk, DCA simulations | Oracle (regime) |
| **ITC YouTube (public)** | yt-dlp transcripts or manual summary | Cowen's cycle analysis, monetary policy → BTC mapping | Oracle (regime) |
| **FRED** | Web fetch (`fred.stlouisfed.org`) | Fed funds rate, yield curve, CPI, unemployment | Oracle (regime) |
| **TradingView** | Web fetch for public charts | S/R levels, technical patterns | Analyst |

### 9.4 Protocol-Specific

| Source | Access Method | What It Provides | Used By |
|--------|-------------|-----------------|---------|
| **Token Terminal** | Web fetch (`tokenterminal.com`) | Protocol revenue, P/S ratios, earnings | Analyst |
| **TokenUnlocks** | Web fetch (`token.unlocks.app`) | Vesting schedules, upcoming unlocks | Analyst, Risk Manager |
| **Snapshot / Tally** | Web fetch | Governance proposals | Analyst |
| **GitHub** | gh CLI | Protocol development activity | Analyst |

### 9.5 Data Gaps (Known)

| Gap | Impact | Mitigation |
|-----|--------|-----------|
| YouTube transcripts require auth | Can't auto-extract ITC video content | Manual summary or find transcript API solution |
| Korean/Japanese exchange data (KRX, TSE) | Can't price Samsung, SK Hynix, etc. | Use ADR prices via TwelveData (free tier) |
| Options flow data | Missing derivatives positioning signals | Future: Unusual Whales or similar API |
| CEX order book depth | Missing liquidity/support data | Future: Exchange APIs |

---

## 10. Quality Control — Thesis Accuracy Tracking

Inspired by quantitative signal verification (in-sample hypothesis → out-of-sample result), every thesis must contain **testable predictions with timeframes**. The system tracks hit rates to measure and improve thesis quality over time.

### 9.1 Prediction Format

Every thesis must include 3-5 explicit, measurable predictions:

```json
{
  "asset": "HYPE",
  "predictions": [
    {
      "id": "HYPE-P1",
      "statement": "Protocol revenue exceeds $50M annualized by Q2 2026",
      "metric": "protocol_revenue_annualized",
      "target": 50000000,
      "operator": ">=",
      "deadline": "2026-06-30",
      "category": "fundamental",
      "status": "open",
      "result": null,
      "result_date": null,
      "actual_value": null
    },
    {
      "id": "HYPE-P2",
      "statement": "Perp DEX market share stays above 40% through 2026",
      "metric": "perp_dex_market_share_pct",
      "target": 40,
      "operator": ">=",
      "deadline": "2026-12-31",
      "category": "competitive",
      "status": "open",
      "result": null,
      "result_date": null,
      "actual_value": null
    },
    {
      "id": "HYPE-P3",
      "statement": "Token buyback mechanism activated by Q3 2026",
      "metric": "buyback_active",
      "target": true,
      "operator": "==",
      "deadline": "2026-09-30",
      "category": "catalyst",
      "status": "open",
      "result": null,
      "result_date": null,
      "actual_value": null
    }
  ]
}
```

**Prediction categories:**
- `fundamental` — revenue, TVL, user growth targets
- `competitive` — market share, relative positioning
- `catalyst` — specific events with deadlines
- `price` — price reaching specific levels within timeframe
- `macro` — external conditions the thesis depends on

### 9.2 Automated Verification

The Analyst agent runs a **prediction audit** on a scheduled basis:

| Category | Check Frequency | Data Source |
|----------|----------------|-------------|
| `fundamental` | Monthly | Allium, DeFiLlama |
| `competitive` | Monthly | DeFiLlama, protocol dashboards |
| `catalyst` | Weekly | Web search, governance forums, X |
| `price` | Daily (via Sentinel) | Price feeds |
| `macro` | Monthly | Web search, macro data |

When a prediction's deadline arrives:
1. Analyst pulls the actual value from the data source
2. Compares against target with the specified operator
3. Marks `status` as `hit` or `miss`, records `actual_value` and `result_date`
4. If a **critical prediction misses** (one the thesis depends on), triggers automatic thesis review
5. Results logged to `reports/prediction-tracker.json`

### 9.3 Thesis Scorecard

Aggregated across all theses, the system maintains a running scorecard:

```json
{
  "last_updated": "2026-06-30",
  "overall": {
    "total_predictions": 47,
    "resolved": 31,
    "open": 16,
    "hit_rate": 0.645,
    "hit_rate_by_category": {
      "fundamental": 0.72,
      "competitive": 0.58,
      "catalyst": 0.50,
      "price": 0.67,
      "macro": 0.80
    }
  },
  "by_asset": {
    "HYPE": {"predictions": 5, "resolved": 3, "hits": 2, "hit_rate": 0.667},
    "AAVE": {"predictions": 5, "resolved": 4, "hits": 3, "hit_rate": 0.750},
    "MORPHO": {"predictions": 4, "resolved": 2, "hits": 1, "hit_rate": 0.500}
  },
  "by_conviction_level": {
    "8-10": {"count": 12, "hit_rate": 0.75},
    "6-7": {"count": 15, "hit_rate": 0.60},
    "4-5": {"count": 4, "hit_rate": 0.50}
  },
  "thesis_outcomes": {
    "total_theses": 8,
    "hit_target": 3,
    "stopped_out": 1,
    "invalidated": 2,
    "active": 2
  }
}
```

### 9.4 Feedback Loops

The scorecard drives systematic improvement:

1. **Category calibration:** If `catalyst` predictions hit at only 50% but `fundamental` at 72%, the Risk Manager adjusts — theses that depend heavily on specific catalysts get lower base-rate confidence
2. **Conviction calibration:** If conviction 8-10 theses only hit at 60%, either the conviction scoring is inflated or the bar for high conviction needs to rise
3. **Asset pattern recognition:** If theses on DeFi lending consistently outperform theses on AI tokens, the Analyst adjusts research focus
4. **Monthly Risk Manager review:** Risk Manager incorporates scorecard data into every `risk_review` — "Our base rate for this type of thesis is X%"

### 9.5 Thesis Lifecycle with Quality Gates

```
THESIS CREATED (with 3-5 testable predictions)
        │
        ▼
   ACTIVE — predictions being tracked
        │
        ├── Prediction HIT → confidence strengthened
        ├── Prediction MISS → trigger review
        │     │
        │     ├── Non-critical miss → update thesis, adjust levels
        │     └── Critical miss → INVALIDATION REVIEW
        │           │
        │           ├── Thesis still viable (adjusted) → downgrade conviction
        │           └── Thesis broken → INVALIDATED (exit plan if held)
        │
        ▼ (all predictions resolved OR price target hit)
   COMPLETED — outcome recorded
        │
        ▼
   ARCHIVED with full audit trail
```

---

## 10. Autonomous Asset Discovery

The desk includes a structured discovery pipeline that agents run autonomously. Discovery surfaces candidates for Alex's review — agents **never self-approve** additions to the coverage universe.

### 10.1 Discovery Levels

| Level | Agent | Autonomous? | Output |
|-------|-------|------------|--------|
| **L1: Narrative Detection** | Analyst | ✅ Fully | Emerging themes from smart money clustering |
| **L2: Universe Mapping** | Analyst | ✅ Fully | All tokens in detected narrative, filtered by minimums |
| **L3: Fundamental Screening** | Analyst | ✅ Fully | Top 2-3 candidates ranked by quant metrics |
| **L4: Thesis Draft** | Analyst + Risk Manager | ✅ Autonomous draft | Full thesis proposal with risk review |
| **L5: Coverage Approval** | Alex | ❌ Human only | Add to coverage universe or reject |

### 10.2 Narrative Detection Engine

**Runs:** Weekly (Sunday, before thesis reviews)

**Method:**
1. Pull last 7 days of tweets from smart money accounts (30-50 accounts in `smart-money.json`)
2. LLM classifies each tweet by narrative theme (taxonomy maintained in `coverage/narratives.json`)
3. Count theme frequency this week vs. 4-week rolling average
4. Flag narratives where frequency increased >2x AND mentioned by 3+ independent accounts

**Narrative Taxonomy (starting set):**
```json
{
  "narratives": [
    "defi_lending", "defi_yield", "defi_perps", "defi_stablecoins",
    "l1_alt", "l2_scaling", "restaking", "liquid_staking",
    "ai_tokens", "ai_agents", "depin", "rwa_tokenization",
    "gaming_onchain", "social_onchain", "privacy", "memecoins",
    "btc_ecosystem", "cross_chain", "intent_based", "onchain_credit"
  ]
}
```

New narratives can be added when detected themes don't fit existing categories.

**Output:**
```json
{
  "type": "discovery_briefing",
  "timestamp": "2026-02-23T08:00:00Z",
  "narratives_detected": [
    {
      "theme": "onchain_credit",
      "this_week_mentions": 14,
      "avg_4w_mentions": 3,
      "growth_multiple": 4.7,
      "accounts": ["@insomniacxbt", "@izebel_eth", "@Pivot922"],
      "representative_tweets": ["tweet_id_1", "tweet_id_2"],
      "existing_coverage": ["AAVE", "MORPHO", "SYRUP"],
      "uncovered_candidates": ["CPOOL", "MAPLE", "GOLDFINCH"]
    }
  ]
}
```

### 10.3 Fundamental Screening Criteria

When a narrative surfaces uncovered candidates, the Analyst screens them automatically:

**Hard Filters (must pass all):**
- Market cap > $50M
- DEX or CEX liquidity > $1M daily volume
- Protocol is live (not testnet/vaporware)
- Token has value accrual mechanism (not governance-only)
- No major exploit in last 6 months
- Team is identifiable (not fully anonymous)

**Ranking Metrics (scored and weighted):**

| Metric | Weight | Source | Why |
|--------|--------|--------|-----|
| Revenue / FDV | 30% | DeFiLlama, Token Terminal | Cheapest by fundamental value |
| Revenue growth (30d vs 90d) | 25% | DeFiLlama | Accelerating or decelerating |
| TVL growth (30d) | 15% | DeFiLlama | Capital inflows |
| Unique address growth (30d) | 10% | Allium | Real adoption |
| FDV relative to sector median | 10% | CoinGecko | Relative valuation |
| Insider/VC unlock in next 6mo | 10% | TokenUnlocks, manual | Selling pressure ahead |

**Output:** Top 2-3 candidates per narrative with composite scores. Delivered to Oracle as a `thesis_proposal` with `discovery_source: "autonomous_screen"` flag.

### 10.4 Smart Money First-Mention Detection

**Runs:** Daily (part of Sentinel's scan)

**Logic:** Track all assets mentioned by smart money accounts. When an account mentions a token **for the first time ever** (not in their historical mention set):

1. Flag immediately as `anomaly_alert` with type `smart_money_first_mention`
2. Include: who mentioned it, what they said, current market data
3. Route to Analyst for initial screen if it passes hard filters

**Why this works:** Smart money accounts develop coverage universes over time. A first-time mention from an account that's historically been accurate signals genuine new interest, not routine commentary.

### 10.5 Source Quality — Human-Curated, Not Automated

**Critical design principle:** The quality of narrative sources is managed exclusively by Alex. Agents never auto-trust a new source.

**How it works:**

All narrative detection draws from a **graded source list** maintained in `coverage/sources.json`:

```json
{
  "sources": [
    {
      "handle": "@insomniacxbt",
      "platform": "twitter",
      "grade": "A",
      "graded_date": "2026-02-15",
      "notes": "Consistently early on DeFi. Morpho > AAVE call was correct.",
      "sectors": ["defi_lending", "defi_yield"],
      "weight": 10
    },
    {
      "handle": "@izebel_eth",
      "platform": "twitter",
      "grade": "B",
      "graded_date": "2026-02-15",
      "notes": "Good on HYPE + LIT. Sometimes shills own bags.",
      "sectors": ["defi_perps", "l1_alt"],
      "weight": 6
    },
    {
      "id": "citrini_discord",
      "platform": "discord",
      "grade": "A",
      "graded_date": "2026-02-16",
      "notes": "Citrini Research private channel. Institutional quality.",
      "sectors": ["all"],
      "weight": 10
    }
  ]
}
```

**Grading scale:**
- **A** (weight 10): Proven track record, original research, consistently early. Full trust in narrative signals.
- **B** (weight 6): Generally good but occasional noise. Useful signal, verify before acting.
- **C** (weight 3): Interesting perspective but unproven. Monitor only — not weighted in narrative detection.
- **Ungraded** (weight 0): Not yet reviewed by Alex. **Cannot influence narrative scores or discovery.**

**When agents encounter a new source:**

If during a scan an agent finds a compelling post from an **ungraded account**, the agent:
1. Does NOT incorporate it into any narrative scoring or discovery pipeline
2. Fires a `source_review_request` to Oracle with:
   - Account handle + platform
   - The specific post that caught attention
   - Account stats (followers, posting frequency, sector focus)
   - Why it seemed relevant
3. Oracle surfaces this to Alex as a low-priority prompt: "New account spotted discussing [topic]. Worth grading?"
4. Alex reviews, assigns a grade (A/B/C or reject), and the account enters the source list
5. Only THEN do that account's posts count in future scans

**Source review request format:**
```json
{
  "type": "source_review_request",
  "payload": {
    "handle": "@newaccount",
    "platform": "twitter",
    "detected_in": "weekly_narrative_scan",
    "trigger_post": {
      "text": "Thread about onchain credit markets...",
      "url": "https://x.com/...",
      "engagement": {"likes": 450, "impressions": 28000}
    },
    "account_stats": {
      "followers": 12000,
      "account_age_days": 890,
      "avg_engagement": 200
    },
    "suggested_sectors": ["onchain_credit", "defi_lending"],
    "reason": "First account spotted discussing institutional credit vaults with technical depth. Not in current source list."
  }
}
```

**This applies to all platforms:** Twitter accounts, Discord servers, Telegram groups. No source enters the quality-weighted pipeline without Alex's manual grade.

**Periodic re-grading:** During monthly reviews, Alex can upgrade/downgrade sources based on accuracy. An A-grade source that starts shilling gets downgraded. A C-grade source that proves prescient gets upgraded.

### 10.6 Discovery Cadence

| Activity | Frequency | Agent |
|----------|-----------|-------|
| Smart money first-mention scan | Daily | Sentinel |
| Narrative theme tracking | Weekly | Analyst |
| Sector watchlist scan | Monthly | Analyst |
| Full discovery briefing to Alex | Weekly (Sunday digest) | Oracle |

### 10.7 Discovery → Coverage Pipeline

```
NARRATIVE DETECTED (weekly scan)
        │
        ▼
UNIVERSE MAPPED (all tokens in narrative)
        │
        ▼
HARD FILTERS APPLIED (minimums: mcap, liquidity, live product)
        │
        ▼
FUNDAMENTAL SCREENING (ranked by composite score)
        │
        ▼
TOP 2-3 CANDIDATES (with scores + data snapshots)
        │
        ▼
ANALYST: Draft thesis (thesis_proposal with discovery flag)
        │
        ▼
RISK MANAGER: Review (same process as any thesis)
        │
        ▼
ORACLE: Weekly discovery digest to Alex
        │
        ▼
ALEX: Approve → enters coverage universe
       Reject → archived with reason
       Defer → re-scan next month
```

**Key constraint:** The discovery pipeline generates a **maximum of 3 candidates per week**. More than that is noise. Quality > quantity.

---

## 11. Implementation Plan

### Phase 1: Foundation (Week 1) — **BUILD FIRST**

**Goal:** Analyst agent producing thesis docs for top 3 assets with testable predictions.

- [ ] Create directory structure (`crypto-desk/agents/`, `theses/`, `coverage/`, `signals/crypto-desk/`)
- [ ] Write SOUL.md files for all 4 agents
- [ ] Write `coverage/universe.json` with initial coverage list
- [ ] Write `coverage/narratives.json` with initial narrative taxonomy
- [ ] Write thesis docs for **HYPE**, **AAVE**, **MORPHO** using the template — each with 3-5 testable predictions
- [ ] Initialize `reports/prediction-tracker.json` with all predictions
- [ ] Define `agents/analyst/config.json` with data source configs
- [ ] Test Analyst as a cron subagent: can it pull Allium + DeFiLlama data and write a thesis?

**Why first:** Everything downstream depends on thesis docs existing. Predictions baked in from day one so tracking starts immediately.

### Phase 2: Risk Layer (Week 2)

**Goal:** Risk Manager reviewing every thesis + quality control baseline.

- [ ] Write `agents/risk-manager/config.json` with risk limits:
  - Max single position: 5% portfolio
  - Max sector concentration: 30%
  - Max crypto allocation: 40% total portfolio
  - Minimum R:R for approval: 3:1
- [ ] Implement risk_review signal generation
- [ ] Run Risk Manager against the 3 Phase 1 theses
- [ ] Initialize `reports/thesis-scorecard.json` with baseline data
- [ ] Establish base rate tracking (starting assumption: 50% hit rate, calibrate over time)

### Phase 3: Sentinel + Discovery (Week 2-3)

**Goal:** Automated anomaly detection + weekly discovery briefing.

- [ ] Write `agents/sentinel/config.json` with thresholds per anomaly type
- [ ] Implement hourly price check cron for covered crypto assets
- [ ] Implement level proximity alerts (integrate with `thesis-levels.json`)
- [ ] Implement volume spike detection
- [ ] Implement smart money first-mention detection (daily)
- [ ] Implement weekly narrative detection scan
- [ ] Test end-to-end: Sentinel anomaly → Oracle routes → Analyst screens
- [ ] Test end-to-end: narrative detected → universe mapped → candidates screened → digest to Alex

### Phase 4: Execution Structuring (Week 3)

**Goal:** Approved theses get concrete entry plans.

- [ ] Implement execution_plan signal generation
- [ ] Run Execution Structurer against approved theses
- [ ] Deliver first complete pipeline to Alex: thesis → risk review → execution plan → Telegram

### Phase 5: Full Pipeline + Automation (Week 4)

**Goal:** System runs autonomously with quality tracking.

- [ ] Set up cron jobs for all agents:
  - Analyst weekly review: `0 8 * * 0` (Sunday 8am UTC)
  - Analyst weekly discovery scan: `0 6 * * 0` (Sunday 6am UTC, before reviews)
  - Sentinel hourly scan: `0 * * * *`
  - Sentinel smart money first-mention: `0 9 * * *` (daily 9am UTC)
  - Risk Manager weekly portfolio review: `0 10 * * 1` (Monday 10am UTC)
  - Prediction audit: `0 8 1 * *` (1st of each month)
- [ ] Implement signal lifecycle management (expiry, archival)
- [ ] Build weekly digest: conviction rankings + discovery candidates + prediction updates
- [ ] Implement thesis invalidation workflow end-to-end
- [ ] Add Tier 2 assets (LIT, ETHFI, SKY, SYRUP, VVV)

### Phase 6: Refinement (Ongoing)

- [ ] Monthly prediction audit: resolve predictions, update scorecard
- [ ] Quarterly calibration: adjust conviction scoring based on hit rates
- [ ] Calibrate Sentinel thresholds based on false positive rates
- [ ] Calibrate discovery screen weights based on which candidates become successful theses
- [ ] Expand narrative taxonomy as new themes emerge
- [ ] Build monthly desk performance report
- [ ] Iterate on signal schema based on actual usage

---

## Appendix: Design Decisions

### Why file-based signals instead of a database?
Alex's system runs on OpenClaw with cron subagents. Files are debuggable (just `cat` them), require no infrastructure, and work perfectly with the existing architecture. A database adds complexity with no benefit at this scale.

### Why cap Tier 1 at 5 assets?
Attention is the scarcest resource. Alex is a solo investor. 5 deep theses with full monitoring >> 20 shallow ones. The constraint forces prioritization.

### Why does Risk Manager have veto power?
Because the biggest risk for a solo investor isn't missing a trade — it's blowing up on concentration or correlation. The adversarial structure prevents the common failure mode where conviction becomes stubbornness.

### Why Citrini-style theses?
Because Citrini's framework (from htf-thesis.md) produces actionable analysis: clear moats, specific price levels, honest assessments of "is this actually a buy TODAY?" Most crypto research is narrative hype without price discipline. The Citrini style forces rigor.

### Why separate Sentinel from Analyst?
Detection and interpretation are different skills with different failure modes. Sentinel optimizes for "don't miss anything" (high recall). Analyst optimizes for "don't be wrong" (high precision). Combining them creates a system that either misses signals or generates false theses.

### Why no direct execution?
From SPEC.md: "The system finds signals; Alex decides and executes. Keeps risk management human." This is a decision support system, not a trading bot.

### Why testable predictions on every thesis?
Inspired by quantitative signal verification: every thesis is a hypothesis. Without measurable, time-bound predictions, there's no way to know if the Analyst is good or just confident. Tracking hit rates over time is the desk's version of a Sharpe ratio on fundamental calls. It also forces intellectual honesty — vague theses can't be wrong, which means they can't be right either.

### Why autonomous discovery but human-gated approval?
Agents can detect patterns (narrative clustering, smart money first-mentions, fundamental screening) better than a human scanning manually. But the decision to commit research time and eventually capital to an asset requires judgment about opportunity cost, portfolio fit, and conviction that agents can't reliably make. Discovery Levels 1-4 are automatable; Level 5 (coverage approval) is where human judgment earns its keep.

### Why cap discovery at 3 candidates per week?
Same principle as capping Tier 1 at 5 assets. The failure mode for discovery isn't missing something — it's drowning in "interesting" candidates that dilute attention from high-conviction positions. 3 candidates per week is enough to surface real opportunities; more than that becomes noise.
