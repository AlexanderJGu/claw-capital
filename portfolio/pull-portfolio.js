#!/usr/bin/env node
/**
 * Pull portfolio data from Plaid + Hyperliquid + Onchain → unified portfolio.json
 */
const { Configuration, PlaidApi, PlaidEnvironments } = require("plaid");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Load env
const envPath = path.join(process.env.HOME, ".config/env/global.env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.+)$/);
    if (m) process.env[m[1]] = m[2];
  }
}

const TOKENS_PATH = path.join(process.env.HOME, ".config/env/plaid-tokens.json");
const OUTPUT_PATH = path.join(__dirname, "..", "dashboard", "data", "portfolio.json");
const PORTFOLIO_DIR = __dirname;

// Thesis mapping: ticker → thesis category
const THESIS_MAP = {
  // Defense
  LMT: "defense", RTX: "defense", NOC: "defense", GD: "defense", BA: "defense",
  HII: "defense", LHX: "defense", LDOS: "defense", KTOS: "defense", PLTR: "defense",
  // Photonics / Laser
  LASR: "photonics", IIVI: "photonics", COHR: "photonics", LITE: "photonics", IPGP: "photonics",
  // Nuclear
  CCJ: "nuclear", LEU: "nuclear", SMR: "nuclear", OKLO: "nuclear", NNE: "nuclear",
  UEC: "nuclear", DNN: "nuclear", UUUU: "nuclear",
  // Crypto
  BTC: "crypto", ETH: "crypto", SOL: "crypto", HYPE: "crypto",
  // Infra
  NVDA: "infra", AMD: "infra", AVGO: "infra", TSM: "infra",
};

function getThesis(ticker) {
  if (!ticker) return "other";
  const t = ticker.replace(/[^A-Z]/g, "").toUpperCase();
  return THESIS_MAP[t] || "other";
}

// --- Plaid ---
async function pullPlaid() {
  if (!fs.existsSync(TOKENS_PATH)) { console.log("No Plaid tokens found, skipping."); return []; }
  const tokens = JSON.parse(fs.readFileSync(TOKENS_PATH, "utf-8"));
  if (!tokens.items?.length) return [];

  const config = new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV || "development"],
    baseOptions: { headers: { "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID, "PLAID-SECRET": process.env.PLAID_SECRET } },
  });
  const client = new PlaidApi(config);
  const accounts = [];

  for (const item of tokens.items) {
    try {
      const inv = await client.investmentsHoldingsGet({ access_token: item.access_token });
      const acctMap = {};
      for (const a of inv.data.accounts) {
        acctMap[a.account_id] = {
          name: `${item.institution} ${a.name || a.official_name || ""}`.trim(),
          source: "plaid",
          balance: a.balances.current || 0,
          positions: [],
        };
      }
      const secMap = {};
      for (const s of inv.data.securities) secMap[s.security_id] = s;

      for (const h of inv.data.holdings) {
        const sec = secMap[h.security_id] || {};
        const ticker = sec.ticker_symbol || sec.name || "UNKNOWN";
        const value = h.institution_value || (h.quantity * (h.institution_price || 0));
        const costBasis = h.cost_basis || 0;
        const pnl = costBasis > 0 ? value - costBasis : 0;
        const pnlPct = costBasis > 0 ? Math.round((pnl / costBasis) * 1000) / 10 : 0;
        if (acctMap[h.account_id]) {
          acctMap[h.account_id].positions.push({ ticker, quantity: h.quantity, value: Math.round(value * 100) / 100, costBasis: Math.round(costBasis * 100) / 100, pnl: Math.round(pnl * 100) / 100, pnlPct });
        }
      }
      accounts.push(...Object.values(acctMap));
    } catch (e) {
      console.error(`Plaid error for ${item.institution}:`, e.response?.data?.error_message || e.message);
    }
  }
  return accounts;
}

