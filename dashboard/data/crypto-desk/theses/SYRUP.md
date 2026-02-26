# SYRUP — Thesis Document

> **Protocol:** Maple Finance (Syrup)
> **Category:** Institutional Under-Collateralized Lending
> **Chain:** Ethereum, Solana
> **Last Updated:** 2026-02-25
> **Conviction:** 4 | **Status:** Watchlist
> **Analyst:** Crypto Desk Analyst
> **Risk Review:** Pending

---

## 1. One-Line Thesis

Maple Finance is the only institutional-grade under-collateralized lending protocol at scale in DeFi — bridging TradFi credit markets to on-chain with real credit spreads, real borrowers, and real defaults (which is actually a feature, proving the market works) — the highest risk/lowest conviction name on the watchlist.

## 2. The Narrative

Under-collateralized lending is the holy grail of DeFi lending. Over-collateralized lending (Aave, Morpho) is useful but fundamentally limited — requiring $150+ collateral for every $100 borrowed is capital-inefficient. Traditional lending works on credit assessment: evaluate the borrower, price the risk, lend uncollateralized. Maple does this on-chain.

The protocol operates lending pools managed by "pool delegates" — institutional credit managers who assess borrower creditworthiness and set terms. Borrowers are institutional: trading firms, crypto funds, market makers who need working capital without posting their entire portfolio as collateral. Lenders (liquidity providers) earn credit spreads — real yields from real lending, not emission-funded farming.

The rename from MPL to SYRUP reflects the protocol's evolution toward "Syrup" — a yield product that makes institutional lending accessible to retail. The dual-chain deployment (Ethereum + Solana) expands addressable market.

The honest assessment: This is the riskiest name on the watchlist. Under-collateralized lending has a poor track record in crypto — Maple itself had significant defaults in 2022 (Orthogonal Trading, ~$36M loss). The protocol has rebuilt and improved risk management, but the fundamental risk of counterparty default remains. At ~$1M mcap per CoinGecko data (likely stale/incorrect), the token pricing is unclear. This is a speculative position — smallest allocation, widest stops.

## 3. Fundamentals

### Protocol Metrics
| Metric | Value | Trend | Comparable |
|--------|-------|-------|------------|
| TVL | TBD — DeFiLlama shows multi-chain | — | — |
| Active Loans | TBD — data source needed | — | Centrifuge, Goldfinch (smaller) |
| Protocol Revenue | From credit spreads | — | — |
| FDV | TBD — CoinGecko gecko_id null | — | — |
| Circulating Mcap | TBD — data stale | — | — |
| Chains | Ethereum, Solana | — | — |
| Oracle | Chainlink (primary) | — | — |

### Tokenomics
- **Supply schedule:** SYRUP token replaced MPL. Details limited on public APIs.
- **Value accrual:** Governance token. Credit spread participation TBD.
- **Holder distribution:** VC-backed. Institutional LPs.

### Competitive Position
- **Moat:** First-mover in institutional under-collateralized DeFi lending. Pool delegate model creates professional credit assessment layer. Track record (including default recovery) provides credibility.
- **Competitors:** Goldfinch (emerging market focus), Centrifuge (RWA lending), TrueFi (pivoting). Morpho curated vaults could encroach on this space.
- **Market share:** Niche market. Dominant in institutional under-collateralized crypto lending specifically.

## 4. Catalysts

| Catalyst | Timeframe | Impact | Probability |
|----------|-----------|--------|-------------|
| Institutional lending demand recovery | 2026-2027 | High | Medium |
| Solana deployment growth | 2026 | Medium | Medium |
| Syrup retail yield product adoption | 2026 | Medium | Medium |
| RWA lending expansion | 2026-2027 | High | Medium-Low |
| Regulatory clarity for on-chain credit | 2026-2028 | Very High | Low |

## 5. Bear Case (Required — Non-Negotiable)

1. **Default risk:** The biggest risk — period. Under-collateralized lending means borrowers can default and lenders lose principal. Maple has already experienced this (Orthogonal Trading 2022). In a bear market, institutional borrowers are more likely to blow up. One major default could destroy the protocol's reputation permanently.

