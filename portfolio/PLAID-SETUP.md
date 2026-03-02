# Plaid Integration Setup

## Prerequisites
- Plaid credentials in `~/.config/env/global.env` (PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV)
- Node.js 18+

## 1. Install & Start Link Server
```bash
cd portfolio/plaid-link-server
npm install
node index.js
```
Server runs at http://localhost:3001

## 2. Connect Accounts
Open http://localhost:3001 in browser (use Tailscale if remote).
Click "Connect Account" and link each brokerage (Schwab, IBKR, Coinbase).
Tokens are stored in `~/.config/env/plaid-tokens.json`.

## 3. Pull Portfolio Data
```bash
cd portfolio
npm install plaid  # if not already installed
node pull-portfolio.js
```
Outputs to `dashboard/data/portfolio.json`.

## 4. View Dashboard
The /portfolio page reads from `dashboard/data/portfolio.json`.
Push to GitHub and Vercel auto-deploys.

## Notes
- Plaid development env uses sandbox-like credentials; for real data, ensure `PLAID_ENV=development` and approved access
- Re-run `pull-portfolio.js` to refresh data (add to cron for automation)
- The link server also needs `dotenv` — install it: `cd plaid-link-server && npm install dotenv`
