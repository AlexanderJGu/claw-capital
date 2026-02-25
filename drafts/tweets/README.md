# Tweet Drafts Queue

Oracle generates tweet candidates daily (morning batch) plus after research sessions, smart money scans, and thesis work.
Alex reviews, edits, and approves before posting.

## Accounts

### @alexguuu — Official Personal Account
- **Voice:** Authentic, unfiltered, personal. Mix of building-in-public, hot takes, life observations. Not trying to be a "brand" — just a sharp 24yo builder who has strong opinions.
- **Style references:** @levelsio (indie hacking transparency), @pmarca (hot takes), @naval (concise wisdom)
- **Content:** Building updates (shipping logs, revenue milestones), hot takes on tech/crypto/AI, personal reflections on solo founding, retweet + commentary on interesting threads
- **Frequency target:** 1-3/day, casual voice
- **Rules:** Can be personal, opinionated, funny. Reference projects by name. This is Alex's main public identity.

### @manyfacedchud — Anon Trading Account
- **Voice:** Direct, concise, chart-first. No hedging. Conviction calls with levels.
- **Style references:** insomniacxbt, izebel_eth, KillaXBT
- **Content:** Chart + 1-2 line take, structural calls, contrarian positions, market structure observations
- **Frequency target:** 1-3/day when markets are moving
- **Rules:** Never reference Claw Capital, Oracle, or anything linking to Alex's identity

### @0xwondr — Public Crypto Identity
- **Voice:** Thoughtful, framework-oriented. Builder perspective on crypto/DeFi.
- **Style references:** Citrini7 (thesis depth), Dwarkesh (intellectual curiosity)
- **Content:** Thesis threads, building-in-public (crypto tools), macro frameworks, DeFi analysis
- **Frequency target:** 2-4/week, quality over quantity
- **Rules:** Can reference projects, tools, building process. No raw trading calls.

## File Format

Each draft: `{date}_{account}_{slug}.md`

```markdown
# Tweet Draft
**Account:** @alexguuu | @manyfacedchud | @0xwondr
**Type:** single | thread
**Status:** draft | approved | posted | killed
**Source:** [what research triggered this]

---

[tweet text here]

---

**Media:** [chart URLs or file paths if applicable]
**Quote tweet:** [URL if applicable]
**Notes:** [any context for Alex's review]
```

## Daily Generation (Cron: cc-daily-tweets, 9:30 AM EST)
Oracle generates 5-8 tweet suggestions each morning based on:
1. Previous day's conversations and research
2. Overnight market moves / sentinel alerts
3. A-grade source activity (smart money tweets worth riffing on)
4. Building progress / project updates
5. General cultural/tech takes relevant to Alex's brand

## Workflow
1. Oracle drafts (daily batch + ad-hoc after research) → saves here
2. Oracle pings Alex in main session with summary
3. Alex reviews (approve/edit/kill)
4. Alex posts manually (until X posting is enabled)
