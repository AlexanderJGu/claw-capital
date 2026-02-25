# Weekly Portfolio Risk Review — 2026-02-19

> **Agent:** Risk Manager | **Regime:** Bear (high confidence) | **Review Date:** 2026-02-19 10:00 UTC

---

## 1. Current Portfolio Snapshot

| Asset | Amount | Price (CoinGecko) | Value | % of Portfolio |
|-------|--------|-------------------|-------|----------------|
| USDC (HL spot) | 89,956 | $1.00 | $89,956 | 17.8% |
| USDC (HL perps) | 149,873 | $1.00 | $149,873 | 29.6% |
| BTC (HL spot) | 0.6310 | $66,818 | $42,178 | 8.3% |
| HYPE (HL spot) | 137.71 | $28.66 | $3,947 | 0.8% |
| USDC (Base) | 18,690 | $1.00 | $18,707 | 3.7% |
| USDC (Solana) | 999 | $1.00 | $999 | 0.2% |
| SOL | 0.49 | $81.19 | $40 | 0.0% |
| ETH | 0.009 | $1,963 | $17 | 0.0% |
| Coinbase (offchain) | — | — | $200,000 | 39.5% |
| **Total Liquid** | | | **$505,717** | **100%** |

*Note: Base memecoins (KellyClaude, $ROVER, COINBASE, UP) excluded — illiquid/worthless.*

### Allocation Breakdown
- **Stablecoins/Cash:** $459,535 (90.9%)
- **BTC:** $42,178 (8.3%)
- **HYPE:** $3,947 (0.8%)
- **Other (SOL/ETH):** $57 (dust)

---

## 2. Risk Limit Checks

| Limit | Threshold | Current | Status |
|-------|-----------|---------|--------|
| Max single position | ≤5% | BTC @ 8.3% | ⚠️ **BREACH** |
| Max sector concentration | ≤30% | L1/SoV (BTC) @ 8.3% | ✅ Pass |
| Max total crypto allocation | ≤40% | ~9.1% | ✅ Pass |
| Max correlated pair combined | ≤8% | BTC+HYPE @ 9.1% | ⚠️ **BREACH** |

### Limit Breach Details

**1. BTC single position: 8.3% vs 5% limit (+3.3% over)**
BTC is the only material risk position. At $42.2K notional it exceeds the 5% cap by ~$16.7K. This was likely accumulated before risk limits were formalized.

**Recommended action:** Trim BTC to ≤$25,300 (5% of $505K) or document an explicit exception. Given bear regime and BTC buy zone of $40-50K (currently at $66.8K — above buy zone), trimming is the risk-appropriate move.

**2. Correlated pair (BTC + HYPE): 9.1% vs 8% limit (+1.1% over)**
BTC and HYPE are highly correlated in drawdowns. HYPE beta to BTC is estimated 1.5-2x. Combined exposure of 9.1% marginally exceeds the 8% pair cap. Minor breach given HYPE is only 0.8%.

---

## 3. Cross-Asset Correlation Assessment

**Effective positions: 1.**

All risk exposure is a single bet: long crypto beta. BTC ($42.2K) and HYPE ($3.9K) will move together in a selloff. There is zero diversification within the risk book. The portfolio is effectively 91% cash + 9% crypto beta.

**This is actually appropriate for a bear regime.** High cash allocation is defensive. The concern is not correlation risk — it's that the single BTC position is oversized relative to the stated risk limits.

---

## 4. Regime Appropriateness

**Current regime:** Bear (since 2026-01-15)
**Desk posture:** Defensive — small sizes, wide DCA ranges, focus on research.

| Check | Assessment |
|-------|------------|
| Position sizing | Mostly appropriate (91% cash), but BTC >5% limit |
| Asset selection | BTC is correct for bear accumulation; HYPE is high-beta, risky in bear |
| Buy zone alignment | BTC at $66.8K is **above** the $40-50K buy zone — position was likely entered higher |
| Thesis coverage | 5 thesis docs (BTC, HYPE, AAVE, MORPHO, PENDLE) — no positions in AAVE/MORPHO/PENDLE yet (correct: waiting for buy zones) |
| Discovery pipeline | Active — appropriate for bear |