2. **Data transparency risk:** Cannot verify current TVL, revenue, or market cap through standard APIs. CoinGecko gecko_id is null. This opacity is a red flag — if we can't measure it, we can't track it.

3. **Competition risk:** Morpho's curated vault model can replicate under-collateralized lending with better UX and more liquidity. Aave could add credit assessment layers. The moat is thin.

4. **Token risk:** SYRUP tokenomics are opaque. The MPL → SYRUP transition adds confusion. Without clear value accrual or verified market cap, this is essentially a blind bet on the protocol's success.

5. **Macro risk:** Under-collateralized lending thrives when institutional crypto activity is high. In a bear market, borrowing demand collapses, credit spreads widen (good for yield but bad for volume), and default risk spikes.

## 6. Price Levels & Structure

### HTF Structure
- **Trend:** Unclear — limited price data available through standard APIs.
- **Timeframe:** N/A
- **Key observation:** Using universe.json price of $0.26. Data reliability is LOW.

### Levels
| Level | Price | Type | Notes |
|-------|-------|------|-------|
| Current | $0.26 | — | Feb 25, est. — DATA UNRELIABLE |
| Watch Upper | $0.24 | Watch zone top | |
| Watch Lower | $0.21 | Watch zone bottom / Buy zone top | |
| Buy Core | $0.20 | Buy zone core | |
| Buy Lower | $0.18 | Buy zone bottom | |
| S3 | $0.15 | Major support | |
| Invalidation | $0.12 | Hard stop | |

### Trade Plan
- **Buy zone:** $0.18–$0.21 (requires ~19-31% decline)
- **Watch zone:** $0.21–$0.24 (requires ~8-19% decline)
- **Targets:** TP1: $0.40, TP2: $0.60, TP3: $1.00
- **Invalidation:** $0.12 (protocol failure or major default)
- **R:R at current price ($0.26):** ~1.0:1 to TP1 ($0.40) vs stop ($0.12) — POOR
- **R:R at base entry ($0.20):** ~2.5:1 to TP1 ($0.40) vs stop ($0.12) — MODERATE

## 7. Position Sizing

- **Max allocation:** 1% of portfolio (highest risk, lowest conviction)
- **Scaling plan:** 2-tranche DCA within buy zone ($0.18-$0.21)
- **Correlation note:** Correlated with DeFi lending sector (AAVE, MORPHO). Combined DeFi lending exposure must not exceed 30% sector cap per architecture.

## 8. Testable Predictions (Required — Automated Tracking)

| ID | Prediction | Metric | Target | Deadline | Category | Status |
|----|-----------|--------|--------|----------|----------|--------|
| SYRUP-P1 | Maple/Syrup TVL exceeds $500M across all deployments | total_tvl_usd | 500000000 | 2026-12-31 | fundamental | open |
| SYRUP-P2 | No major defaults (>$5M) occur in Maple pools through 2026 | major_default_count | 0 | 2026-12-31 | fundamental | open |
| SYRUP-P3 | SYRUP token gets listed on CoinGecko with verified market cap data | coingecko_verified | true | 2026-06-30 | fundamental | open |

**Critical predictions:** SYRUP-P2 — a major default would likely invalidate the thesis entirely. SYRUP-P3 — if we can't even verify market cap, the position is un-trackable.

## 9. Review Schedule

- **Next review:** 2026-03-25 (monthly)
- **Review trigger:** Price enters watch zone ($0.24), major default event, CoinGecko listing, institutional adoption milestone
- **Invalidation criteria:**
  - Major default >$5M in any Maple pool
  - Price below $0.12 for 3+ days
  - Protocol TVL drops below $100M
  - Team departure or regulatory action
- **Critical prediction miss:** Automatic review triggered if SYRUP-P2 misses (default event)

## 10. Audit Trail

| Date | Action | Details |
|------|--------|---------|
| 2026-02-25 | Thesis created | Weekly review cycle. Data: DeFiLlama (Maple protocol, Ethereum+Solana, Chainlink oracle), CoinGecko (gecko_id null — data unreliable). Lowest conviction in universe. Bear regime — smallest speculative position only. |