// --- Hyperliquid ---
function pullHyperliquid() {
  const script = path.join(PORTFOLIO_DIR, "scripts", "hyperliquid.sh");
  if (!fs.existsSync(script)) { console.log("No hyperliquid.sh, skipping."); return null; }
  try {
    const out = execSync(`bash "${script}"`, { timeout: 30000, encoding: "utf-8" });
    const data = JSON.parse(out.trim().split("\n").pop());
    return {
      name: "Hyperliquid",
      source: "hyperliquid",
      balance: data.totalValue || data.balance || 0,
      positions: (data.positions || []).map((p) => ({
        ticker: p.coin || p.ticker || "?",
        quantity: p.size || p.quantity || 0,
        value: p.value || p.notional || 0,
        costBasis: p.costBasis || 0,
        pnl: p.unrealizedPnl || p.pnl || 0,
        pnlPct: p.costBasis ? Math.round(((p.unrealizedPnl || 0) / p.costBasis) * 1000) / 10 : 0,
      })),
    };
  } catch (e) { console.error("Hyperliquid error:", e.message); return null; }
}

// --- Onchain ---
function pullOnchain() {
  const script = path.join(PORTFOLIO_DIR, "onchain.sh");
  if (!fs.existsSync(script)) { console.log("No onchain.sh, skipping."); return null; }
  try {
    const out = execSync(`bash "${script}"`, { timeout: 30000, encoding: "utf-8" });
    const data = JSON.parse(out.trim().split("\n").pop());
    return {
      name: "Onchain",
      source: "onchain",
      balance: data.totalValue || data.balance || 0,
      positions: (data.positions || data.tokens || []).map((p) => ({
        ticker: p.symbol || p.ticker || "?",
        quantity: p.balance || p.quantity || 0,
        value: p.value || 0,
        costBasis: p.costBasis || 0,
        pnl: p.pnl || 0,
        pnlPct: 0,
      })),
    };
  } catch (e) { console.error("Onchain error:", e.message); return null; }
}

async function main() {
  console.log("Pulling portfolio data...");
  const plaidAccounts = await pullPlaid();
  const hlAccount = pullHyperliquid();
  const onchainAccount = pullOnchain();

  const accounts = [...plaidAccounts];
  if (hlAccount) accounts.push(hlAccount);
  if (onchainAccount) accounts.push(onchainAccount);

  // Build summary
  let totalNetWorth = 0, totalEquities = 0, totalCrypto = 0, totalCash = 0;
  const byThesis = {};

  for (const acct of accounts) {
    totalNetWorth += acct.balance;
    for (const pos of acct.positions) {
      const thesis = getThesis(pos.ticker);
      if (thesis === "crypto" || acct.source === "hyperliquid" || acct.source === "onchain") {
        totalCrypto += pos.value;
      } else if (pos.ticker === "CUR:USD" || pos.ticker?.includes("MONEY") || pos.ticker?.includes("SPAXX") || pos.ticker?.includes("SWVXX")) {
        totalCash += pos.value;
      } else {
        totalEquities += pos.value;
      }
      byThesis[thesis] = (byThesis[thesis] || 0) + pos.value;
    }
  }

  const portfolio = {
    lastUpdated: new Date().toISOString(),
    totalNetWorth: Math.round(totalNetWorth * 100) / 100,
    accounts,
    summary: {
      totalEquities: Math.round(totalEquities * 100) / 100,
      totalCrypto: Math.round(totalCrypto * 100) / 100,
      totalCash: Math.round(totalCash * 100) / 100,
      byThesis: Object.fromEntries(Object.entries(byThesis).map(([k, v]) => [k, Math.round(v * 100) / 100])),
    },
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(portfolio, null, 2));
  console.log(`Portfolio written to ${OUTPUT_PATH}`);
  console.log(`Total Net Worth: $${portfolio.totalNetWorth.toLocaleString()}`);
  console.log(`Accounts: ${accounts.length} | Equities: $${portfolio.summary.totalEquities.toLocaleString()} | Crypto: $${portfolio.summary.totalCrypto.toLocaleString()} | Cash: $${portfolio.summary.totalCash.toLocaleString()}`);
}

main().catch(console.error);