**Assessment: Portfolio posture is broadly consistent with bear regime.** The high cash allocation is correct. However, the BTC position was entered above the thesis buy zone, which conflicts with the disciplined DCA framework.

---

## 5. Stress Tests

### Scenario 1: BTC -50% ($66.8K → $33.4K)
| Position | Current Value | Stressed Value | Loss |
|----------|--------------|----------------|------|
| BTC | $42,178 | $21,089 | -$21,089 |
| HYPE (est. -65% beta) | $3,947 | $1,381 | -$2,566 |
| **Portfolio total** | **$505,717** | **$482,062** | **-$23,655 (-4.7%)** |

**Verdict:** Survivable. Portfolio drawdown <5% even in a catastrophic BTC crash. Cash buffer provides massive protection.

### Scenario 2: ETH -60% (general alt contagion)
- Direct ETH exposure: $17 (immaterial)
- HYPE indirect impact: estimated -70% → loss of ~$2,763
- **Portfolio impact: -$2,780 (-0.5%)**
- **Verdict:** Negligible. No meaningful ETH exposure.

### Scenario 3: DeFi Lending Exploit (AAVE/MORPHO contagion)
- No positions in AAVE, MORPHO, or SYRUP
- **Verdict:** Zero impact. Watchlist-only.

### Scenario 4: Stablecoin Depeg (USDC)
- USDC exposure: ~$259,535 (51.3% of portfolio)
- A 5% USDC depeg → $12,977 loss (2.6%)
- A full depeg → catastrophic
- **Verdict:** Major concentration risk in USDC. Consider diversifying stablecoin exposure across USDT/DAI/USDS if > $100K in any single stable.

### Scenario 5: Exchange Risk (Hyperliquid)
- $286,000 (56.5%) sitting on Hyperliquid (spot + perps accounts)
- Hyperliquid hack/exploit → potential total loss of $286K (56.5%)
- **Verdict:** ⚠️ **SIGNIFICANT CONCENTRATION RISK.** Over half the portfolio on a single venue with no insurance/FDIC. This is the #1 risk in the portfolio.

---

## 6. Key Findings & Flags for Oracle

### 🔴 Critical
1. **Hyperliquid venue concentration: 56.5% of portfolio on one DEX.** This is the single largest risk factor. A smart contract exploit, bridge hack, or sequencer failure could wipe >$280K. Recommend capping single-venue exposure at 30% and distributing stables across 2-3 venues/wallets.

### 🟡 Warnings
2. **BTC position exceeds 5% single-asset limit (8.3%).** Trim ~$16.9K or formally raise the limit with documented reasoning.
3. **BTC entry above thesis buy zone.** Position at $66.8K when thesis buy zone is $40-50K. Either the thesis needs updating to justify the entry, or this was a pre-framework position that should be evaluated for trim.
4. **USDC concentration: 51% in a single stablecoin.** Diversify across 2-3 stablecoins if possible.

### 🟢 Positives
5. **91% cash allocation is appropriate for bear regime.** Well-positioned for accumulation opportunities.
6. **No positions in assets still above buy zones** (AAVE, MORPHO, PENDLE on watchlist only). Discipline is holding.
7. **Stress test results are manageable.** Even a 50% BTC crash only hits the portfolio for <5%.
8. **Research pipeline is active** — 5 thesis docs with testable predictions. Framework is sound.

---

## 7. Action Items

| Priority | Action | Owner |
|----------|--------|-------|
| 🔴 HIGH | Reduce Hyperliquid venue exposure to ≤30% ($152K). Move ~$134K of USDC to Coinbase or self-custody. | Alex |
| 🟡 MED | Trim BTC to ≤5% ($25.3K) or document exception | Alex/Oracle |
| 🟡 MED | Diversify USDC across USDT + DAI/USDS | Alex |
| 🟢 LOW | Add invalidation levels to BTC position (where do we exit?) | Oracle |

---

*Next review: 2026-02-26. Risk Manager agent, Claw Capital Crypto Desk.*
