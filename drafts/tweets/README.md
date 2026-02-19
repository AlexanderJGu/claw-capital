# Tweet Drafts Queue

Oracle generates tweet candidates after research sessions, smart money scans, and thesis work.
Alex reviews, edits, and approves before posting.

## Accounts

### @manyfacedchud — Anon Trading Account
- **Voice:** Direct, concise, chart-first. No hedging. Conviction calls with levels.
- **Style references:** insomniacxbt, izebel_eth, KillaXBT
- **Content:** Chart + 1-2 line take, structural calls, contrarian positions, market structure observations
- **Frequency target:** 1-3/day when markets are moving
- **Rules:** Never reference Claw Capital, Oracle, or anything linking to Alex's identity

### @0xwondr — Public Identity
- **Voice:** Thoughtful, framework-oriented. Builder perspective.
- **Style references:** Citrini7 (thesis depth), Dwarkesh (intellectual curiosity)
- **Content:** Thesis threads, building-in-public, macro frameworks, prediction market takes
- **Frequency target:** 2-4/week, quality over quantity
- **Rules:** Can reference projects, tools, building process. No raw trading calls.

## File Format

Each draft: `{date}_{account}_{slug}.md`

```markdown
# Tweet Draft
**Account:** @manyfacedchud | @0xwondr
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

## Workflow
1. Oracle drafts after research/scans → saves here
2. Alex reviews (approve/edit/kill)
3. Oracle posts approved drafts (when X posting is enabled) or Alex posts manually
